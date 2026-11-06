"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type OpsUser = {
  id: number;
  email: string;
  username: string;
  fullName?: string;
  role: string;
  kitchenId: number | null;
  token: string;
};

type Kitchen = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  openTime: string;
  closeTime: string;
  radiusKm: number;
  operatorName: string;
  operatorPhone: string;
  active: boolean;
  paused: boolean;
};

type Order = {
  id: string;
  code: string;
  status: string;
  phone?: string;
  customerPhone?: string;
  totalKobo?: number;
  total?: { amountMinor: number; formatted: string };
  location?: { address?: string };
  deliveryAddress?: string;
  createdAt: string;
  items?: any[];
};

function statusBadge(status: string) {
  const map: Record<string, string> = {
    DELIVERED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    PAID: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    CONFIRMED: "bg-violet-500/15 text-violet-400 border-violet-500/30",
    PREPARING: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    OUT_FOR_DELIVERY: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    CANCELLED: "bg-red-500/15 text-red-400 border-red-500/30",
    REFUNDED: "bg-red-500/15 text-red-400 border-red-500/30",
    PENDING_PAYMENT: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  };
  return map[status] || "bg-slate-700/50 text-slate-300 border-slate-600";
}

const ALLOWED_STATUSES = ["PAID", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
const STATUS_LABELS: Record<string, string> = {
  PAID: "Mark Confirmed",
  CONFIRMED: "Start Preparing",
  PREPARING: "Out for Delivery",
  OUT_FOR_DELIVERY: "Mark Delivered",
};
const STATUS_NEXT: Record<string, string> = {
  PAID: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};

export default function OpsDashboard() {
  const router = useRouter();
  const [opsUser, setOpsUser] = useState<OpsUser | null>(null);
  const [kitchen, setKitchen] = useState<Kitchen | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  // ── Load OPS user from localStorage ──────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("ops_user");
    const token = localStorage.getItem("ops_token");
    if (!stored || !token) {
      router.replace("/mshsuper");
      return;
    }
    try {
      const user = JSON.parse(stored);
      if (user.role !== "OPS") {
        router.replace("/mshsuper");
        return;
      }
      setOpsUser(user);
    } catch {
      router.replace("/mshsuper");
    }
  }, [router]);

  function authHeaders(): HeadersInit {
    const token = localStorage.getItem("ops_token") || "";
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  // ── Fetch kitchen details ─────────────────────────────────────────────────
  const fetchKitchen = useCallback(async (kitchenId: number) => {
    const res = await fetch(`/api/admin/kitchens/${kitchenId}`, {
      headers: authHeaders(),
    }).catch(() => null);
    if (!res) return;
    const data = await res.json().catch(() => ({}));
    if (data.id || data.name) setKitchen(data);
    else if (data.kitchen) setKitchen(data.kitchen);
  }, []);

  // ── Fetch orders scoped to this kitchen ───────────────────────────────────
  const fetchOrders = useCallback(async (kitchenId: number) => {
    const res = await fetch(`/api/admin/orders?kitchenId=${kitchenId}`, {
      headers: authHeaders(),
    }).catch(() => null);
    if (!res) return;
    const data = await res.json().catch(() => ({}));
    const list = data.orders || data.content || [];
    setOrders(list);
  }, []);

  useEffect(() => {
    if (!opsUser?.kitchenId) return;
    Promise.all([
      fetchKitchen(opsUser.kitchenId),
      fetchOrders(opsUser.kitchenId),
    ]).finally(() => setLoading(false));

    // Poll orders every 30 seconds
    const interval = setInterval(() => fetchOrders(opsUser.kitchenId!), 30000);
    return () => clearInterval(interval);
  }, [opsUser, fetchKitchen, fetchOrders]);

  // ── Toggle kitchen pause ──────────────────────────────────────────────────
  async function handleTogglePause() {
    if (!kitchen) return;
    setPauseLoading(true);
    const newPaused = !kitchen.paused;
    const res = await fetch(`/api/admin/kitchens/${kitchen.id}?paused=${newPaused}`, {
      method: "PATCH",
      headers: authHeaders(),
    }).catch(() => null);
    setPauseLoading(false);
    if (res?.ok) {
      setKitchen((k) => k ? { ...k, paused: newPaused } : k);
    } else {
      alert("Failed to update kitchen status. Please try again.");
    }
  }

  // ── Update order status ───────────────────────────────────────────────────
  async function handleUpdateStatus(orderId: string, newStatus: string) {
    setUpdatingOrder(orderId);
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ status: newStatus, reason: `OPS: ${opsUser?.username || "Operator"} set ${newStatus}` }),
    }).catch(() => null);
    setUpdatingOrder(null);
    if (res?.ok) {
      if (opsUser?.kitchenId) fetchOrders(opsUser.kitchenId);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((o) => o ? { ...o, status: newStatus } : o);
      }
    } else {
      alert("Failed to update order status.");
    }
  }

  function formatNGN(kobo: number) {
    return `₦${(kobo / 100).toLocaleString()}`;
  }

  function getOrderTotal(order: Order): number {
    return order.totalKobo || order.total?.amountMinor || 0;
  }

  function getOrderAddress(order: Order): string {
    return order.location?.address || order.deliveryAddress || "—";
  }

  function getOrderPhone(order: Order): string {
    return order.phone || order.customerPhone || "—";
  }

  const filteredOrders = orders.filter((o) =>
    statusFilter === "ALL" || o.status === statusFilter
  );

  const activeOrders = orders.filter((o) =>
    ["PAID", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"].includes(o.status)
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Loading your kitchen dashboard…</p>
        </div>
      </div>
    );
  }

  if (!opsUser?.kitchenId) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <span className="text-5xl">⚠️</span>
          <h2 className="text-xl font-black text-white">No Kitchen Assigned</h2>
          <p className="text-slate-400 text-sm">Your account hasn&apos;t been assigned to a kitchen yet. Please contact your Super Admin.</p>
          <button onClick={() => { localStorage.removeItem("ops_token"); localStorage.removeItem("ops_user"); router.push("/mshsuper"); }} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-xl transition-colors">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-screen-lg mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="Meeshaai" className="w-8 h-8 rounded-lg object-cover" />
            <div>
              <p className="text-sm font-black text-white leading-none">Kitchen Dashboard</p>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5">{opsUser.username || opsUser.email}</p>
            </div>
          </div>

          {/* Kitchen status pill */}
          {kitchen && (
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${
              !kitchen.active
                ? "bg-red-500/15 text-red-400 border-red-500/30"
                : kitchen.paused
                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
            }`}>
              <span className={`w-2 h-2 rounded-full ${!kitchen.active ? "bg-red-400" : kitchen.paused ? "bg-amber-400" : "bg-emerald-400"}`} />
              {!kitchen.active ? "Inactive" : kitchen.paused ? "Paused" : "Open"}
            </div>
          )}

          <button
            onClick={() => { localStorage.removeItem("ops_token"); localStorage.removeItem("ops_user"); router.push("/mshsuper"); }}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-screen-lg mx-auto px-4 sm:px-6 py-8 pb-16 space-y-6">

        {/* ── Kitchen Control Card ─────────────────────────────────────────── */}
        {kitchen && (
          <div className={`rounded-2xl border-2 p-6 transition-all ${
            kitchen.paused
              ? "bg-amber-500/5 border-amber-500/30"
              : "bg-slate-900 border-slate-800"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-xl font-black text-white">{kitchen.name}</h1>
                <p className="text-sm text-slate-400">
                  Hours: {kitchen.openTime?.slice(0, 5)} – {kitchen.closeTime?.slice(0, 5)}
                  &nbsp;·&nbsp;
                  Radius: {kitchen.radiusKm} km
                  &nbsp;·&nbsp;
                  {kitchen.timezone}
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  {kitchen.latitude.toFixed(4)}, {kitchen.longitude.toFixed(4)}
                </p>
              </div>

              <button
                onClick={handleTogglePause}
                disabled={pauseLoading || !kitchen.active}
                className={`px-6 py-3 rounded-xl font-black text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                  kitchen.paused
                    ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25"
                    : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/25"
                }`}
              >
                {pauseLoading ? (
                  <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : (
                  <span>{kitchen.paused ? "▶️" : "⏸️"}</span>
                )}
                {kitchen.paused ? "Resume Kitchen" : "Pause Kitchen"}
              </button>
            </div>

            {kitchen.paused && (
              <div className="mt-4 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <p className="text-xs text-amber-400 font-semibold">
                  ⚠️ Kitchen is paused — new orders are not being accepted. Resume when ready.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Stats Row ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Active Orders", value: String(activeOrders.length), icon: "🔥", color: "text-orange-400" },
            { label: "Preparing", value: String(orders.filter((o) => o.status === "PREPARING").length), icon: "👨‍🍳", color: "text-amber-400" },
            { label: "Out for Delivery", value: String(orders.filter((o) => o.status === "OUT_FOR_DELIVERY").length), icon: "🛵", color: "text-cyan-400" },
            { label: "Delivered Today", value: String(orders.filter((o) => o.status === "DELIVERED").length), icon: "✅", color: "text-emerald-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
              <p className="text-lg">{s.icon}</p>
              <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Orders ───────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-black text-white text-lg">Orders Queue</h2>
            <button
              onClick={() => opsUser?.kitchenId && fetchOrders(opsUser.kitchenId)}
              className="text-xs text-slate-400 hover:text-white transition-colors font-semibold flex items-center gap-1"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {["ALL", "PAID", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  statusFilter === s
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {s === "ALL" ? "All" : s.replace(/_/g, " ")}
                {s !== "ALL" && (
                  <span className="ml-1 opacity-70">
                    ({orders.filter((o) => o.status === s).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Orders table */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800">
                  <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 font-semibold">Code</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Address</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Time</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-500 italic">
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-amber-400">{order.code}</td>
                        <td className="px-4 py-3 text-slate-300 font-mono">{getOrderPhone(order)}</td>
                        <td className="px-4 py-3 text-slate-400 max-w-[140px] truncate">{getOrderAddress(order)}</td>
                        <td className="px-4 py-3 font-bold text-white">{formatNGN(getOrderTotal(order))}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge(order.status)}`}>
                            {order.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          {STATUS_NEXT[order.status] && (
                            <button
                              disabled={updatingOrder === order.id}
                              onClick={() => handleUpdateStatus(order.id, STATUS_NEXT[order.status])}
                              className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/25 hover:bg-amber-500/20 transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              {updatingOrder === order.id ? "…" : STATUS_LABELS[order.status]}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* ── Order Detail Modal ──────────────────────────────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900">
              <div>
                <h3 className="font-black text-white">Order {selectedOrder.code}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge(selectedOrder.status)}`}>
                  {selectedOrder.status.replace(/_/g, " ")}
                </span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center text-sm">✕</button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-800 rounded-xl p-3">
                  <p className="text-slate-500 mb-1">Customer</p>
                  <p className="font-mono font-bold text-white">{getOrderPhone(selectedOrder)}</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-3">
                  <p className="text-slate-500 mb-1">Total</p>
                  <p className="font-bold text-amber-400">{formatNGN(getOrderTotal(selectedOrder))}</p>
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl p-3 text-xs">
                <p className="text-slate-500 mb-1">Delivery Address</p>
                <p className="text-slate-200">{getOrderAddress(selectedOrder)}</p>
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Items</p>
                  {selectedOrder.items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-slate-800 rounded-xl p-3 text-xs">
                      <div>
                        <p className="font-bold text-white">{item.presetName || item.name}</p>
                        <p className="text-slate-500">Qty: {item.quantity || item.qty}</p>
                      </div>
                      <p className="font-mono font-bold text-slate-300">
                        {item.subtotal?.formatted || formatNGN(item.totalKobo || 0)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {STATUS_NEXT[selectedOrder.status] && (
                <button
                  disabled={updatingOrder === selectedOrder.id}
                  onClick={() => handleUpdateStatus(selectedOrder.id, STATUS_NEXT[selectedOrder.status])}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-black text-sm rounded-xl transition-all"
                >
                  {updatingOrder === selectedOrder.id ? "Updating…" : `→ ${STATUS_LABELS[selectedOrder.status]}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
