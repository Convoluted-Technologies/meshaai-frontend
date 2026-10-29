'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const COOKIE_KEY = 'Meeshaai_cookie_consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_KEY);
      if (!consent) setVisible(true);
    } catch {
      // localStorage not available — don't show banner
    }
  }, []);

  function accept() {
    try { localStorage.setItem(COOKIE_KEY, 'accepted'); } catch {}
    setVisible(false);
  }

  function decline() {
    try { localStorage.setItem(COOKIE_KEY, 'declined'); } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[200] p-4 sm:p-6">
      <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-xl shrink-0">
          🍪
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">We use cookies</p>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            We store your cart, saved address, and session token in your browser so
            checkout is faster next time. No third-party tracking or advertising cookies.{' '}
            <Link href="/privacy-policy" className="text-amber-400 hover:text-amber-300 underline transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={decline}
            className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md shadow-amber-500/20 transition-all"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
