import { useEffect, useState, type RefObject } from 'react';
import { sendAiFrame } from '../services/aiFrameApi';

const FRAME_INTERVAL_MS = 200;
const REQUEST_TIMEOUT_MS = 10000;

interface CaptureOptions {
  callId: number;
  active: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  streamRef: RefObject<MediaStream | null>;
}

export function useAiFrameCapture({ callId, active, videoRef, streamRef }: CaptureOptions) {
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!active || !Number.isSafeInteger(callId) || callId <= 0) return;
    setUnavailable(false);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;

    let disposed = false;
    let inFlight = false;
    let observedStream: MediaStream | null = null;
    let generation = 0;
    let retryAt = 0;
    let controller: AbortController | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const cancelPending = () => {
      generation += 1;
      controller?.abort();
      controller = null;
      if (timeout) clearTimeout(timeout);
      timeout = null;
      inFlight = false;
    };

    const capture = () => {
      const video = videoRef.current;
      const stream = streamRef.current;
      if (stream !== observedStream) {
        cancelPending();
        observedStream = stream;
        retryAt = 0;
      }
      if (disposed || inFlight || Date.now() < retryAt || !video || !stream
        || video.srcObject !== stream || !stream.getVideoTracks().some((track) => track.readyState === 'live' && track.enabled)
        || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) return;

      inFlight = true;
      const captureGeneration = generation;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      try {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        if (import.meta.env.DEV) console.debug('[AI] Frame captured');
        canvas.toBlob((blob) => {
          if (disposed || captureGeneration !== generation) return;
          if (!blob) {
            inFlight = false;
            return;
          }
          controller = new AbortController();
          const requestController = controller;
          const requestTimeout = setTimeout(() => requestController.abort(), REQUEST_TIMEOUT_MS);
          timeout = requestTimeout;
          if (import.meta.env.DEV) console.debug(`[AI] prediction request callId=${callId}`);
          void sendAiFrame(callId, blob, requestController.signal).then((prediction) => {
            if (disposed || captureGeneration !== generation) return;
            setUnavailable(false);
            if (prediction && import.meta.env.DEV) console.debug(`[AI] Accepted letter: ${prediction.letter} ${prediction.confidence.toFixed(2)}`);
          }).catch((error: unknown) => {
            if (disposed || captureGeneration !== generation) return;
            const status = (error as { status?: number })?.status;
            if (status !== 422) setUnavailable(true);
            retryAt = Date.now() + (status === 422 ? 1000 : 3000);
          }).finally(() => {
            clearTimeout(requestTimeout);
            if (timeout === requestTimeout) timeout = null;
            if (captureGeneration === generation) {
              controller = null;
              inFlight = false;
            }
          });
        }, 'image/jpeg', 0.75);
      } catch {
        inFlight = false;
        retryAt = Date.now() + 1000;
      }
    };

    const interval = setInterval(capture, FRAME_INTERVAL_MS);
    return () => {
      disposed = true;
      clearInterval(interval);
      cancelPending();
    };
  }, [active, callId, streamRef, videoRef]);

  return { unavailable: active && unavailable };
}
