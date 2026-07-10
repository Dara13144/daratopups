'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import {
  fetchAdminStats,
  fetchAdminOrders,
  updateAdminOrderStatus,
  fetchAdminStock,
  addAdminStock,
  fetchProducts,
  GameProduct,
  GamePackage,
  addAdminProduct,
  addAdminPackage,
  deleteAdminProduct,
  deleteAdminPackage
} from '../../lib/api';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Database, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Plus, 
  RefreshCw, 
  ShieldAlert,
  Search,
  Filter,
  Trash2,
  Gem
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'orders' | 'stock' | 'products'>('metrics');
  
  // Dashboard states
  const [metrics, setMetrics] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [popularity, setPopularity] = useState<any[]>([]);
  
  // Orders states
  const [orders, setOrders] = useState<any[]>([]);
  const [orderFilter, setOrderFilter] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  
  // Stock states
  const [stocks, setStocks] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<GameProduct[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [newVoucherCodes, setNewVoucherCodes] = useState('');

  // Product / Package Manager states
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('MOBILE_GAME');
  const [newProductImage, setNewProductImage] = useState('');
  
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newPackageName, setNewPackageName] = useState('');
  const [newPackageAmount, setNewPackageAmount] = useState('');
  const [newPackagePrice, setNewPackagePrice] = useState('');
  const [newPackageCategory, setNewPackageCategory] = useState('NORMAL');
  const [newPackageBadge, setNewPackageBadge] = useState('');
  
  // UX controls
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Manual code entry prompt (in case admin wants to supply specific stock code on manual completion)
  const [promptCode, setPromptCode] = useState('');
  const [activePromptOrderId, setActivePromptOrderId] = useState<string | null>(null);

  // Authenticate Admin on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('user_role');

    if (!token || role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    setIsAdmin(true);
    loadAllData();
  }, [router]);

  const loadAllData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch dashboard metrics
      const statsRes = await fetchAdminStats();
      setMetrics(statsRes.metrics);
      setRecentOrders(statsRes.recentOrders);
      setPopularity(statsRes.popularity);

      // 2. Fetch all orders
      const ordersRes = await fetchAdminOrders();
      setOrders(ordersRes);

      // 3. Fetch stock
      const stockRes = await fetchAdminStock();
      setStocks(stockRes.stocks);

      // 4. Fetch products for stock creation select dropdown
      const prodRes = await fetchProducts();
      setAllProducts(prodRes);

      // Select first package option by default if available
      if (prodRes.length > 0) {
        setSelectedProductId(prodRes[0].id);
        if (prodRes[0].packages.length > 0) {
          setSelectedPackageId(prodRes[0].packages[0].id);
        }
      }

    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch admin dashboard configurations. Is the backend server running?');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string, code?: string) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await updateAdminOrderStatus(id, status, code);
      setSuccess(`Successfully updated order to ${status}`);
      setActivePromptOrderId(null);
      setPromptCode('');
      
      // Refresh statistics
      await loadAllData();
    } catch (err: any) {
      console.error(err);
      setError('Failed to update order: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackageId || !newVoucherCodes.trim()) {
      setError('Please select a package and input voucher codes');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const data = await addAdminStock(selectedPackageId, newVoucherCodes);
      setSuccess(data.message || 'Stock cards uploaded successfully');
      setNewVoucherCodes('');
      
      // Refresh stock view
      const stockRes = await fetchAdminStock();
      setStocks(stockRes.stocks);
    } catch (err: any) {
      console.error(err);
      setError('Failed to upload stock vouchers: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) {
      setError('Product name is required');
      return;
    }
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await addAdminProduct(newProductName, newProductCategory, newProductImage || undefined);
      setSuccess(res.message || 'Product created successfully');
      setNewProductName('');
      setNewProductImage('');
      
      // Refresh database records
      await loadAllData();
    } catch (err: any) {
      console.error(err);
      setError('Failed to create product: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !newPackageName.trim() || !newPackageAmount || !newPackagePrice) {
      setError('All package fields are required');
      return;
    }
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const amountVal = parseInt(newPackageAmount, 10);
      const priceVal = parseFloat(newPackagePrice);
      const res = await addAdminPackage(
        selectedProductId, 
        newPackageName, 
        amountVal, 
        priceVal,
        newPackageCategory,
        newPackageBadge || undefined
      );
      setSuccess(res.message || 'Package created successfully');
      setNewPackageName('');
      setNewPackageAmount('');
      setNewPackagePrice('');
      setNewPackageCategory('NORMAL');
      setNewPackageBadge('');
      
      // Refresh database records
      await loadAllData();
    } catch (err: any) {
      console.error(err);
      setError('Failed to create package: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product? This will delete all associated packages and stock.')) return;
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await deleteAdminProduct(id);
      setSuccess('Product deleted successfully');
      await loadAllData();
    } catch (err: any) {
      console.error(err);
      setError('Failed to delete product: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this package? This will delete all associated stock.')) return;
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await deleteAdminPackage(id);
      setSuccess('Package deleted successfully');
      await loadAllData();
    } catch (err: any) {
      console.error(err);
      setError('Failed to delete package: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const filtered = await fetchAdminOrders(orderFilter || undefined, orderSearch || undefined);
      setOrders(filtered);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch filtered orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'SUCCESS':
        return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">SUCCESS</span>;
      case 'PENDING':
        return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20">PENDING</span>;
      case 'PROCESSING':
        return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full border bg-cyan-500/10 text-cyan-400 border-cyan-500/20">PROCESSING</span>;
      case 'FAILED':
      default:
        return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full border bg-red-500/10 text-red-400 border-red-500/20">FAILED</span>;
    }
  };

  if (!isAdmin) return null;

  return (
    <>
      <Header />
      
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Admin Title banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center space-x-2.5">
            <div className="bg-gradient-to-r from-cyan-500 to-violet-500 p-2 rounded-xl text-white">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Admin Dashboard</h1>
              <p className="text-slate-400 text-xs mt-0.5">Control game products, stock, and payment validations</p>
            </div>
          </div>

          <button
            onClick={loadAllData}
            disabled={loading}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Data</span>
          </button>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="flex items-start space-x-2 bg-red-950/20 border border-red-900/30 rounded-xl p-4 mb-6 text-red-300 text-sm">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start space-x-2 bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-4 mb-6 text-emerald-300 text-sm">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Dashboard Tabs navigation */}
        <div className="flex border-b border-slate-900 mb-8 space-x-4">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`pb-4 px-2 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'metrics' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview Metrics
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-4 px-2 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'orders' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Order Manager ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`pb-4 px-2 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'stock' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Voucher Stock Cards
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-4 px-2 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'products' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Product & Package Manager
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-400 text-xs">Loading analytics data...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: OVERVIEW METRICS */}
            {activeTab === 'metrics' && metrics && (
              <div className="space-y-8">
                {/* Metric Summary Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Revenue */}
                  <div className="glass-panel p-6 bg-slate-950/20 border-slate-900">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-slate-400 text-xs font-semibold">Total Revenue</span>
                      <TrendingUp className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-black text-white">${metrics.totalRevenue.toFixed(2)}</div>
                    <span className="text-[10px] text-slate-500 mt-1 block">From successful recharges</span>
                  </div>

                  {/* Completed */}
                  <div className="glass-panel p-6 bg-slate-950/20 border-slate-900">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-slate-400 text-xs font-semibold">Completed Orders</span>
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-black text-white">{metrics.completedOrders}</div>
                    <span className="text-[10px] text-slate-500 mt-1 block">Delivered successfully</span>
                  </div>

                  {/* Pending */}
                  <div className="glass-panel p-6 bg-slate-950/20 border-slate-900">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-slate-400 text-xs font-semibold">Pending Payments</span>
                      <Clock className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="text-2xl font-black text-white">{metrics.pendingOrders}</div>
                    <span className="text-[10px] text-slate-500 mt-1 block">Awaiting scanners</span>
                  </div>

                  {/* Total Count */}
                  <div className="glass-panel p-6 bg-slate-950/20 border-slate-900">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-slate-400 text-xs font-semibold">Total Orders Placed</span>
                      <ShoppingBag className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div className="text-2xl font-black text-white">{metrics.totalOrders}</div>
                    <span className="text-[10px] text-slate-500 mt-1 block">Accumulated ticket database</span>
                  </div>
                </div>

                {/* Popularity & Recent Orders grid layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Recent Orders log */}
                  <div className="lg:col-span-2 glass-panel p-6 bg-slate-950/20 border-slate-900">
                    <h3 className="text-white font-extrabold text-sm mb-4">Recent Transactions Log</h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-900 pb-2 text-slate-500 uppercase tracking-wider font-semibold">
                            <th className="py-2">Game</th>
                            <th className="py-2">Player Nickname</th>
                            <th className="py-2">Invoice Code</th>
                            <th className="py-2">Price</th>
                            <th className="py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900">
                          {recentOrders.map((ord: any) => (
                            <tr key={ord.id} className="hover:bg-slate-900/10 transition-colors">
                              <td className="py-3 font-semibold text-white">{ord.package.product.name}</td>
                              <td className="py-3 text-slate-300 font-medium">{ord.playerNickname || 'N/A'}</td>
                              <td className="py-3"><code className="text-cyan-400 font-mono">{ord.paymentTxnId}</code></td>
                              <td className="py-3 text-white font-bold">${ord.price.toFixed(2)}</td>
                              <td className="py-3">{getStatusBadge(ord.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Game popularity charts */}
                  <div className="glass-panel p-6 bg-slate-950/20 border-slate-900 space-y-4">
                    <h3 className="text-white font-extrabold text-sm border-b border-slate-900 pb-3">Popular Recharge Modules</h3>
                    {popularity.map((pop: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-500 font-mono">#{idx+1}</span>
                          <span className="text-slate-300 font-bold">{pop.name}</span>
                        </div>
                        <span className="bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-medium">
                          {pop.salesCount} topups
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ORDER MANAGER */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                
                {/* Advanced table controls */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                  <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-60">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search player, zones, txns..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-900 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>

                    <select
                      value={orderFilter}
                      onChange={(e) => setOrderFilter(e.target.value)}
                      className="bg-slate-950/60 border border-slate-900 rounded-lg text-xs text-slate-300 px-3 focus:outline-none"
                    >
                      <option value="">All Statuses</option>
                      <option value="PENDING">PENDING</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="SUCCESS">SUCCESS</option>
                      <option value="FAILED">FAILED</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSearchOrders}
                    className="w-full md:w-auto px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs shadow-md transition-all glow-btn"
                  >
                    Apply Filter Scan
                  </button>
                </div>

                {/* Orders List Table */}
                <div className="glass-panel overflow-hidden border-slate-900 bg-slate-950/20">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-900 bg-slate-950/60 text-slate-400 font-semibold tracking-wider">
                          <th className="p-4">Game & Package</th>
                          <th className="p-4">Player Details</th>
                          <th className="p-4">Transaction Code</th>
                          <th className="p-4">Price</th>
                          <th className="p-4">Status Badges</th>
                          <th className="p-4">Delivered Item</th>
                          <th className="p-4 text-center">Control actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {orders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-slate-900/10 transition-colors">
                            {/* Product Info */}
                            <td className="p-4 font-bold text-white">
                              <div>{ord.package.product.name}</div>
                              <div className="text-slate-400 font-normal text-[10px] mt-0.5">{ord.package.name}</div>
                            </td>

                            {/* Player Details */}
                            <td className="p-4">
                              <div className="text-slate-200 font-semibold">{ord.playerNickname || 'N/A'}</div>
                              <div className="text-slate-500 text-[10px] mt-0.5">
                                ID: {ord.playerId} {ord.playerZoneId ? `(${ord.playerZoneId})` : ''}
                              </div>
                            </td>

                            {/* Txn ID & Payment Method */}
                            <td className="p-4">
                              <code className="text-cyan-400 font-mono font-bold">{ord.paymentTxnId}</code>
                              <div className="text-[10px] text-slate-400 font-medium mt-1">
                                via {ord.paymentMethod} • <span className="font-bold">{ord.paymentStatus}</span>
                              </div>
                            </td>

                            {/* Price */}
                            <td className="p-4 font-extrabold text-white">${ord.price.toFixed(2)}</td>

                            {/* Status */}
                            <td className="p-4">{getStatusBadge(ord.status)}</td>

                            {/* Delivered code or ref */}
                            <td className="p-4">
                              {ord.stockDeliveredCode ? (
                                <code className="bg-slate-900 px-1 py-0.5 rounded border border-slate-800 font-mono text-emerald-400 font-bold">{ord.stockDeliveredCode}</code>
                              ) : (
                                <span className="text-slate-500 italic text-[10px]">No delivery code</span>
                              )}
                            </td>

                            {/* Control action buttons */}
                            <td className="p-4 text-center">
                              {ord.status !== 'COMPLETED' && ord.status !== 'SUCCESS' && ord.status !== 'FAILED' ? (
                                <div className="flex justify-center gap-2">
                                  {ord.package.product.category === 'VOUCHER' ? (
                                    /* Voucher requires prompt code card delivery */
                                    activePromptOrderId === ord.id ? (
                                      <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-lg">
                                        <input
                                          type="text"
                                          placeholder="Enter Code"
                                          value={promptCode}
                                          onChange={(e) => setPromptCode(e.target.value)}
                                          className="px-2 py-1 bg-slate-950 border border-slate-850 rounded text-[10px] text-white focus:outline-none"
                                        />
                                        <button
                                          onClick={() => handleUpdateStatus(ord.id, 'COMPLETED', promptCode)}
                                          className="bg-emerald-500 text-slate-950 px-2 py-0.5 rounded text-[10px] font-bold"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={() => setActivePromptOrderId(null)}
                                          className="text-slate-400 text-[10px]"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setActivePromptOrderId(ord.id);
                                          setPromptCode('');
                                        }}
                                        className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-[10px] font-bold transition-all"
                                      >
                                        Complete Manual
                                      </button>
                                    )
                                  ) : (
                                    <button
                                      onClick={() => handleUpdateStatus(ord.id, 'COMPLETED')}
                                      className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-[10px] font-bold transition-all"
                                    >
                                      Approve Top-Up
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleUpdateStatus(ord.id, 'FAILED')}
                                    className="px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-[10px] font-bold transition-all"
                                  >
                                    Fail Order
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-500 text-[10px] italic">Processed</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: STOCK CARDS MANAGER */}
            {activeTab === 'stock' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Upload Section Column 1 */}
                <div className="glass-panel p-6 bg-slate-950/40 border-slate-900 h-fit">
                  <h3 className="text-white font-extrabold text-sm mb-4 flex items-center space-x-1.5">
                    <Plus className="h-4.5 w-4.5 text-cyan-400" />
                    <span>Upload Digital Stock Codes</span>
                  </h3>

                  <form onSubmit={handleAddStockSubmit} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">Select Game Package</label>
                      <select
                        value={selectedPackageId}
                        onChange={(e) => setSelectedPackageId(e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-900 rounded-lg text-slate-300 p-2.5 focus:outline-none"
                      >
                        {allProducts.map((prod) => (
                          <optgroup key={prod.id} label={`${prod.name} (${prod.category})`}>
                            {prod.packages.map((pkg) => (
                              <option key={pkg.id} value={pkg.id}>
                                {pkg.name} - ${pkg.price.toFixed(2)}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">Voucher Serial Codes (one code per line)</label>
                      <textarea
                        rows={6}
                        placeholder="STEAM-5USD-A1B2C3D4&#10;STEAM-5USD-E5F6G7H8"
                        value={newVoucherCodes}
                        onChange={(e) => setNewVoucherCodes(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950/60 border border-slate-900 rounded-lg text-slate-200 placeholder-slate-600 font-mono text-xs focus:outline-none focus:border-cyan-500/50"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center space-x-1 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white font-bold text-xs shadow-md transition-all glow-btn"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Upload Voucher Stock</span>
                    </button>
                  </form>
                </div>

                {/* Stock Cards Listing Column 2 & 3 */}
                <div className="lg:col-span-2 glass-panel p-6 bg-slate-950/40 border-slate-900">
                  <h3 className="text-white font-extrabold text-sm mb-4 flex items-center space-x-1.5">
                    <Database className="h-4.5 w-4.5 text-cyan-400" />
                    <span>Active Stock Inventory</span>
                  </h3>

                  <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-900 pb-2 text-slate-400 font-semibold bg-slate-950/50">
                          <th className="p-2.5">Game Package</th>
                          <th className="p-2.5">Voucher Serial Code</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">Added Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {stocks.map((st) => (
                          <tr key={st.id} className="hover:bg-slate-900/10 transition-colors">
                            <td className="p-2.5 font-bold text-white">
                              {st.package.product.name}
                              <div className="text-slate-500 font-normal text-[10px]">{st.package.name}</div>
                            </td>
                            <td className="p-2.5 font-mono text-slate-300 font-semibold">{st.code}</td>
                            <td className="p-2.5">
                              {st.isUsed ? (
                                <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-900 text-slate-500 border border-slate-800">USED</span>
                              ) : (
                                <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">AVAILABLE</span>
                              )}
                            </td>
                            <td className="p-2.5 text-slate-500 text-[10px]">
                              {new Date(st.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 4: PRODUCT & PACKAGE MANAGER */}
            {activeTab === 'products' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Column 1: Add Product Form */}
                  <div className="glass-panel p-6 bg-slate-950/40 border-slate-900 h-fit">
                    <h3 className="text-white font-extrabold text-sm mb-4 flex items-center space-x-1.5">
                      <Plus className="h-4.5 w-4.5 text-cyan-400" />
                      <span>Add New Game Product</span>
                    </h3>
                    <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">Product Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Free Fire, Mobile Legends"
                          value={newProductName}
                          onChange={(e) => setNewProductName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950/60 border border-slate-900 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">Category</label>
                        <select
                          value={newProductCategory}
                          onChange={(e) => setNewProductCategory(e.target.value)}
                          className="w-full bg-slate-950/60 border border-slate-900 rounded-lg text-slate-300 p-2.5 focus:outline-none"
                        >
                          <option value="MOBILE_GAME">MOBILE GAME</option>
                          <option value="PC_GAME">PC GAME</option>
                          <option value="VOUCHER">VOUCHER</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">Product Icon Image URL (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. /images/games/custom-game.png"
                          value={newProductImage}
                          onChange={(e) => setNewProductImage(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950/60 border border-slate-900 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center space-x-1 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white font-bold text-xs shadow-md transition-all glow-btn"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create Product</span>
                      </button>
                    </form>
                  </div>

                  {/* Column 2: Add Package Form */}
                  <div className="glass-panel p-6 bg-slate-950/40 border-slate-900 h-fit">
                    <h3 className="text-white font-extrabold text-sm mb-4 flex items-center space-x-1.5">
                      <Gem className="h-4.5 w-4.5 text-cyan-400" />
                      <span>Add Diamond Package</span>
                    </h3>
                    <form onSubmit={handleCreatePackage} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">Select Game Product</label>
                        <select
                          value={selectedProductId}
                          onChange={(e) => setSelectedProductId(e.target.value)}
                          className="w-full bg-slate-950/60 border border-slate-900 rounded-lg text-slate-300 p-2.5 focus:outline-none"
                        >
                          {allProducts.map((prod) => (
                            <option key={prod.id} value={prod.id}>
                              {prod.name} ({prod.category})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">Package/Diamond Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 50 Diamonds, 100 Diamonds, 5 USD Voucher"
                          value={newPackageName}
                          onChange={(e) => setNewPackageName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950/60 border border-slate-900 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">Diamond Amount (Numeric count)</label>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 50, 100"
                          value={newPackageAmount}
                          onChange={(e) => setNewPackageAmount(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950/60 border border-slate-900 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">Price in USD ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="e.g. 0.99, 4.99"
                          value={newPackagePrice}
                          onChange={(e) => setNewPackagePrice(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950/60 border border-slate-900 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">Package Category (Section)</label>
                        <select
                          value={newPackageCategory}
                          onChange={(e) => setNewPackageCategory(e.target.value)}
                          className="w-full bg-slate-950/60 border border-slate-900 rounded-lg text-slate-300 p-2.5 focus:outline-none animate-in fade-in"
                        >
                          <option value="NORMAL">Normal Package</option>
                          <option value="BEST_SELLER">Best Seller Package</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">Label/Badge (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. ទទួលបាន 20 💎 ភ្លាមៗ, សាកល្បង, Bonus Event"
                          value={newPackageBadge}
                          onChange={(e) => setNewPackageBadge(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950/60 border border-slate-900 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center space-x-1 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white font-bold text-xs shadow-md transition-all glow-btn"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create Diamond Package</span>
                      </button>
                    </form>
                  </div>
                </div>

                {/* Listing Section: All Products & Packages */}
                <div className="glass-panel p-6 bg-slate-950/40 border-slate-900">
                  <h3 className="text-white font-extrabold text-sm mb-6 flex items-center space-x-1.5">
                    <Database className="h-4.5 w-4.5 text-cyan-400" />
                    <span>Catalog List ({allProducts.length} Games/Products)</span>
                  </h3>

                  <div className="space-y-6">
                    {allProducts.map((prod) => (
                      <div key={prod.id} className="border border-slate-900 rounded-xl p-4 bg-slate-950/20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-900">
                          <div>
                            <h4 className="text-white font-black text-sm flex items-center space-x-2">
                              <span>{prod.name}</span>
                              <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                {prod.category}
                              </span>
                            </h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">Slug: <span className="font-mono">{prod.slug}</span></p>
                          </div>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-[10px] font-bold transition-all w-fit"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete Product</span>
                          </button>
                        </div>

                        {/* Packages Grid */}
                        <div className="mt-4">
                          <h5 className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-3">Recharge Packages</h5>
                          {prod.packages.length === 0 ? (
                            <p className="text-slate-600 text-xs italic">No packages listed under this product yet.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {prod.packages.map((pkg) => (
                                <div key={pkg.id} className="border border-slate-900/60 rounded-lg p-3 bg-slate-950/60 flex items-center justify-between gap-2">
                                  <div>
                                    <div className="font-bold text-white text-xs flex items-center space-x-1.5">
                                      <Gem className="h-3 w-3 text-cyan-400 shrink-0" />
                                      <span>{pkg.name}</span>
                                    </div>
                                    <div className="text-[10px] text-cyan-400 font-bold mt-1">${pkg.price.toFixed(2)}</div>
                                    <div className="text-[9px] text-slate-500 font-mono mt-0.5">Amt: {pkg.amount}</div>
                                  </div>
                                  <button
                                    onClick={() => handleDeletePackage(pkg.id)}
                                    className="p-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all shrink-0"
                                    title="Delete Package"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </>
  );
}
