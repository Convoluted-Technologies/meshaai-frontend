import { NextRequest, NextResponse } from 'next/server';
import { findOrderByCodeOrId } from '@/lib/db/store';
import { createProblemDetails } from '@/lib/utils/errors';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = findOrderByCodeOrId(id);

  if (!order) {
    return createProblemDetails(
      404,
      'Order Not Found',
      `No order found matching identifier ${id}`,
      'https://meshaai.com/errors/order-not-found',
      `/api/orders/${id}`
    );
  }

  return NextResponse.json({
    success: true,
    order,
  });
}
