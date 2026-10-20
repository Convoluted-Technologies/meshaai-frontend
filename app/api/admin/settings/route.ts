import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';
import { getServerAdminToken } from '@/lib/backend-auth';

function getAdminToken(req: NextRequest): string {
  return req.cookies.get('admin_token')?.value ||
    req.headers.get('authorization')?.replace('Bearer ', '') || '';
}

export async function GET(req: NextRequest) {
  try {
    const token = getAdminToken(req) || (await getServerAdminToken()) || '';
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await backendFetch('/admin/settings', { method: 'GET' }, headers);
    const raw = await res.json();
    if (!res.ok) {
      return NextResponse.json({ success: false, detail: raw?.message || 'Failed to load settings' }, { status: res.status });
    }
    return NextResponse.json({ success: true, settings: raw });
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message }, { status: 502 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = getAdminToken(req) || (await getServerAdminToken()) || '';
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const body = await req.json();

    // The admin page sends the entire settings object (e.g. { isOrderingPaused: true, ... }).
    // The backend contract (section 4.8) expects individual key/value PUT calls to
    // PUT /admin/settings/{key}. We iterate over every key in the payload and fan out.
    // Special case: isOrderingPaused maps to the dedicated ordering-pause toggle endpoint.
    if (typeof body === 'object' && !Array.isArray(body) && !('key' in body)) {
      const entries = Object.entries(body) as [string, unknown][];
      const results: Record<string, any> = {};

      for (const [key, value] of entries) {
        // Contract section 4.8: ordering pause has its own toggle endpoint
        if (key === 'isOrderingPaused') {
          const paused = Boolean(value);
          const res = await backendFetch(
            `/admin/settings/ordering-pause?paused=${paused}`,
            { method: 'PUT' },
            headers
          );
          results[key] = res.ok ? 'updated' : 'failed';
          continue;
        }
        const res = await backendFetch(`/admin/settings/${key}`, {
          method: 'PUT',
          body: JSON.stringify({ value: String(value) }),
        }, headers);
        results[key] = res.ok ? 'updated' : 'failed';
      }

      return NextResponse.json({ success: true, results });
    }

    // Single key/value update (explicit API call shape)
    const { key, value, description } = body;
    if (!key) {
      return NextResponse.json({ success: false, detail: 'Setting key is required' }, { status: 400 });
    }

    const res = await backendFetch(`/admin/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value: String(value), description }),
    }, headers);
    const raw = await res.json();
    if (!res.ok) {
      return NextResponse.json({ success: false, detail: raw?.message || 'Failed to update setting' }, { status: res.status });
    }
    return NextResponse.json({ success: true, setting: raw });
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message }, { status: 502 });
  }
}
