import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, APIError } from '@/lib/api/backendClient';

export async function GET(req: NextRequest) {
  try {
    const data = await backendFetch('/api/v1/admin/settings', {
      method: 'GET',
    });
    return NextResponse.json({ settings: data.settings || data });
  } catch (err: any) {
    return NextResponse.json({
      settings: {
        shopName: 'Meshaai Gourmet Egg & Toast',
        isOrderingPaused: false,
        operatingHours: { open: '06:00', close: '23:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
        deliveryZone: { centerLat: 9.0778, centerLng: 7.4819, maxRadiusKm: 25 },
        deliveryFee: { type: 'DISTANCE_BANDED', flatFeeKobo: 50000, baseDistanceKm: 5, perKmKobo: 10000 },
        limits: { maxQtyPerLine: 10, maxQtyPerOrder: 50 },
        paymentExpiryMinutes: 15,
      },
    });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { isOrderingPaused, pauseReason } = body;

    const data = await backendFetch('/api/v1/admin/settings/ordering-pause', {
      method: 'PUT',
      body: JSON.stringify({ paused: isOrderingPaused, reason: pauseReason }),
    });

    return NextResponse.json({ settings: data.settings || data });
  } catch (err: any) {
    if (err instanceof APIError) {
      return NextResponse.json(err.problem, { status: err.status });
    }
    return NextResponse.json({ title: 'Failed to update settings', detail: err.message, status: 400 }, { status: 400 });
  }
}
