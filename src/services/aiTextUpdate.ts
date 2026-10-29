export interface AiTextUpdateEvent {
  eventId: string;
  type: 'AI_TEXT_UPDATE';
  callId: number;
  conversationId: number;
  text: string;
  timestamp: number;
}

export function parseAiTextUpdate(body: string, currentCallId: number): AiTextUpdateEvent | null {
  try {
    const event: unknown = JSON.parse(body);
    if (typeof event !== 'object' || event === null) return null;
    const value = event as Record<string, unknown>;
    if (value.type !== 'AI_TEXT_UPDATE' || value.callId !== currentCallId) return null;
    if (typeof value.eventId !== 'string' || !value.eventId) return null;
    if (!Number.isSafeInteger(value.conversationId) || Number(value.conversationId) <= 0) return null;
    if (typeof value.text !== 'string' || !/^[A-Z ]*$/.test(value.text)) return null;
    if (!Number.isSafeInteger(value.timestamp) || Number(value.timestamp) <= 0) return null;
    return value as unknown as AiTextUpdateEvent;
  } catch {
    return null;
  }
}
