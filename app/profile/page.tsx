"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useCart, SupportedCurrency } from "@/context/CartContext";
import {
  getStoredCustomerSession,
  storeCustomerSession,
  clearCustomerSession,
  CustomerSession,
} from "@/lib/api/backendClient";
import { resolveErrorMessage } from "@/lib/errorCodes";

// Dynamically load LeafletMapPicker for address picker
const LeafletMapPicker = dynamic(() => import("@/components/LeafletMapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-60 bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-xs text-slate-400">
      Loading OpenStreetMap…
    </div>
  ),
});

interface CustomerAddress {
  id?: string;
  label?: string;
  address: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

interface OrderSummary {
  id: string;
  code: string;
  totalKobo: number;
  status: string;
  deliveryMode: string;
  createdAt: string;
  items: { presetName: string; qty: number; unitPriceKobo: number }[];
}

type AuthMode = "choice" | "login" | "register" | "register-otp";
type ProfileTab = "orders" | "addresses" | "settings";

export default function ProfilePage() {
  const { formatPrice, currency, setCurrency } = useCart();

  const [session, setSession] = useState<CustomerSession | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("choice");
  const [activeTab, setActiveTab] = useState<ProfileTab>("orders");

  // Orders & Addresses
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Status feedback
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Login form fields
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Register form fields
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPw, setShowRegPw] = useState(false);

  // Register OTP
  const [otpValue, setOtpValue] = useState("");
  const [devOtp, setDevOtp] = useState("");

