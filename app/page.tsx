'use client';

import { useCart } from '@/context/CartContext';

export default function CustomerHomePage() {
  const {
    presets,
    loadingCatalog,
    cart,
    updateQuantity,
    setIsCartOpen,
    selectedCurrency,
    formatPrice,
    deliveryCheck,
    checkingDelivery,
    setLat,
    setLng,
    lat,
    lng,
  } = useCart();

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
        },
        (err) => {
          alert('Unable to retrieve location. Using default coordinates.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div className="relative space-y-16 pb-20 bg-white text-slate-900">
      {/* FULL 100VH HERO SECTION (FULL BLEED COVER UNDER ABSOLUTE FLOATING NAV) */}
      <section className="relative w-full min-h-[90vh] sm:min-h-screen pt-24 sm:pt-32 pb-16 overflow-hidden flex items-center justify-center bg-slate-950 rounded-b-3xl sm:rounded-b-4xl">
        {/* Full Bleed Background Image with Zoom Reveal */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero_food.png"
            alt="Sizzling Gourmet Fried Egg & Toast"
            className="w-full h-full object-cover object-center animate-bg-reveal"
          />
          {/* Vignette Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/50" />
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-12 flex flex-col justify-center">
          <div className="max-w-3xl space-y-5 sm:space-y-6">
            {/* Delivery Serviceability Pill / Status Badge */}
            {/* {deliveryCheck && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border border-white/20 text-xs font-extrabold shadow-lg animate-fade-in">
                {deliveryCheck.serviceable && deliveryCheck.mode === 'NOW' && (
                  <span className="bg-emerald-500 text-slate-950 px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                    <span>🟢</span>
                    <span>Delivering in few mins ({deliveryCheck.kitchenName || 'Abuja Kitchen'})</span>
                  </span>
                )}
                {deliveryCheck.serviceable && deliveryCheck.mode === 'PRE_ORDER' && (
                  <span className="bg-amber-400 text-slate-950 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span>🟡</span>
                    <span>Kitchen opens soon (Pre-order now for {deliveryCheck.scheduledFor?.local || '06:00 AM'})</span>
                  </span>
                )}
                {!deliveryCheck.serviceable && (
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span>🔴</span>
                    <span>Delivery Paused / Out of Zone</span>
                  </span>
                )}
                <button
                  onClick={handleUseMyLocation}
                  className="text-white hover:text-amber-300 underline text-[11px] ml-2 font-mono"
                >
                  📍 Update Location
                </button>
              </div>
            )} */}

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1] animate-hero-entrance delay-200">
              Elevate Your Taste Buds.
            </h1>

            <p className="text-white text-base sm:text-xl font-medium leading-relaxed max-w-2xl drop-shadow-md animate-hero-entrance delay-300">
              Indulge in expertly fried eggs with diced sweet peppers, melted cheddar & sizzling beef sausages, served piping hot inside soft, pillow-fresh warm bread.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4 animate-hero-entrance delay-400">
              <button
                onClick={() => setIsCartOpen(true)}
                className="btn-crimson px-8 py-4 rounded-xl font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 text-white shadow-xl shadow-red-600/40"
              >
                <span>Order Hot Meal Now</span>
                <span>→</span>
              </button>

              <a
                href="#menu"
                className="px-6 py-4 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-white font-bold text-sm transition-all backdrop-blur-md"
              >
                Explore Menu ↓
              </a>
            </div>

            {/* Serviceability Warning Banners */}
            {deliveryCheck && !deliveryCheck.serviceable && (
              <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs sm:text-sm font-bold shadow-2xl backdrop-blur-md animate-bounce-short">
                {deliveryCheck.reason === 'OUT_OF_ZONE' && (
                  <p>🚫 Sorry, we do not deliver to your location ({lat.toFixed(4)}, {lng.toFixed(4)}) yet.</p>
                )}
                {deliveryCheck.reason === 'KITCHEN_PAUSED' && (
                  <p>⚠️ The nearest kitchen is temporarily paused due to high order volume. Please check back shortly.</p>
                )}
                {deliveryCheck.reason === 'ORDERING_PAUSED' && (
                  <p>⛔ Online ordering is currently suspended across all kitchens for scheduled platform maintenance.</p>
                )}
              </div>
            )}

            {/* Appetizing Highlights */}
            <div className="flex flex-wrap items-center sm:gap-8 gap-4 pt-8 border-t border-white/40 text-xs sm:text-sm text-white animate-hero-entrance delay-500">
              <div className="flex items-center gap-2 font-bold">
                <span className="text-red-500 text-lg">🔥</span>
                <span>Freshly Fried in 5 Mins</span>
              </div>
              <div className="flex items-center gap-2 font-bold">
                <span className="text-amber-400 text-lg">🍳</span>
                <span>Free-Range Eggs & Cheese</span>
              </div>
              <div className="flex items-center gap-2 font-bold">
                <span className="text-orange-400 text-lg">🚚</span>
                <span>20-Min Doorstep Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FULL-WIDTH MENU SECTION */}
      <div id="menu" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <span>🍳 Signature Specials Menu</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Select your bread & egg combo in <span className="font-bold text-red-600">{selectedCurrency}</span>, adjust quantity, and open your cart to checkout.
            </p>
          </div>
        </div>

        {loadingCatalog ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-80 glass-panel animate-pulse bg-slate-100 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <div className="relative h-52 lg:h-80 w-full overflow-hidden bg-slate-100 group">
                      <img
                        src={preset.imageUrl}
                        alt={preset.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80';
                        }}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl border border-red-200 font-black text-amber-600 text-sm shadow-md">
                        {formatPrice(preset.priceKobo, selectedCurrency)}
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
                          className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 disabled:opacity-30 font-extrabold flex items-center justify-center text-sm shadow-xs active:scale-95 transition-all"
                        >
                          -
                        </button>
                        <span className="w-7 text-center font-mono font-bold text-slate-900 text-sm">
                          {qty}
                        </span>
                        <button
                          onClick={() => updateQuantity(preset.id, 1)}
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
    </div>
  );
}
