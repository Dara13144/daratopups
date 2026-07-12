'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchAdminStats, fetchAdminOrders, updateAdminOrderStatus,
  fetchAdminStock, addAdminStock, fetchProducts, GameProduct,
  addAdminProduct, addAdminPackage, deleteAdminProduct, deleteAdminPackage
} from '../../lib/api';
import {
  ShoppingBag, Database, TrendingUp, CheckCircle, Clock, Plus, RefreshCw,
  Search, Trash2, Gem, LogOut, Image as ImageIcon, Upload, Package,
  ChevronRight, BarChart3, X, AlertCircle, Zap, Star, DollarSign
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'orders' | 'stock' | 'products'>('metrics');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [popularity, setPopularity] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderFilter, setOrderFilter] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [stocks, setStocks] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<GameProduct[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [newVoucherCodes, setNewVoucherCodes] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('MOBILE_GAME');
  const [newProductImage, setNewProductImage] = useState('');
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState('');
  const [editIsDragging, setEditIsDragging] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newPackageName, setNewPackageName] = useState('');
  const [newPackageAmount, setNewPackageAmount] = useState('');
  const [newPackagePrice, setNewPackagePrice] = useState('');
  const [newPackageCategory, setNewPackageCategory] = useState('NORMAL');
  const [newPackageBadge, setNewPackageBadge] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [promptCode, setPromptCode] = useState('');
  const [activePromptOrderId, setActivePromptOrderId] = useState<string | null>(null);

  const loadAllData = async () => {
    setLoading(true); setError('');
    try {
      const statsRes = await fetchAdminStats();
      setMetrics(statsRes.metrics); setRecentOrders(statsRes.recentOrders); setPopularity(statsRes.popularity);
      const ordersRes = await fetchAdminOrders(); setOrders(ordersRes);
      const stockRes = await fetchAdminStock(); setStocks(stockRes.stocks);
      const prodRes = await fetchProducts(); setAllProducts(prodRes);
      if (prodRes.length > 0) {
        setSelectedProductId(prodRes[0].id);
        if (prodRes[0].packages.length > 0) setSelectedPackageId(prodRes[0].packages[0].id);
      }
    } catch { setError('Failed to load data. Is backend running?'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('user_role');
    if (!token || role !== 'ADMIN') { router.push('/login'); return; }
    setIsAdmin(true); loadAllData();
  }, [router]);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 4000); return () => clearTimeout(t); } }, [success]);
  useEffect(() => { if (error) { const t = setTimeout(() => setError(''), 6000); return () => clearTimeout(t); } }, [error]);

  const uploadImageToServer = async (file: File): Promise<string> => {
    setUploadingImage(true);
    try {
      const token = localStorage.getItem('token') || '';
      const form = new FormData(); form.append('image', file);
      const res = await fetch(`${API_BASE}/api/admin/upload-image`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      return `${API_BASE}${data.imageUrl}`;
    } finally { setUploadingImage(false); }
  };

  const handleImageFileDrop = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setProductImageFile(file); setProductImagePreview(URL.createObjectURL(file)); setNewProductImage('');
  }, []);

  const handleEditImageFileDrop = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setEditImageFile(file); setEditImagePreview(URL.createObjectURL(file));
  }, []);

  const handleUpdateStatus = async (id: string, status: string, code?: string) => {
    setActionLoading(true); setError(''); setSuccess('');
    try {
      await updateAdminOrderStatus(id, status, code);
      setSuccess(`Order updated to ${status}`); setActivePromptOrderId(null); setPromptCode('');
      await loadAllData();
    } catch (err: any) { setError('Failed: ' + err.message); }
    finally { setActionLoading(false); }
  };

  const handleAddStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackageId || !newVoucherCodes.trim()) { setError('Select package and enter codes'); return; }
    setActionLoading(true); setError(''); setSuccess('');
    try {
      const data = await addAdminStock(selectedPackageId, newVoucherCodes);
      setSuccess(data.message || 'Stock uploaded'); setNewVoucherCodes('');
      const stockRes = await fetchAdminStock(); setStocks(stockRes.stocks);
    } catch (err: any) { setError('Failed: ' + err.message); }
    finally { setActionLoading(false); }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) { setError('Product name required'); return; }
    setActionLoading(true); setError(''); setSuccess('');
    try {
      let imageUrl = newProductImage;
      if (productImageFile) imageUrl = await uploadImageToServer(productImageFile);
      const res = await addAdminProduct(newProductName, newProductCategory, imageUrl || undefined);
      setSuccess(res.message || 'Product created');
      setNewProductName(''); setNewProductImage(''); setProductImageFile(null); setProductImagePreview('');
      await loadAllData();
    } catch (err: any) { setError('Failed: ' + err.message); }
    finally { setActionLoading(false); }
  };

  const handleUpdateProductImage = async (productId: string) => {
    if (!editImageFile) { setError('Select image first'); return; }
    setActionLoading(true); setError(''); setSuccess('');
    try {
      const imageUrl = await uploadImageToServer(editImageFile);
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${API_BASE}/api/admin/products/${productId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ image: imageUrl }),
      });
      if (!res.ok) throw new Error('Update failed');
      setSuccess('Image updated!'); setEditingProductId(null); setEditImageFile(null); setEditImagePreview('');
      await loadAllData();
    } catch (err: any) { setError('Failed: ' + err.message); }
    finally { setActionLoading(false); }
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !newPackageName.trim() || !newPackageAmount || !newPackagePrice) { setError('All fields required'); return; }
    setActionLoading(true); setError(''); setSuccess('');
    try {
      const res = await addAdminPackage(selectedProductId, newPackageName, parseInt(newPackageAmount, 10), parseFloat(newPackagePrice), newPackageCategory, newPackageBadge || undefined);
      setSuccess(res.message || 'Package created');
      setNewPackageName(''); setNewPackageAmount(''); setNewPackagePrice(''); setNewPackageCategory('NORMAL'); setNewPackageBadge('');
      await loadAllData();
    } catch (err: any) { setError('Failed: ' + err.message); }
    finally { setActionLoading(false); }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Delete this product and all packages?')) return;
    setActionLoading(true); setError(''); setSuccess('');
    try { await deleteAdminProduct(id); setSuccess('Product deleted'); await loadAllData(); }
    catch (err: any) { setError('Failed: ' + err.message); }
    finally { setActionLoading(false); }
  };

  const handleDeletePackage = async (id: string) => {
    if (!window.confirm('Delete this package?')) return;
    setActionLoading(true); setError(''); setSuccess('');
    try { await deleteAdminPackage(id); setSuccess('Package deleted'); await loadAllData(); }
    catch (err: any) { setError('Failed: ' + err.message); }
    finally { setActionLoading(false); }
  };

  const handleSearchOrders = async () => {
    setLoading(true);
    try { const r = await fetchAdminOrders(orderFilter || undefined, orderSearch || undefined); setOrders(r); }
    catch { setError('Search failed'); }
    finally { setLoading(false); }
  };

  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user_role'); router.push('/login'); };

  const getStatusBadge = (status: string) => {
    const b = 'inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full border';
    if (status === 'COMPLETED' || status === 'SUCCESS') return <span className={`${b} bg-emerald-500/10 text-emerald-400 border-emerald-500/20`}>✓ SUCCESS</span>;
    if (status === 'PENDING') return <span className={`${b} bg-amber-500/10 text-amber-400 border-amber-500/20`}>⏳ PENDING</span>;
    if (status === 'PROCESSING') return <span className={`${b} bg-cyan-500/10 text-cyan-400 border-cyan-500/20`}>⚡ PROCESS</span>;
    return <span className={`${b} bg-red-500/10 text-red-400 border-red-500/20`}>✗ FAILED</span>;
  };

  const getProductImgSrc = (img: string) => {
    if (!img) return 'https://placehold.co/48x48/1e293b/94a3b8?text=IMG';
    if (img.startsWith('http') || img.startsWith('blob')) return img;
    if (img.startsWith('/uploads')) return `${API_BASE}${img}`;
    return img;
  };

  const navItems = [
    { id: 'metrics', icon: BarChart3, label: 'Overview', count: null },
    { id: 'orders', icon: ShoppingBag, label: 'Orders', count: orders.length },
    { id: 'stock', icon: Database, label: 'Voucher Stock', count: stocks.filter((s: any) => !s.isUsed).length },
    { id: 'products', icon: Package, label: 'Products', count: allProducts.length },
  ] as const;

  if (!isAdmin) return null;

  const panelCls = 'border border-slate-800 rounded-2xl';
  const panelBg = { background: 'rgba(15,23,42,0.65)' };
  const inputCls = 'w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-xs';
  const btnGrad = { background: 'linear-gradient(to right,#06b6d4,#8b5cf6)' };

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-200" style={{ fontFamily: "'Inter',sans-serif" }}>

      {/* ══ SIDEBAR ══════════════════════════════════════════════════════ */}
      <aside style={{ width: sidebarOpen ? 240 : 64, transition: 'width .3s', flexShrink: 0 }}
        className="fixed top-0 left-0 h-full z-30 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden">
        {/* Logo */}
        <div className="flex items-center px-4 py-5 border-b border-slate-800 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg" style={{ background: 'linear-gradient(135deg,#06b6d4,#8b5cf6)' }}>
            <Zap className="h-5 w-5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="ml-3 overflow-hidden">
              <div className="text-white font-black text-sm">𝘿𝘼𝙍𝘼-𝙏𝙊𝙋𝙐𝙋</div>
              <div className="text-[10px] text-cyan-400 font-semibold">Admin Panel</div>
            </div>
          )}
        </div>
        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative ${activeTab === item.id ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              style={{ gap: 12 }}>
              {activeTab === item.id && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-500 rounded-r-full" />}
              <item.icon className={`h-4 w-4 shrink-0 ${activeTab === item.id ? 'text-cyan-400' : 'text-slate-500'}`} />
              {sidebarOpen && <>
                <span className="flex-1 text-left whitespace-nowrap">{item.label}</span>
                {item.count !== null && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === item.id ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-500'}`}>{item.count}</span>}
              </>}
            </button>
          ))}
        </nav>
        {/* Bottom */}
        <div className="px-2 py-4 border-t border-slate-800 space-y-1">
          <button onClick={() => setSidebarOpen(v => !v)} className="w-full flex items-center px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 text-sm font-semibold transition-all" style={{ gap: 12 }}>
            <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
            {sidebarOpen && <span className="whitespace-nowrap">Collapse</span>}
          </button>
          <button onClick={handleLogout} className="w-full flex items-center px-3 py-2.5 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/10 text-sm font-semibold transition-all" style={{ gap: 12 }}>
            <LogOut className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span className="whitespace-nowrap">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ══ MAIN ══════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-h-screen" style={{ marginLeft: sidebarOpen ? 240 : 64, transition: 'margin-left .3s' }}>
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-3.5 border-b border-slate-800" style={{ background: 'rgba(2,6,23,.95)', backdropFilter: 'blur(12px)' }}>
          <div>
            <h1 className="text-base font-black text-white">{navItems.find(n => n.id === activeTab)?.label}</h1>
            <p className="text-[10px] text-slate-500">𝘿𝘼𝙍𝘼-𝙏𝙊𝙋𝙐𝙋 Admin Dashboard</p>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={loadAllData} disabled={loading} className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /><span>Sync</span>
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs" style={{ background: 'linear-gradient(135deg,#06b6d4,#8b5cf6)' }}>A</div>
          </div>
        </header>

        {/* Toast notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2" style={{ width: 320 }}>
          {error && <div className="flex items-start bg-red-950 border border-red-800/70 rounded-xl p-4 text-red-300 text-xs shadow-2xl" style={{ gap: 10 }}>
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /><span className="flex-1">{error}</span><button onClick={() => setError('')}><X className="h-3.5 w-3.5 opacity-60 hover:opacity-100" /></button>
          </div>}
          {success && <div className="flex items-start bg-emerald-950 border border-emerald-800/70 rounded-xl p-4 text-emerald-300 text-xs shadow-2xl" style={{ gap: 10 }}>
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" /><span className="flex-1">{success}</span><button onClick={() => setSuccess('')}><X className="h-3.5 w-3.5 opacity-60 hover:opacity-100" /></button>
          </div>}
        </div>

        {/* Page content */}
        <main className="flex-1 p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="h-10 w-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-400 text-xs">Loading dashboard...</p>
            </div>
          ) : (<>

            {/* ── TAB 1: OVERVIEW ─────────────────────────────────── */}
            {activeTab === 'metrics' && metrics && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                  {[
                    { label: 'Total Revenue', value: `$${metrics.totalRevenue.toFixed(2)}`, Icon: DollarSign, clr: '#10b981', bg: 'rgba(16,185,129,.08)', sub: 'Completed orders' },
                    { label: 'Completed', value: metrics.completedOrders, Icon: CheckCircle, clr: '#06b6d4', bg: 'rgba(6,182,212,.08)', sub: 'Delivered' },
                    { label: 'Pending', value: metrics.pendingOrders, Icon: Clock, clr: '#f59e0b', bg: 'rgba(245,158,11,.08)', sub: 'Awaiting payment' },
                    { label: 'Total Orders', value: metrics.totalOrders, Icon: ShoppingBag, clr: '#8b5cf6', bg: 'rgba(139,92,246,.08)', sub: 'All time' },
                  ].map(card => (
                    <div key={card.label} className={`${panelCls} p-5 hover:border-slate-700 transition-all`} style={panelBg}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-slate-400 text-xs font-semibold">{card.label}</span>
                        <div className="p-2 rounded-xl" style={{ background: card.bg }}><card.Icon className="h-4 w-4" style={{ color: card.clr }} /></div>
                      </div>
                      <div className="text-3xl font-black text-white mb-1">{card.value}</div>
                      <div className="text-[10px] text-slate-500">{card.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className={`xl:col-span-2 ${panelCls} p-5`} style={panelBg}>
                    <h3 className="text-white font-extrabold text-sm mb-4 flex items-center space-x-2"><TrendingUp className="h-4 w-4 text-cyan-400" /><span>Recent Transactions</span></h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead><tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider">
                          {['Game','Player','Amount','Status'].map(h=><th key={h} className="py-2 pr-4 font-semibold">{h}</th>)}
                        </tr></thead>
                        <tbody className="divide-y divide-slate-800">
                          {recentOrders.map((o: any) => (
                            <tr key={o.id} className="hover:bg-slate-800/20">
                              <td className="py-2.5 pr-4 text-white font-semibold">{o.package?.product?.name||'—'}</td>
                              <td className="py-2.5 pr-4 text-slate-300">{o.playerNickname||o.playerId}</td>
                              <td className="py-2.5 pr-4 text-cyan-400 font-bold">${o.price.toFixed(2)}</td>
                              <td className="py-2.5">{getStatusBadge(o.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className={`${panelCls} p-5`} style={panelBg}>
                    <h3 className="text-white font-extrabold text-sm mb-4 flex items-center space-x-2"><Star className="h-4 w-4 text-amber-400" /><span>Popularity</span></h3>
                    <div className="space-y-3">
                      {popularity.map((g: any, i: number) => (
                        <div key={g.name} className="flex items-center" style={{ gap: 10 }}>
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                            style={{ background: i===0?'rgba(245,158,11,.2)':'rgba(51,65,85,.5)', color: i===0?'#f59e0b':'#64748b' }}>{i+1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-xs font-bold truncate">{g.name}</div>
                            <div className="mt-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width:`${Math.max(5,(g.salesCount/(popularity[0]?.salesCount||1))*100)}%`, background:'linear-gradient(to right,#06b6d4,#8b5cf6)' }} />
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold shrink-0">{g.salesCount}</span>
                        </div>
                      ))}
                      {!popularity.length && <p className="text-slate-600 text-xs text-center py-6">No data yet</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: ORDERS ──────────────────────────────────── */}
            {activeTab === 'orders' && (
              <div className="space-y-5">
                <div className={`flex flex-wrap gap-3 items-center ${panelCls} p-4`} style={panelBg}>
                  <select value={orderFilter} onChange={e=>setOrderFilter(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs px-3 py-2 focus:outline-none focus:border-cyan-500">
                    <option value="">All Statuses</option>
                    {['PENDING','COMPLETED','SUCCESS','FAILED'].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                  <div className="flex-1 relative" style={{ minWidth: 200 }}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <input type="text" placeholder="Search player, txn ID..." value={orderSearch}
                      onChange={e=>setOrderSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSearchOrders()}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500" />
                  </div>
                  <button onClick={handleSearchOrders} className="px-4 py-2 rounded-lg text-xs font-bold" style={{ background:'rgba(6,182,212,.1)', border:'1px solid rgba(6,182,212,.2)', color:'#06b6d4' }}>Search</button>
                  <button onClick={()=>{setOrderFilter('');setOrderSearch('');loadAllData();}} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 text-xs font-bold hover:text-white">Reset</button>
                  <span className="text-xs text-slate-500 ml-auto">{orders.length} records</span>
                </div>
                <div className={`${panelCls} overflow-hidden`} style={panelBg}>
                  <div className="overflow-x-auto" style={{ maxHeight: 580, overflowY:'auto' }}>
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 border-b border-slate-800" style={{ background:'#0f172a' }}>
                        <tr className="text-slate-500 uppercase tracking-wider">
                          {['Txn ID','Game / Package','Player','Amount','Method','Status','Date','Actions'].map(h=><th key={h} className="px-4 py-3 font-semibold whitespace-nowrap">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {orders.map((o: any) => (
                          <React.Fragment key={o.id}>
                            <tr className="hover:bg-slate-800/20">
                              <td className="px-4 py-3 font-mono text-slate-400 text-[10px] whitespace-nowrap">{o.paymentTxnId?.slice(0,18)}…</td>
                              <td className="px-4 py-3"><div className="text-white font-semibold whitespace-nowrap">{o.package?.product?.name}</div><div className="text-slate-500 text-[10px]">{o.package?.name}</div></td>
                              <td className="px-4 py-3"><div className="text-slate-200 whitespace-nowrap">{o.playerNickname||'—'}</div><div className="text-slate-500 font-mono text-[10px]">{o.playerId}</div></td>
                              <td className="px-4 py-3 text-cyan-400 font-bold whitespace-nowrap">${o.price.toFixed(2)}</td>
                              <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{o.paymentMethod}</td>
                              <td className="px-4 py-3">{getStatusBadge(o.status)}</td>
                              <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString()}</td>
                              <td className="px-4 py-3">
                                {o.status==='PENDING'&&(
                                  <div className="flex items-center space-x-1">
                                    <button onClick={()=>setActivePromptOrderId(o.id===activePromptOrderId?null:o.id)} className="px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap" style={{ background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.2)', color:'#10b981' }}>✓ Complete</button>
                                    <button onClick={()=>handleUpdateStatus(o.id,'FAILED')} disabled={actionLoading} className="px-2 py-1 rounded text-[10px] font-bold" style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', color:'#ef4444' }}>✗</button>
                                  </div>
                                )}
                              </td>
                            </tr>
                            {activePromptOrderId===o.id&&(
                              <tr><td colSpan={8} className="px-4 pb-3" style={{ background:'rgba(16,185,129,.03)' }}>
                                <div className="flex items-center space-x-2 mt-2">
                                  <input type="text" placeholder="Delivery code (optional)" value={promptCode} onChange={e=>setPromptCode(e.target.value)}
                                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none" />
                                  <button onClick={()=>handleUpdateStatus(o.id,'SUCCESS',promptCode||undefined)} disabled={actionLoading} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background:'rgba(16,185,129,.2)', border:'1px solid rgba(16,185,129,.3)', color:'#10b981' }}>Confirm</button>
                                  <button onClick={()=>setActivePromptOrderId(null)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-bold hover:text-white">Cancel</button>
                                </div>
                              </td></tr>
                            )}
                          </React.Fragment>
                        ))}
                        {!orders.length&&<tr><td colSpan={8} className="px-4 py-12 text-center text-slate-600 text-xs">No orders found</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 3: STOCK ──────────────────────────────────── */}
            {activeTab==='stock'&&(
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className={`${panelCls} p-5 h-fit`} style={panelBg}>
                  <h3 className="text-white font-extrabold text-sm mb-4 flex items-center space-x-2"><Plus className="h-4 w-4 text-cyan-400" /><span>Upload Voucher Codes</span></h3>
                  <form onSubmit={handleAddStockSubmit} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">Package</label>
                      <select value={selectedPackageId} onChange={e=>setSelectedPackageId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg text-slate-300 p-2.5 focus:outline-none focus:border-cyan-500">
                        {allProducts.map(prod=>prod.packages.map(pkg=><option key={pkg.id} value={pkg.id}>{prod.name} — {pkg.name}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">Codes (one per line)</label>
                      <textarea required rows={6} placeholder={"CODE-001\nCODE-002"} value={newVoucherCodes} onChange={e=>setNewVoucherCodes(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono resize-none text-xs" />
                    </div>
                    <button type="submit" disabled={actionLoading} className="w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-white font-bold text-xs disabled:opacity-50" style={btnGrad}>
                      <Upload className="h-3.5 w-3.5" /><span>Upload Stock</span>
                    </button>
                  </form>
                </div>
                <div className={`xl:col-span-2 ${panelCls} overflow-hidden`} style={panelBg}>
                  <div className="flex items-center justify-between p-5 border-b border-slate-800">
                    <h3 className="text-white font-extrabold text-sm flex items-center space-x-2"><Database className="h-4 w-4 text-cyan-400" /><span>Inventory</span></h3>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="px-2 py-0.5 rounded font-bold" style={{ background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.2)', color:'#10b981' }}>{stocks.filter((s:any)=>!s.isUsed).length} avail</span>
                      <span className="px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-500">{stocks.filter((s:any)=>s.isUsed).length} used</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto" style={{ maxHeight:480, overflowY:'auto' }}>
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 border-b border-slate-800" style={{ background:'rgba(15,23,42,.95)' }}>
                        <tr className="text-slate-500 uppercase tracking-wider">
                          {['Package','Code','Status','Added'].map(h=><th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {stocks.map((st:any)=>(
                          <tr key={st.id} className="hover:bg-slate-800/20">
                            <td className="px-4 py-3"><div className="text-white font-semibold">{st.package?.product?.name}</div><div className="text-slate-500 text-[10px]">{st.package?.name}</div></td>
                            <td className="px-4 py-3 font-mono text-slate-300">{st.code}</td>
                            <td className="px-4 py-3">{st.isUsed?<span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-900 text-slate-500 border border-slate-800">USED</span>:<span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.2)', color:'#10b981' }}>AVAIL</span>}</td>
                            <td className="px-4 py-3 text-slate-500">{new Date(st.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 4: PRODUCTS ──────────────────────────────── */}
            {activeTab==='products'&&(
              <div className="space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Add Product */}
                  <div className={`${panelCls} p-5`} style={panelBg}>
                    <h3 className="text-white font-extrabold text-sm mb-5 flex items-center space-x-2"><Plus className="h-4 w-4 text-cyan-400" /><span>Add Game Product</span></h3>
                    <form onSubmit={handleCreateProduct} className="space-y-4">
                      <div><label className="block text-slate-400 font-semibold mb-1.5 text-xs">Product Name</label>
                        <input type="text" required placeholder="e.g. Free Fire, Mobile Legends" value={newProductName} onChange={e=>setNewProductName(e.target.value)} className={inputCls} /></div>
                      <div><label className="block text-slate-400 font-semibold mb-1.5 text-xs">Category</label>
                        <select value={newProductCategory} onChange={e=>setNewProductCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg text-slate-300 p-2.5 focus:outline-none focus:border-cyan-500 text-xs">
                          <option value="MOBILE_GAME">Mobile Game</option><option value="PC_GAME">PC Game</option><option value="VOUCHER">Voucher</option>
                        </select></div>
                      {/* Drag & Drop */}
                      <div><label className="block text-slate-400 font-semibold mb-1.5 text-xs">Product Image</label>
                        <div
                          onDragOver={e=>{e.preventDefault();setIsDragging(true);}}
                          onDragLeave={()=>setIsDragging(false)}
                          onDrop={e=>{e.preventDefault();setIsDragging(false);const f=e.dataTransfer.files[0];if(f)handleImageFileDrop(f);}}
                          onClick={()=>fileInputRef.current?.click()}
                          className="cursor-pointer rounded-xl flex flex-col items-center justify-center p-5 text-center transition-all"
                          style={{ border:`2px dashed ${isDragging?'#06b6d4':'#334155'}`, background:isDragging?'rgba(6,182,212,.06)':'rgba(15,23,42,.4)' }}>
                          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)handleImageFileDrop(f);}} />
                          {productImagePreview?(
                            <div className="relative">
                              <img src={productImagePreview} alt="Preview" className="h-20 w-20 rounded-xl object-cover mx-auto mb-2 shadow-lg" />
                              <button type="button" onClick={e=>{e.stopPropagation();setProductImageFile(null);setProductImagePreview('');}} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"><X className="h-3 w-3"/></button>
                              <p className="text-slate-400 text-[10px] mt-1">{productImageFile?.name}</p>
                            </div>
                          ):(
                            <><div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mb-2"><ImageIcon className="h-5 w-5 text-slate-500"/></div>
                            <p className="text-slate-400 font-semibold text-[11px]">Drag & drop or click to upload</p>
                            <p className="text-slate-600 text-[10px] mt-0.5">PNG, JPG, WebP · Max 5MB</p></>
                          )}
                        </div>
                        {!productImagePreview&&<input type="text" placeholder="Or paste image URL..." value={newProductImage} onChange={e=>setNewProductImage(e.target.value)} className={`${inputCls} mt-2`} />}
                      </div>
                      <button type="submit" disabled={actionLoading||uploadingImage} className="w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-white font-bold text-xs disabled:opacity-50 transition-all" style={btnGrad}>
                        {uploadingImage?<><div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"/><span>Uploading...</span></>:<><Plus className="h-3.5 w-3.5"/><span>Create Product</span></>}
                      </button>
                    </form>
                  </div>

                  {/* Add Package */}
                  <div className={`${panelCls} p-5`} style={panelBg}>
                    <h3 className="text-white font-extrabold text-sm mb-5 flex items-center space-x-2"><Gem className="h-4 w-4 text-cyan-400"/><span>Add Diamond Package</span></h3>
                    <form onSubmit={handleCreatePackage} className="space-y-4">
                      <div><label className="block text-slate-400 font-semibold mb-1.5 text-xs">Game Product</label>
                        <select value={selectedProductId} onChange={e=>setSelectedProductId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg text-slate-300 p-2.5 focus:outline-none focus:border-cyan-500 text-xs">
                          {allProducts.map(p=><option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
                        </select></div>
                      <div><label className="block text-slate-400 font-semibold mb-1.5 text-xs">Package Name</label>
                        <input type="text" required placeholder="e.g. 50 Diamonds, 100+10 Diamonds" value={newPackageName} onChange={e=>setNewPackageName(e.target.value)} className={inputCls}/></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-slate-400 font-semibold mb-1.5 text-xs">Amount</label>
                          <input type="number" required placeholder="50" value={newPackageAmount} onChange={e=>setNewPackageAmount(e.target.value)} className={inputCls}/></div>
                        <div><label className="block text-slate-400 font-semibold mb-1.5 text-xs">Price (USD)</label>
                          <input type="number" step="0.01" required placeholder="0.99" value={newPackagePrice} onChange={e=>setNewPackagePrice(e.target.value)} className={inputCls}/></div>
                      </div>
                      <div><label className="block text-slate-400 font-semibold mb-1.5 text-xs">Category</label>
                        <select value={newPackageCategory} onChange={e=>setNewPackageCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg text-slate-300 p-2.5 focus:outline-none focus:border-cyan-500 text-xs">
                          <option value="NORMAL">Normal</option><option value="BEST_SELLER">Best Seller</option>
                        </select></div>
                      <div><label className="block text-slate-400 font-semibold mb-1.5 text-xs">Badge (optional)</label>
                        <input type="text" placeholder="e.g. 🔥 Best Value" value={newPackageBadge} onChange={e=>setNewPackageBadge(e.target.value)} className={inputCls}/></div>
                      <button type="submit" disabled={actionLoading} className="w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-white font-bold text-xs disabled:opacity-50 transition-all" style={btnGrad}>
                        <Plus className="h-3.5 w-3.5"/><span>Create Package</span>
                      </button>
                    </form>
                  </div>
                </div>

                {/* Catalog */}
                <div className={`${panelCls} p-5`} style={panelBg}>
                  <h3 className="text-white font-extrabold text-sm mb-5 flex items-center space-x-2"><Database className="h-4 w-4 text-cyan-400"/><span>Product Catalog ({allProducts.length})</span></h3>
                  <div className="space-y-5">
                    {allProducts.map(prod=>(
                      <div key={prod.id} className="border border-slate-800 rounded-xl overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4" style={{ background:'rgba(15,23,42,.5)' }}>
                          {/* Image + hover edit */}
                          <div className="relative group shrink-0">
                            <img src={getProductImgSrc(prod.image)} alt={prod.name}
                              onError={e=>{(e.target as HTMLImageElement).src='https://placehold.co/48x48/1e293b/94a3b8?text=IMG';}}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-800 shadow-md"/>
                            <button onClick={()=>{setEditingProductId(prod.id===editingProductId?null:prod.id);setEditImageFile(null);setEditImagePreview('');}}
                              title="Change image" className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-700 border border-slate-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                              <ImageIcon className="h-2.5 w-2.5"/>
                            </button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-white font-black text-sm">{prod.name}</h4>
                              <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded" style={{ background:'rgba(6,182,212,.1)', border:'1px solid rgba(6,182,212,.2)', color:'#06b6d4' }}>{prod.category}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">/{prod.slug}</p>
                          </div>
                          <button onClick={()=>handleDeleteProduct(prod.id)} disabled={actionLoading}
                            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all shrink-0"
                            style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', color:'#f87171' }}>
                            <Trash2 className="h-3 w-3"/><span>Delete</span>
                          </button>
                        </div>

                        {/* Inline image editor */}
                        {editingProductId===prod.id&&(
                          <div className="border-t border-slate-800 p-4" style={{ background:'rgba(6,182,212,.02)' }}>
                            <p className="text-xs text-slate-400 font-semibold mb-3 flex items-center space-x-1.5">
                              <ImageIcon className="h-3.5 w-3.5 text-cyan-400"/><span>Update image for <span className="text-white">{prod.name}</span></span>
                            </p>
                            <div
                              onDragOver={e=>{e.preventDefault();setEditIsDragging(true);}}
                              onDragLeave={()=>setEditIsDragging(false)}
                              onDrop={e=>{e.preventDefault();setEditIsDragging(false);const f=e.dataTransfer.files[0];if(f)handleEditImageFileDrop(f);}}
                              onClick={()=>editFileInputRef.current?.click()}
                              className="cursor-pointer rounded-xl flex flex-col items-center justify-center p-4 text-center mb-3 transition-all"
                              style={{ border:`2px dashed ${editIsDragging?'#06b6d4':'#334155'}`, background:editIsDragging?'rgba(6,182,212,.06)':'rgba(15,23,42,.4)' }}>
                              <input ref={editFileInputRef} type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)handleEditImageFileDrop(f);}}/>
                              {editImagePreview?(
                                <div className="flex items-center space-x-3">
                                  <img src={editImagePreview} alt="Preview" className="h-14 w-14 rounded-xl object-cover shadow"/>
                                  <div className="text-left"><p className="text-white text-xs font-bold">{editImageFile?.name}</p><p className="text-slate-400 text-[10px]">Ready to upload</p></div>
                                </div>
                              ):(
                                <><Upload className="h-5 w-5 text-slate-500 mb-1"/><p className="text-slate-400 text-[11px] font-semibold">Drag & drop or click</p></>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <button onClick={()=>handleUpdateProductImage(prod.id)} disabled={!editImageFile||actionLoading||uploadingImage}
                                className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                                style={{ background:'rgba(6,182,212,.15)', border:'1px solid rgba(6,182,212,.3)', color:'#06b6d4' }}>
                                {uploadingImage?<><div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin"/><span>Uploading...</span></>:<><Upload className="h-3 w-3"/><span>Save Image</span></>}
                              </button>
                              <button onClick={()=>{setEditingProductId(null);setEditImageFile(null);setEditImagePreview('');}} className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-bold hover:text-white">Cancel</button>
                            </div>
                          </div>
                        )}

                        {/* Packages grid */}
                        <div className="p-4 border-t border-slate-800">
                          <h5 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3">Diamond Packages ({prod.packages.length})</h5>
                          {prod.packages.length===0?<p className="text-slate-600 text-xs italic">No packages yet.</p>:(
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                              {prod.packages.map(pkg=>(
                                <div key={pkg.id} className="group relative border border-slate-800 rounded-xl p-3 hover:border-slate-700 transition-all" style={{ background:'rgba(15,23,42,.5)' }}>
                                  <div className="flex items-center space-x-1.5 mb-2"><Gem className="h-3 w-3 text-cyan-400 shrink-0"/><span className="text-white font-bold text-xs truncate">{pkg.name}</span></div>
                                  <div className="text-cyan-400 font-black text-sm">${pkg.price.toFixed(2)}</div>
                                  <div className="text-[9px] text-slate-500 mt-0.5">×{pkg.amount}</div>
                                  {pkg.badge&&<div className="mt-1 text-[9px] text-amber-400 font-bold truncate">{pkg.badge}</div>}
                                  {pkg.category==='BEST_SELLER'&&<div className="text-[9px] text-violet-400 font-bold">★ Best Seller</div>}
                                  <button onClick={()=>handleDeletePackage(pkg.id)} disabled={actionLoading} title="Delete"
                                    className="absolute top-1.5 right-1.5 p-1 rounded opacity-0 group-hover:opacity-100 transition-all"
                                    style={{ background:'rgba(239,68,68,.1)', color:'#f87171' }}>
                                    <Trash2 className="h-2.5 w-2.5"/>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {!allProducts.length&&<div className="text-center py-12 text-slate-600 text-xs">No products yet.</div>}
                  </div>
                </div>
              </div>
            )}
          </>)}
        </main>
      </div>
    </div>
  );
}


