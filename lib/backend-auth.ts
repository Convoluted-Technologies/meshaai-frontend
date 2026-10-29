/**
 * lib/backend-auth.ts
 * Server-side admin token cache for backend-to-backend authenticated calls.
 * Automatically logs in with service account credentials from env vars.
 */

const BACKEND_URL = process.env.BACKEND_URL || 'https://Meeshaai-mainframe-744177391644.europe-west1.run.app';
const ADMIN_EMAIL = process.env.BACKEND_ADMIN_EMAIL || process.env.BACKEND_ADMIN_USERNAME || '';
const ADMIN_PASSWORD = process.env.BACKEND_ADMIN_PASSWORD || '';

interface CachedToken {
  token: string;
  expiresAt: number;
}

// In-memory token cache (valid for Next.js server-side context)
let tokenCache: CachedToken | null = null;

export async function getServerAdminToken(): Promise<string | null> {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return null;

  // Return cached token if still valid (with 60s buffer)
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.token;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Backend expects { email, password } per AdminLoginRequest schema
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    // AdminAuthResponse: { accessToken, tokenType, expiresInSeconds, admin: {...} }
    const token = data.accessToken || data.token || '';
    if (!token) return null;

    // Cache for 23 hours (tokens typically expire in 24h)
    tokenCache = { token, expiresAt: Date.now() + 23 * 60 * 60 * 1000 };
    return token;
  } catch {
    return null;
  }
}
