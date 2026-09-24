import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

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
      <body className="antialiased min-h-screen flex flex-col bg-[#090d16] text-slate-100">
        {/* Navigation Header inspired by reference image */}
        <header className="sticky top-0 z-50 glass-nav px-6 lg:px-12 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-xl shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform">
              🍳
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-wider text-white uppercase block leading-none">
                MESHA-HAVEN
              </span>
              <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest block mt-0.5">
                Gourmet Bread & Eggs
              </span>
            </div>
          </Link>

          {/* Centered Navigation Items */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <Link href="/" className="hover:text-red-500 transition-colors">
              Specials
            </Link>
            <Link href="/track" className="hover:text-red-500 transition-colors">
              Track Order
            </Link>
            <Link href="/profile" className="hover:text-red-500 transition-colors">
              Profile
            </Link>
            <Link href="/docs" className="hover:text-red-500 transition-colors text-slate-400">
              API Specs
            </Link>
          </nav>

          {/* Right CTA Button */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="px-4 py-2 bg-slate-900 border border-slate-700 hover:border-red-500 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all"
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
        <footer className="border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500">
          <p>© 2026 Meshaai Gourmet Bread & Egg Dining. NGN Kobo Prices • Flutterwave Secured</p>
        </footer>
      </body>
    </html>
  );
}
