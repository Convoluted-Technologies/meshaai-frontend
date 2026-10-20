import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, adaptOrder } from '@/lib/backend';
import { getServerAdminToken } from '@/lib/backend-auth';

function getAdminToken(req: NextRequest): string {
  const cookie = req.cookies.get('admin_token')?.value || '';
  const bearer = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  return bearer || cookie;
}

export async function GET(req: NextRequest) {
  try {
    const token = getAdminToken(req) || (await getServerAdminToken()) || '';
    const { searchParams } = new URL(req.url);
    const query = searchParams.toString();
    const path = query ? `/admin/orders?${query}` : '/admin/orders?page=0&size=50';

    const res = await backendFetch(path, { method: 'GET' }, token ? { Authorization: `Bearer ${token}` } : {});
    const raw = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { success: false, detail: raw?.message || 'Failed to load orders' },
        { status: res.status }
      );
    }

    // Backend returns paginated: { content, totalElements, ... }
    const orders = (raw.content || raw.orders || raw || []).map(adaptOrder);
    return NextResponse.json({ success: true, orders, count: orders.length, total: raw.totalElements || orders.length });
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message }, { status: 502 });
  }
}
