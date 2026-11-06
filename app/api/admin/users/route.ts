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

// GET /api/admin/users?role=OPS&kitchenId=1
export async function GET(req: NextRequest) {
  try {
    const token = getAdminToken(req) || (await getServerAdminToken()) || '';
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') || '';
    const kitchenId = searchParams.get('kitchenId') || '';

    let path = '/admin/users?page=0&size=100';
    if (role) path += `&role=${role}`;
    if (kitchenId) path += `&kitchenId=${kitchenId}`;

    const h: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await backendFetch(path, { method: 'GET' }, h);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) return NextResponse.json({ users: [] }, { status: res.status });
    // Backend returns Page<AdminUserResponse> — extract content array
    const users = data.content || data.users || data || [];
    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ users: [], detail: err.message }, { status: 502 });
  }
}

// POST /api/admin/users — create OPS or SUPER_ADMIN user
export async function POST(req: NextRequest) {
  try {
    const token = getAdminToken(req) || (await getServerAdminToken()) || '';
    const h: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const body = await req.json();

    const res = await backendFetch('/admin/users', {
      method: 'POST',
      body: JSON.stringify(body),
    }, h);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { detail: data.detail || data.title || 'Failed to create user' },
        { status: res.status }
      );
    }
    return NextResponse.json({ user: data });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 502 });
  }
}
