import { apiFetch } from './apiClient';
import { parseAiTextUpdate, type AiTextUpdateEvent } from './aiTextUpdate';

export type AiTextCommand = 'space' | 'delete' | 'clear';

export async function sendAiTextCommand(callId: number, command: AiTextCommand): Promise<AiTextUpdateEvent> {
  const response = await apiFetch<AiTextUpdateEvent>(`/api/calls/${callId}/text/${command}`, { method: 'POST' });
  const update = parseAiTextUpdate(JSON.stringify(response.data), callId);
  if (!update) throw new Error('Phản hồi văn bản AI không hợp lệ.');
  return update;
}
