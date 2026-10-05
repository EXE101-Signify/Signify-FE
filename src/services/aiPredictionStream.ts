import { parseAiPrediction, type AiPredictionEvent } from './aiPrediction';
import { subscribeToStomp, type StompConnectionState } from './stompConnection';

export type AiConnectionState = StompConnectionState;

export function subscribeToAiPredictions(
  callId: number,
  onPrediction: (prediction: AiPredictionEvent) => void,
  onStateChange: (state: AiConnectionState) => void,
): () => void {
  if (!Number.isSafeInteger(callId) || callId <= 0) return () => {};
  return subscribeToStomp(`/user/queue/calls/${callId}`, (body) => {
    const prediction = parseAiPrediction(body, callId);
    if (prediction) onPrediction(prediction);
  }, onStateChange);
}
