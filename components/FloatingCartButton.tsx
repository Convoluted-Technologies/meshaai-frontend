"use client";

import { useCart } from "@/context/CartContext";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function FloatingCartButton() {
  const { totalCartCount, setIsCartOpen } = useCart();
  const pathname = usePathname();

  // Do not render the floating cart button in admin or ops portals
  if (pathname?.startsWith("/mshsuper") || pathname?.startsWith("/ops")) {
    return null;
  }

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1, rotate: 2 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={() => setIsCartOpen(true)}
      aria-label="Open Shopping Cart"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-black hover:bg-neutral-900 text-white rounded-full flex items-center justify-center shadow-2xl transition-colors group border border-white/10 cursor-pointer"
    >
      {/* Shopping Cart Icon matching Mama Cass */}
      <svg
        className="w-6 h-6 text-white group-hover:scale-105 transition-transform"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>

      {/* Cart Item Badge with AnimatePresence */}
      <AnimatePresence>
        {totalCartCount > 0 && (
          <motion.span
            key={totalCartCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            className="absolute -top-1.5 -right-1.5 bg-[#e31b23] text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-md"
          >
            {totalCartCount}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
