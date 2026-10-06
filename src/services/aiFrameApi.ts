import { apiFetch } from './apiClient';
import type { AiPredictionEvent } from './aiPrediction';

export async function sendAiFrame(callId: number, image: Blob, signal: AbortSignal): Promise<AiPredictionEvent> {
  const form = new FormData();
  form.append('image', image, 'frame.jpg');
  const response = await apiFetch<AiPredictionEvent>(`/api/calls/${callId}/predictions`, {
    method: 'POST',
    body: form,
    signal,
  });
  const prediction = response.data;
  if (!prediction || prediction.type !== 'AI_SIGN_PREDICTION' || prediction.callId !== callId
    || !/^[A-Z]$/.test(prediction.letter)
    || typeof prediction.confidence !== 'number' || !Number.isFinite(prediction.confidence)
    || prediction.confidence < 0 || prediction.confidence > 1) {
    throw new Error('Phản hồi nhận diện không hợp lệ.');
  }
  return prediction;
}
