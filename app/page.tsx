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
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

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

  // Calculate total item count in cart
  const totalCartCount = Object.values(cart).reduce((sum, q) => sum + q, 0);

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
    <div className="relative space-y-16 pb-20 bg-white text-slate-900">
      {/* Floating Header Bar Overlay with Cart Trigger */}
      <div className="fixed top-3 right-6 lg:right-12 z-50 flex items-center gap-3">
        <button
          onClick={() => setIsCartOpen(true)}
          className="btn-crimson px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-red-600/30 border border-red-500/40"
        >
          <span>🛒 Cart</span>
          {totalCartCount > 0 && (
            <span className="bg-white text-red-700 px-2 py-0.5 rounded-full font-black text-[11px] font-mono">
              {totalCartCount}
            </span>
          )}
          {quote && (
            <span className="font-mono text-amber-200 border-l border-red-400/50 pl-2">
              {formatNGN(quote.grandTotalKobo)}
            </span>
          )}
        </button>
      </div>

      {/* FULL 100VH HERO SECTION (WHITE THEME OVERLAY) */}
      <section className="relative w-full h-[calc(100vh-73px)] min-h-[600px] overflow-hidden flex items-center justify-center bg-white">
        {/* Full Bleed Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero_food.png"
            alt="Sizzling Gourmet Fried Egg & Toast"
            className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
          />
          {/* Light Vignette Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-white/10 to-white/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-white/10" />
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-7xl w-full mx-auto px-6 lg:px-12 flex flex-col justify-center">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-extrabold uppercase tracking-widest shadow-xs">
              <span>🔥 Sizzle Your Senses</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1]">
              Elevate Your Taste Buds —{' '}
              <span className="bg-gradient-to-r from-red-600 via-amber-600 to-orange-600 bg-clip-text text-transparent">
                Gourmet Dining At Its Finest.
              </span>
            </h1>

            <p className="text-slate-700 text-base sm:text-xl font-medium leading-relaxed max-w-2xl">
              Indulge in expertly fried eggs with diced sweet peppers, melted cheddar & sizzling beef sausages, served piping hot inside soft, pillow-fresh warm bread.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={() => setIsCartOpen(true)}
                className="btn-crimson px-8 py-4 rounded-xl font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 text-white shadow-xl shadow-red-600/30"
              >
                <span>Order Hot Meal Now</span>
                <span>→</span>
              </button>

              <a
                href="#menu"
                className="px-6 py-4 rounded-xl bg-slate-100 border border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-sm transition-all"
              >
                Explore Menu ↓
              </a>
            </div>

            {/* Appetizing Highlights */}
            <div className="flex flex-wrap items-center gap-8 pt-8 border-t border-slate-200 text-xs sm:text-sm text-slate-600">
              <div className="flex items-center gap-2 font-bold">
                <span className="text-red-600 text-lg">🔥</span>
                <span>Freshly Fried in 5 Mins</span>
              </div>
              <div className="flex items-center gap-2 font-bold">
                <span className="text-amber-600 text-lg">🍳</span>
                <span>Free-Range Eggs & Cheese</span>
              </div>
              <div className="flex items-center gap-2 font-bold">
                <span className="text-orange-600 text-lg">🚚</span>
                <span>20-Min Doorstep Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FULL-WIDTH MENU SECTION */}
      <div id="menu" className="max-w-7xl mx-auto px-6 lg:px-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <span>🍳 Signature Specials Menu</span>
              <span className="text-xs bg-slate-100 text-amber-700 border border-slate-200 px-3 py-1 rounded-full font-mono font-bold">
                {presets.length} presets
              </span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Select your bread & egg combo, adjust quantity, and open your cart to checkout.
            </p>
          </div>
          <button
            onClick={fetchCatalog}
            className="text-xs text-slate-500 hover:text-red-600 transition-colors font-medium self-start sm:self-auto"
          >
            🔄 Refresh Catalog
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-80 glass-panel animate-pulse bg-slate-100 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {presets.map((preset) => {
              const qty = cart[preset.id] || 0;
              return (
                <div
                  key={preset.id}
                  className={`glass-panel overflow-hidden transition-all border flex flex-col justify-between ${qty > 0
                    ? 'border-red-500/60 ring-2 ring-red-500/20 shadow-xl shadow-red-500/10'
                    : 'border-slate-200 hover:border-slate-300'
                    }`}
                >
                  <div>
                    {/* Food Image Container */}
                    <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                      <img
                        src={preset.imageUrl}
                        alt={preset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl border border-red-200 font-black text-amber-600 text-sm shadow-md">
                        {formatNGN(preset.priceKobo)}
                      </div>
                      {!preset.isAvailable && (
                        <div className="absolute inset-0 bg-white/85 flex items-center justify-center font-extrabold text-red-600 uppercase tracking-widest text-xs">
                          Sold Out
                        </div>
                      )}
                    </div>

                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                          {preset.name}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                          {preset.description}
                        </p>
                      </div>

                      {/* Components tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {preset.components.map((c, i) => (
                          <span
                            key={i}
                            className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 font-semibold"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Controls & Add Button */}
                  <div className="p-5 pt-0">
                    <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Select Qty</span>
                      <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1 border border-slate-200">
                        <button
                          onClick={() => updateQuantity(preset.id, -1)}
                          disabled={!preset.isAvailable || qty === 0}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 disabled:opacity-30 font-extrabold flex items-center justify-center text-sm shadow-xs"
                        >
                          -
                        </button>
                        <span className="w-7 text-center font-mono font-bold text-slate-900 text-sm">
                          {qty}
                        </span>
                        <button
                          onClick={() => {
                            updateQuantity(preset.id, 1);
                          }}
                          disabled={!preset.isAvailable}
                          className="w-8 h-8 rounded-lg btn-crimson font-extrabold flex items-center justify-center text-sm shadow-xs"
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

      {/* SLIDE-OVER CART DRAWER OVERLAY (WHITE THEME) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop Blur */}
          <div
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Container */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 p-6 flex flex-col justify-between overflow-y-auto z-10 text-slate-900">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛒</span>
                  <h2 className="text-lg font-black text-slate-900">Your Food Cart</h2>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Delivery Location & Landmark */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="text-xs font-extrabold text-amber-700 uppercase tracking-wider block">
                  📍 Delivery Location & Landmark
                </label>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Street address or Area (e.g. Yaba)"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-red-500"
                  />
                  <input
                    type="text"
                    placeholder="Landmark (e.g. Opposite Domino Pizza)"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Preset Quick Location Buttons */}
                <div className="flex gap-2 text-[11px] pt-1">
                  <span className="text-slate-500">Quick zones:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLat(6.5244);
                      setLng(3.3792);
                      setAddress('12 Commercial Avenue, Yaba');
                    }}
                    className="text-red-600 hover:underline font-semibold"
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
                    className="text-red-600 hover:underline font-semibold"
                  >
                    Ikeja
                  </button>
                </div>
              </div>

              {/* Customer Phone Identity */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-amber-700 uppercase tracking-wider">
                    📱 Customer Phone (Identity)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsOtpMode(!isOtpMode)}
                    className="text-[11px] text-slate-500 hover:text-red-600 underline font-medium"
                  >
                    {isOtpMode ? 'Guest Checkout' : 'Login via OTP'}
                  </button>
                </div>

                <input
                  type="tel"
                  placeholder="08012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-red-500 font-mono"
                />

                {isOtpMode && !otpSent && (
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    className="w-full py-2 bg-white hover:bg-slate-100 text-red-600 text-xs font-bold rounded-lg border border-slate-300"
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
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
                    />
                    {otpDevHint && (
                      <p className="text-[10px] text-amber-600 font-mono">
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
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Line Items & Calculation */}
              {quoteError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
                  ⚠️ {quoteError}
                </div>
              )}

              {quote && (
                <div className="space-y-3 border-t border-slate-200 pt-4">
                  <div className="space-y-2 text-xs text-slate-700">
                    {quote.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>
                          {item.qty}× {item.presetName}
                        </span>
                        <span className="font-mono text-slate-900 font-bold">{formatNGN(item.totalKobo)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5 text-xs border-t border-slate-100 pt-2 text-slate-500">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-mono">{formatNGN(quote.subtotalKobo)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee ({quote.deliveryDistanceKm} km)</span>
                      <span className="font-mono">{formatNGN(quote.deliveryFeeKobo)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                    <span className="font-extrabold text-slate-900 text-sm">Grand Total</span>
                    <span className="font-black text-2xl text-amber-600 font-mono">
                      {formatNGN(quote.grandTotalKobo)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Checkout Button */}
            <div className="pt-6 border-t border-slate-200">
              <button
                onClick={handleCreateOrderAndPay}
                disabled={isSubmitting || !quote || !!quoteError}
                className="btn-crimson w-full py-4 font-black rounded-xl text-base uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-red-600/30"
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
      )}
    </div>
  );
}
