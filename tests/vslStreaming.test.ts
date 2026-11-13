import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeVslFrame } from '../src/services/vslStreamingClient.ts';
import { parseVslStreamingEvent } from '../src/services/vslStreamingEvent.ts';

test('binary frame carries version, sequence, capture time and JPEG bytes', () => {
  const jpeg = Uint8Array.from([0xff, 0xd8, 1, 2, 0xff, 0xd9]);
  const bytes = encodeVslFrame(23, 1700000000000, jpeg.buffer);
  const view = new DataView(bytes);
  assert.equal(view.getUint8(0), 1);
  assert.equal(view.getUint32(1, false), 23);
  assert.equal(Number(view.getBigUint64(5, false)), 1700000000000);
  assert.equal(view.getUint32(13, false), jpeg.length);
  assert.deepEqual(Array.from(new Uint8Array(bytes, 17)), Array.from(jpeg));
});

const event = {
  eventId: 'event-1', type: 'VSL_FINAL', status: 'FINAL', callId: 42,
  conversationId: 7, sessionId: 'session-1', sequenceNumber: 23,
  action: 'NƯỚC', confidence: 0.9, processingMs: 25, timestamp: 1700000000000,
};

test('streaming parser accepts scoped FINAL and rejects stale or untrusted shapes', () => {
  assert.equal(parseVslStreamingEvent(JSON.stringify(event), 42)?.action, 'NƯỚC');
  assert.equal(parseVslStreamingEvent(JSON.stringify(event), 43), null);
  assert.equal(parseVslStreamingEvent(JSON.stringify({ ...event, sessionId: '' }), 42), null);
  assert.equal(parseVslStreamingEvent(JSON.stringify({ ...event, confidence: 0.2 }), 42), null);
  assert.equal(parseVslStreamingEvent(JSON.stringify({ ...event, type: 'VSL_PARTIAL' }), 42), null);
});

test('PARTIAL remains distinct from FINAL', () => {
  const partial = { ...event, type: 'VSL_PARTIAL', status: 'PARTIAL' };
  assert.equal(parseVslStreamingEvent(JSON.stringify(partial), 42)?.status, 'PARTIAL');
});
