'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PresetMeal, QuoteResponse } from '@/lib/types';

export default function CustomerHomePage() {
  const router = useRouter();
  const [presets, setPresets] = useState<PresetMeal[]>([]);
  const [loading, setLoading] = useState(true);

  // Cart state: presetId -> quantity
  const [cart, setCart] = useState<Record<string, number>>({});

  // Delivery Location state
  const [lat, setLat] = useState<number>(6.5244);
  const [lng, setLng] = useState<number>(3.3792);
  const [address, setAddress] = useState<string>('12 Commercial Avenue, Yaba, Lagos');
  const [landmark, setLandmark] = useState<string>('Opposite Domino Pizza');

  // Phone & Guest / OTP Auth state
  const [phone, setPhone] = useState<string>('08012345678');
  const [note, setNote] = useState<string>('Extra hot pepper sauce on the side please');
  const [isOtpMode, setIsOtpMode] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpDevHint, setOtpDevHint] = useState<string>('');

  // Quote State
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteError, setQuoteError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load catalog on mount
  useEffect(() => {
    fetchCatalog();
  }, []);

  async function fetchCatalog() {
    setLoading(true);
    try {
      const res = await fetch('/api/catalog');
      const data = await res.json();
      if (data.presets) {
        setPresets(data.presets);
        // Pre-select preset 1 with qty 1 for quick checkout
        if (data.presets.length > 0) {
          setCart({ [data.presets[0].id]: 1 });
        }
      }
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setLoading(false);
    }
  }

  // Recalculate quote whenever cart or location changes
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

  async function handleSendOTP() {
    if (!phone) return alert('Please enter phone number');
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        if (data.devOtp) setOtpDevHint(data.devOtp);
      } else {
        alert(data.detail || 'Failed to send OTP');
      }
    } catch (err) {
      alert('Network error sending OTP');
    }
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
        // Redirect to Flutterwave checkout (or mock checkout screen)
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
    <div className="space-y-8 pb-12">
      {/* Banner & Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950 via-slate-900 to-orange-950 p-6 sm:p-10 border border-amber-500/20 shadow-2xl">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <span>🔥 Fast Roadside Delivery in NGN</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Freshly Fried Eggs & Soft Warm Bread
          </h1>
          <p className="text-slate-300 text-sm sm:text-base">
            Pick your meal combo, share your landmark, and pay seamlessly via Flutterwave. Delivered piping hot to your doorstep in minutes.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Catalog Section */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-100">
              <span>🍳 Meal Presets</span>
              <span className="text-xs bg-slate-800 text-amber-400 px-2.5 py-0.5 rounded-full font-mono">
                {presets.length} active
              </span>
            </h2>
            <button
              onClick={fetchCatalog}
              className="text-xs text-slate-400 hover:text-amber-400 transition-colors"
            >
              🔄 Refresh Catalog
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-64 glass-panel animate-pulse bg-slate-800/40 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {presets.map((preset) => {
                const qty = cart[preset.id] || 0;
                return (
                  <div
                    key={preset.id}
                    className={`glass-panel overflow-hidden transition-all border ${
                      qty > 0 ? 'border-amber-500/60 ring-2 ring-amber-500/20 shadow-lg shadow-amber-500/10' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="relative h-40 w-full overflow-hidden bg-slate-900">
                      <img
                        src={preset.imageUrl}
                        alt={preset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 font-bold text-amber-400 text-sm">
                        {formatNGN(preset.priceKobo)}
                      </div>
                      {!preset.isAvailable && (
                        <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center font-bold text-red-400 uppercase tracking-widest text-xs">
                          Sold Out
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-bold text-slate-100 text-base leading-snug">
                          {preset.name}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                          {preset.description}
                        </p>
                      </div>

                      {/* Components tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {preset.components.map((c, i) => (
                          <span
                            key={i}
                            className="text-[11px] bg-slate-800/80 text-amber-300/90 px-2 py-0.5 rounded border border-slate-700/50"
                          >
                            {c}
                          </span>
                        ))}
                      </div>

                      {/* Quantity Controls */}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                        <span className="text-xs text-slate-400 font-medium">Quantity</span>
                        <div className="flex items-center gap-2 bg-slate-900/80 rounded-lg p-1 border border-slate-700/60">
                          <button
                            onClick={() => updateQuantity(preset.id, -1)}
                            disabled={!preset.isAvailable || qty === 0}
                            className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 font-bold flex items-center justify-center text-sm"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-mono font-bold text-amber-400 text-sm">
                            {qty}
                          </span>
                          <button
                            onClick={() => updateQuantity(preset.id, 1)}
                            disabled={!preset.isAvailable}
                            className="w-7 h-7 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quote & Checkout Drawer */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 space-y-6 sticky top-20">
            <h2 className="text-lg font-bold text-slate-100 flex items-center justify-between">
              <span>🛒 Order Summary</span>
              <span className="text-xs text-amber-400 font-mono">Server Quote</span>
            </h2>

            {/* Location & Delivery Zone Input */}
            <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <label className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
                📍 Delivery Location & Landmark
              </label>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Street address or Area (e.g. Yaba)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
                <input
                  type="text"
                  placeholder="Landmark (e.g. Opposite Domino Pizza)"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Preset Coordinates Quick Select */}
              <div className="flex gap-2 text-[11px] pt-1">
                <span className="text-slate-400">Quick zones:</span>
                <button
                  type="button"
                  onClick={() => {
                    setLat(6.5244);
                    setLng(3.3792);
                    setAddress('12 Commercial Avenue, Yaba');
                  }}
                  className="text-amber-400 hover:underline"
                >
                  Yaba (Base)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLat(6.6018);
                    setLng(3.3515);
                    setAddress('Allen Avenue, Ikeja');
                  }}
                  className="text-amber-400 hover:underline"
                >
                  Ikeja
                </button>
              </div>
            </div>

            {/* Phone Number & Customer Identity */}
            <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  📱 Phone Number (Identity)
                </label>
                <button
                  type="button"
                  onClick={() => setIsOtpMode(!isOtpMode)}
                  className="text-[11px] text-slate-400 hover:text-amber-400 underline"
                >
                  {isOtpMode ? 'Guest Checkout' : 'Login via OTP'}
                </button>
              </div>

              <input
                type="tel"
                placeholder="08012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
              />

              {isOtpMode && !otpSent && (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold rounded-lg border border-slate-700"
                >
                  Send OTP Code
                </button>
              )}

              {isOtpMode && otpSent && (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                  />
                  {otpDevHint && (
                    <p className="text-[10px] text-amber-400/80 font-mono">
                      Dev test code: {otpDevHint} (or 123456)
                    </p>
                  )}
                </div>
              )}

              <input
                type="text"
                placeholder="Optional delivery note / pepper preference"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Line Items Breakdown */}
            {quoteError && (
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs">
                ⚠️ {quoteError}
              </div>
            )}

            {quote && (
              <div className="space-y-3 border-t border-slate-800 pt-4">
                <div className="space-y-1.5 text-xs text-slate-300">
                  {quote.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>
                        {item.qty}× {item.presetName}
                      </span>
                      <span className="font-mono text-slate-200">{formatNGN(item.totalKobo)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5 text-xs border-t border-slate-800/80 pt-2 text-slate-400">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatNGN(quote.subtotalKobo)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee ({quote.deliveryDistanceKm} km)</span>
                    <span className="font-mono">{formatNGN(quote.deliveryFeeKobo)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-700 pt-3">
                  <span className="font-bold text-slate-100 text-sm">Grand Total</span>
                  <span className="font-extrabold text-xl text-amber-400 font-mono">
                    {formatNGN(quote.grandTotalKobo)}
                  </span>
                </div>
              </div>
            )}

            {/* Checkout Button */}
            <button
              onClick={handleCreateOrderAndPay}
              disabled={isSubmitting || !quote || !!quoteError}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-base flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Processing Order...</span>
              ) : (
                <>
                  <span>💳 Pay {quote ? formatNGN(quote.grandTotalKobo) : ''} via Flutterwave</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
