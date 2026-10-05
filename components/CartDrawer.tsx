'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { requestPhoneOtp, verifyPhoneOtp } from '@/lib/api/auth';
import { APIError } from '@/lib/api/backendClient';

export default function CartDrawer() {
  const {
    isCartOpen,
    setIsCartOpen,
    quote,
    quoteError,
    address,
    landmark,
    setAddress,
    setLandmark,
    lat,
    lng,
    setLat,
    setLng,
    phone,
    setPhone,
    note,
    setNote,
    handleCreateOrderAndPay,
    isSubmitting,
    selectedCurrency,
    formatPrice,
  } = useCart();

  const [isOtpMode, setIsOtpMode] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpLoading, setOtpLoading] = useState<boolean>(false);
  const [otpDevHint, setOtpDevHint] = useState<string>('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string>('');
  const [authErrorMsg, setAuthErrorMsg] = useState<string>('');

  if (!isCartOpen) return null;

  async function handleSendOTP() {
    if (!phone) {
      setAuthErrorMsg('Please enter a valid phone number including country code.');
      return;
    }
    setOtpLoading(true);
    setAuthErrorMsg('');
    setAuthSuccessMsg('');
    try {
      const res = await requestPhoneOtp(phone);
      setOtpSent(true);
      setAuthSuccessMsg('Verification code dispatched successfully.');
      if (res.devOtp) setOtpDevHint(res.devOtp);
    } catch (err: any) {
      if (err instanceof APIError && err.code) {
        if (err.code === 'INVALID_PHONE_NUMBER') {
          setAuthErrorMsg('Please enter a valid phone number including country code.');
        } else if (err.code === 'RATE_LIMIT_EXCEEDED') {
          setAuthErrorMsg('Too many requests. Please wait a moment before trying again.');
        } else if (err.code === 'CUSTOMER_BLOCKED') {
          setAuthErrorMsg('Your account has been restricted. Please contact Meshaai support.');
        } else {
          setAuthErrorMsg(err.message || 'Failed to dispatch verification code.');
        }
      } else {
        setAuthErrorMsg('Unable to send SMS at this moment. Please try again later.');
      }
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleVerifyOTP() {
    if (!otp || otp.length < 4) {
      setAuthErrorMsg('Please enter the 6-digit verification code.');
      return;
    }
    setOtpLoading(true);
    setAuthErrorMsg('');
    try {
      const data = await verifyPhoneOtp(phone, otp);
      setAuthSuccessMsg('Phone verified & authenticated!');
      setIsOtpMode(false);
    } catch (err: any) {
      if (err instanceof APIError && err.code) {
        if (err.code === 'INVALID_OTP') {
          setAuthErrorMsg('Incorrect verification code. Please check and try again.');
        } else if (err.code === 'OTP_EXPIRED') {
          setAuthErrorMsg('Verification code has expired. Please request a new code.');
        } else if (err.code === 'OTP_LOCKED') {
          setAuthErrorMsg('Too many failed attempts. Account temporarily locked for 15 minutes.');
        } else {
          setAuthErrorMsg(err.message || 'Invalid verification code.');
        }
      } else {
        setAuthErrorMsg('Verification failed. Please try again.');
      }
    } finally {
      setOtpLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop Blur */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 p-6 flex flex-col justify-between overflow-y-auto z-10 text-slate-900 animate-in slide-in-from-right duration-300">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛒</span>
              <h2 className="text-lg font-black text-slate-900">Your Food Cart</h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-sm transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Delivery Location & Landmark */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="text-xs font-extrabold text-amber-700 uppercase tracking-wider block">
              📍 Delivery Location & Landmark
            </label>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="Street address or Area (e.g. Plot 124 Wuse 2)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-base sm:text-xs bg-white border border-slate-300 rounded-lg px-3 py-2.5 sm:py-2 text-slate-900 focus:outline-none focus:border-red-500"
              />
              <input
                type="text"
                placeholder="Landmark (e.g. Opposite KFC Wuse 2)"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full text-base sm:text-xs bg-white border border-slate-300 rounded-lg px-3 py-2.5 sm:py-2 text-slate-900 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Quick Preset Location Coordinates */}
            <div className="flex gap-2 text-[11px] pt-1">
              <span className="text-slate-500">Quick zones:</span>
              <button
                type="button"
                onClick={() => {
                  setLat(9.0778);
                  setLng(7.4819);
                  setAddress('Plot 124 Aminu Kano Crescent, Wuse 2, Abuja');
                  setLandmark('Opposite KFC Wuse 2');
                }}
                className="text-red-600 hover:underline font-semibold"
              >
                Abuja Wuse 2
              </button>
              <button
                type="button"
                onClick={() => {
                  setLat(6.5244);
                  setLng(3.3792);
                  setAddress('12 Commercial Avenue, Yaba, Lagos');
                  setLandmark('Opposite Domino Pizza');
                }}
                className="text-red-600 hover:underline font-semibold"
              >
                Lagos Yaba
              </button>
            </div>
          </div>

          {/* Customer Phone Identity & Passwordless OTP */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-amber-700 uppercase tracking-wider">
                📱 Customer Phone (Identity)
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsOtpMode(!isOtpMode);
                  setAuthErrorMsg('');
                  setAuthSuccessMsg('');
                }}
                className="text-[11px] text-slate-500 hover:text-red-600 underline font-medium"
              >
                {isOtpMode ? 'Standard Mode' : 'Verify SMS OTP'}
              </button>
            </div>

            <input
              type="tel"
              placeholder="+2348039276495"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-red-500 font-mono"
            />

            {authErrorMsg && (
              <p className="text-xs text-red-600 font-semibold bg-red-50 p-2 rounded-lg border border-red-200">
                ⚠️ {authErrorMsg}
              </p>
            )}

            {authSuccessMsg && (
              <p className="text-xs text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                ✅ {authSuccessMsg}
              </p>
            )}

            {isOtpMode && !otpSent && (
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={otpLoading}
                className="w-full py-2 bg-white hover:bg-slate-100 text-red-600 text-xs font-bold rounded-lg border border-slate-300 shadow-xs"
              >
                {otpLoading ? 'Sending SMS Code...' : 'Send 6-Digit OTP SMS'}
              </button>
            )}

            {isOtpMode && otpSent && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value;
                    setOtp(val);
                    if (val.length === 6) {
                      setTimeout(handleVerifyOTP, 100);
                    }
                  }}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono text-center tracking-widest text-base font-bold"
                  maxLength={6}
                />
                {otpDevHint && (
                  <p className="text-[10px] text-amber-600 font-mono text-center">
                    Dev hint code: {otpDevHint}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={otpLoading}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-lg"
                  >
                    {otpLoading ? 'Verifying...' : 'Verify OTP Code'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={otpLoading}
                    className="px-3 py-2 bg-white text-slate-700 text-xs font-bold rounded-lg border border-slate-300"
                  >
                    Resend
                  </button>
                </div>
              </div>
            )}

            <input
              type="text"
              placeholder="Optional delivery note / pepper preference"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Line Items & Calculation */}
          {quoteError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-medium">
              ⚠️ {quoteError}
            </div>
          )}

          {!quote && !quoteError && (
            <div className="text-center py-10 space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <span className="text-4xl block animate-bounce">🍳</span>
              <p className="font-extrabold text-slate-800 text-sm">Your cart is currently empty</p>
              <p className="text-xs text-slate-500">
                Explore our Signature Specials Menu and select your favorite bread & egg meal combo!
              </p>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="mt-2 px-5 py-2.5 bg-white border border-slate-300 hover:border-red-500 text-red-600 font-bold text-xs rounded-xl transition-all shadow-xs"
              >
                Explore Specials Menu ↓
              </button>
            </div>
          )}

          {quote && (
            <div className="space-y-3 border-t border-slate-200 pt-4">
              <div className="space-y-2 text-xs text-slate-700">
                {quote.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {item.qty}× {item.presetName}
                    </span>
                    <span className="font-mono text-slate-900 font-bold">
                      {formatPrice(item.totalKobo, selectedCurrency)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 text-xs border-t border-slate-100 pt-2 text-slate-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatPrice(quote.subtotalKobo, selectedCurrency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee ({quote.deliveryDistanceKm} km)</span>
                  <span className="font-mono">{formatPrice(quote.deliveryFeeKobo, selectedCurrency)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="font-extrabold text-slate-900 text-sm">Grand Total</span>
                <span className="font-black text-2xl text-amber-600 font-mono">
                  {formatPrice(quote.grandTotalKobo, selectedCurrency)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Checkout Button */}
        <div className="pt-6 border-t border-slate-200">
          <button
            onClick={handleCreateOrderAndPay}
            disabled={isSubmitting || !quote || !!quoteError}
            className="btn-crimson w-full py-4 font-black rounded-xl text-base uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-red-600/30"
          >
            {isSubmitting ? (
              <span>Preparing Order...</span>
            ) : (
              <>
                <span>💳 Pay {quote ? formatPrice(quote.grandTotalKobo, selectedCurrency) : ''} via Flutterwave</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
