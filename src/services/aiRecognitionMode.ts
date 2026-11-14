import { apiFetch } from './apiClient';

export type RecognitionMode = 'ALPHABET' | 'VSL_WORDS' | 'VSL_STREAMING';

export interface RecognitionModeUpdate {
  type: 'AI_RECOGNITION_MODE';
  callId: number;
  mode: RecognitionMode;
  timestamp: number;
}

export function parseRecognitionModeUpdate(body: string, callId: number): RecognitionModeUpdate | null {
  try {
    const value = JSON.parse(body) as Partial<RecognitionModeUpdate>;
    if (value.type !== 'AI_RECOGNITION_MODE' || value.callId !== callId
      || !['ALPHABET', 'VSL_WORDS', 'VSL_STREAMING'].includes(value.mode ?? '')
      || typeof value.timestamp !== 'number' || !Number.isFinite(value.timestamp)) return null;
    return value as RecognitionModeUpdate;
  } catch {
    return null;
  }
}

export async function getRecognitionMode(callId: number): Promise<RecognitionModeUpdate> {
  const response = await apiFetch<RecognitionModeUpdate>(`/api/calls/${callId}/recognition-mode`);
  const update = parseRecognitionModeUpdate(JSON.stringify(response.data), callId);
  if (!update) throw new Error('Phản hồi chế độ nhận dạng không hợp lệ.');
  return update;
}

export async function changeRecognitionMode(callId: number, mode: RecognitionMode): Promise<RecognitionModeUpdate> {
  const response = await apiFetch<RecognitionModeUpdate>(`/api/calls/${callId}/recognition-mode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  });
  const update = parseRecognitionModeUpdate(JSON.stringify(response.data), callId);
  if (!update) throw new Error('Phản hồi chế độ nhận dạng không hợp lệ.');
  return update;
}
