'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';

const CURRENCIES = [
  { code: 'NGN', label: '🇳🇬 NGN (₦)' },
  { code: 'USD', label: '🇺🇸 USD ($)' },
  { code: 'GBP', label: '🇬🇧 GBP (£)' },
  { code: 'EUR', label: '🇪🇺 EUR (€)' },
  { code: 'CAD', label: '🇨🇦 CAD (C$)' },
  { code: 'GHS', label: '🇬🇭 GHS (GH₵)' },
  { code: 'KES', label: '🇰🇪 KES (KSh)' },
];

export default function Navbar() {
  const pathname = usePathname();
  const {
    totalCartCount,
    quote,
    setIsCartOpen,
    selectedCurrency,
    setSelectedCurrency,
    formatPrice,
  } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Specials Menu', href: '/#menu' },
    { name: 'Track Live Order', href: '/track' },
    { name: 'Profile', href: '/profile' },
    // { name: 'Admin Studio', href: '/admin' },
  ];

  return (
    <header className="sticky top-3 z-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full transition-all animate-nav-entrance">
      <div className="glass-nav rounded-2xl px-5 py-3 flex items-center justify-between shadow-xl shadow-slate-900/5 border border-slate-200/80 backdrop-blur-xl bg-white/90">
        {/* Brand & Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-amber-500 to-orange-500 flex items-center justify-center text-xl shadow-md shadow-red-600/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
            🍳
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-wider text-slate-900 uppercase block leading-none group-hover:text-red-600 transition-colors">
                MESHAAI
              </span>
            </div>
          </div>
        </Link>

        {/* Centered Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 ${isActive
                    ? 'bg-white text-red-600 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-red-600 hover:bg-white/60'
                  }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Center */}
        <div className="flex items-center gap-3">
          {/* Currency Switcher Dropdown */}
          <div className="relative">
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="bg-slate-100 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 shadow-xs"
              aria-label="Select currency"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="btn-crimson px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-600/30 border border-red-400/40 hover:scale-105 transition-all"
          >
            <span>🛒 Cart</span>
            {totalCartCount > 0 && (
              <span className="bg-white text-red-700 px-2 py-0.5 rounded-full font-black text-[11px] font-mono shadow-xs">
                {totalCartCount}
              </span>
            )}
            {quote && (
              <span className="font-mono text-amber-200 border-l border-red-400/50 pl-2 hidden xs:inline">
                {formatPrice(quote.grandTotalKobo)}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-base transition-colors border border-slate-200"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 glass-panel p-4 space-y-2 border border-slate-200 shadow-2xl animate-in slide-in-from-top duration-300">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
