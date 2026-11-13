import { apiFetch } from './apiClient';
import type { VslSegmentMeta } from './automaticVslCapture';

export interface VslWordEvent {
  eventId: string;
  type: 'VSL_WORD';
  callId: number;
  conversationId: number;
  status: 'FINAL' | 'NO_SIGN';
  action: string;
  confidence: number;
  processingMs: number | null;
  timestamp: number;
  sessionId?: string | null;
  sequenceNumber?: number | null;
  startedAt?: number | null;
  endedAt?: number | null;
  javaForwardMs?: number | null;
}

export interface VslGapEvent {
  eventId: string;
  type: 'VSL_GAP';
  callId: number;
  sessionId: string;
  sequenceNumber: number;
  throughSequenceNumber: number;
  status: 'RECOGNITION_GAP';
  timestamp: number;
}

export function parseVslWord(body: string, callId: number): VslWordEvent | null {
  try {
    const value = JSON.parse(body) as Partial<VslWordEvent>;
    if (value.type !== 'VSL_WORD' || value.callId !== callId || !['FINAL', 'NO_SIGN'].includes(value.status ?? '')
      || typeof value.eventId !== 'string' || !value.eventId
      || !Number.isSafeInteger(value.conversationId) || Number(value.conversationId) <= 0
      || !Number.isSafeInteger(value.timestamp) || Number(value.timestamp) <= 0
      || typeof value.action !== 'string'
      || typeof value.confidence !== 'number' || !Number.isFinite(value.confidence)
      || value.confidence < 0 || value.confidence > 1
      || (value.sessionId != null && (typeof value.sessionId !== 'string' || !value.sessionId))
      || (value.sequenceNumber != null && (!Number.isSafeInteger(value.sequenceNumber) || value.sequenceNumber <= 0))
      || (value.startedAt != null && (!Number.isSafeInteger(value.startedAt) || value.startedAt <= 0))
      || (value.status === 'FINAL' && (!value.action || value.action === '...' || value.confidence < 0.8))
      || (value.status === 'NO_SIGN' && value.action !== '')) return null;
    return value as VslWordEvent;
  } catch { return null; }
}

export function parseVslGap(body: string, callId: number): VslGapEvent | null {
  try {
    const value = JSON.parse(body) as Partial<VslGapEvent>;
    if (value.type !== 'VSL_GAP' || value.callId !== callId || value.status !== 'RECOGNITION_GAP'
      || typeof value.eventId !== 'string' || !value.eventId
      || typeof value.sessionId !== 'string' || !value.sessionId
      || !Number.isSafeInteger(value.sequenceNumber) || Number(value.sequenceNumber) <= 0
      || !Number.isSafeInteger(value.throughSequenceNumber)
      || Number(value.throughSequenceNumber) < Number(value.sequenceNumber)
      || !Number.isSafeInteger(value.timestamp) || Number(value.timestamp) <= 0) return null;
    return value as VslGapEvent;
  } catch { return null; }
}

export async function sendVslClip(callId: number, clip: Blob, signal: AbortSignal, meta?: VslSegmentMeta): Promise<VslWordEvent> {
  const form = new FormData();
  form.append('file', clip, 'clip.webm');
  if (meta) {
    form.append('sessionId', meta.sessionId);
    form.append('sequenceNumber', String(meta.sequenceNumber));
    form.append('startedAt', String(meta.startedAt));
    form.append('endedAt', String(meta.endedAt));
  }
  const response = await apiFetch<VslWordEvent>(`/api/calls/${callId}/vsl/clip`, {
    method: 'POST', body: form, signal,
  });
  if (!response.data || response.data.callId !== callId || response.data.type !== 'VSL_WORD')
    throw new Error('Phản hồi VSL không hợp lệ.');
  return response.data;
}
