'use client';

import { useCart } from '@/context/CartContext';
import CheckoutModal from '@/components/CheckoutModal';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import LeafletMapPicker on client side only (Leaflet requires `window`)
const LeafletMapPicker = dynamic(() => import('@/components/LeafletMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-3xl border border-slate-200 animate-pulse">
      🗺️ Loading OpenStreetMap...
    </div>
  ),
});

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
    formatPrice,
    locationStatus,
    setManualLocation,
    lat,
    lng,
    address,
    fulfillmentMode,
    scheduledTime,
  } = useCart();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const pathname = usePathname();

  // Never render cart drawer in admin or ops portals
  if (pathname?.startsWith('/mshsuper') || pathname?.startsWith('/ops')) {
    return null;
  }

  if (!isCartOpen && !isCheckoutOpen) return null;

  const cartEntries = Object.entries(cart).filter(([_, line]) => line.qty > 0);

  // Show location banner when attention is needed
  const showLocationBanner = cartEntries.length > 0 &&
    ['requesting', 'denied', 'unavailable', 'out_of_zone'].includes(locationStatus);

  const isOutOfZone = locationStatus === 'out_of_zone';
  const isOperationallyClosed = ['KITCHEN_PAUSED', 'ORDERING_PAUSED'].some(
    (k) => quoteError.includes(k)
  );

  // STRICT REQUIREMENT: If location is denied or unavailable, checkout remains disabled
  // until the user provides coordinates either via GPS or by picking on OpenStreetMap
  const hasValidCoordinates = lat !== 0 && lng !== 0;
  const hasLocationGranted = hasValidCoordinates && (locationStatus === 'granted' || locationStatus === 'out_of_zone');
  const canCheckout = cartEntries.length > 0 && !isOperationallyClosed && hasLocationGranted;

  function openCheckout() {
    setIsCheckoutOpen(true);
    setIsCartOpen(false);
  }

  function handleMapConfirm(coords: { lat: number; lng: number; address: string }) {
    setManualLocation(coords.lat, coords.lng, coords.address);
    setShowMapPicker(false);
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
                  <span className="text-xs bg-[#e31b23] text-white font-bold px-2 py-0.5 rounded-full">
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

              {/* Fulfillment Mode Badge */}
              {cartEntries.length > 0 && (
                <div className="flex items-center justify-between py-1">
                  {fulfillmentMode === 'NOW' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Kitchen Open · Delivering in 30–45 mins
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Pre-Order · Opens at {scheduledTime || '06:00 AM'}
                    </span>
                  )}

                  {hasValidCoordinates && (
                    <button
                      onClick={() => setShowMapPicker(true)}
                      className="text-[11px] font-bold text-[#e31b23] hover:underline"
                    >
                      Change Spot 📍
                    </button>
                  )}
                </div>
              )}

              {/* Location banner — only when attention is needed */}
              {showLocationBanner && !showMapPicker && (() => {
                const cfg = {
                  requesting: {
                    icon: '📍', color: 'bg-amber-50 border-amber-300 text-amber-800',
                    title: 'Requesting Location…',
                    body: 'Please allow browser location access so we can calculate delivery.',
                    action: null,
                  },
                  denied: {
                    icon: '🚫', color: 'bg-red-50 border-red-300 text-red-800',
                    title: 'Location Permission Denied',
                    body: 'Location access was denied. Please pick your delivery location on our interactive map to continue to checkout.',
                    action: { label: '🗺️ Pick Location on Map →', fn: () => setShowMapPicker(true) },
                  },
                  unavailable: {
                    icon: '⚠️', color: 'bg-red-50 border-red-300 text-red-800',
                    title: 'Location Unavailable',
                    body: 'GPS is not available on this device. Please select your spot on the map below.',
                    action: { label: '🗺️ Open Map Picker →', fn: () => setShowMapPicker(true) },
                  },
                  out_of_zone: {
                    icon: '🌍', color: 'bg-orange-50 border-orange-300 text-orange-800',
                    title: 'Outside Direct Delivery Zone',
                    body: 'You can still place your order! Pick your location on the map and our team will verify availability.',
                    action: { label: '🗺️ Adjust Pin on Map →', fn: () => setShowMapPicker(true) },
                  },
                } as const;
                const c = cfg[locationStatus as keyof typeof cfg];
                if (!c) return null;
                return (
                  <div className={`rounded-2xl border-2 p-4 ${c.color} shadow-xs`}>
                    <div className="flex items-start gap-3">
                      <span className="text-xl shrink-0 mt-0.5">{c.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black mb-1">{c.title}</p>
                        <p className="text-xs leading-relaxed opacity-90">{c.body}</p>
                        {c.action && (
                          <button
                            onClick={c.action.fn}
                            className="text-xs font-black underline mt-2 text-[#e31b23] hover:opacity-80 transition-opacity block"
                          >
                            {c.action.label}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Interactive OpenStreetMap Leaflet Picker */}
              {showMapPicker && (
                <div className="space-y-2">
                  <LeafletMapPicker
                    initialLat={lat || 9.0765}
                    initialLng={lng || 7.3986}
                    onConfirm={handleMapConfirm}
                    onCancel={() => setShowMapPicker(false)}
                  />
                </div>
              )}

              {/* Location indicator when granted */}
              {hasLocationGranted && !showMapPicker && cartEntries.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">📍</span>
                    <div className="truncate">
                      <p className="font-extrabold text-slate-800 truncate">
                        {address || 'Location Confirmed'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {lat.toFixed(4)}, {lng.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMapPicker(true)}
                    className="shrink-0 px-2.5 py-1 text-[11px] font-bold text-[#e31b23] bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    Edit Map
                  </button>
                </div>
              )}

              {cartEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-16">
                  <span className="text-5xl">🍳</span>
                  <p className="font-extrabold text-slate-800 text-base">Your cart is empty</p>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Explore our Signature Specials and tap any dish to customise & add to cart.
                  </p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="mt-2 px-5 py-2.5 bg-white border border-slate-300 hover:border-[#e31b23] text-[#e31b23] font-bold text-xs rounded-xl transition-all"
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
                          <img src={preset.imageUrl} alt={preset.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-extrabold text-slate-900 leading-tight line-clamp-1">{preset.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{formatPrice(unitTotal)} each</p>
                            {line.extras.length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {line.extras.map((ex, i) => (
                                  <p key={i} className="text-[11px] text-[#e31b23] font-medium">+ {ex.name}</p>
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
                            <button onClick={() => updateQuantity(presetId, 1)} className="w-7 h-7 rounded-lg bg-[#e31b23] hover:bg-[#c9151c] text-white font-extrabold flex items-center justify-center text-sm">+</button>
                            <span className="text-xs font-black text-slate-900 ml-1 font-mono">{formatPrice(unitTotal * line.qty)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Operational error */}
                  {isOperationallyClosed && quoteError && (
                    <div className="p-3.5 rounded-2xl border bg-red-50 border-red-200 text-red-700 text-xs font-medium leading-relaxed">
                      ⚠️ {quoteError}
                    </div>
                  )}

                  {/* Out of zone info */}
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
                        <span className="font-mono">{quote.subtotalFormatted || formatPrice(quote.subtotalKobo)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Delivery{quote.deliveryDistanceKm ? ` (${quote.deliveryDistanceKm} km)` : ''}</span>
                        <span className="font-mono">{quote.deliveryFeeFormatted || formatPrice(quote.deliveryFeeKobo)}</span>
                      </div>
                      <div className="flex justify-between font-black text-slate-900 text-sm pt-2 border-t border-slate-200">
                        <span>Total</span>
                        <span className="font-mono text-[#e31b23]">{quote.grandTotalFormatted || formatPrice(quote.grandTotalKobo)}</span>
                      </div>
                    </div>
                  )}

                  {/* Quote calculating */}
                  {!quote && !quoteError && hasLocationGranted && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                      <span className="animate-pulse text-sm">⏳</span>
                      <span>Calculating delivery quote...</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {cartEntries.length > 0 && (
              <div className="px-4 sm:px-6 py-4 border-t border-slate-100 flex-shrink-0 space-y-2">
                {/* Checkout Button: STRICTLY DISABLED when location is denied or missing */}
                <button
                  onClick={openCheckout}
                  disabled={!canCheckout}
                  className="w-full py-4 font-black rounded-2xl text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 bg-[#e31b23] hover:bg-[#c9151c] disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-xl shadow-red-600/30 transition-all cursor-pointer"
                >
                  {locationStatus === 'denied' || locationStatus === 'unavailable' || !hasValidCoordinates
                    ? '📍 Pick Location on Map to Checkout'
                    : isOutOfZone
                      ? '📍 Continue to Checkout'
                      : quote
                        ? `Checkout · ${formatPrice(quote.grandTotalKobo)} →`
                        : 'Checkout →'}
                </button>

                {/* Clear Location Required Notice when denied */}
                {(!hasValidCoordinates || locationStatus === 'denied' || locationStatus === 'unavailable') && (
                  <div className="text-center text-[11px] text-red-600 font-semibold space-y-1">
                    <p>⚠️ Delivery location is required before checkout.</p>
                    <button
                      onClick={() => setShowMapPicker(true)}
                      className="text-[#e31b23] font-black underline hover:opacity-80 transition-opacity"
                    >
                      Tap to open OpenStreetMap →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Checkout Modal ── */}
      {isCheckoutOpen && (
        <CheckoutModal
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={() => setIsCheckoutOpen(false)}
        />
      )}
    </>
  );
}
