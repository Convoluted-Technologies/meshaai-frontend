import { NextRequest, NextResponse } from 'next/server';
import { getSecretHash, verifyAndProcessPayment } from '@/lib/payments';
import { notifyCustomerOrderEvent } from '@/lib/notifications';
import { broadcastAdminEvent } from '@/lib/events/sse';

export async function POST(req: NextRequest) {
  const secretHash = getSecretHash();
  const signature = req.headers.get('verif-hash');

  if (!signature || signature !== secretHash) {
    return NextResponse.json({ error: 'Unauthorized webhook request' }, { status: 401 });
  }

  try {
    const payload = await req.json();

    if (payload.event === 'charge.completed' && payload.data) {
      const { tx_ref, id, amount } = payload.data;
      const result = await verifyAndProcessPayment(tx_ref, String(id), amount);

      if (result.success && result.order) {
        await notifyCustomerOrderEvent(result.order, 'PAID');
        broadcastAdminEvent('ORDER_PAID', { order: result.order });
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
}
