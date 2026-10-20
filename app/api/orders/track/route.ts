import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, adaptOrder } from '@/lib/backend';
import { getServerAdminToken } from '@/lib/backend-auth';

/**
 * GET /api/orders/track?code=MSH-XXXXX&phone=080...
 * Contract section 2.10: Order status polling endpoint.
 *
 * Primary:  GET /api/v1/orders/{code}/status  (public, lightweight)
 * Fallback: GET /api/v1/admin/orders?code=    (admin, full detail) — used only
 *           when the status endpoint returns insufficient data for the tracking UI.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = (searchParams.get('code') || '').toUpperCase();
  const phone = searchParams.get('phone') || '';

  if (!code || !phone) {
    return NextResponse.json(
      {
        title: 'Missing Parameters',
        detail: 'Both order code and phone number are required to track an order.',
      },
      { status: 400 }
    );
  }

  try {
    // ── Primary: public status endpoint (contract section 2.10) ──────────────
    const statusRes = await backendFetch(
      `/orders/${encodeURIComponent(code)}/status`
    );
    const statusData = await statusRes.json();

    if (!statusRes.ok) {
      const errorCode = statusData.code || statusData.errorCode || '';
      return NextResponse.json(
        {
          title: 'Order Not Found',
          detail: `No order found with code ${code}.`,
          code: errorCode || 'ORDER_NOT_FOUND',
        },
        { status: statusRes.status === 404 ? 404 : statusRes.status }
      );
    }

    // ── Fallback: admin search for full order detail ──────────────────────────
    // If the status response has enough data (items etc.) skip the admin call.
    // The status endpoint returns: { code, status, total, deliveryMode, paymentStatus }
    // which lacks items/address — we try the admin endpoint to get the full record.
    const adminToken = await getServerAdminToken();
    if (adminToken) {
      const searchRes = await backendFetch(
        `/admin/orders?code=${encodeURIComponent(code)}&page=0&size=5`,
        { method: 'GET' },
        { Authorization: `Bearer ${adminToken}` }
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const content = searchData.content || searchData.orders || [];
        if (content.length > 0) {
          // Verify phone matches (last 6 digits) — privacy guard
          const cleanInput = phone.replace(/\D/g, '');
          const rawOrder = content.find((o: any) => {
            const cleanOrder = (o.customerPhone || '').replace(/\D/g, '');
            return cleanOrder.endsWith(cleanInput.slice(-6));
          });
          if (rawOrder) {
            const order = adaptOrder(rawOrder);
            return NextResponse.json({ success: true, order });
          }
          // Order found but phone doesn't match — return 403
          return NextResponse.json(
            {
              title: 'Access Denied',
              detail: 'Phone number does not match the order record.',
              code: 'FORBIDDEN',
            },
            { status: 403 }
          );
        }
      }
    }

    // ── Build minimal order from status data alone ────────────────────────────
    const minimalOrder = {
      id: code,
      code: statusData.code || code,
      phone,
      items: [],
      subtotalKobo: 0,
      deliveryFeeKobo: 0,
      totalKobo: statusData.total?.amountMinor ?? statusData.totalMinor ?? 0,
      location: { lat: 0, lng: 0, address: '', landmark: '' },
      status: statusData.status,
      paymentStatus: statusData.paymentStatus,
      paymentTxRef: '',
      auditTrail: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, order: minimalOrder });
  } catch (err: any) {
    console.error('[orders/track] error:', err);
    return NextResponse.json(
      { title: 'Tracking Failed', detail: err.message || 'Failed to track order' },
      { status: 502 }
    );
  }
}
