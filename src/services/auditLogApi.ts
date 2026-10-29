/**
 * Admin Audit Log API Service
 * Endpoints: /api/admin/audit-logs
 * Requires ADMIN Role Bearer Token
 */

import { apiFetch, type ApiResponse } from './apiClient';

export interface AuditLogDTO {
  id: number;
  adminId: number;
  action: 'UPDATE_USER' | 'BAN_USER' | 'UNBAN_USER' | string;
  targetType: string;
  targetId?: number | null;
  reason?: string | null;
  metadata?: Record<string, any>;
  createdAt: number;
}

export interface AuditLogPageDTO {
  content: AuditLogDTO[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AuditLogQueryParams {
  adminId?: number;
  action?: string;
  targetType?: string;
  targetId?: number;
  fromTime?: number;
  toTime?: number;
  page?: number;
  size?: number;
}

export const auditLogApi = {
  /**
   * GET /api/admin/audit-logs
   */
  async list(queryParams: AuditLogQueryParams = {}): Promise<ApiResponse<AuditLogPageDTO>> {
    const params = new URLSearchParams();
    if (queryParams.adminId) params.append('adminId', String(queryParams.adminId));
    if (queryParams.action) params.append('action', queryParams.action);
    if (queryParams.targetType) params.append('targetType', queryParams.targetType);
    if (queryParams.targetId) params.append('targetId', String(queryParams.targetId));
    if (queryParams.fromTime) params.append('fromTime', String(queryParams.fromTime));
    if (queryParams.toTime) params.append('toTime', String(queryParams.toTime));
    params.append('page', String(queryParams.page ?? 0));
    params.append('size', String(queryParams.size ?? 20));

    return apiFetch<AuditLogPageDTO>(`/api/admin/audit-logs?${params.toString()}`);
  },
};
