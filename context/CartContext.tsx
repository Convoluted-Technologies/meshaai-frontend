'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PresetMeal, QuoteResponse, DeliveryCheckResponse } from '@/lib/types';
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
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  deliveryCheck: DeliveryCheckResponse | null;
  checkingDelivery: boolean;
  checkDeliveryServiceability: (lat: number, lng: number) => Promise<void>;
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
  formatPrice: (amountKobo: number, currencyCode?: string) => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function getFallbackPresetImage(presetId: string): string {
  if (presetId.includes('sausage')) {
    return 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=800&auto=format&fit=crop&q=80';
  }
  if (presetId.includes('fish')) {
    return 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80';
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [presets, setPresets] = useState<PresetMeal[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('NGN');

  // Delivery check state
  const [deliveryCheck, setDeliveryCheck] = useState<DeliveryCheckResponse | null>(null);
  const [checkingDelivery, setCheckingDelivery] = useState<boolean>(false);

  // Cart state: presetId -> quantity
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Delivery Location state (Abuja Wuse 2)
  const [lat, setLat] = useState<number>(9.0778);
  const [lng, setLng] = useState<number>(7.4819);
  const [address, setAddress] = useState<string>('Plot 124 Aminu Kano Crescent, Wuse 2, Abuja');
  const [landmark, setLandmark] = useState<string>('Opposite KFC Wuse 2');

  // Phone & Identity state
  const [phone, setPhone] = useState<string>('+2348039276495');
  const [note, setNote] = useState<string>('Extra hot pepper sauce on the side please');

  // Quote State
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteError, setQuoteError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchCatalog();
  }, [selectedCurrency]);

  useEffect(() => {
    checkDeliveryServiceability(lat, lng);
  }, [lat, lng]);

  async function fetchCatalog() {
    setLoadingCatalog(true);
    try {
      const res = await fetch(`/api/catalog?currency=${selectedCurrency}`);
      const data = await res.json();
      
      const rawList = data.presets || (data.categories ? data.categories.flatMap((c: any) => c.items || []) : []);
      
      if (Array.isArray(rawList) && rawList.length > 0) {
        const normalized: PresetMeal[] = rawList.map((p: any) => {
          const rawPrice = typeof p.priceKobo === 'number' 
            ? p.priceKobo 
            : (p.price?.amount ?? p.basePrice?.amount ?? p.amountMinor ?? 150000);

          const img = (p.imageUrl && !p.imageUrl.includes('assets.meshaai.com'))
            ? p.imageUrl
            : getFallbackPresetImage(p.id || '');

          return {
            id: p.id,
            name: p.name,
            description: p.description || 'Delicious freshly prepared bread & egg special.',
            components: p.components || ['Artisan Bread', 'Farm Eggs'],
            priceKobo: rawPrice,
            imageUrl: img,
            isAvailable: p.available ?? p.isAvailable ?? true,
            createdAt: p.createdAt || new Date().toISOString(),
            updatedAt: p.updatedAt || new Date().toISOString(),
          };
        });
        setPresets(normalized);
      }
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setLoadingCatalog(false);
    }
  }

  async function checkDeliveryServiceability(targetLat: number, targetLng: number) {
    setCheckingDelivery(true);
    try {
      const res = await fetch('/api/delivery/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: targetLat, longitude: targetLng }),
      });
      const data = await res.json();
      setDeliveryCheck(data);
    } catch (err) {
      console.error('Failed delivery check:', err);
    } finally {
      setCheckingDelivery(false);
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

      // Initialize Flutterwave payment or redirect to tracking
      const payRes = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderCode: createdOrder.code }),
      });

      const payData = await payRes.json();
      if (payRes.ok && payData.checkoutUrl) {
        window.location.href = payData.checkoutUrl;
      } else {
        alert('Order created successfully! Redirecting to order tracker...');
        router.push(`/track?code=${createdOrder.code}&phone=${encodeURIComponent(phone)}`);
      }
    } catch (err: any) {
      alert('Error creating order: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const formatNGN = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

  const formatPrice = (amountKobo: number, currencyCode?: string) => {
    const code = currencyCode || selectedCurrency;
    const num = typeof amountKobo === 'number' && !isNaN(amountKobo) ? amountKobo : 0;
    const amount = num / 100;
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: code,
      }).format(amount);
    } catch (e) {
      return `${code} ${amount.toFixed(2)}`;
    }
  };

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
        selectedCurrency,
        setSelectedCurrency,
        deliveryCheck,
        checkingDelivery,
        checkDeliveryServiceability,
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
        formatPrice,
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
