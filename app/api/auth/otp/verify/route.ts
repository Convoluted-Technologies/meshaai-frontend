import { NextRequest, NextResponse } from 'next/server';
import {
  verifyOTP,
  getOrCreateCustomerByPhone,
  linkGuestOrdersToCustomer,
  createAuthToken,
} from '@/lib/auth';
import { createProblemDetails } from '@/lib/utils/errors';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, otp, name } = body;

    if (!phone || !otp) {
      return createProblemDetails(
        400,
        'Invalid Payload',
        'Phone number and OTP code are required.',
        'https://meshaai.com/errors/missing-otp-payload',
        '/api/auth/otp/verify'
      );
    }

    const isValid = verifyOTP(phone, otp);
    if (!isValid) {
      return createProblemDetails(
        401,
        'Invalid OTP',
        'The OTP provided is invalid or has expired.',
        'https://meshaai.com/errors/invalid-otp',
        '/api/auth/otp/verify'
      );
    }

    const customer = getOrCreateCustomerByPhone(phone, name);
    const linkedCount = linkGuestOrdersToCustomer(phone, customer.id);
    const token = createAuthToken({ id: customer.id, phone: customer.phone, type: 'CUSTOMER' });

    return NextResponse.json({
      success: true,
      token,
      customer,
      linkedOrdersCount: linkedCount,
    });
  } catch (err: any) {
    return createProblemDetails(
      400,
      'OTP Verification Failed',
      err.message || 'Unable to verify OTP',
      'https://meshaai.com/errors/otp-verification-failed',
      '/api/auth/otp/verify'
    );
  }
}
