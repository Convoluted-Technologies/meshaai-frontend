import { NextRequest, NextResponse } from 'next/server';
import { findOrderByCodeAndPhone } from '@/lib/db/store';
import { createProblemDetails } from '@/lib/utils/errors';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const phone = searchParams.get('phone');

  if (!code || !phone) {
    return createProblemDetails(
      400,
      'Missing Parameters',
      'Both order code and phone number are required to track an order.',
      'https://meshaai.com/errors/missing-track-params',
      '/api/orders/track'
    );
  }

  const order = findOrderByCodeAndPhone(code, phone);
  if (!order) {
    return createProblemDetails(
      404,
      'Order Not Found',
      `No order found with code ${code.toUpperCase()} matching phone number ${phone}.`,
      'https://meshaai.com/errors/order-not-found',
      '/api/orders/track'
    );
  }

  return NextResponse.json({
    success: true,
    order,
  });
}
