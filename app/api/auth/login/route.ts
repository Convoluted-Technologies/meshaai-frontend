import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Accept either { email, password } (contract section 4.1) or legacy { username, password }
    const { email, username, password } = body;
    const loginId = email || username;

    if (!loginId || !password) {
      return NextResponse.json(
        { title: 'Missing Credentials', detail: 'Email and password are required for admin login.' },
        { status: 400 }
      );
    }

    const res = await backendFetch('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: loginId, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { title: 'Authentication Failed', detail: data?.message || data?.detail || 'Invalid admin credentials.' },
        { status: res.status }
      );
    }

    // Backend returns AdminAuthResponse: { accessToken, tokenType, expiresInSeconds, admin: { id, email, fullName, role } }
    const token = data.accessToken || data.token || '';
    const admin = data.admin || {};

    const response = NextResponse.json({
      success: true,
      user: {
        id: admin.id || data.adminId || '',
        username: admin.fullName || admin.email || loginId,
        email: admin.email || loginId,
        role: admin.role || data.role || 'ADMIN',
        token,
      },
      token,
    });

    // Set cookie for browser session
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 86400, // 24 hours
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { title: 'Login Error', detail: err.message || 'Error authenticating admin' },
      { status: 502 }
    );
  }
}
