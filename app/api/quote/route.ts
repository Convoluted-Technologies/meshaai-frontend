import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, APIError } from '@/lib/api/backendClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await backendFetch('/api/v1/orders/quote', {
      method: 'POST',
      body: JSON.stringify(body),
      skipAuth: true,
    });

    return NextResponse.json({
      quote: {
        items: data.items || [],
        subtotalKobo: data.subtotalKobo || data.subtotal?.amount || 0,
        deliveryFeeKobo: data.deliveryFeeKobo || data.deliveryFee?.amount || 0,
        grandTotalKobo: data.grandTotalKobo || data.total?.amount || 0,
        deliveryDistanceKm: data.deliveryDistanceKm || data.distanceKm,
        isWithinZone: data.isWithinZone ?? data.serviceable ?? true,
        zoneMessage: data.zoneMessage || data.reason,
      },
    });
  } catch (err: any) {
    if (err instanceof APIError) {
      return NextResponse.json(err.problem, { status: err.status });
    }
    return NextResponse.json(
      {
        type: 'https://meshaai.com/errors/quote-failed',
        title: 'Quote Calculation Error',
        status: 400,
        detail: err.message || 'Failed to calculate quote',
        code: 'QUOTE_FAILED',
      },
      { status: 400 }
    );
  }
}
