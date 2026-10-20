'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import CheckoutModal from '@/components/CheckoutModal';

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

  if (!isCartOpen) return null;

  const cartEntries = Object.entries(cart).filter(([_, line]) => line.qty > 0);

  // ── Location status banner content ────────────────────────────────────────
  const locationBanner = (() => {
    switch (locationStatus) {
      case 'requesting':
        return {
          icon: '📍',
          text: 'Getting your location…',
          sub: 'Please allow location access in the browser prompt.',
          color: 'bg-blue-50 border-blue-200 text-blue-700',
          action: null,
        };
      case 'denied':
        return {
          icon: '📍',
          text: 'Location access denied',
          sub: 'We\'ll use your delivery address in checkout to estimate fees.',
          color: 'bg-amber-50 border-amber-200 text-amber-700',
          action: { label: 'Try again', fn: requestLocation },
        };
      case 'unavailable':
        return {
          icon: '📍',
          text: 'Location not available',
          sub: 'Enter your delivery address in checkout and we\'ll calculate fees.',
          color: 'bg-slate-50 border-slate-200 text-slate-600',
          action: null,
        };
      case 'out_of_zone':
        return {
          icon: '🚫',
          text: 'Outside delivery zone',
          sub: 'We don\'t currently deliver to your GPS location. You can still place an order — enter your address in checkout.',
          color: 'bg-orange-50 border-orange-200 text-orange-700',
          action: null,
        };
      default:
        return null;
    }
  })();

  // Allow checkout regardless — quote may be null if location is pending/denied/out-of-zone
  const isOutOfZone = locationStatus === 'out_of_zone';
  const canCheckout = cartEntries.length > 0 && !['KITCHEN_PAUSED', 'ORDERING_PAUSED'].some(e => quoteError.includes(e));

  return (
    <>
      <div className="fixed inset-0 z-[60] flex justify-end">
        {/* Backdrop */}
        <div
          onClick={() => setIsCartOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Drawer */}
        <div className="relative z-10 w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col text-slate-900 animate-in slide-in-from-right duration-300">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 flex-shrink-0">
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
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-sm transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">

            {/* Location status banner */}
            {locationBanner && cartEntries.length > 0 && (
              <div className={`rounded-2xl border p-3.5 ${locationBanner.color}`}>
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0 mt-0.5">{locationBanner.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold">{locationBanner.text}</p>
                    <p className="text-[11px] mt-0.5 leading-relaxed opacity-80">{locationBanner.sub}</p>
                    {locationBanner.action && (
                      <button
                        onClick={locationBanner.action.fn}
                        className="text-[11px] font-bold underline mt-1 hover:opacity-70 transition-opacity"
                      >
                        {locationBanner.action.label}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {cartEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-16">
                <span className="text-5xl animate-bounce">🍳</span>
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
                  const extrasTotalPerUnit = line.extras.reduce((s, e) => s + e.priceKobo, 0);
                  const unitTotal = preset.priceKobo + extrasTotalPerUnit;

                  return (
                    <div key={presetId} className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="flex gap-3 p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preset.imageUrl}
                          alt={preset.name}
                          className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-extrabold text-slate-900 leading-tight line-clamp-1">
                            {preset.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatNGN(unitTotal)} each
                          </p>
                          {line.extras.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {line.extras.map((ex, i) => (
                                <p key={i} className="text-[11px] text-red-500 font-medium">
                                  + {ex.name}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Qty controls */}
                      <div className="flex items-center justify-between px-3 pb-3">
                        <button
                          onClick={() => removeFromCart(presetId)}
                          className="text-[11px] text-slate-400 hover:text-red-500 font-semibold transition-colors"
                        >
                          Remove
                        </button>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(presetId, -1)} className="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-extrabold flex items-center justify-center text-sm">
                            −
                          </button>
                          <span className="w-6 text-center font-black text-slate-900 tabular-nums">{line.qty}</span>
                          <button onClick={() => updateQuantity(presetId, 1)} className="w-7 h-7 rounded-lg bg-red-600 hover:bg-red-500 text-white font-extrabold flex items-center justify-center text-sm">
                            +
                          </button>
                          <span className="text-xs font-black text-slate-900 ml-1 font-mono">
                            {formatNGN(unitTotal * line.qty)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Quote error — out of zone gets special styling */}
                {quoteError && (
                  <div className={`p-3.5 rounded-2xl border text-xs font-medium leading-relaxed ${
                    isOutOfZone
                      ? 'bg-orange-50 border-orange-200 text-orange-700'
                      : 'bg-red-50 border-red-200 text-red-600'
                  }`}>
                    {isOutOfZone ? '🚫' : '⚠️'} {quoteError}
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

                {/* Quote pending (location granted but no quote yet) */}
                {!quote && !quoteError && locationStatus === 'granted' && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                    <span className="animate-spin text-sm">⏳</span>
                    <span>Calculating delivery fee…</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {cartEntries.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 flex-shrink-0 space-y-2">

              {/* Out of zone notice above button */}
              {isOutOfZone && (
                <p className="text-[11px] text-orange-600 text-center font-medium">
                  You can still place an order — our team will confirm delivery availability.
                </p>
              )}

              <button
                onClick={() => setIsCheckoutOpen(true)}
                disabled={!canCheckout}
                className="btn-crimson w-full py-4 font-black rounded-2xl text-base uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-red-600/30 transition-all"
              >
                {isOutOfZone ? '📍 Continue to Checkout' : 'Checkout →'}
              </button>

              {/* Status hints below button */}
              {!quote && !quoteError && locationStatus === 'idle' && (
                <p className="text-center text-[11px] text-slate-400">Getting your location…</p>
              )}
              {!quote && !quoteError && locationStatus === 'requesting' && (
                <p className="text-center text-[11px] text-blue-500 font-medium">Allow location access to see delivery fee</p>
              )}
              {locationStatus === 'denied' && !quote && (
                <p className="text-center text-[11px] text-slate-400">Delivery fee calculated at checkout</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={() => { setIsCheckoutOpen(false); setIsCartOpen(false); }}
        />
      )}
    </>
  );
}
