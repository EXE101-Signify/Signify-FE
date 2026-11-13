import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVslWord, parseVslGap } from '../src/services/vslWord.ts';

const final = {
  eventId: 'vsl-1', type: 'VSL_WORD', callId: 42, conversationId: 7,
  status: 'FINAL', action: 'Nước', confidence: 0.91, processingMs: 400,
  timestamp: 1234,
};

test('accepts a final gloss for the current call', () => {
  assert.equal(parseVslWord(JSON.stringify(final), 42)?.action, 'Nước');
  assert.equal(parseVslWord(JSON.stringify({ ...final, status: 'NO_SIGN', action: '', confidence: 0.2 }), 42)?.status, 'NO_SIGN');
});

test('rejects partial, low confidence, malformed and other call events', () => {
  for (const body of ['not json', JSON.stringify({ ...final, status: 'PARTIAL' }),
    JSON.stringify({ ...final, callId: 43 }), JSON.stringify({ ...final, confidence: 0.2 }),
    JSON.stringify({ ...final, action: '...' })]) {
    assert.equal(parseVslWord(body, 42), null);
  }
});

test('parses a gap only for the matching call', () => {
  const gap = { eventId: 'gap-1', type: 'VSL_GAP', callId: 42, sessionId: 'session-1',
    sequenceNumber: 2, throughSequenceNumber: 3, status: 'RECOGNITION_GAP', timestamp: 1234 };
  assert.equal(parseVslGap(JSON.stringify(gap), 42)?.sequenceNumber, 2);
  assert.equal(parseVslGap(JSON.stringify(gap), 43), null);
});
