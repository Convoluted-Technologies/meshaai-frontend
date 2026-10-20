'use client';

import { useCart } from '@/context/CartContext';
import CheckoutModal from '@/components/CheckoutModal';
import { useState } from 'react';

export default function CartDrawer() {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    presets,
    quote,
    quoteError,
    updateQuantity,
    removeFromCart,
    formatNGN,
    locationStatus,
    requestLocation,
  } = useCart();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  if (!isCartOpen && !isCheckoutOpen) return null;

  const cartEntries = Object.entries(cart).filter(([_, line]) => line.qty > 0);

  // Only show the banner when we genuinely need user attention
  // — never show it after location is successfully granted
  const showLocationBanner = cartEntries.length > 0 &&
    ['requesting', 'denied', 'unavailable', 'out_of_zone'].includes(locationStatus);

  const isOutOfZone = locationStatus === 'out_of_zone';
  const isOperationallyClosed = ['KITCHEN_PAUSED', 'ORDERING_PAUSED'].some(
    (k) => quoteError.includes(k)
  );
  const canCheckout = cartEntries.length > 0 && !isOperationallyClosed;

  function openCheckout() {
    setIsCheckoutOpen(true);
    // Close the cart drawer so it doesn't sit behind the checkout modal
    setIsCartOpen(false);
  }

  return (
    <>
      {/* ── Cart Drawer ──────────────────────────────────────────────────── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
          />

          {/* Drawer panel */}
          <div className="relative z-10 w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col text-slate-900">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛒</span>
                <h2 className="text-lg font-black text-slate-900">Your Cart</h2>
                {cartEntries.length > 0 && (
                  <span className="text-xs bg-red-600 text-white font-bold px-2 py-0.5 rounded-full">
                    {cartEntries.reduce((s, [_, l]) => s + l.qty, 0)}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-sm transition-colors"
                aria-label="Close cart"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">

              {/* Location banner — only when attention is needed */}
              {showLocationBanner && (() => {
                const cfg = {
                  requesting: {
                    icon: '📍', color: 'bg-blue-50 border-blue-200 text-blue-700',
                    title: 'Getting your location…',
                    body: 'Please allow location access in the browser prompt.',
                    action: null,
                  },
                  denied: {
                    icon: '📍', color: 'bg-amber-50 border-amber-200 text-amber-700',
                    title: 'Location access denied',
                    body: "We'll use your address in checkout to estimate fees.",
                    action: { label: 'Try again', fn: requestLocation },
                  },
                  unavailable: {
                    icon: '📍', color: 'bg-slate-50 border-slate-200 text-slate-600',
                    title: 'Location not available',
                    body: 'Enter your delivery address in checkout — we\'ll calculate fees there.',
                    action: null,
                  },
                  out_of_zone: {
                    icon: '🚫', color: 'bg-orange-50 border-orange-200 text-orange-700',
                    title: 'Outside our current delivery zone',
                    body: 'You can still place an order — enter your address manually in checkout and our team will confirm.',
                    action: null,
                  },
                } as const;
                const c = cfg[locationStatus as keyof typeof cfg];
                if (!c) return null;
                return (
                  <div className={`rounded-2xl border p-3.5 ${c.color}`}>
                    <div className="flex items-start gap-2.5">
                      <span className="text-base shrink-0 mt-0.5">{c.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold">{c.title}</p>
                        <p className="text-[11px] mt-0.5 leading-relaxed opacity-80">{c.body}</p>
                        {c.action && (
                          <button onClick={c.action.fn} className="text-[11px] font-bold underline mt-1">
                            {c.action.label}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {cartEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-16">
                  <span className="text-5xl">🍳</span>
                  <p className="font-extrabold text-slate-800 text-base">Your cart is empty</p>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Explore our Signature Specials and tap any dish to customise & add to cart.
                  </p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="mt-2 px-5 py-2.5 bg-white border border-slate-300 hover:border-red-500 text-red-600 font-bold text-xs rounded-xl transition-all"
                  >
                    Browse Menu ↓
                  </button>
                </div>
              ) : (
                <>
                  {cartEntries.map(([presetId, line]) => {
                    const preset = presets.find((p) => p.id === presetId);
                    if (!preset) return null;
                    const extrasTotal = line.extras.reduce((s, e) => s + e.priceKobo, 0);
                    const unitTotal = preset.priceKobo + extrasTotal;

                    return (
                      <div key={presetId} className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="flex gap-3 p-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={preset.imageUrl} alt={preset.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-extrabold text-slate-900 leading-tight line-clamp-1">{preset.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{formatNGN(unitTotal)} each</p>
                            {line.extras.length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {line.extras.map((ex, i) => (
                                  <p key={i} className="text-[11px] text-red-500 font-medium">+ {ex.name}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between px-3 pb-3">
                          <button onClick={() => removeFromCart(presetId)} className="text-[11px] text-slate-400 hover:text-red-500 font-semibold transition-colors">
                            Remove
                          </button>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQuantity(presetId, -1)} className="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-extrabold flex items-center justify-center text-sm">−</button>
                            <span className="w-6 text-center font-black text-slate-900 tabular-nums">{line.qty}</span>
                            <button onClick={() => updateQuantity(presetId, 1)} className="w-7 h-7 rounded-lg bg-red-600 hover:bg-red-500 text-white font-extrabold flex items-center justify-center text-sm">+</button>
                            <span className="text-xs font-black text-slate-900 ml-1 font-mono">{formatNGN(unitTotal * line.qty)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Operational error (kitchen/ordering paused) */}
                  {isOperationallyClosed && quoteError && (
                    <div className="p-3.5 rounded-2xl border bg-red-50 border-red-200 text-red-700 text-xs font-medium leading-relaxed">
                      ⚠️ {quoteError}
                    </div>
                  )}

                  {/* Out of zone info (not blocking) */}
                  {isOutOfZone && quoteError && (
                    <div className="p-3.5 rounded-2xl border bg-orange-50 border-orange-200 text-orange-700 text-xs font-medium leading-relaxed">
                      🚫 {quoteError}
                    </div>
                  )}

                  {/* Totals */}
                  {quote && (
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Subtotal</span>
                        <span className="font-mono">{formatNGN(quote.subtotalKobo)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Delivery{quote.deliveryDistanceKm ? ` (${quote.deliveryDistanceKm} km)` : ''}</span>
                        <span className="font-mono">{formatNGN(quote.deliveryFeeKobo)}</span>
                      </div>
                      <div className="flex justify-between font-black text-slate-900 text-sm pt-2 border-t border-slate-200">
                        <span>Total</span>
                        <span className="font-mono text-amber-600">{formatNGN(quote.grandTotalKobo)}</span>
                      </div>
                    </div>
                  )}

                  {/* Quote calculating */}
                  {!quote && !quoteError && locationStatus === 'granted' && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                      <span className="animate-pulse text-sm">⏳</span>
                      <span>Calculating delivery fee…</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {cartEntries.length > 0 && (
              <div className="px-4 sm:px-6 py-4 border-t border-slate-100 flex-shrink-0 space-y-2">
                {isOutOfZone && (
                  <p className="text-[11px] text-orange-600 text-center font-medium">
                    📍 Enter your address in checkout — we'll confirm availability.
                  </p>
                )}

                <button
                  onClick={openCheckout}
                  disabled={!canCheckout}
                  className="btn-crimson w-full py-4 font-black rounded-2xl text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-red-600/30 transition-all"
                >
                  {isOutOfZone
                    ? '📍 Continue to Checkout'
                    : quote
                    ? `Checkout · ${formatNGN(quote.grandTotalKobo)} →`
                    : 'Checkout →'}
                </button>

                {!quote && !quoteError && (locationStatus === 'idle' || locationStatus === 'requesting') && (
                  <p className="text-center text-[11px] text-slate-400">
                    {locationStatus === 'requesting' ? 'Allow location access to see delivery fee' : 'Getting your location…'}
                  </p>
                )}
                {locationStatus === 'denied' && !quote && (
                  <p className="text-center text-[11px] text-slate-400">Delivery fee calculated at checkout</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Checkout Modal — rendered outside the cart, at root z-level ── */}
      {isCheckoutOpen && (
        <CheckoutModal
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={() => setIsCheckoutOpen(false)}
        />
      )}
    </>
  );
}
