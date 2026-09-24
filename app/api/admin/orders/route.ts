import { NextRequest, NextResponse } from 'next/server';
import { getOrdersFromStore } from '@/lib/db/store';
import { checkAndExpireUnpaidOrders } from '@/lib/payments';

export async function GET(req: NextRequest) {
  // Trigger unpaid order expiry check on access
  checkAndExpireUnpaidOrders();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search')?.toLowerCase();

  let orders = getOrdersFromStore();

  if (status) {
    orders = orders.filter((o) => o.status === status);
  }

  if (search) {
    orders = orders.filter(
      (o) =>
        o.code.toLowerCase().includes(search) ||
        o.phone.includes(search) ||
        (o.location.address && o.location.address.toLowerCase().includes(search))
    );
  }

  return NextResponse.json({
    success: true,
    orders,
    count: orders.length,
  });
}
