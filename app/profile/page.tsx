'use client';

import { useState, useEffect } from 'react';
import { CustomerUser, Order } from '@/lib/types';
import Link from 'next/link';

export default function ProfilePage() {
  const [phone, setPhone] = useState('08012345678');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSendOTP() {
    if (!phone) return alert('Enter phone number');
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        if (data.devOtp) setOtp(data.devOtp);
      } else {
        alert(data.detail || 'Failed to send OTP');
      }
    } catch (err) {
      alert('Error requesting OTP');
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (res.ok && data.customer) {
        setCustomer(data.customer);
        fetchCustomerOrders(phone);
      } else {
        alert(data.detail || 'Invalid OTP code');
      }
    } catch (err) {
      alert('Error verifying OTP');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCustomerOrders(customerPhone: string) {
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (data.orders) {
        const clean = customerPhone.replace(/[^0-9]/g, '');
        const myOrders = data.orders.filter(
          (o: Order) => o.phone.replace(/[^0-9]/g, '') === clean
        );
        setOrders(myOrders);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  }

  const formatNGN = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          👤 Customer Account Profile
        </h1>
        <p className="text-sm text-slate-400">
          View saved locations and past order history.
        </p>
      </div>

      {!customer ? (
        <div className="glass-panel max-w-md mx-auto p-6 space-y-4">
          <h2 className="text-lg font-bold text-white text-center">
            Sign In with Phone OTP
          </h2>

          {!otpSent ? (
            <div className="space-y-3">
              <input
                type="tel"
                placeholder="Phone Number (08012345678)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-sm bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 font-mono"
              />
              <button
                onClick={handleSendOTP}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm"
              >
                Send Verification OTP
              </button>
            </div>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-3">
              <input
                type="text"
                placeholder="Enter OTP (e.g. 123456)"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full text-sm bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 font-mono"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm"
              >
                {loading ? 'Verifying...' : 'Verify OTP & Access Profile'}
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="glass-panel p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">{customer.name}</h2>
              <p className="text-sm font-mono text-amber-400">{customer.phone}</p>
              <p className="text-xs text-slate-400">Member since {new Date(customer.createdAt).toLocaleDateString()}</p>
            </div>

            <button
              onClick={() => setCustomer(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700"
            >
              Sign Out
            </button>
          </div>

          {/* Past Orders */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📦 Past Orders</span>
              <span className="text-xs bg-slate-800 text-amber-400 px-2.5 py-0.5 rounded-full font-mono">
                {orders.length} orders
              </span>
            </h3>

            {orders.length === 0 ? (
              <p className="text-xs text-slate-400 italic glass-panel p-4 text-center">
                No previous orders found for this phone number.
              </p>
            ) : (
              <div className="space-y-3">
                {orders.map((o) => (
                  <div key={o.id} className="glass-panel p-4 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-amber-400 font-mono text-sm block">
                        #{o.code}
                      </span>
                      <span className="text-slate-300">
                        {o.items.map((i) => `${i.qty}× ${i.presetName}`).join(', ')}
                      </span>
                      <span className="block text-slate-500 text-[10px] mt-0.5">
                        {new Date(o.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="font-mono font-bold text-white text-sm block">
                        {formatNGN(o.totalKobo)}
                      </span>
                      <Link
                        href={`/track?code=${o.code}&phone=${encodeURIComponent(o.phone)}`}
                        className="inline-block text-[11px] text-amber-400 hover:underline font-semibold"
                      >
                        Track Status →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
