import { parseAiPrediction, type AiPredictionEvent } from './aiPrediction';
import { parseAiTextUpdate, type AiTextUpdateEvent } from './aiTextUpdate';
import { subscribeToStomp, type StompConnectionState } from './stompConnection';
import { parseVslWord, parseVslGap, type VslWordEvent, type VslGapEvent } from './vslWord';

export type AiConnectionState = StompConnectionState;

export function subscribeToAiCallEvents(
  callId: number,
  onPrediction: (prediction: AiPredictionEvent) => void,
  onTextUpdate: (update: AiTextUpdateEvent) => void,
  onStateChange: (state: AiConnectionState) => void,
  onVslWord?: (event: VslWordEvent) => void,
  onVslGap?: (event: VslGapEvent) => void,
): () => void {
  if (!Number.isSafeInteger(callId) || callId <= 0) return () => {};
  return subscribeToStomp(`/user/queue/calls/${callId}`, (body) => {
    const word = parseVslWord(body, callId);
    if (word) { onVslWord?.(word); return; }
    const gap = parseVslGap(body, callId);
    if (gap) { onVslGap?.(gap); return; }
    const prediction = parseAiPrediction(body, callId);
    if (prediction) {
      onPrediction(prediction);
      return;
    }
    const update = parseAiTextUpdate(body, callId);
    if (update) onTextUpdate(update);
  }, onStateChange);
}
