import { NextRequest, NextResponse } from 'next/server';
import { getCustomersFromStore, getOrdersFromStore, getBlockedPhonesFromStore } from '@/lib/db/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query')?.toLowerCase();

  const customers = getCustomersFromStore();
  const orders = getOrdersFromStore();
  const blockedPhones = getBlockedPhonesFromStore();

  const customerStats = customers.map((cust) => {
    const custOrders = orders.filter((o) => o.phone === cust.phone || o.customerId === cust.id);
    const totalSpentKobo = custOrders.reduce((sum, o) => (o.status === 'PAID' || o.status === 'DELIVERED' ? sum + o.totalKobo : sum), 0);
    const isBlocked = blockedPhones.includes(cust.phone.replace(/[^0-9]/g, ''));

    return {
      ...cust,
      orderCount: custOrders.length,
      totalSpentKobo,
      isBlocked,
    };
  });

  let filtered = customerStats;
  if (query) {
    filtered = customerStats.filter(
      (c) =>
        c.phone.includes(query) ||
        (c.name && c.name.toLowerCase().includes(query)) ||
        (c.email && c.email.toLowerCase().includes(query))
    );
  }

  return NextResponse.json({
    success: true,
    customers: filtered,
    blockedPhones,
    count: filtered.length,
  });
}
