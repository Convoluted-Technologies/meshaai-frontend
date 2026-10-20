import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';

function getToken(req: NextRequest): string {
  return req.headers.get('authorization') || '';
}

/**
 * GET /api/me/locations
 * List saved delivery locations for the authenticated customer.
 * Proxies to GET /api/v1/me/locations
 */
export async function GET(req: NextRequest) {
  const auth = getToken(req);
  if (!auth) {
    return NextResponse.json({ title: 'Unauthorized', detail: 'Authentication required.' }, { status: 401 });
  }

  try {
    const res = await backendFetch('/me/locations', { method: 'GET' }, { Authorization: auth });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { title: 'Failed to load locations', detail: data?.detail || data?.message || 'Could not fetch saved locations.' },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ title: 'Error', detail: err.message }, { status: 502 });
  }
}

/**
 * POST /api/me/locations
 * Save a new delivery location for the authenticated customer.
 * Body: { label?, address, landmark?, latitude?, longitude? }
 * Proxies to POST /api/v1/me/locations
 */
export async function POST(req: NextRequest) {
  const auth = getToken(req);
  if (!auth) {
    return NextResponse.json({ title: 'Unauthorized', detail: 'Authentication required.' }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!body.address?.trim()) {
      return NextResponse.json(
        { title: 'Missing Field', detail: 'address is required to save a location.' },
        { status: 400 }
      );
    }

    const payload = {
      address: body.address.trim(),
      ...(body.label ? { label: String(body.label).slice(0, 64) } : {}),
      ...(body.landmark ? { landmark: body.landmark } : {}),
      ...(body.latitude !== undefined ? { latitude: Number(body.latitude) } : {}),
      ...(body.longitude !== undefined ? { longitude: Number(body.longitude) } : {}),
    };

    const res = await backendFetch('/me/locations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, { Authorization: auth });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { title: 'Failed to save location', detail: data?.detail || data?.message || 'Could not save location.' },
        { status: res.status }
      );
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ title: 'Error', detail: err.message }, { status: 502 });
  }
}
