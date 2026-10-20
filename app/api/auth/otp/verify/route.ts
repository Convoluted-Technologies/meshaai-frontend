import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, otp, name } = body;

    if (!phone || !otp) {
      return NextResponse.json(
        { title: 'Invalid Payload', detail: 'Phone number and OTP code are required.' },
        { status: 400 }
      );
    }

    const res = await backendFetch('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code: otp, name }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { title: 'Invalid OTP', detail: data?.message || data?.detail || 'The OTP provided is invalid or has expired.' },
        { status: res.status }
      );
    }

    // Backend returns AuthTokenResponse: { accessToken, refreshToken, customer? }
    const token = data.accessToken || data.token || '';
    const customer = data.customer || { id: data.customerId || '', phone };

    return NextResponse.json({
      success: true,
      token,
      customer,
    });
  } catch (err: any) {
    return NextResponse.json(
      { title: 'OTP Verification Failed', detail: err.message || 'Unable to verify OTP' },
      { status: 502 }
    );
  }
}
