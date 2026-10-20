export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUNDED'
  | 'FAILED_DELIVERY';

export type AdminRole = 'SUPER_ADMIN' | 'OPS';

export interface PresetExtra {
  id: string;
  name: string;
  priceKobo: number;
}

export interface SelectedExtra {
  extraId: string;
  name: string;
  priceKobo: number;
}

export interface PresetMeal {
  id: string;
  name: string;
  description: string;
  components: string[];
  extras?: PresetExtra[];
  priceKobo: number;
  imageUrl: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PresetVersionHistory {
  versionId: string;
  timestamp: string;
  presetSnapshot: PresetMeal[];
  changeReason: string;
  changedBy: string;
}

export interface OrderItem {
  presetId: string;
  presetName: string;
  unitPriceKobo: number;
  qty: number;
  extras?: SelectedExtra[];
  extrasTotalKobo: number;
  totalKobo: number;
}

export interface OrderLocation {
  lat: number;
  lng: number;
  address: string;
  landmark: string;
  distanceKm?: number;
}

export interface RiderInfo {
  name: string;
  phone: string;
  assignedAt: string;
}

export interface DeliveryProof {
  code: string;
  verified: boolean;
  verifiedAt?: string;
}

export interface AuditTrail {
  id: string;
  fromState: OrderStatus | 'NONE';
  toState: OrderStatus;
  timestamp: string;
  actor: string;
  reason: string;
}

export interface Order {
  id: string;
  code: string;
  phone: string;
  customerId?: string;
  items: OrderItem[];
  subtotalKobo: number;
  deliveryFeeKobo: number;
  totalKobo: number;
  location: OrderLocation;
  note?: string;
  status: OrderStatus;
  paymentTxRef: string;
  idempotencyKey?: string;
  rider?: RiderInfo;
  deliveryProof?: DeliveryProof;
  auditTrail: AuditTrail[];
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus =
  | 'INITIATED'
  | 'SUCCESSFUL'
  | 'FAILED'
  | 'ABANDONED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export interface PaymentRecord {
  id: string;
  txRef: string;
  flwRef?: string;
  orderCode: string;
  amountKobo: number;
  currency: 'NGN';
  status: PaymentStatus;
  customerPhone: string;
  checkoutUrl?: string;
  paidAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface RefundRecord {
  id: string;
  paymentId: string;
  orderCode: string;
  amountKobo: number;
  reason: string;
  flwRefundId?: string;
  status: 'SUCCESS' | 'FAILED';
  createdAt: string;
}

export interface CustomerUser {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  savedLocations?: OrderLocation[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: AdminRole;
  passwordHash: string;
  createdAt: string;
}

export interface SystemSettings {
  shopName: string;
  isOrderingPaused: boolean;
  operatingHours: {
    open: string; // e.g. "07:00"
    close: string; // e.g. "22:00"
    daysOfWeek: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  };
  deliveryZone: {
    centerLat: number;
    centerLng: number;
    maxRadiusKm: number;
  };
  deliveryFee: {
    type: 'FLAT' | 'DISTANCE_BANDED';
    flatFeeKobo: number;
    baseDistanceKm: number;
    perKmKobo: number;
  };
  limits: {
    maxQtyPerLine: number;
    maxQtyPerOrder: number;
  };
  paymentExpiryMinutes: number;
}

export interface QuoteRequestItem {
  presetId: string;
  qty: number;
  extras?: SelectedExtra[];
}

export interface QuoteRequest {
  items: QuoteRequestItem[];
  location?: {
    lat: number;
    lng: number;
  };
}

export interface QuoteResponse {
  items: Array<{
    presetId: string;
    presetName: string;
    unitPriceKobo: number;
    qty: number;
    extras?: SelectedExtra[];
    extrasTotalKobo: number;
    totalKobo: number;
  }>;
  subtotalKobo: number;
  deliveryFeeKobo: number;
  grandTotalKobo: number;
  deliveryDistanceKm?: number;
  isWithinZone: boolean;
  zoneMessage?: string;
}

export interface RFCProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  errors?: Record<string, string[]>;
}
