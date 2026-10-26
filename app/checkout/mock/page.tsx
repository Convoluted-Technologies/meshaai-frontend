'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function MockCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const txRef = searchParams.get('tx_ref') || '';
  const amount = searchParams.get('amount') || '0';
  const code = searchParams.get('code') || '';

  const [processing, setProcessing] = useState(false);

  async function processPayment(status: 'SUCCESS' | 'FAILED') {
    setProcessing(true);
    try {
      const res = await fetch('/api/payments/mock-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txRef,
          status,
        }),
      });
      const data = await res.json();
      if (data.order) {
        router.push(`/profile?paid=1`);
      } else {
        alert('Payment result processed');
        router.push('/');
      }
    } catch (err) {
      alert('Error processing mock payment');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <div className="glass-panel p-8 space-y-6 text-center border-amber-500/30">
        <div className="w-16 h-16 bg-orange-500/20 border border-orange-500/40 text-orange-400 rounded-full flex items-center justify-center text-3xl mx-auto">
          💳
        </div>

        <div>
          <span className="text-xs font-semibold text-orange-400 uppercase tracking-widest block">
            Flutterwave Standard Sandbox Gateway
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Complete Payment
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Order #{code} • TxRef: {txRef}
          </p>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 block">Total Amount Due</span>
          <span className="text-3xl font-black text-amber-400 font-mono">
            ₦{Number(amount).toLocaleString()} NGN
          </span>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => processPayment('SUCCESS')}
            disabled={processing}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-sm"
          >
            {processing ? 'Processing...' : '✅ Simulate Successful Payment'}
          </button>

          <button
            onClick={() => processPayment('FAILED')}
            disabled={processing}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-red-400 font-semibold rounded-xl text-xs transition-all border border-slate-700"
          >
            ❌ Simulate Failed / Cancelled Payment
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MockCheckoutPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-slate-400">Loading Payment Gateway...</div>}>
      <MockCheckoutContent />
    </Suspense>
  );
}
