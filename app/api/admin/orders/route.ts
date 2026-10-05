import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, APIError } from '@/lib/api/backendClient';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';
    const queryStr = status ? `?status=${encodeURIComponent(status)}` : '';

    const data = await backendFetch(`/api/v1/admin/orders${queryStr}`, {
      method: 'GET',
    });

    return NextResponse.json({
      orders: data.orders || data.content || data || [],
    });
  } catch (err: any) {
    if (err instanceof APIError) {
      return NextResponse.json(err.problem, { status: err.status });
    }
    return NextResponse.json({ orders: [] });
  }
}
