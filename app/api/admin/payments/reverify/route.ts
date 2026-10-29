import { NextRequest, NextResponse } from 'next/server';
import { verifyAndProcessPayment } from '@/lib/payments';
import { createProblemDetails } from '@/lib/utils/errors';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { txRef } = body;

    if (!txRef) {
      return createProblemDetails(
        400,
        'Missing Transaction Reference',
        'txRef is required for re-verification',
        'https://Meeshaai.com/errors/missing-tx-ref',
        '/api/admin/payments/reverify'
      );
    }

    const result = await verifyAndProcessPayment(txRef);
    return NextResponse.json(result);
  } catch (err: any) {
    return createProblemDetails(
      400,
      'Re-verification Failed',
      err.message || 'Error re-verifying payment',
      'https://Meeshaai.com/errors/reverify-failed',
      '/api/admin/payments/reverify'
    );
  }
}
