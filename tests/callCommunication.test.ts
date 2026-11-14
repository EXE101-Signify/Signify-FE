import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRecognitionModeUpdate } from '../src/services/aiRecognitionMode';
import { parseCallSpeechEvent } from '../src/services/callSpeech';

test('recognition mode event belongs to the active call and contains a known mode', () => {
  const event = JSON.stringify({ type: 'AI_RECOGNITION_MODE', callId: 42, mode: 'VSL_WORDS', timestamp: 1234 });
  assert.equal(parseRecognitionModeUpdate(event, 42)?.mode, 'VSL_WORDS');
  assert.equal(parseRecognitionModeUpdate(event, 43), null);
  assert.equal(parseRecognitionModeUpdate(event.replace('VSL_WORDS', 'UNKNOWN'), 42), null);
});

test('speech transcript event rejects blank text and another call', () => {
  const event = { eventId: 'speech-1', type: 'CALL_SPEECH_TRANSCRIPT', callId: 42,
    speakerId: 10, text: 'Xin chào', timestamp: 1234 };
  assert.equal(parseCallSpeechEvent(JSON.stringify(event), 42)?.text, 'Xin chào');
  assert.equal(parseCallSpeechEvent(JSON.stringify(event), 43), null);
  assert.equal(parseCallSpeechEvent(JSON.stringify({ ...event, text: '   ' }), 42), null);
});
