import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';

/**
 * POST /api/auth/session/refresh
 * Refresh an expired access token using the refresh token.
 * Body: { refreshToken }
 * Returns: { accessToken, refreshToken, expiresIn }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { title: 'Missing Token', detail: 'refreshToken is required.' },
        { status: 400 }
      );
    }

    const res = await backendFetch('/auth/session/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { title: 'Token Refresh Failed', detail: data?.detail || data?.message || 'Session has expired. Please log in again.' },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      accessToken: data.accessToken || data.token || '',
      refreshToken: data.refreshToken || '',
      expiresIn: data.expiresInSeconds || data.expiresIn || 86400,
    });
  } catch (err: any) {
    return NextResponse.json(
      { title: 'Session Refresh Error', detail: err.message || 'Failed to refresh session' },
      { status: 502 }
    );
  }
}
