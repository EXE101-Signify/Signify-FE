import { publishToStomp, subscribeToStomp, type StompConnectionState } from './stompConnection';

export type WebRtcSignalType = 'WEBRTC_READY' | 'WEBRTC_OFFER' | 'WEBRTC_ANSWER' | 'WEBRTC_ICE_CANDIDATE';

export interface WebRtcSignal {
  eventId: string;
  type: WebRtcSignalType;
  callId: number;
  senderId: number;
  receiverId: number;
  payload: Record<string, unknown>;
  timestamp: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function parseWebRtcSignal(body: string, callId: number, peerId: number, selfId: number): WebRtcSignal | null {
  try {
    const value: unknown = JSON.parse(body);
    if (!isRecord(value) || !isRecord(value.payload)) return null;
    if (typeof value.eventId !== 'string' || !value.eventId
      || value.callId !== callId || value.senderId !== peerId || value.receiverId !== selfId
      || !Number.isSafeInteger(value.timestamp) || Number(value.timestamp) <= 0) return null;
    const payload = value.payload;
    if (value.type === 'WEBRTC_READY' && Object.keys(payload).length === 0) return value as unknown as WebRtcSignal;
    if (value.type === 'WEBRTC_OFFER' || value.type === 'WEBRTC_ANSWER') {
      const expected = value.type === 'WEBRTC_OFFER' ? 'offer' : 'answer';
      if (payload.type === expected && typeof payload.sdp === 'string' && payload.sdp.length > 0)
        return value as unknown as WebRtcSignal;
    }
    if (value.type === 'WEBRTC_ICE_CANDIDATE'
      && typeof payload.candidate === 'string' && payload.candidate.length > 0
      && (payload.sdpMid === null || typeof payload.sdpMid === 'string')
      && (payload.sdpMLineIndex === null || (Number.isSafeInteger(payload.sdpMLineIndex) && Number(payload.sdpMLineIndex) >= 0)))
      return value as unknown as WebRtcSignal;
    return null;
  } catch {
    return null;
  }
}

export function sendWebRtcSignal(callId: number, type: WebRtcSignalType, payload: Record<string, unknown>): boolean {
  return publishToStomp(`/app/calls/${callId}/webrtc`, { type, payload });
}

export function subscribeToWebRtcSignals(
  callId: number, peerId: number, selfId: number,
  onSignal: (signal: WebRtcSignal) => void,
  onStateChange: (state: StompConnectionState) => void,
): () => void {
  return subscribeToStomp(`/user/queue/calls/${callId}/webrtc`, (body) => {
    const signal = parseWebRtcSignal(body, callId, peerId, selfId);
    if (signal) onSignal(signal);
  }, onStateChange);
}
