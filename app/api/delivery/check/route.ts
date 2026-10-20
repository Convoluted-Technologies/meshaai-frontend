import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';

/**
 * POST /api/delivery/check
 * Proxy to POST /api/v1/delivery/check
 * Body: { latitude, longitude }
 * Returns: { serviceable, reason?, kitchenId?, kitchenName?, distanceKm?, deliveryFee?, mode? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { latitude, longitude } = body;

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { title: 'Missing Coordinates', detail: 'latitude and longitude are required.' },
        { status: 400 }
      );
    }

    const res = await backendFetch('/delivery/check', {
      method: 'POST',
      body: JSON.stringify({ latitude: Number(latitude), longitude: Number(longitude) }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { title: 'Delivery Check Failed', detail: data?.detail || data?.message || 'Unable to check delivery serviceability.' },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { title: 'Delivery Check Error', detail: err.message || 'Failed to check delivery serviceability' },
      { status: 502 }
    );
  }
}
