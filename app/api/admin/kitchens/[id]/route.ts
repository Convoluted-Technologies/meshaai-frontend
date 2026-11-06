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

export async function GET(req: NextRequest, ctx: RouteContext<'/api/admin/kitchens/[id]'>) {
  const { id } = await ctx.params;
  try {
    const token = getAdminToken(req) || (await getServerAdminToken()) || '';
    const h: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await backendFetch(`/admin/kitchens/${id}`, { method: 'GET' }, h);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ detail: data.detail || 'Not found' }, { status: res.status });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 502 });
  }
}

export async function PUT(req: NextRequest, ctx: RouteContext<'/api/admin/kitchens/[id]'>) {
  const { id } = await ctx.params;
  try {
    const token = getAdminToken(req) || (await getServerAdminToken()) || '';
    const h: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const body = await req.json();
    const res = await backendFetch(`/admin/kitchens/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }, h);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ detail: data.detail || 'Failed to update' }, { status: res.status });
    return NextResponse.json({ kitchen: data });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext<'/api/admin/kitchens/[id]'>) {
  const { id } = await ctx.params;
  try {
    const token = getAdminToken(req) || (await getServerAdminToken()) || '';
    const h: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await backendFetch(`/admin/kitchens/${id}`, { method: 'DELETE' }, h);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ detail: data.detail || 'Failed to delete' }, { status: res.status });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 502 });
  }
}

// PATCH /api/admin/kitchens/[id]?paused=true|false — proxies to /admin/kitchens/{id}/pause
export async function PATCH(req: NextRequest, ctx: RouteContext<'/api/admin/kitchens/[id]'>) {
  const { id } = await ctx.params;
  try {
    const token = getAdminToken(req) || (await getServerAdminToken()) || '';
    const h: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const { searchParams } = new URL(req.url);
    const paused = searchParams.get('paused') ?? 'true';

    const res = await backendFetch(`/admin/kitchens/${id}/pause?paused=${paused}`, {
      method: 'PUT',
    }, h);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ detail: data.detail || 'Failed to toggle pause' }, { status: res.status });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 502 });
  }
}
