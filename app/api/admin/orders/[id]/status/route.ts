import { NextRequest, NextResponse } from 'next/server';
import { transitionOrderStatus } from '@/lib/orders';
import { createProblemDetails } from '@/lib/utils/errors';
import { broadcastAdminEvent } from '@/lib/events/sse';
import { notifyCustomerOrderEvent } from '@/lib/notifications';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, actor = 'ADMIN:OPS', reason = 'Admin status update' } = body;

    if (!status) {
      return createProblemDetails(
        400,
        'Missing Target Status',
        'Target order status is required.',
        'https://meshaai.com/errors/missing-status',
        `/api/admin/orders/${id}/status`
      );
    }

    const updatedOrder = transitionOrderStatus(id, status, actor, reason);

    // Notify customer on key events
    if (['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].includes(status)) {
      await notifyCustomerOrderEvent(updatedOrder, status as any);
    }

    broadcastAdminEvent('ORDER_UPDATED', { order: updatedOrder });

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updatedOrder,
    });
  } catch (err: any) {
    return createProblemDetails(
      400,
      'Status Transition Failed',
      err.message || 'Unable to update order status',
      'https://meshaai.com/errors/status-transition-failed',
      `/api/admin/orders/status`
    );
  }
}
