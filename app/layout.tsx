import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
// import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import FoodCursor from "@/components/FoodCursor";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Meshaai - Elevate Your Taste Buds | Gourmet Roadside Bread & Eggs",
  description:
    "Order piping hot roadside bread & egg preset meals delivered fast with Flutterwave payment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-white text-slate-900 selection:bg-red-500 selection:text-white relative">
        <CartProvider>
          {/* Custom Interactive Food Particle Cursor */}
          <FoodCursor />

          {/* Main Page Content */}
          <main className="flex-1 w-full mx-auto">{children}</main>

          {/* Slide-over Cart Drawer */}
          <CartDrawer />

          {/* ── Footer ────────────────────────────────────────────────────── */}
          <footer className="bg-slate-950 text-white mt-16">
            {/* Top section */}
            <div className="max-w-6xl mx-auto px-6 pt-14 pb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

              {/* Brand */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-xl font-black shrink-0 shadow-lg shadow-amber-500/30">
                    🍳
                  </div>
                  <div>
                    <p className="text-base font-black text-white leading-none">Meshaai</p>
                    <p className="text-[11px] text-slate-400 leading-none mt-0.5">Gourmet Bread &amp; Egg Dining</p>
                  </div>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                  Lagos&apos; finest roadside-inspired gourmet bread and egg meals,
                  prepared fresh to order and delivered hot to your door. Freshly
                  fried eggs, artisan bread, and grilled sausages — elevated.
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
                    <span className="text-emerald-400">●</span> Live &amp; Delivering
                  </span>
                  <span className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
                    🔒 Flutterwave Secured
                  </span>
                </div>
              </div>

              {/* Quick Links */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quick Links</p>
                <ul className="space-y-2.5 text-sm">
                  <li>
                    <Link href="/" className="text-slate-300 hover:text-amber-400 transition-colors">
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link href="/#menu" className="text-slate-300 hover:text-amber-400 transition-colors">
                      Our Menu
                    </Link>
                  </li>
                  <li>
                    <Link href="/track" className="text-slate-300 hover:text-amber-400 transition-colors">
                      Track Your Order
                    </Link>
                  </li>
                  <li>
                    <Link href="/profile" className="text-slate-300 hover:text-amber-400 transition-colors">
                      My Account
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs" className="text-slate-300 hover:text-amber-400 transition-colors">
                      API Docs
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Legal</p>
                <ul className="space-y-2.5 text-sm">
                  <li>
                    <Link href="/privacy-policy" className="text-slate-300 hover:text-amber-400 transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms-and-conditions" className="text-slate-300 hover:text-amber-400 transition-colors">
                      Terms &amp; Conditions
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms-of-service" className="text-slate-300 hover:text-amber-400 transition-colors">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <a href="mailto:support@meshaai.com" className="text-slate-300 hover:text-amber-400 transition-colors">
                      support@meshaai.com
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-800">
              <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <p>© 2026 Meshaai Gourmet Bread &amp; Egg Dining. All rights reserved.</p>
                <div className="flex items-center gap-4">
                  <Link href="/privacy-policy" className="hover:text-slate-300 transition-colors">Privacy</Link>
                  <Link href="/terms-and-conditions" className="hover:text-slate-300 transition-colors">Terms</Link>
                  <Link href="/terms-of-service" className="hover:text-slate-300 transition-colors">ToS</Link>
                </div>
              </div>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
