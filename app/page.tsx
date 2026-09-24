'use client';

import { useCart } from '@/context/CartContext';

export default function CustomerHomePage() {
  const {
    presets,
    loadingCatalog,
    cart,
    updateQuantity,
    setIsCartOpen,
    fetchCatalog,
    formatNGN,
  } = useCart();

  return (
    <div className="relative space-y-16 pb-20 bg-white text-slate-900">
      {/* FULL 100VH HERO SECTION (FULL BLEED COVER UNDER FLOATING NAV) */}
      <section className="relative w-full min-h-screen h-screen -mt-24 pt-24 overflow-hidden flex items-center justify-center bg-slate-950">
        {/* Full Bleed Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero_food.png"
            alt="Sizzling Gourmet Fried Egg & Toast"
            className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
          />
          {/* Vignette Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-[85%] w-full mx-auto px-6 lg:px-12 flex flex-col justify-center">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-extrabold uppercase tracking-widest shadow-lg shadow-red-600/20 backdrop-blur-md">
              <span>🔥 Sizzle Your Senses</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1]">
              Elevate Your Taste Buds —{' '}
              <span className="bg-gradient-to-r from-red-500 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                Gourmet Dining At Its Finest.
              </span>
            </h1>

            <p className="text-white text-base sm:text-xl font-medium leading-relaxed max-w-2xl drop-shadow-md">
              Indulge in expertly fried eggs with diced sweet peppers, melted cheddar & sizzling beef sausages, served piping hot inside soft, pillow-fresh warm bread.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
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

            {/* Appetizing Highlights */}
            <div className="flex flex-wrap items-center gap-8 pt-8 border-t border-white text-xs sm:text-sm text-white">
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
      <div id="menu" className="max-w-[85%] mx-auto px-6 lg:px-12 space-y-8 pt-6">
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
                    <div className="relative h-52 w-full overflow-hidden bg-slate-100 group">
                      <img
                        src={preset.imageUrl}
                        alt={preset.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
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
                          className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 disabled:opacity-30 font-extrabold flex items-center justify-center text-sm shadow-xs active:scale-95 transition-all"
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
    </div>
  );
}
