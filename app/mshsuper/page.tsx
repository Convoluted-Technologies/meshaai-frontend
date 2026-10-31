"use client";

import { useState, useEffect } from "react";
import {
  Order,
  OrderStatus,
  PresetMeal,
  PresetVersionHistory,
  PaymentRecord,
} from "@/lib/types";

// ─── Status colour helper ────────────────────────────────────────────────────
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
    SUCCESSFUL: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    FAILED: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return (
    map[status] || "bg-slate-700/50 text-slate-300 border-slate-600"
  );
}

// ─── Tiny Stat Card ──────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  sub,
  accent = "amber",
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  accent?: "amber" | "emerald" | "blue" | "violet";
}) {
  const colors = {
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    violet: "bg-violet-500/10 border-violet-500/20 text-violet-400",
  };
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 flex items-start gap-4">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border ${colors[accent]}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-xl font-black text-white mt-0.5 truncate">{value}</p>
        {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AdminPage() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);

  // ── Navigation ────────────────────────────────────────────────────────────
  type Tab = "dashboard" | "orders" | "products" | "payments" | "customers" | "kitchens";
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  // ── Data ──────────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<Order[]>([]);
  const [presets, setPresets] = useState<PresetMeal[]>([]);
  const [versions, setVersions] = useState<PresetVersionHistory[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  // ── Orders UI ─────────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [riderName, setRiderName] = useState("");
  const [riderPhone, setRiderPhone] = useState("");

  // ── Products UI ───────────────────────────────────────────────────────────
  const [productDrawer, setProductDrawer] = useState<
    "closed" | "create" | "edit"
  >("closed");
  const [editingPreset, setEditingPreset] = useState<Partial<PresetMeal>>({});
  const [componentsRaw, setComponentsRaw] = useState(""); // raw string while typing
  const [productSearch, setProductSearch] = useState("");
  const [productSaving, setProductSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // ── Refund modal ──────────────────────────────────────────────────────────
  const [refundTarget, setRefundTarget] = useState<string | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("Admin customer resolution");
  const [refundLoading, setRefundLoading] = useState(false);

  // ── Kitchens UI ───────────────────────────────────────────────────────────
  const [kitchens, setKitchens] = useState<any[]>([]);
  const [kitchenDrawer, setKitchenDrawer] = useState<"closed" | "create" | "edit">("closed");
  const [editingKitchen, setEditingKitchen] = useState<any>({});
  const [kitchenSaving, setKitchenSaving] = useState(false);
  const [kitchenDeleteConfirm, setKitchenDeleteConfirm] = useState<number | null>(null);

  // ────────────────────────────────────────────────────────────────────────
  // Auth helpers
  // ────────────────────────────────────────────────────────────────────────
  function authHeaders(): HeadersInit {
    const token = adminUser?.token || "";
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setAdminUser(data.user);
        setLoggedIn(true);
      } else {
        setLoginError(data.detail || "Invalid credentials. Please try again.");
      }
    } catch {
      setLoginError("Network error. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // Data fetchers
  // ────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loggedIn) return;
    fetchAll();
    const es = new EventSource("/api/admin/events");
    es.addEventListener("NEW_ORDER", () => { fetchOrders(); fetchDashboard(); });
    es.addEventListener("ORDER_UPDATED", () => { fetchOrders(); fetchDashboard(); });
    es.addEventListener("ORDER_PAID", () => { fetchOrders(); fetchDashboard(); });
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  function fetchAll() {
    fetchOrders();
    fetchCatalog();
    fetchPayments();
    fetchCustomers();
    fetchDashboard();
    fetchKitchens();
  }

  async function fetchOrders() {
    const res = await fetch("/api/admin/orders", { headers: authHeaders() }).catch(() => null);
    if (!res) return;
    const data = await res.json().catch(() => ({}));
    if (data.orders) setOrders(data.orders);
  }

  async function fetchCatalog() {
    const res = await fetch("/api/admin/catalog", { headers: authHeaders() }).catch(() => null);
    if (!res) return;
    const data = await res.json().catch(() => ({}));
    if (data.presets) setPresets(data.presets);
    if (data.versions) setVersions(data.versions);
  }

  async function fetchPayments() {
    const res = await fetch("/api/admin/payments", { headers: authHeaders() }).catch(() => null);
    if (!res) return;
    const data = await res.json().catch(() => ({}));
    if (data.payments) setPayments(data.payments);
  }

  async function fetchCustomers() {
    const res = await fetch("/api/admin/customers", { headers: authHeaders() }).catch(() => null);
    if (!res) return;
    const data = await res.json().catch(() => ({}));
    if (data.customers) setCustomers(data.customers);
  }

  async function fetchDashboard() {
    const res = await fetch("/api/admin/dashboard", { headers: authHeaders() }).catch(() => null);
    if (!res) return;
    const data = await res.json().catch(() => ({}));
    if (data.metrics) setMetrics(data.metrics);
  }

  async function fetchKitchens() {
    const res = await fetch("/api/admin/kitchens", { headers: authHeaders() }).catch(() => null);
    if (!res) return;
    const data = await res.json().catch(() => ({}));
    if (data.kitchens) setKitchens(data.kitchens);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Order actions
  // ────────────────────────────────────────────────────────────────────────
  async function handleUpdateStatus(orderId: string, status: OrderStatus) {
    const reason = prompt(`Reason for → ${status}:`, `Admin set ${status}`);
    if (reason === null) return;
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ status, reason }),
    });
    const data = await res.json();
    if (res.ok) {
      fetchOrders();
      fetchDashboard();
      if (selectedOrder?.id === orderId) setSelectedOrder(data.order);
    } else {
      alert(data.detail || "Status transition failed");
    }
  }

  async function handleAssignRider(orderId: string) {
    if (!riderName || !riderPhone) {
      alert("Enter rider name and phone before assigning.");
      return;
    }
    const res = await fetch(`/api/admin/orders/${orderId}/assign-rider`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ riderName, riderPhone }),
    });
    const data = await res.json();
    if (res.ok) {
      fetchOrders();
      setSelectedOrder(data.order);
      setRiderName("");
      setRiderPhone("");
    } else {
      alert(data.detail || "Assign rider failed");
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // Refund
  // ────────────────────────────────────────────────────────────────────────
  async function handleRefund() {
    if (!refundTarget) return;
    setRefundLoading(true);
    const res = await fetch(`/api/admin/payments/${refundTarget}/refund`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        amountKobo: refundAmount ? Number(refundAmount) : undefined,
        reason: refundReason,
      }),
    });
    const data = await res.json();
    setRefundLoading(false);
    if (res.ok) {
      fetchOrders();
      fetchPayments();
      fetchDashboard();
      setRefundTarget(null);
      setRefundAmount("");
      setRefundReason("Admin customer resolution");
    } else {
      alert(data.detail || "Refund failed");
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // Kitchen CRUD & Actions
  // ────────────────────────────────────────────────────────────────────────
  async function handleSaveKitchen(e: React.FormEvent) {
    e.preventDefault();
    
    // Validation
    if (!editingKitchen.name?.trim()) {
      alert("Kitchen name is required.");
      return;
    }
    if (!editingKitchen.operatorName?.trim()) {
      alert("Operator name is required.");
      return;
    }
    if (!editingKitchen.operatorPhone?.trim()) {
      alert("Operator phone is required.");
      return;
    }
    if (!editingKitchen.operatorPhone.startsWith("+")) {
      alert("Operator phone must be in E.164 format (e.g., +2348012345678)");
      return;
    }
    if (editingKitchen.radiusKm <= 0) {
      alert("Delivery radius must be greater than 0.");
      return;
    }
    
    // Validate time: closeTime must be after openTime
    if (editingKitchen.closeTime <= editingKitchen.openTime) {
      alert("Closing time must be after opening time.");
      return;
    }

    setKitchenSaving(true);
    const isEdit = kitchenDrawer === "edit" && editingKitchen.id;
    
    const payload = {
      name: editingKitchen.name.trim(),
      latitude: Number(editingKitchen.latitude),
      longitude: Number(editingKitchen.longitude),
      timezone: editingKitchen.timezone,
      openTime: editingKitchen.openTime,
      closeTime: editingKitchen.closeTime,
      radiusKm: Number(editingKitchen.radiusKm),
      operatorName: editingKitchen.operatorName.trim(),
      operatorPhone: editingKitchen.operatorPhone.trim(),
      active: Boolean(editingKitchen.active),
    };

    const res = await fetch(
      isEdit ? `/api/admin/kitchens/${editingKitchen.id}` : "/api/admin/kitchens",
      {
        method: isEdit ? "PUT" : "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      }
    );
    
    const data = await res.json();
    setKitchenSaving(false);
    
    if (res.ok) {
      fetchKitchens();
      setKitchenDrawer("closed");
      setEditingKitchen({});
    } else {
      alert(data.detail || "Failed to save kitchen");
    }
  }

  async function handleToggleKitchenStatus(kitchenId: number, currentStatus: boolean) {
    const res = await fetch(`/api/admin/kitchens/${kitchenId}/pause`, {
      method: "PATCH",
      headers: authHeaders(),
    });
    const data = await res.json();
    if (res.ok) {
      fetchKitchens();
    } else {
      alert(data.detail || "Failed to toggle kitchen status");
    }
  }

  async function handleDeleteKitchen(kitchenId: number) {
    const res = await fetch(`/api/admin/kitchens/${kitchenId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res.ok) {
      fetchKitchens();
      setKitchenDeleteConfirm(null);
    } else {
      const data = await res.json();
      alert(data.detail || "Failed to delete kitchen");
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // Product (Catalog) CRUD
  // ────────────────────────────────────────────────────────────────────────
  function openCreateProduct() {
    setEditingPreset({
      name: "",
      description: "",
      components: [],
      priceKobo: 150000,
      imageUrl: "",
      isAvailable: true,
      extras: [],
    });
    setComponentsRaw("");
    setProductDrawer("create");
  }

  function openEditProduct(preset: PresetMeal) {
    setEditingPreset({ ...preset });
    setComponentsRaw(preset.components?.join(", ") || "");
    setProductDrawer("edit");
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPreset.name?.trim()) {
      alert("Product name is required.");
      return;
    }
    // Flush the raw components string in case the field was never blurred
    const finalComponents = componentsRaw.split(",").map((s) => s.trim()).filter(Boolean);
    const presetToSave = { ...editingPreset, components: finalComponents };
    setProductSaving(true);
    const isEdit = productDrawer === "edit" && !!editingPreset.id;
    const res = await fetch("/api/admin/catalog", {
      method: isEdit ? "PUT" : "POST",
      headers: authHeaders(),
      body: JSON.stringify(isEdit
        ? { type: "preset", id: editingPreset.id, ...presetToSave }
        : { type: "preset", ...presetToSave }
      ),
    });
    const data = await res.json();
    setProductSaving(false);
    if (res.ok) {
      fetchCatalog();
      setProductDrawer("closed");
    } else {
      console.error('[handleSaveProduct] full error response:', JSON.stringify(data, null, 2));
      const violationText = Array.isArray(data.violations)
        ? '\n\nField errors:\n' + data.violations.map((v: any) =>
            `• ${v?.field || v?.pointer || 'unknown'}: ${v?.message || v?.defaultMessage || JSON.stringify(v)}`
          ).join('\n')
        : '';
      alert((data.detail || (isEdit ? "Failed to update product" : "Failed to create product")) + violationText);
    }
  }

  async function handleToggleAvailability(id: string, current: boolean) {
    const res = await fetch("/api/admin/catalog", {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ id, isAvailable: !current }),
    });
    if (res.ok) fetchCatalog();
  }

  async function handleDeleteProduct(id: string) {
    const res = await fetch(`/api/admin/catalog?id=${encodeURIComponent(id)}&type=preset`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res.ok) {
      fetchCatalog();
      setDeleteConfirm(null);
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.detail || "Failed to delete product");
    }
  }

  async function handleRollback(versionId: string) {
    if (!confirm(`Roll back catalog to version ${versionId}?`)) return;
    const res = await fetch("/api/admin/catalog/rollback", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ versionId }),
    });
    if (res.ok) {
      fetchCatalog();
    } else {
      alert("Rollback failed");
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // Customers
  // ────────────────────────────────────────────────────────────────────────
  async function handleBlockCustomer(phone: string, isBlocked: boolean) {
    const res = await fetch(
      `/api/admin/customers/${encodeURIComponent(phone)}/block`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ block: !isBlocked }),
      }
    );
    if (res.ok) fetchCustomers();
    else alert("Error updating customer restriction");
  }

  // ────────────────────────────────────────────────────────────────────────
  // Derived data
  // ────────────────────────────────────────────────────────────────────────
  const formatNGN = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
    if (orderSearch) {
      const q = orderSearch.toLowerCase();
      return (
        o.code.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        o.location?.address?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredProducts = presets.filter((p) =>
    !productSearch ||
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.description?.toLowerCase().includes(productSearch.toLowerCase())
  );

  // ────────────────────────────────────────────────────────────────────────
  // LOGIN SCREEN
  // ────────────────────────────────────────────────────────────────────────
  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo area */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center text-3xl mx-auto shadow-xl shadow-amber-500/30 mb-4">
              ⚡
            </div>
            <h1 className="text-2xl font-black text-white">Meeshaai Admin</h1>
            <p className="text-sm text-slate-400 mt-1">
              Operator console · Sign in to continue
            </p>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h2 className="font-bold text-white">Sign In</h2>
            </div>

            <form onSubmit={handleLogin} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Email Address
                </label>
                <input
                  type="text"
                  placeholder="admin@Meeshaai.com"
                  value={loginEmail}
                  onChange={(e) => { setLoginEmail(e.target.value); setLoginError(""); }}
                  autoComplete="username"
                  className="w-full text-sm bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 rounded-xl px-4 py-3 text-slate-100 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => { setLoginPassword(e.target.value); setLoginError(""); }}
                    autoComplete="current-password"
                    className="w-full text-sm bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 rounded-xl px-4 py-3 pr-14 text-slate-100 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200 px-1 transition-colors"
                  >
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2.5 rounded-xl">
                  <span className="shrink-0 mt-0.5">⚠</span>
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-amber-500/25 mt-2"
              >
                {loginLoading ? "Signing in…" : "Sign In to Console"}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-600 mt-5">
            Meeshaai Operator Console · Restricted Access
          </p>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // MAIN DASHBOARD
  // ────────────────────────────────────────────────────────────────────────

  const TABS: { id: Tab; icon: string; label: string; badge?: number }[] = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "orders", icon: "📦", label: "Orders", badge: orders.filter((o) => o.status === "PAID" || o.status === "CONFIRMED").length || undefined },
    { id: "products", icon: "🍳", label: "Products" },
    { id: "payments", icon: "💳", label: "Payments" },
    { id: "customers", icon: "👥", label: "Customers" },
    { id: "kitchens", icon: "🏪", label: "Kitchens" },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* ── Top Nav ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-lg font-black shrink-0 shadow-md shadow-amber-500/30">
              ⚡
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-black text-white leading-none">Meeshaai</p>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5">Admin Console</p>
            </div>
          </div>

          {/* Tabs (desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === t.id
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
                {t.badge ? (
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                    {t.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-700 font-mono">
              {adminUser?.role || "ADMIN"}
            </span>
            <button
              onClick={() => { setLoggedIn(false); setAdminUser(null); }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Tabs (mobile) */}
        <div className="md:hidden flex items-center gap-1 px-4 pb-3 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`relative px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                activeTab === t.id
                  ? "bg-amber-500 text-slate-950"
                  : "text-slate-400 bg-slate-900 hover:bg-slate-800"
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {t.badge ? (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </header>

      {/* ── Page Content ─────────────────────────────────────────────────── */}
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 pb-16">

        {/* ══════════════════════════════════════════════════════════════════
            TAB: DASHBOARD
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-black text-white">Dashboard</h1>
              <p className="text-sm text-slate-400 mt-1">Live overview of your store</p>
            </div>

            {/* Stat grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                icon="💰"
                label="Total Revenue"
                value={metrics ? formatNGN(metrics.totalRevenueKobo) : "—"}
                sub="All time"
                accent="amber"
              />
              <StatCard
                icon="📈"
                label="Today's Revenue"
                value={metrics ? formatNGN(metrics.todayRevenueKobo) : "—"}
                sub="Since midnight"
                accent="emerald"
              />
              <StatCard
                icon="📦"
                label="Total Orders"
                value={metrics ? String(metrics.totalOrdersCount) : String(orders.length)}
                sub={`${orders.filter((o) => o.status === "PENDING_PAYMENT" || o.status === "PAID").length} pending`}
                accent="blue"
              />
              <StatCard
                icon="✅"
                label="Delivered"
                value={metrics ? String(metrics.countsByStatus?.DELIVERED ?? "—") : String(orders.filter((o) => o.status === "DELIVERED").length)}
                sub="Successfully fulfilled"
                accent="violet"
              />
            </div>

            {/* Recent orders preview */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <h2 className="font-bold text-white text-sm">Recent Orders</h2>
                <button
                  onClick={() => setActiveTab("orders")}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors"
                >
                  View all →
                </button>
              </div>
              <div className="divide-y divide-slate-800">
                {orders.slice(0, 6).map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-amber-400 text-sm">#{o.code}</span>
                      <span className="text-xs text-slate-400 hidden sm:inline">{o.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-white text-sm">{formatNGN(o.totalKobo)}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge(o.status)}`}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-8 italic">No orders yet.</p>
                )}
              </div>
            </div>

            {/* Product quick stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 text-center">
                <p className="text-3xl font-black text-white">{presets.length}</p>
                <p className="text-xs text-slate-400 mt-1">Total Products</p>
              </div>
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 text-center">
                <p className="text-3xl font-black text-emerald-400">
                  {presets.filter((p) => p.isAvailable).length}
                </p>
                <p className="text-xs text-slate-400 mt-1">Available Now</p>
              </div>
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 text-center">
                <p className="text-3xl font-black text-red-400">
                  {presets.filter((p) => !p.isAvailable).length}
                </p>
                <p className="text-xs text-slate-400 mt-1">Sold Out</p>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: ORDERS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-white">Live Orders</h1>
                <p className="text-sm text-slate-400 mt-1">
                  {orders.length} total · real-time SSE sync
                </p>
              </div>
              <button
                onClick={fetchOrders}
                className="self-start sm:self-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
              >
                ↺ Refresh
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex flex-wrap gap-1.5">
                {["ALL", "PENDING_PAYMENT", "PAID", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                      statusFilter === st
                        ? "bg-amber-500 text-slate-950 border-amber-500"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-200"
                    }`}
                  >
                    {st === "ALL" ? "All" : st.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Search order, phone, address…"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="sm:ml-auto w-full sm:w-60 text-xs bg-slate-900 border border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 rounded-xl px-3.5 py-2.5 text-slate-100 outline-none transition-all"
              />
            </div>

            {/* Split layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Orders list */}
              <div className="lg:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-800">
                      <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3 font-semibold">Order</th>
                        <th className="px-4 py-3 font-semibold">Phone</th>
                        <th className="px-4 py-3 font-semibold">Amount</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Rider</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center text-slate-500 italic">
                            No orders match this filter.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((o) => (
                          <tr
                            key={o.id}
                            onClick={() => setSelectedOrder(o)}
                            className={`cursor-pointer transition-colors hover:bg-slate-800/50 ${
                              selectedOrder?.id === o.id ? "bg-amber-500/8 border-l-2 border-l-amber-500" : ""
                            }`}
                          >
                            <td className="px-4 py-3 font-mono font-bold text-amber-400">#{o.code}</td>
                            <td className="px-4 py-3 text-slate-300 font-mono">{o.phone}</td>
                            <td className="px-4 py-3 font-bold text-white">{formatNGN(o.totalKobo)}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge(o.status)}`}>
                                {o.status.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-400">{o.rider?.name || "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order detail panel */}
              <div className="lg:col-span-5">
                {selectedOrder ? (
                  <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden sticky top-24">
                    {/* Panel header */}
                    <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
                      <div>
                        <span className="font-mono font-black text-amber-400 text-lg">
                          #{selectedOrder.code}
                        </span>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">{selectedOrder.phone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusBadge(selectedOrder.status)}`}>
                          {selectedOrder.status.replace(/_/g, " ")}
                        </span>
                        <button
                          onClick={() => setSelectedOrder(null)}
                          className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 text-xs flex items-center justify-center transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
                      {/* Delivery info */}
                      <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-3.5 space-y-1.5 text-xs">
                        <p className="font-semibold text-slate-100">{selectedOrder.location?.address}</p>
                        {selectedOrder.location?.landmark && (
                          <p className="text-slate-400">📍 {selectedOrder.location.landmark}</p>
                        )}
                        {selectedOrder.note && (
                          <p className="text-amber-400 italic">💬 "{selectedOrder.note}"</p>
                        )}
                        <p className="font-bold text-white mt-1">{formatNGN(selectedOrder.totalKobo)}</p>
                      </div>

                      {/* Assign rider */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assign Rider</p>
                        <input
                          type="text"
                          placeholder="Rider Name"
                          value={riderName}
                          onChange={(e) => setRiderName(e.target.value)}
                          className="w-full text-xs bg-slate-800 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-slate-100 outline-none"
                        />
                        <input
                          type="tel"
                          placeholder="Rider Phone"
                          value={riderPhone}
                          onChange={(e) => setRiderPhone(e.target.value)}
                          className="w-full text-xs bg-slate-800 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-slate-100 font-mono outline-none"
                        />
                        <button
                          onClick={() => handleAssignRider(selectedOrder.id)}
                          className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-amber-400 text-xs font-bold rounded-lg border border-slate-600 transition-colors"
                        >
                          Assign / Update Rider
                        </button>
                      </div>

                      {/* Status transitions */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Move to Status</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "FAILED_DELIVERY"].map((st) => (
                            <button
                              key={st}
                              onClick={() => handleUpdateStatus(selectedOrder.id, st as OrderStatus)}
                              className="py-2 text-[10px] font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                            >
                              → {st.replace(/_/g, " ")}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Refund */}
                      <button
                        onClick={() => setRefundTarget(selectedOrder.id)}
                        className="w-full py-2.5 text-xs font-bold rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 transition-colors"
                      >
                        💳 Trigger Refund
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-900 border border-slate-800 p-10 text-center">
                    <p className="text-2xl mb-3">👈</p>
                    <p className="text-sm text-slate-500">Select an order to manage it</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: PRODUCTS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "products" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-white">Products</h1>
                <p className="text-sm text-slate-400 mt-1">
                  {presets.length} meal presets · manage your catalog
                </p>
              </div>
              <button
                onClick={openCreateProduct}
                className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all"
              >
                <span className="text-lg leading-none">+</span>
                <span>Add Product</span>
              </button>
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search products…"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full sm:w-72 text-xs bg-slate-900 border border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 rounded-xl px-3.5 py-2.5 text-slate-100 outline-none transition-all"
            />

            {/* Product grid */}
            {filteredProducts.length === 0 ? (
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-16 text-center">
                <p className="text-3xl mb-3">🍳</p>
                <p className="text-slate-400 text-sm font-medium">No products yet</p>
                <p className="text-slate-500 text-xs mt-1 mb-5">Add your first meal preset to start taking orders.</p>
                <button
                  onClick={openCreateProduct}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-colors"
                >
                  Add First Product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProducts.map((preset) => (
                  <div
                    key={preset.id}
                    className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col group hover:border-slate-700 transition-colors"
                  >
                    {/* Image */}
                    {preset.imageUrl ? (
                      <div className="relative h-44 bg-slate-800 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preset.imageUrl}
                          alt={preset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                        <span className="absolute bottom-3 left-3 font-mono font-black text-amber-400 text-lg">
                          {formatNGN(preset.priceKobo)}
                        </span>
                        <span
                          className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            preset.isAvailable
                              ? "bg-emerald-500/80 text-white border-emerald-400"
                              : "bg-red-500/80 text-white border-red-400"
                          }`}
                        >
                          {preset.isAvailable ? "Available" : "Sold Out"}
                        </span>
                      </div>
                    ) : (
                      <div className="h-20 bg-slate-800 flex items-center justify-between px-4">
                        <span className="font-mono font-black text-amber-400 text-xl">
                          {formatNGN(preset.priceKobo)}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            preset.isAvailable
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-red-500/15 text-red-400 border-red-500/30"
                          }`}
                        >
                          {preset.isAvailable ? "Available" : "Sold Out"}
                        </span>
                      </div>
                    )}

                    {/* Body */}
                    <div className="p-4 flex-1 flex flex-col gap-2">
                      <div>
                        <h3 className="font-bold text-white text-sm">{preset.name}</h3>
                        {preset.description && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{preset.description}</p>
                        )}
                      </div>

                      {/* Components */}
                      {preset.components && preset.components.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {preset.components.slice(0, 4).map((c, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700"
                            >
                              {c}
                            </span>
                          ))}
                          {preset.components.length > 4 && (
                            <span className="text-[10px] text-slate-500">+{preset.components.length - 4} more</span>
                          )}
                        </div>
                      )}

                      {/* Extras count */}
                      {preset.extras && preset.extras.length > 0 && (
                        <p className="text-[11px] text-slate-500">
                          {preset.extras.length} extra{preset.extras.length !== 1 ? "s" : ""} available
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="px-4 pb-4 flex items-center gap-2 border-t border-slate-800 pt-3">
                      <button
                        onClick={() => handleToggleAvailability(preset.id, preset.isAvailable)}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-colors ${
                          preset.isAvailable
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/25 hover:bg-red-500/20"
                        }`}
                      >
                        {preset.isAvailable ? "Mark Sold Out" : "Mark Available"}
                      </button>
                      <button
                        onClick={() => openEditProduct(preset)}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(preset.id)}
                        className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl border border-red-500/25 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Rollback history */}
            {versions.length > 0 && (
              <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden mt-8">
                <div className="px-5 py-4 border-b border-slate-800">
                  <h3 className="font-bold text-white text-sm">📜 Version History</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Roll back to a previous catalog state</p>
                </div>
                <div className="divide-y divide-slate-800">
                  {versions.map((ver) => (
                    <div key={ver.versionId} className="flex items-center justify-between px-5 py-3.5">
                      <div>
                        <span className="font-mono text-sm text-slate-200 font-bold">{ver.versionId}</span>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {ver.changeReason} · by {ver.changedBy} ·{" "}
                          {new Date(ver.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRollback(ver.versionId)}
                        className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold rounded-xl border border-amber-500/25 transition-colors"
                      >
                        ↺ Rollback
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: PAYMENTS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-white">Payments</h1>
              <p className="text-sm text-slate-400 mt-1">Flutterwave transaction records & refunds</p>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800">
                    <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3 font-semibold">Tx Ref</th>
                      <th className="px-4 py-3 font-semibold">Order</th>
                      <th className="px-4 py-3 font-semibold">Phone</th>
                      <th className="px-4 py-3 font-semibold">Amount</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-slate-500 italic">
                          No payment records found.
                        </td>
                      </tr>
                    ) : (
                      payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-mono text-slate-300 text-[11px]">{p.txRef}</td>
                          <td className="px-4 py-3 font-mono font-bold text-amber-400">#{p.orderCode}</td>
                          <td className="px-4 py-3 text-slate-300 font-mono">{p.customerPhone}</td>
                          <td className="px-4 py-3 font-bold text-white">{formatNGN(p.amountKobo)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge(p.status)}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-[10px]">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            {p.status !== "REFUNDED" && (
                              <button
                                onClick={() => setRefundTarget(p.orderCode)}
                                className="text-red-400 hover:text-red-300 font-semibold transition-colors"
                              >
                                Refund
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
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: CUSTOMERS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "customers" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-white">Customers</h1>
              <p className="text-sm text-slate-400 mt-1">{customers.length} registered customers</p>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800">
                    <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Phone</th>
                      <th className="px-4 py-3 font-semibold">Orders</th>
                      <th className="px-4 py-3 font-semibold">Total Spent</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {customers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-slate-500 italic">
                          No customers found.
                        </td>
                      </tr>
                    ) : (
                      customers.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-bold text-white font-sans">{c.name}</td>
                          <td className="px-4 py-3 text-slate-300 font-mono">{c.phone}</td>
                          <td className="px-4 py-3 font-bold text-amber-400">{c.orderCount}</td>
                          <td className="px-4 py-3 font-bold text-white">{formatNGN(c.totalSpentKobo)}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                c.isBlocked
                                  ? "bg-red-500/15 text-red-400 border-red-500/30"
                                  : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              }`}
                            >
                              {c.isBlocked ? "Blocked" : "Active"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleBlockCustomer(c.phone, c.isBlocked)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                                c.isBlocked
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20"
                                  : "bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20"
                              }`}
                            >
                              {c.isBlocked ? "Unblock" : "Block"}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: KITCHENS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "kitchens" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-white">Kitchens</h1>
                <p className="text-sm text-slate-400 mt-1">{kitchens.length} kitchen{kitchens.length !== 1 ? "s" : ""} configured</p>
              </div>
              <button
                onClick={() => {
                  setKitchenDrawer("create");
                  setEditingKitchen({
                    name: "",
                    latitude: 9.0765,
                    longitude: 7.3986,
                    timezone: "Africa/Lagos",
                    openTime: "06:00:00",
                    closeTime: "22:00:00",
                    radiusKm: 7.0,
                    operatorName: "",
                    operatorPhone: "",
                    active: true,
                  });
                }}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
              >
                <span>➕</span>
                <span>Add Kitchen</span>
              </button>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800">
                    <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3 font-semibold">Kitchen Name</th>
                      <th className="px-4 py-3 font-semibold">Location</th>
                      <th className="px-4 py-3 font-semibold">Hours</th>
                      <th className="px-4 py-3 font-semibold">Radius</th>
                      <th className="px-4 py-3 font-semibold">Operator</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {kitchens.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-slate-500 italic">
                          No kitchens configured yet. Click "Add Kitchen" to create your first one.
                        </td>
                      </tr>
                    ) : (
                      kitchens.map((k) => (
                        <tr key={k.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-bold text-white">{k.name}</td>
                          <td className="px-4 py-3 text-slate-300 font-mono text-[11px]">
                            {k.latitude.toFixed(4)}, {k.longitude.toFixed(4)}
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {k.openTime} - {k.closeTime}
                          </td>
                          <td className="px-4 py-3 font-bold text-amber-400">{k.radiusKm} km</td>
                          <td className="px-4 py-3 text-slate-300">
                            <div className="text-white font-medium">{k.operatorName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{k.operatorPhone}</div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleToggleKitchenStatus(k.id, k.active)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                                k.active
                                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                                  : "bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25"
                              }`}
                            >
                              {k.active ? "Active" : "Paused"}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setKitchenDrawer("edit");
                                  setEditingKitchen(k);
                                }}
                                className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/25 hover:bg-blue-500/20 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setKitchenDeleteConfirm(k.id)}
                                className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════════════════════════════════
          PRODUCT DRAWER (Add / Edit)
      ══════════════════════════════════════════════════════════════════ */}
      {productDrawer !== "closed" && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setProductDrawer("closed")}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
              <div>
                <h2 className="font-black text-white text-lg">
                  {productDrawer === "create" ? "Add New Product" : "Edit Product"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {productDrawer === "create"
                    ? "Create a new meal preset for your menu"
                    : `Editing: ${editingPreset.name}`}
                </p>
              </div>
              <button
                onClick={() => setProductDrawer("closed")}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Drawer form */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-5">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Classic Egg & Bread Combo"
                    value={editingPreset.name || ""}
                    onChange={(e) => setEditingPreset({ ...editingPreset, name: e.target.value })}
                    className="w-full text-sm bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 rounded-xl px-4 py-3 text-slate-100 outline-none transition-all"
                  />
                </div>

                {/* Price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Price (₦) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₦</span>
                    <input
                      type="number"
                      placeholder="e.g. 1500"
                      min="0"
                      step="any"
                      value={editingPreset.priceKobo ? editingPreset.priceKobo / 100 : ""}
                      onChange={(e) => setEditingPreset({ ...editingPreset, priceKobo: Math.round(Number(e.target.value) * 100) })}
                      className="w-full text-sm bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 rounded-xl pl-8 pr-4 py-3 text-slate-100 font-mono outline-none transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {editingPreset.priceKobo
                      ? `= ${formatNGN(editingPreset.priceKobo)}`
                      : "Enter the price in Naira (e.g. 1500 = ₦1,500)"}
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Description
                  </label>
                  <textarea
                    placeholder="Describe this meal…"
                    value={editingPreset.description || ""}
                    onChange={(e) => setEditingPreset({ ...editingPreset, description: e.target.value })}
                    rows={3}
                    className="w-full text-sm bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 rounded-xl px-4 py-3 text-slate-100 outline-none transition-all resize-none"
                  />
                </div>

                {/* Components */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Meal Components
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1 Loaf Bread, 2 Fried Eggs, 1 Sausage"
                    value={componentsRaw}
                    onChange={(e) => setComponentsRaw(e.target.value)}
                    onBlur={() =>
                      setEditingPreset({
                        ...editingPreset,
                        components: componentsRaw.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className="w-full text-sm bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 rounded-xl px-4 py-3 text-slate-100 outline-none transition-all"
                  />
                  <p className="text-[11px] text-slate-500">Separate each component with a comma</p>
                </div>

                {/* Image */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Product Image
                  </label>

                  {/* File picker */}
                  <label className="flex items-center gap-3 w-full cursor-pointer rounded-xl border-2 border-dashed border-slate-700 hover:border-amber-500/50 bg-slate-950 px-4 py-3 transition-colors group">
                    <span className="text-xl">📷</span>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-300 font-semibold group-hover:text-amber-400 transition-colors">
                        Upload from device
                      </p>
                      <p className="text-[11px] text-slate-500">JPG, PNG, WEBP up to 5 MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) {
                          alert("Image must be under 5 MB.");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          setEditingPreset({ ...editingPreset, imageUrl: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>

                  {/* Divider */}
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex-1 h-px bg-slate-800" />
                    <span className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">or paste URL</span>
                    <div className="flex-1 h-px bg-slate-800" />
                  </div>

                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/…"
                    value={editingPreset.imageUrl?.startsWith("data:") ? "" : (editingPreset.imageUrl || "")}
                    onChange={(e) => setEditingPreset({ ...editingPreset, imageUrl: e.target.value })}
                    className="w-full text-sm bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 rounded-xl px-4 py-3 text-slate-100 outline-none transition-all"
                  />

                  {/* Preview */}
                  {editingPreset.imageUrl && (
                    <div className="relative mt-2 rounded-xl overflow-hidden h-36 bg-slate-800 border border-slate-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={editingPreset.imageUrl}
                        alt="preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <button
                        type="button"
                        onClick={() => setEditingPreset({ ...editingPreset, imageUrl: "" })}
                        className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs flex items-center justify-center transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Availability toggle */}
                <div className="flex items-center justify-between rounded-xl bg-slate-950 border border-slate-700 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Available on Menu</p>
                    <p className="text-xs text-slate-500">Customers can see and order this product</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingPreset({ ...editingPreset, isAvailable: !editingPreset.isAvailable })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      editingPreset.isAvailable ? "bg-emerald-500" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        editingPreset.isAvailable ? "translate-x-5.5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* Extras */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Optional Extras / Add-ons
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingPreset({
                          ...editingPreset,
                          extras: [
                            ...(editingPreset.extras || []),
                            { id: `ext-${Date.now()}`, name: "", priceKobo: 0, imageUrl: "" },
                          ],
                        })
                      }
                      className="text-xs text-amber-400 hover:text-amber-300 font-bold transition-colors"
                    >
                      + Add Extra
                    </button>
                  </div>

                  {(editingPreset.extras || []).length === 0 ? (
                    <p className="text-xs text-slate-600 italic">No extras configured yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {(editingPreset.extras || []).map((extra, idx) => (
                        <div key={extra.id || idx} className="border border-slate-700 rounded-lg p-3 space-y-2 bg-slate-950/50">
                          <div className="flex items-start gap-2">
                            <input
                              type="text"
                              placeholder="Extra name (e.g. Extra Egg)"
                              value={extra.name}
                              onChange={(e) => {
                                const updated = [...(editingPreset.extras || [])];
                                updated[idx] = { ...updated[idx], name: e.target.value };
                                setEditingPreset({ ...editingPreset, extras: updated });
                              }}
                              className="flex-1 text-xs bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-slate-100 outline-none"
                            />
                            <div className="flex flex-col gap-0.5 shrink-0">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">₦</span>
                                <input
                                  type="number"
                                  placeholder="0"
                                  min="0"
                                  step="any"
                                  value={extra.priceKobo ? extra.priceKobo / 100 : ""}
                                  onChange={(e) => {
                                    const updated = [...(editingPreset.extras || [])];
                                    // User enters naira → store as kobo (×100)
                                    updated[idx] = { ...updated[idx], priceKobo: Math.round(Number(e.target.value) * 100) };
                                    setEditingPreset({ ...editingPreset, extras: updated });
                                  }}
                                  className="w-24 text-xs bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg pl-6 pr-2 py-2 text-slate-100 font-mono outline-none"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (editingPreset.extras || []).filter((_, i) => i !== idx);
                                setEditingPreset({ ...editingPreset, extras: updated });
                              }}
                              className="w-8 h-8 shrink-0 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/25 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                          
                          {/* Image URL field for extra */}
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500 font-semibold shrink-0">Image URL:</span>
                            <input
                              type="url"
                              placeholder="https://example.com/extra-image.jpg (optional)"
                              value={extra.imageUrl || ""}
                              onChange={(e) => {
                                const updated = [...(editingPreset.extras || [])];
                                updated[idx] = { ...updated[idx], imageUrl: e.target.value };
                                setEditingPreset({ ...editingPreset, extras: updated });
                              }}
                              className="flex-1 text-xs bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-1.5 text-slate-100 outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer footer */}
              <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 px-6 py-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setProductDrawer("closed")}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-xl border border-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={productSaving}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all"
                >
                  {productSaving
                    ? "Saving…"
                    : productDrawer === "create"
                    ? "Add Product"
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          DELETE CONFIRM MODAL
      ══════════════════════════════════════════════════════════════════ */}
      {deleteConfirm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center text-2xl mx-auto">
                  🗑️
                </div>
                <h3 className="font-black text-white text-lg">Delete Product?</h3>
                <p className="text-sm text-slate-400">
                  This product will be removed from your menu. This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-xl border border-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteProduct(deleteConfirm)}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-400 text-white font-black text-sm rounded-xl shadow-lg shadow-red-500/25 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          KITCHEN DRAWER (Add / Edit)
      ══════════════════════════════════════════════════════════════════ */}
      {kitchenDrawer !== "closed" && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setKitchenDrawer("closed")}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col overflow-y-auto">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0 sticky top-0 bg-slate-900 z-10">
              <div>
                <h2 className="font-black text-white text-lg">
                  {kitchenDrawer === "create" ? "Add New Kitchen" : "Edit Kitchen"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {kitchenDrawer === "create"
                    ? "Configure a new kitchen location"
                    : `Editing: ${editingKitchen.name}`}
                </p>
              </div>
              <button
                onClick={() => setKitchenDrawer("closed")}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveKitchen} className="p-6 space-y-5 flex-1">
              {/* Kitchen Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Kitchen Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingKitchen.name || ""}
                  onChange={(e) => setEditingKitchen({ ...editingKitchen, name: e.target.value })}
                  placeholder="e.g., Meeshaai Kitchen - Abuja Wuse 2"
                  className="w-full text-sm bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 rounded-xl px-4 py-3 text-slate-100 outline-none transition-all"
                />
              </div>

              {/* Geographic Coordinates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editingKitchen.latitude || ""}
                    onChange={(e) => setEditingKitchen({ ...editingKitchen, latitude: e.target.value })}
                    placeholder="9.0765"
                    className="w-full text-sm bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 rounded-xl px-4 py-3 text-slate-100 font-mono outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editingKitchen.longitude || ""}
                    onChange={(e) => setEditingKitchen({ ...editingKitchen, longitude: e.target.value })}
                    placeholder="7.3986"
                    className="w-full text-sm bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 rounded-xl px-4 py-3 text-slate-100 font-mono outline-none transition-all"
                  />
                </div>
              </div>

              {/* Timezone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Timezone (IANA) *
                </label>
                <select
                  required
                  value={editingKitchen.timezone || "Africa/Lagos"}
                  onChange={(e) => setEditingKitchen({ ...editingKitchen, timezone: e.target.value })}
                  className="w-full text-sm bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 rounded-xl px-4 py-3 text-slate-100 outline-none transition-all"
                >
                  <option value="Africa/Lagos">Africa/Lagos</option>
                  <option value="Africa/Abuja">Africa/Abuja</option>
                  <option value="Africa/Accra">Africa/Accra</option>
                  <option value="Africa/Cairo">Africa/Cairo</option>
                  <option value="Africa/Johannesburg">Africa/Johannesburg</option>
                  <option value="Africa/Nairobi">Africa/Nairobi</option>
                </select>
              </div>

              {/* Operating Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Opening Time (HH:MM:SS) *
                  </label>
                  <input
                    type="time"
                    step="1"
                    required
                    value={editingKitchen.openTime || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingKitchen({ ...editingKitchen, openTime: val.length === 5 ? val + ":00" : val });
                    }}
                    className="w-full text-sm bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 rounded-xl px-4 py-3 text-slate-100 font-mono outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Closing Time (HH:MM:SS) *
                  </label>
                  <input
                    type="time"
                    step="1"
                    required
                    value={editingKitchen.closeTime || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingKitchen({ ...editingKitchen, closeTime: val.length === 5 ? val + ":00" : val });
                    }}
                    className="w-full text-sm bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 rounded-xl px-4 py-3 text-slate-100 font-mono outline-none transition-all"
                  />
                </div>
              </div>

              {/* Delivery Radius */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Delivery Radius (km) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={editingKitchen.radiusKm || ""}
                  onChange={(e) => setEditingKitchen({ ...editingKitchen, radiusKm: e.target.value })}
                  placeholder="7.0"
                  className="w-full text-sm bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 rounded-xl px-4 py-3 text-slate-100 font-mono outline-none transition-all"
                />
                <p className="text-[11px] text-slate-500">
                  Coverage area around the kitchen location
                </p>
              </div>

              {/* Operator Details */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Operator Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingKitchen.operatorName || ""}
                  onChange={(e) => setEditingKitchen({ ...editingKitchen, operatorName: e.target.value })}
                  placeholder="e.g., Ibrahim Wuse Ops"
                  className="w-full text-sm bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 rounded-xl px-4 py-3 text-slate-100 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Operator Phone (E.164 format) *
                </label>
                <input
                  type="tel"
                  required
                  value={editingKitchen.operatorPhone || ""}
                  onChange={(e) => setEditingKitchen({ ...editingKitchen, operatorPhone: e.target.value })}
                  placeholder="+2348012345678"
                  className="w-full text-sm bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 rounded-xl px-4 py-3 text-slate-100 font-mono outline-none transition-all"
                />
                <p className="text-[11px] text-slate-500">
                  Must start with + and include country code (e.g., +234)
                </p>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3 p-4 bg-slate-950 border border-slate-700 rounded-xl">
                <input
                  type="checkbox"
                  id="kitchenActive"
                  checked={editingKitchen.active ?? true}
                  onChange={(e) => setEditingKitchen({ ...editingKitchen, active: e.target.checked })}
                  className="w-5 h-5 rounded-lg border-2 border-slate-600 bg-slate-900 checked:bg-emerald-500 checked:border-emerald-500 transition-colors cursor-pointer"
                />
                <label htmlFor="kitchenActive" className="text-sm font-semibold text-white cursor-pointer">
                  Kitchen is Active (accepting orders)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 sticky bottom-0 bg-slate-900 border-t border-slate-800 -mx-6 px-6 pb-6">
                <button
                  type="button"
                  onClick={() => setKitchenDrawer("closed")}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-xl border border-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={kitchenSaving}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all"
                >
                  {kitchenSaving ? "Saving…" : kitchenDrawer === "create" ? "Create Kitchen" : "Update Kitchen"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          KITCHEN DELETE CONFIRMATION
      ══════════════════════════════════════════════════════════════════ */}
      {kitchenDeleteConfirm !== null && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-5">
            <div>
              <h3 className="font-black text-white text-lg">Delete Kitchen?</h3>
              <p className="text-sm text-slate-400 mt-2">
                This action cannot be undone. All delivery zones and fee rules for this kitchen will be lost.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setKitchenDeleteConfirm(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-xl border border-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteKitchen(kitchenDeleteConfirm)}
                className="flex-1 py-3 bg-red-500 hover:bg-red-400 text-white font-black text-sm rounded-xl shadow-lg shadow-red-500/25 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          REFUND MODAL
      ══════════════════════════════════════════════════════════════════ */}
      {refundTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-5">
            <div>
              <h3 className="font-black text-white text-lg">Process Refund</h3>
              <p className="text-xs text-slate-400 mt-1">
                Order / Payment ref: <span className="font-mono text-amber-400">{refundTarget}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Amount in Kobo (blank = full refund)
                </label>
                <input
                  type="number"
                  placeholder="Leave empty for full refund"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full text-sm bg-slate-950 border border-slate-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/15 rounded-xl px-4 py-3 text-slate-100 font-mono outline-none transition-all"
                />
                {refundAmount && (
                  <p className="text-[11px] text-slate-500">= {formatNGN(Number(refundAmount))}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Reason
                </label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full text-sm bg-slate-950 border border-slate-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/15 rounded-xl px-4 py-3 text-slate-100 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRefundTarget(null);
                  setRefundAmount("");
                  setRefundReason("Admin customer resolution");
                }}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-xl border border-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                disabled={refundLoading}
                className="flex-1 py-3 bg-red-500 hover:bg-red-400 disabled:opacity-60 text-white font-black text-sm rounded-xl shadow-lg shadow-red-500/25 transition-all"
              >
                {refundLoading ? "Processing…" : "Issue Refund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
