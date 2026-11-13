import { sendVslClip, type VslWordEvent } from './vslWord';

export type VslCaptureStatus = 'Ready' | 'Recognizing' | 'Processing' | 'No Sign' | 'Error' | 'Recognition Gap';
export interface VslSegmentMeta {
  sessionId: string;
  sequenceNumber: number;
  startedAt: number;
  endedAt: number;
}
export interface VslGap extends VslSegmentMeta {
  reason: 'QUEUE_OVERFLOW' | 'STALE_SEGMENT' | 'CAMERA_OFF' | 'RECORDER_ERROR' | 'CLIP_TOO_LARGE' | 'UPLOAD_FAILED';
}
export interface VslCaptureMetrics {
  recordingMs: number;
  uploadMs: number;
  queueDepth: number;
  droppedSegments: number;
}

const MAX_CLIP_BYTES = 4_500_000;
const MAX_QUEUED_BYTES = 13_500_000;
const MAX_QUEUED_CLIPS = 3;
const MAX_QUEUE_AGE_MS = 15_000;
const REQUEST_TIMEOUT_MS = 70_000;
const OVERLAP_MS = 100;

interface Segment extends VslSegmentMeta { clip: Blob; recordingMs: number; }
interface CaptureOptions {
  callId: number;
  getStream: () => MediaStream | null;
  onStatus: (status: VslCaptureStatus) => void;
  onGap?: (gap: VslGap) => void;
  onResult?: (result: VslWordEvent) => void;
  onMetrics?: (metrics: VslCaptureMetrics) => void;
  clipMs?: number;
  sessionId?: string;
  send?: typeof sendVslClip;
}

