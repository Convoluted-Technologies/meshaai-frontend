import { RFCProblemDetails } from '@/lib/types';

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'https://meshaai-mainframe.onrender.com';

const ACCESS_TOKEN_KEY = 'meshaai_access_token';
const REFRESH_TOKEN_KEY = 'meshaai_refresh_token';

export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function storeAuthTokens(accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearAuthTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'corr_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
}

export interface FetchOptions extends RequestInit {
  currency?: string;
  countryCode?: string;
  skipAuth?: boolean;
}

export class APIError extends Error {
  public status: number;
  public code?: string;
  public problem: RFCProblemDetails;

  constructor(problem: RFCProblemDetails) {
    super(problem.detail || problem.title || 'API Request Failed');
    this.name = 'APIError';
    this.status = problem.status || 500;
    this.code = problem.code;
    this.problem = problem;
  }
}

/**
 * Universal backend fetch wrapper with automatic headers, correlation ID,
 * RFC 7807 problem details parsing, and silent 401 token refresh retry.
 */
export async function backendFetch<T = any>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { currency, countryCode, skipAuth = false, headers: customHeaders, ...restOptions } = options;

  const url = path.startsWith('http')
    ? path
    : `${BACKEND_URL}${path.startsWith('/') ? path : '/' + path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Correlation-Id': generateCorrelationId(),
    ...(customHeaders as Record<string, string>),
  };

  if (currency) {
    headers['X-Currency-Override'] = currency;
  }

  if (countryCode) {
    headers['CF-IPCountry'] = countryCode;
    headers['X-Country-Code'] = countryCode;
  }

  if (!skipAuth) {
    const token = getStoredAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let response = await fetch(url, { ...restOptions, headers });

  // Handle 401 Unauthorized -> try silent refresh token rotation once
  if (response.status === 401 && !skipAuth) {
    const refreshToken = getStoredRefreshToken();
    if (refreshToken && !path.includes('/auth/session/refresh')) {
      try {
        const refreshRes = await fetch(`${BACKEND_URL}/api/v1/auth/session/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshRes.ok) {
          const newTokens = await refreshRes.json();
          if (newTokens.accessToken && newTokens.refreshToken) {
            storeAuthTokens(newTokens.accessToken, newTokens.refreshToken);
            // Retry original request with new access token
            headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
            response = await fetch(url, { ...restOptions, headers });
          } else {
            clearAuthTokens();
          }
        } else {
          clearAuthTokens();
        }
      } catch (err) {
        clearAuthTokens();
      }
    }
  }

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!response.ok) {
    if (isJson) {
      const errData = await response.json();
      const problemDetails: RFCProblemDetails = {
        type: errData.type || 'https://meshaai.com/errors/api-error',
        title: errData.title || 'Error',
        status: errData.status || response.status,
        detail: errData.detail || response.statusText,
        instance: errData.instance || path,
        code: errData.code,
        correlationId: errData.correlationId,
        errors: errData.errors,
      };
      throw new APIError(problemDetails);
    } else {
      const text = await response.text();
      throw new APIError({
        type: 'https://meshaai.com/errors/api-error',
        title: response.statusText || 'HTTP Error',
        status: response.status,
        detail: text || `HTTP ${response.status} Error`,
        instance: path,
      });
    }
  }

  if (isJson) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}
