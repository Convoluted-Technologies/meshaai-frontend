'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PresetMeal, QuoteResponse } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface CartContextType {
  presets: PresetMeal[];
  loadingCatalog: boolean;
  cart: Record<string, number>;
  totalCartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  updateQuantity: (presetId: string, delta: number) => void;
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

  // Cart state: presetId -> quantity
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Delivery Location state
  const [lat, setLat] = useState<number>(6.5244);
  const [lng, setLng] = useState<number>(3.3792);
  const [address, setAddress] = useState<string>('12 Commercial Avenue, Yaba, Lagos');
  const [landmark, setLandmark] = useState<string>('Opposite Domino Pizza');

  // Phone & Identity state
  const [phone, setPhone] = useState<string>('08012345678');
  const [note, setNote] = useState<string>('Extra hot pepper sauce on the side please');

  // Quote State
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteError, setQuoteError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchCatalog();
  }, []);

  async function fetchCatalog() {
    setLoadingCatalog(true);
    try {
      const res = await fetch('/api/catalog');
      const data = await res.json();
      if (data.presets) {
        setPresets(data.presets);
      }
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setLoadingCatalog(false);
    }
  }

  const totalCartCount = Object.values(cart).reduce((sum, q) => sum + q, 0);

  useEffect(() => {
    const items = Object.entries(cart)
      .filter(([_, qty]) => qty > 0)
      .map(([presetId, qty]) => ({ presetId, qty }));

    if (items.length === 0) {
      setQuote(null);
      setQuoteError('');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setQuoteError('');
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
        } else {
          setQuote(null);
          setQuoteError(data.detail || data.title || 'Failed to calculate quote');
        }
      } catch (err: any) {
        setQuoteError('Server network error calculating quote');
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [cart, lat, lng]);

  function updateQuantity(presetId: string, delta: number) {
    setCart((prev) => {
      const current = prev[presetId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[presetId];
        return copy;
      }
      return { ...prev, [presetId]: next };
    });
  }

  async function handleCreateOrderAndPay() {
    if (!phone) {
      alert('Please enter your phone number to proceed with order');
      return;
    }

    const items = Object.entries(cart)
      .filter(([_, qty]) => qty > 0)
      .map(([presetId, qty]) => ({ presetId, qty }));

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
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        alert(orderData.detail || orderData.title || 'Failed to create order');
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
        cart,
        totalCartCount,
        isCartOpen,
        setIsCartOpen,
        updateQuantity,
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
