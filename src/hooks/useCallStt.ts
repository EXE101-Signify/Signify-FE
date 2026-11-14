import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { publishToStomp, subscribeToStomp } from '../services/stompConnection';

interface SttStatus {
  type: 'STT_READY' | 'STT_ERROR' | 'STT_COMPLETED';
  callId: number;
  sessionId: string;
  message: string;
}

interface Session {
  id: string;
  callId: number;
  context: AudioContext;
  source: MediaStreamAudioSourceNode | null;
  node: AudioWorkletNode | null;
  sink: GainNode | null;
  unsubscribe: () => void;
  timeout: ReturnType<typeof setTimeout> | null;
  ping: ReturnType<typeof setInterval> | null;
  rotateTimer: ReturnType<typeof setTimeout> | null;
  rotate: boolean;
  sentStart: boolean;
  stopping: boolean;
}

function parseStatus(body: string, callId: number, sessionId: string): SttStatus | null {
  try {
    const value = JSON.parse(body) as Partial<SttStatus>;
    if (value.callId !== callId || value.sessionId !== sessionId
      || !['STT_READY', 'STT_ERROR', 'STT_COMPLETED'].includes(value.type ?? '')) return null;
    return value as SttStatus;
  } catch { return null; }
}

function pcmBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let index = 0; index < bytes.length; index++) binary += String.fromCharCode(bytes[index]);
  return btoa(binary);
}

