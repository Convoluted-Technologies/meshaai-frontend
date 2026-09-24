import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
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
      <body className="antialiased min-h-screen flex flex-col bg-white text-slate-900 selection:bg-red-500 selection:text-white relative">
        <CartProvider>
          {/* Custom Interactive Food Particle Cursor */}
          <FoodCursor />

          {/* Floating Gourmet Navigation Bar - Absolute Top Overlay */}
          <div className="absolute top-4 inset-x-0 z-40 pointer-events-auto">
            <Navbar />
          </div>

          {/* Main Page Content */}
          <main className="flex-1 w-full mx-auto">
            {children}
          </main>

          {/* Slide-over Cart Drawer */}
          <CartDrawer />

          {/* Footer */}
          <footer className="border-t border-slate-200 py-8 px-6 text-center text-xs text-slate-500 bg-slate-50 mt-12">
            <p>© 2026 Meshaai Gourmet Bread & Egg Dining. NGN Kobo Prices • Flutterwave Secured</p>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
