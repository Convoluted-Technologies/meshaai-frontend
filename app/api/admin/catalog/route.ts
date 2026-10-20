import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';
import { getServerAdminToken } from '@/lib/backend-auth';

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

    // id → modifier lookup
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
          // unitPrice is a flat kobo integer in admin API responses
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

// ── POST: create preset (+ its extras as modifiers) ───────────────────────────
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
        name: String(data.name),
        unitPrice: Number(data.unitPrice ?? data.priceKobo ?? 0),
        ...(data.maxQuantity ? { maxQuantity: Number(data.maxQuantity) } : {}),
      };
      const r = await backendFetch('/admin/modifiers', { method: 'POST', body: JSON.stringify(mb) }, h);
      const raw = await r.json();
      if (!r.ok) return NextResponse.json({ success: false, detail: raw?.detail || raw?.message || 'Failed to create modifier' }, { status: r.status });
      return NextResponse.json({ success: true, data: raw });
    }

    // Step 1 — create modifiers for each extra
    const validExtras: any[] = (data.extras || []).filter((e: any) => String(e.name || '').trim());
    const allowedModifierIds: string[] = [];

    for (const extra of validExtras) {
      const unitPrice = Number(extra.priceKobo ?? 0);
      const isReal = extra.id && !String(extra.id).startsWith('ext-');

      if (isReal) {
        // Already a backend modifier — update price then link
        const upd = { name: String(extra.name).trim().slice(0, 120), unitPrice: Math.round(unitPrice) };
        const r = await backendFetch(`/admin/modifiers/${extra.id}`, { method: 'PUT', body: JSON.stringify(upd) }, h);
        const raw = await r.json().catch(() => ({}));
        console.log(`[catalog POST] PUT modifier ${extra.id} → ${r.status}:`, JSON.stringify(raw));
        allowedModifierIds.push(extra.id);
        continue;
      }

      // Build a unique id: slug + timestamp suffix
      const baseSlug = toSlug(extra.name);
      const modId = `${baseSlug}-${Date.now().toString(36)}`;
      // Ensure unitPrice is a strict integer — Spring Boot rejects floats for int64 fields
      const mb = {
        id: modId,
        name: String(extra.name).trim().slice(0, 120),
        unitPrice: Math.round(unitPrice),
      };
      const mbJson = JSON.stringify(mb);
      console.log(`[catalog POST] POST modifier body JSON:`, mbJson);
      const r = await backendFetch('/admin/modifiers', { method: 'POST', body: mbJson }, h);
      const raw = await r.json().catch(() => ({}));
      console.log(`[catalog POST] modifier ${modId} → ${r.status}:`, JSON.stringify(raw));
      if (r.ok) {
        allowedModifierIds.push(modId);
      } else {
        console.error(`[catalog POST] modifier create failed:`, JSON.stringify(raw));
        // Return error immediately so user knows what went wrong
        return NextResponse.json({
          success: false,
          detail: `Failed to save extra "${extra.name}": ${raw?.detail || raw?.title || raw?.message || `HTTP ${r.status}`}`,
        }, { status: 400 });
      }
    }

    // Step 2 — create the preset
    const presetId = data.id || toSlug(data.name);
    const pb: Record<string, any> = { id: presetId, name: data.name };
    if (data.description) pb.description = data.description;
    if (Array.isArray(data.components) && data.components.length) pb.components = data.components;
    if (data.priceKobo !== undefined) pb.basePrice = Number(data.priceKobo);
    if (data.imageUrl && String(data.imageUrl).startsWith('http')) pb.imageUrl = data.imageUrl;
    if (allowedModifierIds.length > 0) pb.allowedModifierIds = allowedModifierIds;

    console.log(`[catalog POST] POST preset:`, JSON.stringify(pb));
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

// ── PUT: update preset (+ upsert its extras) ──────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const token = getAdminToken(req) || (await getServerAdminToken()) || '';
    const h: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const body = await req.json();
    const { type = 'preset', id, ...data } = body;

    // Standalone modifier update
    if (type === 'modifier') {
      const mb = {
        name: String(data.name),
        unitPrice: Number(data.unitPrice ?? data.priceKobo ?? 0),
        ...(data.maxQuantity ? { maxQuantity: Number(data.maxQuantity) } : {}),
      };
      const r = await backendFetch(`/admin/modifiers/${id}`, { method: 'PUT', body: JSON.stringify(mb) }, h);
      const raw = await r.json();
      if (!r.ok) return NextResponse.json({ success: false, detail: raw?.detail || raw?.message || 'Failed to update modifier' }, { status: r.status });
      return NextResponse.json({ success: true, data: raw });
    }

    // Step 1 — upsert modifiers for each extra
    const validExtras: any[] = (data.extras || []).filter((e: any) => String(e.name || '').trim());
    const allowedModifierIds: string[] = [];

    for (const extra of validExtras) {
      const unitPrice = Number(extra.priceKobo ?? 0);
      const isReal = extra.id && !String(extra.id).startsWith('ext-');

      if (isReal) {
        // Existing modifier — update then link
        const upd = { name: String(extra.name).trim().slice(0, 120), unitPrice: Math.round(unitPrice) };
        const r = await backendFetch(`/admin/modifiers/${extra.id}`, { method: 'PUT', body: JSON.stringify(upd) }, h);
        const raw = await r.json().catch(() => ({}));
        console.log(`[catalog PUT] PUT modifier ${extra.id} → ${r.status}:`, JSON.stringify(raw));
        allowedModifierIds.push(extra.id);
        continue;
      }

      // New extra — create with unique id
      const baseSlug = toSlug(extra.name);
      const modId = `${baseSlug}-${Date.now().toString(36)}`;
      const mb = {
        id: modId,
        name: String(extra.name).trim().slice(0, 120),
        unitPrice: Math.round(unitPrice),
      };
      const mbJson = JSON.stringify(mb);
      console.log(`[catalog PUT] POST modifier body JSON:`, mbJson);
      const r = await backendFetch('/admin/modifiers', { method: 'POST', body: mbJson }, h);
      const raw = await r.json().catch(() => ({}));
      console.log(`[catalog PUT] modifier ${modId} → ${r.status}:`, JSON.stringify(raw));
      if (r.ok) {
        allowedModifierIds.push(modId);
      } else {
        console.error(`[catalog PUT] modifier create failed:`, JSON.stringify(raw));
        return NextResponse.json({
          success: false,
          detail: `Failed to save extra "${extra.name}": ${raw?.detail || raw?.title || raw?.message || `HTTP ${r.status}`}`,
        }, { status: 400 });
      }
    }

    // Step 2 — update the preset
    // PresetUpdateRequest: { name, description?, components?, basePrice?, imageUrl?, allowedModifierIds? }
    const pb: Record<string, any> = { name: data.name };
    if (data.description !== undefined) pb.description = data.description;
    if (Array.isArray(data.components)) pb.components = data.components;
    if (data.priceKobo !== undefined) pb.basePrice = Number(data.priceKobo);
    if (data.imageUrl && String(data.imageUrl).startsWith('http')) pb.imageUrl = data.imageUrl;
    pb.allowedModifierIds = allowedModifierIds; // always send (clears removed extras when empty)

    console.log(`[catalog PUT] PUT preset ${id}:`, JSON.stringify(pb));
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
