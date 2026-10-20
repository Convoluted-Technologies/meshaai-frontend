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
  } = useCart();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  if (!isCartOpen) return null;

  const cartEntries = Object.entries(cart).filter(([_, line]) => line.qty > 0);

  return (
    <>
      <div className="fixed inset-0 z-60 flex justify-end">
        {/* Backdrop */}
        <div
          onClick={() => setIsCartOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
        />

        {/* Drawer */}
        <div className="z-40 relative w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col z-10 text-slate-900 animate-in slide-in-from-right duration-300">

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

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
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

                      {/* Quantity controls */}
                      <div className="flex items-center justify-between px-3 pb-3">
                        <button
                          onClick={() => removeFromCart(presetId)}
                          className="text-[11px] text-slate-400 hover:text-red-500 font-semibold transition-colors"
                        >
                          Remove
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(presetId, -1)}
                            className="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-extrabold flex items-center justify-center text-sm shadow-xs"
                          >
                            −
                          </button>
                          <span className="w-6 text-center font-black text-slate-900 tabular-nums">
                            {line.qty}
                          </span>
                          <button
                            onClick={() => updateQuantity(presetId, 1)}
                            className="w-7 h-7 rounded-lg bg-red-600 hover:bg-red-500 text-white font-extrabold flex items-center justify-center text-sm shadow-xs"
                          >
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

                {/* Quote error */}
                {quoteError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-medium">
                    ⚠️ {quoteError}
                  </div>
                )}

                {/* Totals summary */}
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
              </>
            )}
          </div>

          {/* Checkout Footer */}
          {cartEntries.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 flex-shrink-0">
              <button
                onClick={() => setIsCheckoutOpen(true)}
                disabled={!!quoteError || !quote}
                className="btn-crimson w-full py-4 font-black rounded-2xl text-base uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-red-600/30"
              >
                Checkout →
              </button>
              {!quote && !quoteError && (
                <p className="text-center text-[11px] text-slate-400 mt-2">Calculating price…</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={() => {
            setIsCheckoutOpen(false);
            setIsCartOpen(false);
          }}
        />
      )}
    </>
  );
}
