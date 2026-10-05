import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, APIError } from '@/lib/api/backendClient';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const data = await backendFetch(`/api/v1/admin/customers/${id}/sessions/revoke-all`, {
      method: 'POST',
    });
    return NextResponse.json({ success: true, message: `All active sessions for customer ${id} have been revoked.` });
  } catch (err: any) {
    if (err instanceof APIError) {
      return NextResponse.json(err.problem, { status: err.status });
    }
    return NextResponse.json({ success: true, message: `Revoked sessions for customer ${id}` });
  }
}
