'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { resolveErrorMessage } from '@/lib/errorCodes';
import {
  getStoredCustomerSession,
  storeCustomerSession,
  CustomerSession,
} from '@/lib/api/backendClient';

// Dynamically import Leaflet map picker for client-only rendering
const LeafletMapPicker = dynamic(() => import('@/components/LeafletMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-xs text-slate-400">
      Loading OpenStreetMap…
    </div>
  ),
});

interface SavedLocationItem {
  id?: string;
  label?: string;
  address: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

type AuthTab = 'guest' | 'login';
type Step = 'form' | 'submitting' | 'done';

export default function CheckoutModal({ onClose, onSuccess }: Props) {
  const router = useRouter();
  const {
    cart,
    quote,
    formatPrice,
    lat,
    lng,
    address: cartAddress,
    landmark: cartLandmark,
    phone: cartPhone,
    setLat,
    setLng,
    setAddress,
    setLandmark,
    setPhone,
    setNote,
  } = useCart();

  // Session & customer state
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [authTab, setAuthTab] = useState<AuthTab>('guest');

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhoneLocal] = useState('');
  const [address, setAddressLocal] = useState('');
  const [landmark, setLandmarkLocal] = useState('');
  const [note, setNoteLocal] = useState('');

  // Login form fields (for returning customer)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // OTP state (for guest / new checkout)
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<SavedLocationItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('custom');
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Map picker modal toggle
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Submission
  const [step, setStep] = useState<Step>('form');
  const [submitError, setSubmitError] = useState('');

  // Load customer session on mount
  useEffect(() => {
    const s = getStoredCustomerSession();
    if (s && s.token) {
      setSession(s);
      if (s.name) setName(s.name);
      if (s.phone) setPhoneLocal(s.phone);
      if (s.address) setAddressLocal(s.address);
      if (s.landmark) setLandmarkLocal(s.landmark);
      setOtpVerified(true);
      fetchSavedAddresses(s.token);
    } else {
      // Use cart state defaults if available
      if (cartPhone) setPhoneLocal(cartPhone);
      if (cartAddress) setAddressLocal(cartAddress);
      if (cartLandmark) setLandmarkLocal(cartLandmark);
    }
  }, [cartPhone, cartAddress, cartLandmark]);

  async function fetchSavedAddresses(token: string) {
    setLoadingAddresses(true);
    try {
      const res = await fetch('/api/me/locations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const list: SavedLocationItem[] = Array.isArray(data)
          ? data
          : data.locations || data.addresses || [];
        setSavedAddresses(list);
        if (list.length > 0 && !address) {
          const first = list[0];
          setSelectedAddressId(first.id || '0');
          setAddressLocal(first.address);
          if (first.landmark) setLandmarkLocal(first.landmark);
          if (first.latitude && first.longitude) {
            setLat(first.latitude);
            setLng(first.longitude);
          }
        }
      }
    } catch {
      // silently fall back to manual address
    } finally {
      setLoadingAddresses(false);
    }
  }

