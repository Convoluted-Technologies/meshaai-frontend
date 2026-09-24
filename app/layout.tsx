import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import FoodCursor from '@/components/FoodCursor';

export const metadata: Metadata = {
  title: 'Meshaai - Elevate Your Taste Buds | Gourmet Roadside Bread & Eggs',
  description: 'Order piping hot roadside bread & egg preset meals delivered fast with Flutterwave payment.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-white text-slate-900 selection:bg-red-500 selection:text-white">
        {/* Interactive Food Particle Cursor */}
        <FoodCursor />

        {/* Navigation Header for White Theme */}
        <header className="sticky top-0 z-40 glass-nav px-6 lg:px-12 py-4 flex items-center justify-between shadow-xs">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-xl shadow-md shadow-red-600/20 group-hover:scale-110 group-hover:rotate-6 transition-all">
              🍳
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-wider text-slate-900 uppercase block leading-none group-hover:text-red-600 transition-colors">
                MESHA-HAVEN
              </span>
              <span className="text-[10px] text-red-600 font-extrabold uppercase tracking-widest block mt-0.5">
                Gourmet Bread & Eggs
              </span>
            </div>
          </Link>

          {/* Centered Navigation Items */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
            <Link href="/" className="hover:text-red-600 hover:scale-105 transition-all">
              Specials
            </Link>
            <Link href="/track" className="hover:text-red-600 hover:scale-105 transition-all">
              Track Order
            </Link>
            <Link href="/profile" className="hover:text-red-600 hover:scale-105 transition-all">
              Profile
            </Link>
            <Link href="/docs" className="hover:text-red-600 hover:scale-105 transition-all text-slate-400">
              API Specs
            </Link>
          </nav>

          {/* Right CTA Button */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="px-4 py-2 bg-slate-100 border border-slate-200 hover:border-red-500 text-slate-700 hover:text-red-600 rounded-xl text-xs font-bold transition-all hover:scale-105"
            >
              🔑 Admin
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full mx-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 py-8 px-6 text-center text-xs text-slate-500 bg-slate-50">
          <p>© 2026 Meshaai Gourmet Bread & Egg Dining. NGN Kobo Prices • Flutterwave Secured</p>
        </footer>
      </body>
    </html>
  );
}