// Each recorder produces a self-contained WebM. Start the next recorder before stopping
// the previous one, while uploads drain independently from a bounded FIFO.
export function startAutomaticVslCapture(options: CaptureOptions): () => void {
  const { callId, getStream, onStatus, onGap, onResult, onMetrics, clipMs = 2500, send = sendVslClip } = options;
  const sessionId = options.sessionId ?? crypto.randomUUID();
  const mimeType = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : null;
  if (!mimeType) { onStatus('Error'); return () => {}; }
  let stopped = false;
  let nextSequence = 1;
  let queuedBytes = 0;
  let droppedSegments = 0;
  let uploading = false;
  let request: AbortController | null = null;
  let rotationTimer: ReturnType<typeof setTimeout> | null = null;
  const stopTimers = new Set<ReturnType<typeof setTimeout>>();
  const recorders = new Set<MediaRecorder>();
  const discarded = new WeakSet<MediaRecorder>();
  const queue: Segment[] = [];
  let currentTrack: MediaStreamTrack | null = null;

  const metrics = (recordingMs = 0, uploadMs = 0) => onMetrics?.({ recordingMs, uploadMs,
    queueDepth: queue.length, droppedSegments });
  const gap = (meta: VslSegmentMeta, reason: VslGap['reason']) => {
    droppedSegments++;
    onStatus('Recognition Gap');
    onGap?.({ ...meta, reason });
    metrics();
  };
  const dropOldest = (reason: VslGap['reason']) => {
    const old = queue.shift();
    if (!old) return;
    queuedBytes -= old.clip.size;
    gap(old, reason);
  };
  const enqueue = (segment: Segment) => {
    if (stopped) return;
    if (!segment.clip.size || segment.clip.size > MAX_CLIP_BYTES) {
      gap(segment, 'CLIP_TOO_LARGE');
      return;
    }
    queue.push(segment);
    queuedBytes += segment.clip.size;
    while (queue.length > MAX_QUEUED_CLIPS || queuedBytes > MAX_QUEUED_BYTES) dropOldest('QUEUE_OVERFLOW');
    metrics(segment.recordingMs);
    void pump();
  };
  const pump = async () => {
    if (stopped || uploading) return;
    uploading = true;
    try {
      while (!stopped && queue.length) {
        while (queue.length && Date.now() - queue[0].endedAt > MAX_QUEUE_AGE_MS) dropOldest('STALE_SEGMENT');
        const segment = queue.shift();
        if (!segment) break;
        queuedBytes -= segment.clip.size;
        metrics();
        let delivered = false;
        for (let attempt = 0; attempt < 3 && !stopped && !delivered; attempt++) {
          request = new AbortController();
          const currentRequest = request;
          const timeout = setTimeout(() => currentRequest.abort(), REQUEST_TIMEOUT_MS);
          const began = performance.now();
          try {
            onStatus('Processing');
            const result = await send(callId, segment.clip, currentRequest.signal, segment);
            if (stopped) break;
            delivered = true;
            onResult?.(result);
            onStatus(result.status === 'NO_SIGN' ? 'No Sign' : 'Recognizing');
            metrics(segment.recordingMs, performance.now() - began);
          } catch (error) {
            if (stopped) break;
            const status = (error as { status?: number })?.status;
            if (attempt === 2 || (status && ![429, 500, 502, 503, 504].includes(status))) {
              gap(segment, 'UPLOAD_FAILED');
              break;
            }
            await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
          } finally {
            clearTimeout(timeout);
            if (request === currentRequest) request = null;
          }
        }
      }
    } finally { uploading = false; }
  };

  const stopRecorder = (recorder: MediaRecorder, discard = false) => {
    if (discard) discarded.add(recorder);
    if (recorder.state === 'recording') recorder.stop();
  };
  const startRecorder = (track: MediaStreamTrack): MediaRecorder | null => {
    if (stopped) return null;
    const meta: VslSegmentMeta = { sessionId, sequenceNumber: nextSequence++, startedAt: Date.now(), endedAt: 0 };
    try {
      const recorder = new MediaRecorder(new MediaStream([track]), { mimeType, videoBitsPerSecond: 600_000 });
      const started = performance.now();
      const chunks: Blob[] = [];
      let bytes = 0;
      recorder.ondataavailable = (event) => {
        bytes += event.data.size;
        if (bytes > MAX_CLIP_BYTES) stopRecorder(recorder);
        else if (event.data.size) chunks.push(event.data);
      };
      recorder.onerror = () => stopRecorder(recorder, true);
      recorder.onstop = () => {
        recorders.delete(recorder);
        meta.endedAt = Date.now();
        if (discarded.has(recorder) || stopped) {
          if (!stopped) gap(meta, 'CAMERA_OFF');
          return;
        }
        if (bytes > MAX_CLIP_BYTES) { gap(meta, 'CLIP_TOO_LARGE'); return; }
        enqueue({ ...meta, clip: new Blob(chunks, { type: mimeType }), recordingMs: performance.now() - started });
      };
      recorder.start();
      recorders.add(recorder);
      currentTrack = track;
      onStatus('Recognizing');
      rotationTimer = setTimeout(() => {
        rotationTimer = null;
        const next = getStream()?.getVideoTracks().find((candidate) => candidate.readyState === 'live' && candidate.enabled);
        if (next) {
          const replacement = startRecorder(next);
          if (replacement) {
            const timer = setTimeout(() => { stopTimers.delete(timer); stopRecorder(recorder); }, OVERLAP_MS);
            stopTimers.add(timer);
            return;
          }
        }
        stopRecorder(recorder, !next);
        if (!next) currentTrack = null;
      }, Math.max(1, clipMs - OVERLAP_MS));
      return recorder;
    } catch {
      meta.endedAt = Date.now();
      gap(meta, 'RECORDER_ERROR');
      onStatus('Error');
      return null;
    }
  };

  const monitor = setInterval(() => {
    if (stopped) return;
    const track = getStream()?.getVideoTracks().find((candidate) => candidate.readyState === 'live' && candidate.enabled) ?? null;
    if (track !== currentTrack) {
      if (rotationTimer) { clearTimeout(rotationTimer); rotationTimer = null; }
      for (const recorder of recorders) stopRecorder(recorder, true);
      currentTrack = null;
    }
    if (track && !recorders.size && !rotationTimer) startRecorder(track);
    if (!track) onStatus('Ready');
  }, 200);
  const initialTrack = getStream()?.getVideoTracks().find((track) => track.readyState === 'live' && track.enabled);
  if (initialTrack) startRecorder(initialTrack);

  return () => {
    stopped = true;
    clearInterval(monitor);
    if (rotationTimer) clearTimeout(rotationTimer);
    for (const timer of stopTimers) clearTimeout(timer);
    request?.abort();
    for (const recorder of recorders) stopRecorder(recorder, true);
    queue.length = 0;
    queuedBytes = 0;
  };
}
