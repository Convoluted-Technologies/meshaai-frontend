import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, adaptQuote } from '@/lib/backend';
import { QuoteRequest } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as QuoteRequest;

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { title: 'Invalid Request Body', detail: 'Quote request must include at least one item.' },
        { status: 400 }
      );
    }

    const lat = body.location?.lat;
    const lng = body.location?.lng;

    if (lat === undefined || lng === undefined) {
      return NextResponse.json(
        { title: 'Missing Location', detail: 'Latitude and longitude are required.' },
        { status: 400 }
      );
    }

    // Map frontend SelectedExtra[] → backend modifiers [{ modifierId, qty }]
    const lines = body.items.map((item) => ({
      presetId: item.presetId,
      qty: item.qty,
      modifiers: (item.extras || []).map((e: any) => ({
        modifierId: e.extraId || e.id,
        qty: 1,
      })).filter((m: any) => m.modifierId),
    }));

    const backendBody = { lines, latitude: lat, longitude: lng };

    const res = await backendFetch('/orders/quote', {
      method: 'POST',
      body: JSON.stringify(backendBody),
    });

    const raw = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { title: 'Quote Failed', detail: raw?.message || raw?.detail || raw?.title || 'Failed to calculate quote' },
        { status: res.status }
      );
    }

    const quote = adaptQuote(raw);
    return NextResponse.json({ success: true, quote, quoteId: raw.quoteId });
  } catch (err: any) {
    console.error('[quote] error:', err);
    return NextResponse.json(
      { title: 'Quote Calculation Failed', detail: err.message || 'Failed to calculate quote' },
      { status: 502 }
    );
  }
}
