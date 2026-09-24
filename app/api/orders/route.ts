import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/lib/orders';
import { createProblemDetails } from '@/lib/utils/errors';
import { broadcastAdminEvent } from '@/lib/events/sse';
import { logEvent } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  const correlationId = req.headers.get('x-correlation-id') || `corr_${Date.now()}`;
  const idempotencyKey = req.headers.get('idempotency-key') || req.headers.get('x-idempotency-key') || undefined;

  try {
    const body = await req.json();
    const { phone, items, location, note, customerId } = body;

    if (!phone || !items || !Array.isArray(items) || items.length === 0 || !location) {
      return createProblemDetails(
        400,
        'Invalid Order Request',
        'Phone, items array, and delivery location are required.',
        'https://meshaai.com/errors/invalid-order-payload',
        '/api/orders'
      );
    }

    const order = createOrder({
      phone,
      items,
      location,
      note,
      customerId,
      idempotencyKey,
    });

    logEvent('INFO', 'ORDER_CREATED', { orderCode: order.code, phone: order.phone, totalKobo: order.totalKobo }, correlationId);

    // Broadcast event to admin SSE dashboard
    broadcastAdminEvent('NEW_ORDER', { order });

    return NextResponse.json(
      {
        success: true,
        message: 'Order created successfully. Please proceed to payment.',
        order,
      },
      { status: 201 }
    );
  } catch (err: any) {
    logEvent('ERROR', 'ORDER_CREATION_FAILED', { error: err.message }, correlationId);
    return createProblemDetails(
      400,
      'Order Creation Failed',
      err.message || 'Unable to process order creation',
      'https://meshaai.com/errors/order-creation-failed',
      '/api/orders'
    );
  }
}
