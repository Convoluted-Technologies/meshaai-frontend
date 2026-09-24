import { NextRequest, NextResponse } from 'next/server';
import { generateOTP } from '@/lib/auth';
import { createProblemDetails } from '@/lib/utils/errors';
import { logEvent } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone) {
      return createProblemDetails(
        400,
        'Phone Required',
        'Phone number is required to request OTP',
        'https://meshaai.com/errors/missing-phone',
        '/api/auth/otp/request'
      );
    }

    const otp = generateOTP(phone);
    logEvent('INFO', 'OTP_GENERATED', { phone, otp });

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully to phone.',
      // For easy demo testing, returning otp hint when in local env
      ...(process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {}),
    });
  } catch (err: any) {
    return createProblemDetails(
      400,
      'OTP Request Failed',
      err.message || 'Failed to send OTP',
      'https://meshaai.com/errors/otp-failed',
      '/api/auth/otp/request'
    );
  }
}
