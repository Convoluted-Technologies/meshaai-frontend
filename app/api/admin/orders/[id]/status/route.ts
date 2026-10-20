import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, adaptOrder } from '@/lib/backend';
import { getServerAdminToken } from '@/lib/backend-auth';

function getAdminToken(req: NextRequest): string {
  return req.cookies.get('admin_token')?.value ||
    req.headers.get('authorization')?.replace('Bearer ', '') || '';
}

function authHeaders(token: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const token = getAdminToken(req) || (await getServerAdminToken()) || '';
    const body = await req.json();
    const { status: targetStatus, reason = 'Admin status update' } = body;

    const res = await backendFetch(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: targetStatus, reason }),
    }, authHeaders(token));
    const raw = await res.json();
    if (!res.ok) {
      return NextResponse.json({ success: false, detail: raw?.message || 'Failed to update status' }, { status: res.status });
    }
    return NextResponse.json({ success: true, order: adaptOrder(raw) });
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message }, { status: 502 });
  }
}
