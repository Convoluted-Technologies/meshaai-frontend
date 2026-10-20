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
 * GET /api/admin/payments
 * Contract section 3: Payment transaction list.
 * Proxies to GET /api/v1/admin/payments.
 * Falls back to deriving payment records from orders if the endpoint is not yet live.
 */
export async function GET(req: NextRequest) {
  try {
    const token = getAdminToken(req) || (await getServerAdminToken()) || '';
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    const { searchParams } = new URL(req.url);
    const query = searchParams.toString();
    const path = query ? `/admin/payments?${query}` : '/admin/payments?page=0&size=50';

    const res = await backendFetch(path, { method: 'GET' }, headers);
    const raw = await res.json();

    if (res.ok) {
      // Backend returns Spring Page or plain array
      const payments = raw.content || raw.payments || raw || [];
      return NextResponse.json({
        success: true,
        payments,
        count: raw.totalElements ?? payments.length,
      });
    }

    // 404/405 → backend payments endpoint not yet implemented, derive from orders
    if (res.status === 404 || res.status === 405) {
      return derivePaymentsFromOrders(headers);
    }

    return NextResponse.json(
      { success: false, detail: raw?.message || raw?.detail || 'Failed to load payments' },
      { status: res.status }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message }, { status: 502 });
  }
}

async function derivePaymentsFromOrders(
  headers: Record<string, string>
): Promise<NextResponse> {
  try {
    const res = await backendFetch('/admin/orders?page=0&size=100', { method: 'GET' }, headers);
    const raw = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { success: false, detail: raw?.message || 'Failed to load payments' },
        { status: res.status }
      );
    }

    const paidStatuses = ['PAID', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const orders = raw.content || raw.orders || [];
    const payments = orders.map((o: any) => ({
      id: `pay_${o.id}`,
      txRef: `TX_${o.code}`,
      orderCode: o.code,
      amountKobo: o.total?.amountMinor || 0,
      currency: 'NGN',
      status: paidStatuses.includes(o.status)
        ? 'SUCCESSFUL'
        : o.status === 'REFUNDED'
        ? 'REFUNDED'
        : 'INITIATED',
      customerPhone: o.customerPhone,
      createdAt: o.createdAt,
      updatedAt: o.createdAt,
    }));

    return NextResponse.json({ success: true, payments, count: payments.length });
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message }, { status: 502 });
  }
}
