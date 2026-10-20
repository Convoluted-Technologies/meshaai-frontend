import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';
import { getServerAdminToken } from '@/lib/backend-auth';

function getAdminToken(req: NextRequest): string {
  return (
    req.cookies.get('admin_token')?.value ||
    req.headers.get('authorization')?.replace('Bearer ', '') ||
    ''
  );
}

/**
 * PATCH /api/admin/customers/[id]/block
 * Contract section 4.2: Block or unblock a customer.
 *
 * The admin page calls this with { block: true|false }.
 * Contract endpoints:
 *   Block:   PUT /api/v1/admin/customers/{id}/block
 *   Unblock: PUT /api/v1/admin/customers/{id}/unblock
 *
 * [id] may be either a numeric customer ID or a phone number — both are
 * forwarded as-is; the backend resolves the customer.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const token = getAdminToken(req) || (await getServerAdminToken()) || '';
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const body = await req.json();
    const { block } = body;

    if (block === undefined) {
      return NextResponse.json(
        { success: false, detail: '`block` boolean is required.' },
        { status: 400 }
      );
    }

    // Contract: block → PUT /admin/customers/{id}/block
    //           unblock → PUT /admin/customers/{id}/unblock
    const action = Boolean(block) ? 'block' : 'unblock';
    const res = await backendFetch(`/admin/customers/${encodeURIComponent(id)}/${action}`, {
      method: 'PUT',
    }, headers);

    const raw = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { success: false, detail: raw?.detail || raw?.message || `Failed to ${action} customer` },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Customer ${id} ${action}ed successfully.`,
      customer: raw,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, detail: err.message || 'Unable to block/unblock customer' },
      { status: 502 }
    );
  }
}
