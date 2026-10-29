/**
 * Notification API Service
 * Endpoints: /api/notifications/*
 * Requires Bearer Token
 */

import { apiFetch, type ApiResponse } from './apiClient';

export interface NotificationDTO {
  id: number;
  type: 'MISSED_CALL' | 'SUBSCRIPTION_EXPIRING' | 'SUBSCRIPTION_EXPIRED' | string;
  title: string;
  content: string;
  referenceType?: string | null;
  referenceId?: number | null;
  read: boolean;
  createdAt: number;
  readAt?: number | null;
}

export interface NotificationPageDTO {
  content: NotificationDTO[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface UnreadCountDTO {
  unreadCount: number;
}

export interface MarkAllReadDTO {
  updatedCount: number;
}

export const notificationApi = {
  /**
   * GET /api/notifications?unreadOnly=false&page=0&size=20
   */
  async list(unreadOnly = false, page = 0, size = 20): Promise<ApiResponse<NotificationPageDTO>> {
    const params = new URLSearchParams({
      unreadOnly: String(unreadOnly),
      page: String(page),
      size: String(size),
    });
    return apiFetch<NotificationPageDTO>(`/api/notifications?${params.toString()}`);
  },

  /**
   * GET /api/notifications/unread-count
   */
  async getUnreadCount(): Promise<ApiResponse<UnreadCountDTO>> {
    return apiFetch<UnreadCountDTO>('/api/notifications/unread-count');
  },

  /**
   * PATCH /api/notifications/{notificationId}/read
   */
  async markRead(notificationId: number): Promise<ApiResponse<NotificationDTO>> {
    return apiFetch<NotificationDTO>(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  },

  /**
   * PATCH /api/notifications/read-all
   */
  async markAllRead(): Promise<ApiResponse<MarkAllReadDTO>> {
    return apiFetch<MarkAllReadDTO>('/api/notifications/read-all', {
      method: 'PATCH',
    });
  },
};
