import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, APIError } from '@/lib/api/backendClient';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: code } = await params;
    const body = await req.json();
    const { phone, reason } = body;

    const data = await backendFetch(`/api/v1/orders/${encodeURIComponent(code)}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ phone, reason }),
      skipAuth: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      order: data.order || data,
    });
  } catch (err: any) {
    if (err instanceof APIError) {
      return NextResponse.json(err.problem, { status: err.status });
    }
    return NextResponse.json(
      {
        type: 'https://meshaai.com/errors/cancellation-failed',
        title: 'Cancellation Failed',
        status: 400,
        detail: err.message || 'Unable to cancel order',
      },
      { status: 400 }
    );
  }
}
