import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';
import { getServerAdminToken } from '@/lib/backend-auth';

const BACKEND_BASE = process.env.BACKEND_URL || 'https://meshaai-mainframe-744177391644.europe-west1.run.app';

function getAdminToken(req: NextRequest): string {
  return (
    req.cookies.get('admin_token')?.value ||
    req.headers.get('authorization')?.replace('Bearer ', '') ||
    ''
  );
}

/** Convert a name to a valid backend slug: ^[a-z0-9-]+$ */
function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

/**
 * Direct fetch to backend modifier endpoint — bypasses backendFetch wrapper
 * to guarantee exact Content-Type and Authorization headers, no interference.
 */
async function modifierFetch(
  path: string,
  method: 'POST' | 'PUT',
  body: Record<string, any>,
  token: string
): Promise<Response> {
  const url = `${BACKEND_BASE}/api/v1${path}`;
  return fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const token = getAdminToken(req) || (await getServerAdminToken()) || '';
    const h: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    const [presetsRes, modifiersRes] = await Promise.all([
      backendFetch('/admin/presets', { method: 'GET' }, h),
      backendFetch('/admin/modifiers', { method: 'GET' }, h),
    ]);

    const rawPresets: any[] = presetsRes.ok ? await presetsRes.json() : [];
    const rawModifiers: any[] = modifiersRes.ok ? await modifiersRes.json() : [];

    const modById: Record<string, any> = {};
    for (const m of rawModifiers) modById[m.id] = m;

    const presets = rawPresets.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      components: p.components || [],
      priceKobo: typeof p.basePrice === 'number' ? p.basePrice : (p.price?.amountMinor ?? 0),
      imageUrl: p.imageUrl || '',
      isAvailable: !p.archived,
      extras: (p.allowedModifierIds || [])
        .map((mid: string) => {
          const m = modById[mid];
          if (!m || m.archived) return null;
          return {
            id: m.id,
            name: m.name,
            priceKobo: typeof m.unitPrice === 'object'
              ? (m.unitPrice?.amountMinor ?? 0)
              : Number(m.unitPrice ?? 0),
          };
        })
        .filter(Boolean),
      createdAt: p.createdAt || new Date().toISOString(),
      updatedAt: p.updatedAt || new Date().toISOString(),
    }));

    return NextResponse.json({ success: true, presets, versions: [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message }, { status: 502 });
  }
}

// ── Shared modifier upsert logic ─────────────────────────────────────────────
async function upsertExtras(
  extras: any[],
  token: string
): Promise<{ ids: string[]; error: string | null }> {
  const ids: string[] = [];

  for (const extra of extras) {
    if (!String(extra.name || '').trim()) continue;

    // kobo value — already stored as kobo in editingPreset.extras[].priceKobo
    const unitPrice = Math.round(Number(extra.priceKobo ?? 0));
    const maxQuantity = extra.maxQuantity ? Number(extra.maxQuantity) : 5;
    const isExisting = extra.id && !String(extra.id).startsWith('ext-');

    if (isExisting) {
      // Update existing modifier
      const body = {
        name: String(extra.name).trim().slice(0, 120),
        unitPrice,
        maxQuantity,
      };
      console.log(`[modifier] PUT ${extra.id}:`, JSON.stringify(body));
      const r = await modifierFetch(`/admin/modifiers/${extra.id}`, 'PUT', body, token);
      const raw = await r.json().catch(() => ({}));
      console.log(`[modifier] PUT ${extra.id} → ${r.status}:`, JSON.stringify(raw));
      ids.push(extra.id); // link regardless — update failure shouldn't block save
      continue;
    }

    // Create new modifier with unique slug id
    const modId = `${toSlug(extra.name)}-${Date.now().toString(36)}`;
    const body = {
      id: modId,
      name: String(extra.name).trim().slice(0, 120),
      unitPrice,
      maxQuantity,
    };
    console.log(`[modifier] POST new:`, JSON.stringify(body));
    const r = await modifierFetch('/admin/modifiers', 'POST', body, token);
    const raw = await r.json().catch(() => ({}));
    console.log(`[modifier] POST ${modId} → ${r.status}:`, JSON.stringify(raw));

    if (r.ok) {
      ids.push(modId);
    } else {
      const detail = raw?.detail || raw?.title || raw?.message || `HTTP ${r.status}`;
      return { ids, error: `Failed to save extra "${extra.name}": ${detail}` };
    }
  }

  return { ids, error: null };
}

