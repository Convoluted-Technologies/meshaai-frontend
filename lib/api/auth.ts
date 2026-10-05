import { backendFetch, storeAuthTokens, clearAuthTokens } from './backendClient';
import { AuthTokenResponse } from '@/lib/types';

export async function requestPhoneOtp(phone: string) {
  return backendFetch<{ message: string; expiresInSeconds?: number; devOtp?: string }>(
    '/api/v1/auth/otp/request',
    {
      method: 'POST',
      body: JSON.stringify({ phone }),
      skipAuth: true,
    }
  );
}

export async function verifyPhoneOtp(phone: string, code: string): Promise<AuthTokenResponse> {
  const data = await backendFetch<AuthTokenResponse>('/api/v1/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
    skipAuth: true,
  });

  if (data.accessToken && data.refreshToken) {
    storeAuthTokens(data.accessToken, data.refreshToken);
  }

  return data;
}

export async function adminLogin(email: string, password: string): Promise<AuthTokenResponse> {
  const data = await backendFetch<AuthTokenResponse>('/api/v1/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });

  if (data.accessToken && data.refreshToken) {
    storeAuthTokens(data.accessToken, data.refreshToken);
  }

  return data;
}

export function logout() {
  clearAuthTokens();
}
