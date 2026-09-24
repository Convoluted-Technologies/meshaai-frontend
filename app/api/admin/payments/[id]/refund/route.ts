import { NextRequest, NextResponse } from 'next/server';
import { initiateRefundForOrder } from '@/lib/payments';
import { createProblemDetails } from '@/lib/utils/errors';
import { broadcastAdminEvent } from '@/lib/events/sse';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let orderId = '';
  try {
    const { id } = await params; // order id or order code
    orderId = id;
    const body = await req.json();
    const { amountKobo, reason = 'Admin triggered refund', actor = 'ADMIN' } = body;

    const refundRecord = await initiateRefundForOrder(
      id,
      amountKobo ? Number(amountKobo) : undefined,
      reason,
      actor
    );

    broadcastAdminEvent('REFUND_PROCESSED', { refund: refundRecord, orderId: id });

    return NextResponse.json({
      success: true,
      message: 'Refund initiated successfully',
      refund: refundRecord,
    });
  } catch (err: any) {
    return createProblemDetails(
      400,
      'Refund Failed',
      err.message || 'Unable to process refund',
      'https://meshaai.com/errors/refund-failed',
      `/api/admin/payments/${orderId}/refund`
    );
  }
}
