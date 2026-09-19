'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Key, Globe, CheckCircle2, AlertCircle, RefreshCw,
  Zap, Save, RotateCcw, Copy, Check, Eye, EyeOff,
  Server, ShieldCheck, Sparkles, Terminal, Activity,
  Sliders, Link2, Database, Code, FileJson
} from 'lucide-react';
import {
  fetchAdminApiSettings,
  updateAdminApiSettings,
  testAdminApiConnection,
  resetAdminApiSettings,
  DynamicApiSettings,
  ApiPreset
} from '../lib/api';

export default function ApiSettingsDashboard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [settings, setSettings] = useState<DynamicApiSettings>({
    providerApiKey: '',
    providerStock1Url: 'https://www.vngzz2game.site/api/v1/game',
    providerStock2Url: 'https://www.vngzz2game.site/api/v1/game2',
    providerV2Url: 'https://www.vngzz2game.site/api/v2/game',
    providerActiveStock: 2,
    providerActiveUrl: 'https://www.vngzz2game.site/api/v1/game2',
    providerAutoDelivery: true,
    bakongMerchantName: 'NA-DY TOPUP ll',
    bakongAccountId: 'dara_khqr@aba',
  });

  const [presets, setPresets] = useState<ApiPreset[]>([]);
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    status: number;
    latencyMs: number;
    message: string;
    data?: any;
  } | null>(null);

  // Live Payload Inspector State
  const [inspectorEndpoint, setInspectorEndpoint] = useState<string>('/profile');
  const [inspectorLoading, setInspectorLoading] = useState(false);
  const [inspectorPayload, setInspectorPayload] = useState<any>(null);
  const [inspectorStatus, setInspectorStatus] = useState<number | null>(null);
  const [inspectorTime, setInspectorTime] = useState<number | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetchAdminApiSettings();
      if (res.success && res.settings) {
        setSettings(res.settings);
        setPresets(res.presets || []);
      }
    } catch (err: any) {
      console.warn('Failed to load API settings:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Could not load API settings' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await updateAdminApiSettings(settings);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: '✅ All systems updated! Active API Key, Provider Base URL, and Gateways are now live across the website.',
        });
        if (res.settings) {
          setSettings(res.settings);
        }
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save API settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testAdminApiConnection(settings.providerApiKey, settings.providerActiveUrl);
      setTestResult({
        tested: true,
        success: res.success,
        status: res.status,
        latencyMs: res.latencyMs,
        message: res.message,
        data: res.data,
      });
    } catch (err: any) {
      setTestResult({
        tested: true,
        success: false,
        status: 500,
        latencyMs: 0,
        message: err.message || 'Connection test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('Reset all API settings and provider URLs to factory defaults?')) {
      return;
    }
    setResetting(true);
    setStatusMessage(null);
    try {
      const res = await resetAdminApiSettings();
      if (res.success && res.settings) {
        setSettings(res.settings);
        setStatusMessage({ type: 'success', text: 'Settings restored to factory defaults.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to reset settings' });
    } finally {
      setResetting(false);
    }
  };

  const applyPreset = (preset: ApiPreset) => {
    setSettings((prev) => ({
      ...prev,
      providerActiveUrl: preset.url,
      providerActiveStock: preset.stock,
    }));
    setStatusMessage({
      type: 'success',
      text: `Preset applied: ${preset.name} (${preset.url}). Click "Save & Apply All Systems" to finalize.`,
    });
  };

  const copyApiKey = () => {
    if (!settings.providerApiKey) return;
    navigator.clipboard.writeText(settings.providerApiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6 animate-admin-tab">
      {/* ── Header Banner with Realtime Status ── */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-pink-500/20 p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-black uppercase tracking-wider">
              <Key className="h-3.5 w-3.5" />
              <span>Live API Management System</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>API & Provider Configuration</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Dynamically switch and configure the upstream game top-up API Key, Provider Base URLs, stock versions, and payment gateways. Changes apply <strong>instantaneously</strong> across player ID lookup, auto-orders, reseller balance, and catalog sync without server restarts.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || loading}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 shadow-md flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Zap className={`h-4 w-4 text-cyan-400 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <button
              type="button"
              onClick={loadSettings}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
              title="Reload from Database"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Live Systems Badge Bar */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap gap-2 text-[11px]">
          <span className="text-slate-400 font-semibold self-center mr-1">Systems Connected:</span>
          {[
            { name: 'Player ID Validator (/api/lookup)', status: 'Live Dynamic' },
            { name: 'Diamond Orders Delivery', status: settings.providerAutoDelivery ? 'Auto-Fulfill ON' : 'Manual' },
            { name: 'VNGZZ Reseller Gateway', status: `Stock ${settings.providerActiveStock}` },
            { name: 'ABA KHQR Balance Deposit', status: 'Live ABA' },
            { name: 'PostgreSQL Realtime Sync', status: 'Active' },
          ].map((sys) => (
            <span
              key={sys.name}
              className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-slate-300 flex items-center space-x-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="font-medium text-white">{sys.name}</span>
              <span className="text-pink-400 font-mono text-[10px]">({sys.status})</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Status Alerts ── */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200'
              : 'bg-red-950/80 border border-red-500/50 text-red-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white text-sm cursor-pointer ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Test Connection Result Banner ── */}
      {testResult && (
        <div
          className={`p-4 rounded-2xl border animate-in zoom-in-95 duration-150 ${
            testResult.success
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-100'
              : 'bg-red-950/60 border-red-500/40 text-red-100'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center space-x-2.5">
              {testResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-black text-sm flex items-center space-x-2">
                  <span>{testResult.success ? 'API Connection Verified Successfully' : 'Connection Test Failed'}</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-black/40 border border-white/10">
                    HTTP {testResult.status} • {testResult.latencyMs}ms
                  </span>
                </div>
                <p className="text-xs mt-1 text-slate-300">{testResult.message}</p>
                {testResult.data?.user && (
                  <div className="mt-2 text-[11px] font-mono flex items-center gap-3 flex-wrap bg-black/30 p-2 rounded-lg border border-white/5">
                    <span>Reseller: <strong className="text-white">{testResult.data.user.username}</strong></span>
                    <span>Balance: <strong className="text-emerald-400">${testResult.data.user.balance} {testResult.data.user.currency}</strong></span>
                    <span>Role: <strong className="text-pink-300">{testResult.data.user.role}</strong></span>
                    <span>Orders: <strong className="text-cyan-300">{testResult.data.user.total_orders || 0}</strong></span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setTestResult(null)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── 1-Click Presets ── */}
      <div className="rounded-3xl bg-black/40 border border-white/10 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-pink-400" />
            <span>1-Click Provider Presets</span>
          </h3>
          <span className="text-[11px] text-slate-400">Click a preset to quickly switch active endpoint</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              name: 'VNGZZ Stock 2 (Recommended)',
              url: 'https://www.vngzz2game.site/api/v1/game2',
              stock: 2 as const,
              badge: 'Default Live',
              description: 'Official Stock 2 Moonton / MLBB & 150+ games with instant KHQR balance',
            },
            {
              name: 'VNGZZ Stock 1',
              url: 'https://www.vngzz2game.site/api/v1/game',
              stock: 1 as const,
              badge: 'Alternative',
              description: 'Stock 1 catalog & legacy game packages proxy',
            },
            {
              name: 'VNGZZ API v2 Gateway',
              url: 'https://www.vngzz2game.site/api/v2/game',
              stock: 2 as const,
              badge: 'Next Gen v2',
              description: 'Next-generation V2 API endpoint (/api/v2/game)',
            },
          ].map((preset) => {
            const isSelected = settings.providerActiveUrl === preset.url;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`p-4 rounded-2xl text-left transition-all border relative flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-pink-500/15 border-pink-500/60 shadow-lg shadow-pink-500/10'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-white">{preset.name}</span>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-pink-500 text-white'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {isSelected ? 'ACTIVE' : preset.badge}
                    </span>
                  </div>
                  <code className="text-[11px] font-mono text-cyan-300 block truncate">{preset.url}</code>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{preset.description}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-pink-400 font-bold">
                  <span>Switch to this API →</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Form: API Key & Endpoint Configuration ── */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-3xl bg-black/40 border border-white/10 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="h-4 w-4 text-cyan-400" />
              <span>Provider Credentials & Base Endpoints</span>
            </h3>
            <span className="text-[11px] text-slate-400">Stored safely in Supabase PostgreSQL</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Provider API Key */}
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>VNGZZ2GAME Reseller API Key</span>
                <span className="text-[10px] text-slate-500">Header: X-API-Key or Bearer</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type={showKey ? 'text' : 'password'}
                  required
                  value={settings.providerApiKey}
                  onChange={(e) => setSettings({ ...settings, providerApiKey: e.target.value })}
                  placeholder="e.g. pwS5VEcfOkcN7skP5TRuWdUDdS9ZqG9m"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/15 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-pink-500 pr-24"
                />
                <div className="absolute right-2 flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                    title={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={copyApiKey}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                    title="Copy API Key"
                  >
                    {copiedKey ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Obtain your API Key from your VNGZZ2GAME Reseller Account profile (<code className="text-pink-300 font-mono">vngzz2game.site</code>).
              </p>
            </div>

            {/* Active Provider Base URL */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Active Target Base URL</span>
                <span className="text-[10px] text-emerald-400 font-bold">Currently Routing Here</span>
              </label>
              <input
                type="url"
                required
                value={settings.providerActiveUrl}
                onChange={(e) => setSettings({ ...settings, providerActiveUrl: e.target.value })}
                placeholder="https://www.vngzz2game.site/api/v1/game2"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-xs font-mono text-cyan-300 focus:outline-none focus:border-pink-500"
              />
              <p className="text-[11px] text-slate-400">
                All player ID checks, pricing sync, and top-up orders will query this primary endpoint.
              </p>
            </div>

            {/* Active Stock Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Default Gateway Stock Version</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, providerActiveStock: 2 })}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    settings.providerActiveStock === 2
                      ? 'bg-pink-500/20 border-pink-500 text-white shadow-md'
                      : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="block font-black">Stock 2 (/game2)</span>
                  <span className="text-[10px] text-slate-400">Moonton & Special Packages</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, providerActiveStock: 1 })}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    settings.providerActiveStock === 1
                      ? 'bg-pink-500/20 border-pink-500 text-white shadow-md'
                      : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="block font-black">Stock 1 (/game)</span>
                  <span className="text-[10px] text-slate-400">Standard Catalog</span>
                </button>
              </div>
            </div>

            {/* Stock 1 URL */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Stock 1 Fallback URL</label>
              <input
                type="url"
                value={settings.providerStock1Url}
                onChange={(e) => setSettings({ ...settings, providerStock1Url: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-slate-300 focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Stock 2 URL */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Stock 2 Fallback URL</label>
              <input
                type="url"
                value={settings.providerStock2Url}
                onChange={(e) => setSettings({ ...settings, providerStock2Url: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-slate-300 focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* V2 URL */}
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-bold text-slate-300">API v2 Gateway URL</label>
              <input
                type="url"
                value={settings.providerV2Url}
                onChange={(e) => setSettings({ ...settings, providerV2Url: e.target.value })}
                placeholder="https://www.vngzz2game.site/api/v2/game"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-slate-300 focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>
        </div>

        {/* ── Order Automation & Payment Gateway Configuration ── */}
        <div className="rounded-3xl bg-black/40 border border-white/10 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              <span>Order Automation & Payment Gateways</span>
            </h3>
            <span className="text-[11px] text-slate-400">Instant customer delivery</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Auto Delivery Switch */}
            <div className="lg:col-span-2 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-black text-white block">
                  Automatic Diamond Top-Up on Confirmed Payment
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  When enabled, paid orders trigger the active Provider API immediately to recharge diamonds into the player&apos;s game account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, providerAutoDelivery: !settings.providerAutoDelivery })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.providerAutoDelivery ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.providerAutoDelivery ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Bakong Merchant Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Bakong KHQR Merchant Name</label>
              <input
                type="text"
                value={settings.bakongMerchantName}
                onChange={(e) => setSettings({ ...settings, bakongMerchantName: e.target.value })}
                placeholder="NADY TOPUP"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Bakong Account ID */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Bakong Account ID / Phone</label>
              <input
                type="text"
                value={settings.bakongAccountId}
                onChange={(e) => setSettings({ ...settings, bakongAccountId: e.target.value })}
                placeholder="dara_khqr@aba"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-cyan-300 focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>
        </div>

        {/* ── Save / Reset Actions Bar ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={resetting || saving}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-red-300 border border-slate-800 text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <RotateCcw className={`h-4 w-4 ${resetting ? 'animate-spin' : ''}`} />
            <span>Reset to Factory Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || saving}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-black text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Zap className={`h-4 w-4 text-cyan-400 ${testing ? 'animate-spin' : ''}`} />
              <span>Test Live Connection</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-linear-to-r from-pink-500 via-rose-500 to-violet-600 hover:brightness-110 text-white font-black text-xs shadow-lg shadow-pink-500/25 flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Save & Apply All Systems</span>
            </button>
          </div>
        </div>
      </form>

      {/* ── Live API Payload Inspector Card (Addresses "didn't show payload on frontend") ── */}
      <div className="rounded-3xl bg-black/40 border border-white/10 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <FileJson className="h-4 w-4 text-cyan-400" />
              <span>Live API Payload Inspector & Debugger</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect real-time JSON responses and data payloads directly returned from the active Provider API.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={async () => {
                setInspectorLoading(true);
                setInspectorPayload(null);
                setInspectorStatus(null);
                const start = Date.now();
                try {
                  const base = settings.providerActiveUrl.replace(/\/+$/, '');
                  let target = `${base}${inspectorEndpoint}`;
                  if (inspectorEndpoint === '/check_id') {
                    target += '?game=freefire_sgmy&id=12345678';
                  } else if (inspectorEndpoint === '/products') {
                    target += '?game_code=freefire_sgmy';
                  }

                  let res;
                  if (inspectorEndpoint === '/deposit') {
                    res = await fetch('/api/v1/game2/deposit', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': settings.providerApiKey,
                      },
                      body: JSON.stringify({ amount: 1.0, currency: 'USD' }),
                    });
                  } else {
                    res = await fetch(target, {
                      headers: {
                        'X-API-Key': settings.providerApiKey,
                        'Accept': 'application/json',
                      },
                    });
                  }

                  const timeMs = Date.now() - start;
                  setInspectorTime(timeMs);
                  setInspectorStatus(res.status);
                  const json = await res.json().catch(() => ({ status: res.status, error: 'Non-JSON response' }));
                  setInspectorPayload(json);
                } catch (err: any) {
                  setInspectorTime(Date.now() - start);
                  setInspectorStatus(500);
                  setInspectorPayload({ error: err.message || 'Fetch error' });
                } finally {
                  setInspectorLoading(false);
                }
              }}
              disabled={inspectorLoading}
              className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${inspectorLoading ? 'animate-spin' : ''}`} />
              <span>{inspectorLoading ? 'Querying...' : 'Fetch Live Payload'}</span>
            </button>

            {inspectorPayload && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(inspectorPayload, null, 2));
                  setCopiedPayload(true);
                  setTimeout(() => setCopiedPayload(false), 2000);
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center space-x-1"
                title="Copy Payload"
              >
                {copiedPayload ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedPayload ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Endpoint Selector Tabs */}
        <div className="flex overflow-x-auto mobile-touch-scroll gap-2 border-b border-white/10 pb-3">
          {[
            { id: '/profile', label: '1. /profile (Reseller Stats)', desc: 'Live balance & connected account' },
            { id: '/check_id', label: '2. /check_id (Player Lookup)', desc: 'Sample ID validation response' },
            { id: '/categories', label: '3. /categories (Game Catalog)', desc: '190+ supported categories' },
            { id: '/products', label: '4. /products (Tier Pricing)', desc: 'Packages & price array' },
            { id: '/deposit', label: '5. /deposit (ABA KHQR)', desc: 'Generated KHQR payment payload' },
          ].map((ep) => (
            <button
              key={ep.id}
              type="button"
              onClick={() => {
                setInspectorEndpoint(ep.id);
                setInspectorPayload(null);
                setInspectorStatus(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                inspectorEndpoint === ep.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md'
                  : 'bg-slate-950 border border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <span>{ep.label}</span>
            </button>
          ))}
        </div>

        {/* Live Payload Viewer Terminal */}
        <div className="rounded-2xl bg-slate-950 border border-white/10 overflow-hidden font-mono text-xs">
          <div className="p-3 bg-black/60 border-b border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              <span className="text-white font-bold ml-2">
                GET {settings.providerActiveUrl}{inspectorEndpoint}
              </span>
            </div>
            {inspectorStatus && (
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    inspectorStatus === 200
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  HTTP {inspectorStatus}
                </span>
                {inspectorTime !== null && <span className="text-slate-500">{inspectorTime}ms</span>}
              </div>
            )}
          </div>

          <div className="p-4 max-h-96 overflow-y-auto overflow-x-auto mobile-touch-scroll">
            {inspectorLoading ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-cyan-400" />
                <p>Querying {settings.providerActiveUrl}{inspectorEndpoint}...</p>
              </div>
            ) : inspectorPayload ? (
              <pre className="text-emerald-300 leading-relaxed">
                {JSON.stringify(inspectorPayload, null, 2)}
              </pre>
            ) : (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Terminal className="h-6 w-6 mx-auto text-slate-600 opacity-60" />
                <p>Click &quot;Fetch Live Payload&quot; above to query the active provider API and inspect real-time response data.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
