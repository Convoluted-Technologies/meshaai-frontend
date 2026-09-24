import { NextRequest, NextResponse } from 'next/server';
import { cancelCustomerOrder } from '@/lib/orders';
import { createProblemDetails } from '@/lib/utils/errors';
import { broadcastAdminEvent } from '@/lib/events/sse';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { phone, reason } = body;

    if (!phone) {
      return createProblemDetails(
        400,
        'Phone Required',
        'Phone number is required to verify ownership before cancelling an order.',
        'https://meshaai.com/errors/missing-phone',
        `/api/orders/${id}/cancel`
      );
    }

    const cancelledOrder = cancelCustomerOrder(id, phone, reason || 'Cancelled by customer');
    broadcastAdminEvent('ORDER_UPDATED', { order: cancelledOrder });

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      order: cancelledOrder,
    });
  } catch (err: any) {
    return createProblemDetails(
      400,
      'Cancellation Failed',
      err.message || 'Unable to cancel order',
      'https://meshaai.com/errors/cancellation-failed',
      `/api/orders/cancel`
    );
  }
}
