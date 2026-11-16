import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';

function getToken(req: NextRequest): string {
  return req.headers.get('authorization') || '';
}

/**
 * GET /api/me/profile
 * Proxies to GET /api/v1/customer/profile (or /me/profile)
 */
export async function GET(req: NextRequest) {
  const auth = getToken(req);
  if (!auth) {
    return NextResponse.json({ title: 'Unauthorized', detail: 'Authentication required.' }, { status: 401 });
  }

  try {
    let res = await backendFetch('/customer/profile', { method: 'GET' }, { Authorization: auth });
    if (!res.ok && res.status === 404) {
      res = await backendFetch('/me/profile', { method: 'GET' }, { Authorization: auth });
    }
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ title: 'Error', detail: err.message }, { status: 502 });
  }
}

/**
 * PUT /api/me/profile
 * Updates customer profile: name, email, preferredCurrency
 */
export async function PUT(req: NextRequest) {
  const auth = getToken(req);
  if (!auth) {
    return NextResponse.json({ title: 'Unauthorized', detail: 'Authentication required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    let res = await backendFetch(
      '/customer/profile',
      {
        method: 'PUT',
        body: JSON.stringify(body),
      },
      { Authorization: auth }
    );

    if (!res.ok && res.status === 404) {
      res = await backendFetch(
        '/me/profile',
        {
          method: 'PUT',
          body: JSON.stringify(body),
        },
        { Authorization: auth }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ title: 'Error', detail: err.message }, { status: 502 });
  }
}
