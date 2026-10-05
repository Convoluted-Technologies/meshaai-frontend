import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, APIError } from '@/lib/api/backendClient';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, reason } = body;

    const data = await backendFetch(`/api/v1/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, reason }),
    });

    return NextResponse.json({ order: data.order || data });
  } catch (err: any) {
    if (err instanceof APIError) {
      return NextResponse.json(err.problem, { status: err.status });
    }
    return NextResponse.json(
      { title: 'Update Failed', detail: err.message, status: 400 },
      { status: 400 }
    );
  }
}
