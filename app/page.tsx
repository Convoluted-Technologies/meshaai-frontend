"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import DishDetailModal from "@/components/DishDetailModal";
import { useCart } from "@/context/CartContext";
import { PresetMeal } from "@/lib/types";

export default function CustomerHomePage() {
  const {
    presets,
    loadingCatalog,
    backendWakingUp,
    fetchCatalog,
    cart,
    setIsCartOpen,
    formatNGN,
  } = useCart();

  const [selectedPreset, setSelectedPreset] = useState<PresetMeal | null>(null);

  return (
    <div className="relative space-y-16 pb-20 bg-white text-slate-900 ">
      <div className="fixed top-4 inset-x-0 z-50 pointer-events-auto">
        <Navbar />
      </div>
      {/* FULL 100VH HERO SECTION (FULL BLEED COVER UNDER ABSOLUTE FLOATING NAV) */}
      <section className="relative w-full min-h-screen sm:pt-10 pt-30 overflow-hidden flex items-center justify-center bg-slate-950 rounded-b-4xl">
        {/* Full Bleed Background Image with Zoom Reveal */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero_food.png"
            alt="Sizzling Gourmet Fried Egg & Toast"
            className="w-full h-full object-cover object-center animate-bg-reveal"
          />
          {/* Vignette Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
        </div>

        {/* Hero Content Container with Staggered Entrance Animations */}
        <div className="relative z-10 max-w-[85%] w-full mx-auto px-6 lg:px-12 flex flex-col justify-center">
          <div className="max-w-3xl space-y-6">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1] animate-hero-entrance delay-200">
              Elevate Your Taste Buds.
            </h1>

            <p className="text-white text-base sm:text-xl font-medium leading-relaxed max-w-2xl drop-shadow-md animate-hero-entrance delay-300">
              Indulge in expertly fried eggs with diced sweet peppers, melted
              cheddar & sizzling beef sausages, served piping hot inside soft,
              pillow-fresh warm bread.
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

            {/* Appetizing Highlights */}
            {/* <div className="flex flex-wrap items-center sm:gap-8 gap-4 pt-8 border-t border-white/40 text-xs sm:text-sm text-white animate-hero-entrance delay-500">
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
            </div> */}
          </div>
        </div>
      </section>

      {/* FULL-WIDTH MENU SECTION */}
      <div
        id="menu"
        className="max-w-[85%] mx-auto px-6 lg:px-12 space-y-8 pt-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <span>🍳 Signature Specials Menu</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Click any dish to view details, add extras, and add to cart.
            </p>
          </div>
        </div>

        {loadingCatalog ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {backendWakingUp && (
              <div className="col-span-full flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium animate-pulse">
                  <span>☕</span>
                  <span>Server is warming up — this takes about 30 seconds on first load…</span>
                </div>
                <button
                  onClick={fetchCatalog}
                  className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-700"
                >
                  Retry now
                </button>
              </div>
            )}
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-80 glass-panel animate-pulse bg-slate-100 rounded-2xl"
              />
            ))}
          </div>
        ) : presets.length === 0 ? (
          <div className="col-span-full flex flex-col items-center gap-4 py-12 text-center">
            <span className="text-5xl">😴</span>
            <p className="text-slate-500 font-medium">Could not load the menu. The server may still be waking up.</p>
            <button
              onClick={fetchCatalog}
              className="px-6 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {presets.map((preset) => {
              const lineItem = cart[preset.id];
              const inCart = lineItem && lineItem.qty > 0;
              return (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset)}
                  disabled={!preset.isAvailable}
                  className={`glass-panel overflow-hidden transition-all border flex flex-col text-left w-full group cursor-pointer disabled:cursor-not-allowed ${
                    inCart
                      ? "border-red-500/60 ring-2 ring-red-500/20 shadow-xl shadow-red-500/10"
                      : "border-slate-200 hover:border-red-300 hover:shadow-lg hover:shadow-red-500/10"
                  }`}
                >
                  <div>
                    {/* Food Image Container */}
                    <div className="relative h-52 lg:h-64 w-full overflow-hidden bg-slate-100">
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
                      {/* In-cart badge */}
                      {inCart && (
                        <div className="absolute top-3 left-3 bg-red-600 text-white text-[11px] font-black px-2.5 py-1 rounded-xl shadow-md">
                          {lineItem.qty} in cart
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

                      {/* Extras indicator */}
                      {preset.extras && preset.extras.length > 0 && (
                        <p className="text-[11px] text-red-500 font-semibold">
                          + {preset.extras.length} optional extra{preset.extras.length !== 1 ? 's' : ''} available
                        </p>
                      )}
                    </div>
                  </div>

                  {/* CTA Footer */}
                  <div className="px-5 pb-5 mt-auto">
                    <div className={`w-full py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider text-center transition-all ${
                      inCart
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-red-600 group-hover:text-white'
                    }`}>
                      {inCart ? `✓ In Cart — Tap to Edit` : 'Tap to Customise & Order'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Dish Detail Modal */}
      <DishDetailModal
        preset={selectedPreset}
        onClose={() => setSelectedPreset(null)}
      />
    </div>
  );
}
