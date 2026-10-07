export interface AiPredictionEvent {
  eventId: string;
  type: 'AI_SIGN_PREDICTION';
  conversationId: number;
  callId: number;
  letter: string;
  confidence: number;
  timestamp: number;
}

export function parseAiPrediction(body: string, currentCallId: number): AiPredictionEvent | null {
  try {
    const event: unknown = JSON.parse(body);
    if (typeof event !== 'object' || event === null) return null;
    const value = event as Record<string, unknown>;
    if (value.type !== 'AI_SIGN_PREDICTION' || value.callId !== currentCallId) return null;
    if (typeof value.eventId !== 'string' || !value.eventId) return null;
    if (!Number.isSafeInteger(value.conversationId) || Number(value.conversationId) <= 0) return null;
    if (typeof value.letter !== 'string' || !/^[A-Z]$/.test(value.letter)) return null;
    if (typeof value.confidence !== 'number' || !Number.isFinite(value.confidence) || value.confidence < 0 || value.confidence > 1) return null;
    if (!Number.isSafeInteger(value.timestamp) || Number(value.timestamp) <= 0) return null;
    return value as unknown as AiPredictionEvent;
  } catch {
    return null;
  }
}
