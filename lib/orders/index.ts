import {
  getOrdersFromStore,
  saveOrderToStore,
  findOrderByCodeOrId,
  findOrderByCodeAndPhone,
  getPresetsFromStore,
  getSettingsFromStore,
  getIdempotentOrder,
  saveIdempotencyKey,
  isPhoneBlocked,
} from '@/lib/db/store';
import { validateDeliveryLocationAndFee, isOperatingHoursOpen } from '@/lib/location';
import {
  Order,
  OrderItem,
  OrderStatus,
  OrderLocation,
  AuditTrail,
  QuoteRequest,
  QuoteResponse,
} from '@/lib/types';
import { initiateRefundForOrder } from '@/lib/payments';

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['PAID', 'EXPIRED', 'CANCELLED'],
  PAID: ['CONFIRMED', 'CANCELLED', 'REFUNDED'],
  CONFIRMED: ['PREPARING', 'CANCELLED', 'REFUNDED'],
  PREPARING: ['OUT_FOR_DELIVERY', 'REFUNDED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED_DELIVERY'],
  DELIVERED: [],
  CANCELLED: [],
  EXPIRED: [],
  REFUNDED: [],
  FAILED_DELIVERY: ['OUT_FOR_DELIVERY', 'DELIVERED', 'REFUNDED'],
};

export function generateOrderCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = 'MSH-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateDeliveryOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function calculateOrderQuote(req: QuoteRequest): QuoteResponse {
  const settings = getSettingsFromStore();
  const presets = getPresetsFromStore();

  let subtotalKobo = 0;
  const items: QuoteResponse['items'] = [];

  for (const reqItem of req.items) {
    if (reqItem.qty <= 0) continue;
    if (reqItem.qty > settings.limits.maxQtyPerLine) {
      throw new Error(
        `Quantity for preset (${reqItem.qty}) exceeds max limit per line (${settings.limits.maxQtyPerLine}).`
      );
    }

    const preset = presets.find((p) => p.id === reqItem.presetId);
    if (!preset) {
      throw new Error(`Preset with ID ${reqItem.presetId} not found.`);
    }
    if (!preset.isAvailable) {
      throw new Error(`Preset "${preset.name}" is currently sold out / unavailable.`);
    }

    const extrasTotalKobo = (reqItem.extras || []).reduce((s, e) => s + e.priceKobo, 0);
    const totalKobo = (preset.priceKobo + extrasTotalKobo) * reqItem.qty;
    subtotalKobo += totalKobo;

    items.push({
      presetId: preset.id,
      presetName: preset.name,
      unitPriceKobo: preset.priceKobo,
      qty: reqItem.qty,
      extras: reqItem.extras || [],
      extrasTotalKobo,
      totalKobo,
    });
  }

  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  if (totalQty > settings.limits.maxQtyPerOrder) {
    throw new Error(
      `Total items (${totalQty}) exceeds max limit per order (${settings.limits.maxQtyPerOrder}).`
    );
  }

  const locationRes = validateDeliveryLocationAndFee(req.location?.lat, req.location?.lng);
  const deliveryFeeKobo = locationRes.deliveryFeeKobo;

  return {
    items,
    subtotalKobo,
    deliveryFeeKobo,
    grandTotalKobo: subtotalKobo + deliveryFeeKobo,
    deliveryDistanceKm: locationRes.distanceKm,
    isWithinZone: locationRes.isWithinZone,
    zoneMessage: locationRes.message,
  };
}

