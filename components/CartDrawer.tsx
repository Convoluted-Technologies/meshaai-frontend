'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';

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
    formatNGN,
  } = useCart();

  const [isOtpMode, setIsOtpMode] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpDevHint, setOtpDevHint] = useState<string>('');

  if (!isCartOpen) return null;

  async function handleSendOTP() {
    if (!phone) return alert('Please enter phone number');
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        if (data.devOtp) setOtpDevHint(data.devOtp);
      } else {
        alert(data.detail || 'Failed to send OTP');
      }
    } catch (err) {
      alert('Network error sending OTP');
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
                placeholder="Street address or Area (e.g. Yaba)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-red-500"
              />
              <input
                type="text"
                placeholder="Landmark (e.g. Opposite Domino Pizza)"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Preset Quick Location Buttons */}
            <div className="flex gap-2 text-[11px] pt-1">
              <span className="text-slate-500">Quick zones:</span>
              <button
                type="button"
                onClick={() => {
                  setLat(6.5244);
                  setLng(3.3792);
                  setAddress('12 Commercial Avenue, Yaba');
                }}
                className="text-red-600 hover:underline font-semibold"
              >
                Yaba (Base)
              </button>
              <button
                type="button"
                onClick={() => {
                  setLat(6.6018);
                  setLng(3.3515);
                  setAddress('Allen Avenue, Ikeja');
                }}
                className="text-red-600 hover:underline font-semibold"
              >
                Ikeja
              </button>
            </div>
          </div>

          {/* Customer Phone Identity */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-amber-700 uppercase tracking-wider">
                📱 Customer Phone (Identity)
              </label>
              <button
                type="button"
                onClick={() => setIsOtpMode(!isOtpMode)}
                className="text-[11px] text-slate-500 hover:text-red-600 underline font-medium"
              >
                {isOtpMode ? 'Guest Checkout' : 'Login via OTP'}
              </button>
            </div>

            <input
              type="tel"
              placeholder="08012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-red-500 font-mono"
            />

            {isOtpMode && !otpSent && (
              <button
                type="button"
                onClick={handleSendOTP}
                className="w-full py-2 bg-white hover:bg-slate-100 text-red-600 text-xs font-bold rounded-lg border border-slate-300"
              >
                Send OTP Code
              </button>
            )}

            {isOtpMode && otpSent && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
                />
                {otpDevHint && (
                  <p className="text-[10px] text-amber-600 font-mono">
                    Dev test code: {otpDevHint} (or 123456)
                  </p>
                )}
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
                    <span className="font-mono text-slate-900 font-bold">{formatNGN(item.totalKobo)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 text-xs border-t border-slate-100 pt-2 text-slate-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatNGN(quote.subtotalKobo)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee ({quote.deliveryDistanceKm} km)</span>
                  <span className="font-mono">{formatNGN(quote.deliveryFeeKobo)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="font-extrabold text-slate-900 text-sm">Grand Total</span>
                <span className="font-black text-2xl text-amber-600 font-mono">
                  {formatNGN(quote.grandTotalKobo)}
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
              <span>Preparing Checkout...</span>
            ) : (
              <>
                <span>💳 Pay {quote ? formatNGN(quote.grandTotalKobo) : ''} via Flutterwave</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
