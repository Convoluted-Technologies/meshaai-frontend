import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Meshaai - Bread & Eggs Quick Meal Service',
  description: 'Order fresh roadside bread & egg preset meals delivered fast with Flutterwave payment.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-slate-950 text-slate-100">
        {/* Navigation Header */}
        <header className="sticky top-0 z-50 glass-nav px-4 lg:px-8 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              🍳
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-200 bg-clip-text text-transparent">
                Meshaai
              </span>
              <span className="block text-[10px] text-amber-500/90 uppercase tracking-widest font-semibold">
                Bread & Eggs Express
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-6 text-sm font-medium">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg hover:bg-slate-800/80 text-slate-300 hover:text-amber-400 transition-colors"
            >
              🍔 Menu
            </Link>
            <Link
              href="/track"
              className="px-3 py-1.5 rounded-lg hover:bg-slate-800/80 text-slate-300 hover:text-amber-400 transition-colors"
            >
              📍 Track Order
            </Link>
            <Link
              href="/profile"
              className="px-3 py-1.5 rounded-lg hover:bg-slate-800/80 text-slate-300 hover:text-amber-400 transition-colors"
            >
              👤 Profile
            </Link>
            {/* <Link
              href="/docs"
              className="hidden md:inline-flex px-3 py-1.5 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 transition-colors text-xs"
            >
              ⚡ API Docs
            </Link>
            <Link
              href="/admin"
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-amber-500/50 text-amber-400 hover:text-amber-300 transition-all shadow-sm font-semibold text-xs flex items-center gap-1.5"
            >
              🔑 Admin Studio
            </Link> */}
          </nav>
        </header>

        {/* Main Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800 py-6 px-4 text-center text-xs text-slate-500">
          <p>© 2026 Meshaai Meal Ordering Platform. NGN Kobo Prices • Flutterwave Secured</p>
        </footer>
      </body>
    </html>
  );
}
