/**
 * API Client for Signify Backend
 * Supports JSON and multipart requests, Bearer token injection, and error handling.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface ApiResponse<T = any> {
  success: boolean;
  status: number;
  message: string;
  data?: T;
  errors?: Record<string, string>;
  timestamp?: string;
}

export interface UserDTO {
  userId: number;
  username: string;
  role: 'USER' | 'ADMIN';
  emailVerified: boolean;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface TokenDTO {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessExpiresAt: number;
  refreshExpiresAt: number;
}

export interface AuthDataDTO {
  user: UserDTO;
  tokens: TokenDTO;
}

// Token storage helpers
export const TOKEN_KEYS = {
  ACCESS_TOKEN: 'signbridge_access_token',
  REFRESH_TOKEN: 'signbridge_refresh_token',
  USER: 'signbridge_user',
  AUTH: 'signbridge_auth',
};

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
}

export function setStoredSession(tokens: TokenDTO, user: UserDTO): void {
  localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, tokens.accessToken);
  localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, tokens.refreshToken);
  localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEYS.AUTH, 'true');
}

export function clearStoredSession(): void {
  localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(TOKEN_KEYS.USER);
  localStorage.removeItem(TOKEN_KEYS.AUTH);
}

export function getStoredUser(): UserDTO | null {
  const userJson = localStorage.getItem(TOKEN_KEYS.USER);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  let json: any = {};
  try {
    json = await response.json();
  } catch {
    json = {
      success: response.ok,
      status: response.status,
      message: response.statusText || 'Lỗi kết nối máy chủ',
    };
  }

  if (!response.ok) {
    const errorMessage =
      json.message ||
      (json.errors ? Object.values(json.errors).join(', ') : 'Yêu cầu thất bại');
    const error = new Error(errorMessage) as any;
    error.status = response.status;
    error.data = json;
    error.errors = json.errors;
    throw error;
  }

  return json;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  const isPublicEndpoint =
    endpoint.includes('/auth/login') ||
    endpoint.includes('/users/register') ||
    endpoint.includes('/auth/refresh') ||
    endpoint.includes('/email/');

  const token = getStoredAccessToken();
  if (token && !headers.has('Authorization') && !isPublicEndpoint) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Cache-Control')) {
    headers.set('Cache-Control', 'no-store');
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If 401 Unauthorized and we have a refresh token, try refreshing once
    if (response.status === 401 && getStoredRefreshToken() && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
      const refreshed = await refreshTokens();
      if (refreshed) {
        // Retry with new access token
        const newHeaders = new Headers(options.headers || {});
        newHeaders.set('Authorization', `Bearer ${getStoredAccessToken()}`);
        const retryResponse = await fetch(url, {
          ...options,
          headers: newHeaders,
        });
        return handleResponse<T>(retryResponse);
      } else {
        clearStoredSession();
      }
    }

    return handleResponse<T>(response);
  } catch (err: any) {
    if (err.status) throw err;
    const error = new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng hoặc thử lại sau.') as any;
    error.status = 500;
    throw error;
  }
}

export async function refreshTokens(): Promise<boolean> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const resJson = await response.json();
    if (resJson.success && resJson.data) {
      // Refresh responses put the token fields directly inside `data`
      const newTokens: TokenDTO = resJson.data.tokens || resJson.data;
      localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, newTokens.accessToken);
      localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, newTokens.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
