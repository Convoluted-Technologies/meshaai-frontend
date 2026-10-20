'use client';

import { useState, useEffect } from 'react';
import { PresetMeal, SelectedExtra } from '@/lib/types';
import { useCart } from '@/context/CartContext';

interface Props {
  preset: PresetMeal | null;
  onClose: () => void;
}

export default function DishDetailModal({ preset, onClose }: Props) {
  const { addToCart, cart, formatNGN } = useCart();
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);
  const [qty, setQty] = useState(1);

  // Pre-populate from existing cart entry when modal opens
  useEffect(() => {
    if (!preset) return;
    const existing = cart[preset.id];
    if (existing) {
      setQty(existing.qty);
      setSelectedExtras(existing.extras || []);
    } else {
      setQty(1);
      setSelectedExtras([]);
    }
  }, [preset]);

  if (!preset) return null;

  const toggleExtra = (extra: { id: string; name: string; priceKobo: number }) => {
    setSelectedExtras((prev) => {
      const idx = prev.findIndex((e) => e.extraId === extra.id);
      if (idx >= 0) return prev.filter((e) => e.extraId !== extra.id);
      return [...prev, { extraId: extra.id, name: extra.name, priceKobo: extra.priceKobo }];
    });
  };

  const isExtraSelected = (extraId: string) =>
    selectedExtras.some((e) => e.extraId === extraId);

  const extrasTotalKobo = selectedExtras.reduce((s, e) => s + e.priceKobo, 0);
  const unitTotal = preset.priceKobo + extrasTotalKobo;
  const grandTotal = unitTotal * qty;

  const handleAddToCart = () => {
    addToCart(preset.id, qty, selectedExtras);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl animate-slideUp md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:rounded-3xl md:max-h-[88vh]">
        {/* Hero Image */}
        <div className="relative h-64 w-full overflow-hidden rounded-t-3xl md:rounded-t-3xl flex-shrink-0">
          <img
            src={preset.imageUrl}
            alt={preset.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center font-bold text-lg hover:bg-black/70 transition-colors"
            aria-label="Close"
          >
            ×
          </button>
          {/* Price badge */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-red-200 font-black text-amber-600 text-sm shadow-md">
            {formatNGN(preset.priceKobo)}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title & Description */}
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 leading-snug">{preset.name}</h2>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{preset.description}</p>
          </div>

          {/* What's Included */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              ✅ What's Included
            </h3>
            <div className="flex flex-wrap gap-2">
              {preset.components.map((c, i) => (
                <span
                  key={i}
                  className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl font-semibold"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Extras */}
          {preset.extras && preset.extras.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                ➕ Extras (Optional Add-ons)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {preset.extras.map((extra) => {
                  const selected = isExtraSelected(extra.id);
                  return (
                    <button
                      key={extra.id}
                      type="button"
                      onClick={() => toggleExtra(extra)}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl border-2 text-left transition-all duration-200 ${
                        selected
                          ? 'border-red-500 bg-red-50 shadow-md shadow-red-100'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                            selected ? 'bg-red-500' : 'bg-slate-200'
                          }`}
                        >
                          {selected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-xs font-semibold leading-tight ${selected ? 'text-red-700' : 'text-slate-700'}`}>
                          {extra.name}
                        </span>
                      </div>
                      <span className={`text-xs font-black ml-2 flex-shrink-0 ${selected ? 'text-red-600' : 'text-slate-500'}`}>
                        +{formatNGN(extra.priceKobo)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity + Total */}
          <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-5 py-4 border border-slate-200">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Quantity</p>
              <div className="flex items-center gap-3 mt-1.5">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-extrabold flex items-center justify-center shadow-xs transition-all active:scale-90"
                >
                  −
                </button>
                <span className="w-8 text-center font-black text-slate-900 text-lg tabular-nums">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-8 h-8 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold flex items-center justify-center shadow-xs transition-all active:scale-90"
                >
                  +
                </button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{formatNGN(grandTotal)}</p>
              {selectedExtras.length > 0 && (
                <p className="text-[11px] text-red-500 font-semibold mt-0.5">
                  Incl. {formatNGN(extrasTotalKobo * qty)} extras
                </p>
              )}
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!preset.isAvailable}
            className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all active:scale-[0.98]"
          >
            {preset.isAvailable ? (
              <>
                <span>🛒</span>
                <span>Add to Cart — {formatNGN(grandTotal)}</span>
              </>
            ) : (
              <span>Currently Sold Out</span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