export function createOrder(params: {
  phone: string;
  items: Array<{ presetId: string; qty: number }>;
  location: OrderLocation;
  note?: string;
  customerId?: string;
  idempotencyKey?: string;
}): Order {
  // 1. Idempotency check
  if (params.idempotencyKey) {
    const existing = getIdempotentOrder(params.idempotencyKey);
    if (existing) {
      return existing;
    }
  }

  // 2. Check if phone is blocked
  if (isPhoneBlocked(params.phone)) {
    throw new Error('This phone number is restricted from placing orders.');
  }

  // 3. Operating hours & Kill-switch check
  const shopCheck = isOperatingHoursOpen();
  if (!shopCheck.isOpen) {
    throw new Error(shopCheck.reason || 'Ordering is currently closed.');
  }

  // 4. Calculate Quote & Verify Zone
  const quote = calculateOrderQuote({
    items: params.items,
    location: { lat: params.location.lat, lng: params.location.lng },
  });

  if (!quote.isWithinZone) {
    throw new Error(quote.zoneMessage || 'Location outside delivery zone.');
  }

  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const code = generateOrderCode();
  const now = new Date().toISOString();
  const txRef = `TX_${code}_${Date.now()}`;

  const orderItems: OrderItem[] = quote.items.map((i) => ({
    presetId: i.presetId,
    presetName: i.presetName,
    unitPriceKobo: i.unitPriceKobo,
    qty: i.qty,
    extras: i.extras || [],
    extrasTotalKobo: i.extrasTotalKobo,
    totalKobo: i.totalKobo,
  }));

  const initialAudit: AuditTrail = {
    id: `aud_${Date.now()}`,
    fromState: 'NONE',
    toState: 'PENDING_PAYMENT',
    timestamp: now,
    actor: params.customerId ? `CUSTOMER:${params.customerId}` : `GUEST:${params.phone}`,
    reason: 'Order created',
  };

  const deliveryProofCode = generateDeliveryOTP();

  const newOrder: Order = {
    id: orderId,
    code,
    phone: params.phone,
    customerId: params.customerId,
    items: orderItems,
    subtotalKobo: quote.subtotalKobo,
    deliveryFeeKobo: quote.deliveryFeeKobo,
    totalKobo: quote.grandTotalKobo,
    location: {
      ...params.location,
      distanceKm: quote.deliveryDistanceKm,
    },
    note: params.note,
    status: 'PENDING_PAYMENT',
    paymentTxRef: txRef,
    idempotencyKey: params.idempotencyKey,
    deliveryProof: {
      code: deliveryProofCode,
      verified: false,
    },
    auditTrail: [initialAudit],
    createdAt: now,
    updatedAt: now,
  };

  saveOrderToStore(newOrder);

  if (params.idempotencyKey) {
    saveIdempotencyKey(params.idempotencyKey, newOrder.id);
  }

  return newOrder;
}

export function transitionOrderStatus(
  orderIdOrCode: string,
  targetStatus: OrderStatus,
  actor: string,
  reason: string
): Order {
  const order = findOrderByCodeOrId(orderIdOrCode);
  if (!order) {
    throw new Error(`Order ${orderIdOrCode} not found.`);
  }

  const currentStatus = order.status;
  if (currentStatus === targetStatus) {
    return order;
  }

  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(targetStatus)) {
    throw new Error(
      `Cannot transition order from state "${currentStatus}" to "${targetStatus}".`
    );
  }

  const now = new Date().toISOString();
  const auditEntry: AuditTrail = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    fromState: currentStatus,
    toState: targetStatus,
    timestamp: now,
    actor,
    reason,
  };

  order.status = targetStatus;
  order.updatedAt = now;
  order.auditTrail.push(auditEntry);

  saveOrderToStore(order);
  return order;
}

export function cancelCustomerOrder(orderCode: string, phone: string, reason = 'Customer cancelled'): Order {
  const order = findOrderByCodeAndPhone(orderCode, phone);
  if (!order) {
    throw new Error(`Order ${orderCode} with provided phone number not found.`);
  }

  if (['PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status)) {
    throw new Error(`Order ${orderCode} is already in ${order.status} state and cannot be cancelled.`);
  }

  const previousStatus = order.status;
  const updatedOrder = transitionOrderStatus(
    order.id,
    'CANCELLED',
    `CUSTOMER:${phone}`,
    reason
  );

  // Auto refund if it was already paid or confirmed
  if (previousStatus === 'PAID' || previousStatus === 'CONFIRMED') {
    try {
      initiateRefundForOrder(order.id, order.totalKobo, `Automatic refund for customer cancellation`, `CUSTOMER:${phone}`);
      transitionOrderStatus(order.id, 'REFUNDED', 'SYSTEM', 'Auto-refund completed');
    } catch (err) {
      console.error(`Auto refund failed for order ${orderCode}:`, err);
    }
  }

  return updatedOrder;
}
