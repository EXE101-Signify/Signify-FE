import { apiFetch } from './apiClient';

export type VideoCallStatus =
  | 'CALLING'
  | 'ACCEPTED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'MISSED'
  | 'BUSY';

export interface VideoCallRecord {
  id: number;
  conversationId: number;
  callerId: number;
  receiverId: number;
  status: VideoCallStatus;
  startedAt: number | null;
  endedAt: number | null;
  createdAt: number;
}

async function requireCall(response: { success: boolean; data?: VideoCallRecord }): Promise<VideoCallRecord> {
  const call = response.data;
  if (response.success !== true || !call
    || [call.id, call.conversationId, call.callerId, call.receiverId].some((id) => !Number.isSafeInteger(id) || id <= 0)
    || !['CALLING', 'ACCEPTED', 'COMPLETED', 'REJECTED', 'MISSED', 'BUSY'].includes(call.status)) {
    throw new Error('Máy chủ không trả về cuộc gọi hợp lệ.');
  }
  return call;
}

export const videoCallApi = {
  async create(conversationId: number): Promise<VideoCallRecord> {
    if (!Number.isSafeInteger(conversationId) || conversationId <= 0) {
      throw new Error('Mã cuộc trò chuyện không hợp lệ.');
    }
    return requireCall(await apiFetch<VideoCallRecord>('/api/calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId }),
    }));
  },
  async accept(callId: number): Promise<VideoCallRecord> {
    return requireCall(await apiFetch<VideoCallRecord>(`/api/calls/${callId}/accept`, { method: 'POST' }));
  },
  async reject(callId: number): Promise<VideoCallRecord> {
    return requireCall(await apiFetch<VideoCallRecord>(`/api/calls/${callId}/reject`, { method: 'POST' }));
  },
  async end(callId: number): Promise<VideoCallRecord> {
    return requireCall(await apiFetch<VideoCallRecord>(`/api/calls/${callId}/end`, { method: 'POST' }));
  },
};
