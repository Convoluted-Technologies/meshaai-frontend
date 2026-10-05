import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, APIError } from '@/lib/api/backendClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const idempotencyKey = req.headers.get('Idempotency-Key') || undefined;

    const data = await backendFetch('/api/v1/orders', {
      method: 'POST',
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
      body: JSON.stringify(body),
    });

    return NextResponse.json({
      order: data.order || data,
    });
  } catch (err: any) {
    if (err instanceof APIError) {
      return NextResponse.json(err.problem, { status: err.status });
    }
    return NextResponse.json(
      {
        type: 'https://meshaai.com/errors/order-creation-failed',
        title: 'Order Creation Error',
        status: 400,
        detail: err.message || 'Failed to place order',
        code: 'ORDER_CREATION_FAILED',
      },
      { status: 400 }
    );
  }
}
