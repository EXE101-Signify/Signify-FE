export interface CallSpeechEvent {
  eventId: string;
  type: 'CALL_SPEECH_TRANSCRIPT';
  callId: number;
  speakerId: number;
  text: string;
  timestamp: number;
}

export function parseCallSpeechEvent(body: string, callId: number): CallSpeechEvent | null {
  try {
    const value = JSON.parse(body) as Partial<CallSpeechEvent>;
    if (value.type !== 'CALL_SPEECH_TRANSCRIPT' || value.callId !== callId
      || !value.eventId || typeof value.eventId !== 'string'
      || !Number.isSafeInteger(value.speakerId) || (value.speakerId ?? 0) <= 0
      || typeof value.text !== 'string' || !value.text.trim() || value.text.length > 2000
      || typeof value.timestamp !== 'number' || !Number.isFinite(value.timestamp)) return null;
    return value as CallSpeechEvent;
  } catch {
    return null;
  }
}

