import { NextResponse } from 'next/server';
import { getOrdersFromStore, getPaymentsFromStore, getRefundsFromStore } from '@/lib/db/store';

export async function GET() {
  const orders = getOrdersFromStore();
  const payments = getPaymentsFromStore();
  const refunds = getRefundsFromStore();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter((o) => o.createdAt.startsWith(todayStr));

  const totalRevenueKobo = orders.reduce((sum, o) => {
    if (['PAID', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.status)) {
      return sum + o.totalKobo;
    }
    return sum;
  }, 0);

  const todayRevenueKobo = todayOrders.reduce((sum, o) => {
    if (['PAID', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.status)) {
      return sum + o.totalKobo;
    }
    return sum;
  }, 0);

  const pendingCount = orders.filter((o) => o.status === 'PENDING_PAYMENT').length;
  const paidCount = orders.filter((o) => o.status === 'PAID').length;
  const preparingCount = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PREPARING').length;
  const outForDeliveryCount = orders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const cancelledCount = orders.filter((o) => o.status === 'CANCELLED').length;
  const failedCount = orders.filter((o) => o.status === 'FAILED_DELIVERY').length;
  const refundedCount = orders.filter((o) => o.status === 'REFUNDED').length;

  return NextResponse.json({
    success: true,
    metrics: {
      totalOrdersCount: orders.length,
      todayOrdersCount: todayOrders.length,
      totalRevenueKobo,
      todayRevenueKobo,
      countsByStatus: {
        PENDING_PAYMENT: pendingCount,
        PAID: paidCount,
        PREPARING: preparingCount,
        OUT_FOR_DELIVERY: outForDeliveryCount,
        DELIVERED: deliveredCount,
        CANCELLED: cancelledCount,
        FAILED_DELIVERY: failedCount,
        REFUNDED: refundedCount,
      },
      refundsCount: refunds.length,
      paymentsCount: payments.length,
    },
  });
}
