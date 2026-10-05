/**
 * Email API Services
 * Endpoints: /api/email/*
 * All endpoints are public
 */

import { apiFetch, type ApiResponse } from './apiClient';

export interface SendOtpParams {
  email: string;
}

export interface VerifyOtpParams {
  email: string;
  otp: string;
}

export interface ResetPasswordOtpParams {
  email: string;
  otp: string;
  newPassword?: string;
}

export const emailApi = {
  /**
   * 1. Send OTP (Registration)
   * POST /api/email/otp/send
   */
  async sendRegisterOtp(email: string): Promise<ApiResponse<null>> {
    return apiFetch<null>('/api/email/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  },

  /**
   * 2. Verify OTP (Registration)
   * POST /api/email/otp/verify
   */
  async verifyRegisterOtp(email: string, otp: string): Promise<ApiResponse<null>> {
    return apiFetch<null>('/api/email/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
  },

  /**
   * 3. Resend OTP
   * POST /api/email/otp/resend
   */
  async resendOtp(email: string): Promise<ApiResponse<null>> {
    return apiFetch<null>('/api/email/otp/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  },

  /**
   * 4. Send Password Reset OTP
   * POST /api/email/forgot-password/send
   */
  async sendForgotPasswordOtp(email: string): Promise<ApiResponse<null>> {
    return apiFetch<null>('/api/email/forgot-password/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  },

  /**
   * 5. Verify OTP & Reset Password
   * POST /api/email/forgot-password/verify
   */
  async verifyForgotPasswordOtp(
    email: string,
    otp: string,
    newPassword?: string
  ): Promise<ApiResponse<null>> {
    return apiFetch<null>('/api/email/forgot-password/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword }),
    });
  },
};
