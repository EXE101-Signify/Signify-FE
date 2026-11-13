import test from 'node:test';
import assert from 'node:assert/strict';
import { startAutomaticVslCapture, type VslGap } from '../src/services/automaticVslCapture.ts';
import type { VslWordEvent } from '../src/services/vslWord.ts';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const result: VslWordEvent = { eventId: 'e1', type: 'VSL_WORD', callId: 42, conversationId: 7,
  status: 'FINAL', action: 'NƯỚC', confidence: 0.9, processingMs: 1, timestamp: 1 };

class FakeStream {
  constructor(readonly tracks: Array<{ readyState: string; enabled: boolean }>) {}
  getVideoTracks() { return this.tracks; }
}

class FakeRecorder {
  static instances: FakeRecorder[] = [];
  static failNext = false;
  static isTypeSupported(type: string) { return type === 'video/webm'; }
  state = 'inactive';
  startedAt = 0;
  stoppedAt = 0;
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(readonly stream: FakeStream) {
    if (FakeRecorder.failNext) { FakeRecorder.failNext = false; throw new Error('recorder busy'); }
    FakeRecorder.instances.push(this);
  }
  start() { this.state = 'recording'; this.startedAt = performance.now(); }
  stop() {
    if (this.state !== 'recording') return;
    this.state = 'inactive';
    this.stoppedAt = performance.now();
    this.ondataavailable?.({ data: new Blob(['webm'], { type: 'video/webm' }) });
    this.onstop?.();
  }
}

const originalStream = globalThis.MediaStream;
const originalRecorder = globalThis.MediaRecorder;
function installFakes() {
  FakeRecorder.instances = [];
  FakeRecorder.failNext = false;
  globalThis.MediaStream = FakeStream as unknown as typeof MediaStream;
  globalThis.MediaRecorder = FakeRecorder as unknown as typeof MediaRecorder;
}
function restoreGlobals() {
  globalThis.MediaStream = originalStream;
  globalThis.MediaRecorder = originalRecorder;
}

test('keeps recording during a slow upload with ordered segments and bounded queue', async () => {
  installFakes();
  const track = { readyState: 'live', enabled: true };
  const gaps: VslGap[] = [];
  const uploads: number[] = [];
  let release: (() => void) | undefined;
  const stop = startAutomaticVslCapture({ callId: 42, clipMs: 250, sessionId: 'session-test',
    getStream: () => new FakeStream([track]) as unknown as MediaStream,
    onStatus: () => {}, onGap: (gap) => gaps.push(gap),
    send: async (_callId, clip, _signal, meta) => {
      assert.equal(clip.type, 'video/webm');
      uploads.push(meta!.sequenceNumber);
      await new Promise<void>((resolve) => { release = resolve; });
      return result;
    },
  });
  try {
    await wait(1050);
    assert.equal(uploads.length, 1);
    assert.ok(FakeRecorder.instances.length >= 5);
    assert.ok(FakeRecorder.instances[1].startedAt <= FakeRecorder.instances[0].stoppedAt);
    assert.ok(gaps.some((gap) => gap.reason === 'QUEUE_OVERFLOW'));
    assert.ok(gaps.every((gap) => gap.sessionId === 'session-test'));
    stop();
    release?.();
    const count = FakeRecorder.instances.length;
    await wait(200);
    assert.equal(FakeRecorder.instances.length, count);
  } finally { stop(); restoreGlobals(); }
});

test('stops capture when camera is disabled and aborts an in-flight upload on close', async () => {
  installFakes();
  const track = { readyState: 'live', enabled: true };
  const gaps: VslGap[] = [];
  let signal: AbortSignal | undefined;
  const stop = startAutomaticVslCapture({ callId: 42, clipMs: 250,
    getStream: () => new FakeStream([track]) as unknown as MediaStream,
    onStatus: () => {}, onGap: (gap) => gaps.push(gap),
    send: async (_callId, _clip, requestSignal) => {
      signal = requestSignal;
      return new Promise<VslWordEvent>((_resolve, reject) => {
        requestSignal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
      });
    },
  });
  try {
    await wait(270);
    assert.ok(signal);
    track.enabled = false;
    await wait(220);
    assert.ok(gaps.some((gap) => gap.reason === 'CAMERA_OFF'));
    stop();
    assert.equal(signal?.aborted, true);
  } finally { stop(); restoreGlobals(); }
});

test('retries a temporary upload failure with the same session and sequence', async () => {
  installFakes();
  const track = { readyState: 'live', enabled: true };
  const sequences: number[] = [];
  const sessions: string[] = [];
  const results: VslWordEvent[] = [];
  const stop = startAutomaticVslCapture({ callId: 42, clipMs: 1000, sessionId: 'retry-session',
    getStream: () => new FakeStream([track]) as unknown as MediaStream,
    onStatus: () => {}, onResult: (word) => results.push(word),
    send: async (_callId, _clip, _signal, meta) => {
      sequences.push(meta!.sequenceNumber);
      sessions.push(meta!.sessionId);
      if (sequences.length === 1) throw Object.assign(new Error('busy'), { status: 429 });
      return result;
    },
  });
  try {
    await wait(1650);
    assert.deepEqual(sequences, [1, 1]);
    assert.deepEqual(sessions, ['retry-session', 'retry-session']);
    assert.equal(results.length, 1);
  } finally { stop(); restoreGlobals(); }
});

test('reports recorder startup failure as a recognition gap', async () => {
  installFakes();
  FakeRecorder.failNext = true;
  const gaps: VslGap[] = [];
  const stop = startAutomaticVslCapture({ callId: 42, clipMs: 250,
    getStream: () => new FakeStream([{ readyState: 'live', enabled: true }]) as unknown as MediaStream,
    onStatus: () => {}, onGap: (gap) => gaps.push(gap),
    send: async () => result,
  });
  try {
    assert.equal(gaps[0]?.reason, 'RECORDER_ERROR');
    assert.equal(gaps[0]?.sequenceNumber, 1);
  } finally { stop(); restoreGlobals(); }
});
