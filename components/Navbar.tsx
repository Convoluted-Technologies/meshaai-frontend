'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
  const pathname = usePathname();
  const { totalCartCount, quote, setIsCartOpen, formatNGN } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Specials Menu', href: '/#menu' },
    { name: 'Track Live Order', href: '/track' },
    { name: 'Profile', href: '/profile' },
    { name: 'API Specs', href: '/docs' },
  ];

  return (
    <header className="sticky top-3 z-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full transition-all">
      <div className="glass-nav rounded-2xl px-5 py-3 flex items-center justify-between shadow-xl shadow-slate-900/5 border border-slate-200/80 backdrop-blur-xl bg-white/90">
        {/* Brand & Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-amber-500 to-orange-500 flex items-center justify-center text-xl shadow-md shadow-red-600/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
            🍳
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-wider text-slate-900 uppercase block leading-none group-hover:text-red-600 transition-colors">
                MESHA-HAVEN
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Open & Sizzling
              </span>
            </div>
            <span className="text-[10px] text-red-600 font-extrabold uppercase tracking-widest block mt-0.5">
              Gourmet Bread & Eggs
            </span>
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
                className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 ${
                  isActive
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
          <Link
            href="/admin"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 border border-slate-200 hover:border-red-400 text-slate-700 hover:text-red-600 rounded-xl text-xs font-bold transition-all hover:scale-105"
          >
            <span>🔑</span>
            <span>Admin</span>
          </Link>

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
                {formatNGN(quote.grandTotalKobo)}
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
          <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-bold text-slate-600 hover:text-red-600 flex items-center gap-1"
            >
              🔑 Admin Console
            </Link>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-bold">
              🟢 Open & Sizzling
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
