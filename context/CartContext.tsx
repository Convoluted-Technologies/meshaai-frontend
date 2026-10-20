'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PresetMeal, QuoteResponse, SelectedExtra } from '@/lib/types';
import { useRouter } from 'next/navigation';

export interface CartLineItem {
  qty: number;
  extras: SelectedExtra[];
}

// ── Location state ────────────────────────────────────────────────────────────
export type LocationStatus =
  | 'idle'        // not yet requested
  | 'requesting'  // browser permission prompt showing
  | 'granted'     // have coords
  | 'denied'      // user denied
  | 'unavailable' // browser doesn't support / error
  | 'out_of_zone' // coords obtained but backend says out of zone

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
  locationStatus: LocationStatus;
  requestLocation: () => void;
  fetchCatalog: () => void;
  handleCreateOrderAndPay: () => Promise<void>;
  isSubmitting: boolean;
  formatNGN: (kobo: number) => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Central Lagos fallback — used when user denies or location is unavailable
const DEFAULT_LAT = 6.5244;
const DEFAULT_LNG = 3.3792;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [presets, setPresets] = useState<PresetMeal[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const [cart, setCart] = useState<Record<string, CartLineItem>>({});
  const [isCartOpen, setIsCartOpenState] = useState<boolean>(false);

  const [lat, setLat] = useState<number>(0);
  const [lng, setLng] = useState<number>(0);
  const [address, setAddress] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');

  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteError, setQuoteError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const latestQuoteId = React.useRef<string | null>(null);
  const [backendWakingUp, setBackendWakingUp] = useState<boolean>(false);

  useEffect(() => { fetchCatalog(); }, []);

  async function fetchCatalog() {
    setLoadingCatalog(true);
    setBackendWakingUp(false);
    const MAX_RETRIES = 3;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 30_000);
        const res = await fetch('/api/catalog', { signal: controller.signal }).finally(() => clearTimeout(tid));
        const data = await res.json();
        if (data.presets && data.presets.length > 0) {
          setPresets(data.presets);
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
      // Fall back to Lagos centre so quote can still run
      setLat(DEFAULT_LAT);
      setLng(DEFAULT_LNG);
      return;
    }
    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocationStatus('granted');
      },
      () => {
        // Denied or error — fall back to Lagos centre
        setLocationStatus('denied');
        setLat(DEFAULT_LAT);
        setLng(DEFAULT_LNG);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // Request location when cart opens (only once per session)
  const setIsCartOpen = useCallback((open: boolean) => {
    setIsCartOpenState(open);
    if (open && locationStatus === 'idle') {
      requestLocation();
    }
  }, [locationStatus, requestLocation]);

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

  // ── Debounced quote ───────────────────────────────────────────────────────
  useEffect(() => {
    const items = Object.entries(cart)
      .filter(([_, l]) => l.qty > 0)
      .map(([presetId, l]) => ({ presetId, qty: l.qty, extras: l.extras }));

    if (items.length === 0) { setQuote(null); setQuoteError(''); return; }

    // Don't run quote until we have coordinates (either real or fallback)
    if (!lat || !lng) { setQuote(null); return; }

    const timer = setTimeout(async () => {
      try {
        setQuoteError('');
        const res = await fetch('/api/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items, location: { lat, lng } }),
        });
        const data = await res.json();
        if (res.ok && data.quote) {
          setQuote(data.quote);
          if (data.quoteId) latestQuoteId.current = data.quoteId;
          // Clear out_of_zone status if quote succeeds
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
  }, [cart, lat, lng]);

  // ── Order + Pay (cart drawer path) ───────────────────────────────────────
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
        router.push(`/track?code=${createdOrder.code}&phone=${encodeURIComponent(phone)}`);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const formatNGN = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

  return (
    <CartContext.Provider value={{
      presets, loadingCatalog, backendWakingUp,
      cart, totalCartCount, isCartOpen, setIsCartOpen,
      addToCart, updateQuantity, removeFromCart,
      quote, quoteError,
      lat, lng, address, landmark, phone, note,
      setAddress, setLandmark, setPhone, setNote, setLat, setLng,
      locationStatus, requestLocation,
      fetchCatalog, handleCreateOrderAndPay, isSubmitting, formatNGN,
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
