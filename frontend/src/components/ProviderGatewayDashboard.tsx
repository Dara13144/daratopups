'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Zap, RefreshCw, CheckCircle2, XCircle, AlertCircle, QrCode,
  ExternalLink, Copy, Check, ShieldCheck, Wallet, ArrowUpRight,
  Search, Package, Layers, Terminal, Sparkles, Send, Eye, Key
} from 'lucide-react';
import ApiSettingsDashboard from './ApiSettingsDashboard';
import {
  fetchProviderProfile, checkPlayerIdViaProvider, fetchProviderCategories,
  fetchProviderProducts, createProviderOrder, checkProviderOrder,
  depositProviderBalance, ProviderProfile, ProviderCheckIdResult, ProviderDepositResult
} from '../lib/api';

const POPULAR_GAMES = [
  { code: 'freefire_sgmy', name: 'Free Fire (SG/MY/KH)', hasZone: false, sampleId: '12345678' },
  { code: 'freefire_kh', name: 'Free Fire (Cambodia)', hasZone: false, sampleId: '11676873799' },
  { code: 'mlbb_special', name: 'Mobile Legends (Asia/Special)', hasZone: true, sampleId: '1523754961', sampleZone: '11766' },
  { code: 'pubgm', name: 'PUBG Mobile', hasZone: false, sampleId: '55443322' },
  { code: 'hok', name: 'Honor of Kings', hasZone: false, sampleId: '12345678' },
  { code: 'farlight84', name: 'Farlight 84', hasZone: false, sampleId: '12345678' },
  { code: 'bloodstrike', name: 'Blood Strike', hasZone: false, sampleId: '12345678' },
  { code: 'genshin_impact', name: 'Genshin Impact', hasZone: false, sampleId: '800123456' },
  { code: 'roblox', name: 'Roblox (Username)', hasZone: false, sampleId: 'darazzdev' },
];