// ── POST: create preset ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const token = getAdminToken(req) || (await getServerAdminToken()) || '';
    const h: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const body = await req.json();
    const { type = 'preset', ...data } = body;

    // Standalone modifier create
    if (type === 'modifier') {
      const mb = {
        id: data.id || `${toSlug(data.name)}-${Date.now().toString(36)}`,
        name: String(data.name).trim().slice(0, 120),
        unitPrice: Math.round(Number(data.unitPrice ?? data.priceKobo ?? 0)),
        maxQuantity: data.maxQuantity ? Number(data.maxQuantity) : 5,
      };
      const r = await modifierFetch('/admin/modifiers', 'POST', mb, token);
      const raw = await r.json().catch(() => ({}));
      if (!r.ok) return NextResponse.json({ success: false, detail: raw?.detail || raw?.message || 'Failed to create modifier' }, { status: r.status });
      return NextResponse.json({ success: true, data: raw });
    }

    // Step 1 — create extras as modifiers
    const validExtras: any[] = (data.extras || []).filter((e: any) => String(e.name || '').trim());
    const { ids: allowedModifierIds, error: extrasError } = await upsertExtras(validExtras, token);
    if (extrasError) return NextResponse.json({ success: false, detail: extrasError }, { status: 400 });

    // Step 2 — create preset
    const presetId = data.id || toSlug(data.name);
    const pb: Record<string, any> = { id: presetId, name: data.name };
    if (data.description) pb.description = data.description;
    if (Array.isArray(data.components) && data.components.length) pb.components = data.components;
    if (data.priceKobo !== undefined) pb.basePrice = Number(data.priceKobo);
    if (data.imageUrl && String(data.imageUrl).startsWith('http')) pb.imageUrl = data.imageUrl;
    if (allowedModifierIds.length > 0) pb.allowedModifierIds = allowedModifierIds;

    console.log(`[catalog POST] preset body:`, JSON.stringify(pb));
    const pr = await backendFetch('/admin/presets', { method: 'POST', body: JSON.stringify(pb) }, h);
    const pRaw = await pr.json();
    console.log(`[catalog POST] preset → ${pr.status}:`, JSON.stringify(pRaw));

    if (!pr.ok) {
      const violations = (pRaw?.properties?.errors || [])
        .map((e: any) => `${e?.field || ''}: ${e?.message || JSON.stringify(e)}`).join('\n');
      return NextResponse.json({
        success: false,
        detail: violations || pRaw?.detail || pRaw?.title || 'Failed to create preset',
        violations: pRaw?.properties?.errors,
      }, { status: pr.status });
    }

    return NextResponse.json({ success: true, data: pRaw });
  } catch (err: any) {
    console.error('[catalog POST] exception:', err);
    return NextResponse.json({ success: false, detail: err.message }, { status: 502 });
  }
}

// ── PUT: update preset ────────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const token = getAdminToken(req) || (await getServerAdminToken()) || '';
    const h: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const body = await req.json();
    const { type = 'preset', id, ...data } = body;

    // Standalone modifier update
    if (type === 'modifier') {
      const mb = {
        name: String(data.name).trim().slice(0, 120),
        unitPrice: Math.round(Number(data.unitPrice ?? data.priceKobo ?? 0)),
        maxQuantity: data.maxQuantity ? Number(data.maxQuantity) : 5,
      };
      const r = await modifierFetch(`/admin/modifiers/${id}`, 'PUT', mb, token);
      const raw = await r.json().catch(() => ({}));
      if (!r.ok) return NextResponse.json({ success: false, detail: raw?.detail || raw?.message || 'Failed to update modifier' }, { status: r.status });
      return NextResponse.json({ success: true, data: raw });
    }

    // Step 1 — upsert extras as modifiers
    const validExtras: any[] = (data.extras || []).filter((e: any) => String(e.name || '').trim());
    const { ids: allowedModifierIds, error: extrasError } = await upsertExtras(validExtras, token);
    if (extrasError) return NextResponse.json({ success: false, detail: extrasError }, { status: 400 });

    // Step 2 — update preset
    const pb: Record<string, any> = { name: data.name };
    if (data.description !== undefined) pb.description = data.description;
    if (Array.isArray(data.components)) pb.components = data.components;
    if (data.priceKobo !== undefined) pb.basePrice = Number(data.priceKobo);
    if (data.imageUrl && String(data.imageUrl).startsWith('http')) pb.imageUrl = data.imageUrl;
    pb.allowedModifierIds = allowedModifierIds; // always send — clears removed extras when empty

    console.log(`[catalog PUT] preset ${id} body:`, JSON.stringify(pb));
    const pr = await backendFetch(`/admin/presets/${id}`, { method: 'PUT', body: JSON.stringify(pb) }, h);
    const pRaw = await pr.json();
    console.log(`[catalog PUT] preset → ${pr.status}:`, JSON.stringify(pRaw));

    if (!pr.ok) {
      const violations = (pRaw?.properties?.errors || [])
        .map((e: any) => `${e?.field || ''}: ${e?.message || JSON.stringify(e)}`).join('\n');
      return NextResponse.json({
        success: false,
        detail: violations || pRaw?.detail || pRaw?.title || 'Failed to update preset',
        violations: pRaw?.properties?.errors,
      }, { status: pr.status });
    }

    return NextResponse.json({ success: true, data: pRaw });
  } catch (err: any) {
    console.error('[catalog PUT] exception:', err);
    return NextResponse.json({ success: false, detail: err.message }, { status: 502 });
  }
}

// ── PATCH: toggle availability ────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const token = getAdminToken(req) || (await getServerAdminToken()) || '';
    const h: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const { type = 'preset', id, isAvailable, archived } = await req.json();

    if (!id) return NextResponse.json({ success: false, detail: 'id is required' }, { status: 400 });

    const shouldArchive = archived === true || isAvailable === false;
    const path = type === 'modifier'
      ? `/admin/modifiers/${id}/archive?archived=${shouldArchive}`
      : `/admin/presets/${id}/archive?archived=${shouldArchive}`;

    const r = await backendFetch(path, { method: 'POST' }, h);
    const raw = await r.json();
    if (!r.ok) return NextResponse.json({ success: false, detail: raw?.detail || raw?.message || 'Failed' }, { status: r.status });
    return NextResponse.json({ success: true, data: raw });
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message }, { status: 502 });
  }
}

// ── DELETE: archive preset or modifier ───────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const token = getAdminToken(req) || (await getServerAdminToken()) || '';
    const h: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'preset';

    if (!id) return NextResponse.json({ success: false, detail: 'id is required' }, { status: 400 });

    const path = type === 'modifier' ? `/admin/modifiers/${id}` : `/admin/presets/${id}`;
    const r = await backendFetch(path, { method: 'DELETE' }, h);
    const raw = await r.json().catch(() => ({}));
    if (!r.ok) return NextResponse.json({ success: false, detail: raw?.detail || raw?.message || 'Failed to delete' }, { status: r.status });
    return NextResponse.json({ success: true, data: raw });
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message }, { status: 502 });
  }
}
