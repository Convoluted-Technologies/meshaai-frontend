'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PresetMeal, QuoteResponse, SelectedExtra } from '@/lib/types';
import { useRouter } from 'next/navigation';

export interface CartLineItem {
  qty: number;
  extras: SelectedExtra[];
}

export type SupportedCurrency = 'NGN' | 'USD' | 'GBP' | 'EUR' | 'CAD' | 'GHS' | 'KES';

// Currency symbols for fallback formatting only
const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
  CAD: 'CA$',
  GHS: 'GH₵',
  KES: 'KSh ',
};

export type LocationStatus =
  | 'idle'        // not yet requested
  | 'requesting'  // browser permission prompt showing
  | 'granted'     // have coords
  | 'denied'      // user denied
  | 'unavailable' // browser doesn't support / error
  | 'out_of_zone';// coords obtained but backend says out of zone

export type FulfillmentMode = 'NOW' | 'PRE_ORDER';

interface CartContextType {
  presets: PresetMeal[];
  loadingCatalog: boolean;
  backendWakingUp: boolean;
  cart: Record<string, CartLineItem>;
  totalCartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (presetId: string, qty: number, extras: SelectedExtra[]) => void;
  updateQuantity: (presetId: string, delta: number) => void;
  removeFromCart: (presetId: string) => void;
  clearCart: () => void;
  quote: QuoteResponse | null;
  quoteError: string;
  lat: number;
  lng: number;
  address: string;
  landmark: string;
  phone: string;
  note: string;
  setAddress: (val: string) => void;
  setLandmark: (val: string) => void;
  setPhone: (val: string) => void;
  setNote: (val: string) => void;
  setLat: (val: number) => void;
  setLng: (val: number) => void;
  setManualLocation: (lat: number, lng: number, address: string) => void;
  locationStatus: LocationStatus;
  requestLocation: () => void;
  fetchCatalog: (currencyOverride?: string) => void;
  handleCreateOrderAndPay: () => Promise<void>;
  isSubmitting: boolean;
  formatNGN: (kobo: number) => string;
  /** Returns the backend-formatted price string (e.g. "£3.50") for a preset by id,
   *  or falls back to kobo-based formatting if preset not found. */
  formatPrice: (kobo: number, presetId?: string) => string;
  currency: SupportedCurrency;
  setCurrency: (c: SupportedCurrency) => void;
  fulfillmentMode: FulfillmentMode;
  scheduledTime?: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const DEFAULT_LAT = 9.0765;
const DEFAULT_LNG = 7.3986;

const STORAGE_CART_KEY = 'meeshaai_cart_v2';
const STORAGE_LOC_KEY = 'meeshaai_loc_v2';
const STORAGE_CURRENCY_KEY = 'meeshaai_currency_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [presets, setPresets] = useState<PresetMeal[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Persistent cart in localStorage
  const [cart, setCart] = useState<Record<string, CartLineItem>>({});
  const [isCartOpen, setIsCartOpenState] = useState<boolean>(false);

  // Persistent location
  const [lat, setLat] = useState<number>(0);
  const [lng, setLng] = useState<number>(0);
  const [address, setAddress] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');

  // Fulfillment mode (NOW vs PRE_ORDER)
  const [fulfillmentMode, setFulfillmentMode] = useState<FulfillmentMode>('NOW');
  const [scheduledTime, setScheduledTime] = useState<string | undefined>(undefined);

  // Currency selection
  const [currency, setCurrencyState] = useState<SupportedCurrency>('NGN');

  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteError, setQuoteError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const latestQuoteId = React.useRef<string | null>(null);
  const [backendWakingUp, setBackendWakingUp] = useState<boolean>(false);

