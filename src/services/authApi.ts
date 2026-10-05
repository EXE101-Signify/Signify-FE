/**
 * Authentication and User API Services
 * Endpoints: /api/auth/* and /api/users/*
 */

import {
  apiFetch,
  setStoredSession,
  clearStoredSession,
  getStoredRefreshToken,
  type ApiResponse,
  type AuthDataDTO,
  type UserDTO,
} from './apiClient';

export interface LoginParams {
  username: string;
  password: string;
  deviceName?: string;
}

export interface RegisterParams {
  username: string;
  password: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export const authApi = {
  /**
   * POST /api/auth/login
   */
  async login(params: LoginParams): Promise<ApiResponse<AuthDataDTO>> {
    const res = await apiFetch<AuthDataDTO>('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: params.username,
        password: params.password,
        deviceName: params.deviceName || 'Web Browser',
      }),
    });

    if (res.success && res.data) {
      setStoredSession(res.data.tokens, res.data.user);
    }
    return res;
  },

  /**
   * POST /api/users/register
   * Uses multipart/form-data with JSON `request` part and optional `avatar` file.
   */
  async register(
    params: RegisterParams,
    avatarFile?: File | null
  ): Promise<ApiResponse<AuthDataDTO>> {
    const formData = new FormData();

    const requestObj = {
      username: params.username,
      password: params.password,
      email: params.email || undefined,
      firstName: params.firstName || undefined,
      lastName: params.lastName || undefined,
    };

    const requestBlob = new Blob([JSON.stringify(requestObj)], {
      type: 'application/json',
    });

    formData.append('request', requestBlob);

    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    const res = await apiFetch<AuthDataDTO>('/api/users/register', {
      method: 'POST',
      body: formData,
    });

    if (res.success && res.data) {
      setStoredSession(res.data.tokens, res.data.user);
    }
    return res;
  },

  /**
   * POST /api/auth/logout
   */
  async logout(): Promise<ApiResponse<null>> {
    const refreshToken = getStoredRefreshToken();
    try {
      if (refreshToken) {
        await apiFetch<null>('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } finally {
      clearStoredSession();
    }
    return { success: true, status: 200, message: 'Logout successful' };
  },

  /**
   * POST /api/auth/logout-all
   */
  async logoutAll(): Promise<ApiResponse<null>> {
    try {
      await apiFetch<null>('/api/auth/logout-all', {
        method: 'POST',
      });
    } finally {
      clearStoredSession();
    }
    return { success: true, status: 200, message: 'Logged out all sessions' };
  },

  /**
   * GET /api/users/me
   */
  async getProfile(): Promise<ApiResponse<UserDTO>> {
    return apiFetch<UserDTO>('/api/users/me', {
      method: 'GET',
    });
  },
};