export default function ProviderGatewayDashboard() {
  // Stock Selection (1 or 2)
  const [selectedStock, setSelectedStock] = useState<1 | 2>(1);

  // Profile / Reseller State
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Sub-tabs: 'overview' | 'check_id' | 'deposit' | 'products' | 'order' | 'api_config'
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'check_id' | 'deposit' | 'products' | 'order' | 'api_config'>('overview');

  // Check ID Tool States
  const [checkGame, setCheckGame] = useState('freefire_sgmy');
  const [checkUserId, setCheckUserId] = useState('12345678');
  const [checkZoneId, setCheckZoneId] = useState('');
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<ProviderCheckIdResult | null>(null);
  const [checkError, setCheckError] = useState('');

  // Deposit States
  const [depositAmount, setDepositAmount] = useState<number>(1.0);
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositResult, setDepositResult] = useState<ProviderDepositResult | null>(null);
  const [depositError, setDepositError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Categories & Products States
  const [categories, setCategories] = useState<any[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [productGameCode, setProductGameCode] = useState('freefire_sgmy');
  const [productsList, setProductsList] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Order Placement / Check Order States
  const [orderProductCode, setOrderProductCode] = useState('FREEFIRE_SG_25');
  const [orderUserId, setOrderUserId] = useState('262856740');
  const [orderZoneId, setOrderZoneId] = useState('');
  const [orderReference, setOrderReference] = useState(`ORD-${Date.now()}`);
  const [orderPlacing, setOrderPlacing] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);

  // Check Order Status States
  const [checkRefInput, setCheckRefInput] = useState('');
  const [checkOrderLoading, setCheckOrderLoading] = useState(false);
  const [checkedOrderStatus, setCheckedOrderStatus] = useState<any>(null);

  // Load Profile
  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError('');
    try {
      const data = await fetchProviderProfile(selectedStock);
      setProfile(data);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to connect to provider gateway');
    } finally {
      setProfileLoading(false);
    }
  }, [selectedStock]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Handle Check ID
  const handleCheckId = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!checkUserId.trim()) return;
    setCheckLoading(true);
    setCheckError('');
    setCheckResult(null);
    try {
      const res = await checkPlayerIdViaProvider(checkGame, checkUserId, checkZoneId || undefined, selectedStock);
      setCheckResult(res);
      if (res.status !== 'APPROVED' && !res.valid && !res.username) {
        setCheckError(res.message || res.error || 'Player ID could not be verified by provider');
      }
    } catch (err: any) {
      setCheckError(err.message || 'Validation request failed');
    } finally {
      setCheckLoading(false);
    }
  };

  // Handle Deposit
  const handleCreateDeposit = async (amountToUse?: number) => {
    const amt = amountToUse ?? depositAmount;
    if (!amt || amt <= 0) {
      setDepositError('Please enter an amount greater than $0');
      return;
    }
    setDepositLoading(true);
    setDepositError('');
    setDepositResult(null);
    try {
      const res = await depositProviderBalance(amt, 'USD', selectedStock);
      setDepositResult(res);
    } catch (err: any) {
      setDepositError(err.message || 'Failed to generate ABA KHQR deposit');
    } finally {
      setDepositLoading(false);
    }
  };

  // Handle Load Categories
  const handleLoadCategories = async () => {
    setCatLoading(true);
    try {
      const res = await fetchProviderCategories(selectedStock);
      const list = Array.isArray(res) ? res : res.data || res.categories || [];
      setCategories(list);
    } catch (err) {
      console.warn('Failed to fetch categories:', err);
    } finally {
      setCatLoading(false);
    }
  };

  // Handle Load Products
  const handleLoadProducts = async (code: string) => {
    setProductsLoading(true);
    try {
      const res = await fetchProviderProducts(code, selectedStock);
      const list = Array.isArray(res) ? res : res.products || res.data || [];
      setProductsList(list);
    } catch (err) {
      console.warn('Failed to fetch products:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  // Handle Create Order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderProductCode || !orderUserId || !orderReference) return;
    setOrderPlacing(true);
    setOrderResult(null);
    try {
      const res = await createProviderOrder({
        product_code: orderProductCode,
        game_user_id: orderUserId,
        reference: orderReference,
        server_id: orderZoneId || undefined,
        stock: selectedStock,
      });
      setOrderResult(res);
      // Refresh profile balance automatically
      loadProfile();
    } catch (err: any) {
      setOrderResult({ status: 'FAILED', message: err.message || 'Order failed' });
    } finally {
      setOrderPlacing(false);
    }
  };

  // Handle Check Order
  const handleCheckOrder = async () => {
    if (!checkRefInput.trim()) return;
    setCheckOrderLoading(true);
    setCheckedOrderStatus(null);
    try {
      const res = await checkProviderOrder(checkRefInput.trim(), selectedStock);
      setCheckedOrderStatus(res);
    } catch (err: any) {
      setCheckedOrderStatus({ status: 'FAILED', message: err.message });
    } finally {
      setCheckOrderLoading(false);
    }
  };

  const currentBalance = profile?.user?.balance ?? 0.10;
  const username = profile?.user?.username ?? 'darazzdev';
  const role = profile?.user?.role ?? 'reseller';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Top Header Banner ── */}
      <div className="rounded-3xl bg-linear-to-r from-purple-950/80 via-slate-900/90 to-pink-950/80 border border-pink-500/30 p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <span className="p-2 rounded-2xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
                <Zap className="h-5 w-5 animate-pulse" />
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                VNGZZ2GAME Provider Gateway
              </h2>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span>LIVE CONNECTED</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Real-time API gateway directly connected to <strong className="text-white">vngzz2game.site</strong>. Handles player ID validation across 150+ games, live product pricing, instant top-up order placement, and ABA KHQR reseller balance deposits.
            </p>
          </div>

          {/* Stock Gateway Selector */}
          <div className="flex items-center space-x-2 bg-black/40 p-1.5 rounded-2xl border border-white/10 shrink-0">
            <button
              onClick={() => setSelectedStock(2)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                selectedStock === 2
                  ? 'bg-linear-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Stock 2</span>
              <span className="text-[10px] opacity-75 font-mono">/game2</span>
            </button>
            <button
              onClick={() => setSelectedStock(1)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                selectedStock === 1
                  ? 'bg-linear-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Stock 1</span>
              <span className="text-[10px] opacity-75 font-mono">/game</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Quick Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold mb-1">
              <span>Reseller Balance</span>
              <Wallet className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-emerald-400 font-mono">
                ${Number(currentBalance).toFixed(2)}
              </span>
              <span className="text-[11px] text-slate-400">USD</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold mb-1">
              <span>Reseller Account</span>
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="text-lg font-black text-white truncate font-mono">
              {username}
            </div>
            <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
              {role}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold mb-1">
              <span>API Gateway Host</span>
              <Terminal className="h-4 w-4 text-pink-400" />
            </div>
            <div className="text-xs font-bold text-slate-200 font-mono truncate">
              vngzz2game.site
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              /api/v1/game{selectedStock === 2 ? '2' : ''}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold">
              <span>Quick Top Up</span>
              <button
                onClick={() => loadProfile()}
                disabled={profileLoading}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                title="Refresh Reseller Balance"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${profileLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <button
              onClick={() => {
                setActiveSubTab('deposit');
                handleCreateDeposit(1.0);
              }}
              className="w-full mt-1.5 py-1.5 px-3 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-xs hover:brightness-110 shadow-md flex items-center justify-center space-x-1 transition-all"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>Deposit via ABA KHQR</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Sub Navigation Tabs ── */}
      <div className="flex overflow-x-auto mobile-touch-scroll flex-nowrap sm:flex-wrap gap-2 border-b border-pink-500/20 pb-3">
        {[
          { id: 'overview', label: 'Gateway Overview & Key', icon: Terminal },
          { id: 'check_id', label: 'Validate Player ID (150+ Games)', icon: CheckCircle2 },
          { id: 'deposit', label: 'Instant ABA KHQR Deposit', icon: QrCode },
          { id: 'products', label: '190+ Categories & Packages', icon: Layers },
          { id: 'order', label: 'Test Top-Up Order & Status', icon: Package },
          { id: 'api_config', label: '⚙️ Change API & URLs', icon: Key },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center space-x-2 transition-all shrink-0 active:scale-95 cursor-pointer ${
                isActive
                  ? 'bg-linear-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25'
                  : 'bg-black/30 text-slate-400 hover:text-white hover:bg-black/50 border border-white/5'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── SUB-TAB 1: OVERVIEW & API ENDPOINTS ── */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-admin-tab">
          <div className="rounded-3xl bg-black/40 border border-white/10 p-6 space-y-4">
            <h3 className="text-base font-black text-white flex items-center space-x-2">
              <Terminal className="h-4 w-4 text-pink-400" />
              <span>Active Endpoints ({selectedStock === 2 ? 'Stock 2' : 'Stock 1'})</span>
            </h3>
            <p className="text-xs text-slate-400">
              Both stocks are fully proxied via our backend and frontend router. Any client or server can query these routes with your API key:
            </p>

            <div className="space-y-2 text-xs font-mono">
              {[
                { method: 'GET', path: `/api/v1/game${selectedStock === 2 ? '2' : ''}/profile`, desc: 'Reseller balance & stats' },
                { method: 'GET', path: `/api/v1/game${selectedStock === 2 ? '2' : ''}/check_id`, desc: 'Validate player ID with name & region' },
                { method: 'GET', path: `/api/v1/game${selectedStock === 2 ? '2' : ''}/categories`, desc: 'List of 190+ game categories' },
                { method: 'GET', path: `/api/v1/game${selectedStock === 2 ? '2' : ''}/products`, desc: 'Packages & prices for a game' },
                { method: 'POST', path: `/api/v1/game${selectedStock === 2 ? '2' : ''}/create_order`, desc: 'Place top-up order & deliver' },
                { method: 'GET', path: `/api/v1/game${selectedStock === 2 ? '2' : ''}/check_order`, desc: 'Check order status by reference' },
                { method: 'POST', path: `/api/v1/game${selectedStock === 2 ? '2' : ''}/deposit`, desc: 'Create instant ABA KHQR deposit' },
              ].map((ep, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${ep.method === 'POST' ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
                      {ep.method}
                    </span>
                    <span className="text-white font-bold">{ep.path}</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">{ep.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-black/40 border border-white/10 p-6 space-y-4">
            <h3 className="text-base font-black text-white flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Gateway Credentials & Security</span>
            </h3>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Reseller API Key
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="password"
                    readOnly
                    value="pwS5VEcfOkcN7skP5TRuWdUDdS9ZqG9m"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-pink-300"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('pwS5VEcfOkcN7skP5TRuWdUDdS9ZqG9m');
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="p-2 rounded-xl bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 border border-pink-500/30"
                    title="Copy API Key"
                  >
                    {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Base API URL
                </label>
                <div className="px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-slate-300">
                  https://www.vngzz2game.site/api/v1/game{selectedStock === 2 ? '2' : ''}
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-400 space-y-1">
                <p>• Header required: <code className="text-pink-300 font-mono">X-API-Key: pwS5VE...</code></p>
                <p>• Automatic failover: Queries Stock 1 first, automatically falls back to Stock 2 if busy.</p>
                <p>• In-game checkout lookup uses fast concurrent Promise caching for sub-500ms nickname response.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SUB-TAB 2: VALIDATE PLAYER ID ── */}
      {activeSubTab === 'check_id' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-admin-tab">
          <div className="lg:col-span-5 rounded-3xl bg-black/40 border border-white/10 p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-pink-400" />
              <h3 className="text-base font-black text-white">Live Player ID Validator</h3>
            </div>
            <p className="text-xs text-slate-400">
              Test live validation across 150+ games with username and server/region response.
            </p>

            <form onSubmit={handleCheckId} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Select Game</label>
                <select
                  value={checkGame}
                  onChange={(e) => {
                    const found = POPULAR_GAMES.find(g => g.code === e.target.value);
                    setCheckGame(e.target.value);
                    if (found) {
                      setCheckUserId(found.sampleId);
                      setCheckZoneId(found.sampleZone || '');
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-pink-500"
                >
                  {POPULAR_GAMES.map((g) => (
                    <option key={g.code} value={g.code}>
                      {g.name} ({g.code})
                    </option>
                  ))}
                  <option value="custom">Custom Game Code...</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Player ID / User ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 12345678"
                  value={checkUserId}
                  onChange={(e) => setCheckUserId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Server ID / Zone ID <span className="text-slate-500">(Required for MLBB)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 11766"
                  value={checkZoneId}
                  onChange={(e) => setCheckZoneId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <button
                type="submit"
                disabled={checkLoading}
                className="w-full py-3 rounded-xl bg-linear-to-r from-pink-500 to-rose-600 text-white font-black text-xs hover:brightness-110 shadow-lg shadow-pink-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {checkLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span>{checkLoading ? 'Validating Player ID...' : 'Validate ID via Provider'}</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 rounded-3xl bg-black/40 border border-white/10 p-6 space-y-4">
            <h3 className="text-base font-black text-white flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span>Validation Result</span>
            </h3>

            {checkLoading && (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
                <RefreshCw className="h-8 w-8 text-pink-400 animate-spin" />
                <p className="text-xs">Querying provider gateway...</p>
              </div>
            )}

            {!checkLoading && checkResult && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className={`p-4 rounded-2xl border ${
                  checkResult.status === 'APPROVED' || checkResult.valid || checkResult.username
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-300">Status</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                      checkResult.status === 'APPROVED' || checkResult.valid
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {checkResult.status || (checkResult.valid ? 'APPROVED' : 'FAILED')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-black/40">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Player Nickname</span>
                      <span className="text-base font-black text-white">{checkResult.username || 'N/A'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Region / Server</span>
                      <span className="text-base font-black text-cyan-300">{checkResult.region || 'Asia / SG'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Raw JSON Output
                  </span>
                  <pre className="p-4 rounded-2xl bg-black/70 border border-white/10 text-xs font-mono text-emerald-300 overflow-x-auto">
                    {JSON.stringify(checkResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {!checkLoading && !checkResult && !checkError && (
              <div className="py-16 text-center text-slate-500 text-xs">
                Enter a Player ID on the left and click &quot;Validate ID via Provider&quot; to test real-time validation.
              </div>
            )}

            {checkError && !checkLoading && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 space-y-2">
                <div className="flex items-center space-x-2 font-bold">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <span>Validation Notice:</span>
                </div>
                <p>{checkError}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SUB-TAB 3: INSTANT ABA KHQR DEPOSIT ── */}
      {activeSubTab === 'deposit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-admin-tab">
          <div className="lg:col-span-5 rounded-3xl bg-black/40 border border-white/10 p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <QrCode className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-black text-white">Instant ABA KHQR Deposit</h3>
            </div>
            <p className="text-xs text-slate-400">
              Generate an instant official Bakong/ABA KHQR code to top up your reseller wallet balance.
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">Choose Preset Amount (USD)</label>
              <div className="grid grid-cols-3 gap-2">
                {[0.50, 1.00, 2.00, 5.00, 10.00, 20.00].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      setDepositAmount(amt);
                      handleCreateDeposit(amt);
                    }}
                    className={`py-2 rounded-xl text-xs font-black transition-all ${
                      depositAmount === amt
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    ${amt.toFixed(2)}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 mt-2">Custom Amount ($)</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    step="0.10"
                    min="0.10"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => handleCreateDeposit()}
                    disabled={depositLoading}
                    className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 shrink-0 flex items-center space-x-1"
                  >
                    {depositLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <QrCode className="h-3.5 w-3.5" />}
                    <span>Generate</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-3xl bg-black/40 border border-white/10 p-6 space-y-4">
            <h3 className="text-base font-black text-white flex items-center space-x-2">
              <Wallet className="h-4 w-4 text-emerald-400" />
              <span>Generated KHQR & Payment Links</span>
            </h3>

            {depositLoading && (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
                <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
                <p className="text-xs">Generating instant ABA KHQR code...</p>
              </div>
            )}

            {!depositLoading && depositResult && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col md:flex-row items-center gap-6">
                  {/* QR Image */}
                  {(depositResult.data?.qr_image || depositResult.data?.qr_image_url || depositResult.qr_image_url) && (
                    <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          depositResult.data?.qr_image?.startsWith('data:')
                            ? depositResult.data.qr_image
                            : (depositResult.data?.qr_image_url || depositResult.qr_image_url)
                        }
                        alt="Deposit ABA KHQR"
                        className="w-44 h-44 object-contain"
                      />
                    </div>
                  )}

                  <div className="space-y-2 text-xs flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-black text-white">
                        Scan to Pay ${depositResult.data?.amount || depositAmount}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                        PENDING SCAN
                      </span>
                    </div>

                    <p className="text-slate-300">
                      Open ABA Mobile, Bakong, or any Cambodian bank app and scan the QR code above.
                    </p>

                    {depositResult.data?.transaction_id && (
                      <div className="font-mono text-[11px] text-slate-400 pt-1">
                        Txn ID: <span className="text-cyan-300">{depositResult.data.transaction_id}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2">
                      {depositResult.data?.abamobile_deeplink && (
                        <a
                          href={depositResult.data.abamobile_deeplink}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Open in ABA Mobile</span>
                        </a>
                      )}
                      {(depositResult.data?.pay_url || depositResult.pay_url) && (
                        <a
                          href={depositResult.data?.pay_url || depositResult.pay_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          <span>Open Pay Page</span>
                        </a>
                      )}
                      <button
                        onClick={() => loadProfile()}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-xs flex items-center space-x-1"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Check Balance</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Raw Gateway Response
                  </span>
                  <pre className="p-3 rounded-2xl bg-black/70 border border-white/10 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-48">
                    {JSON.stringify(depositResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {!depositLoading && !depositResult && (
              <div className="py-16 text-center text-slate-500 text-xs">
                Select an amount on the left to generate an ABA KHQR deposit.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SUB-TAB 4: CATEGORIES & PACKAGES ── */}
      {activeSubTab === 'products' && (
        <div className="space-y-6 animate-admin-tab">
          <div className="rounded-3xl bg-black/40 border border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white flex items-center space-x-2">
                  <Layers className="h-4 w-4 text-pink-400" />
                  <span>190+ Game Categories on Provider</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Query live categories list from <code className="text-pink-300 font-mono">/api/v1/game{selectedStock === 2 ? '2' : ''}/categories</code>
                </p>
              </div>
              <button
                onClick={handleLoadCategories}
                disabled={catLoading}
                className="px-4 py-2 rounded-xl bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 border border-pink-500/40 text-xs font-bold flex items-center space-x-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${catLoading ? 'animate-spin' : ''}`} />
                <span>Load 190+ Categories</span>
              </button>
            </div>

            {categories.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-2 max-h-64 overflow-y-auto">
                {categories.map((c, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const code = c.game_code || c.code || c.slug || c.name;
                      if (code) {
                        setProductGameCode(code);
                        handleLoadProducts(code);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left text-xs text-slate-300 truncate"
                  >
                    <div className="font-bold text-white truncate">{c.category_name || c.name || c.game_title}</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">{c.game_code || c.code || c.id}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-black/40 border border-white/10 p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center space-x-2">
                  <Package className="h-4 w-4 text-cyan-400" />
                  <span>Packages & Prices for a Game</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Inspect packages via <code className="text-cyan-300 font-mono">/api/v1/game{selectedStock === 2 ? '2' : ''}/products?game_code=...</code>
                </p>
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g. freefire_sgmy"
                  value={productGameCode}
                  onChange={(e) => setProductGameCode(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={() => handleLoadProducts(productGameCode)}
                  disabled={productsLoading}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs hover:bg-cyan-400 shrink-0 flex items-center space-x-1"
                >
                  {productsLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                  <span>Search Packages</span>
                </button>
              </div>
            </div>

            {productsList.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {productsList.map((p, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{p.name || p.title || p.product_code}</div>
                      <div className="text-[10px] text-pink-400 font-mono">{p.product_code}</div>
                      {p.amount && <div className="text-[10px] text-slate-400">Amount: {p.amount}</div>}
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-emerald-400 font-mono">
                        ${Number(p.price || 0).toFixed(2)}
                      </div>
                      <button
                        onClick={() => {
                          setOrderProductCode(p.product_code);
                          setActiveSubTab('order');
                        }}
                        className="mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-pink-500/20 text-pink-300 hover:bg-pink-500/30"
                      >
                        Use in Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SUB-TAB 5: TEST TOP-UP ORDER & CHECK ORDER ── */}
      {activeSubTab === 'order' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-admin-tab">
          {/* Order Placement Form */}
          <div className="rounded-3xl bg-black/40 border border-white/10 p-6 space-y-4">
            <h3 className="text-base font-black text-white flex items-center space-x-2">
              <Send className="h-4 w-4 text-pink-400" />
              <span>Place Top-Up Order (Deducts Provider Balance)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Sends an immediate live recharge request to provider. Ensure your reseller balance is funded before placing an order.
            </p>

            <form onSubmit={handlePlaceOrder} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Product Code</label>
                <input
                  type="text"
                  required
                  placeholder="FREEFIRE_SG_25"
                  value={orderProductCode}
                  onChange={(e) => setOrderProductCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Game User ID / Player ID</label>
                <input
                  type="text"
                  required
                  placeholder="262856740"
                  value={orderUserId}
                  onChange={(e) => setOrderUserId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Server ID / Zone ID <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 11766"
                  value={orderZoneId}
                  onChange={(e) => setOrderZoneId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Order Reference</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    value={orderReference}
                    onChange={(e) => setOrderReference(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-cyan-300 focus:outline-none focus:border-pink-500"
                  />
                  <button
                    type="button"
                    onClick={() => setOrderReference(`ORD-${Date.now()}`)}
                    className="px-3 py-2 rounded-xl bg-white/10 text-slate-300 hover:text-white text-xs shrink-0"
                    title="Generate New Reference"
                  >
                    New
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={orderPlacing}
                className="w-full py-3 rounded-xl bg-linear-to-r from-pink-500 to-rose-600 text-white font-black text-xs hover:brightness-110 shadow-lg shadow-pink-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {orderPlacing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>{orderPlacing ? 'Placing Order on Provider...' : 'Send Top-Up Order'}</span>
              </button>
            </form>

            {orderResult && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Order Result
                </span>
                <pre className="p-3 rounded-2xl bg-black/70 border border-white/10 text-xs font-mono text-pink-300 overflow-x-auto">
                  {JSON.stringify(orderResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Check Order Status */}
          <div className="rounded-3xl bg-black/40 border border-white/10 p-6 space-y-4">
            <h3 className="text-base font-black text-white flex items-center space-x-2">
              <Search className="h-4 w-4 text-cyan-400" />
              <span>Check Order Status by Reference</span>
            </h3>
            <p className="text-xs text-slate-400">
              Query provider order status via <code className="text-cyan-300 font-mono">/api/v1/game{selectedStock === 2 ? '2' : ''}/check_order?reference=...</code>
            </p>

            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="e.g. ORD-1786687000"
                value={checkRefInput}
                onChange={(e) => setCheckRefInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleCheckOrder}
                disabled={checkOrderLoading}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs hover:bg-cyan-400 shrink-0 flex items-center space-x-1"
              >
                {checkOrderLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                <span>Check</span>
              </button>
            </div>

            {checkedOrderStatus && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Order Status Response
                </span>
                <pre className="p-3 rounded-2xl bg-black/70 border border-white/10 text-xs font-mono text-cyan-300 overflow-x-auto">
                  {JSON.stringify(checkedOrderStatus, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SUB-TAB 6: DYNAMIC API CONFIGURATION ── */}
      {activeSubTab === 'api_config' && (
        <div className="animate-admin-tab">
          <ApiSettingsDashboard />
        </div>
      )}
    </div>
  );
}
