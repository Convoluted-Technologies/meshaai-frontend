import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';
import { getServerAdminToken } from '@/lib/backend-auth';

function getAdminToken(req: NextRequest): string {
  return req.cookies.get('admin_token')?.value ||
    req.headers.get('authorization')?.replace('Bearer ', '') || '';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const txRef = searchParams.get('tx_ref');
  const code = txRef?.replace(/^TX_/, '').split('_')[0] || txRef || '';

  if (!code) {
    return NextResponse.json({ title: 'Missing tx_ref', detail: 'tx_ref query parameter is required' }, { status: 400 });
  }

  try {
    // Use order status endpoint
    const res = await backendFetch(`/orders/${encodeURIComponent(code)}/status`);
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ title: 'Not Found', detail: `No order found for ${code}` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      payment: null,
      orderStatus: data.status,
      orderCode: data.code || code,
    });
  } catch (err: any) {
    return NextResponse.json({ title: 'Error', detail: err.message }, { status: 502 });
  }
}
