"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart, SupportedCurrency } from "@/context/CartContext";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";

const CURRENCIES: { code: SupportedCurrency; label: string; flag: string }[] = [
  { code: "NGN", label: "NGN (₦)", flag: "🇳🇬" },
  { code: "USD", label: "USD ($)", flag: "🇺🇸" },
  { code: "GBP", label: "GBP (£)", flag: "🇬🇧" },
  { code: "EUR", label: "EUR (€)", flag: "🇪🇺" },
  { code: "CAD", label: "CAD ($)", flag: "🇨🇦" },
  { code: "GHS", label: "GHS (₵)", flag: "🇬🇭" },
  { code: "KES", label: "KES (KSh)", flag: "🇰🇪" },
];

export default function Navbar() {
  const { totalCartCount, setIsCartOpen, currency, setCurrency } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const pathname = usePathname();

  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Appear when user scrolls up, hide when user scrolls down
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 100) {
      setHidden(true);
      setMobileMenuOpen(false);
      setCurrencyDropdownOpen(false);
    } else {
      setHidden(false);
    }
    setIsScrolled(latest > 20);
  });

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About us", href: "/about" },
    { name: "Contact us", href: "/feedback" },
  ];

  return (
    <>
      <motion.header
        variants={{
          visible: { y: 0, opacity: 1 },
          hidden: { y: "-100%", opacity: 0 },
        }}
        animate={hidden ? "hidden" : "visible"}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 inset-x-0 z-50 w-full transition-all duration-300 ${isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-md shadow-slate-900/5"
          : "bg-white"
          }`}
      >
        <div className="w-full px-4 sm:px-8 lg:px-12 h-16 sm:h-[68px] flex items-center justify-between">
          {/* Brand Logo & Name on Left */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            >
              <img
                src="/images/logo.png"
                alt="Meeshaai Logo"
                className="w-9 h-9 rounded-md object-cover"
              />
            </motion.div>
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-900 group-hover:text-[#e31b23] transition-colors">
              meeshaai
            </span>
          </Link>

          {/* All Navigation Links + Currency Switcher + Order Now Button Aligned on the Right */}
          <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`text-sm font-semibold transition-colors relative py-1 ${isActive
                      ? "text-[#e31b23]"
                      : "text-slate-700 hover:text-[#e31b23]"
                      }`}
                  >
                    {link.name}
                    {isActive && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e31b23] rounded-full"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Currency Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
                aria-label="Change currency"
              >
                <span>{CURRENCIES.find((c) => c.code === currency)?.flag || "₦"}</span>
                <span>{currency}</span>
                <span className="text-[10px] text-slate-400">▾</span>
              </button>

              <AnimatePresence>
                {currencyDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-36 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 text-xs overflow-hidden"
                  >
                    {CURRENCIES.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setCurrency(c.code);
                          setCurrencyDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-2 text-left flex items-center justify-between font-bold hover:bg-red-50 hover:text-[#e31b23] transition-colors ${currency === c.code
                          ? "bg-red-50 text-[#e31b23]"
                          : "text-slate-700"
                          }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>{c.flag}</span>
                          <span>{c.code}</span>
                        </span>
                        {currency === c.code && <span className="text-xs">✓</span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Profile Icon */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/profile"
                aria-label="My Account"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-red-50 hover:text-[#e31b23] text-slate-600 transition-colors border border-slate-200 hover:border-red-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </Link>
            </motion.div>

            {/* Red Order Now Pill Button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/menu"
                className="hidden sm:inline-flex items-center justify-center bg-[#e31b23] hover:bg-[#c9151c] text-white px-7 py-2.5 rounded-full font-bold text-sm tracking-wide shadow-sm hover:shadow-md transition-colors"
              >
                Order Now
              </Link>
            </motion.div>

            {/* Quick Cart count if any */}
            {totalCartCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCartOpen(true)}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                aria-label="Cart summary"
              >
                <span>🛒</span>
                <span>{totalCartCount}</span>
              </motion.button>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="md:hidden overflow-hidden border-t border-slate-100 bg-white px-6 py-5 space-y-4 shadow-xl"
            >
              <nav className="flex flex-col space-y-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-semibold text-slate-700 hover:text-[#e31b23] transition-colors py-1"
                  >
                    {link.name}
                  </Link>
                ))}
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-semibold text-slate-700 hover:text-[#e31b23] transition-colors py-1 flex items-center justify-between"
                >
                  <span>My Account</span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">👤</span>
                </Link>
                <Link
                  href="/orders/track"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-semibold text-slate-700 hover:text-[#e31b23] transition-colors py-1 flex items-center justify-between"
                >
                  <span>Track Order</span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">📍</span>
                </Link>
              </nav>

              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <Link
                  href="/menu"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center bg-[#e31b23] hover:bg-[#c9151c] text-white py-3 rounded-full font-bold text-sm shadow-md"
                >
                  Order Now
                </Link>

                {totalCartCount > 0 && (
                  <button
                    onClick={() => {
                      setIsCartOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2.5 text-center text-xs font-bold text-slate-600 bg-slate-100 rounded-full"
                  >
                    🛒 View Cart ({totalCartCount} items)
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Spacer matching navbar height so top content aligns naturally */}
      <div className="h-16 sm:h-[68px] w-full shrink-0" aria-hidden="true" />
    </>
  );
}
