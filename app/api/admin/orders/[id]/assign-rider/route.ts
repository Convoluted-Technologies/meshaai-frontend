import { NextRequest, NextResponse } from 'next/server';
import { findOrderByCodeOrId, saveOrderToStore } from '@/lib/db/store';
import { createProblemDetails } from '@/lib/utils/errors';
import { broadcastAdminEvent } from '@/lib/events/sse';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { riderName, riderPhone } = body;

    if (!riderName || !riderPhone) {
      return createProblemDetails(
        400,
        'Rider Details Required',
        'Rider name and phone number are required.',
        'https://meshaai.com/errors/missing-rider-info',
        `/api/admin/orders/${id}/assign-rider`
      );
    }

    const order = findOrderByCodeOrId(id);
    if (!order) {
      return createProblemDetails(
        404,
        'Order Not Found',
        `No order found with ID ${id}`,
        'https://meshaai.com/errors/order-not-found',
        `/api/admin/orders/${id}/assign-rider`
      );
    }

    order.rider = {
      name: riderName,
      phone: riderPhone,
      assignedAt: new Date().toISOString(),
    };
    order.updatedAt = new Date().toISOString();

    saveOrderToStore(order);
    broadcastAdminEvent('ORDER_UPDATED', { order });

    return NextResponse.json({
      success: true,
      message: `Rider ${riderName} assigned to order ${order.code}`,
      order,
    });
  } catch (err: any) {
    return createProblemDetails(
      400,
      'Rider Assignment Failed',
      err.message || 'Unable to assign rider',
      'https://meshaai.com/errors/rider-assignment-failed',
      `/api/admin/orders/assign-rider`
    );
  }
}
