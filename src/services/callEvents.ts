import type { VideoCallRecord, VideoCallStatus } from './videoCallApi';

export interface CallEvent {
  eventId: string;
  type: 'INCOMING_CALL' | 'CALL_STATUS_CHANGED';
  callId: number;
  conversationId: number;
  callerId: number;
  receiverId: number;
  status: VideoCallStatus;
  timestamp: number;
}

const statuses: ReadonlySet<string> = new Set([
  'CALLING', 'ACCEPTED', 'COMPLETED', 'REJECTED', 'MISSED', 'BUSY',
]);

export function isTerminalCallStatus(status: VideoCallStatus): boolean {
  return status === 'COMPLETED' || status === 'REJECTED' || status === 'MISSED' || status === 'BUSY';
}

export function callEventMatchesCall(event: CallEvent, call: CallEvent | VideoCallRecord | null | undefined): boolean {
  return !!call && event.callId === ('callId' in call ? call.callId : call.id)
    && event.conversationId === call.conversationId
    && event.callerId === call.callerId && event.receiverId === call.receiverId;
}

/** Replayed CALLING events must never undo acceptance or a terminal status. */
export function applyCallStatusEvent(call: VideoCallRecord, event: CallEvent | undefined): VideoCallRecord {
  if (!event || !callEventMatchesCall(event, call) || isTerminalCallStatus(call.status)) return call;
  if (call.status === 'ACCEPTED' && event.status === 'CALLING') return call;
  return { ...call, status: event.status };
}

export function canEnterVideoCall(call: VideoCallRecord, userId: number | undefined): boolean {
  if (!userId || isTerminalCallStatus(call.status)) return false;
  return userId === call.callerId || (userId === call.receiverId && call.status === 'ACCEPTED');
}

export function parseCallEvent(body: string, expectedType: CallEvent['type']): CallEvent | null {
  try {
    const parsed: unknown = JSON.parse(body);
    if (!parsed || typeof parsed !== 'object') return null;
    const value = parsed as Record<string, unknown>;
    if (value.type !== expectedType) return null;
    if (typeof value.eventId !== 'string' || !value.eventId) return null;
    for (const field of ['callId', 'conversationId', 'callerId', 'receiverId', 'timestamp'] as const) {
      if (!Number.isSafeInteger(value[field]) || Number(value[field]) <= 0) return null;
    }
    if (typeof value.status !== 'string' || !statuses.has(value.status)) return null;
    if (expectedType === 'INCOMING_CALL' && value.status !== 'CALLING') return null;
    return value as unknown as CallEvent;
  } catch {
    return null;
  }
}
