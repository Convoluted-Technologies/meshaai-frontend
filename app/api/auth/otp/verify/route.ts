import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, APIError } from '@/lib/api/backendClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await backendFetch('/api/v1/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify(body),
      skipAuth: true,
    });

    return NextResponse.json(data);
  } catch (err: any) {
    if (err instanceof APIError) {
      return NextResponse.json(err.problem, { status: err.status });
    }
    return NextResponse.json(
      {
        type: 'https://meshaai.com/errors/invalid-otp',
        title: 'OTP Verification Error',
        status: 400,
        detail: err.message || 'Invalid or expired OTP verification code',
        code: 'INVALID_OTP',
      },
      { status: 400 }
    );
  }
}
