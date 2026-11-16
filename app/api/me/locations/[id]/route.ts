import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';

function getToken(req: NextRequest): string {
  return req.headers.get('authorization') || '';
}

/**
 * DELETE /api/me/locations/[id]
 * Deletes a delivery location for the authenticated customer.
 * Proxies to DELETE /api/v1/customer/addresses/{id} or /me/locations/{id}
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = getToken(req);
  if (!auth) {
    return NextResponse.json({ title: 'Unauthorized', detail: 'Authentication required.' }, { status: 401 });
  }

  try {
    let res = await backendFetch(`/customer/addresses/${id}`, { method: 'DELETE' }, { Authorization: auth });
    if (!res.ok && res.status === 404) {
      res = await backendFetch(`/me/locations/${id}`, { method: 'DELETE' }, { Authorization: auth });
    }

    if (res.status === 204 || res.ok) {
      return NextResponse.json({ success: true, message: 'Address removed successfully.' });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(
      { title: 'Failed to delete location', detail: data?.detail || data?.message || 'Could not delete location.' },
      { status: res.status }
    );
  } catch (err: any) {
    return NextResponse.json({ title: 'Error', detail: err.message }, { status: 502 });
  }
}
