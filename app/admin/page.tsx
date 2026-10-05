'use client';

import { useState, useEffect } from 'react';
import {
  Order,
  OrderStatus,
  PresetMeal,
} from '@/lib/types';

export default function AdminStudioPage() {
  // Auth state - Default username: AdminLogin, Password: Admin@2026
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [username, setUsername] = useState('AdminLogin');
  const [password, setPassword] = useState('Admin@2026');
  const [adminUser, setAdminUser] = useState<any>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'orders' | 'catalog' | 'delivered' | 'settings'
  >('orders');

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Rider Modal
  const [assigningRiderOrder, setAssigningRiderOrder] = useState<Order | null>(null);
  const [riderName, setRiderName] = useState('Tunde Bako');
  const [riderPhone, setRiderPhone] = useState('08099887766');

  // Product / Catalog State
  const [presets, setPresets] = useState<PresetMeal[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Partial<PresetMeal> | null>(null);

  // Product Form State
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productPriceNgn, setProductPriceNgn] = useState('');
  const [productImage, setProductImage] = useState('');
  const [productComponents, setProductComponents] = useState('');
  const [productAvailable, setProductAvailable] = useState(true);

  // Settings State
  const [isOrderingPaused, setIsOrderingPaused] = useState(false);

  // Fetch initial data on login
  useEffect(() => {
    if (!isAdminLoggedIn) return;

    fetchData();

    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [isAdminLoggedIn]);

  function fetchData() {
    fetchOrders();
    fetchCatalog();
    fetchSettings();
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
        alert(data.detail || 'Invalid credentials. Please use AdminLogin / Admin@2026');
      }
    } catch (err) {
      alert('Login network error');
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
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchSettings() {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.settings) {
        setIsOrderingPaused(data.settings.isOrderingPaused ?? false);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // --- ORDER STATUS LIFECYCLE ---
  async function updateOrderStatus(orderId: string, newStatus: OrderStatus, reason?: string) {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason: reason || `Updated to ${newStatus} by Admin` }),
      });
      if (res.ok) {
        fetchOrders();
      } else {
        const data = await res.json();
        alert(data.detail || 'Failed to update order status');
      }
    } catch (err) {
      alert('Network error updating order status');
    }
  }

  async function handleAssignRider(e: React.FormEvent) {
    e.preventDefault();
    if (!assigningRiderOrder) return;

    try {
      const res = await fetch(`/api/admin/orders/${assigningRiderOrder.id}/assign-rider`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riderName, riderPhone }),
      });
      if (res.ok) {
        await updateOrderStatus(assigningRiderOrder.id, 'OUT_FOR_DELIVERY', `Rider ${riderName} assigned`);
        setAssigningRiderOrder(null);
      } else {
        alert('Failed to assign rider');
      }
    } catch (err) {
      alert('Error assigning rider');
    }
  }

  // --- PRODUCT CRUD HANDLERS ---
  function openAddProductModal() {
    setEditingPreset(null);
    setProductName('');
    setProductDesc('');
    setProductPriceNgn('');
    setProductImage('');
    setProductComponents('Artisan Bread, Farm Eggs');
    setProductAvailable(true);
    setIsProductModalOpen(true);
  }

  function openEditProductModal(preset: PresetMeal) {
    setEditingPreset(preset);
    setProductName(preset.name);
    setProductDesc(preset.description);
    setProductPriceNgn((preset.priceKobo / 100).toString());
    setProductImage(preset.imageUrl);
    setProductComponents(preset.components.join(', '));
    setProductAvailable(preset.isAvailable);
    setIsProductModalOpen(true);
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!productName || !productPriceNgn) {
      alert('Please fill in product name and price.');
      return;
    }

    const priceKobo = Math.round(parseFloat(productPriceNgn) * 100);

    try {
      const res = await fetch('/api/admin/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editingPreset ? { id: editingPreset.id } : {}),
          name: productName,
          description: productDesc,
          priceKobo,
          imageUrl: productImage,
          components: productComponents.split(',').map((c) => c.trim()).filter(Boolean),
          isAvailable: productAvailable,
        }),
      });

      if (res.ok) {
        setIsProductModalOpen(false);
        fetchCatalog();
      } else {
        const data = await res.json();
        alert(data.detail || 'Failed to save product');
      }
    } catch (err) {
      alert('Error saving product');
    }
  }

  async function handleDeleteProduct(presetId: string, presetName: string) {
    if (!confirm(`Are you sure you want to delete product "${presetName}"?`)) return;

    try {
      const res = await fetch(`/api/admin/catalog?id=${presetId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchCatalog();
      } else {
        alert('Failed to delete product');
      }
    } catch (err) {
      alert('Error deleting product');
    }
  }

  async function handleToggleAvailability(preset: PresetMeal) {
    try {
      const res = await fetch('/api/admin/catalog', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: preset.id,
          isAvailable: !preset.isAvailable,
        }),
      });
      if (res.ok) {
        fetchCatalog();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleToggleOrderingPause() {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isOrderingPaused: !isOrderingPaused,
          pauseReason: !isOrderingPaused ? 'Admin pause' : '',
        }),
      });
      if (res.ok) {
        setIsOrderingPaused(!isOrderingPaused);
      }
    } catch (err) {
      alert('Failed to toggle ordering pause');
    }
  }

  const formatNGN = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        o.code.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q) ||
        o.location.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED');
  const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + o.totalKobo, 0);

  // --- LOGIN SCREEN ---
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6 text-black animate-fade-in">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-tr from-red-600 via-amber-500 to-orange-500 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-xl shadow-red-600/30">
              🔑
            </div>
            <h1 className="text-2xl font-black tracking-wider uppercase">MESHA-AI ADMIN</h1>
            <p className="text-xs text-slate-400">Operator Console & Order Management Studio</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Admin Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-red-500"
                placeholder="AdminLogin"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-red-500"
                placeholder="Admin@2026"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-crimson w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-red-600/30"
            >
              Sign In to Operator Console →
            </button>
          </form>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-amber-400 font-mono text-center">
            Credentials: <b>AdminLogin</b> / <b>Admin@2026</b>
          </div>
        </div>
      </div>
    );
  }

  // --- ADMIN MAIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header Bar */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔑</span>
            <span className="font-black text-lg tracking-wider uppercase">MESHA-AI OPERATOR STUDIO</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleToggleOrderingPause}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${isOrderingPaused
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-emerald-950 text-emerald-400 border border-emerald-600/40'
                }`}
            >
              <span>{isOrderingPaused ? '🔴 Kitchen Paused' : '🟢 Kitchen Active'}</span>
            </button>

            <button
              onClick={() => setIsAdminLoggedIn(false)}
              className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700"
            >
              Logout 🚪
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'orders'
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
          >
            🚚 Live Orders ({orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length})
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'catalog'
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
          >
            📦 Products & Menu ({presets.length})
          </button>

          <button
            onClick={() => setActiveTab('delivered')}
            className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'delivered'
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
          >
            ✅ Delivered Tracker ({deliveredOrders.length})
          </button>
        </div>

        {/* TAB 1: LIVE ORDERS QUEUE */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex flex-wrap gap-2">
                {['ALL', 'PENDING_PAYMENT', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${statusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Search order code, phone, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrders.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200">
                  <span className="text-4xl block">🍳</span>
                  <p className="font-bold text-slate-700 mt-2">No active orders matching query</p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-md p-5 flex flex-col justify-between space-y-4 hover:border-red-300 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono font-black text-slate-900 text-base">#{order.code}</span>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {new Date(order.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${order.status === 'CONFIRMED'
                            ? 'bg-blue-100 text-blue-700'
                            : order.status === 'PREPARING'
                              ? 'bg-amber-100 text-amber-700'
                              : order.status === 'OUT_FOR_DELIVERY'
                                ? 'bg-purple-100 text-purple-700'
                                : order.status === 'DELIVERED'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-100 text-slate-700'
                            }`}
                        >
                          {order.status}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-xs">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between font-medium text-slate-800">
                            <span>
                              {it.qty}× {it.presetName}
                            </span>
                            <span className="font-mono">{formatNGN(it.totalKobo)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Address & Phone */}
                      <div className="text-xs space-y-1 text-slate-600">
                        <p>
                          📍 <span className="font-semibold text-slate-900">{order.location.address}</span>
                        </p>
                        <p>📱 <span className="font-mono font-bold text-slate-900">{order.phone}</span></p>
                      </div>

                      <div className="flex justify-between items-center border-t border-slate-100 pt-2 font-mono">
                        <span className="text-xs text-slate-500">Total</span>
                        <span className="font-black text-slate-900 text-base">{formatNGN(order.totalKobo)}</span>
                      </div>
                    </div>

                    {/* Order Status Action Controls */}
                    <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-2">
                      {order.status === 'PENDING_PAYMENT' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'CONFIRMED', 'Manual confirmation by Admin')}
                          className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                        >
                          Confirm Order
                        </button>
                      )}

                      {(order.status === 'CONFIRMED' || order.status === 'PENDING_PAYMENT') && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                          className="flex-1 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-extrabold hover:bg-amber-400"
                        >
                          Start Cooking 🍳
                        </button>
                      )}

                      {order.status === 'PREPARING' && (
                        <button
                          onClick={() => setAssigningRiderOrder(order)}
                          className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700"
                        >
                          Dispatch Rider 🛵
                        </button>
                      )}

                      {order.status === 'OUT_FOR_DELIVERY' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'DELIVERED', 'Delivered to customer')}
                          className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 shadow-md"
                        >
                          Mark as Delivered ✅
                        </button>
                      )}

                      <button
                        onClick={() => updateOrderStatus(order.id, 'CANCELLED', 'Cancelled by operator')}
                        className="px-3 py-2 bg-slate-100 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50"
                      >
                        Cancel ❌
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS & MENU CRUD */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-xl font-black text-slate-900">Product & Menu Catalog</h2>
                <p className="text-xs text-slate-500">Create, edit, toggle availability, or delete gourmet preset meals</p>
              </div>

              <button
                onClick={openAddProductModal}
                className="btn-crimson px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md"
              >
                <span>➕ Add New Product</span>
              </button>
            </div>

            {/* Products Table / Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-48 w-full bg-slate-100">
                      <img
                        src={preset.imageUrl}
                        alt={preset.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80';
                        }}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 bg-white/95 px-3 py-1 rounded-xl font-mono font-black text-amber-600 text-sm shadow-md">
                        {formatNGN(preset.priceKobo)}
                      </div>
                    </div>

                    <div className="p-5 space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-extrabold text-slate-900 text-base">{preset.name}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${preset.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                            }`}
                        >
                          {preset.isAvailable ? 'Available' : 'Sold Out'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{preset.description}</p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {preset.components.map((c, i) => (
                          <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-5 pt-0 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => handleToggleAvailability(preset)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold"
                    >
                      {preset.isAvailable ? 'Set Sold Out' : 'Set Available'}
                    </button>
                    <button
                      onClick={() => openEditProductModal(preset)}
                      className="px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(preset.id, preset.name)}
                      className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DELIVERED TRACKER */}
        {activeTab === 'delivered' && (
          <div className="space-y-6">
            {/* Delivered Metrics Header */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Delivered Meals</span>
                <span className="text-3xl font-black text-slate-900 font-mono">{deliveredOrders.length}</span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Delivered Revenue</span>
                <span className="text-3xl font-black text-emerald-600 font-mono">{formatNGN(deliveredRevenue)}</span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Delivery Status</span>
                <span className="text-3xl font-black text-purple-600 font-mono">100% Tracked</span>
              </div>
            </div>

            {/* Delivered Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 font-black text-slate-900 text-sm">
                Completed & Delivered Orders Log
              </div>

              <div className="divide-y divide-slate-100">
                {deliveredOrders.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No delivered orders logged yet. Mark active orders as delivered in the Live Orders tab!
                  </div>
                ) : (
                  deliveredOrders.map((o) => (
                    <div key={o.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">#{o.code}</span>
                          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                            DELIVERED
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">📍 {o.location.address}</p>
                        <p className="text-[11px] text-slate-400 font-mono">Customer: {o.phone}</p>
                      </div>

                      <div className="text-right font-mono">
                        <span className="font-black text-slate-900 text-base block">{formatNGN(o.totalKobo)}</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(o.updatedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD / EDIT PRODUCT */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl border border-slate-200 animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-lg text-slate-900">
                {editingPreset ? '✏️ Edit Meal Product' : '➕ Add New Product'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Bread + 2 Eggs + Beef Sausage"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Price in ₦ NGN
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={productPriceNgn}
                  onChange={(e) => setProductPriceNgn(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Description
                </label>
                <textarea
                  value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)}
                  placeholder="Gourmet description of ingredients..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                  rows={2}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Components (Comma Separated)
                </label>
                <input
                  type="text"
                  value={productComponents}
                  onChange={(e) => setProductComponents(e.target.value)}
                  placeholder="Artisan Bread, 2 Farm Eggs, Grilled Sausage"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={productImage}
                  onChange={(e) => setProductImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="availCheck"
                  checked={productAvailable}
                  onChange={(e) => setProductAvailable(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                />
                <label htmlFor="availCheck" className="text-xs font-bold text-slate-700">
                  Product Available for Ordering
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-crimson flex-1 py-2.5 text-white rounded-xl text-xs font-black shadow-md"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DISPATCH RIDER */}
      {assigningRiderOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-base text-slate-900">🛵 Assign Delivery Rider</h3>
              <button onClick={() => setAssigningRiderOrder(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignRider} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Rider Name
                </label>
                <input
                  type="text"
                  value={riderName}
                  onChange={(e) => setRiderName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Rider Phone Number
                </label>
                <input
                  type="tel"
                  value={riderPhone}
                  onChange={(e) => setRiderPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAssigningRiderOrder(null)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-purple-700"
                >
                  Confirm & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
