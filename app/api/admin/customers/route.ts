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
 * The backend does not expose a /admin/customers endpoint in this API version.
 * We derive a customer list from the orders list instead — grouping by phone number,
 * computing order count and total spend per customer.
 */
export async function GET(req: NextRequest) {
  try {
    const token = getAdminToken(req) || (await getServerAdminToken()) || '';
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    // Try the native endpoint first in case a future backend version adds it
    const res = await backendFetch('/admin/customers?page=0&size=50', { method: 'GET' }, headers);
    if (res.ok) {
      const raw = await res.json();
      const customers = raw.content || raw.customers || raw || [];
      return NextResponse.json({ success: true, customers, count: customers.length });
    }

    // 404 — backend doesn't have this endpoint yet. Derive from orders.
    return deriveCustomersFromOrders(headers);
  } catch (err: any) {
    return NextResponse.json({ success: false, customers: [], count: 0, detail: err.message }, { status: 200 });
  }
}

async function deriveCustomersFromOrders(
  headers: Record<string, string>
): Promise<NextResponse> {
  try {
    const res = await backendFetch('/admin/orders?page=0&size=200', { method: 'GET' }, headers);
    if (!res.ok) {
      // Return empty gracefully — don't 404 the admin page
      return NextResponse.json({ success: true, customers: [], count: 0 });
    }

    const raw = await res.json();
    const orders = raw.content || raw.orders || [];

    // Group orders by phone number to build customer records
    const customerMap = new Map<string, {
      id: string;
      name: string;
      phone: string;
      orderCount: number;
      totalSpentKobo: number;
      isBlocked: boolean;
      lastOrderAt: string;
    }>();

    const paidStatuses = ['PAID', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'REFUNDED'];

    for (const order of orders) {
      const phone = order.customerPhone || order.phone || 'Unknown';
      const amount = paidStatuses.includes(order.status)
        ? (order.total?.amountMinor || 0)
        : 0;

      if (customerMap.has(phone)) {
        const c = customerMap.get(phone)!;
        c.orderCount += 1;
        c.totalSpentKobo += amount;
        if (order.createdAt > c.lastOrderAt) c.lastOrderAt = order.createdAt;
      } else {
        customerMap.set(phone, {
          id: `cust_${phone}`,
          name: order.customerName || `Customer ${phone.slice(-4)}`,
          phone,
          orderCount: 1,
          totalSpentKobo: amount,
          isBlocked: false,
          lastOrderAt: order.createdAt || new Date().toISOString(),
        });
      }
    }

    const customers = Array.from(customerMap.values())
      .sort((a, b) => b.orderCount - a.orderCount);

    return NextResponse.json({ success: true, customers, count: customers.length });
  } catch (err: any) {
    // Always return 200 with empty list — never break the admin dashboard
    return NextResponse.json({ success: true, customers: [], count: 0 });
  }
}
