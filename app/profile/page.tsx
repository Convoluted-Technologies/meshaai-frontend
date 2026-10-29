"use client";

import { useState, useEffect } from "react";
import { CustomerUser, Order } from "@/lib/types";
import Link from "next/link";
import Navbar from "@/components/Navbar";

// ─── localStorage helpers ────────────────────────────────────────────────────
const STORAGE_KEY = "Meeshaai_customer_v2";

interface SavedSession {
  token: string;
  customerId: string;
  name: string;
  phone: string;
  email: string;
}

function loadSession(): Partial<SavedSession> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSession(data: Partial<SavedSession>) {
  try {
    const existing = loadSession();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...data }));
  } catch {}
}

function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// ─── Types ───────────────────────────────────────────────────────────────────
type AuthMode = "choice" | "login" | "register" | "register-otp";

// ─── Component ───────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const [authMode, setAuthMode] = useState<AuthMode>("choice");
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [authToken, setAuthToken] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Login form fields
  const [loginId, setLoginId] = useState(""); // email or phone
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Register form fields
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPw, setShowRegPw] = useState(false);

  // OTP (register verification)
  const [otpValue, setOtpValue] = useState("");
  const [devOtp, setDevOtp] = useState("");

  // ── Restore session on mount ─────────────────────────────────────────────
  useEffect(() => {
    const saved = loadSession();
    if (saved.token && saved.customerId) {
      setAuthToken(saved.token);
      setCustomer({
        id: saved.customerId,
        name: saved.name || "",
        phone: saved.phone || "",
        email: saved.email,
        createdAt: "",
      } as CustomerUser);
      fetchCustomerOrders(saved.token);
    }
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const formatNGN = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

  function resetForms() {
    setError("");
    setSuccessMsg("");
    setLoginId("");
    setLoginPassword("");
    setRegName("");
    setRegPhone("");
    setRegEmail("");
    setRegPassword("");
    setOtpValue("");
    setDevOtp("");
  }

  function goTo(mode: AuthMode) {
    resetForms();
    setAuthMode(mode);
  }

  // ── Login (returning customer — no OTP) ─────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginId.trim() || !loginPassword) {
      setError("Please enter your email or phone number and your password.");
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
        const c: CustomerUser = {
          id: data.customer?.id || "",
          name: data.customer?.name || "",
          phone: data.customer?.phone || "",
          email: data.customer?.email,
          createdAt: data.customer?.createdAt || new Date().toISOString(),
          updatedAt: data.customer?.updatedAt || new Date().toISOString(),
        };
        setCustomer(c);
        setAuthToken(data.token);
        saveSession({
          token: data.token,
          customerId: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email || "",
        });
        fetchCustomerOrders(data.token);
      } else {
        setError(data.detail || "Invalid credentials. Please check and try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Register step 1: submit form → backend sends OTP ────────────────────
  async function handleRegisterSubmit(e: React.FormEvent) {
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
        setSuccessMsg(data.message || "OTP sent to your phone. Please verify to activate your account.");
        if (data.devOtp) setDevOtp(data.devOtp);
        setAuthMode("register-otp");
      } else {
        setError(data.detail || "Registration failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Register step 2: verify OTP sent during registration ────────────────
  async function handleRegisterOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!otpValue.trim()) {
      setError("Please enter the OTP code sent to your phone.");
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
        const c: CustomerUser = {
          id: data.customer?.id || "",
          name: data.customer?.name || regName,
          phone: data.customer?.phone || regPhone,
          email: data.customer?.email || regEmail,
          createdAt: data.customer?.createdAt || new Date().toISOString(),
          updatedAt: data.customer?.updatedAt || new Date().toISOString(),
        };
        setCustomer(c);
        setAuthToken(data.token);
        saveSession({
          token: data.token,
          customerId: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email || regEmail,
        });
        fetchCustomerOrders(data.token);
      } else {
        setError(data.detail || "Invalid or expired OTP. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Fetch order history ───────────────────────────────────────────────────
  async function fetchCustomerOrders(token: string) {
    try {
      const res = await fetch("/api/me/orders", {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setOrders(data);
      else if (res.ok && data.orders) setOrders(data.orders);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  }

  function handleSignOut() {
    clearSession();
    setCustomer(null);
    setOrders([]);
    setAuthToken("");
    resetForms();
    setAuthMode("choice");
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mt-4 mb-10 inset-x-0 z-5 pointer-events-auto">
        <Navbar />
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-16 space-y-8">
        {/* Page heading */}
        <div className="text-center space-y-2 pt-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl mx-auto">
            👤
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            My Account
          </h1>
          <p className="text-sm text-slate-400">
            {customer
              ? "View your profile and order history"
              : "Sign in or create a new account"}
          </p>
        </div>

        {/* ── Logged-in state ─────────────────────────────────────────────── */}
        {customer ? (
          <div className="space-y-6">
            {/* Profile card */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl font-black text-amber-400 shrink-0">
                  {(customer.name || "?")[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">
                    {customer.name || "Customer"}
                  </h2>
                  {customer.email && (
                    <p className="text-xs text-slate-400 mt-0.5">{customer.email}</p>
                  )}
                  <p className="text-sm font-mono text-amber-400 mt-0.5">
                    {customer.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="shrink-0 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
              >
                Sign Out
              </button>
            </div>

            {/* Order history */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Order History</h3>
                <span className="text-xs bg-slate-800 text-amber-400 px-2.5 py-0.5 rounded-full font-mono border border-slate-700">
                  {orders.length}
                </span>
              </div>

              {orders.length === 0 ? (
                <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 text-center">
                  <div className="text-3xl mb-3">📦</div>
                  <p className="text-slate-400 text-sm">No orders yet. Place your first order!</p>
                  <Link
                    href="/"
                    className="inline-block mt-4 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-colors"
                  >
                    Browse Menu
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((o) => (
                    <div
                      key={o.id}
                      className="rounded-2xl bg-slate-900 border border-slate-800 p-4 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-amber-400 font-mono text-sm block">
                          #{o.code}
                        </span>
                        <span className="text-xs text-slate-300 block truncate mt-0.5">
                          {o.items.map((i) => `${i.qty}× ${i.presetName}`).join(", ")}
                        </span>
                        <span className="block text-slate-500 text-[10px] mt-1">
                          {new Date(o.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <span className="font-mono font-bold text-white text-sm block">
                          {formatNGN(o.totalKobo)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // ── Auth forms ────────────────────────────────────────────────────
          <div className="max-w-md mx-auto">

            {/* ── Choice screen ───────────────────────────────────────────── */}
            {authMode === "choice" && (
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 space-y-4">
                <h2 className="text-xl font-bold text-white text-center">Welcome back 👋</h2>
                <p className="text-sm text-slate-400 text-center">
                  Are you a new customer or returning?
                </p>
                <button
                  onClick={() => goTo("login")}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md shadow-amber-500/20"
                >
                  Sign In — I have an account
                </button>
                <button
                  onClick={() => goTo("register")}
                  className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm border border-slate-700 transition-all"
                >
                  Create Account — I&apos;m new here
                </button>
              </div>
            )}

            {/* ── Login form (returning customer — no OTP) ────────────────── */}
            {authMode === "login" && (
              <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-slate-800">
                  <button
                    onClick={() => goTo("choice")}
                    className="text-xs text-slate-400 hover:text-slate-200 mb-3 flex items-center gap-1 transition-colors"
                  >
                    ← Back
                  </button>
                  <h2 className="text-xl font-bold text-white">Sign In</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Welcome back! Enter your credentials below.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="p-6 space-y-4">
                  {/* Email or phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                      Email or Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. adaeze@email.com or 08012345678"
                      value={loginId}
                      onChange={(e) => { setLoginId(e.target.value); setError(""); }}
                      autoComplete="username"
                      className="w-full text-sm bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 rounded-xl px-4 py-3 text-slate-100 outline-none transition-all"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showLoginPw ? "text" : "password"}
                        placeholder="Your password"
                        value={loginPassword}
                        onChange={(e) => { setLoginPassword(e.target.value); setError(""); }}
                        autoComplete="current-password"
                        className="w-full text-sm bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 rounded-xl px-4 py-3 pr-12 text-slate-100 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs px-1 transition-colors"
                      >
                        {showLoginPw ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p className="text-xs text-red-400 font-medium bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md shadow-amber-500/20"
                  >
                    {loading ? "Signing in…" : "Sign In"}
                  </button>

                  <p className="text-center text-xs text-slate-500">
                    New here?{" "}
                    <button
                      type="button"
                      onClick={() => goTo("register")}
                      className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
                    >
                      Create an account
                    </button>
                  </p>
                </form>
              </div>
            )}

            {/* ── Registration form (new customer) ────────────────────────── */}
            {authMode === "register" && (
              <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-slate-800">
                  <button
                    onClick={() => goTo("choice")}
                    className="text-xs text-slate-400 hover:text-slate-200 mb-3 flex items-center gap-1 transition-colors"
                  >
                    ← Back
                  </button>
                  <h2 className="text-xl font-bold text-white">Create Account</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Fill in your details. We&apos;ll send a verification code to your phone.
                  </p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
                  {/* Full name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Adaeze Okonkwo"
                      value={regName}
                      onChange={(e) => { setRegName(e.target.value); setError(""); }}
                      autoComplete="name"
                      className="w-full text-sm bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 rounded-xl px-4 py-3 text-slate-100 outline-none transition-all"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 08012345678"
                      value={regPhone}
                      onChange={(e) => { setRegPhone(e.target.value); setError(""); }}
                      autoComplete="tel"
                      className="w-full text-sm bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 rounded-xl px-4 py-3 text-slate-100 font-mono outline-none transition-all"
                    />
                    <p className="text-[11px] text-slate-500">
                      A verification code will be sent to this number.
                    </p>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. adaeze@email.com"
                      value={regEmail}
                      onChange={(e) => { setRegEmail(e.target.value); setError(""); }}
                      autoComplete="email"
                      className="w-full text-sm bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 rounded-xl px-4 py-3 text-slate-100 outline-none transition-all"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPw ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={regPassword}
                        onChange={(e) => { setRegPassword(e.target.value); setError(""); }}
                        autoComplete="new-password"
                        className="w-full text-sm bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 rounded-xl px-4 py-3 pr-12 text-slate-100 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs px-1 transition-colors"
                      >
                        {showRegPw ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p className="text-xs text-red-400 font-medium bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md shadow-amber-500/20"
                  >
                    {loading ? "Creating account…" : "Continue — Send Verification Code"}
                  </button>

                  <p className="text-center text-xs text-slate-500">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => goTo("login")}
                      className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
                    >
                      Sign in
                    </button>
                  </p>
                </form>
              </div>
            )}

            {/* ── OTP verification (after registration) ───────────────────── */}
            {authMode === "register-otp" && (
              <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-slate-800">
                  <button
                    onClick={() => goTo("register")}
                    className="text-xs text-slate-400 hover:text-slate-200 mb-3 flex items-center gap-1 transition-colors"
                  >
                    ← Back
                  </button>
                  <h2 className="text-xl font-bold text-white">Verify Your Phone</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Enter the 6-digit code sent to{" "}
                    <span className="font-mono text-amber-400 font-bold">{regPhone}</span>
                  </p>
                </div>

                <form onSubmit={handleRegisterOTP} className="p-6 space-y-5">
                  {/* Success banner */}
                  {successMsg && (
                    <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-2.5 rounded-lg">
                      <span className="shrink-0">✅</span>
                      <span>{successMsg}</span>
                    </div>
                  )}

                  {/* OTP input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block text-center">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="• • • • • •"
                      value={otpValue}
                      onChange={(e) => { setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                      maxLength={6}
                      className="w-full text-2xl font-black bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 rounded-xl px-4 py-4 text-amber-400 font-mono text-center tracking-[0.4em] outline-none transition-all"
                    />
                    {devOtp && (
                      <p className="text-[10px] text-center text-slate-600 font-mono">
                        Dev code: {devOtp}
                      </p>
                    )}
                  </div>

                  {error && (
                    <p className="text-xs text-red-400 font-medium bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg text-center">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || otpValue.length < 4}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md shadow-amber-500/20"
                  >
                    {loading ? "Verifying…" : "Verify & Activate Account"}
                  </button>

                  <p className="text-center text-xs text-slate-500">
                    Didn&apos;t get a code?{" "}
                    <button
                      type="button"
                      onClick={() => goTo("register")}
                      className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
                    >
                      Go back and resend
                    </button>
                  </p>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
