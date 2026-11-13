export interface VslStreamingEvent {
  eventId: string;
  type: 'VSL_PARTIAL' | 'VSL_FINAL' | 'VSL_NO_SIGN' | 'VSL_GAP' | 'VSL_ERROR';
  status: 'PARTIAL' | 'FINAL' | 'NO_SIGN' | 'GAP' | 'ERROR';
  callId: number;
  conversationId: number;
  sessionId: string;
  sequenceNumber: number;
  action: string;
  confidence: number;
  processingMs: number;
  timestamp: number;
}

export function parseVslStreamingEvent(body: string, callId: number): VslStreamingEvent | null {
  try {
    const event = JSON.parse(body) as Partial<VslStreamingEvent>;
    const statuses = ['PARTIAL', 'FINAL', 'NO_SIGN', 'GAP', 'ERROR'];
    if (!event.status || !statuses.includes(event.status) || event.type !== `VSL_${event.status}`
      || event.callId !== callId || !Number.isSafeInteger(event.conversationId) || Number(event.conversationId) <= 0
      || typeof event.eventId !== 'string' || !event.eventId
      || typeof event.sessionId !== 'string' || !event.sessionId
      || !Number.isSafeInteger(event.sequenceNumber) || Number(event.sequenceNumber) <= 0
      || !Number.isSafeInteger(event.timestamp) || Number(event.timestamp) <= 0
      || typeof event.action !== 'string'
      || typeof event.confidence !== 'number' || !Number.isFinite(event.confidence)
      || event.confidence < 0 || event.confidence > 1
      || typeof event.processingMs !== 'number' || !Number.isFinite(event.processingMs)
      || ((event.status === 'FINAL' || event.status === 'PARTIAL')
        && (!event.action || event.confidence < 0.8))) return null;
    return event as VslStreamingEvent;
  } catch { return null; }
}
