import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import FoodCursor from "@/components/FoodCursor";
import CookieBanner from "@/components/CookieBanner";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Meeshaai - Elevate Your Taste Buds | Gourmet Roadside Bread & Eggs",
  description:
    "Order piping hot roadside bread & egg preset meals delivered fast with Flutterwave payment.",
  icons: {
    icon: "/images/logo.png",
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },
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

          {/* Cookie consent banner */}
          <CookieBanner />

          {/* ── Footer ────────────────────────────────────────────────────── */}
          <footer className="bg-slate-950 text-white mt-16">
            {/* Top section */}
            <div className="max-w-6xl mx-auto px-6 pt-14 pb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

              {/* Brand */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/images/logo.png"
                    alt="Meeshaai logo"
                    className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-amber-500/30"
                  />
                  <div>
                    <p className="text-base font-black text-white leading-none">Meeshaai</p>
                    <p className="text-[11px] text-slate-400 leading-none mt-0.5">Gourmet Bread &amp; Egg Dining</p>
                  </div>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                  Abuja&apos;s finest roadside-inspired gourmet bread and egg meals,
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
                    <Link href="/about" className="text-slate-300 hover:text-amber-400 transition-colors">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/faq" className="text-slate-300 hover:text-amber-400 transition-colors">
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link href="/profile" className="text-slate-300 hover:text-amber-400 transition-colors">
                      My Account
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Support</p>
                <ul className="space-y-2.5 text-sm">
                  <li>
                    <Link href="/feedback" className="text-slate-300 hover:text-amber-400 transition-colors">
                      Contact Us
                    </Link>
                  </li>
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
                    <a href="mailto:support@meeshaai.com" className="text-slate-300 hover:text-amber-400 transition-colors">
                      support@meeshaai.com
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-800">
              <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <p>© 2026 Meeshaai Gourmet Bread &amp; Egg Dining. All rights reserved.</p>
                <div className="flex items-center gap-4">
                  <Link href="/about" className="hover:text-slate-300 transition-colors">About</Link>
                  <Link href="/faq" className="hover:text-slate-300 transition-colors">FAQ</Link>
                  <Link href="/feedback" className="hover:text-slate-300 transition-colors">Contact</Link>
                  <Link href="/privacy-policy" className="hover:text-slate-300 transition-colors">Privacy</Link>
                </div>
              </div>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
