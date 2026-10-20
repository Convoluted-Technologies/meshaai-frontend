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
 * GET /api/admin/dashboard
 * Contract section 4.1: Admin dashboard metrics.
 * Proxies directly to GET /api/v1/admin/dashboard.
 * Falls back to computing metrics from orders if the backend endpoint is not yet live.
 */
export async function GET(req: NextRequest) {
  try {
    const token = getAdminToken(req) || (await getServerAdminToken()) || '';
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await backendFetch('/admin/dashboard', { method: 'GET' }, headers);
    const raw = await res.json();

    if (res.ok) {
      // Backend may return the metrics object directly or wrapped
      const metrics = raw.metrics || raw;
      return NextResponse.json({ success: true, metrics });
    }

    // 404 means the backend dashboard endpoint isn't implemented yet — fall back
    // to deriving metrics from the orders list so the admin UI still works.
    if (res.status === 404 || res.status === 405) {
      return computeMetricsFromOrders(headers);
    }
    return NextResponse.json(
      { success: false, detail: raw?.message || raw?.detail || 'Failed to load dashboard' },
      { status: res.status }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message }, { status: 502 });
  }
}

async function computeMetricsFromOrders(
  headers: Record<string, string>
): Promise<NextResponse> {
  try {
    const res = await backendFetch('/admin/orders?page=0&size=200', { method: 'GET' }, headers);
    const raw = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { success: false, detail: raw?.message || 'Failed to load dashboard' },
        { status: res.status }
      );
    }

    const orders = raw.content || raw.orders || [];
    const todayStr = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter((o: any) => (o.createdAt || '').startsWith(todayStr));
    const paidStatuses = ['PAID', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];

    const totalRevenueKobo = orders
      .filter((o: any) => paidStatuses.includes(o.status))
      .reduce((s: number, o: any) => s + (o.total?.amountMinor || 0), 0);
    const todayRevenueKobo = todayOrders
      .filter((o: any) => paidStatuses.includes(o.status))
      .reduce((s: number, o: any) => s + (o.total?.amountMinor || 0), 0);

    const countByStatus = (status: string) =>
      orders.filter((o: any) => o.status === status).length;

    return NextResponse.json({
      success: true,
      metrics: {
        totalOrdersCount: raw.totalElements || orders.length,
        todayOrdersCount: todayOrders.length,
        totalRevenueKobo,
        todayRevenueKobo,
        countsByStatus: {
          PENDING_PAYMENT: countByStatus('PENDING_PAYMENT'),
          PAID: countByStatus('PAID'),
          CONFIRMED: countByStatus('CONFIRMED'),
          PREPARING: countByStatus('PREPARING'),
          OUT_FOR_DELIVERY: countByStatus('OUT_FOR_DELIVERY'),
          DELIVERED: countByStatus('DELIVERED'),
          CANCELLED: countByStatus('CANCELLED'),
          REFUNDED: countByStatus('REFUNDED'),
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message }, { status: 502 });
  }
}
