'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { resolveErrorMessage } from '@/lib/errorCodes';

const STORAGE_KEY = 'meshaai_user_v1';

interface SavedUser {
  name: string;
  phone: string;
  address: string;
  landmark: string;
  token: string;       // JWT from OTP verify — skip OTP on next visit
  customerId: string;
}

function loadSavedUser(): Partial<SavedUser> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUser(data: Partial<SavedUser>) {
  try {
    const existing = loadSavedUser();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...data }));
  } catch {}
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'form' | 'submitting' | 'done';

export default function CheckoutModal({ onClose, onSuccess }: Props) {
  const router = useRouter();
  const { cart, quote, formatNGN, lat, lng, setLat, setLng, setAddress, setLandmark, setPhone, setNote } = useCart();

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhoneLocal] = useState('');
  const [address, setAddressLocal] = useState('');
  const [landmark, setLandmarkLocal] = useState('');
  const [note, setNoteLocal] = useState('');

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [savedToken, setSavedToken] = useState('');
  const [savedCustomerId, setSavedCustomerId] = useState('');

  // Submission
  const [step, setStep] = useState<Step>('form');
  const [submitError, setSubmitError] = useState('');

  // Load saved user from localStorage on mount
  useEffect(() => {
    const saved = loadSavedUser();
    if (saved.name) setName(saved.name);
    if (saved.phone) setPhoneLocal(saved.phone);
    if (saved.address) setAddressLocal(saved.address);
    if (saved.landmark) setLandmarkLocal(saved.landmark);
    if (saved.token) {
      setSavedToken(saved.token);
      setOtpVerified(true); // Already authenticated — skip OTP
    }
    if (saved.customerId) setSavedCustomerId(saved.customerId);
  }, []);

  // ── OTP flow ──────────────────────────────────────────────
  async function handleSendOTP() {
    if (!phone.trim()) { setOtpError('Please enter your phone number first.'); return; }
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
    if (!otpValue.trim()) { setOtpError('Please enter the OTP code.'); return; }
    setOtpError('');
    setOtpLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otpValue }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setOtpVerified(true);
        setSavedToken(data.token);
        if (data.customer?.id) setSavedCustomerId(data.customer.id);
      } else {
        setOtpError(resolveErrorMessage(data, 'Incorrect OTP. Please try again.'));
      }
    } catch {
      setOtpError('Network error verifying OTP.');
    } finally {
      setOtpLoading(false);
    }
  }

  // ── Place order ───────────────────────────────────────────
  async function handlePlaceOrder() {
    if (!name.trim()) { setSubmitError('Please enter your full name.'); return; }
    if (!phone.trim()) { setSubmitError('Please enter your phone number.'); return; }
    if (!otpVerified) { setSubmitError('Please verify your phone number via OTP first.'); return; }
    if (!address.trim()) { setSubmitError('Please enter your delivery address.'); return; }

    setStep('submitting');
    setSubmitError('');

    // Sync context state  
    setPhone(phone);
    setAddress(address);
    setLandmark(landmark);
    setNote(note);

    // ── Resolve coordinates ────────────────────────────────
    // If the user typed a custom address without clicking a quick-zone button,
    // lat/lng will still be 0. Fall back to central Abuja so the backend can
    // at least attempt the quote rather than failing with OUT_OF_ZONE immediately.
    let resolvedLat = lat;
    let resolvedLng = lng;
    if (!resolvedLat || !resolvedLng) {
      // Central Abuja default — backend will validate delivery zone from address text
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
      if (savedToken) headers['Authorization'] = `Bearer ${savedToken}`;

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name,
          phone,
          customerId: savedCustomerId || undefined,
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

      // Persist user details to localStorage for next visit
      saveUser({
        name,
        phone,
        address,
        landmark,
        token: savedToken,
        customerId: savedCustomerId || createdOrder.customerId || '',
      });

      // Auto-save delivery address to account if authenticated
      if (savedToken && address) {
        fetch('/api/me/locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${savedToken}` },
          body: JSON.stringify({ address, landmark, latitude: resolvedLat, longitude: resolvedLng }),
        }).catch(() => {}); // non-blocking, ignore errors
      }

      // Initialise Flutterwave payment
      const payRes = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderCode: createdOrder.code }),
      });
      const payData = await payRes.json();

      if (payRes.ok && payData.checkoutUrl) {
        window.location.href = payData.checkoutUrl;
      } else {
        // Fallback: redirect to profile page if payment link fails
        onSuccess();
        router.push(`/profile`);
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
        className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
        onClick={!isFormLocked ? onClose : undefined}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-[70] max-h-[94vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg md:rounded-3xl md:max-h-[90vh]">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between rounded-t-3xl z-10">
          <div>
            <h2 className="text-lg font-black text-slate-900">Checkout</h2>
            {quote && (
              <p className="text-xs text-slate-500 mt-0.5">
                Total: <span className="font-black text-amber-600">{formatNGN(quote.grandTotalKobo)}</span>
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

        <div className="p-6 space-y-5">
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
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 disabled:opacity-60 transition-all"
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
                  // If phone changes, reset OTP state (unless they have saved token)
                  if (!savedToken) { setOtpSent(false); setOtpVerified(false); setOtpValue(''); }
                }}
                disabled={isFormLocked}
                className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 disabled:opacity-60 font-mono transition-all"
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

            {/* OTP Input (appears after Send OTP) */}
            {otpSent && !otpVerified && (
              <div className="space-y-2 pt-1">
                <p className="text-xs text-slate-500">
                  Enter the 6-digit code sent to <strong>{phone}</strong>
                  {devOtp && <span className="ml-1 text-amber-600 font-mono font-bold">(Dev: {devOtp})</span>}
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
                    className="flex-1 text-lg text-center tracking-[0.4em] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-red-500 font-mono disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={otpLoading || otpValue.length < 4 || isFormLocked}
                    className="px-4 py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl whitespace-nowrap disabled:opacity-50 transition-all flex-shrink-0"
                  >
                    {otpLoading ? '…' : 'Verify'}
                  </button>
                </div>
              </div>
            )}

            {otpError && (
              <p className="text-xs text-red-500 font-medium">{otpError}</p>
            )}

            {savedToken && !otpSent && (
              <p className="text-[11px] text-emerald-600 font-medium">
                ✓ Phone verified from previous order — no OTP needed.
              </p>
            )}
          </div>

          {/* Delivery Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Delivery Address
            </label>
            {/* Quick zone buttons */}
            <div className="flex gap-2 text-[11px] mb-1">
              <span className="text-slate-400">Quick zones:</span>
              <button type="button" onClick={() => { setLat(9.0765); setLng(7.3986); setAddressLocal('Central Business District, Abuja'); }} className="text-red-600 hover:underline font-semibold">CBD</button>
              <button type="button" onClick={() => { setLat(9.0579); setLng(7.4951); setAddressLocal('Garki, Abuja'); }} className="text-red-600 hover:underline font-semibold">Garki</button>
              <button type="button" onClick={() => { setLat(9.0820); setLng(7.4390); setAddressLocal('Wuse, Abuja'); }} className="text-red-600 hover:underline font-semibold">Wuse</button>
            </div>
            <input
              type="text"
              placeholder="Street address, area or nearest bus stop"
              value={address}
              onChange={(e) => setAddressLocal(e.target.value)}
              disabled={isFormLocked}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 disabled:opacity-60 transition-all"
            />
          </div>

          {/* Landmark */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Landmark
            </label>
            <input
              type="text"
              placeholder="e.g. Opposite Domino Pizza, Next to UBA Bank"
              value={landmark}
              onChange={(e) => setLandmarkLocal(e.target.value)}
              disabled={isFormLocked}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 disabled:opacity-60 transition-all"
            />
          </div>

          {/* Note (optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              Delivery Note <span className="text-slate-400 normal-case font-normal">(optional)</span>
            </label>
            <textarea
              placeholder="e.g. Extra hot pepper sauce, call on arrival, gate code is 1234…"
              value={note}
              onChange={(e) => setNoteLocal(e.target.value)}
              rows={2}
              disabled={isFormLocked}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 disabled:opacity-60 resize-none transition-all"
            />
          </div>

          {/* Submit error */}
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-medium">
              ⚠️ {submitError}
            </div>
          )}

          {/* Pay button */}
          <button
            onClick={handlePlaceOrder}
            disabled={isFormLocked || !otpVerified}
            className="btn-crimson w-full py-4 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-red-600/30"
          >
            {step === 'submitting' ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span>Processing…</span>
              </>
            ) : (
              <>
                <span>💳</span>
                <span>Pay {quote ? formatNGN(quote.grandTotalKobo) : ''} via Flutterwave</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-slate-400 pb-2">
            Secured by Flutterwave. Your payment info is never stored on our servers.
          </p>
        </div>
      </div>
    </>
  );
}
