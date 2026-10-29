import {
  findOrderByCodeOrId,
  saveOrderToStore,
  getPaymentsFromStore,
  savePaymentToStore,
  saveRefundToStore,
  getOrdersFromStore,
  getSettingsFromStore,
} from '@/lib/db/store';
import { transitionOrderStatus } from '@/lib/orders';
import { PaymentRecord, RefundRecord, Order } from '@/lib/types';

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY || 'FLWSECK_TEST-mock-key';
const FLW_SECRET_HASH = process.env.FLW_SECRET_HASH || 'Meeshaai-secret-hash';

export function getSecretHash(): string {
  return FLW_SECRET_HASH;
}

export async function initializeFlutterwavePayment(
  orderCodeOrId: string,
  hostOrigin?: string
): Promise<{ checkoutUrl: string; txRef: string; payment: PaymentRecord }> {
  const order = findOrderByCodeOrId(orderCodeOrId);
  if (!order) {
    throw new Error(`Order ${orderCodeOrId} not found`);
  }

  const txRef = order.paymentTxRef;
  const amountNGN = order.totalKobo / 100;
  const baseUrl = hostOrigin || 'http://localhost:3000';
  const redirectUrl = `${baseUrl}/profile?paid=1`;

  // Create payment record
  const existingPayments = getPaymentsFromStore();
  let payment = existingPayments.find((p) => p.txRef === txRef);

  let checkoutUrl = `${baseUrl}/checkout/mock?tx_ref=${txRef}&amount=${amountNGN}&code=${order.code}`;

  // Call Flutterwave API if real key present
  if (process.env.FLW_SECRET_KEY && !process.env.FLW_SECRET_KEY.includes('mock')) {
    try {
      const response = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_ref: txRef,
          amount: amountNGN,
          currency: 'NGN',
          redirect_url: redirectUrl,
          payment_options: 'card,banktransfer,ussd',
          customer: {
            email: `${order.phone.replace(/[^0-9]/g, '')}@Meeshaai.com`,
            phonenumber: order.phone,
            name: `Customer ${order.phone}`,
          },
          customizations: {
            title: `Meeshaai Order ${order.code}`,
            description: `Payment for bread & eggs preset order #${order.code}`,
            logo: `${baseUrl}/favicon.ico`,
          },
        }),
      });

      const data = await response.json();
      if (data.status === 'success' && data.data?.link) {
        checkoutUrl = data.data.link;
      }
    } catch (err) {
      console.warn('Flutterwave API call failed, falling back to mock checkout:', err);
    }
  }

  const now = new Date().toISOString();
  if (!payment) {
    payment = {
      id: `pay_${Date.now()}`,
      txRef,
      orderCode: order.code,
      amountKobo: order.totalKobo,
      currency: 'NGN',
      status: 'INITIATED',
      customerPhone: order.phone,
      checkoutUrl,
      createdAt: now,
      updatedAt: now,
    };
  } else {
    payment.checkoutUrl = checkoutUrl;
    payment.updatedAt = now;
  }

  savePaymentToStore(payment);

  return { checkoutUrl, txRef, payment };
}

