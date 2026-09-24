'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Order, OrderStatus } from '@/lib/types';
import Link from 'next/link';

function TrackContent() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [phone, setPhone] = useState(searchParams.get('phone') || '');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (code && phone) {
      fetchOrderTracking(code, phone);
    }
  }, [code, phone]);

  async function fetchOrderTracking(searchCode: string, searchPhone: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `/api/orders/track?code=${encodeURIComponent(searchCode)}&phone=${encodeURIComponent(searchPhone)}`
      );
      const data = await res.json();
      if (res.ok && data.order) {
        setOrder(data.order);
      } else {
        setOrder(null);
        setError(data.detail || data.title || 'Order not found');
      }
    } catch (err: any) {
      setError('Network error searching for order');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!code || !phone) return alert('Please enter both Order Code and Phone Number');
    fetchOrderTracking(code, phone);
  }

  async function handleCancelOrder() {
    if (!order) return;
    if (!confirm('Are you sure you want to cancel this order? If paid, a refund will be processed.')) return;

    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: order.phone,
          reason: 'Customer cancelled from tracking page',
        }),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setOrder(data.order);
        alert('Order cancelled successfully!');
      } else {
        alert(data.detail || 'Failed to cancel order');
      }
    } catch (err) {
      alert('Error cancelling order');
    } finally {
      setCancelling(false);
    }
  }

  const STEPS: { status: OrderStatus; label: string; icon: string }[] = [
    { status: 'PENDING_PAYMENT', label: 'Payment Pending', icon: '💳' },
    { status: 'PAID', label: 'Payment Received', icon: '✅' },
    { status: 'CONFIRMED', label: 'Order Confirmed', icon: '👍' },
    { status: 'PREPARING', label: 'Preparing Meal', icon: '🍳' },
    { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: '🛵' },
    { status: 'DELIVERED', label: 'Delivered', icon: '🎉' },
  ];

  const getStepIndex = (status: OrderStatus) => {
    return STEPS.findIndex((s) => s.status === status);
  };

  const formatNGN = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          📍 Live Order Tracking
        </h1>
        <p className="text-sm text-slate-400">
          Track your bread & egg meal status from grill to your doorstep.
        </p>
      </div>

      {/* Lookup Form */}
      <form onSubmit={handleSearch} className="glass-panel p-4 sm:p-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Order Code (e.g. MSH-4F7K2)"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="flex-1 text-sm bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 uppercase font-mono focus:outline-none focus:border-amber-500"
        />
        <input
          type="tel"
          placeholder="Phone Number (e.g. 08012345678)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="flex-1 text-sm bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md shadow-amber-500/20"
        >
          {loading ? 'Searching...' : 'Track'}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-sm text-center">
          ⚠️ {error}
        </div>
      )}

      {/* Order Tracking Details */}
      {order && (
        <div className="glass-panel p-6 space-y-8">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-mono text-amber-400">
                  #{order.code}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    order.status === 'DELIVERED'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : order.status === 'CANCELLED' || order.status === 'REFUNDED'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Placed on {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="text-right">
              <span className="block text-xs text-slate-400">Total Paid</span>
              <span className="text-xl font-extrabold text-white font-mono">
                {formatNGN(order.totalKobo)}
              </span>
            </div>
          </div>

          {/* Visual Stepper */}
          {!['CANCELLED', 'EXPIRED', 'REFUNDED', 'FAILED_DELIVERY'].includes(order.status) && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Order Lifecycle
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {STEPS.map((step, idx) => {
                  const currentIdx = getStepIndex(order.status);
                  const isCompleted = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div
                      key={step.status}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isCurrent
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10 ring-2 ring-amber-500/30'
                          : isCompleted
                          ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                          : 'bg-slate-900/40 border-slate-800/60 text-slate-500 opacity-50'
                      }`}
                    >
                      <div className="text-lg">{step.icon}</div>
                      <div className="text-[11px] font-semibold mt-1 leading-tight">{step.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rider & Proof of Delivery Card */}
          {order.rider && (
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Assigned Dispatch Rider</span>
                <span className="font-bold text-slate-100 text-sm">{order.rider.name}</span>
                <span className="block text-xs text-amber-400 font-mono">{order.rider.phone}</span>
              </div>
              {order.deliveryProof && (
                <div className="text-right bg-amber-500/10 border border-amber-500/30 px-3 py-2 rounded-lg">
                  <span className="text-[10px] text-amber-400 uppercase block font-semibold">
                    Delivery OTP Code
                  </span>
                  <span className="font-mono font-extrabold text-amber-300 text-lg">
                    {order.deliveryProof.code}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Items List & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Meal Items
              </h4>
              <div className="space-y-1.5 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                {order.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {i.qty}× {i.presetName}
                    </span>
                    <span className="font-mono text-slate-200">{formatNGN(i.totalKobo)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Delivery Address
              </h4>
              <div className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
                <p className="font-semibold text-slate-200">{order.location.address}</p>
                <p className="text-slate-400">Landmark: {order.location.landmark}</p>
                <p className="text-slate-500">Phone: {order.phone}</p>
              </div>
            </div>
          </div>

          {/* Audit Trail */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              State Audit History
            </h4>
            <div className="space-y-1.5 text-xs">
              {order.auditTrail.map((audit) => (
                <div key={audit.id} className="flex items-center justify-between text-slate-400 bg-slate-900/40 p-2 rounded-lg">
                  <span>
                    <span className="font-semibold text-slate-200">{audit.toState}</span> ({audit.reason})
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(audit.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Self-service Cancellation Action */}
          {['PENDING_PAYMENT', 'PAID', 'CONFIRMED'].includes(order.status) && (
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="px-4 py-2 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 font-semibold text-xs rounded-xl transition-all"
              >
                {cancelling ? 'Cancelling...' : '🚫 Cancel Order & Request Auto Refund'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-slate-400">Loading Order Tracker...</div>}>
      <TrackContent />
    </Suspense>
  );
}
