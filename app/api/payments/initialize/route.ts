import { NextRequest, NextResponse } from 'next/server';
import { initializeFlutterwavePayment } from '@/lib/payments';
import { createProblemDetails } from '@/lib/utils/errors';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderCode, orderId } = body;

    const identifier = orderCode || orderId;
    if (!identifier) {
      return createProblemDetails(
        400,
        'Missing Order Identifier',
        'Order code or order ID is required to initialize payment.',
        'https://meshaai.com/errors/missing-order-identifier',
        '/api/payments/initialize'
      );
    }

    const hostOrigin = req.headers.get('origin') || 'http://localhost:3000';
    const result = await initializeFlutterwavePayment(identifier, hostOrigin);

    return NextResponse.json({
      success: true,
      checkoutUrl: result.checkoutUrl,
      txRef: result.txRef,
      payment: result.payment,
    });
  } catch (err: any) {
    return createProblemDetails(
      400,
      'Payment Initialization Failed',
      err.message || 'Unable to initialize Flutterwave checkout',
      'https://meshaai.com/errors/payment-init-failed',
      '/api/payments/initialize'
    );
  }
}
