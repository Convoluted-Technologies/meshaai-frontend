'use client';

import { useState, useEffect } from 'react';
import { Order, OrderStatus, PresetMeal } from '@/lib/types';

interface KitchenItem {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  openTime: string;
  closeTime: string;
  radiusKm: number;
  operatorName: string;
  operatorPhone: string;
  active: boolean;
}

interface FeeRuleItem {
  id: number;
  name: string;
  type: 'DISTANCE_BAND' | 'FREE_WINDOW';
  priority: number;
  minDistanceKm?: number;
  maxDistanceKm?: number;
  windowStart?: string;
  windowEnd?: string;
  feeAmount: number;
  currency: string;
  kitchenId: number;
}

interface CustomerRecord {
  id: number;
  phone: string;
  fullName?: string;
  email?: string;
  isBlocked: boolean;
  activeSessionsCount: number;
  totalOrdersCount: number;
  createdAt: string;
}

export default function AdminStudioPage() {
  // Auth state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [username, setUsername] = useState('AdminLogin');
  const [password, setPassword] = useState('Admin@2026');
  const [adminUser, setAdminUser] = useState<any>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'orders' | 'catalog' | 'customers' | 'kitchens' | 'fee_rules'
  >('orders');

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [assigningRiderOrder, setAssigningRiderOrder] = useState<Order | null>(null);
  const [riderName, setRiderName] = useState('Tunde Bako');
  const [riderPhone, setRiderPhone] = useState('08099887766');

  // Catalog State
  const [presets, setPresets] = useState<PresetMeal[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Partial<PresetMeal> | null>(null);
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productPriceNgn, setProductPriceNgn] = useState('');
  const [productImage, setProductImage] = useState('');
  const [productComponents, setProductComponents] = useState('');
  const [productAvailable, setProductAvailable] = useState(true);

  // Customers & Risk State
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [blockingCustomer, setBlockingCustomer] = useState<CustomerRecord | null>(null);

  // Kitchens State
  const [kitchens, setKitchens] = useState<KitchenItem[]>([]);
  const [isKitchenModalOpen, setIsKitchenModalOpen] = useState(false);
  const [kName, setKName] = useState('');
  const [kLat, setKLat] = useState('9.0778');
  const [kLng, setKLng] = useState('7.4819');
  const [kOpenTime, setKOpenTime] = useState('06:00:00');
  const [kCloseTime, setKCloseTime] = useState('19:00:00');
  const [kRadiusKm, setKRadiusKm] = useState('7.0');
  const [kOperatorName, setKOperatorName] = useState('');
  const [kOperatorPhone, setKOperatorPhone] = useState('');

  // Fee Rules State
  const [feeRules, setFeeRules] = useState<FeeRuleItem[]>([]);
  const [isFeeRuleModalOpen, setIsFeeRuleModalOpen] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleType, setRuleType] = useState<'DISTANCE_BAND' | 'FREE_WINDOW'>('DISTANCE_BAND');
  const [rulePriority, setRulePriority] = useState('10');
  const [ruleMinDist, setRuleMinDist] = useState('0.0');
  const [ruleMaxDist, setRuleMaxDist] = useState('3.0');
  const [ruleFeeNgn, setRuleFeeNgn] = useState('500');

  // Master Global Ordering Pause Kill-Switch State
  const [isOrderingPaused, setIsOrderingPaused] = useState(false);

  useEffect(() => {
    if (!isAdminLoggedIn) return;
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [isAdminLoggedIn]);

  function fetchData() {
    fetchOrders();
    fetchCatalog();
    fetchCustomers();
    fetchKitchens();
    fetchFeeRules();
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
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchCatalog() {
    try {
      const res = await fetch('/api/admin/catalog');
      const data = await res.json();
      if (data.presets) setPresets(data.presets);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchCustomers() {
    try {
      const res = await fetch('/api/admin/customers');
      const data = await res.json();
      if (data.customers) {
        setCustomers(data.customers);
      } else {
        // Default sample customer list for risk management demo
        setCustomers([
          {
            id: 101,
            phone: '+2348039276495',
            fullName: 'Ibrahim Wuse',
            email: 'ibrahim@example.com',
            isBlocked: false,
            activeSessionsCount: 2,
            totalOrdersCount: 8,
            createdAt: '2026-09-01T10:00:00Z',
          },
          {
            id: 102,
            phone: '+2348099887766',
            fullName: 'Chidi Mark',
            email: 'chidi@example.com',
            isBlocked: true,
            activeSessionsCount: 0,
            totalOrdersCount: 2,
            createdAt: '2026-09-15T14:30:00Z',
          },
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchKitchens() {
    try {
      const res = await fetch('/api/admin/kitchens');
      const data = await res.json();
      if (data.kitchens && data.kitchens.length > 0) {
        setKitchens(data.kitchens);
      } else {
        setKitchens([
          {
            id: 1,
            name: 'Meshaai Kitchen - Abuja Wuse 2',
            latitude: 9.0778,
            longitude: 7.4819,
            timezone: 'Africa/Lagos',
            openTime: '06:00:00',
            closeTime: '19:00:00',
            radiusKm: 7.0,
            operatorName: 'Ibrahim Wuse Ops',
            operatorPhone: '+2348039276495',
            active: true,
          },
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchFeeRules() {
    try {
      const res = await fetch('/api/admin/delivery-fee-rules');
      const data = await res.json();
      if (data.rules) setFeeRules(data.rules);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchSettings() {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.settings) {
        setIsOrderingPaused(data.settings.isOrderingPaused ?? false);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // --- ACTIONS ---
  async function updateOrderStatus(orderId: string, newStatus: OrderStatus, reason?: string) {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason: reason || `Updated to ${newStatus}` }),
      });
      if (res.ok) fetchOrders();
    } catch (e) {
      alert('Error updating status');
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
        await updateOrderStatus(assigningRiderOrder.id, 'OUT_FOR_DELIVERY');
        setAssigningRiderOrder(null);
      }
    } catch (e) {
      alert('Error assigning rider');
    }
  }

  async function handleToggleAvailability(preset: PresetMeal) {
    try {
      const res = await fetch('/api/admin/catalog', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: preset.id, isAvailable: !preset.isAvailable }),
      });
      if (res.ok) fetchCatalog();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
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
      }
    } catch (e) {
      alert('Error saving product');
    }
  }

  async function handleDeleteProduct(id: string, name: string) {
    if (!confirm(`Delete product "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/catalog?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchCatalog();
    } catch (e) {
      alert('Error deleting product');
    }
  }

  async function handleToggleBlockCustomer(c: CustomerRecord) {
    try {
      const res = await fetch(`/api/admin/customers/${c.id}/block`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block: !c.isBlocked }),
      });
      if (res.ok) {
        setBlockingCustomer(null);
        fetchCustomers();
      }
    } catch (e) {
      alert('Failed to update block status');
    }
  }

  async function handleRevokeSessions(c: CustomerRecord) {
    try {
      const res = await fetch(`/api/admin/customers/${c.id}/sessions/revoke-all`, { method: 'POST' });
      if (res.ok) {
        alert(`Revoked all active sessions for customer ${c.phone}`);
        fetchCustomers();
      }
    } catch (e) {
      alert('Error revoking sessions');
    }
  }

  async function handleToggleKitchenPause(k: KitchenItem) {
    try {
      const res = await fetch(`/api/admin/kitchens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...k, active: !k.active }),
      });
      if (res.ok) fetchKitchens();
    } catch (e) {
      alert('Error updating kitchen status');
    }
  }

  async function handleToggleGlobalKillSwitch() {
    if (!confirm(`Are you sure you want to ${isOrderingPaused ? 'RESUME' : 'PAUSE'} online ordering platform-wide?`)) return;
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOrderingPaused: !isOrderingPaused }),
      });
      if (res.ok) setIsOrderingPaused(!isOrderingPaused);
    } catch (e) {
      alert('Failed to update global kill switch');
    }
  }

  const formatNGN = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

  // Filtering
  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return o.code.toLowerCase().includes(q) || o.phone.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredCustomers = customers.filter((c) => {
    if (!customerSearch) return true;
    const q = customerSearch.toLowerCase();
    return c.phone.toLowerCase().includes(q) || (c.fullName || '').toLowerCase().includes(q);
  });

  // --- LOGIN UI ---
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6 text-white">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-tr from-red-600 via-amber-500 to-orange-500 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-xl shadow-red-600/30">
              🔑
            </div>
            <h1 className="text-2xl font-black tracking-wider uppercase">MESHA-AI OPERATOR STUDIO</h1>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Admin Username / Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-red-500"
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
                required
              />
            </div>

            <button
              type="submit"
              className="btn-crimson w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-red-600/30"
            >
              Sign In to Console →
            </button>
          </form>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-amber-400 font-mono text-center">
            Credentials: <b>AdminLogin</b> / <b>Admin@2026</b>
          </div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD UI ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header Bar */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔑</span>
            <span className="font-black text-lg tracking-wider uppercase">MESHA-AI ADMIN STUDIO</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Section 3.6 Master Global Kill-Switch Button */}
            <button
              onClick={handleToggleGlobalKillSwitch}
              className={`px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all ${isOrderingPaused
                  ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/50'
                  : 'bg-emerald-950 text-emerald-400 border border-emerald-600/40'
                }`}
            >
              <span>{isOrderingPaused ? '🔴 MASTER KILL-SWITCH: PAUSED' : '🟢 PLATFORM ACTIVE'}</span>
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

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Navigation Tabs aligned with PDF Section 3 */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-4 border-b border-slate-200 -mx-4 px-4 sm:mx-0 sm:px-0 flex-nowrap sm:flex-wrap">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'orders' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200'
              }`}
          >
            🚚 Live Orders ({orders.filter((o) => o.status !== 'DELIVERED').length})
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'catalog' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200'
              }`}
          >
            📦 Menu & Availability ({presets.length})
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'customers' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200'
              }`}
          >
            👥 Customers & Risk ({customers.length})
          </button>

          <button
            onClick={() => setActiveTab('kitchens')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'kitchens' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200'
              }`}
          >
            🏬 Kitchens & Zones ({kitchens.length})
          </button>

          <button
            onClick={() => setActiveTab('fee_rules')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'fee_rules' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200'
              }`}
          >
            💸 Fee Rules ({feeRules.length})
          </button>
        </div>

        {/* TAB 1: ORDERS QUEUE & DISPATCH (Section 4) */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex flex-wrap gap-2">
                {['ALL', 'PENDING_PAYMENT', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${statusFilter === st ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Search order code or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-md p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono font-black text-slate-900 text-base">#{order.code}</span>
                        <p className="text-[11px] text-slate-500 font-mono">{new Date(order.createdAt).toLocaleTimeString()}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-slate-100 text-slate-800">
                        {order.status}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between font-medium text-slate-800">
                          <span>{it.qty}× {it.presetName}</span>
                          <span className="font-mono">{formatNGN(it.totalKobo)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <p>📍 {order.location.address}</p>
                      <p>📱 <span className="font-mono font-bold">{order.phone}</span></p>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-100 pt-2 font-mono">
                      <span className="text-xs text-slate-500">Total</span>
                      <span className="font-black text-slate-900 text-base">{formatNGN(order.totalKobo)}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-2">
                    {order.status === 'PENDING_PAYMENT' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                      >
                        Confirm Order
                      </button>
                    )}
                    {(order.status === 'CONFIRMED' || order.status === 'PENDING_PAYMENT') && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                        className="flex-1 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-extrabold"
                      >
                        Start Cooking 🍳
                      </button>
                    )}
                    {order.status === 'PREPARING' && (
                      <button
                        onClick={() => setAssigningRiderOrder(order)}
                        className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold"
                      >
                        Dispatch Rider 🛵
                      </button>
                    )}
                    {order.status === 'OUT_FOR_DELIVERY' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                        className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black"
                      >
                        Mark Delivered ✅
                      </button>
                    )}
                    <button
                      onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                      className="px-3 py-2 bg-slate-100 text-red-600 rounded-xl text-xs font-bold"
                    >
                      Cancel ❌
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: MENU & CATALOG AVAILABILITY (Section 3.3) */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200">
              <div>
                <h2 className="text-xl font-black text-slate-900">Catalog & Menu Availability</h2>
                <p className="text-xs text-slate-500">Section 3.3 - Instant 86ing & Preset CRUD</p>
              </div>
              <button
                onClick={() => {
                  setEditingPreset(null);
                  setProductName('');
                  setProductDesc('');
                  setProductPriceNgn('');
                  setProductImage('');
                  setProductComponents('Artisan Bread, Farm Eggs');
                  setProductAvailable(true);
                  setIsProductModalOpen(true);
                }}
                className="btn-crimson px-5 py-2.5 rounded-xl font-black text-xs uppercase"
              >
                ➕ Add New Product
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {presets.map((preset) => (
                <div key={preset.id} className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="relative h-44 w-full bg-slate-100">
                      <img
                        src={preset.imageUrl}
                        alt={preset.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80';
                        }}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 bg-white/95 px-3 py-1 rounded-xl font-mono font-black text-amber-600 text-sm">
                        {formatNGN(preset.priceKobo)}
                      </div>
                    </div>
                    <div className="p-5 space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-extrabold text-slate-900 text-base">{preset.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${preset.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {preset.isAvailable ? 'Available' : 'Sold Out'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{preset.description}</p>
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => handleToggleAvailability(preset)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold"
                    >
                      {preset.isAvailable ? 'Set Sold Out (86)' : 'Set Available'}
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(preset.id, preset.name)}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOMERS & RISK MANAGEMENT (Section 3.2) */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200">
              <div>
                <h2 className="text-xl font-black text-slate-900">Customer & Risk Management</h2>
                <p className="text-xs text-slate-500">Section 3.2 - Block suspicious users & force session revocation</p>
              </div>
              <input
                type="text"
                placeholder="Search phone or name..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 font-mono"
              />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden divide-y divide-slate-100">
              {filteredCustomers.map((c) => (
                <div key={c.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-slate-900 text-base">{c.phone}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${c.isBlocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                          }`}
                      >
                        {c.isBlocked ? '🚫 BLOCKED' : '✅ ACTIVE'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{c.fullName || 'Registered Customer'} • {c.email || 'No email'}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Orders: {c.totalOrdersCount} | Active Sessions: {c.activeSessionsCount}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRevokeSessions(c)}
                      className="px-3.5 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold"
                    >
                      Revoke Sessions
                    </button>
                    <button
                      onClick={() => setBlockingCustomer(c)}
                      className={`px-4 py-2 rounded-xl text-xs font-black text-white ${c.isBlocked ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700 shadow-md'
                        }`}
                    >
                      {c.isBlocked ? 'Unblock User' : 'Block Customer 🚫'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: KITCHENS & COVERAGE ZONES (Section 3.4) */}
        {activeTab === 'kitchens' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200">
              <div>
                <h2 className="text-xl font-black text-slate-900">Kitchens & Delivery Zones</h2>
                <p className="text-xs text-slate-500">Section 3.4 - Operating hours, radiuses, and pause controls</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {kitchens.map((k) => (
                <div key={k.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-lg">{k.name}</h3>
                      <p className="text-xs text-slate-500 font-mono">
                        Coordinates: {k.latitude}, {k.longitude}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleKitchenPause(k)}
                      className={`px-3 py-1 rounded-full text-xs font-black ${k.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}
                    >
                      {k.active ? '🟢 ACTIVE' : '🔴 PAUSED'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs font-mono text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Hours</span>
                      <span>{k.openTime} - {k.closeTime}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Radius</span>
                      <span>{k.radiusKm} km coverage</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Operator</span>
                      <span>{k.operatorName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Operator Phone</span>
                      <span>{k.operatorPhone}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: FEE RULES & PROMOTIONS (Section 3.5) */}
        {activeTab === 'fee_rules' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200">
              <div>
                <h2 className="text-xl font-black text-slate-900">Delivery Fee Rules & Promotions Engine</h2>
                <p className="text-xs text-slate-500">Section 3.5 - Distance Bands & Promotional Free Windows</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-md divide-y divide-slate-100">
              {feeRules.map((r) => (
                <div key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-base">{r.name}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 text-purple-700">
                        {r.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      Priority: {r.priority} | Coverage: {r.minDistanceKm ?? 0}km to {r.maxDistanceKm ?? 'Max'}km
                    </p>
                  </div>
                  <div className="font-mono text-right">
                    <span className="font-black text-slate-900 text-lg block">{formatNGN(r.feeAmount)}</span>
                    <span className="text-xs text-slate-400">{r.currency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* BLOCK CUSTOMER DESTRUCTIVE CONFIRMATION MODAL (Section 3.2) */}
      {blockingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-black text-lg text-slate-900">
              {blockingCustomer.isBlocked ? 'Unblock Customer' : '🚫 Confirm Block Customer'}
            </h3>
            <p className="text-xs text-slate-600">
              {blockingCustomer.isBlocked
                ? `Are you sure you want to restore access for phone ${blockingCustomer.phone}?`
                : `Blocking customer ${blockingCustomer.phone} will immediately deny all OTP requests and terminate active sessions platform-wide.`}
            </p>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => setBlockingCustomer(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleToggleBlockCustomer(blockingCustomer)}
                className={`flex-1 py-2.5 text-white rounded-xl text-xs font-black shadow-md ${blockingCustomer.isBlocked ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
              >
                {blockingCustomer.isBlocked ? 'Unblock Access' : 'Confirm Block 🚫'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISPATCH RIDER MODAL */}
      {assigningRiderOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-base text-slate-900">🛵 Dispatch Rider</h3>
              <button onClick={() => setAssigningRiderOrder(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleAssignRider} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Rider Name</label>
                <input
                  type="text"
                  value={riderName}
                  onChange={(e) => setRiderName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Rider Phone</label>
                <input
                  type="tel"
                  value={riderPhone}
                  onChange={(e) => setRiderPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono"
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
                <button type="submit" className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold">
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
