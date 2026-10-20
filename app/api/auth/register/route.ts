import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';

/**
 * POST /api/auth/register
 * New customer registration — collects name, phone, email, password.
 * The backend will send an OTP to the phone number to verify the new account.
 * Body: { name, phone, email, password }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, password } = body;

    if (!name || !phone || !email || !password) {
      return NextResponse.json(
        {
          title: 'Missing Fields',
          detail: 'Name, phone number, email, and password are all required to register.',
        },
        { status: 400 }
      );
    }

    const res = await backendFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, phone, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          title: 'Registration Failed',
          detail: data?.message || data?.detail || 'Could not create your account. Please try again.',
          code: data?.code || data?.errorCode,
        },
        { status: res.status }
      );
    }

    // Backend responds with a pending-verification state — OTP sent to phone
    return NextResponse.json({
      success: true,
      message: data.message || 'Account created! Please verify your phone number with the OTP sent.',
      ...(data.devOtp ? { devOtp: data.devOtp } : {}),
    });
  } catch (err: any) {
    return NextResponse.json(
      { title: 'Registration Error', detail: err.message || 'An unexpected error occurred during registration.' },
      { status: 502 }
    );
  }
}
