import { parseAiPrediction, type AiPredictionEvent } from './aiPrediction';
import { parseAiTextUpdate, type AiTextUpdateEvent } from './aiTextUpdate';
import { subscribeToStomp, type StompConnectionState } from './stompConnection';

export type AiConnectionState = StompConnectionState;

export function subscribeToAiCallEvents(
  callId: number,
  onPrediction: (prediction: AiPredictionEvent) => void,
  onTextUpdate: (update: AiTextUpdateEvent) => void,
  onStateChange: (state: AiConnectionState) => void,
): () => void {
  if (!Number.isSafeInteger(callId) || callId <= 0) return () => {};
  return subscribeToStomp(`/user/queue/calls/${callId}`, (body) => {
    const prediction = parseAiPrediction(body, callId);
    if (prediction) {
      onPrediction(prediction);
      return;
    }
    const update = parseAiTextUpdate(body, callId);
    if (update) onTextUpdate(update);
  }, onStateChange);
}
