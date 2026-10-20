'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PresetMeal, QuoteResponse, SelectedExtra } from '@/lib/types';
import { useRouter } from 'next/navigation';

export interface CartLineItem {
  qty: number;
  extras: SelectedExtra[];
}

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
  fetchCatalog: () => void;
  handleCreateOrderAndPay: () => Promise<void>;
  isSubmitting: boolean;
  formatNGN: (kobo: number) => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [presets, setPresets] = useState<PresetMeal[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Cart state: presetId -> CartLineItem
  const [cart, setCart] = useState<Record<string, CartLineItem>>({});
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Delivery Location state — no defaults; user must enter their address
  const [lat, setLat] = useState<number>(0);
  const [lng, setLng] = useState<number>(0);
  const [address, setAddress] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');

  // Phone & Identity state — no defaults
  const [phone, setPhone] = useState<string>('');
  const [note, setNote] = useState<string>('');

  // Quote State
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteError, setQuoteError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // Cache the last quoteId returned by the backend (required for order creation)
  const latestQuoteId = React.useRef<string | null>(null);
  // Track when the Render backend is cold-starting
  const [backendWakingUp, setBackendWakingUp] = useState<boolean>(false);

  useEffect(() => {
    fetchCatalog();
  }, []);

  async function fetchCatalog() {
    setLoadingCatalog(true);
    setBackendWakingUp(false);
    const MAX_RETRIES = 3;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Client-side 30s timeout to prevent browser "Failed to fetch"
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
        // 504 means the backend is still waking up
        if (res.status === 504 || !data.presets) {
          setBackendWakingUp(true);
          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, 3000 * attempt));
            continue;
          }
        }
      } catch (err: any) {
        // AbortError = our 30s client timeout hit; try again
        if (attempt < MAX_RETRIES) {
          setBackendWakingUp(true);
          await new Promise((r) => setTimeout(r, 3000 * attempt));
          continue;
        }
        console.error('Failed to load catalog after retries:', err);
      }
    }
    setLoadingCatalog(false);
  }

  const totalCartCount = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);

  // Add or replace a cart entry (called from the dish detail modal)
  function addToCart(presetId: string, qty: number, extras: SelectedExtra[]) {
    if (qty <= 0) {
      setCart((prev) => {
        const copy = { ...prev };
        delete copy[presetId];
        return copy;
      });
      return;
    }
    setCart((prev) => ({ ...prev, [presetId]: { qty, extras } }));
  }

  // +/- from cart drawer (keeps existing extras)
  function updateQuantity(presetId: string, delta: number) {
    setCart((prev) => {
      const current = prev[presetId] || { qty: 0, extras: [] };
      const next = Math.max(0, current.qty + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[presetId];
        return copy;
      }
      return { ...prev, [presetId]: { ...current, qty: next } };
    });
  }

  function removeFromCart(presetId: string) {
    setCart((prev) => {
      const copy = { ...prev };
      delete copy[presetId];
      return copy;
    });
  }

  // Debounced quote fetch
  useEffect(() => {
    const items = Object.entries(cart)
      .filter(([_, line]) => line.qty > 0)
      .map(([presetId, line]) => ({ presetId, qty: line.qty, extras: line.extras }));

    if (items.length === 0) {
      setQuote(null);
      setQuoteError('');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setQuoteError('');
        // Skip quote if coordinates haven't been set yet
        if (!lat || !lng) {
          setQuote(null);
          return;
        }
        const res = await fetch('/api/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items,
            location: { lat, lng },
          }),
        });
        const data = await res.json();
        if (res.ok && data.quote) {
          setQuote(data.quote);
          // Cache the backend quoteId for later use during order creation
          if (data.quoteId) latestQuoteId.current = data.quoteId;
        } else {
          setQuote(null);
          // Branch on error code per contract section 1.4
          const errorCode = data.code || data.errorCode || '';
          if (errorCode === 'OUT_OF_ZONE') {
            setQuoteError('Delivery is not currently available at this location.');
          } else if (errorCode === 'KITCHEN_PAUSED') {
            setQuoteError('The kitchen serving your area is temporarily paused. Please check back shortly.');
          } else if (errorCode === 'ORDERING_PAUSED') {
            setQuoteError('Ordering is temporarily closed for maintenance. Please check back soon.');
          } else if (errorCode === 'PRESET_NOT_FOUND' || errorCode === 'PRESET_UNAVAILABLE') {
            setQuoteError('One or more items in your cart is currently unavailable.');
          } else {
            setQuoteError(data.detail || data.title || 'Failed to calculate delivery quote');
          }
        }
      } catch (err: any) {
        setQuoteError('Server network error calculating quote');
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [cart, lat, lng]);

  async function handleCreateOrderAndPay() {
    if (!phone) {
      alert('Please enter your phone number to proceed with order');
      return;
    }

    const items = Object.entries(cart)
      .filter(([_, line]) => line.qty > 0)
      .map(([presetId, line]) => ({ presetId, qty: line.qty, extras: line.extras }));

    if (items.length === 0) {
      alert('Please select at least one preset meal');
      return;
    }

    setIsSubmitting(true);

    try {
      const idempotencyKey = `idem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          phone,
          items,
          location: {
            lat,
            lng,
            address,
            landmark,
          },
          note,
          // Pass the cached quoteId so the backend order route can skip re-quoting
          ...(latestQuoteId.current ? { quoteId: latestQuoteId.current } : {}),
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        const errorCode = orderData.code || orderData.errorCode || '';
        if (errorCode === 'QUOTE_EXPIRED') {
          alert('Your pricing quote has expired (15-min limit). We\'ve refreshed your cart.');
        } else if (errorCode === 'ORDERING_PAUSED') {
          alert('Ordering is temporarily closed for maintenance. Please check back soon.');
        } else {
          alert(orderData.detail || orderData.title || 'Failed to create order');
        }
        setIsSubmitting(false);
        return;
      }

      const createdOrder = orderData.order;

      // Initialize Flutterwave payment
      const payRes = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderCode: createdOrder.code }),
      });

      const payData = await payRes.json();
      if (payRes.ok && payData.checkoutUrl) {
        window.location.href = payData.checkoutUrl;
      } else {
        alert('Order created! Redirecting to tracker...');
        router.push(`/track?code=${createdOrder.code}&phone=${encodeURIComponent(phone)}`);
      }
    } catch (err: any) {
      alert('Error creating order: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const formatNGN = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

  return (
    <CartContext.Provider
      value={{
        presets,
        loadingCatalog,
        backendWakingUp,
        cart,
        totalCartCount,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        quote,
        quoteError,
        lat,
        lng,
        address,
        landmark,
        phone,
        note,
        setAddress,
        setLandmark,
        setPhone,
        setNote,
        setLat,
        setLng,
        fetchCatalog,
        handleCreateOrderAndPay,
        isSubmitting,
        formatNGN,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