export async function verifyAndProcessPayment(
  txRef: string,
  flwId?: string,
  claimedAmountNGN?: number
): Promise<{ success: boolean; message: string; order?: Order; payment?: PaymentRecord }> {
  const payments = getPaymentsFromStore();
  const payment = payments.find((p) => p.txRef === txRef);
  const order = findOrderByCodeOrId(txRef);

  if (!order) {
    return { success: false, message: `No order found matching transaction reference ${txRef}` };
  }

  const requiredAmountNGN = order.totalKobo / 100;

  // Real Flutterwave verification if flwId is supplied and live key exists
  let isValid = true;
  let verifiedFlwId = flwId || `flw_mock_${Date.now()}`;

  if (flwId && process.env.FLW_SECRET_KEY && !process.env.FLW_SECRET_KEY.includes('mock')) {
    try {
      const res = await fetch(`https://api.flutterwave.com/v3/transactions/${flwId}/verify`, {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      const flwData = await res.json();
      if (
        flwData.status === 'success' &&
        flwData.data.status === 'successful' &&
        flwData.data.currency === 'NGN' &&
        flwData.data.amount >= requiredAmountNGN
      ) {
        isValid = true;
        verifiedFlwId = String(flwData.data.id);
      } else {
        isValid = false;
      }
    } catch (err) {
      console.warn('Flutterwave verify API failed:', err);
    }
  } else if (claimedAmountNGN !== undefined && claimedAmountNGN < requiredAmountNGN) {
    isValid = false;
  }

  const now = new Date().toISOString();
  if (payment) {
    payment.flwRef = verifiedFlwId;
    payment.status = isValid ? 'SUCCESSFUL' : 'FAILED';
    payment.paidAt = isValid ? now : undefined;
    payment.updatedAt = now;
    savePaymentToStore(payment);
  }

  if (isValid) {
    if (order.status === 'PENDING_PAYMENT') {
      transitionOrderStatus(order.id, 'PAID', 'SYSTEM:FLW_WEBHOOK', 'Payment verified successfully');
    }
    return { success: true, message: 'Payment verified and order status updated to PAID', order, payment };
  } else {
    if (order.status === 'PENDING_PAYMENT') {
      transitionOrderStatus(order.id, 'CANCELLED', 'SYSTEM:FLW_WEBHOOK', 'Payment verification failed or insufficient amount');
    }
    return { success: false, message: 'Payment verification failed', order, payment };
  }
}

export async function initiateRefundForOrder(
  orderIdOrCode: string,
  amountKobo?: number,
  reason = 'Admin triggered refund',
  actor = 'ADMIN'
): Promise<RefundRecord> {
  const order = findOrderByCodeOrId(orderIdOrCode);
  if (!order) {
    throw new Error(`Order ${orderIdOrCode} not found`);
  }

  const payments = getPaymentsFromStore();
  const payment = payments.find((p) => p.txRef === order.paymentTxRef);
  if (!payment) {
    throw new Error(`No payment record found for order ${order.code}`);
  }

  const refundAmountKobo = amountKobo || order.totalKobo;
  const now = new Date().toISOString();
  let flwRefundId = `flw_ref_${Date.now()}`;

  // Call Flutterwave refund API if real payment reference exists
  if (payment.flwRef && process.env.FLW_SECRET_KEY && !process.env.FLW_SECRET_KEY.includes('mock')) {
    try {
      const res = await fetch(`https://api.flutterwave.com/v3/transactions/${payment.flwRef}/refund`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: refundAmountKobo / 100,
        }),
      });
      const data = await res.json();
      if (data.status === 'success' && data.data?.id) {
        flwRefundId = String(data.data.id);
      }
    } catch (err) {
      console.warn('Flutterwave refund API call failed:', err);
    }
  }

  const refundRecord: RefundRecord = {
    id: `ref_${Date.now()}`,
    paymentId: payment.id,
    orderCode: order.code,
    amountKobo: refundAmountKobo,
    reason,
    flwRefundId,
    status: 'SUCCESS',
    createdAt: now,
  };

  saveRefundToStore(refundRecord);

  payment.status = refundAmountKobo >= order.totalKobo ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
  payment.updatedAt = now;
  savePaymentToStore(payment);

  if (order.status !== 'REFUNDED' && order.status !== 'CANCELLED') {
    transitionOrderStatus(order.id, 'REFUNDED', actor, reason);
  }

  return refundRecord;
}

export function checkAndExpireUnpaidOrders(): Order[] {
  const settings = getSettingsFromStore();
  const expiryMs = settings.paymentExpiryMinutes * 60 * 1000;
  const now = Date.now();
  const orders = getOrdersFromStore();
  const expiredOrders: Order[] = [];

  for (const order of orders) {
    if (order.status === 'PENDING_PAYMENT') {
      const createdAtMs = new Date(order.createdAt).getTime();
      if (now - createdAtMs > expiryMs) {
        const expired = transitionOrderStatus(
          order.id,
          'EXPIRED',
          'SYSTEM:JOB',
          `Order expired after ${settings.paymentExpiryMinutes} minutes of non-payment`
        );
        expiredOrders.push(expired);
      }
    }
  }

  return expiredOrders;
}
