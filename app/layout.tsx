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
                  Abuja&apos;s finest gourmet bread and egg meals,
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
                {/* Social handles */}
                <div className="flex items-center gap-3 pt-1">
                  <a
                    href="https://www.instagram.com/hello.meeshaai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-pink-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                    </svg>
                    @hello.meeshaai
                  </a>
                  <a
                    href="https://x.com/hellomeeshaai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-sky-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                    </svg>
                    @hellomeeshaai
                  </a>
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
                    <a href="mailto:hello.meeshaai@gmail.com" className="text-slate-300 hover:text-amber-400 transition-colors">
                      hello.meeshaai@gmail.com
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
