import { useEffect, useRef, useState } from 'react';
import type { VideoCallRecord } from '../services/videoCallApi';
import { sendWebRtcSignal, subscribeToWebRtcSignals, type WebRtcSignal } from '../services/webrtcSignaling';

export type MediaConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'failed';

function iceServers(): RTCIceServer[] {
  const configured = import.meta.env.VITE_WEBRTC_ICE_SERVERS;
  if (!configured) return [{ urls: 'stun:stun.l.google.com:19302' }];
  try {
    const parsed: unknown = JSON.parse(configured);
    if (Array.isArray(parsed) && parsed.every((entry) => entry && typeof entry === 'object'
      && (typeof entry.urls === 'string' || (Array.isArray(entry.urls) && entry.urls.every((url: unknown) => typeof url === 'string')))))
      return parsed as RTCIceServer[];
  } catch { /* Invalid configuration falls back to public STUN. */ }
  return [{ urls: 'stun:stun.l.google.com:19302' }];
}

export function useWebRtcCall(call: VideoCallRecord, selfId: number | undefined, cameraActive: boolean, micActive: boolean) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const cameraEnabledRef = useRef(cameraActive);
  const micEnabledRef = useRef(micActive);
  const [state, setState] = useState<MediaConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [remoteVideoReady, setRemoteVideoReady] = useState(false);

  cameraEnabledRef.current = cameraActive;
  micEnabledRef.current = micActive;

  useEffect(() => {
    localStreamRef.current?.getVideoTracks().forEach((track) => { track.enabled = cameraActive; });
  }, [cameraActive]);

  useEffect(() => {
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = micActive; });
  }, [micActive]);

  useEffect(() => {
    if (call.status !== 'ACCEPTED') {
      setState('idle');
      return;
    }
    const isCaller = selfId === call.callerId;
    const isReceiver = selfId === call.receiverId;
    if (!selfId || (!isCaller && !isReceiver) || !Number.isSafeInteger(call.id)) {
      setState('failed');
      setError('Không xác định được người tham gia cuộc gọi.');
      return;
    }

    let disposed = false;
    let signalingOnline = false;
    let unsubscribe: (() => void) | null = null;
    let readyTimer: ReturnType<typeof setInterval> | null = null;
    let offerInProgress = false;
    let localDescriptionPublished = false;
    let incoming = Promise.resolve();
    const remoteIce: RTCIceCandidateInit[] = [];
    const localIce: RTCIceCandidateInit[] = [];
    const peerId = isCaller ? call.receiverId : call.callerId;
    setState('connecting');
    setError(null);
    setRemoteVideoReady(false);

    const send = (type: Parameters<typeof sendWebRtcSignal>[1], payload: Record<string, unknown>) =>
      !disposed && call.status === 'ACCEPTED' && peerConnectionRef.current?.signalingState !== 'closed'
      && signalingOnline && sendWebRtcSignal(call.id, type, payload);

    const stop = () => {
      if (disposed) return;
      disposed = true;
      if (readyTimer) clearInterval(readyTimer);
      unsubscribe?.();
      const pc = peerConnectionRef.current;
      if (pc) {
        pc.ontrack = null;
        pc.onicecandidate = null;
        pc.onconnectionstatechange = null;
        pc.oniceconnectionstatechange = null;
        pc.close();
        peerConnectionRef.current = null;
      }
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      remoteStreamRef.current?.getTracks().forEach((track) => {
        track.onended = null;
        track.stop();
      });
      remoteStreamRef.current = null;
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    };

    const fail = (message: string) => {
      if (disposed) return;
      stop();
      setState('failed');
      setError(message);
      setRemoteVideoReady(false);
    };

    const flushLocalIce = () => {
      while (localIce.length && signalingOnline && !disposed) {
        if (!send('WEBRTC_ICE_CANDIDATE', localIce[0] as Record<string, unknown>)) break;
        localIce.shift();
      }
    };

    const applyRemoteIce = async (pc: RTCPeerConnection) => {
      while (remoteIce.length && pc.remoteDescription && !disposed) {
        const candidate = remoteIce.shift()!;
        try { await pc.addIceCandidate(candidate); }
        catch (cause) {
          // One stale candidate must not destroy the whole peer connection.
          console.warn('[WebRTC] Ignoring invalid queued ICE candidate', cause);
        }
      }
    };

    const publishDescriptionThenIce = (type: 'WEBRTC_OFFER' | 'WEBRTC_ANSWER') => {
      const pc = peerConnectionRef.current;
      if (!pc?.localDescription || disposed) return;
      const sent = send(type, { type: pc.localDescription.type, sdp: pc.localDescription.sdp });
      if (sent) {
        localDescriptionPublished = true;
        flushLocalIce();
      }
    };

    const announceReady = () => {
      const pc = peerConnectionRef.current;
      if (isReceiver && pc && !pc.remoteDescription && signalingOnline && !disposed)
        send('WEBRTC_READY', {});
    };

    const handleSignal = async (signal: WebRtcSignal) => {
      const pc = peerConnectionRef.current;
      if (!pc || disposed) return;
      if (signal.type === 'WEBRTC_READY' && isCaller) {
        if (pc.remoteDescription || offerInProgress) return;
        offerInProgress = true;
        try {
          if (!pc.localDescription) {
            const offer = await pc.createOffer();
            if (disposed) return;
            await pc.setLocalDescription(offer);
          }
          publishDescriptionThenIce('WEBRTC_OFFER');
        } finally {
          offerInProgress = false;
        }
      } else if (signal.type === 'WEBRTC_OFFER' && isReceiver) {
        if (!pc.remoteDescription) {
          await pc.setRemoteDescription({ type: 'offer', sdp: signal.payload.sdp as string });
          await applyRemoteIce(pc);
          const answer = await pc.createAnswer();
          if (disposed) return;
          await pc.setLocalDescription(answer);
          if (readyTimer) clearInterval(readyTimer);
        }
        publishDescriptionThenIce('WEBRTC_ANSWER');
      } else if (signal.type === 'WEBRTC_ANSWER' && isCaller) {
        if (pc.signalingState === 'have-local-offer' && !pc.remoteDescription) {
          await pc.setRemoteDescription({ type: 'answer', sdp: signal.payload.sdp as string });
          await applyRemoteIce(pc);
        }
      } else if (signal.type === 'WEBRTC_ICE_CANDIDATE') {
        const candidate: RTCIceCandidateInit = {
          candidate: signal.payload.candidate as string,
          sdpMid: signal.payload.sdpMid as string | null,
          sdpMLineIndex: signal.payload.sdpMLineIndex as number | null,
        };
        if (pc.remoteDescription) {
          try { await pc.addIceCandidate(candidate); }
          catch (cause) { console.warn('[WebRTC] Ignoring invalid ICE candidate', cause); }
        }
        else if (remoteIce.length < 256) remoteIce.push(candidate);
      }
    };

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Trình duyệt không hỗ trợ camera và micro.');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (disposed) { stream.getTracks().forEach((track) => track.stop()); return; }
      localStreamRef.current = stream;
      stream.getVideoTracks().forEach((track) => { track.enabled = cameraEnabledRef.current; });
      stream.getAudioTracks().forEach((track) => { track.enabled = micEnabledRef.current; });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({ iceServers: iceServers() });
      peerConnectionRef.current = pc;
      const remoteStream = new MediaStream();
      remoteStreamRef.current = remoteStream;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      pc.ontrack = (event) => {
        if (disposed || remoteStream.getTracks().some((track) => track.id === event.track.id)) return;
        remoteStream.addTrack(event.track);
        if (event.track.kind === 'video') setRemoteVideoReady(true);
        event.track.onended = () => {
          if (!disposed && event.track.kind === 'video') setRemoteVideoReady(false);
        };
        void remoteVideoRef.current?.play().catch(() => {});
      };
      pc.onicecandidate = (event) => {
        if (disposed || !event.candidate) return;
        const candidate = event.candidate.toJSON();
        // ICE may be generated as soon as setLocalDescription resolves. Wait until
        // the matching offer/answer has been published so the relay sees SDP first.
        if (!localDescriptionPublished || !send('WEBRTC_ICE_CANDIDATE', candidate as Record<string, unknown>)) {
          if (localIce.length < 256) localIce.push(candidate);
        }
      };
      pc.onconnectionstatechange = () => {
        if (disposed) return;
        if (pc.connectionState === 'connected') setState('connected');
        else if (pc.connectionState === 'failed') fail('ICE không tìm được đường truyền media. Nếu đang gọi qua mạng di động hoặc NAT, cần cấu hình TURN; hãy kiểm tra cả mạng và cấu hình ICE.');
        else if (pc.connectionState === 'disconnected' || pc.connectionState === 'closed') setState('disconnected');
        else setState('connecting');
      };
      pc.oniceconnectionstatechange = () => {
        if (!disposed && pc.iceConnectionState === 'failed') fail('ICE thất bại: thiết bị không thiết lập được đường truyền media. STUN mặc định không relay dữ liệu; mạng di động/NAT thường cần TURN.');
      };
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      unsubscribe = subscribeToWebRtcSignals(call.id, peerId, selfId!, (signal) => {
        incoming = incoming.then(() => handleSignal(signal)).catch(() => fail('Trao đổi tín hiệu WebRTC thất bại.'));
      }, (signalState) => {
        if (disposed) return;
        signalingOnline = signalState === 'online';
        if (signalingOnline) {
          // subscribeToStomp reports an existing online socket before subscribing this destination.
          queueMicrotask(() => {
            if (disposed) return;
            announceReady();
            if (isCaller && pc.localDescription?.type === 'offer' && !pc.remoteDescription)
              publishDescriptionThenIce('WEBRTC_OFFER');
            if (isReceiver && pc.localDescription?.type === 'answer' && pc.connectionState !== 'connected')
              publishDescriptionThenIce('WEBRTC_ANSWER');
            flushLocalIce();
          });
        }
      });
      if (isReceiver) readyTimer = setInterval(announceReady, 2000);
    };

    // Deferring acquisition avoids a duplicate permission request during React StrictMode's setup/cleanup replay.
    void Promise.resolve().then(() => { if (!disposed) return start(); }).catch((cause: unknown) => {
      fail(cause instanceof Error && cause.name === 'NotAllowedError'
        ? 'Cần cấp quyền camera và micro để tham gia cuộc gọi.'
        : cause instanceof Error ? cause.message : 'Không thể mở camera và micro.');
    });
    return stop;
  }, [call.id, call.status, call.callerId, call.receiverId, selfId]);

  return { localVideoRef, remoteVideoRef, localStreamRef, remoteStreamRef, peerConnectionRef,
    state, error, remoteVideoReady };
}
