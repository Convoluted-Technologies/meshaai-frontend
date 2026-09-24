import { NextRequest, NextResponse } from 'next/server';
import { verifyAndProcessPayment } from '@/lib/payments';
import { notifyCustomerOrderEvent } from '@/lib/notifications';
import { broadcastAdminEvent } from '@/lib/events/sse';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { txRef, status } = body;

    if (!txRef) {
      return NextResponse.json({ error: 'txRef required' }, { status: 400 });
    }

    if (status === 'FAILED') {
      const result = await verifyAndProcessPayment(txRef, undefined, 0);
      return NextResponse.json({ success: false, message: 'Payment failed', order: result.order });
    }

    const result = await verifyAndProcessPayment(txRef);
    if (result.success && result.order) {
      await notifyCustomerOrderEvent(result.order, 'PAID');
      broadcastAdminEvent('ORDER_PAID', { order: result.order });
    }

    return NextResponse.json({
      success: result.success,
      message: result.message,
      order: result.order,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
