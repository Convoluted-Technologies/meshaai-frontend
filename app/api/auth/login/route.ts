import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth';
import { createProblemDetails } from '@/lib/utils/errors';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return createProblemDetails(
        400,
        'Missing Credentials',
        'Username and password are required for admin login.',
        'https://meshaai.com/errors/missing-credentials',
        '/api/auth/login'
      );
    }

    const authResult = authenticateAdmin(username, password);
    if (!authResult) {
      return createProblemDetails(
        401,
        'Authentication Failed',
        'Invalid admin credentials.',
        'https://meshaai.com/errors/invalid-credentials',
        '/api/auth/login'
      );
    }

    const res = NextResponse.json({
      success: true,
      user: {
        id: authResult.user.id,
        username: authResult.user.username,
        email: authResult.user.email,
        role: authResult.user.role,
      },
      token: authResult.token,
    });

    // Set cookie for browser session
    res.cookies.set('admin_token', authResult.token, {
      httpOnly: true,
      path: '/',
      maxAge: 86400, // 24 hours
    });

    return res;
  } catch (err: any) {
    return createProblemDetails(
      500,
      'Login Error',
      err.message || 'Error authenticating user',
      'https://meshaai.com/errors/login-error',
      '/api/auth/login'
    );
  }
}
