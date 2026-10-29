import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAiTextUpdate } from '../src/services/aiTextUpdate.ts';
import { parseAiPrediction } from '../src/services/aiPrediction.ts';

const textEvent = {
  eventId: 'event-1', type: 'AI_TEXT_UPDATE', callId: 42,
  conversationId: 7, text: 'HELLO ', timestamp: 1234,
};

test('parses authoritative text including a trailing space and clear', () => {
  assert.equal(parseAiTextUpdate(JSON.stringify(textEvent), 42)?.text, 'HELLO ');
  assert.equal(parseAiTextUpdate(JSON.stringify({ ...textEvent, text: '' }), 42)?.text, '');
});

test('ignores malformed, unknown, and other-call events safely', () => {
  for (const body of ['not json', '{}', JSON.stringify({ ...textEvent, type: 'UNKNOWN' }),
    JSON.stringify({ ...textEvent, text: 123 }), JSON.stringify({ ...textEvent, callId: 43 })]) {
    assert.equal(parseAiTextUpdate(body, 42), null);
  }
});

test('keeps accepted letter event parser compatible', () => {
  const letter = { eventId: 'event-2', type: 'AI_SIGN_PREDICTION', callId: 42,
    conversationId: 7, letter: 'A', confidence: 0.9, timestamp: 1234 };
  assert.equal(parseAiPrediction(JSON.stringify(letter), 42)?.letter, 'A');
  assert.equal(parseAiTextUpdate(JSON.stringify(letter), 42), null);
  assert.equal(parseAiPrediction(JSON.stringify(textEvent), 42), null);
});
