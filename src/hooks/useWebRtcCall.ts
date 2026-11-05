import { useCallback, useEffect, useRef, useState } from 'react';
import type { VideoCallRecord } from '../services/videoCallApi';
import { sendWebRtcSignal, subscribeToWebRtcSignals, type WebRtcSignal } from '../services/webrtcSignaling';

export type MediaConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'failed';
type MediaErrorKind = 'permission' | 'signaling' | 'ice' | 'remote-track' | 'media';

function iceServers(): RTCIceServer[] {
  const configured = import.meta.env.VITE_WEBRTC_ICE_SERVERS;
  if (configured) {
    try {
      const parsed: unknown = JSON.parse(configured);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((entry) => entry && typeof entry === 'object'
        && (typeof entry.urls === 'string' || (Array.isArray(entry.urls) && entry.urls.every((url: unknown) => typeof url === 'string')))))
        return parsed as RTCIceServer[];
    } catch { /* Use the safe public STUN fallback. */ }
  }
  return [{ urls: 'stun:stun.l.google.com:19302' }];
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : 'Lỗi WebRTC không xác định.';
}

export function useWebRtcCall(call: VideoCallRecord, selfId: number | undefined, cameraActive: boolean, micActive: boolean) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const videoSenderRef = useRef<RTCRtpSender | null>(null);
  const cameraEnabledRef = useRef(cameraActive);
  const micEnabledRef = useRef(micActive);
  const [state, setState] = useState<MediaConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<MediaErrorKind | null>(null);
  const [remoteVideoReady, setRemoteVideoReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  cameraEnabledRef.current = cameraActive;
  micEnabledRef.current = micActive;

  useEffect(() => { localStreamRef.current?.getVideoTracks().forEach((track) => { track.enabled = cameraActive; }); }, [cameraActive]);
  useEffect(() => { localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = micActive; }); }, [micActive]);

  const switchCamera = useCallback(async () => {
    const current = localStreamRef.current;
    if (!current) return;
    const nextFacing: 'user' | 'environment' = facingMode === 'user' ? 'environment' : 'user';
    let replacement: MediaStream | null = null;
    try {
      replacement = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: nextFacing } }, audio: false });
      const nextTrack = replacement.getVideoTracks()[0];
      if (!nextTrack) throw new Error('Không tìm thấy camera để chuyển đổi.');
      nextTrack.enabled = cameraEnabledRef.current;
      const previous = current.getVideoTracks()[0];
      if (videoSenderRef.current) await videoSenderRef.current.replaceTrack(nextTrack);
      else if (peerConnectionRef.current) videoSenderRef.current = peerConnectionRef.current.addTrack(nextTrack, current);
      if (previous) {
        current.removeTrack(previous);
        previous.stop();
      }
      current.addTrack(nextTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = current;
      setFacingMode(nextFacing);
    } catch (cause) {
      replacement?.getTracks().forEach((track) => track.stop());
      setError(`Không thể đổi camera: ${describeError(cause)}`);
      setErrorKind('media');
    }
  }, [facingMode]);

  useEffect(() => {
    if (call.status !== 'ACCEPTED') {
      setState('idle');
      return;
    }
    const isCaller = selfId === call.callerId;
    const isReceiver = selfId === call.receiverId;
    if (!selfId || (!isCaller && !isReceiver) || !Number.isSafeInteger(call.id)) {
      setState('failed'); setError('Không xác định được người tham gia cuộc gọi.'); setErrorKind('signaling'); return;
    }

    let disposed = false;
    let signalingOnline = false;
    let unsubscribe: (() => void) | null = null;
    let readyTimer: ReturnType<typeof setInterval> | null = null;
    let remoteTrackTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let signalingTimer: ReturnType<typeof setTimeout> | null = null;
    let offerInProgress = false;
    let localDescriptionPublished = false;
    let incoming = Promise.resolve();
    const remoteIce: RTCIceCandidateInit[] = [];
    const localIce: RTCIceCandidateInit[] = [];
    let hasRemoteVideo = false;
    let pc: RTCPeerConnection | null = null;
    const peerId = isCaller ? call.receiverId : call.callerId;
    setState('connecting'); setError(null); setErrorKind(null); setRemoteVideoReady(false);

    const send = (type: Parameters<typeof sendWebRtcSignal>[1], payload: Record<string, unknown>) =>
      !disposed && call.status === 'ACCEPTED' && pc?.signalingState !== 'closed'
      && signalingOnline && sendWebRtcSignal(call.id, type, payload);

    const stop = () => {
      if (disposed) return;
      disposed = true;
      if (readyTimer) clearInterval(readyTimer);
      if (remoteTrackTimer) clearTimeout(remoteTrackTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (signalingTimer) clearTimeout(signalingTimer);
      unsubscribe?.();
      if (pc) {
        pc.ontrack = null; pc.onicecandidate = null; pc.onconnectionstatechange = null; pc.oniceconnectionstatechange = null;
        pc.close();
      }
      if (peerConnectionRef.current === pc) peerConnectionRef.current = null;
      videoSenderRef.current = null;
      localStreamRef.current?.getTracks().forEach((track) => track.stop()); localStreamRef.current = null;
      remoteStreamRef.current?.getTracks().forEach((track) => { track.onended = null; track.stop(); }); remoteStreamRef.current = null;
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      localIce.length = 0; remoteIce.length = 0;
    };

    const fail = (message: string, kind: MediaErrorKind) => {
      if (disposed) return;
      stop(); setState('failed'); setError(message); setErrorKind(kind); setRemoteVideoReady(false);
    };

    const flushLocalIce = () => {
      while (localIce.length && !disposed && signalingOnline) {
        if (!send('WEBRTC_ICE_CANDIDATE', localIce[0] as Record<string, unknown>)) break;
        localIce.shift();
      }
    };
    const queueLocalIce = (candidate: RTCIceCandidateInit) => { if (localIce.length < 256) localIce.push(candidate); };
    const applyRemoteIce = async (connection: RTCPeerConnection) => {
      while (remoteIce.length && connection.remoteDescription && !disposed) {
        const candidate = remoteIce.shift()!;
        try { await connection.addIceCandidate(candidate); }
        catch (cause) {
          if (candidate.candidate && !disposed) {
            // A stale/invalid candidate should not tear down a valid peer connection.
            setError(`Bỏ qua ICE candidate không hợp lệ: ${describeError(cause)}`);
            setErrorKind('ice');
          }
        }
      }
    };
    const announceReady = () => {
      if (isReceiver && pc && !pc.remoteDescription && signalingOnline && !disposed) send('WEBRTC_READY', {});
    };
    const publishDescriptionThenIce = (type: 'WEBRTC_OFFER' | 'WEBRTC_ANSWER') => {
      if (!pc?.localDescription || disposed) return;
      const sent = send(type, { type: pc.localDescription.type, sdp: pc.localDescription.sdp });
      if (sent) { localDescriptionPublished = true; flushLocalIce(); }
    };

    const handleSignal = async (signal: WebRtcSignal) => {
      const connection = pc;
      if (!connection || disposed || connection.signalingState === 'closed') return;
      if (signal.type === 'WEBRTC_READY' && isCaller) {
        if (connection.remoteDescription || offerInProgress) return;
        offerInProgress = true;
        try {
          if (!connection.localDescription) {
            // Both audio and video senders are present before SDP is created.
            const offer = await connection.createOffer();
            if (disposed) return;
            await connection.setLocalDescription(offer);
          }
          publishDescriptionThenIce('WEBRTC_OFFER');
        } finally { offerInProgress = false; }
      } else if (signal.type === 'WEBRTC_OFFER' && isReceiver) {
        if (!connection.remoteDescription) {
          await connection.setRemoteDescription({ type: 'offer', sdp: signal.payload.sdp as string });
          await applyRemoteIce(connection);
          if (disposed) return;
          const answer = await connection.createAnswer();
          if (disposed) return;
          await connection.setLocalDescription(answer);
          if (readyTimer) clearInterval(readyTimer);
        }
        publishDescriptionThenIce('WEBRTC_ANSWER');
      } else if (signal.type === 'WEBRTC_ANSWER' && isCaller) {
        if (connection.signalingState === 'have-local-offer' && !connection.remoteDescription) {
          await connection.setRemoteDescription({ type: 'answer', sdp: signal.payload.sdp as string });
          await applyRemoteIce(connection);
        }
      } else if (signal.type === 'WEBRTC_ICE_CANDIDATE') {
        const candidate: RTCIceCandidateInit = {
          candidate: signal.payload.candidate as string,
          sdpMid: signal.payload.sdpMid as string | null,
          sdpMLineIndex: signal.payload.sdpMLineIndex as number | null,
        };
        if (connection.remoteDescription) {
          try { await connection.addIceCandidate(candidate); }
          catch (cause) {
            if (!disposed) { setError(`Bỏ qua ICE candidate không hợp lệ: ${describeError(cause)}`); setErrorKind('ice'); }
          }
        } else if (remoteIce.length < 256) remoteIce.push(candidate);
      }
    };

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Trình duyệt không hỗ trợ camera và micro.');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      if (disposed) { stream.getTracks().forEach((track) => track.stop()); return; }
      localStreamRef.current = stream;
      stream.getVideoTracks().forEach((track) => { track.enabled = cameraEnabledRef.current; });
      stream.getAudioTracks().forEach((track) => { track.enabled = micEnabledRef.current; });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      pc = new RTCPeerConnection({ iceServers: iceServers() });
      peerConnectionRef.current = pc;
      const connection = pc;
      const remoteStream = new MediaStream(); remoteStreamRef.current = remoteStream;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      connection.ontrack = (event) => {
        if (disposed) return;
        const tracks = event.streams[0]?.getTracks() ?? [event.track];
        tracks.forEach((track) => { if (!remoteStream.getTracks().some((existing) => existing.id === track.id)) remoteStream.addTrack(track); });
        if (event.track.kind === 'video') {
          hasRemoteVideo = true; setRemoteVideoReady(true); if (remoteTrackTimer) clearTimeout(remoteTrackTimer);
        }
        event.track.onended = () => { if (!disposed && event.track.kind === 'video') setRemoteVideoReady(false); };
        const video = remoteVideoRef.current;
        if (video && video.srcObject !== remoteStream) video.srcObject = remoteStream;
        void video?.play().catch(() => {});
      };
      connection.onicecandidate = (event) => {
        if (disposed || !event.candidate) return;
        // Publish SDP first; backend accepts signaling only after call setup, and early ICE can
        // otherwise overtake the offer/answer and be rejected as a non-active call signal.
        queueLocalIce(event.candidate.toJSON());
        if (connection.localDescription && localDescriptionPublished) flushLocalIce();
      };
      connection.onconnectionstatechange = () => {
        if (disposed) return;
        if (connection.connectionState === 'connected') {
          setState('connected');
          if (!hasRemoteVideo && !remoteTrackTimer) remoteTrackTimer = setTimeout(() => {
            if (!disposed && !hasRemoteVideo) { setError('Đã thiết lập ICE nhưng chưa nhận được video từ người bên kia.'); setErrorKind('remote-track'); }
          }, 12_000);
        } else if (connection.connectionState === 'failed') fail('ICE thất bại. Hãy kiểm tra TURN, NAT/firewall và kết nối mạng.', 'ice');
        else if (connection.connectionState === 'disconnected') {
          setState('disconnected');
          if (reconnectTimer) clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(() => {
            if (!disposed && connection.connectionState === 'disconnected') fail('Kết nối ICE không thể tự phục hồi.', 'ice');
          }, 10_000);
        } else if (connection.connectionState === 'connecting' || connection.connectionState === 'new') setState('connecting');
      };
      connection.oniceconnectionstatechange = () => {
        if (!disposed && connection.iceConnectionState === 'failed') fail('ICE thất bại. Máy chủ TURN có thể chưa được cấu hình hoặc không truy cập được.', 'ice');
        else if (connection.iceConnectionState === 'connected' || connection.iceConnectionState === 'completed') {
          if (reconnectTimer) clearTimeout(reconnectTimer);
        }
      };
      stream.getTracks().forEach((track) => {
        const sender = connection.addTrack(track, stream);
        if (track.kind === 'video') videoSenderRef.current = sender;
      });

      unsubscribe = subscribeToWebRtcSignals(call.id, peerId, selfId!, (signal) => {
        incoming = incoming.then(() => handleSignal(signal)).catch((cause) => {
          if (disposed) return;
          const candidateError = describeError(cause);
          fail(`Trao đổi signaling WebRTC thất bại: ${candidateError}`, 'signaling');
        });
      }, (signalState) => {
        if (disposed) return;
        const wasOnline = signalingOnline;
        signalingOnline = signalState === 'online';
        if (!signalingOnline && wasOnline) {
          setError('Mất kết nối signaling; đang chờ kết nối lại.'); setErrorKind('signaling');
          if (signalingTimer) clearTimeout(signalingTimer);
          signalingTimer = setTimeout(() => {
            if (!disposed && !signalingOnline) fail('Signaling không thể kết nối lại.', 'signaling');
          }, 20_000);
        }
        if (signalingOnline) {
          if (signalingTimer) clearTimeout(signalingTimer);
          setError((current) => current?.startsWith('Mất kết nối signaling') ? null : current);
          queueMicrotask(() => {
            if (disposed) return;
            announceReady();
            if (isCaller && pc?.localDescription?.type === 'offer' && !pc.remoteDescription) publishDescriptionThenIce('WEBRTC_OFFER');
            if (isReceiver && pc?.localDescription?.type === 'answer' && pc.connectionState !== 'connected') publishDescriptionThenIce('WEBRTC_ANSWER');
            flushLocalIce();
          });
        }
      });
      if (isReceiver) readyTimer = setInterval(announceReady, 2000);
    };

    void Promise.resolve().then(() => { if (!disposed) return start(); }).catch((cause: unknown) => {
      fail(cause instanceof Error && (cause.name === 'NotAllowedError' || cause.name === 'PermissionDeniedError')
        ? 'Bị từ chối quyền camera hoặc micro. Hãy cấp quyền trong trình duyệt rồi thử lại.'
        : cause instanceof Error && cause.name === 'NotFoundError' ? 'Không tìm thấy camera hoặc micro trên thiết bị.'
        : `Không thể mở camera/micro: ${describeError(cause)}`,
      cause instanceof Error && ['NotAllowedError', 'PermissionDeniedError', 'NotFoundError'].includes(cause.name) ? 'permission' : 'media');
    });
    return stop;
  }, [call.id, call.status, call.callerId, call.receiverId, selfId]);

  return { localVideoRef, remoteVideoRef, localStreamRef, remoteStreamRef, peerConnectionRef,
    state, error, errorKind, remoteVideoReady, switchCamera, facingMode };
}
