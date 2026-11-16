"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useCart } from "@/context/CartContext";
import { resolveErrorMessage } from "@/lib/errorCodes";

interface OrderTrackingData {
  id?: string;
  code: string;
  status: "PLACED" | "PAID" | "CONFIRMED" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
  paymentStatus?: string;
  deliveryMode?: string;
  totalKobo?: number;
  deliveryFeeKobo?: number;
  items?: {
    presetId?: string;
    presetName: string;
    qty: number;
    unitPriceKobo: number;
    extras?: { optionName: string; priceKobo: number }[];
  }[];
  deliveryAddress?: string;
  landmark?: string;
  customerName?: string;
  customerPhone?: string;
  riderName?: string;
  riderPhone?: string;
  confirmationCode?: string;
  createdAt?: string;
  estimatedDeliveryTime?: string;
}

const STEPS = [
  { key: "PAID", label: "Order Confirmed", desc: "Payment received & verified" },
  { key: "CONFIRMED", label: "Kitchen Accepted", desc: "Order queued for preparation" },
  { key: "PREPARING", label: "Cooking", desc: "Chef is frying fresh eggs & bread" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", desc: "Rider dispatched with your meal" },
  { key: "DELIVERED", label: "Delivered", desc: "Enjoy your warm meal!" },
];

function getStepIndex(status: string): number {
  switch (status) {
    case "PLACED":
    case "PAID":
      return 0;
    case "CONFIRMED":
      return 1;
    case "PREPARING":
      return 2;
    case "OUT_FOR_DELIVERY":
      return 3;
    case "DELIVERED":
      return 4;
    default:
      return 0;
  }
}

function OrderTrackerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { formatPrice } = useCart();

  const initialCode = searchParams.get("code") || "";
  const initialPhone = searchParams.get("phone") || "";

  const [inputCode, setInputCode] = useState(initialCode);
  const [inputPhone, setInputPhone] = useState(initialPhone);
  const [order, setOrder] = useState<OrderTrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Cancellation state
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (initialCode && initialPhone) {
      fetchOrderStatus(initialCode, initialPhone);
    }
  }, [initialCode, initialPhone]);

  // Auto-polling every 15s if order is active
  useEffect(() => {
    if (!order || order.status === "DELIVERED" || order.status === "CANCELLED") return;

    const timer = setInterval(() => {
      fetchOrderStatus(order.code, inputPhone || initialPhone, true);
    }, 15000);

    return () => clearInterval(timer);
  }, [order, inputPhone, initialPhone]);

  async function fetchOrderStatus(code: string, phone: string, isSilent = false) {
    if (!code.trim() || !phone.trim()) {
      setError("Please provide both order code and phone number.");
      return;
    }
    if (!isSilent) setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/orders/track?code=${encodeURIComponent(code.trim().toUpperCase())}&phone=${encodeURIComponent(
          phone.trim()
        )}`
      );
      const data = await res.json();

      if (res.ok && (data.order || data.success)) {
        setOrder(data.order || data);
        setLastRefreshed(new Date());
      } else {
        setError(resolveErrorMessage(data, "Order not found. Please verify the code and phone number."));
        if (!isSilent) setOrder(null);
      }
    } catch {
      if (!isSilent) setError("Network error fetching order status.");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/orders/track?code=${encodeURIComponent(inputCode)}&phone=${encodeURIComponent(inputPhone)}`);
    fetchOrderStatus(inputCode, inputPhone);
  }

  async function handleCancelOrder() {
    if (!order) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${order.code}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: inputPhone || initialPhone,
          reason: cancelReason || "Customer cancelled from tracking page",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowCancelModal(false);
        fetchOrderStatus(order.code, inputPhone || initialPhone);
      } else {
        alert(resolveErrorMessage(data, "Unable to cancel order."));
      }
    } catch {
      alert("Network error cancelling order.");
    } finally {
      setCancelling(false);
    }
  }

  const currentStep = order ? getStepIndex(order.status) : 0;
  const isCancelled = order?.status === "CANCELLED";
  const isCancellable = order && (order.status === "PAID" || order.status === "CONFIRMED" || order.status === "PLACED");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      {/* Search Header / Lookup */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Track Your Order</h1>
        <p className="text-xs text-slate-500 mb-6">
          Enter your Order Code (e.g. MSH-XXXXX) and the Phone Number used at checkout.
        </p>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
              Order Code
            </label>
            <input
              type="text"
              placeholder="e.g. MSH-12345"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="w-full text-sm font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-[#e31b23]"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="08012345678"
              value={inputPhone}
              onChange={(e) => setInputPhone(e.target.value)}
              className="w-full text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-[#e31b23]"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#e31b23] hover:bg-[#c9151c] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-red-500/20 transition-all disabled:opacity-50 h-[42px]"
            >
              {loading ? "Searching…" : "Track Order"}
            </button>
          </div>
        </form>

        {error && <p className="text-xs text-[#e31b23] font-medium mt-3">⚠️ {error}</p>}
      </div>

      {/* Order Status Display */}
      {order && (
        <div className="space-y-6">
          {/* Order Header Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black font-mono text-slate-900">#{order.code}</span>
                <span
                  className={`text-[11px] font-black uppercase px-3 py-1 rounded-full ${
                    isCancelled
                      ? "bg-rose-100 text-rose-800"
                      : order.status === "DELIVERED"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {order.createdAt ? new Date(order.createdAt).toLocaleString() : "Recently placed"}
                {lastRefreshed && (
                  <span className="ml-2 text-slate-400">
                    • Refreshed: {lastRefreshed.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {order.totalKobo && (
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                    Total Amount
                  </span>
                  <span className="text-xl font-black text-slate-900">{formatPrice(order.totalKobo)}</span>
                </div>
              )}

              {isCancellable && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-[#e31b23] text-xs font-bold rounded-xl transition-all"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>

          {/* Stepper Progress Card */}
          {!isCancelled ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Live Delivery Progress
              </h2>

              <div className="relative">
                {/* Stepper timeline */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                  {STEPS.map((step, idx) => {
                    const isDone = idx <= currentStep;
                    const isCurrent = idx === currentStep;
                    return (
                      <div key={step.key} className="flex flex-col items-start sm:items-center text-left sm:text-center relative">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs transition-all mb-2 ${
                            isCurrent
                              ? "bg-[#e31b23] text-white ring-4 ring-red-100 scale-110 shadow-md shadow-red-500/30"
                              : isDone
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {isDone && !isCurrent ? "✓" : idx + 1}
                        </div>
                        <h4
                          className={`text-xs font-black ${
                            isCurrent ? "text-[#e31b23]" : isDone ? "text-slate-900" : "text-slate-400"
                          }`}
                        >
                          {step.label}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{step.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery confirmation code (if applicable) */}
              {order.confirmationCode && (
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-amber-900">Delivery Handover PIN</p>
                    <p className="text-[11px] text-amber-700">Give this 4-digit code to the rider when receiving food.</p>
                  </div>
                  <span className="text-2xl font-black font-mono tracking-widest text-[#e31b23] bg-white px-4 py-1.5 rounded-xl border border-amber-200">
                    {order.confirmationCode}
                  </span>
                </div>
              )}

              {/* Rider assigned card */}
              {order.riderName && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-lg">
                      🛵
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Rider: {order.riderName}</p>
                      {order.riderPhone && (
                        <p className="text-[11px] text-slate-500 font-mono">Phone: {order.riderPhone}</p>
                      )}
                    </div>
                  </div>
                  {order.riderPhone && (
                    <a
                      href={`tel:${order.riderPhone}`}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      Call Rider
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center space-y-2">
              <div className="text-3xl">🚫</div>
              <h3 className="text-base font-black text-rose-900">This order has been cancelled</h3>
              <p className="text-xs text-rose-700 max-w-md mx-auto">
                If payment was deducted, a refund has been initiated to your account.
              </p>
            </div>
          )}

          {/* Order Details & Items Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Order Details
            </h3>

            {/* Address */}
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Destination
              </span>
              <p className="text-xs font-bold text-slate-800">{order.deliveryAddress || "Address on record"}</p>
              {order.landmark && (
                <p className="text-[11px] text-slate-500 mt-0.5">Landmark: {order.landmark}</p>
              )}
            </div>

            {/* Items */}
            {order.items && order.items.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Items ({order.items.length})
                </span>
                <div className="divide-y divide-slate-100">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {item.qty}× {item.presetName}
                        </p>
                        {item.extras && item.extras.length > 0 && (
                          <p className="text-[10px] text-slate-500">
                            + {item.extras.map((e) => e.optionName).join(", ")}
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-700">
                        {formatPrice(item.unitPriceKobo * item.qty)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-100 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900">Cancel Order #{order?.code}?</h3>
            <p className="text-xs text-slate-500">
              Are you sure? Once cancelled, the kitchen stops preparing your meal and your payment will be refunded.
            </p>

            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Reason for Cancellation
              </label>
              <input
                type="text"
                placeholder="e.g. Ordered wrong meal, taking too long"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-[#e31b23]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="flex-1 py-2.5 bg-[#e31b23] hover:bg-[#c9151c] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-red-500/20"
              >
                {cancelling ? "Cancelling…" : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderTrackPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />
      <Suspense
        fallback={
          <div className="max-w-3xl mx-auto px-4 py-16 text-center text-slate-400">
            Loading order tracker…
          </div>
        }
      >
        <OrderTrackerContent />
      </Suspense>
    </div>
  );
}
