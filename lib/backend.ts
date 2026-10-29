/**
 * lib/backend.ts
 * Central proxy client for the real Meeshaai backend at Meeshaai-mainframe.onrender.com
 * All Next.js API routes call this module instead of local lib/* functions.
 */

import { PresetMeal, QuoteResponse, Order, OrderItem } from '@/lib/types';

const BACKEND_URL = process.env.BACKEND_URL || 'https://Meeshaai-mainframe-744177391644.europe-west1.run.app';

// ── Passthrough proxy fetch ─────────────────────────────────────────────────

export async function backendFetch(
  path: string,
  options: RequestInit = {},
  extraHeaders: Record<string, string | undefined> = {}
): Promise<Response> {
  const url = `${BACKEND_URL}/api/v1${path}`;
  // Strip undefined values before creating headers
  const cleanExtra: Record<string, string> = {};
  for (const [k, v] of Object.entries(extraHeaders)) {
    if (v !== undefined) cleanExtra[k] = v;
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...cleanExtra,
  };

  // 25-second timeout — handles Render free-tier cold-starts (can take up to 60s,
  // but we fail fast and let the client retry rather than dropping the connection).
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25_000);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...headers,
        ...(options.headers as Record<string, string> | undefined),
      },
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      // Return a synthetic 504 so every route handler's try-catch stays clean
      return new Response(
        JSON.stringify({ message: 'Backend is waking up – please try again in a moment.' }),
        { status: 504, headers: { 'Content-Type': 'application/json' } }
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Backend response type definitions ──────────────────────────────────────

export interface BackendPriceDto {
  amountMinor: number;
  currency: string;
  formatted: string;
}

export interface BackendPresetModifier {
  id: string;
  name: string;
  unitPrice: BackendPriceDto;
  maxQuantity?: number;
  archived?: boolean;
}

export interface BackendPreset {
  id: string;
  name: string;
  description?: string;
  components?: string[];
  price?: BackendPriceDto;
  imageUrl?: string;
  modifiers?: BackendPresetModifier[];
  archived?: boolean;
  // basePrice used in admin preset schema
  basePrice?: number;
}

export interface BackendCatalogResponse {
  currency: string;
  resolutionMethod?: string;
  presets: BackendPreset[];
}

export interface BackendOrderItemModifier {
  modifierId: string;
  modifierName: string;
  unitPrice: BackendPriceDto;
  quantity: number;
  subtotal: BackendPriceDto;
}

export interface BackendOrderItem {
  presetId: string;
  presetName: string;
  unitPrice: BackendPriceDto;
  quantity: number;
  subtotal: BackendPriceDto;
  modifiers?: BackendOrderItemModifier[];
}

export interface BackendOrderResponse {
  id: number;
  code: string;
  quoteId?: string;
  customerName?: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryLandmark?: string;
  customerNote?: string;
  latitude?: number;
  longitude?: number;
  kitchenId?: number;
  kitchenName?: string;
  status: string;
  deliveryMode?: string;
  scheduledFor?: string;
  subtotal: BackendPriceDto;
  deliveryFee: BackendPriceDto;
  total: BackendPriceDto;
  items: BackendOrderItem[];
  createdAt: string;
}

export interface BackendQuoteLineResponse {
  presetId: string;
  name: string;
  qty: number;
  unitPrice: BackendPriceDto;
  subtotal: BackendPriceDto;
  modifiers?: Array<{
    modifierId: string;
    name: string;
    qty: number;
    unitPrice: BackendPriceDto;
    subtotal: BackendPriceDto;
  }>;
}

export interface BackendQuoteResponse {
  quoteId: string;
  lines: BackendQuoteLineResponse[];
  subtotal: BackendPriceDto;
  deliveryFee: BackendPriceDto;
  total: BackendPriceDto;
  deliveryDistanceKm?: number;
  isWithinZone?: boolean;
  zoneMessage?: string;
  expiresAt?: string;
}

// ── Response Adapters ───────────────────────────────────────────────────────

/**
 * Adapt backend CatalogResponse → { presets: PresetMeal[], quoteId? }
 * Maps price.amountMinor → priceKobo, modifiers → extras
 */
export function adaptCatalog(raw: BackendCatalogResponse): { presets: PresetMeal[] } {
  const now = new Date().toISOString();
  const presets: PresetMeal[] = (raw.presets || [])
    .filter((p) => !p.archived)
    .map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      components: p.components || [],
      priceKobo: p.price?.amountMinor ?? p.basePrice ?? 0,
      imageUrl: p.imageUrl || '',
      isAvailable: !p.archived,
      extras: (p.modifiers || [])
        .filter((m) => !m.archived)
        .map((m) => ({
          id: m.id,
          name: m.name,
          priceKobo: m.unitPrice?.amountMinor ?? 0,
        })),
      createdAt: now,
      updatedAt: now,
    }));
  return { presets };
}