export function useCallStt(callId: number, enabled: boolean, streamRef: RefObject<MediaStream | null>) {
  const [supported] = useState(() => typeof window !== 'undefined'
    && typeof AudioContext !== 'undefined' && 'audioWorklet' in AudioContext.prototype);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const cancelRequestedRef = useRef(false);
  const mountedRef = useRef(true);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const cleanup = useCallback((session: Session) => {
    if (sessionRef.current !== session) return;
    sessionRef.current = null;
    if (session.timeout) clearTimeout(session.timeout);
    if (session.ping) clearInterval(session.ping);
    if (session.rotateTimer) clearTimeout(session.rotateTimer);
    session.unsubscribe();
    session.node?.disconnect();
    session.source?.disconnect();
    session.sink?.disconnect();
    void session.context.close().catch(() => {});
    setListening(false);
    setBusy(false);
    setStopping(false);
  }, []);

  const fail = useCallback((session: Session, message: string) => {
    if (sessionRef.current !== session) return;
    setError(message);
    if (session.sentStart) publishToStomp(`/app/calls/${session.callId}/stt`, { type: 'stop', sessionId: session.id });
    cleanup(session);
  }, [cleanup]);

  const start = useCallback(async () => {
    if (!enabledRef.current || !supported || sessionRef.current || !Number.isSafeInteger(callId) || callId <= 0) return;
    const stream = streamRef.current;
    if (!stream?.getAudioTracks().some((track) => track.readyState === 'live' && track.enabled)) {
      setError('Micro chưa sẵn sàng. Vui lòng kiểm tra cuộc gọi.');
      return;
    }
    setError(null);
    setBusy(true);
    setStopping(false);
    cancelRequestedRef.current = false;
    let context: AudioContext | null = null;
    try {
      context = new AudioContext({ sampleRate: 48000 });
      await context.audioWorklet.addModule('/stt-audio-worklet.js');
      if (!enabledRef.current || !mountedRef.current || cancelRequestedRef.current) {
        await context.close();
        setBusy(false);
        return;
      }
      const id = crypto.randomUUID();
      const session: Session = {
        id, callId, context, source: null, node: null, sink: null, unsubscribe: () => {},
        timeout: null, ping: null, rotateTimer: null, rotate: false, sentStart: false, stopping: false,
      };
      sessionRef.current = session;
      const send = (type: string, data?: string) => publishToStomp(`/app/calls/${session.callId}/stt`,
        { type, sessionId: id, ...(data ? { data } : {}) });
      const beginCapture = () => {
        if (sessionRef.current !== session || session.stopping || session.node) return;
        if (session.timeout) clearTimeout(session.timeout);
        try {
          session.source = session.context.createMediaStreamSource(stream);
          session.node = new AudioWorkletNode(session.context, 'stt-pcm-processor');
          session.sink = session.context.createGain();
          session.sink.gain.value = 0;
          session.node.port.onmessage = (event: MessageEvent<ArrayBuffer | string>) => {
            if (sessionRef.current !== session) return;
            if (event.data === 'flushed') {
              if (!send('stop')) fail(session, 'Mất kết nối khi dừng nhận dạng giọng nói.');
            } else if (event.data instanceof ArrayBuffer) {
              // Send the final PCM frame before asking STT to finish the utterance.
              if (!send('audio', pcmBase64(event.data))) fail(session, 'Mất kết nối khi truyền âm thanh.');
            }
          };
          session.source.connect(session.node);
          session.node.connect(session.sink);
          session.sink.connect(session.context.destination);
          void session.context.resume().then(() => {
            if (sessionRef.current === session) { setListening(true); setBusy(false); }
          }).catch(() => fail(session, 'Không thể bật micro để nhận dạng giọng nói.'));
          session.ping = setInterval(() => {
            if (sessionRef.current === session && !session.stopping && !send('ping'))
              fail(session, 'Mất kết nối với máy chủ.');
          }, 15_000);
          // Vietnamese-STT closes sessions after 10 minutes by default.
          session.rotateTimer = setTimeout(() => {
            if (sessionRef.current === session && !session.stopping) {
              session.rotate = true;
              stop();
            }
          }, 8 * 60_000 + 30_000);
        } catch { fail(session, 'Không thể thu âm từ micro của cuộc gọi.'); }
      };
      session.timeout = setTimeout(() => fail(session, 'Dịch vụ nhận dạng giọng nói không phản hồi.'), 20_000);
      session.unsubscribe = subscribeToStomp(`/user/queue/calls/${callId}/stt`, (body) => {
        const status = parseStatus(body, callId, id);
        if (!status || sessionRef.current !== session) return;
        if (status.type === 'STT_READY') beginCapture();
        else if (status.type === 'STT_COMPLETED') {
          const restart = session.rotate && enabledRef.current && mountedRef.current;
          cleanup(session);
          if (restart) queueMicrotask(() => { void start(); });
        }
        else fail(session, status.message || 'Nhận dạng giọng nói thất bại.');
      }, (state) => {
        if (sessionRef.current !== session) return;
        if (state === 'online' && !session.sentStart) {
          queueMicrotask(() => {
            if (sessionRef.current !== session || session.sentStart || session.stopping) return;
            session.sentStart = publishToStomp(`/app/calls/${session.callId}/stt`,
              { type: 'start', sessionId: id, sampleRate: session.context.sampleRate });
            if (!session.sentStart) fail(session, 'Không kết nối được với máy chủ cuộc gọi.');
          });
        } else if (state === 'offline' && session.sentStart)
          fail(session, 'Mất kết nối với máy chủ.');
      });
    } catch {
      if (sessionRef.current) cleanup(sessionRef.current);
      if (context) void context.close().catch(() => {});
      setBusy(false);
      setError('Không thể khởi tạo bộ thu âm. Vui lòng thử lại.');
    }
  }, [callId, cleanup, fail, streamRef, supported]);

  const stop = useCallback(() => {
    const session = sessionRef.current;
    if (!session) {
      if (busy) { cancelRequestedRef.current = true; setBusy(false); }
      return;
    }
    if (session.stopping) return;
    session.stopping = true;
    setListening(false);
    setBusy(true);
    setStopping(true);
    if (session.ping) clearInterval(session.ping);
    if (session.node) session.node.port.postMessage('flush');
    else if (session.sentStart) publishToStomp(`/app/calls/${session.callId}/stt`, { type: 'stop', sessionId: session.id });
    else cleanup(session);
    if (sessionRef.current === session) {
      if (session.timeout) clearTimeout(session.timeout);
      session.timeout = setTimeout(() => fail(session, 'Dịch vụ nhận dạng giọng nói không hoàn tất.'), 15_000);
    }
  }, [busy, cleanup, fail]);

  useEffect(() => { if (!enabled) stop(); }, [enabled, stop]);
  useEffect(() => () => {
    const session = sessionRef.current;
    if (session) cleanup(session);
  }, [callId, cleanup]);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  return { supported, listening, busy, stopping, error, start, stop };
}
