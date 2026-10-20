import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { title: 'Phone Required', detail: 'Phone number is required to request OTP' },
        { status: 400 }
      );
    }

    const res = await backendFetch('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { title: 'OTP Request Failed', detail: data?.message || data?.detail || 'Failed to send OTP' },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully to phone.',
      // Pass through devOtp if backend returns it in non-production
      ...(data.devOtp ? { devOtp: data.devOtp } : {}),
    });
  } catch (err: any) {
    return NextResponse.json(
      { title: 'OTP Request Failed', detail: err.message || 'Failed to send OTP' },
      { status: 502 }
    );
  }
}
