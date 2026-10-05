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
  const [state, setState] = useState<MediaConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [remoteVideoReady, setRemoteVideoReady] = useState(false);

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
    let incoming = Promise.resolve();
    const remoteIce: RTCIceCandidateInit[] = [];
    const localIce: RTCIceCandidateInit[] = [];
    const peerId = isCaller ? call.receiverId : call.callerId;
    setState('connecting');
    setError(null);
    setRemoteVideoReady(false);

    const send = (type: Parameters<typeof sendWebRtcSignal>[1], payload: Record<string, unknown>) =>
      !disposed && signalingOnline && sendWebRtcSignal(call.id, type, payload);

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
      remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
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
        const candidate = localIce[0];
        if (!send('WEBRTC_ICE_CANDIDATE', candidate as Record<string, unknown>)) break;
        localIce.shift();
      }
    };

    const applyRemoteIce = async (pc: RTCPeerConnection) => {
      while (remoteIce.length && pc.remoteDescription && !disposed) {
        await pc.addIceCandidate(remoteIce.shift());
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
          if (!disposed && pc.localDescription?.type === 'offer')
            send('WEBRTC_OFFER', { type: 'offer', sdp: pc.localDescription.sdp });
          flushLocalIce();
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
        if (!disposed && pc.localDescription?.type === 'answer')
          send('WEBRTC_ANSWER', { type: 'answer', sdp: pc.localDescription.sdp });
        flushLocalIce();
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
        if (pc.remoteDescription) await pc.addIceCandidate(candidate);
        else remoteIce.push(candidate);
      }
    };

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Trình duyệt không hỗ trợ camera và micro.');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (disposed) { stream.getTracks().forEach((track) => track.stop()); return; }
      localStreamRef.current = stream;
      stream.getVideoTracks().forEach((track) => { track.enabled = cameraActive; });
      stream.getAudioTracks().forEach((track) => { track.enabled = micActive; });
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
      };
      pc.onicecandidate = (event) => {
        if (disposed || !event.candidate) return;
        const candidate = event.candidate.toJSON();
        if (!send('WEBRTC_ICE_CANDIDATE', candidate as Record<string, unknown>)) {
          if (localIce.length < 256) localIce.push(candidate);
        }
      };
      pc.onconnectionstatechange = () => {
        if (disposed) return;
        if (pc.connectionState === 'connected') setState('connected');
        else if (pc.connectionState === 'failed') fail('Kết nối WebRTC thất bại.');
        else if (pc.connectionState === 'disconnected' || pc.connectionState === 'closed') setState('disconnected');
        else setState('connecting');
      };
      pc.oniceconnectionstatechange = () => {
        if (!disposed && pc.iceConnectionState === 'failed') fail('Không thể kết nối media giữa hai người dùng.');
      };
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      unsubscribe = subscribeToWebRtcSignals(call.id, peerId, selfId!, (signal) => {
        incoming = incoming.then(() => handleSignal(signal)).catch(() => fail('Trao đổi tín hiệu WebRTC thất bại.'));
      }, (signalState) => {
        if (disposed) return;
        signalingOnline = signalState === 'online';
        if (signalingOnline) {
          queueMicrotask(() => { announceReady(); flushLocalIce(); });
        }
      });
      if (isReceiver) readyTimer = setInterval(announceReady, 2000);
    };

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
