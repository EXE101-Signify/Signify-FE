import type { AiPredictionEvent } from './aiPrediction';

const aiBaseUrl = (import.meta.env.VITE_AI_BASE_URL?.trim() || 'http://localhost:8000').replace(/\/$/, '');

export interface AiFrameResponse {
  letter: string;
  confidence: number;
  timestamp: number;
  accepted: boolean;
  event: AiPredictionEvent | null;
}

export async function sendAiFrame(callId: number, image: Blob, signal: AbortSignal): Promise<AiFrameResponse | null> {
  const form = new FormData();
  form.append('image', image, 'frame.jpg');
  // Local MVP path: send the frame directly to the Python inference service.
  // callId is intentionally unused by the Python API, but remains in the
  // function signature so the capture hook does not need a separate path.
  void callId;
  const rawResponse = await fetch(`${aiBaseUrl}/api/v1/predict`, {
    method: 'POST',
    headers: { 'X-MVP-Direct': 'true' },
    body: form,
    signal,
  });
  let body: unknown = null;
  try { body = await rawResponse.json(); } catch { /* handled below */ }
  if (rawResponse.status === 422) {
    const error = new Error('AI chưa nhận diện được bàn tay hoặc confidence thấp.') as Error & { status?: number };
    error.status = rawResponse.status;
    throw error;
  }
  if (!rawResponse.ok) {
    const error = new Error('AI không thể xử lý ảnh.') as Error & { status?: number };
    error.status = rawResponse.status;
    throw error;
  }
  const prediction = body as Partial<AiFrameResponse> | null;
  if (!prediction || !/^[A-Z]$/.test(prediction.letter)
    || typeof prediction.confidence !== 'number' || !Number.isFinite(prediction.confidence)
    || prediction.confidence < 0 || prediction.confidence > 1
    || !Number.isSafeInteger(prediction.timestamp) || prediction.timestamp <= 0
    ) {
    throw new Error('Phản hồi nhận diện không hợp lệ.');
  }
  return {
    letter: prediction.letter,
    confidence: prediction.confidence,
    timestamp: prediction.timestamp,
    accepted: prediction.accepted === false ? false : true,
    event: null,
  };
}
