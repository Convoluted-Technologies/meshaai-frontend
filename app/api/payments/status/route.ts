import { NextRequest, NextResponse } from 'next/server';
import { getPaymentsFromStore, findOrderByCodeOrId } from '@/lib/db/store';
import { createProblemDetails } from '@/lib/utils/errors';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const txRef = searchParams.get('tx_ref');

  if (!txRef) {
    return createProblemDetails(
      400,
      'Missing Transaction Reference',
      'tx_ref query parameter is required',
      'https://meshaai.com/errors/missing-tx-ref',
      '/api/payments/status'
    );
  }

  const payments = getPaymentsFromStore();
  const payment = payments.find((p) => p.txRef === txRef);
  const order = findOrderByCodeOrId(txRef);

  if (!order) {
    return createProblemDetails(
      404,
      'Order Not Found',
      `No order found for transaction reference ${txRef}`,
      'https://meshaai.com/errors/order-not-found',
      '/api/payments/status'
    );
  }

  return NextResponse.json({
    success: true,
    payment: payment || null,
    orderStatus: order.status,
    orderCode: order.code,
  });
}
