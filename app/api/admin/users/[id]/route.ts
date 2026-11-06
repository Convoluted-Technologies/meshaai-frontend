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

// DELETE /api/admin/users/[id] — soft-deactivate user
export async function DELETE(req: NextRequest, ctx: RouteContext<'/api/admin/users/[id]'>) {
  const { id } = await ctx.params;
  try {
    const token = getAdminToken(req) || (await getServerAdminToken()) || '';
    const h: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await backendFetch(`/admin/users/${id}`, {
      method: 'DELETE',
    }, h);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { detail: data.detail || data.title || 'Failed to deactivate user' },
        { status: res.status }
      );
    }
    return NextResponse.json({ user: data });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 502 });
  }
}
