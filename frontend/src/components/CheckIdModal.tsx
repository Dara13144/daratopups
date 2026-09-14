'use client';

import React, { useState } from 'react';
import { 
  X, Search, CheckCircle, ShieldAlert, Sparkles, 
  Gamepad2, ArrowRight, Copy, Check, Zap, ExternalLink 
} from 'lucide-react';
import Link from 'next/link';
import { lookupPlayerProfile, PlayerProfile } from '../lib/api';

interface CheckIdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPPORTED_GAMES = [
  { slug: 'mobile-legend', name: 'Mobile Legends', icon: '/images/games/mlbb.png', hasZone: true, zoneLabel: 'Zone ID', placeholder: '1234' },
  { slug: 'free-fire', name: 'Free Fire', icon: '/images/games/freefire.png', hasZone: false },
  { slug: 'pubg-mobile', name: 'PUBG Mobile', icon: '/images/games/pubg.png', hasZone: false },
];

export default function CheckIdModal({ isOpen, onClose }: CheckIdModalProps) {
  const [selectedGame, setSelectedGame] = useState(SUPPORTED_GAMES[0]);
  const [playerId, setPlayerId] = useState('');
  const [playerZoneId, setPlayerZoneId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCheck = async (overrideId?: string, overrideZone?: string) => {
    const idToUse = (overrideId !== undefined ? overrideId : playerId).trim();
    const zoneToUse = (overrideZone !== undefined ? overrideZone : playerZoneId).trim();

    if (!idToUse || idToUse.length < 3) {
      setError('សូមបញ្ចូល Player / User ID យ៉ាងតិច 3 ខ្ទង់');
      return;
    }

    if (selectedGame.hasZone && !zoneToUse) {
      setError(`សូមបញ្ចូល ${selectedGame.zoneLabel || 'Zone ID'} សម្រាប់ ${selectedGame.name}`);
      return;
    }

    setLoading(true);
    setError('');
    setProfile(null);

    try {
      const res = await lookupPlayerProfile(selectedGame.slug, idToUse, selectedGame.hasZone ? zoneToUse : undefined);
      if (res && res.success && res.nickname) {
        setProfile(res);
      } else {
        setError(res?.error || 'រកមិនឃើញគណនីនេះទេ។ សូមពិនិត្យមើល ID ម្ដងទៀត');
      }
    } catch (err: any) {
      setError(err.message || 'មិនអាចផ្ទៀងផ្ទាត់ឈ្មោះបានទេ សូមព្យាយាមម្តងទៀត');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPreset = (id: string, zone: string) => {
    setPlayerId(id);
    setPlayerZoneId(zone);
    handleCheck(id, zone);
  };

  const copyNickname = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlayerIdInput = (val: string) => {
    const comboMatch = val.match(/^(\d{4,12})[\s_()\-]+(\d{3,6})\)?$/);
    if (comboMatch && selectedGame.hasZone) {
      setPlayerId(comboMatch[1]);
      setPlayerZoneId(comboMatch[2]);
      return;
    }
    setPlayerId(val);
  };

  const handleZoneInput = (val: string) => {
    setPlayerZoneId(val.replace(/[()]/g, ''));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-slate-700/80 rounded-3xl shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/20">
              <Sparkles className="h-5 w-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <span>ពិនិត្យ ID & ឈ្មោះពិតក្នុងហ្គេម</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">Live Check</span>
              </h3>
              <p className="text-[11px] text-slate-400">ផ្ទៀងផ្ទាត់ Real In-Game Nickname មុនពេល Top-Up</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Game Selection Tabs */}
          <div>
            <label className="block text-slate-300 text-xs font-bold mb-2">ជ្រើសរើសហ្គេម (Select Game):</label>
            <div className="grid grid-cols-3 gap-2">
              {SUPPORTED_GAMES.map((g) => (
                <button
                  key={g.slug}
                  type="button"
                  onClick={() => {
                    setSelectedGame(g);
                    setError('');
                    setProfile(null);
                  }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                    selectedGame.slug === g.slug
                      ? 'bg-gradient-to-b from-cyan-500/20 to-blue-500/10 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                  }`}
                >
                  <img src={g.icon} alt={g.name} className="h-8 w-8 rounded-xl object-contain mb-1.5 shadow-sm" />
                  <span className="truncate w-full text-center">{g.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Inputs */}
          <div className="space-y-3">
            <div>
              <label className="block text-slate-300 text-xs font-bold mb-1.5 flex justify-between">
                <span>{selectedGame.name} User ID</span>
                <span className="text-[10px] text-slate-500 font-normal">e.g. 1523754961</span>
              </label>
              <input
                type="text"
                placeholder="បញ្ចូល User ID (Player ID)"
                value={playerId}
                onChange={(e) => handlePlayerIdInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {selectedGame.hasZone && (
              <div>
                <label className="block text-slate-300 text-xs font-bold mb-1.5 flex justify-between">
                  <span>{selectedGame.zoneLabel || 'Zone ID'}</span>
                  <span className="text-[10px] text-slate-500 font-normal">e.g. (11766) ក្នុងវង់ក្រចក</span>
                </label>
                <input
                  type="text"
                  placeholder="បញ្ចូល Zone ID (4-5 ខ្ទង់)"
                  value={playerZoneId}
                  onChange={(e) => handleZoneInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}
          </div>

          {/* Helper / Presets for Free Fire */}
          {selectedGame.slug === 'free-fire' && (
            <div className="space-y-2">
              <div className="text-[11px] text-slate-400 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-start gap-2">
                <Zap className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-amber-300 font-bold">របៀបមើល ID ក្នុង Free Fire: </span>
                  <span>ចុច Profile Banner ខាងលើឆ្វេង &rarr; ចម្លងលេខ UID នៅក្រោមឈ្មោះរបស់អ្នក (ឧ. 11676873799)</span>
                </div>
              </div>

              {/* Fast Test Samples */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                <span className="text-slate-500 font-semibold">គំរូសាកល្បង:</span>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('11676873799', '')}
                  className="px-2 py-0.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 text-amber-300 text-[10px] font-mono cursor-pointer flex items-center gap-1"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping"></span>
                  <span>11676873799 (Live Player)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('12345678', '')}
                  className="px-2 py-0.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono cursor-pointer"
                >
                  12345678
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('87654321', '')}
                  className="px-2 py-0.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono cursor-pointer"
                >
                  87654321
                </button>
              </div>
            </div>
          )}

          {/* Helper / Presets for Mobile Legends */}
          {selectedGame.slug === 'mobile-legend' && (
            <div className="space-y-2">
              <div className="text-[11px] text-slate-400 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-start gap-2">
                <Zap className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-cyan-300 font-bold">របៀបមើល ID ក្នុង Mobile Legends: </span>
                  <span>ចុច Avatar ខាងលើឆ្វេង &rarr; Basic Info &rarr; លេខ User ID និង Zone ID ក្នុងវង់ក្រចក (ឧ. 1523754961 (11766))</span>
                </div>
              </div>

              {/* Fast Test Samples */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                <span className="text-slate-500 font-semibold">គំរូសាកល្បង:</span>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('1523754961', '11766')}
                  className="px-2 py-0.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono cursor-pointer flex items-center gap-1"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>1523754961 (11766)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('12345678', '1234')}
                  className="px-2 py-0.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono cursor-pointer"
                >
                  12345678 (1234)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('998877', '1234')}
                  className="px-2 py-0.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono cursor-pointer"
                >
                  998877 (1234)
                </button>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="button"
            onClick={() => handleCheck()}
            disabled={loading || !playerId.trim() || (selectedGame.hasZone && !playerZoneId.trim())}
            className="w-full py-3 px-4 rounded-xl text-sm font-black bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-40 cursor-pointer min-h-[44px]"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>កំពុងផ្ទៀងផ្ទាត់ឈ្មោះពិតជាមួយ {selectedGame.slug.includes('free-fire') ? 'Garena' : 'Moonton'}...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4 stroke-[2.5]" />
                <span>ពិនិត្យឈ្មោះពិត (Check In-Game Real Name)</span>
              </>
            )}
          </button>

          {/* Error Message */}
          {error && !loading && (
            <div className="flex items-start space-x-2.5 bg-red-950/40 border border-red-500/30 rounded-2xl p-3 text-left">
              <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300 text-xs font-medium">{error}</p>
            </div>
          )}

          {/* Verified Profile Result */}
          {profile && !loading && (
            <div className="rounded-2xl border border-emerald-500/50 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 p-4 shadow-lg shadow-emerald-500/10 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="relative shrink-0">
                  <img
                    src={profile.avatarUrl || selectedGame.icon}
                    alt="Game Avatar"
                    className="h-12 w-12 rounded-xl object-contain border-2 border-emerald-400/80 bg-slate-950 p-0.5"
                  />
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 stroke-[3]" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
                      ✓ Real Name Verified
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID: {profile.playerId}{profile.playerZoneId ? ` (${profile.playerZoneId})` : ''}
                    </span>
                  </div>

                  <h4 className="text-white font-black text-base truncate mt-0.5 text-emerald-300">
                    {profile.nickname}
                  </h4>

                  <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                    <span className="text-emerald-400 font-semibold">📍 {profile.region || 'Cambodia (Asia)'}</span>
                    {profile.level && <span className="text-cyan-300 font-semibold">⚡ Lv. {profile.level}</span>}
                  </div>
                </div>

                {/* Copy Button */}
                <button
                  type="button"
                  onClick={() => copyNickname(profile.nickname)}
                  className="shrink-0 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Copy Nickname"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              {/* Action: Go to Topup */}
              <div className="pt-1">
                <Link
                  href={`/games/${selectedGame.slug}?playerId=${encodeURIComponent(profile.playerId)}&playerZoneId=${encodeURIComponent(profile.playerZoneId || '')}`}
                  onClick={onClose}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-emerald-500/20"
                >
                  <span>ទៅកាន់ទំព័រទិញពេជ្រ {selectedGame.name} (Top-Up Now)</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
