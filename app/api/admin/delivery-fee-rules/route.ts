import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, APIError } from '@/lib/api/backendClient';

export async function GET(req: NextRequest) {
  try {
    const data = await backendFetch('/api/v1/admin/delivery-fee-rules', {
      method: 'GET',
    });
    return NextResponse.json({ rules: data.rules || data.content || data || [] });
  } catch (err: any) {
    if (err instanceof APIError) {
      return NextResponse.json(err.problem, { status: err.status });
    }
    // Fallback default sample fee rules for local demo
    return NextResponse.json({
      rules: [
        {
          id: 1,
          name: 'Abuja Wuse Tier 1 (0-3km)',
          type: 'DISTANCE_BAND',
          priority: 10,
          minDistanceKm: 0.0,
          maxDistanceKm: 3.0,
          feeAmount: 50000,
          currency: 'NGN',
          kitchenId: 1,
        },
        {
          id: 2,
          name: 'Abuja Wuse Tier 2 (3-7km)',
          type: 'DISTANCE_BAND',
          priority: 10,
          minDistanceKm: 3.0,
          maxDistanceKm: 7.0,
          feeAmount: 80000,
          currency: 'NGN',
          kitchenId: 1,
        },
        {
          id: 3,
          name: 'Sunday Lunch Free Delivery Promo',
          type: 'FREE_WINDOW',
          priority: 100,
          windowStart: '2026-10-04T12:00:00Z',
          windowEnd: '2026-10-04T15:00:00Z',
          feeAmount: 0,
          currency: 'NGN',
          kitchenId: 1,
        },
      ],
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await backendFetch('/api/v1/admin/delivery-fee-rules', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return NextResponse.json({ rule: data.rule || data });
  } catch (err: any) {
    if (err instanceof APIError) {
      return NextResponse.json(err.problem, { status: err.status });
    }
    return NextResponse.json({ title: 'Failed to create fee rule', detail: err.message, status: 400 }, { status: 400 });
  }
}
