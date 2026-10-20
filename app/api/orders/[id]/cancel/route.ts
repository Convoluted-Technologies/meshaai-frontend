import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { phone, reason } = body;

    const res = await backendFetch(`/orders/${encodeURIComponent(id.toUpperCase())}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ phone, reason: reason || 'Customer cancelled from tracking page' }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { title: 'Cancel Failed', detail: data?.message || data?.detail || 'Failed to cancel order' },
        { status: res.status }
      );
    }

    // Adapt the cancel response to include a minimal order-like shape
    return NextResponse.json({
      success: true,
      order: {
        code: data.code || id,
        status: data.status,
        message: data.message,
        refundInitiated: data.refundInitiated,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ title: 'Cancel Failed', detail: err.message }, { status: 502 });
  }
}
