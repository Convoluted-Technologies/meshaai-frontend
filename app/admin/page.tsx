'use client';

import { useState, useEffect } from 'react';
import {
  Order,
  OrderStatus,
  PresetMeal,
  PresetVersionHistory,
  PaymentRecord,
  SystemSettings,
} from '@/lib/types';

export default function AdminStudioPage() {
  // Auth state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [adminUser, setAdminUser] = useState<any>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'orders' | 'catalog' | 'payments' | 'customers' | 'settings' | 'dashboard'
  >('orders');

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Rider Modal
  const [riderName, setRiderName] = useState('Tunde Bako');
  const [riderPhone, setRiderPhone] = useState('08099887766');

  // Catalog State
  const [presets, setPresets] = useState<PresetMeal[]>([]);
  const [versions, setVersions] = useState<PresetVersionHistory[]>([]);
  const [editingPreset, setEditingPreset] = useState<Partial<PresetMeal> | null>(null);

  // Payments State
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  // Customers State
  const [customers, setCustomers] = useState<any[]>([]);

  // Settings State
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Metrics State
  const [metrics, setMetrics] = useState<any>(null);

  // Auto-SSE Event Listener
  useEffect(() => {
    if (!isAdminLoggedIn) return;

    fetchData();

    // Subscribe to SSE events
    const eventSource = new EventSource('/api/admin/events');
    eventSource.addEventListener('NEW_ORDER', (e) => {
      fetchOrders();
      fetchDashboard();
    });
    eventSource.addEventListener('ORDER_UPDATED', (e) => {
      fetchOrders();
      fetchDashboard();
    });
    eventSource.addEventListener('ORDER_PAID', (e) => {
      fetchOrders();
      fetchDashboard();
    });

    return () => {
      eventSource.close();
    };
  }, [isAdminLoggedIn]);

  function fetchData() {
    fetchOrders();
    fetchCatalog();
    fetchPayments();
    fetchCustomers();
    fetchSettings();
    fetchDashboard();
  }

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setAdminUser(data.user);
        setIsAdminLoggedIn(true);
      } else {
        alert(data.detail || 'Invalid admin credentials');
      }
    } catch (err) {
      alert('Login error');
    }
  }

  async function fetchOrders() {
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchCatalog() {
    try {
      const res = await fetch('/api/admin/catalog');
      const data = await res.json();
      if (data.presets) setPresets(data.presets);
      if (data.versions) setVersions(data.versions);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchPayments() {
    try {
      const res = await fetch('/api/admin/payments');
      const data = await res.json();
      if (data.payments) setPayments(data.payments);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchCustomers() {
    try {
      const res = await fetch('/api/admin/customers');
      const data = await res.json();
      if (data.customers) setCustomers(data.customers);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchSettings() {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchDashboard() {
    try {
      const res = await fetch('/api/admin/dashboard');
      const data = await res.json();
      if (data.metrics) setMetrics(data.metrics);
    } catch (err) {
      console.error(err);
    }
  }

  // --- ACTIONS ---

  async function handleUpdateOrderStatus(orderId: string, status: OrderStatus) {
    const reason = prompt(`Enter reason for transitioning order to ${status}:`, `Admin updated status to ${status}`);
    if (reason === null) return;

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchOrders();
        fetchDashboard();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(data.order);
        }
      } else {
        alert(data.detail || 'Status transition failed');
      }
    } catch (err) {
      alert('Error updating status');
    }
  }

  async function handleAssignRider(orderId: string) {
    if (!riderName || !riderPhone) return alert('Provide rider name & phone');
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/assign-rider`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riderName, riderPhone }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchOrders();
        alert(`Rider assigned to order!`);
        setSelectedOrder(data.order);
      } else {
        alert(data.detail || 'Assign rider failed');
      }
    } catch (err) {
      alert('Error assigning rider');
    }
  }

  async function handleSavePreset(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPreset) return;
    try {
      const res = await fetch('/api/admin/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPreset),
      });
      const data = await res.json();
      if (res.ok) {
        fetchCatalog();
        setEditingPreset(null);
        alert('Preset saved successfully!');
      } else {
        alert(data.detail || 'Failed to save preset');
      }
    } catch (err) {
      alert('Error saving preset');
    }
  }

  async function handleTogglePreset(id: string, current: boolean) {
    try {
      const res = await fetch('/api/admin/catalog', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isAvailable: !current }),
      });
      if (res.ok) fetchCatalog();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRollbackCatalog(versionId: string) {
    if (!confirm(`Are you sure you want to rollback catalog to version ${versionId}?`)) return;
    try {
      const res = await fetch('/api/admin/catalog/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId }),
      });
      if (res.ok) {
        fetchCatalog();
        alert('Catalog rolled back successfully!');
      } else {
        alert('Rollback failed');
      }
    } catch (err) {
      alert('Rollback error');
    }
  }

  async function handleRefundOrder(orderId: string) {
    const amountStr = prompt('Enter refund amount in Kobo (leave blank for full refund):');
    const reason = prompt('Reason for refund:', 'Admin customer resolution');
    if (reason === null) return;

    try {
      const res = await fetch(`/api/admin/payments/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountKobo: amountStr ? Number(amountStr) : undefined,
          reason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchOrders();
        fetchPayments();
        fetchDashboard();
        alert('Refund processed successfully!');
      } else {
        alert(data.detail || 'Refund failed');
      }
    } catch (err) {
      alert('Error executing refund');
    }
  }

  async function handleBlockCustomer(phone: string, isBlocked: boolean) {
    try {
      const res = await fetch(`/api/admin/customers/${encodeURIComponent(phone)}/block`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block: !isBlocked }),
      });
      if (res.ok) fetchCustomers();
    } catch (err) {
      alert('Error blocking customer');
    }
  }

  async function handleToggleKillSwitch() {
    if (!settings) return;
    const nextPaused = !settings.isOrderingPaused;
    if (
      !confirm(
        nextPaused
          ? 'WARNING: This will PAUSE all customer order placements across the system. Continue?'
          : 'Resume customer ordering?'
      )
    )
      return;

    const updated = { ...settings, isOrderingPaused: nextPaused };
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        setSettings(updated);
        alert(nextPaused ? 'Ordering PAUSED (Kill-Switch Active)' : 'Ordering RESUMED');
      }
    } catch (err) {
      alert('Error saving kill-switch');
    }
  }

  const formatNGN = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        o.code.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        o.location.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-12">
        <div className="glass-panel p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center text-2xl mx-auto border border-amber-500/30">
              🔑
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Studio Login</h1>
            <p className="text-xs text-slate-400">
              Access live order queue, rider dispatch, catalog manager, and store settings.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-xs text-slate-300 block mb-1 font-medium">Username or Email</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full text-sm bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 block mb-1 font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md shadow-amber-500/20"
            >
              Sign In to Operator Console
            </button>
          </form>

          <p className="text-[11px] text-center text-slate-500">
            Default credentials: <code className="text-amber-400 font-mono">admin / admin123</code> or <code className="text-amber-400 font-mono">operator / ops123</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Admin Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 sm:p-6 border-amber-500/20">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white">⚙️ Admin Studio Operator Console</h1>
            <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full font-mono font-bold border border-amber-500/30">
              {adminUser?.role || 'SUPER_ADMIN'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time SSE order alerts • Hot-reloaded JSON catalog • Flutterwave reconciliation
          </p>
        </div>

        {/* Kill switch & user indicator */}
        <div className="flex items-center gap-3">
          {settings && (
            <button
              onClick={handleToggleKillSwitch}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all border ${
                settings.isOrderingPaused
                  ? 'bg-red-500 text-slate-950 border-red-400 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
            >
              {settings.isOrderingPaused ? '⛔ ORDERING PAUSED (KILL SWITCH)' : '✅ ORDERING ACTIVE'}
            </button>
          )}
          <button
            onClick={() => setIsAdminLoggedIn(false)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {[
          { id: 'orders', label: `📦 Live Orders (${orders.length})` },
          { id: 'catalog', label: `🍔 Catalog & Rollback` },
          { id: 'payments', label: `💳 Transactions & Refunds` },
          { id: 'customers', label: `👥 Customers & Blocklist` },
          { id: 'settings', label: `⚙️ Store Settings` },
          { id: 'dashboard', label: `📊 Analytics Dashboard` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: LIVE ORDERS QUEUE */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Status Filter Buttons */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              {['ALL', 'PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'].map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      statusFilter === st
                        ? 'bg-slate-700 text-amber-400 border border-amber-500/40'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                )
              )}
            </div>

            <input
              type="text"
              placeholder="Search code, phone, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 w-full sm:w-64 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Orders Table List */}
            <div className="lg:col-span-8 glass-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">Order Code</th>
                      <th className="p-3">Customer Phone</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Rider</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 italic font-sans">
                          No orders match the current filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => (
                        <tr
                          key={o.id}
                          onClick={() => setSelectedOrder(o)}
                          className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                            selectedOrder?.id === o.id ? 'bg-amber-500/10' : ''
                          }`}
                        >
                          <td className="p-3 font-bold text-amber-400">#{o.code}</td>
                          <td className="p-3 text-slate-200">{o.phone}</td>
                          <td className="p-3 text-slate-100 font-bold">{formatNGN(o.totalKobo)}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                o.status === 'DELIVERED'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : o.status === 'PAID'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : o.status === 'CANCELLED' || o.status === 'REFUNDED'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {o.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300">{o.rider?.name || '—'}</td>
                          <td className="p-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(o);
                              }}
                              className="text-amber-400 hover:underline font-sans text-[11px]"
                            >
                              Manage →
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Order Drawer & State Machine Operator */}
            <div className="lg:col-span-4">
              {selectedOrder ? (
                <div className="glass-panel p-5 space-y-6 sticky top-20">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="font-extrabold text-amber-400 text-lg font-mono">
                        #{selectedOrder.code}
                      </h3>
                      <p className="text-[11px] text-slate-400">{selectedOrder.phone}</p>
                    </div>
                    <span className="text-xs bg-slate-800 text-slate-200 px-2.5 py-1 rounded font-bold">
                      {selectedOrder.status}
                    </span>
                  </div>

                  {/* Delivery Info */}
                  <div className="space-y-1 text-xs text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <p className="font-semibold text-slate-100">{selectedOrder.location.address}</p>
                    <p className="text-slate-400">Landmark: {selectedOrder.location.landmark}</p>
                    {selectedOrder.note && <p className="text-amber-400 italic">Note: "{selectedOrder.note}"</p>}
                  </div>

                  {/* Rider Assignment Box */}
                  <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Assign Dispatch Rider
                    </h4>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Rider Name"
                        value={riderName}
                        onChange={(e) => setRiderName(e.target.value)}
                        className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                      />
                      <input
                        type="tel"
                        placeholder="Rider Phone"
                        value={riderPhone}
                        onChange={(e) => setRiderPhone(e.target.value)}
                        className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                      />
                      <button
                        onClick={() => handleAssignRider(selectedOrder.id)}
                        className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold rounded-lg border border-slate-700"
                      >
                        Assign / Update Rider
                      </button>
                    </div>
                  </div>

                  {/* State Machine Transition Buttons */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Force State Transition
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'FAILED_DELIVERY'].map(
                        (st) => (
                          <button
                            key={st}
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, st as OrderStatus)}
                            className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-lg border border-slate-700 transition-colors"
                          >
                            → {st}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Refund Trigger */}
                  <button
                    onClick={() => handleRefundOrder(selectedOrder.id)}
                    className="w-full py-2 bg-red-950/80 hover:bg-red-900 text-red-300 font-semibold text-xs rounded-xl border border-red-800"
                  >
                    💳 Trigger Flutterwave Refund
                  </button>
                </div>
              ) : (
                <div className="glass-panel p-8 text-center text-slate-500 text-xs italic">
                  Select an order from the list to view rider details, audit history, and state transitions.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CATALOG MANAGER & ROLLBACK */}
      {activeTab === 'catalog' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">🍔 Meal Presets JSON Catalog</h2>
            <button
              onClick={() =>
                setEditingPreset({
                  name: '',
                  description: '',
                  components: ['1 Loaf Fresh Bread', '2 Fried Eggs'],
                  priceKobo: 150000,
                  imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80',
                  isAvailable: true,
                })
              }
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20"
            >
              + Create New Preset
            </button>
          </div>

          {/* Preset Create/Edit Form Modal */}
          {editingPreset && (
            <form onSubmit={handleSavePreset} className="glass-panel p-6 space-y-4 border-amber-500/40">
              <h3 className="font-bold text-white text-base">
                {editingPreset.id ? 'Edit Preset' : 'Create Preset'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Preset Name"
                  value={editingPreset.name || ''}
                  onChange={(e) => setEditingPreset({ ...editingPreset, name: e.target.value })}
                  className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
                <input
                  type="number"
                  placeholder="Price in Kobo (e.g. 150000 = ₦1,500)"
                  value={editingPreset.priceKobo || 0}
                  onChange={(e) => setEditingPreset({ ...editingPreset, priceKobo: Number(e.target.value) })}
                  className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                />
              </div>

              <textarea
                placeholder="Description"
                value={editingPreset.description || ''}
                onChange={(e) => setEditingPreset({ ...editingPreset, description: e.target.value })}
                className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 h-16"
              />

              <input
                type="text"
                placeholder="Components (comma separated)"
                value={editingPreset.components?.join(', ') || ''}
                onChange={(e) =>
                  setEditingPreset({
                    ...editingPreset,
                    components: e.target.value.split(',').map((s) => s.trim()),
                  })
                }
                className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl"
                >
                  Save Preset
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPreset(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Preset List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {presets.map((preset) => (
              <div key={preset.id} className="glass-panel p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm">{preset.name}</h3>
                  <span className="font-mono font-bold text-amber-400 text-sm">{formatNGN(preset.priceKobo)}</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{preset.description}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleTogglePreset(preset.id, preset.isAvailable)}
                    className={`px-3 py-1 rounded text-xs font-bold ${
                      preset.isAvailable
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {preset.isAvailable ? 'Available' : 'Sold Out'}
                  </button>
                  <button
                    onClick={() => setEditingPreset(preset)}
                    className="text-xs text-amber-400 hover:underline"
                  >
                    Edit →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Catalog Version History & Rollback */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
              📜 Catalog Version Rollback History
            </h3>
            <div className="space-y-2 text-xs">
              {versions.length === 0 ? (
                <p className="text-slate-500 italic">No version history snapshots recorded yet.</p>
              ) : (
                versions.map((ver) => (
                  <div key={ver.versionId} className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="font-mono text-slate-200 font-bold block">{ver.versionId}</span>
                      <span className="text-slate-400">{ver.changeReason} • by {ver.changedBy}</span>
                      <span className="block text-[10px] text-slate-500">{new Date(ver.timestamp).toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => handleRollbackCatalog(ver.versionId)}
                      className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded-lg border border-amber-500/30"
                    >
                      ↺ Rollback to this Version
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSACTIONS & REFUNDS */}
      {activeTab === 'payments' && (
        <div className="glass-panel overflow-hidden">
          <div className="p-4 bg-slate-900/80 border-b border-slate-800 font-bold text-sm text-white">
            💳 Flutterwave Payment Transactions & Refunds
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">TxRef</th>
                  <th className="p-3">Order Code</th>
                  <th className="p-3">Customer Phone</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="p-3 text-slate-200 text-[11px]">{p.txRef}</td>
                    <td className="p-3 font-bold text-amber-400">#{p.orderCode}</td>
                    <td className="p-3 text-slate-300">{p.customerPhone}</td>
                    <td className="p-3 font-bold text-slate-100">{formatNGN(p.amountKobo)}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.status === 'SUCCESSFUL'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : p.status === 'REFUNDED'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 text-[10px]">
                      {new Date(p.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleRefundOrder(p.orderCode)}
                        className="text-red-400 hover:underline font-sans"
                      >
                        Refund →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CUSTOMERS & BLOCKLIST */}
      {activeTab === 'customers' && (
        <div className="glass-panel overflow-hidden">
          <div className="p-4 bg-slate-900/80 border-b border-slate-800 font-bold text-sm text-white flex justify-between items-center">
            <span>👥 Customer Database & Abusive Phone Restriction</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Orders Count</th>
                  <th className="p-3">Total Spent</th>
                  <th className="p-3">Restriction Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-sans font-bold text-white">{c.name}</td>
                    <td className="p-3 text-slate-300">{c.phone}</td>
                    <td className="p-3 text-amber-400 font-bold">{c.orderCount}</td>
                    <td className="p-3 text-slate-100 font-bold">{formatNGN(c.totalSpentKobo)}</td>
                    <td className="p-3">
                      {c.isBlocked ? (
                        <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold">
                          BLOCKED
                        </span>
                      ) : (
                        <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleBlockCustomer(c.phone, c.isBlocked)}
                        className={`font-sans text-xs font-bold px-3 py-1 rounded-lg ${
                          c.isBlocked
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {c.isBlocked ? 'Unblock Phone' : 'Block Phone'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: STORE SETTINGS & KILL-SWITCH */}
      {activeTab === 'settings' && settings && (
        <div className="glass-panel p-6 space-y-6 max-w-2xl mx-auto">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
            ⚙️ System Operations & Delivery Zone Settings
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Shop Name</label>
              <input
                type="text"
                value={settings.shopName}
                onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Opening Time</label>
                <input
                  type="text"
                  value={settings.operatingHours.open}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      operatingHours: { ...settings.operatingHours, open: e.target.value },
                    })
                  }
                  className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Closing Time</label>
                <input
                  type="text"
                  value={settings.operatingHours.close}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      operatingHours: { ...settings.operatingHours, close: e.target.value },
                    })
                  }
                  className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Delivery Max Radius (KM)
                </label>
                <input
                  type="number"
                  value={settings.deliveryZone.maxRadiusKm}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      deliveryZone: {
                        ...settings.deliveryZone,
                        maxRadiusKm: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Flat Delivery Fee (Kobo)
                </label>
                <input
                  type="number"
                  value={settings.deliveryFee.flatFeeKobo}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      deliveryFee: {
                        ...settings.deliveryFee,
                        flatFeeKobo: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                />
              </div>
            </div>

            <button
              onClick={async () => {
                const res = await fetch('/api/admin/settings', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(settings),
                });
                if (res.ok) alert('Settings saved successfully!');
              }}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
            >
              Save Store Operations Config
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: DASHBOARD METRICS */}
      {activeTab === 'dashboard' && metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 space-y-1">
            <span className="text-xs text-slate-400 block font-semibold uppercase">Total Revenue</span>
            <span className="text-2xl font-black text-amber-400 font-mono">
              {formatNGN(metrics.totalRevenueKobo)}
            </span>
          </div>

          <div className="glass-panel p-5 space-y-1">
            <span className="text-xs text-slate-400 block font-semibold uppercase">Today's Revenue</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {formatNGN(metrics.todayRevenueKobo)}
            </span>
          </div>

          <div className="glass-panel p-5 space-y-1">
            <span className="text-xs text-slate-400 block font-semibold uppercase">Total Orders</span>
            <span className="text-2xl font-black text-white font-mono">
              {metrics.totalOrdersCount}
            </span>
          </div>

          <div className="glass-panel p-5 space-y-1">
            <span className="text-xs text-slate-400 block font-semibold uppercase">Delivered Meals</span>
            <span className="text-2xl font-black text-blue-400 font-mono">
              {metrics.countsByStatus.DELIVERED}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
