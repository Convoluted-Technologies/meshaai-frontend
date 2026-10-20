import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, adaptOrder } from '@/lib/backend';
import { getServerAdminToken } from '@/lib/backend-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const adminToken = await getServerAdminToken();
    const headers = adminToken ? { Authorization: `Bearer ${adminToken}` } : {};
    const res = await backendFetch(`/admin/orders/${id}`, { method: 'GET' }, headers);
    const raw = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { title: 'Order Not Found', detail: raw?.message || `No order found matching identifier ${id}` },
        { status: res.status }
      );
    }

    const order = adaptOrder(raw);
    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json({ title: 'Error', detail: err.message }, { status: 502 });
  }
}