  // Edit Profile Modal
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCurrency, setEditCurrency] = useState<SupportedCurrency>("NGN");
  const [savingProfile, setSavingProfile] = useState(false);

  // Add Address Modal
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState("Home");
  const [newAddrText, setNewAddrText] = useState("");
  const [newAddrLandmark, setNewAddrLandmark] = useState("");
  const [newAddrLat, setNewAddrLat] = useState(9.0765);
  const [newAddrLng, setNewAddrLng] = useState(7.3986);
  const [showAddrMap, setShowAddrMap] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  // Cancel order modal
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancellingLoading, setCancellingLoading] = useState(false);

  // Load customer session
  useEffect(() => {
    const s = getStoredCustomerSession();
    if (s && s.token) {
      setSession(s);
      setEditName(s.name || "");
      setEditEmail(s.email || "");
      setEditCurrency(currency || "NGN");
      fetchOrders(s.token);
      fetchAddresses(s.token);
    }
  }, [currency]);

  async function fetchOrders(token: string) {
    setLoadingOrders(true);
    try {
      const res = await fetch("/api/me/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(Array.isArray(data) ? data : data.orders || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingOrders(false);
    }
  }

  async function fetchAddresses(token: string) {
    setLoadingAddresses(true);
    try {
      const res = await fetch("/api/me/locations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAddresses(Array.isArray(data) ? data : data.locations || data.addresses || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingAddresses(false);
    }
  }

  // ── Authentication Handlers ──────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginId.trim() || !loginPassword) {
      setError("Please enter your email or phone number and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/customer-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: loginId.trim(), password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        const user: CustomerSession = {
          id: data.customer?.id || "",
          name: data.customer?.name || "",
          phone: data.customer?.phone || loginId,
          email: data.customer?.email,
          token: data.token,
        };
        storeCustomerSession(user);
        setSession(user);
        setEditName(user.name);
        setEditEmail(user.email || "");
        fetchOrders(data.token);
        fetchAddresses(data.token);
      } else {
        setError(resolveErrorMessage(data, "Invalid credentials. Please try again."));
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim() || !regEmail.trim() || !regPassword) {
      setError("All fields are required to create your account.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          phone: regPhone.trim(),
          email: regEmail.trim(),
          password: regPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || "OTP verification code sent to your phone.");
        if (data.devOtp) setDevOtp(data.devOtp);
        setAuthMode("register-otp");
      } else {
        setError(resolveErrorMessage(data, "Registration failed."));
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otpValue.trim()) {
      setError("Please enter the verification code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: regPhone, otp: otpValue, name: regName }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        const user: CustomerSession = {
          id: data.customer?.id || "",
          name: data.customer?.name || regName,
          phone: regPhone,
          email: regEmail,
          token: data.token,
        };
        storeCustomerSession(user);
        setSession(user);
        setEditName(user.name);
        setEditEmail(user.email || "");
        fetchOrders(data.token);
        fetchAddresses(data.token);
      } else {
        setError(resolveErrorMessage(data, "Invalid code."));
      }
    } catch {
      setError("Network error verifying code.");
    } finally {
      setLoading(false);
    }
  }

  function handleSignOut() {
    clearCustomerSession();
    setSession(null);
    setOrders([]);
    setAddresses([]);
    setAuthMode("choice");
  }

  // ── Profile Edit ─────────────────────────────────────────────────────────
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.token) return;
    setSavingProfile(true);
    setError("");
    try {
      const res = await fetch("/api/me/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim(),
          preferredCurrency: editCurrency,
        }),
      });
      if (res.ok) {
        storeCustomerSession({
          name: editName.trim(),
          email: editEmail.trim(),
        });
        setSession((prev) =>
          prev ? { ...prev, name: editName.trim(), email: editEmail.trim() } : null
        );
        setCurrency(editCurrency);
        setShowEditProfile(false);
      } else {
        const data = await res.json();
        setError(resolveErrorMessage(data, "Failed to update profile."));
      }
    } catch {
      setError("Network error updating profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  // ── Address Book Actions ─────────────────────────────────────────────────
  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.token || !newAddrText.trim()) return;
    setSavingAddress(true);
    try {
      const res = await fetch("/api/me/locations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          label: newAddrLabel,
          address: newAddrText.trim(),
          landmark: newAddrLandmark.trim(),
          latitude: newAddrLat,
          longitude: newAddrLng,
        }),
      });
      if (res.ok) {
        setShowAddAddress(false);
        setNewAddrText("");
        setNewAddrLandmark("");
        fetchAddresses(session.token);
      } else {
        const data = await res.json();
        setError(resolveErrorMessage(data, "Failed to save address."));
      }
    } catch {
      setError("Network error saving address.");
    } finally {
      setSavingAddress(false);
    }
  }

  async function handleDeleteAddress(addrId: string) {
    if (!session?.token) return;
    try {
      const res = await fetch(`/api/me/locations/${addrId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (res.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== addrId));
      }
    } catch {
      // ignore
    }
  }

  // ── Order Cancellation ───────────────────────────────────────────────────
  async function handleConfirmCancel() {
    if (!cancellingOrderId || !session?.phone) return;
    setCancellingLoading(true);
    try {
      const res = await fetch(`/api/orders/${cancellingOrderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: session.phone,
          reason: cancelReason || "Customer cancelled from profile dashboard",
        }),
      });
      if (res.ok) {
        setCancellingOrderId(null);
        setCancelReason("");
        if (session.token) fetchOrders(session.token);
      } else {
        const data = await res.json();
        alert(resolveErrorMessage(data, "Unable to cancel this order."));
      }
    } catch {
      alert("Network error cancelling order.");
    } finally {
      setCancellingLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Account</h1>
          <p className="text-sm text-slate-500 mt-1">
            {session
              ? `Welcome back, ${session.name || "Customer"}`
              : "Sign in to access your orders and saved addresses"}
          </p>
        </div>

        {/* ── Logged In Experience ────────────────────────────────────────── */}
        {session ? (
          <div className="space-y-6">
            {/* Customer Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-2xl font-black text-[#e31b23]">
                  {(session.name || "M")[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">{session.name || "Guest Customer"}</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{session.phone}</p>
                  {session.email && (
                    <p className="text-xs text-slate-400 mt-0.5">{session.email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowEditProfile(true)}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  ✏️ Edit Profile
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-red-50 hover:bg-red-100 text-[#e31b23] text-xs font-bold rounded-xl transition-all"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-slate-200/60 p-1.5 rounded-2xl max-w-md">
              <button
                onClick={() => setActiveTab("orders")}
                className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${
                  activeTab === "orders"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                📦 Orders ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab("addresses")}
                className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${
                  activeTab === "addresses"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                📍 Saved Addresses ({addresses.length})
              </button>
            </div>

            {/* Tab 1: Orders */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                {loadingOrders ? (
                  <div className="p-12 text-center text-slate-400 text-sm">Loading order history…</div>
                ) : orders.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
                    <div className="text-4xl">🍳</div>
                    <h3 className="font-bold text-slate-900">No orders placed yet</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Explore our delicious dishes and experience fresh roadside-style meals delivered to your door.
                    </p>
                    <Link
                      href="/menu"
                      className="inline-block mt-2 px-6 py-3 bg-[#e31b23] hover:bg-[#c9151c] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-500/20 transition-all"
                    >
                      Browse Menu
                    </Link>
                  </div>
                ) : (
                  orders.map((o) => {
                    const isCancellable = o.status === "PAID" || o.status === "CONFIRMED";
                    return (
                      <div
                        key={o.id || o.code}
                        className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-black text-[#e31b23] text-sm">
                              #{o.code}
                            </span>
                            <span
                              className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                o.status === "DELIVERED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : o.status === "CANCELLED"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {o.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 truncate max-w-md">
                            {o.items?.map((i) => `${i.qty}× ${i.presetName}`).join(", ") || "Meal Order"}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {new Date(o.createdAt).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                          <span className="font-black text-slate-900 text-base">
                            {formatPrice(o.totalKobo)}
                          </span>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/orders/track?code=${o.code}&phone=${encodeURIComponent(
                                session.phone
                              )}`}
                              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all"
                            >
                              Live Tracker →
                            </Link>
                            {isCancellable && (
                              <button
                                onClick={() => setCancellingOrderId(o.code)}
                                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-[#e31b23] text-xs font-bold rounded-xl transition-all"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Tab 2: Saved Addresses */}
            {activeTab === "addresses" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Your Delivery Locations</h3>
                  <button
                    onClick={() => setShowAddAddress(true)}
                    className="px-4 py-2 bg-[#e31b23] hover:bg-[#c9151c] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-red-500/20"
                  >
                    + Add New Address
                  </button>
                </div>

                {loadingAddresses ? (
                  <div className="p-12 text-center text-slate-400 text-sm">Loading addresses…</div>
                ) : addresses.length === 0 ? (
                  <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-sm space-y-2">
                    <div className="text-3xl">🏠</div>
                    <p className="text-sm font-bold text-slate-900">No saved addresses</p>
                    <p className="text-xs text-slate-500">
                      Save your home, office, or favorite spots to checkout faster next time.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr, idx) => (
                      <div
                        key={addr.id || idx}
                        className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 text-[11px] font-bold rounded-lg uppercase">
                              {addr.label || "Address"}
                            </span>
                            {addr.id && (
                              <button
                                onClick={() => handleDeleteAddress(addr.id!)}
                                className="text-xs text-slate-400 hover:text-red-600 transition-colors"
                              >
                                🗑️ Delete
                              </button>
                            )}
                          </div>
                          <p className="text-xs font-bold text-slate-900">{addr.address}</p>
                          {addr.landmark && (
                            <p className="text-[11px] text-slate-500 mt-1">Landmark: {addr.landmark}</p>
                          )}
                        </div>
                        {addr.latitude && addr.longitude && (
                          <p className="text-[10px] text-slate-400 font-mono">
                            📍 {addr.latitude.toFixed(4)}, {addr.longitude.toFixed(4)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ── Non-Authenticated State ───────────────────────────────────── */
          <div className="max-w-md mx-auto">
            {authMode === "choice" && (
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-3xl mx-auto">
                  👋
                </div>
                <h2 className="text-2xl font-black text-slate-900">Welcome to Meeshaai</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Sign in to view your recent orders, manage your saved delivery addresses, or register a new account.
                </p>

                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => setAuthMode("login")}
                    className="w-full py-3.5 bg-[#e31b23] hover:bg-[#c9151c] text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-red-500/20 transition-all"
                  >
                    Sign In (Returning Customer)
                  </button>
                  <button
                    onClick={() => setAuthMode("register")}
                    className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black uppercase tracking-wider rounded-2xl transition-all"
                  >
                    Create Account (New User)
                  </button>
                </div>
              </div>
            )}

            {/* Returning customer login */}
            {authMode === "login" && (
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-5">
                <button
                  onClick={() => setAuthMode("choice")}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1"
                >
                  ← Back
                </button>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Sign In</h2>
                  <p className="text-xs text-slate-500 mt-1">Enter your login credentials</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Email or Phone
                    </label>
                    <input
                      type="text"
                      placeholder="08012345678 or name@domain.com"
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-[#e31b23]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showLoginPw ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 text-slate-900 focus:outline-none focus:border-[#e31b23]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPw(!showLoginPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                      >
                        {showLoginPw ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-xs text-[#e31b23] font-medium">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-[#e31b23] hover:bg-[#c9151c] text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-red-500/20 transition-all disabled:opacity-50"
                  >
                    {loading ? "Signing in…" : "Sign In"}
                  </button>

                  <p className="text-center text-xs text-slate-400">
                    New customer?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("register")}
                      className="text-[#e31b23] font-bold hover:underline"
                    >
                      Create account
                    </button>
                  </p>
                </form>
              </div>
            )}

            {/* New registration */}
            {authMode === "register" && (
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-5">
                <button
                  onClick={() => setAuthMode("choice")}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1"
                >
                  ← Back
                </button>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Create Account</h2>
                  <p className="text-xs text-slate-500 mt-1">We will send a code to verify your phone</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Adaeze Okonkwo"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-[#e31b23]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="08012345678"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-mono focus:outline-none focus:border-[#e31b23]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="adaeze@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-[#e31b23]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPw ? "text" : "password"}
                        placeholder="Choose a password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-12 text-slate-900 focus:outline-none focus:border-[#e31b23]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPw(!showRegPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                      >
                        {showRegPw ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-xs text-[#e31b23] font-medium">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-[#e31b23] hover:bg-[#c9151c] text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-red-500/20 transition-all disabled:opacity-50"
                  >
                    {loading ? "Sending code…" : "Send Verification Code"}
                  </button>
                </form>
              </div>
            )}

            {/* OTP verification */}
            {authMode === "register-otp" && (
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-5">
                <button
                  onClick={() => setAuthMode("register")}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1"
                >
                  ← Back
                </button>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Verify Phone</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter the code sent to <span className="font-mono font-bold text-slate-900">{regPhone}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {devOtp && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl font-mono">
                      Dev code: {devOtp}
                    </div>
                  )}

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-2xl font-black text-center tracking-[0.4em] font-mono bg-slate-50 border border-slate-200 rounded-xl py-3 focus:outline-none focus:border-[#e31b23]"
                  />

                  {error && <p className="text-xs text-[#e31b23] font-medium">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading || otpValue.length < 4}
                    className="w-full py-3.5 bg-[#e31b23] hover:bg-[#c9151c] text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-red-500/20 transition-all disabled:opacity-50"
                  >
                    {loading ? "Verifying…" : "Activate & Continue"}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ── Modal: Edit Profile ────────────────────────────────────────── */}
        {showEditProfile && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-100 shadow-2xl space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900">Edit Profile</h3>
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-[#e31b23]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-[#e31b23]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Preferred Currency
                  </label>
                  <select
                    value={editCurrency}
                    onChange={(e) => setEditCurrency(e.target.value as SupportedCurrency)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-[#e31b23]"
                  >
                    <option value="NGN">NGN (₦ Nigerian Naira)</option>
                    <option value="USD">USD ($ US Dollar)</option>
                    <option value="GBP">GBP (£ British Pound)</option>
                    <option value="EUR">EUR (€ Euro)</option>
                    <option value="CAD">CAD ($ Canadian Dollar)</option>
                    <option value="GHS">GHS (₵ Ghanaian Cedi)</option>
                    <option value="KES">KES (KSh Kenyan Shilling)</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditProfile(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex-1 py-3 bg-[#e31b23] hover:bg-[#c9151c] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-red-500/20"
                  >
                    {savingProfile ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal: Add Saved Address ─────────────────────────────────────── */}
        {showAddAddress && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-100 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900">Add New Address</h3>
                <button
                  onClick={() => setShowAddAddress(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddAddress} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Label
                  </label>
                  <div className="flex gap-2">
                    {["Home", "Office", "Gym", "Other"].map((lbl) => (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => setNewAddrLabel(lbl)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          newAddrLabel === lbl
                            ? "bg-[#e31b23] text-white border-[#e31b23]"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Address Details
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddrMap(!showAddrMap)}
                      className="text-xs font-bold text-[#e31b23] hover:underline"
                    >
                      📍 {showAddrMap ? "Hide Map" : "Pin on Map"}
                    </button>
                  </div>

                  {showAddrMap && (
                    <div className="border border-slate-200 rounded-2xl p-2 bg-slate-50 mb-2">
                      <LeafletMapPicker
                        initialLat={newAddrLat}
                        initialLng={newAddrLng}
                        onLocationSelected={(latVal, lngVal, addrStr) => {
                          setNewAddrLat(latVal);
                          setNewAddrLng(lngVal);
                          setNewAddrText(addrStr);
                        }}
                      />
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="Street, estate, or area name"
                    value={newAddrText}
                    onChange={(e) => setNewAddrText(e.target.value)}
                    required
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-[#e31b23]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Near Big Church, Opposite Supermarket"
                    value={newAddrLandmark}
                    onChange={(e) => setNewAddrLandmark(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-[#e31b23]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="flex-1 py-3 bg-[#e31b23] hover:bg-[#c9151c] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-red-500/20"
                  >
                    {savingAddress ? "Saving…" : "Save Location"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal: Cancel Order ─────────────────────────────────────────── */}
        {cancellingOrderId && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-100 shadow-2xl space-y-4">
              <h3 className="text-lg font-black text-slate-900">Cancel Order #{cancellingOrderId}?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to cancel this order? If paid, a refund will be initiated to your payment method.
              </p>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Reason for Cancellation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ordered by mistake, changed mind"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-[#e31b23]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingOrderId(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={cancellingLoading}
                  className="flex-1 py-2.5 bg-[#e31b23] hover:bg-[#c9151c] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-red-500/20"
                >
                  {cancellingLoading ? "Cancelling…" : "Confirm Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
