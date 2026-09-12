'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldCheck, ShieldAlert, Zap, AlertTriangle, RefreshCw,
  Lock, Unlock, Activity, Ban, CheckCircle, Globe, Terminal,
  Sliders, Search, Clock, Trash2, Plus, ArrowUpRight, Cpu
} from 'lucide-react';
import {
  fetchSecurityStats, fetchSecurityLogs, fetchSecurityConfig,
  updateSecurityConfig, blockSecurityIp, unblockSecurityIp,
  allowSecurityIp, removeAllowSecurityIp, fetchMyIp
} from '../lib/api';

export default function SecurityDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [allowlist, setAllowlist] = useState<any[]>([]);
  const [blocklist, setBlocklist] = useState<any[]>([]);
  const [myIp, setMyIp] = useState<string>('127.0.0.1');

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Tab inside Security: 'overview' | 'access' | 'rules' | 'logs'
  const [secTab, setSecTab] = useState<'overview' | 'access' | 'rules' | 'logs'>('overview');

  // New Block/Allow Form States
  const [ipInput, setIpInput] = useState<string>('');
  const [reasonInput, setReasonInput] = useState<string>('');
  const [banDuration, setBanDuration] = useState<number>(15);
  const [accessSubTab, setAccessSubTab] = useState<'blocklist' | 'allowlist'>('blocklist');

  // Logs Filter
  const [logFilter, setLogFilter] = useState<string>('ALL');
  const [logSearch, setLogSearch] = useState<string>('');

  // Editable config copy
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState<number>(60);
  const [burstLimit, setBurstLimit] = useState<number>(20);
  const [spikeThreshold, setSpikeThreshold] = useState<number>(25);
  const [autoBanDuration, setAutoBanDuration] = useState<number>(15);
  const [wafEnabled, setWafEnabled] = useState<boolean>(true);
  const [savingConfig, setSavingConfig] = useState<boolean>(false);

  // Load all security telemetry
  const loadData = useCallback(async (silent: boolean = false) => {
    if (!silent) setRefreshing(true);
    setError('');
    try {
      const [statsData, logsData, configData, currentIp] = await Promise.all([
        fetchSecurityStats(),
        fetchSecurityLogs(100),
        fetchSecurityConfig(),
        fetchMyIp(),
      ]);

      setStats(statsData);
      setLogs(logsData.logs || []);
      setConfig(configData.config);
      setAllowlist(configData.allowlist || []);
      setBlocklist(configData.blocklist || []);
      setMyIp(currentIp);

      if (configData.config) {
        setRateLimitPerMinute(configData.config.rateLimitPerMinute);
        setBurstLimit(configData.config.burstLimit);
        setSpikeThreshold(configData.config.spikeThreshold);
        setAutoBanDuration(configData.config.autoBanDurationMinutes);
        setWafEnabled(configData.config.wafEnabled);
      }
    } catch (err: any) {
      if (!silent) setError(err.message || 'Failed to connect to security engine');
    } finally {
      if (!silent) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Live auto-refresh every 3 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      loadData(true);
    }, 3000);
    return () => clearInterval(timer);
  }, [autoRefresh, loadData]);

  // Notifications timeout
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(''), 4000);
      return () => clearTimeout(t);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(''), 6000);
      return () => clearTimeout(t);
    }
  }, [error]);

  // Toggle Under Attack Mode
  const handleToggleUnderAttack = async () => {
    if (!config) return;
    const nextState = !config.underAttackMode;
    const confirmMsg = nextState
      ? '🚨 ACTIVATE UNDER ATTACK MODE?\n\nThis will enforce strict rate limits and require visitors to pass a high-speed cryptographic browser check. Use this during DDoS floods.'
      : 'Deactivate Under Attack Mode and return to normal traffic filtering?';

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await updateSecurityConfig({ underAttackMode: nextState });
      setConfig(res.config);
      setSuccess(`Under Attack Mode has been ${nextState ? 'ACTIVATED' : 'DEACTIVATED'}`);
      loadData();
    } catch (err: any) {
      setError('Failed to update mode: ' + err.message);
    }
  };

  // Save Config Rules
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setError('');
    try {
      const res = await updateSecurityConfig({
        rateLimitPerMinute: Number(rateLimitPerMinute),
        burstLimit: Number(burstLimit),
        spikeThreshold: Number(spikeThreshold),
        autoBanDurationMinutes: Number(autoBanDuration),
        wafEnabled: Boolean(wafEnabled),
      });
      setConfig(res.config);
      setSuccess('Security protection parameters updated successfully!');
    } catch (err: any) {
      setError('Failed to save settings: ' + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  // Add Block
  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipInput.trim()) return setError('Please enter an IP address');
    try {
      await blockSecurityIp(ipInput.trim(), reasonInput.trim() || 'Manual Admin Ban', banDuration);
      setSuccess(`IP ${ipInput.trim()} added to blocklist.`);
      setIpInput('');
      setReasonInput('');
      loadData();
    } catch (err: any) {
      setError('Failed to block IP: ' + err.message);
    }
  };

  // Unblock IP
  const handleUnblock = async (ip: string) => {
    try {
      await unblockSecurityIp(ip);
      setSuccess(`IP ${ip} removed from blocklist.`);
      loadData();
    } catch (err: any) {
      setError('Failed to unblock: ' + err.message);
    }
  };

  // Add Allow (Whitelist)
  const handleAddAllow = async (ipToAllow?: string) => {
    const target = ipToAllow || ipInput.trim();
    if (!target) return setError('Please specify an IP address');
    try {
      await allowSecurityIp(target, 'Manual Admin Whitelist');
      setSuccess(`IP ${target} allowlisted successfully.`);
      if (!ipToAllow) setIpInput('');
      loadData();
    } catch (err: any) {
      setError('Failed to allowlist: ' + err.message);
    }
  };

  // Remove Allow
  const handleRemoveAllow = async (ip: string) => {
    try {
      await removeAllowSecurityIp(ip);
      setSuccess(`IP ${ip} removed from allowlist.`);
      loadData();
    } catch (err: any) {
      setError('Failed to remove: ' + err.message);
    }
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchType = logFilter === 'ALL' || log.action === logFilter;
      const matchSearch =
        !logSearch.trim() ||
        log.ip.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.reason.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.path.toLowerCase().includes(logSearch.toLowerCase());
      return matchType && matchSearch;
    });
  }, [logs, logFilter, logSearch]);

  const blockRate = stats && stats.totalRequests > 0
    ? ((stats.blockedRequests / stats.totalRequests) * 100).toFixed(1)
    : '0.0';

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="h-10 w-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-xs">Initializing NA-DY Shield Anti-DDoS Engine...</p>
      </div>
    );
  }

  const isUnderAttack = Boolean(config?.underAttackMode);

  return (
    <div className="space-y-6">

      {/* ─── ALERT / TOAST ────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs shadow-lg animate-in fade-in">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-white">✕</button>
        </div>
      )}

      {success && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs shadow-lg animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ─── TOP BANNER: UNDER ATTACK MODE EMERGENCY BAR ──────────────────────── */}
      <div className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 ${
        isUnderAttack
          ? 'bg-gradient-to-r from-red-950/90 via-slate-900 to-amber-950/90 border-red-500/80 shadow-[0_0_40px_rgba(239,68,68,0.25)]'
          : 'bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/50 border-slate-800'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
              isUnderAttack
                ? 'bg-red-500 text-white animate-pulse shadow-red-500/40'
                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
            }`}>
              {isUnderAttack ? <ShieldAlert className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black text-white">NA-DY Shield Anti-DDoS & WAF</h2>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border ${
                  isUnderAttack
                    ? 'bg-red-500/20 text-red-300 border-red-500/50 animate-pulse'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {isUnderAttack ? '● EMERGENCY ATTACK DEFENSE' : '● ACTIVE PROTECTION'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                {isUnderAttack
                  ? 'Under Attack Mode is ACTIVE. Strict rate-limits and cryptographic browser challenges are being enforced on all incoming visitors.'
                  : 'Real-time multi-layered defense active. Automatic spike detection, deep WAF pattern analysis, and sliding-window rate limiting.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
            <button
              onClick={() => loadData()}
              disabled={refreshing}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-all min-h-[38px]"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleToggleUnderAttack}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md min-h-[38px] ${
                isUnderAttack
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
                  : 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-red-600/30'
              }`}
            >
              <Zap className="h-4 w-4" />
              <span>{isUnderAttack ? 'Turn Off Attack Mode' : 'Under Attack Mode'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── LIVE METRICS CARDS ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* RPS */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-semibold">
            <span>Live Traffic Rate</span>
            <div className="flex items-center space-x-1 text-[10px] text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>LIVE</span>
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{stats?.currentRps || 0}</span>
            <span className="text-xs font-bold text-slate-500">RPS</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Peak: <span className="text-slate-300 font-bold">{stats?.peakRps || 0} req/s</span></p>
        </div>

        {/* Clean Requests */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-semibold">
            <span>Clean Traffic</span>
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">{stats?.cleanRequests || 0}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total: <span className="text-slate-300 font-bold">{stats?.totalRequests || 0} requests</span></p>
        </div>

        {/* Blocked Attacks */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-semibold">
            <span>Threats Blocked</span>
            <Ban className="h-4 w-4 text-red-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-red-400">{stats?.blockedRequests || 0}</span>
            <span className="text-xs font-bold text-red-400/80">({blockRate}%)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">WAF: <span className="text-slate-300 font-bold">{stats?.wafBlocked || 0}</span> | Rate: <span className="text-slate-300 font-bold">{stats?.rateLimitBlocked || 0}</span></p>
        </div>

        {/* Active Bans */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-semibold">
            <span>Active IP Bans</span>
            <Lock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-400">{stats?.activeBans || 0}</span>
            <span className="text-xs font-bold text-slate-500">IPs</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Auto-banned: <span className="text-slate-300 font-bold">{stats?.autoBannedBlocked || 0}</span></p>
        </div>
      </div>

      {/* ─── 30-MINUTE TRAFFIC HISTORY GRAPH (SVG) ────────────────────────────── */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-white flex items-center space-x-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <span>Traffic & Attack Distribution (Last 30 Min)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time volume: Clean requests vs Blocked malicious attempts</p>
          </div>
          <div className="flex items-center space-x-4 text-[11px] font-bold">
            <span className="flex items-center space-x-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span>Clean Traffic</span>
            </span>
            <span className="flex items-center space-x-1.5 text-red-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
              <span>Blocked Attacks</span>
            </span>
          </div>
        </div>

        {/* Dynamic SVG Chart */}
        <div className="w-full h-44 flex flex-col justify-end pt-4">
          {stats?.history && stats.history.length > 0 ? (
            <div className="w-full h-36 flex items-end justify-between gap-1 border-b border-slate-800 pb-1">
              {(() => {
                const maxVal = Math.max(...stats.history.map((h: any) => h.total), 10);
                return stats.history.map((h: any, idx: number) => {
                  const cleanHeight = Math.max(4, Math.round((h.clean / maxVal) * 120));
                  const blockedHeight = Math.max(h.blocked > 0 ? 6 : 0, Math.round((h.blocked / maxVal) * 120));
                  return (
                    <div key={`point-${idx}`} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-12 bg-slate-950 border border-slate-800 px-2 py-1 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 whitespace-nowrap shadow-xl">
                        <div className="font-bold">{h.time}</div>
                        <div className="text-emerald-400">Clean: {h.clean}</div>
                        <div className="text-red-400">Blocked: {h.blocked}</div>
                      </div>

                      {/* Bar columns */}
                      <div className="w-full flex flex-col items-center justify-end gap-0.5">
                        {blockedHeight > 0 && (
                          <div
                            style={{ height: `${blockedHeight}px` }}
                            className="w-full max-w-[14px] bg-red-500 rounded-t-xs transition-all duration-300"
                          />
                        )}
                        <div
                          style={{ height: `${cleanHeight}px` }}
                          className="w-full max-w-[14px] bg-emerald-500/80 rounded-t-xs hover:bg-emerald-400 transition-all duration-300"
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-xs text-slate-500">
              Gathering traffic samples...
            </div>
          )}
          {/* Time axis labels */}
          <div className="flex justify-between text-[10px] text-slate-600 pt-1.5 px-1">
            <span>30 mins ago</span>
            <span>15 mins ago</span>
            <span>Now</span>
          </div>
        </div>
      </div>

      {/* ─── SECURITY NAVIGATION SUB-TABS ──────────────────────────────────────── */}
      <div className="flex border-b border-slate-800 space-x-2">
        {[
          { id: 'overview', label: 'Threat Overview' },
          { id: 'access', label: `IP Access Rules (${blocklist.length + allowlist.length})` },
          { id: 'rules', label: 'Rate Limiter & WAF Rules' },
          { id: 'logs', label: `Live Incident Log (${logs.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSecTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[2px] ${
              secTab === tab.id
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── SUB-TAB 1: THREAT OVERVIEW ────────────────────────────────────────── */}
      {secTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Threat Breakdown */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <h4 className="text-xs font-black uppercase text-white tracking-wider">Mitigation Breakdown</h4>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>WAF Attacks Prevented (SQLi / XSS / Bad Bots)</span>
                  <span className="font-bold text-white">{stats?.wafBlocked || 0}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.min(100, (stats?.wafBlocked || 0) * 10)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Rate Limit Exceeded Blocks</span>
                  <span className="font-bold text-white">{stats?.rateLimitBlocked || 0}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, (stats?.rateLimitBlocked || 0) * 10)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Automated Spike Auto-Bans</span>
                  <span className="font-bold text-white">{stats?.autoBannedBlocked || 0}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-red-500 h-full rounded-full" style={{ width: `${Math.min(100, (stats?.autoBannedBlocked || 0) * 10)}%` }} />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Your Admin IP Address:</span>
              <div className="flex items-center space-x-2">
                <code className="text-cyan-300 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{myIp}</code>
                <button
                  onClick={() => handleAddAllow(myIp)}
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline"
                >
                  Whitelist My IP
                </button>
              </div>
            </div>
          </div>

          {/* System Defense Posture */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <h4 className="text-xs font-black uppercase text-white tracking-wider">Defense Engine Status</h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span className="text-slate-300">WAF Deep Inspection</span>
                </div>
                <span className="text-emerald-400 font-bold">ENABLED</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4 text-cyan-400" />
                  <span className="text-slate-300">Traffic Spike Velocity Sensor</span>
                </div>
                <span className="text-cyan-400 font-bold">MAX {config?.spikeThreshold || 25} REQ/3S</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center space-x-2">
                  <Sliders className="h-4 w-4 text-purple-400" />
                  <span className="text-slate-300">Sliding Window Rate Limit</span>
                </div>
                <span className="text-purple-400 font-bold">{config?.rateLimitPerMinute || 60} REQ/MIN</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-amber-400" />
                  <span className="text-slate-300">Under Attack Mode</span>
                </div>
                <span className={isUnderAttack ? 'text-red-400 font-bold animate-pulse' : 'text-slate-500 font-bold'}>
                  {isUnderAttack ? 'ACTIVATED' : 'STANDBY'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SUB-TAB 2: IP ACCESS RULES (BLOCKLIST & ALLOWLIST) ───────────────── */}
      {secTab === 'access' && (
        <div className="space-y-5">
          {/* Quick Add Form */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black uppercase text-white tracking-wider">
                {accessSubTab === 'blocklist' ? 'Manual IP Ban' : 'Add IP to Whitelist'}
              </h4>
              <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setAccessSubTab('blocklist')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    accessSubTab === 'blocklist' ? 'bg-red-500/20 text-red-300' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  Blocklist
                </button>
                <button
                  type="button"
                  onClick={() => setAccessSubTab('allowlist')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    accessSubTab === 'allowlist' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  Allowlist
                </button>
              </div>
            </div>

            <form
              onSubmit={accessSubTab === 'blocklist' ? handleAddBlock : (e) => { e.preventDefault(); handleAddAllow(); }}
              className="grid grid-cols-1 sm:grid-cols-12 gap-3"
            >
              <div className="sm:col-span-4">
                <input
                  type="text"
                  placeholder="IP Address (e.g. 192.168.1.1)"
                  value={ipInput}
                  onChange={(e) => setIpInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div className="sm:col-span-4">
                <input
                  type="text"
                  placeholder="Reason (e.g. Malicious probing)"
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {accessSubTab === 'blocklist' && (
                <div className="sm:col-span-2">
                  <select
                    value={banDuration}
                    onChange={(e) => setBanDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={60}>1 Hour</option>
                    <option value={1440}>24 Hours</option>
                    <option value={0}>Permanent Ban</option>
                  </select>
                </div>
              )}

              <div className={`sm:col-span-${accessSubTab === 'blocklist' ? '2' : '4'}`}>
                <button
                  type="submit"
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                    accessSubTab === 'blocklist'
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                  }`}
                >
                  {accessSubTab === 'blocklist' ? 'Ban IP' : 'Whitelist IP'}
                </button>
              </div>
            </form>
          </div>

          {/* List Display */}
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-white tracking-wider">
                {accessSubTab === 'blocklist' ? `Active Blocked IPs (${blocklist.length})` : `Whitelisted IPs (${allowlist.length})`}
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-500 font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">IP Address</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Hits Blocked</th>
                    <th className="px-4 py-3">Expires</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(accessSubTab === 'blocklist' ? blocklist : allowlist).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        {accessSubTab === 'blocklist' ? 'No blocked IPs at this time.' : 'No custom whitelisted IPs.'}
                      </td>
                    </tr>
                  ) : (
                    (accessSubTab === 'blocklist' ? blocklist : allowlist).map((rule: any) => (
                      <tr key={rule.ip} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-white flex items-center space-x-2">
                          {rule.type === 'BLOCK' ? (
                            <span className="w-2 h-2 rounded-full bg-red-400" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          )}
                          <span>{rule.ip}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{rule.reason || 'None provided'}</td>
                        <td className="px-4 py-3 text-slate-300 font-bold">{rule.hits || 0}</td>
                        <td className="px-4 py-3 text-slate-500">
                          {rule.expiresAt ? new Date(rule.expiresAt).toLocaleTimeString() : 'Permanent'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {rule.type === 'BLOCK' ? (
                            <button
                              onClick={() => handleUnblock(rule.ip)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 hover:text-white"
                            >
                              Unban
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRemoveAllow(rule.ip)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-400 text-[11px] font-bold border border-slate-700"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── SUB-TAB 3: CONFIGURABLE RATE LIMITING & WAF ──────────────────────── */}
      {secTab === 'rules' && (
        <form onSubmit={handleSaveConfig} className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-5">
          <div>
            <h4 className="text-xs font-black uppercase text-white tracking-wider">Rate Limiting & Threat Tuning</h4>
            <p className="text-xs text-slate-500 mt-0.5">Customize sliding window thresholds and automatic mitigation sensitivity.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex justify-between">
                <span>Standard Rate Limit (req / minute)</span>
                <span className="text-cyan-400">{rateLimitPerMinute} req/min</span>
              </label>
              <input
                type="range"
                min={15}
                max={300}
                step={5}
                value={rateLimitPerMinute}
                onChange={(e) => setRateLimitPerMinute(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <p className="text-[11px] text-slate-500">Maximum requests per single IP in a 60-second window before throttling.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex justify-between">
                <span>Burst Limit (req / 5 seconds)</span>
                <span className="text-cyan-400">{burstLimit} req/5s</span>
              </label>
              <input
                type="range"
                min={5}
                max={50}
                step={1}
                value={burstLimit}
                onChange={(e) => setBurstLimit(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <p className="text-[11px] text-slate-500">Permitted burst tolerance for rapid page clicks before temporary 429 response.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex justify-between">
                <span>Spike Flood Threshold (req / 3 seconds)</span>
                <span className="text-red-400">{spikeThreshold} req/3s</span>
              </label>
              <input
                type="range"
                min={10}
                max={60}
                step={2}
                value={spikeThreshold}
                onChange={(e) => setSpikeThreshold(Number(e.target.value))}
                className="w-full accent-red-500"
              />
              <p className="text-[11px] text-slate-500">Exceeding this velocity automatically flags the IP as an attack and triggers an auto-ban.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex justify-between">
                <span>Auto-Ban Jail Duration (Minutes)</span>
                <span className="text-amber-400">{autoBanDuration} Minutes</span>
              </label>
              <input
                type="range"
                min={5}
                max={120}
                step={5}
                value={autoBanDuration}
                onChange={(e) => setAutoBanDuration(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <p className="text-[11px] text-slate-500">Length of time an automatically jailed IP remains blocked.</p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={wafEnabled}
                onChange={(e) => setWafEnabled(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0"
              />
              <span className="text-xs font-bold text-slate-300">Enable Deep WAF Payload Inspection (SQLi / XSS / Traversal)</span>
            </label>

            <button
              type="submit"
              disabled={savingConfig}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all disabled:opacity-50"
            >
              {savingConfig ? 'Saving...' : 'Save Parameters'}
            </button>
          </div>
        </form>
      )}

      {/* ─── SUB-TAB 4: LIVE INCIDENT LOGS ────────────────────────────────────── */}
      {secTab === 'logs' && (
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden space-y-0">
          {/* Header and Filter */}
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Terminal className="h-4 w-4 text-cyan-400" />
              <h4 className="text-xs font-black uppercase text-white tracking-wider">Security Incident Telemetry</h4>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter IP or Reason..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 w-40 sm:w-52"
                />
              </div>

              <select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Actions</option>
                <option value="BLOCKED">Blocked (WAF / IP)</option>
                <option value="RATE_LIMITED">Rate Limited (429)</option>
                <option value="AUTO_BANNED">Auto Banned</option>
                <option value="CHALLENGE_REQUIRED">Challenge Issued</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-500 font-bold border-b border-slate-800 sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Offending IP</th>
                  <th className="px-4 py-3">Target Path</th>
                  <th className="px-4 py-3">Reason / Signature</th>
                  <th className="px-4 py-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500 font-sans">
                      No security incidents matching current filters. System running cleanly.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(item => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-2.5 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap font-sans">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.action === 'AUTO_BANNED' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                          item.action === 'BLOCKED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          item.action === 'RATE_LIMITED' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}>
                          {item.action}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-bold text-white whitespace-nowrap">
                        {item.ip}
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 truncate max-w-[160px]">
                        {item.path}
                      </td>
                      <td className="px-4 py-2.5 text-slate-300 font-sans text-[11px]">
                        {item.reason}
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap font-sans">
                        <button
                          onClick={() => {
                            setIpInput(item.ip);
                            setReasonInput(item.reason);
                            setSecTab('access');
                            setAccessSubTab('blocklist');
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-400 text-[10px] font-bold border border-slate-700"
                        >
                          + Block IP
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
