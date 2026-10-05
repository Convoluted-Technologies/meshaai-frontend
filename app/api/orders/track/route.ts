import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, APIError } from '@/lib/api/backendClient';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const phone = searchParams.get('phone');

    if (!code) {
      return NextResponse.json(
        { title: 'Missing Order Code', detail: 'Order code is required', status: 400 },
        { status: 400 }
      );
    }

    const data = await backendFetch(`/api/v1/orders/${encodeURIComponent(code)}/status`, {
      method: 'GET',
      skipAuth: true,
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
        type: 'https://meshaai.com/errors/order-not-found',
        title: 'Order Not Found',
        status: 404,
        detail: err.message || 'Order code not found or invalid',
        code: 'ORDER_NOT_FOUND',
      },
      { status: 404 }
    );
  }
}
