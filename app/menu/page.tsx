"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import DishDetailModal from "@/components/DishDetailModal";
import { useCart } from "@/context/CartContext";
import { PresetMeal } from "@/lib/types";
import { motion } from "framer-motion";

export default function MenuPage() {
  const {
    presets,
    loadingCatalog,
    backendWakingUp,
    fetchCatalog,
    cart,
    formatPrice,
  } = useCart();

  const [selectedPreset, setSelectedPreset] = useState<PresetMeal | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPresets = useMemo(() => {
    if (!searchQuery.trim()) return presets;
    const q = searchQuery.toLowerCase();
    return presets.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.components.some((c) => c.toLowerCase().includes(q))
    );
  }, [presets, searchQuery]);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1 w-full px-4 sm:px-8 lg:px-12 py-3 sm:py-5 space-y-12">
        {/* HERO BANNER MATCHING MAMA CASS ORDER NOW */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full rounded-3xl sm:rounded-[36px] overflow-hidden min-h-[360px] sm:min-h-[420px] flex items-center justify-center shadow-lg bg-black"
        >
          {/* Background Image with Dark Vignette */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <motion.img
              initial={{ scale: 1.1 }}
              animate={{ scale: 1.02 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              src="/images/hero_food.png"
              alt="Delicious Gourmet Meal"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />
          </div>

          {/* Centered Hero Content */}
          <div className="relative z-10 text-center px-6 max-w-2xl mx-auto space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-4xl sm:text-6xl font-black text-white tracking-tight"
            >
              Order Now
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="text-white/90 text-sm sm:text-base font-medium leading-relaxed"
            >
              Your favorite gourmet bread, eggs and sizzled specials, now just a few clicks away.
              Browse, customize, and enjoy — hot, fresh, and delivered to your doorstep.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="pt-2"
            >
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="#menu-section"
                className="inline-flex items-center justify-center bg-white hover:bg-slate-100 text-[#e31b23] px-8 py-3 rounded-full font-extrabold text-sm tracking-wide shadow-md transition-colors"
              >
                Order Now
              </motion.a>
            </motion.div>
          </div>
        </motion.section>

        {/* EXPLORE OUR MENU SECTION */}
        <section id="menu-section" className="space-y-6 pt-4 pb-8">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Explore our menu
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const el = document.getElementById("search-box");
                el?.focus();
              }}
              className="self-start sm:self-auto bg-[#e31b23] hover:bg-[#c9151c] text-white px-7 py-3 rounded-full font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow transition-colors"
            >
              All Specials
            </motion.button>
          </div>

          {/* Search Bar matching reference */}
          <div className="w-full sm:max-w-sm">
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400 pointer-events-none text-sm">
                🔍
              </span>
              <input
                id="search-box"
                type="text"
                placeholder="Search meals, ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-2xl border border-red-200 focus:border-[#e31b23] focus:ring-2 focus:ring-red-500/10 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Catalog State: Loading / Empty / Grid */}
          {loadingCatalog ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
              {backendWakingUp && (
                <div className="col-span-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold">
                  <span>☕</span>
                  <span>Loading fresh catalog...</span>
                </div>
              )}
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 rounded-3xl bg-slate-100 animate-pulse border border-slate-200" />
              ))}
            </div>
          ) : filteredPresets.length === 0 ? (
            <div className="text-center py-16 space-y-4 bg-slate-50 rounded-3xl border border-slate-100 p-8">
              <span className="text-5xl">🔍</span>
              <h3 className="text-lg font-bold text-slate-800">No dishes found</h3>
              <p className="text-sm text-slate-500">
                {searchQuery
                  ? `No meals matched "${searchQuery}". Try a different keyword.`
                  : "Our kitchen catalog is currently refreshing."}
              </p>
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-full text-xs font-bold transition-colors"
                >
                  Clear search
                </button>
              ) : (
                <button
                  onClick={() => fetchCatalog()}
                  className="px-6 py-2.5 bg-[#e31b23] text-white rounded-full text-xs font-bold shadow-md hover:bg-[#c9151c] transition-colors"
                >
                  Refresh Menu
                </button>
              )}
            </div>
          ) : (
            /* 3-COLUMN DISH GRID WITH FRAMER MOTION */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {filteredPresets.map((preset, index) => {
                const lineItem = cart[preset.id];
                const inCart = lineItem && lineItem.qty > 0;

                return (
                  <motion.div
                    key={preset.id}
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: index * 0.08 }}
                    whileHover={{ y: -6, transition: { duration: 0.2 } }}
                    onClick={() => setSelectedPreset(preset)}
                    className="bg-[#f8f9fa] border border-slate-200/80 rounded-3xl p-5 flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-shadow cursor-pointer group"
                  >
                    {/* Inner White Image Card */}
                    <div className="relative bg-white rounded-2xl overflow-hidden h-48 sm:h-56 w-full flex items-center justify-center p-3 mb-4 shadow-xs">
                      <motion.img
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                        src={preset.imageUrl}
                        alt={preset.name}
                        className="w-full h-full object-cover rounded-xl"
                      />

                      {/* Sold Out Overlay */}
                      {!preset.isAvailable && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex items-center justify-center font-black text-[#e31b23] uppercase tracking-wider text-xs">
                          Sold Out
                        </div>
                      )}

                      {/* In Cart Indicator */}
                      {inCart && (
                        <div className="absolute top-3 left-3 bg-[#e31b23] text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-md">
                          {lineItem.qty} in cart
                        </div>
                      )}
                    </div>

                    {/* Dish Title & Info */}
                    <div className="space-y-2 mb-4 flex-1">
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base uppercase tracking-wide group-hover:text-[#e31b23] transition-colors">
                        {preset.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {preset.description}
                      </p>

                      {/* Included Components */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {preset.components.map((comp, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Row: Price & Tap to customise & order button */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between pt-3 border-t border-slate-200/60 mt-auto gap-2">
                      <span className="font-black text-slate-900 text-base sm:text-lg shrink-0">
                        {preset.priceFormatted || formatPrice(preset.priceKobo)}
                      </span>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPreset(preset);
                        }}
                        disabled={!preset.isAvailable}
                        className="bg-[#e31b23] hover:bg-[#c9151c] disabled:opacity-50 text-white px-3.5 sm:px-4 py-2.5 rounded-full font-bold text-[11px] sm:text-xs uppercase tracking-wider shadow-sm hover:shadow transition-colors text-center shrink-0 cursor-pointer"
                      >
                        {inCart
                          ? `In Cart (${lineItem.qty}) · Edit`
                          : "Tap to customise & order"}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Dish Detail Customization Modal */}
      <DishDetailModal
        preset={selectedPreset}
        onClose={() => setSelectedPreset(null)}
      />
    </div>
  );
}
