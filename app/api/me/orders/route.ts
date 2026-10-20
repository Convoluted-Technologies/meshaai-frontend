import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, adaptOrder } from '@/lib/backend';

/**
 * GET /api/me/orders
 * Contract section 2.11: Authenticated customer order history.
 * Proxies to GET /api/v1/me/orders with the customer's Bearer token.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader) {
    return NextResponse.json(
      { title: 'Unauthorized', detail: 'Authentication required to view order history.' },
      { status: 401 }
    );
  }

  try {
    const res = await backendFetch('/me/orders', { method: 'GET' }, {
      Authorization: authHeader,
    });

    const raw = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { title: 'Order History Failed', detail: raw?.message || raw?.detail || 'Failed to load order history.' },
        { status: res.status }
      );
    }

    // Backend returns an array of OrderResponse objects
    const orders = Array.isArray(raw) ? raw.map(adaptOrder) : [];
    return NextResponse.json(orders);
  } catch (err: any) {
    console.error('[me/orders] error:', err);
    return NextResponse.json(
      { title: 'Order History Failed', detail: err.message || 'Failed to load order history' },
      { status: 502 }
    );
  }
}
