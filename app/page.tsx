'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PresetMeal, QuoteResponse } from '@/lib/types';
import Link from 'next/link';

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

  // Phone & Identity state
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
    <div className="space-y-12 pb-16">
      {/* HERO SECTION Inspired by Reference Image */}
      <section className="relative min-h-[580px] w-full overflow-hidden flex items-center justify-center bg-[#090d16]">
        {/* Full Bleed Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero_food.png"
            alt="Sizzling Gourmet Fried Egg & Toast"
            className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
          />
          {/* Deep Dark Vignette Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#090d16] via-[#090d16]/70 to-[#090d16]/85" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-transparent to-[#090d16]/60" />
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-7xl w-full mx-auto px-6 lg:px-12 py-16 flex flex-col justify-center">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-widest shadow-lg shadow-red-600/20">
              <span>🔥 Sizzle Your Senses</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.15]">
              Elevate Your Taste Buds —{' '}
              <span className="bg-gradient-to-r from-red-500 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                Gourmet Dining At Its Finest.
              </span>
            </h1>

            <p className="text-slate-200 text-base sm:text-lg font-medium leading-relaxed drop-shadow">
              Indulge in expertly fried eggs with diced sweet peppers, melted cheddar & sizzling beef sausages, served piping hot inside soft, pillow-fresh warm bread.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#menu"
                className="btn-crimson px-8 py-4 rounded-xl font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 text-white"
              >
                <span>Order Hot Meal Now</span>
                <span>→</span>
              </a>

              <Link
                href="/track"
                className="px-6 py-4 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-slate-200 hover:text-white font-bold text-sm transition-all backdrop-blur-md"
              >
                📍 Track Order
              </Link>
            </div>

            {/* Appetizing Highlights */}
            <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-slate-800/80 text-xs text-slate-300">
              <div className="flex items-center gap-2 font-semibold">
                <span className="text-red-500 text-base">🔥</span>
                <span>Freshly Fried in 5 Mins</span>
              </div>
              <div className="flex items-center gap-2 font-semibold">
                <span className="text-amber-400 text-base">🍳</span>
                <span>Free-Range Eggs & Cheese</span>
              </div>
              <div className="flex items-center gap-2 font-semibold">
                <span className="text-orange-400 text-base">🚚</span>
                <span>20-Min Doorstep Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATALOG & CHECKOUT SECTION */}
      <div id="menu" className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Preset Meal Cards List */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                <span>🍳 Signature Specials</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Handcrafted bread & egg combo meals made to order.
              </p>
            </div>
            <button
              onClick={fetchCatalog}
              className="text-xs text-slate-400 hover:text-red-400 transition-colors font-medium"
            >
              🔄 Refresh
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-72 glass-panel animate-pulse bg-slate-900/60 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {presets.map((preset) => {
                const qty = cart[preset.id] || 0;
                return (
                  <div
                    key={preset.id}
                    className={`glass-panel overflow-hidden transition-all border ${
                      qty > 0
                        ? 'border-red-500/60 ring-2 ring-red-500/20 shadow-xl shadow-red-500/10'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Food Image Container */}
                    <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                      <img
                        src={preset.imageUrl}
                        alt={preset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 bg-slate-950/90 backdrop-blur-md px-3 py-1 rounded-xl border border-red-500/40 font-black text-amber-400 text-sm shadow-md">
                        {formatNGN(preset.priceKobo)}
                      </div>
                      {!preset.isAvailable && (
                        <div className="absolute inset-0 bg-slate-950/85 flex items-center justify-center font-extrabold text-red-400 uppercase tracking-widest text-xs">
                          Sold Out
                        </div>
                      )}
                    </div>

                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="font-extrabold text-slate-100 text-base leading-snug">
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
                            className="text-[11px] bg-slate-900/90 text-amber-300/90 px-2.5 py-1 rounded-lg border border-slate-800 font-medium"
                          >
                            {c}
                          </span>
                        ))}
                      </div>

                      {/* Quantity Controls */}
                      <div className="pt-3 flex items-center justify-between border-t border-slate-800/80">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Select Qty</span>
                        <div className="flex items-center gap-2 bg-slate-950/80 rounded-xl p-1 border border-slate-800">
                          <button
                            onClick={() => updateQuantity(preset.id, -1)}
                            disabled={!preset.isAvailable || qty === 0}
                            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 font-extrabold flex items-center justify-center text-sm"
                          >
                            -
                          </button>
                          <span className="w-7 text-center font-mono font-bold text-amber-400 text-sm">
                            {qty}
                          </span>
                          <button
                            onClick={() => updateQuantity(preset.id, 1)}
                            disabled={!preset.isAvailable}
                            className="w-8 h-8 rounded-lg btn-crimson font-extrabold flex items-center justify-center text-sm"
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

        {/* Order Quote & Checkout Drawer */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 space-y-6 sticky top-24 border-red-500/20 shadow-2xl">
            <h2 className="text-lg font-extrabold text-white flex items-center justify-between border-b border-slate-800 pb-3">
              <span>🛒 Order Summary</span>
              <span className="text-xs text-red-400 font-mono font-bold uppercase">Server Quote</span>
            </h2>

            {/* Delivery Location & Landmark */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <label className="text-xs font-extrabold text-amber-400 uppercase tracking-wider block">
                📍 Delivery Location & Landmark
              </label>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Street address or Area (e.g. Yaba)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-red-500"
                />
                <input
                  type="text"
                  placeholder="Landmark (e.g. Opposite Domino Pizza)"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-red-500"
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
                  className="text-red-400 hover:underline font-semibold"
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
                  className="text-red-400 hover:underline font-semibold"
                >
                  Ikeja
                </button>
              </div>
            </div>

            {/* Customer Phone Identity */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                  📱 Customer Phone (Identity)
                </label>
                <button
                  type="button"
                  onClick={() => setIsOtpMode(!isOtpMode)}
                  className="text-[11px] text-slate-400 hover:text-red-400 underline"
                >
                  {isOtpMode ? 'Guest Checkout' : 'Login via OTP'}
                </button>
              </div>

              <input
                type="tel"
                placeholder="08012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-sm bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-red-500 font-mono"
              />

              {isOtpMode && !otpSent && (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-red-400 text-xs font-bold rounded-lg border border-slate-700"
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
                    className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
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
                className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-red-500"
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
                <div className="space-y-2 text-xs text-slate-300">
                  {quote.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>
                        {item.qty}× {item.presetName}
                      </span>
                      <span className="font-mono text-slate-100 font-bold">{formatNGN(item.totalKobo)}</span>
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
                  <span className="font-extrabold text-slate-100 text-sm">Grand Total</span>
                  <span className="font-black text-2xl text-amber-400 font-mono">
                    {formatNGN(quote.grandTotalKobo)}
                  </span>
                </div>
              </div>
            )}

            {/* Checkout Button */}
            <button
              onClick={handleCreateOrderAndPay}
              disabled={isSubmitting || !quote || !!quoteError}
              className="btn-crimson w-full py-4 font-black rounded-xl text-base uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span>Preparing Checkout...</span>
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
