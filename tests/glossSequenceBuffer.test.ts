import test from 'node:test';
import assert from 'node:assert/strict';
import { GlossSequenceBuffer } from '../src/services/glossSequenceBuffer.ts';
import type { VslWordEvent } from '../src/services/vslWord.ts';

const event = (eventId: string, action: string, status: 'FINAL' | 'NO_SIGN' = 'FINAL'): VslWordEvent => ({
  eventId, type: 'VSL_WORD', callId: 42, conversationId: 7,
  status, action, confidence: status === 'FINAL' ? 0.9 : 0.2, processingMs: 1, timestamp: 1,
});

test('deduplicates event IDs and adjacent clips, accepts a repeated gloss after NO_SIGN', () => {
  const buffer = new GlossSequenceBuffer();
  assert.equal(buffer.accept(event('1', 'TÔI')), true);
  assert.equal(buffer.accept(event('1', 'TÔI')), false);
  assert.equal(buffer.accept(event('2', 'TÔI')), false);
  assert.equal(buffer.accept(event('3', 'MUỐN')), true);
  assert.equal(buffer.accept(event('4', '', 'NO_SIGN')), false);
  assert.equal(buffer.accept(event('5', 'MUỐN')), true);
  assert.deepEqual(buffer.rawGlosses, ['TÔI', 'MUỐN', 'MUỐN']);
  assert.equal(buffer.localText, 'Tôi muốn muốn');
});

test('rejects old sequence and old session after a newer session arrives', () => {
  const buffer = new GlossSequenceBuffer();
  const first = { ...event('1', 'TÔI'), sessionId: 'first', sequenceNumber: 1, startedAt: 100 };
  assert.equal(buffer.accept(first), true);
  assert.equal(buffer.accept({ ...event('2', 'MUỐN'), sessionId: 'first', sequenceNumber: 1, startedAt: 100 }), false);
  assert.equal(buffer.accept({ ...event('3', 'NƯỚC'), sessionId: 'second', sequenceNumber: 1, startedAt: 200 }), true);
  assert.equal(buffer.accept({ ...event('4', 'TÔI'), sessionId: 'first', sequenceNumber: 2, startedAt: 150 }), false);
  assert.deepEqual(buffer.rawGlosses, ['NƯỚC']);
});
