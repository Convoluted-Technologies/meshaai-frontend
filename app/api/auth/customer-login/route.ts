import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';

/**
 * POST /api/auth/customer-login
 * Returning customer login — email or phone + password. No OTP required.
 * Body: { identifier, password }  where identifier is email or phone number
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password, email, phone } = body;

    // Accept identifier directly or separate email/phone fields
    const loginId = identifier || email || phone;

    if (!loginId || !password) {
      return NextResponse.json(
        {
          title: 'Missing Credentials',
          detail: 'Email (or phone number) and password are required to sign in.',
        },
        { status: 400 }
      );
    }

    // Determine whether identifier looks like an email or phone
    const isEmail = loginId.includes('@');
    const loginPayload = isEmail
      ? { email: loginId, password }
      : { phone: loginId, password };

    const res = await backendFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginPayload),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          title: 'Login Failed',
          detail: data?.message || data?.detail || 'Invalid credentials. Please check your email/phone and password.',
          code: data?.code || data?.errorCode,
        },
        { status: res.status }
      );
    }

    // Backend returns AuthTokenResponse: { accessToken, refreshToken, customer? }
    const token = data.accessToken || data.token || '';
    const customer = data.customer || {
      id: data.customerId || '',
      name: data.name || '',
      phone: data.phone || loginId,
      email: data.email || loginId,
    };

    return NextResponse.json({
      success: true,
      token,
      customer,
    });
  } catch (err: any) {
    return NextResponse.json(
      { title: 'Login Error', detail: err.message || 'An unexpected error occurred during login.' },
      { status: 502 }
    );
  }
}
