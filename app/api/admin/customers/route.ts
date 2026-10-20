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
 * GET /api/admin/customers
 * Contract section 4.2: Paginated customer list.
 * Proxies to GET /api/v1/admin/customers with optional ?search= and ?page= params.
 */
export async function GET(req: NextRequest) {
  try {
    const token = getAdminToken(req) || (await getServerAdminToken()) || '';
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = searchParams.get('page') || '0';
    const size = searchParams.get('size') || '20';

    const query = new URLSearchParams({ page, size });
    if (search) query.set('search', search);

    const res = await backendFetch(`/admin/customers?${query.toString()}`, { method: 'GET' }, headers);
    const raw = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { success: false, detail: raw?.message || raw?.detail || 'Failed to load customers' },
        { status: res.status }
      );
    }

    // Backend returns a Spring Page: { content: [...], totalElements, ... }
    const customers = raw.content || raw.customers || raw || [];
    return NextResponse.json({
      success: true,
      customers,
      count: raw.totalElements ?? customers.length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message }, { status: 502 });
  }
}