  // ── Load cached cart, location, and currency on mount ─────────────────────
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(STORAGE_CART_KEY);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
      const savedLoc = localStorage.getItem(STORAGE_LOC_KEY);
      if (savedLoc) {
        const parsed = JSON.parse(savedLoc);
        if (parsed.lat) setLat(parsed.lat);
        if (parsed.lng) setLng(parsed.lng);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.landmark) setLandmark(parsed.landmark);
        if (parsed.lat && parsed.lng) setLocationStatus('granted');
      }
      // Load saved currency preference and fetch catalog with it
      const savedCurr = localStorage.getItem(STORAGE_CURRENCY_KEY) as SupportedCurrency;
      if (savedCurr && CURRENCY_SYMBOLS[savedCurr]) {
        setCurrencyState(savedCurr);
        fetchCatalog(savedCurr);
      } else {
        // No saved preference — let backend resolve via geo-IP
        fetchCatalog();
      }
    } catch {
      fetchCatalog();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Save cart changes to localStorage ──────────────────────────────────────
  useEffect(() => {
    try { localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(cart)); } catch { }
  }, [cart]);

  // ── Save location changes to localStorage ──────────────────────────────────
  useEffect(() => {
    if (lat && lng) {
      try { localStorage.setItem(STORAGE_LOC_KEY, JSON.stringify({ lat, lng, address, landmark })); } catch { }
    }
  }, [lat, lng, address, landmark]);

  function setCurrency(c: SupportedCurrency) {
    setCurrencyState(c);
    try { localStorage.setItem(STORAGE_CURRENCY_KEY, c); } catch { }
    // Re-fetch catalog with the chosen currency so backend sends correct formatted prices
    fetchCatalog(c);
  }

  async function fetchCatalog(currencyOverride?: string) {
    setLoadingCatalog(true);
    setBackendWakingUp(false);
    const MAX_RETRIES = 3;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 30_000);
        const url = currencyOverride ? `/api/catalog?currency=${currencyOverride}` : '/api/catalog';
        const res = await fetch(url, { signal: controller.signal }).finally(() => clearTimeout(tid));
        const data = await res.json();
        if (data.presets && data.presets.length > 0) {
          setPresets(data.presets);
          // Auto-set currency from what the backend resolved (geo-IP or override)
          if (data.currency && CURRENCY_SYMBOLS[data.currency as SupportedCurrency]) {
            setCurrencyState(data.currency as SupportedCurrency);
            try { localStorage.setItem(STORAGE_CURRENCY_KEY, data.currency); } catch { }
          }
          setBackendWakingUp(false);
          setLoadingCatalog(false);
          return;
        }
        if (res.status === 504 || !data.presets) {
          setBackendWakingUp(true);
          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, 3000 * attempt));
            continue;
          }
        }
      } catch {
        if (attempt < MAX_RETRIES) {
          setBackendWakingUp(true);
          await new Promise((r) => setTimeout(r, 3000 * attempt));
          continue;
        }
      }
    }
    setLoadingCatalog(false);
  }

  // ── Location permission & GPS ─────────────────────────────────────────────
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      return;
    }
    setLocationStatus('requesting');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        setLocationStatus('granted');

        try {
          const res = await fetch('/api/delivery/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude }),
          });
          const data = await res.json();
          if (res.ok) {
            if (data.mode) setFulfillmentMode(data.mode);
            if (data.scheduledFor?.local) setScheduledTime(data.scheduledFor.local);

            if (data.serviceable === false) {
              const reason = data.reason || 'OUT_OF_ZONE';
              if (reason === 'OUT_OF_ZONE') {
                setLocationStatus('out_of_zone');
                setQuoteError("We don't deliver to your GPS location yet. You can still order — enter your address in checkout.");
              } else if (reason === 'KITCHEN_PAUSED') {
                setQuoteError('The kitchen near you is temporarily paused. Please check back shortly.');
              } else if (reason === 'ORDERING_PAUSED') {
                setQuoteError('Ordering is temporarily closed. Please check back soon.');
              }
            }
          }
        } catch { }
      },
      (error) => {
        console.error('Location error:', error);
        // Explicitly set denied so checkout remains disabled until user provides location
        setLocationStatus('denied');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, []);

  // Manual location setter (from Leaflet Map Picker)
  function setManualLocation(newLat: number, newLng: number, newAddress: string) {
    setLat(newLat);
    setLng(newLng);
    setAddress(newAddress);
    setLocationStatus('granted');
    try {
      localStorage.setItem(STORAGE_LOC_KEY, JSON.stringify({ lat: newLat, lng: newLng, address: newAddress, landmark }));
    } catch { }
  }

  const setIsCartOpen = useCallback((open: boolean) => {
    setIsCartOpenState(open);
    if (open && locationStatus === 'idle' && (!lat || !lng)) {
      requestLocation();
    }
  }, [locationStatus, lat, lng, requestLocation]);

  const totalCartCount = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);

  function addToCart(presetId: string, qty: number, extras: SelectedExtra[]) {
    if (qty <= 0) {
      setCart((prev) => { const c = { ...prev }; delete c[presetId]; return c; });
      return;
    }
    setCart((prev) => ({ ...prev, [presetId]: { qty, extras } }));
  }

  function updateQuantity(presetId: string, delta: number) {
    setCart((prev) => {
      const current = prev[presetId] || { qty: 0, extras: [] };
      const next = Math.max(0, current.qty + delta);
      if (next === 0) { const c = { ...prev }; delete c[presetId]; return c; }
      return { ...prev, [presetId]: { ...current, qty: next } };
    });
  }

  function removeFromCart(presetId: string) {
    setCart((prev) => { const c = { ...prev }; delete c[presetId]; return c; });
  }

  function clearCart() {
    setCart({});
    try {
      localStorage.removeItem(STORAGE_CART_KEY);
    } catch { }
  }

  // ── Debounced quote ───────────────────────────────────────────────────────
  useEffect(() => {
    const items = Object.entries(cart)
      .filter(([_, l]) => l.qty > 0)
      .map(([presetId, l]) => ({ presetId, qty: l.qty, extras: l.extras }));

    if (items.length === 0) { setQuote(null); setQuoteError(''); return; }

    // Don't run quote until we have coordinates
    if (!lat || !lng) { setQuote(null); return; }

    const timer = setTimeout(async () => {
      try {
        setQuoteError('');
        const res = await fetch('/api/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items, location: { lat, lng }, currency }),
        });
        const data = await res.json();
        if (res.ok && data.quote) {
          setQuote(data.quote);
          if (data.quoteId) latestQuoteId.current = data.quoteId;
          setLocationStatus((s) => s === 'out_of_zone' ? 'granted' : s);
        } else {
          setQuote(null);
          const errorCode = data.code || data.errorCode || '';
          if (errorCode === 'OUT_OF_ZONE') {
            setLocationStatus('out_of_zone');
            setQuoteError("We don't deliver to your current location yet. You can still place an order — just enter your address manually in checkout.");
          } else if (errorCode === 'KITCHEN_PAUSED') {
            setQuoteError('The kitchen serving your area is temporarily paused. Please check back shortly.');
          } else if (errorCode === 'ORDERING_PAUSED') {
            setQuoteError('Ordering is temporarily closed. Please check back soon.');
          } else if (errorCode === 'PRESET_NOT_FOUND' || errorCode === 'PRESET_UNAVAILABLE') {
            setQuoteError('One or more items in your cart is currently unavailable.');
          } else {
            setQuoteError(data.detail || data.title || 'Unable to calculate delivery quote.');
          }
        }
      } catch {
        setQuoteError('Network error calculating quote. Please try again.');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [cart, lat, lng, currency]);

  async function handleCreateOrderAndPay() {
    const items = Object.entries(cart)
      .filter(([_, l]) => l.qty > 0)
      .map(([presetId, l]) => ({ presetId, qty: l.qty, extras: l.extras }));

    if (items.length === 0) return;

    const resolvedLat = lat || DEFAULT_LAT;
    const resolvedLng = lng || DEFAULT_LNG;

    setIsSubmitting(true);
    try {
      const idempotencyKey = `idem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({
          phone,
          items,
          location: { lat: resolvedLat, lng: resolvedLng, address, landmark },
          note,
          ...(latestQuoteId.current ? { quoteId: latestQuoteId.current } : {}),
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        alert(orderData.detail || orderData.title || 'Failed to create order');
        setIsSubmitting(false);
        return;
      }
      const createdOrder = orderData.order;
      const payRes = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderCode: createdOrder.code }),
      });
      const payData = await payRes.json();
      if (payRes.ok && payData.checkoutUrl) {
        window.location.href = payData.checkoutUrl;
      } else {
        router.push(`/profile`);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Multi-currency price formatting ───────────────────────────────────────
  const formatNGN = useCallback((kobo: number) => `₦${(kobo / 100).toLocaleString()}`, []);

  /**
   * formatPrice: returns the backend-formatted price string.
   * Since presets already carry priceFormatted from the backend (geo-IP resolved),
   * we prefer that. The kobo param is a fallback for cart totals not tied to a preset.
   */
  const formatPrice = useCallback((kobo: number, presetId?: string) => {
    // If called with a presetId, find the preset and use its backend-formatted price
    if (presetId) {
      const preset = presets.find((p) => p.id === presetId);
      if (preset?.priceFormatted) return preset.priceFormatted;
    }
    // Fallback: format with current currency symbol
    const symbol = CURRENCY_SYMBOLS[currency] || '₦';
    if (currency === 'NGN') {
      return `${symbol}${(kobo / 100).toLocaleString()}`;
    }
    const val = kobo / 100;
    return `${symbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [presets, currency]);

  return (
    <CartContext.Provider value={{
      presets, loadingCatalog, backendWakingUp,
      cart, totalCartCount, isCartOpen, setIsCartOpen,
      addToCart, updateQuantity, removeFromCart, clearCart,
      quote, quoteError,
      lat, lng, address, landmark, phone, note,
      setAddress, setLandmark, setPhone, setNote, setLat, setLng,
      setManualLocation,
      locationStatus, requestLocation,
      fetchCatalog, handleCreateOrderAndPay, isSubmitting,
      formatNGN, formatPrice,
      currency, setCurrency,
      fulfillmentMode, scheduledTime,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