/**
 * Adapt backend OrderResponse → frontend Order type
 */
export function adaptOrder(raw: BackendOrderResponse): Order {
  const now = new Date().toISOString();
  const items: OrderItem[] = (raw.items || []).map((i) => {
    const extrasTotalKobo = (i.modifiers || []).reduce(
      (s, m) => s + (m.subtotal?.amountMinor || 0),
      0
    );
    return {
      presetId: i.presetId,
      presetName: i.presetName,
      unitPriceKobo: i.unitPrice?.amountMinor ?? 0,
      qty: i.quantity,
      extras: (i.modifiers || []).map((m) => ({
        extraId: m.modifierId,
        name: m.modifierName,
        priceKobo: m.unitPrice?.amountMinor ?? 0,
      })),
      extrasTotalKobo,
      totalKobo: i.subtotal?.amountMinor ?? 0,
    };
  });

  return {
    id: String(raw.id),
    code: raw.code,
    phone: raw.customerPhone,
    customerId: undefined,
    items,
    subtotalKobo: raw.subtotal?.amountMinor ?? 0,
    deliveryFeeKobo: raw.deliveryFee?.amountMinor ?? 0,
    totalKobo: raw.total?.amountMinor ?? 0,
    location: {
      lat: raw.latitude ?? 0,
      lng: raw.longitude ?? 0,
      address: raw.deliveryAddress ?? '',
      landmark: raw.deliveryLandmark ?? '',
    },
    note: raw.customerNote,
    status: raw.status as any,
    paymentTxRef: `TX_${raw.code}`,
    auditTrail: [],
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.createdAt ?? now,
  };
}

/**
 * Adapt backend OrderQuoteResponse → frontend QuoteResponse
 */
export function adaptQuote(raw: BackendQuoteResponse): QuoteResponse & { quoteId: string } {
  return {
    quoteId: raw.quoteId,
    items: (raw.lines || []).map((l) => ({
      presetId: l.presetId,
      presetName: l.name,
      unitPriceKobo: l.unitPrice?.amountMinor ?? 0,
      qty: l.qty,
      extras: (l.modifiers || []).map((m) => ({
        extraId: m.modifierId,
        name: m.name,
        priceKobo: m.unitPrice?.amountMinor ?? 0,
      })),
      extrasTotalKobo: (l.modifiers || []).reduce(
        (s, m) => s + (m.subtotal?.amountMinor ?? 0),
        0
      ),
      totalKobo: l.subtotal?.amountMinor ?? 0,
    })),
    subtotalKobo: raw.subtotal?.amountMinor ?? 0,
    deliveryFeeKobo: raw.deliveryFee?.amountMinor ?? 0,
    grandTotalKobo: raw.total?.amountMinor ?? 0,
    deliveryDistanceKm: raw.deliveryDistanceKm,
    isWithinZone: raw.isWithinZone ?? true,
    zoneMessage: raw.zoneMessage,
  };
}
