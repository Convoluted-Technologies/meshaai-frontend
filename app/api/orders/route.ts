import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, adaptOrder } from '@/lib/backend';

export async function POST(req: NextRequest) {
  const idempotencyKey =
    req.headers.get('idempotency-key') ||
    req.headers.get('Idempotency-Key') ||
    req.headers.get('x-idempotency-key') ||
    `idem_${Date.now()}`;

  const authHeader = req.headers.get('authorization') || '';

  try {
    const body = await req.json();
    const { phone, name, items, location, note, quoteId: providedQuoteId } = body;

    if (!phone || !items || !Array.isArray(items) || items.length === 0 || !location) {
      return NextResponse.json(
        { title: 'Invalid Order Request', detail: 'Phone, items array, and delivery location are required.' },
        { status: 400 }
      );
    }

    // ── Step 1: get a fresh quoteId from backend if not already provided ──
    let quoteId = providedQuoteId;
    if (!quoteId) {
      const lines = items.map((item: any) => ({
        presetId: item.presetId,
        qty: item.qty,
        modifiers: (item.extras || [])
          .map((e: any) => ({ modifierId: e.extraId || e.id, qty: 1 }))
          .filter((m: any) => m.modifierId),
      }));

      const quoteRes = await backendFetch('/orders/quote', {
        method: 'POST',
        body: JSON.stringify({
          lines,
          latitude: location.lat,
          longitude: location.lng,
        }),
      });

      const quoteData = await quoteRes.json();
      if (!quoteRes.ok) {
        return NextResponse.json(
          { title: 'Quote Failed', detail: quoteData?.message || quoteData?.detail || 'Could not get delivery quote' },
          { status: quoteRes.status }
        );
      }
      quoteId = quoteData.quoteId;
    }

    // ── Step 2: create the order ──────────────────────────────────────────
    const orderBody = {
      quoteId,
      name: name || `Customer ${String(phone).slice(-4)}`,
      phone,
      location: location.address || `${location.lat},${location.lng}`,
      landmark: location.landmark || '',
      note: note || '',
    };

    const extraHeaders: Record<string, string> = { 'Idempotency-Key': idempotencyKey };
    if (authHeader) extraHeaders['Authorization'] = authHeader;

    const orderRes = await backendFetch('/orders', {
      method: 'POST',
      body: JSON.stringify(orderBody),
    }, extraHeaders);

    const orderData = await orderRes.json();

    if (!orderRes.ok) {
      return NextResponse.json(
        { title: 'Order Creation Failed', detail: orderData?.message || orderData?.detail || 'Unable to process order creation' },
        { status: orderRes.status }
      );
    }

    const order = adaptOrder(orderData);
    return NextResponse.json(
      { success: true, message: 'Order created successfully. Please proceed to payment.', order },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[orders POST] error:', err);
    return NextResponse.json(
      { title: 'Order Creation Failed', detail: err.message || 'Unable to process order creation' },
      { status: 502 }
    );
  }
}
