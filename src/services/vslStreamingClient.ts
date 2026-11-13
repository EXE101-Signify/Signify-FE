import { apiFetch } from './apiClient';

export interface VslSessionTicket {
  sessionId: string;
  token: string;
  expiresAt: number;
  wsUrl: string;
}

export type StreamingState = 'Connecting' | 'Tracking' | 'Recognizing' | 'Error';

interface StreamOptions {
  callId: number;
  videoRef: { current: HTMLVideoElement | null };
  streamRef: { current: MediaStream | null };
  onState: (state: StreamingState) => void;
  onSession: (sessionId: string | null) => void;
  onGap: (reason: string) => void;
  onFailure: () => void;
}

const FRAME_HEADER_BYTES = 17;
const MAX_BUFFERED_BYTES = 512_000;

export function encodeVslFrame(sequence: number, capturedAt: number, jpeg: ArrayBuffer): ArrayBuffer {
  const binary = new ArrayBuffer(FRAME_HEADER_BYTES + jpeg.byteLength);
  const view = new DataView(binary);
  view.setUint8(0, 1);
  view.setUint32(1, sequence, false);
  view.setBigUint64(5, BigInt(capturedAt), false);
  view.setUint32(13, jpeg.byteLength, false);
  new Uint8Array(binary, FRAME_HEADER_BYTES).set(new Uint8Array(jpeg));
  return binary;
}

async function issueSession(callId: number, signal: AbortSignal): Promise<VslSessionTicket> {
  const response = await apiFetch<VslSessionTicket>(`/api/calls/${callId}/vsl/stream-session`, {
    method: 'POST', signal,
  });
  const ticket = response.data;
  if (!ticket || !ticket.sessionId || !ticket.token || !/^wss?:\/\//.test(ticket.wsUrl))
    throw new Error('Invalid VSL streaming session');
  return ticket;
}

export function startVslStreaming({ callId, videoRef, streamRef, onState, onSession, onGap, onFailure }: StreamOptions): () => void {
  let disposed = false;
  let failed = false;
  let ticket: VslSessionTicket | null = null;
  let socket: WebSocket | null = null;
  let sequence = 0;
  let encoding = false;
  let captureTimer: ReturnType<typeof setInterval> | null = null;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let authTimer: ReturnType<typeof setTimeout> | null = null;
  const abort = new AbortController();
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 360;
  const context = canvas.getContext('2d');

  const stop = () => {
    if (disposed) return;
    disposed = true;
    abort.abort();
    if (captureTimer) clearInterval(captureTimer);
    if (pingTimer) clearInterval(pingTimer);
    if (authTimer) clearTimeout(authTimer);
    socket?.close();
    onSession(null);
    if (ticket) void apiFetch(`/api/calls/${callId}/vsl/stream-session/${ticket.sessionId}`, {
      method: 'DELETE',
    }).catch(() => {});
  };
  const fail = () => {
    if (disposed || failed) return;
    failed = true;
    onState('Error');
    stop();
    onFailure();
  };

  if (!context) { fail(); return stop; }
  onState('Connecting');
  const capture = () => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (disposed || encoding || socket?.readyState !== WebSocket.OPEN || !video || !stream
      || video.srcObject !== stream || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
      || !stream.getVideoTracks().some((track) => track.enabled && track.readyState === 'live')) return;
    if (socket.bufferedAmount > MAX_BUFFERED_BYTES) {
      sequence++;
      onGap(`Frame #${sequence}: network backpressure`);
      return;
    }
    encoding = true;
    sequence++;
    const frameSequence = sequence;
    const capturedAt = Date.now();
    try {
      context.drawImage(video, 0, 0, 480, 360);
      canvas.toBlob((blob) => {
        if (disposed) return;
        if (!blob) { onGap(`Frame #${frameSequence}: JPEG encoding failed`); encoding = false; return; }
        void blob.arrayBuffer().then((jpeg) => {
          if (disposed || socket?.readyState !== WebSocket.OPEN) return;
          if (jpeg.byteLength > 200_000 || socket.bufferedAmount > MAX_BUFFERED_BYTES) {
            onGap(`Frame #${frameSequence}: frame limit`);
            return;
          }
          socket.send(encodeVslFrame(frameSequence, capturedAt, jpeg));
        }).catch(() => onGap(`Frame #${frameSequence}: JPEG read failed`))
          .finally(() => { encoding = false; });
      }, 'image/jpeg', 0.6);
    } catch {
      encoding = false;
      onGap(`Frame #${frameSequence}: camera capture failed`);
    }
  };

  void issueSession(callId, abort.signal).then((issued) => {
    if (disposed) return;
    ticket = issued;
    onSession(issued.sessionId);
    socket = new WebSocket(issued.wsUrl);
    socket.onopen = () => {
      if (disposed) return;
      socket?.send(JSON.stringify({ type: 'AUTH', token: issued.token }));
      authTimer = setTimeout(fail, 6000);
    };
    socket.onmessage = (event) => {
      if (disposed || typeof event.data !== 'string') return;
      try {
        const message = JSON.parse(event.data) as { type?: string; sessionId?: string; sequenceNumber?: number };
        if (message.type === 'READY' && message.sessionId === issued.sessionId) {
          if (authTimer) clearTimeout(authTimer);
          onState('Tracking');
          captureTimer = setInterval(capture, 100);
          pingTimer = setInterval(() => {
            if (socket?.readyState === WebSocket.OPEN) socket.send('PING');
          }, 5000);
        } else if (message.type === 'GAP') onGap(`Frame #${message.sequenceNumber ?? '?'}: recognition gap`);
        else if (message.type === 'ERROR') fail();
      } catch { fail(); }
    };
    socket.onerror = fail;
    socket.onclose = fail;
  }).catch(() => { if (!disposed) fail(); });
  return stop;
}
