import { NextResponse } from 'next/server';
import { getPaymentsFromStore, getRefundsFromStore } from '@/lib/db/store';

export async function GET() {
  const payments = getPaymentsFromStore();
  const refunds = getRefundsFromStore();

  return NextResponse.json({
    success: true,
    payments,
    refunds,
    count: payments.length,
  });
}
