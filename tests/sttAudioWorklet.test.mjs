import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

function createProcessor() {
  const messages = [];
  let Processor;
  class BaseProcessor {
    port = {
      onmessage: null,
      postMessage: (value) => messages.push(value),
    };
  }
  runInNewContext(readFileSync(new URL('../public/stt-audio-worklet.js', import.meta.url), 'utf8'), {
    AudioWorkletProcessor: BaseProcessor,
    registerProcessor: (name, constructor) => {
      assert.equal(name, 'stt-pcm-processor');
      Processor = constructor;
    },
    Int16Array,
    Math,
  });
  return { processor: new Processor(), messages };
}

test('STT worklet encodes signed 16-bit PCM and flushes the final samples', () => {
  const { processor, messages } = createProcessor();
  processor.process([[new Float32Array([-1, -0.5, 0, 0.5, 1])]]);
  assert.equal(messages.length, 0);
  processor.port.onmessage({ data: 'flush' });
  assert.deepEqual([...new Int16Array(messages[0])], [-32768, -16384, 0, 16383, 32767]);
  assert.equal(messages[1], 'flushed');
});

test('STT worklet emits bounded frames before the buffer fills again', () => {
  const { processor, messages } = createProcessor();
  processor.process([[new Float32Array(4096).fill(0.25)]]);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].byteLength, 8192);
  processor.process([[new Float32Array([0.5])]]);
  processor.port.onmessage({ data: 'flush' });
  assert.deepEqual([...new Int16Array(messages[1])], [16383]);
});
