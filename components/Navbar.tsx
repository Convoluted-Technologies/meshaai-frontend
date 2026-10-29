"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const { totalCartCount, quote, setIsCartOpen, formatNGN } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Menu", href: "/#menu" },
    { name: "About", href: "/about" },
    { name: "FAQ", href: "/faq" },
    { name: "My Account", href: "/profile" },
  ];

  return (
    <header className="sticky top-3 z-30 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
      <div className="glass-nav rounded-2xl px-4 sm:px-5 py-3 flex items-center justify-between shadow-xl shadow-slate-900/5 border border-slate-200/80 backdrop-blur-xl bg-white/90">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 via-amber-500 to-orange-500 flex items-center justify-center text-lg shadow-md shadow-red-600/30 group-hover:scale-110 transition-transform duration-300">
            🍳
          </div>
          <span className="font-black text-base sm:text-lg tracking-wider text-slate-900 uppercase group-hover:text-red-600 transition-colors">
            Meeshaai
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Cart button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="btn-crimson px-3 sm:px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-red-600/30 hover:scale-105 transition-all"
            aria-label="Open cart"
          >
            <span>🛒</span>
            <span className="hidden xs:inline">Cart</span>
            {totalCartCount > 0 && (
              <span className="bg-white text-red-700 px-1.5 py-0.5 rounded-full font-black text-[11px] shadow-xs">
                {totalCartCount}
              </span>
            )}
            {quote && (
              <span className="font-mono text-amber-200 border-l border-red-400/50 pl-1.5 hidden sm:inline text-[11px]">
                {formatNGN(quote.grandTotalKobo)}
              </span>
            )}
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-base transition-colors border border-slate-200"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 glass-panel rounded-2xl p-3 space-y-1 border border-slate-200 shadow-2xl bg-white/95 backdrop-blur-xl">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              {link.name === "Menu" && <span>🍳</span>}
              {link.name === "About" && <span>ℹ️</span>}
              {link.name === "FAQ" && <span>❓</span>}
              {link.name === "My Account" && <span>👤</span>}
              {link.name}
            </Link>
          ))}
          <div className="pt-1 border-t border-slate-100 mt-1">
            <button
              onClick={() => { setIsCartOpen(true); setMobileMenuOpen(false); }}
              className="w-full btn-crimson py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2"
            >
              🛒 View Cart
              {totalCartCount > 0 && (
                <span className="bg-white text-red-700 px-2 py-0.5 rounded-full font-black text-xs">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