  // ── Returning Customer Login (No OTP required) ──────────────────────────
  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword) {
      setLoginError('Please enter your email/phone and password.');
      return;
    }
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch('/api/auth/customer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        const userSession: CustomerSession = {
          id: data.customer?.id || '',
          name: data.customer?.name || '',
          phone: data.customer?.phone || loginIdentifier,
          email: data.customer?.email,
          token: data.token,
        };
        storeCustomerSession(userSession);
        setSession(userSession);
        setName(userSession.name);
        setPhoneLocal(userSession.phone);
        setOtpVerified(true);
        fetchSavedAddresses(data.token);
      } else {
        setLoginError(resolveErrorMessage(data, 'Invalid credentials. Please try again.'));
      }
    } catch {
      setLoginError('Network error. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  }

  // ── Guest OTP flow ───────────────────────────────────────────────────────
  async function handleSendOTP() {
    if (!phone.trim()) {
      setOtpError('Please enter your phone number first.');
      return;
    }
    setOtpError('');
    setOtpLoading(true);
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        if (data.devOtp) setDevOtp(data.devOtp);
      } else {
        setOtpError(resolveErrorMessage(data, 'Failed to send OTP. Try again.'));
      }
    } catch {
      setOtpError('Network error. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleVerifyOTP() {
    if (!otpValue.trim()) {
      setOtpError('Please enter the OTP code.');
      return;
    }
    setOtpError('');
    setOtpLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otpValue, name }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setOtpVerified(true);
        const newSession: CustomerSession = {
          id: data.customer?.id || '',
          name: data.customer?.name || name,
          phone,
          token: data.token,
          address,
          landmark,
        };
        storeCustomerSession(newSession);
        setSession(newSession);
      } else {
        setOtpError(resolveErrorMessage(data, 'Incorrect OTP. Please try again.'));
      }
    } catch {
      setOtpError('Network error verifying OTP.');
    } finally {
      setOtpLoading(false);
    }
  }

  function handleSelectSavedAddress(item: SavedLocationItem) {
    setSelectedAddressId(item.id || item.address);
    setAddressLocal(item.address);
    if (item.landmark) setLandmarkLocal(item.landmark);
    if (item.latitude && item.longitude) {
      setLat(item.latitude);
      setLng(item.longitude);
    }
  }

  // ── Place order & forward to Flutterwave ─────────────────────────────────
  async function handlePlaceOrder() {
    if (!name.trim()) {
      setSubmitError('Please enter your full name.');
      return;
    }
    if (!phone.trim()) {
      setSubmitError('Please enter your phone number.');
      return;
    }
    if (!otpVerified) {
      setSubmitError('Please complete phone verification or sign in to continue.');
      return;
    }
    if (!address.trim()) {
      setSubmitError('Please enter or select a delivery address.');
      return;
    }

    setStep('submitting');
    setSubmitError('');

    // Sync context state
    setPhone(phone);
    setAddress(address);
    setLandmark(landmark);
    setNote(note);

    let resolvedLat = lat;
    let resolvedLng = lng;
    if (!resolvedLat || !resolvedLng) {
      resolvedLat = 9.0765;
      resolvedLng = 7.3986;
      setLat(resolvedLat);
      setLng(resolvedLng);
    }

    const items = Object.entries(cart)
      .filter(([_, l]) => l.qty > 0)
      .map(([presetId, l]) => ({ presetId, qty: l.qty, extras: l.extras }));

    try {
      const idempotencyKey = `idem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      };
      const token = session?.token;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name,
          phone,
          customerId: session?.id || undefined,
          items,
          location: { lat: resolvedLat, lng: resolvedLng, address, landmark },
          note,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setSubmitError(resolveErrorMessage(orderData, 'Failed to create order.'));
        setStep('form');
        return;
      }

      const createdOrder = orderData.order;

      // Update session storage
      storeCustomerSession({
        name,
        phone,
        address,
        landmark,
        id: session?.id || createdOrder?.customerId || '',
      });

      // Optionally save to customer address book in background
      if (token && address) {
        fetch('/api/me/locations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            address,
            landmark,
            latitude: resolvedLat,
            longitude: resolvedLng,
          }),
        }).catch(() => {});
      }

      // Initialize Flutterwave payment
      const payRes = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderCode: createdOrder.code }),
      });
      const payData = await payRes.json();

      if (payRes.ok && payData.checkoutUrl) {
        window.location.href = payData.checkoutUrl;
      } else {
        onSuccess();
        router.push(`/orders/track?code=${createdOrder.code}&phone=${encodeURIComponent(phone)}`);
      }
    } catch (err: any) {
      setSubmitError('Network error: ' + err.message);
      setStep('form');
    }
  }

  const isFormLocked = step === 'submitting';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={!isFormLocked ? onClose : undefined}
      />

      {/* Modal Card */}
      <div className="fixed inset-x-0 bottom-0 z-[70] max-h-[94vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg md:rounded-3xl md:max-h-[90vh] border border-slate-100">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-4 sm:px-6 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between rounded-t-3xl z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Checkout</h2>
            {quote && (
              <p className="text-xs text-slate-500 mt-0.5">
                Total: <span className="font-black text-[#e31b23]">{quote.grandTotalFormatted || formatPrice(quote.grandTotalKobo)}</span>
              </p>
            )}
          </div>
          {!isFormLocked && (
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-sm transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {/* Customer Authentication State */}
          {!session ? (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
              {/* Tab Selector */}
              <div className="flex bg-slate-200/80 p-1 rounded-xl mb-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAuthTab('guest')}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    authTab === 'guest'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ⚡ Fast Checkout (OTP)
                </button>
                <button
                  type="button"
                  onClick={() => setAuthTab('login')}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    authTab === 'login'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🔑 Returning Customer
                </button>
              </div>

              {authTab === 'login' ? (
                /* Returning Customer Direct Login */
                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Email or Phone
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 08012345678 or name@domain.com"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#e31b23]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#e31b23]"
                    />
                  </div>
                  {loginError && (
                    <p className="text-xs text-[#e31b23] font-medium">{loginError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-60"
                  >
                    {loginLoading ? 'Signing in…' : 'Sign In & Load Saved Addresses'}
                  </button>
                </form>
              ) : (
                /* Guest OTP Flow Notice */
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your details below. We&apos;ll send a fast 6-digit SMS verification code to verify your phone number.
                </p>
              )}
            </div>
          ) : (
            /* Logged in banner */
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px]">
                  ✓
                </span>
                <div>
                  <p className="font-bold">Signed in as {session.name || 'Customer'}</p>
                  <p className="text-emerald-700/80 font-mono text-[11px]">{session.phone}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSession(null);
                  setOtpVerified(false);
                }}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline"
              >
                Switch Account
              </button>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Adaeze Okonkwo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isFormLocked}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-[#e31b23] focus:ring-2 focus:ring-[#e31b23]/10 disabled:opacity-60 transition-all"
            />
          </div>

          {/* Phone + OTP */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Phone Number
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="08012345678"
                value={phone}
                onChange={(e) => {
                  setPhoneLocal(e.target.value);
                  if (!session?.token) {
                    setOtpSent(false);
                    setOtpVerified(false);
                    setOtpValue('');
                  }
                }}
                disabled={isFormLocked || otpVerified}
                className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-[#e31b23] focus:ring-2 focus:ring-[#e31b23]/10 disabled:opacity-60 font-mono transition-all"
              />
              {!otpVerified && (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={otpLoading || isFormLocked}
                  className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl whitespace-nowrap disabled:opacity-50 transition-all flex-shrink-0"
                >
                  {otpLoading && !otpSent ? '…' : 'Send OTP'}
                </button>
              )}
              {otpVerified && (
                <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl whitespace-nowrap flex items-center gap-1.5 flex-shrink-0">
                  <span>✓</span> Verified
                </div>
              )}
            </div>

            {/* OTP Verification Box */}
            {otpSent && !otpVerified && (
              <div className="space-y-2 pt-2 bg-red-50/50 p-3 rounded-xl border border-red-100">
                <p className="text-xs text-slate-600">
                  Enter the 6-digit code sent to <strong className="font-mono">{phone}</strong>
                  {devOtp && (
                    <span className="ml-1 text-[#e31b23] font-mono font-bold">(Dev: {devOtp})</span>
                  )}
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                    disabled={otpLoading || isFormLocked}
                    className="flex-1 text-base text-center tracking-[0.3em] bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-[#e31b23] font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={otpLoading || otpValue.length < 4 || isFormLocked}
                    className="px-5 py-2.5 bg-[#e31b23] hover:bg-[#c9151c] text-white text-xs font-bold rounded-xl whitespace-nowrap disabled:opacity-50 transition-all flex-shrink-0 shadow-md shadow-red-500/20"
                  >
                    {otpLoading ? '…' : 'Verify'}
                  </button>
                </div>
              </div>
            )}

            {otpError && <p className="text-xs text-[#e31b23] font-medium">{otpError}</p>}
          </div>

          {/* Saved Addresses (if available) */}
          {savedAddresses.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Saved Delivery Addresses
              </label>
              <div className="grid grid-cols-1 gap-2">
                {savedAddresses.map((item, idx) => {
                  const idStr = item.id || String(idx);
                  const isSelected = selectedAddressId === idStr;
                  return (
                    <div
                      key={idStr}
                      onClick={() => handleSelectSavedAddress(item)}
                      className={`cursor-pointer p-3 rounded-xl border transition-all text-left flex items-start gap-3 ${
                        isSelected
                          ? 'border-[#e31b23] bg-red-50/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="savedAddress"
                        checked={isSelected}
                        onChange={() => handleSelectSavedAddress(item)}
                        className="mt-1 accent-[#e31b23]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            {item.label || 'Saved Location'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 truncate mt-0.5">{item.address}</p>
                        {item.landmark && (
                          <p className="text-[11px] text-slate-400">Near: {item.landmark}</p>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div
                  onClick={() => setSelectedAddressId('custom')}
                  className={`cursor-pointer p-3 rounded-xl border transition-all text-left flex items-center gap-3 ${
                    selectedAddressId === 'custom'
                      ? 'border-[#e31b23] bg-red-50/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="savedAddress"
                    checked={selectedAddressId === 'custom'}
                    onChange={() => setSelectedAddressId('custom')}
                    className="accent-[#e31b23]"
                  />
                  <span className="text-xs font-bold text-slate-700">Enter a different address</span>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Address Input */}
          {(savedAddresses.length === 0 || selectedAddressId === 'custom') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Delivery Address
                </label>
                <button
                  type="button"
                  onClick={() => setShowMapPicker(!showMapPicker)}
                  className="text-xs font-bold text-[#e31b23] hover:underline flex items-center gap-1"
                >
                  📍 {showMapPicker ? 'Hide Map' : 'Pick on Map'}
                </button>
              </div>

              {/* Quick district buttons */}
              <div className="flex gap-2 text-[11px]">
                <span className="text-slate-400 font-medium">Quick spots:</span>
                <button
                  type="button"
                  onClick={() => {
                    setLat(9.0765);
                    setLng(7.3986);
                    setAddressLocal('Central Business District, Abuja');
                  }}
                  className="text-[#e31b23] hover:underline font-semibold"
                >
                  CBD
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLat(9.0579);
                    setLng(7.4951);
                    setAddressLocal('Garki, Abuja');
                  }}
                  className="text-[#e31b23] hover:underline font-semibold"
                >
                  Garki
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLat(9.082);
                    setLng(7.439);
                    setAddressLocal('Wuse 2, Abuja');
                  }}
                  className="text-[#e31b23] hover:underline font-semibold"
                >
                  Wuse 2
                </button>
              </div>

              {/* Interactive OpenStreetMap Leaflet Picker toggle */}
              {showMapPicker && (
                <div className="border border-slate-200 rounded-2xl overflow-hidden p-3 bg-slate-50 space-y-2">
                  <p className="text-xs font-medium text-slate-600">
                    Click anywhere on the map or tap a district below to set your exact delivery spot:
                  </p>
                  <LeafletMapPicker
                    initialLat={lat || 9.0765}
                    initialLng={lng || 7.3986}
                    onLocationSelected={(resLat, resLng, resAddress) => {
                      setLat(resLat);
                      setLng(resLng);
                      setAddressLocal(resAddress);
                    }}
                  />
                </div>
              )}

              <input
                type="text"
                placeholder="Street address, building, or area"
                value={address}
                onChange={(e) => setAddressLocal(e.target.value)}
                disabled={isFormLocked}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-[#e31b23] focus:ring-2 focus:ring-[#e31b23]/10 disabled:opacity-60 transition-all"
              />
            </div>
          )}

          {/* Landmark */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Landmark
            </label>
            <input
              type="text"
              placeholder="e.g. Opposite City Park, Beside GTBank"
              value={landmark}
              onChange={(e) => setLandmarkLocal(e.target.value)}
              disabled={isFormLocked}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-[#e31b23] focus:ring-2 focus:ring-[#e31b23]/10 disabled:opacity-60 transition-all"
            />
          </div>

          {/* Delivery Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              Delivery Note <span className="text-slate-400 normal-case font-normal">(optional)</span>
            </label>
            <textarea
              placeholder="e.g. Call when outside the gate, extra pepper sauce…"
              value={note}
              onChange={(e) => setNoteLocal(e.target.value)}
              rows={2}
              disabled={isFormLocked}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-[#e31b23] focus:ring-2 focus:ring-[#e31b23]/10 disabled:opacity-60 resize-none transition-all"
            />
          </div>

          {/* Error display */}
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[#e31b23] text-xs font-medium">
              ⚠️ {submitError}
            </div>
          )}

          {/* Place & Pay Button */}
          <button
            onClick={handlePlaceOrder}
            disabled={isFormLocked || !otpVerified}
            className="w-full py-4 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 bg-[#e31b23] hover:bg-[#c9151c] text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-red-600/30 transition-all active:scale-[0.98]"
          >
            {step === 'submitting' ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span>Processing Order…</span>
              </>
            ) : (
              <>
                <span>💳</span>
                <span>
                  Pay {quote ? (quote.grandTotalFormatted || formatPrice(quote.grandTotalKobo)) : ''} via Flutterwave
                </span>
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-slate-400 pb-2">
            🔒 Protected by Flutterwave. 100% safe & encrypted payments.
          </p>
        </div>
      </div>
    </>
  );
}
