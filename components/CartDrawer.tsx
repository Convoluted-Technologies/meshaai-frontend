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
    setLat,
    setLng,
    setAddress,
    lat,
    lng,
  } = useCart();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapLat, setMapLat] = useState('');
  const [mapLng, setMapLng] = useState('');
  const [mapAddress, setMapAddress] = useState('');
  const [mapError, setMapError] = useState('');

  function handleSetManualLocation() {
    setMapError('');
    const parsedLat = parseFloat(mapLat);
    const parsedLng = parseFloat(mapLng);
    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      setMapError('Enter a valid latitude between -90 and 90.');
      return;
    }
    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      setMapError('Enter a valid longitude between -180 and 180.');
      return;
    }
    setLat(parsedLat);
    setLng(parsedLng);
    if (mapAddress.trim()) setAddress(mapAddress.trim());
    setShowMapPicker(false);
    setMapLat('');
    setMapLng('');
    setMapAddress('');
  }

  // Try to re-request permission — if previously denied, open browser settings guide
  function handleRetryLocation() {
    // navigator.permissions lets us check state without prompting
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
        if (result.state === 'denied') {
          // Can't re-prompt when denied — show map picker instead
          setShowMapPicker(true);
        } else {
          requestLocation();
        }
      }).catch(() => requestLocation());
    } else {
      requestLocation();
    }
  }

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
  
  // Checkout ONLY enabled when user explicitly grants location access
  // The only allowed status is 'granted' (or 'out_of_zone' which means location was granted but outside zone)
  // Also allow if manual lat/lng has been set (non-zero)
  const hasLocationGranted = locationStatus === 'granted' || locationStatus === 'out_of_zone' || (lat !== 0 && lng !== 0);
  const canCheckout = cartEntries.length > 0 && !isOperationallyClosed && hasLocationGranted;

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
                    icon: '📍', color: 'bg-amber-100 border-amber-300 text-amber-800',
                    title: 'Requesting Location…',
                    body: 'Please allow location access in the browser prompt to continue.',
                    action: null,
                  },
                  denied: {
                    icon: '🚫', color: 'bg-red-100 border-red-300 text-red-800',
                    title: 'Location Access Blocked',
                    body: 'You previously denied location access. To re-enable: tap the 🔒 lock icon in your browser address bar → Site settings → Allow Location. Or pick your location manually below.',
                    action: { label: 'Pick location manually →', fn: () => setShowMapPicker(true) },
                  },
                  unavailable: {
                    icon: '⚠️', color: 'bg-red-100 border-red-300 text-red-800',
                    title: 'Location Unavailable',
                    body: 'Your browser doesn\'t support location services. Pick your location manually below.',
                    action: { label: 'Enter location manually →', fn: () => setShowMapPicker(true) },
                  },
                  out_of_zone: {
                    icon: '🌍', color: 'bg-orange-100 border-orange-300 text-orange-800',
                    title: 'Outside Current Delivery Zone',
                    body: 'You can still place an order! Enter your address manually in checkout and our team will confirm if we can deliver to you.',
                    action: null,
                  },
                } as const;
                const c = cfg[locationStatus as keyof typeof cfg];
                if (!c) return null;
                return (
                  <div className={`rounded-2xl border-2 p-4 ${c.color} shadow-sm`}>
                    <div className="flex items-start gap-3">
                      <span className="text-xl shrink-0 mt-0.5">{c.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black mb-1">{c.title}</p>
                        <p className="text-xs leading-relaxed opacity-90">{c.body}</p>
                        {c.action && (
                          <button 
                            onClick={c.action.fn} 
                            className="text-xs font-bold underline mt-2 hover:opacity-80 transition-opacity"
                          >
                            {c.action.label}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Manual location / map picker */}
              {(locationStatus === 'idle' || locationStatus === 'granted' || locationStatus === 'out_of_zone') && !showMapPicker && cartEntries.length > 0 && (
                <button
                  onClick={() => setShowMapPicker(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-dashed border-slate-300 hover:border-amber-400 hover:bg-amber-50 text-slate-600 hover:text-amber-700 transition-all text-sm font-semibold"
                >
                  <span className="text-xl">🗺️</span>
                  <div className="text-left">
                    <p className="font-bold text-sm">Select location from map</p>
                    {lat && lng ? (
                      <p className="text-xs opacity-70 font-mono">{lat.toFixed(5)}, {lng.toFixed(5)}</p>
                    ) : (
                      <p className="text-xs opacity-70">Enter your coordinates manually</p>
                    )}
                  </div>
                  <span className="ml-auto text-lg">›</span>
                </button>
              )}

              {/* Map picker panel */}
              {showMapPicker && (
                <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-black text-sm text-amber-900 flex items-center gap-2">
                      <span>🗺️</span> Set Your Location
                    </p>
                    <button
                      onClick={() => { setShowMapPicker(false); setMapError(''); }}
                      className="text-amber-700 hover:text-amber-900 font-bold text-sm"
                    >✕</button>
                  </div>

                  <p className="text-xs text-amber-800 leading-relaxed">
                    Open <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="font-bold underline">Google Maps</a>, right-click your location → copy the coordinates, then paste them below.
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-amber-900 block mb-1">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 9.0765"
                        value={mapLat}
                        onChange={(e) => setMapLat(e.target.value)}
                        className="w-full text-xs px-3 py-2.5 rounded-xl border-2 border-amber-300 bg-white focus:border-amber-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-amber-900 block mb-1">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 7.3986"
                        value={mapLng}
                        onChange={(e) => setMapLng(e.target.value)}
                        className="w-full text-xs px-3 py-2.5 rounded-xl border-2 border-amber-300 bg-white focus:border-amber-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-900 block mb-1">Address (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Plot 12, Wuse Zone 5, Abuja"
                      value={mapAddress}
                      onChange={(e) => setMapAddress(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border-2 border-amber-300 bg-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {mapError && (
                    <p className="text-xs text-red-600 font-semibold">⚠️ {mapError}</p>
                  )}

                  <div className="flex gap-2">
                    {locationStatus === 'denied' ? (
                      <button
                        onClick={handleRetryLocation}
                        className="flex-1 py-2.5 bg-white border-2 border-amber-300 hover:border-amber-500 text-amber-800 text-xs font-bold rounded-xl transition-colors"
                      >
                        🔄 Retry GPS
                      </button>
                    ) : null}
                    <button
                      onClick={handleSetManualLocation}
                      disabled={!mapLat || !mapLng}
                      className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl transition-colors"
                    >
                      ✓ Set Location
                    </button>
                  </div>
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
                      <span>Processing your order...</span>
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

                {/* Location status messages */}
                {!hasLocationGranted && (
                  <div className="text-center text-[11px] space-y-1">
                    {locationStatus === 'requesting' ? (
                      <p className="text-amber-600 font-semibold animate-pulse">
                        ⏳ Please allow location access in the browser prompt
                      </p>
                    ) : locationStatus === 'denied' ? (
                      <div className="space-y-1">
                        <p className="text-red-600 font-semibold">
                          🚫 Location blocked. Enable it in browser settings or —
                        </p>
                        <button
                          onClick={() => setShowMapPicker(true)}
                          className="text-amber-600 font-bold underline hover:text-amber-700 transition-colors"
                        >
                          enter location manually →
                        </button>
                      </div>
                    ) : locationStatus === 'unavailable' ? (
                      <div className="space-y-1">
                        <p className="text-red-600 font-semibold">
                          ⚠️ Location unavailable —
                        </p>
                        <button
                          onClick={() => setShowMapPicker(true)}
                          className="text-amber-600 font-bold underline hover:text-amber-700 transition-colors"
                        >
                          enter location manually →
                        </button>
                      </div>
                    ) : (
                      <p className="text-slate-500">
                        📍 Requesting your location...
                      </p>
                    )}
                  </div>
                )}
                {hasLocationGranted && !quote && !quoteError && (
                  <p className="text-center text-[11px] text-slate-400">
                    Processing...
                  </p>
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
