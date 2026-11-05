import { apiFetch } from './apiClient';
import type { AiPredictionEvent } from './aiPrediction';

export async function sendAiFrame(callId: number, image: Blob, signal: AbortSignal): Promise<AiPredictionEvent | null> {
  const form = new FormData();
  form.append('image', image, 'frame.jpg');
  const started = performance.now();
  let outcome = 'success';
  try {
    const response = await apiFetch<AiPredictionEvent>(`/api/calls/${callId}/predictions`, {
      method: 'POST',
      body: form,
      signal,
    });
    if (response.status === 204) return null;
    const prediction = response.data;
    if (!prediction || prediction.type !== 'AI_SIGN_PREDICTION' || prediction.callId !== callId
      || !/^[A-Z]$/.test(prediction.letter)
      || typeof prediction.confidence !== 'number' || !Number.isFinite(prediction.confidence)
      || prediction.confidence < 0 || prediction.confidence > 1) {
      throw new Error('Phản hồi nhận diện không hợp lệ.');
    }
    return prediction;
  } catch (error) {
    outcome = signal.aborted ? 'aborted' : 'error';
    throw error;
  } finally {
    if (import.meta.env.DEV) {
      console.debug(`[AI] frame_request duration_ms=${(performance.now() - started).toFixed(1)} blob_bytes=${image.size} outcome=${outcome}`);
    }
  }
}
