'use client';

import React, { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Link from 'next/link';
import {
  Users,
  Percent,
  Zap,
  ShieldCheck,
  Headphones,
  CheckCircle2,
  CheckCircle,
  TrendingUp,
  Award,
  Send,
  ArrowRight,
  Sparkles,
  DollarSign,
  Search,
  Copy,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { lookupPlayerProfile, PlayerProfile, fetchProviderProfile } from '../../lib/api';


export default function ResellerPage() {
  const [monthlyVolume, setMonthlyVolume] = useState(500);
  const [providerProfile, setProviderProfile] = useState<any>(null);

  React.useEffect(() => {
    fetchProviderProfile(2)
      .then(setProviderProfile)
      .catch(() => {});
  }, []);

  // Profit calculation logic
  const calculatedDiscount = monthlyVolume >= 2000 ? 12 : monthlyVolume >= 1000 ? 8 : 5;
  const estimatedSavings = ((monthlyVolume * calculatedDiscount) / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12">
        {/* ══ HERO BANNER ══════════════════════════════════════════════ */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/20 p-6 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-bold">
              <Award className="h-4 w-4" />
              <span>កម្មវិធីដៃគូចែកចាយបន្ត (Official Reseller Program)</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              ក្លាយជាដៃគូចែកចាយ <span className="bg-gradient-to-r from-pink-400 via-rose-300 to-amber-300 bg-clip-text text-transparent">NA-DY TOPUP</span> ទទួលប្រាក់ចំណេញខ្ពស់
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              ទទួលតម្លៃពិសេសបោះដុំ (Wholesale Prices) ចុះរហូតដល់ <span className="text-pink-400 font-bold">12%</span> សម្រាប់គ្រប់ហ្គេមពេញនិយម Mobile Legends, Free Fire, PUBG Mobile, Roblox និងជាច្រើនទៀត។ បញ្ចូលស្វ័យប្រវត្តិតាម API ឬ Dashboard 24/7!
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="https://t.me/darazzdev"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-sm shadow-lg shadow-pink-500/25 flex items-center space-x-2 transition-all active:scale-95"
              >
                <Send className="h-4 w-4" />
                <span>ចុះឈ្មោះជា Reseller តាម Telegram</span>
              </a>
              <Link
                href="/#catalog"
                className="px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm transition-all flex items-center space-x-2"
              >
                <span>មើលបញ្ជីហ្គេមទាំងអស់</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* ══ LIVE RESELLER API GATEWAY STATUS BANNER ══ */}
        <div className="rounded-3xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-pink-950/70 border border-pink-500/30 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 rounded-2xl bg-pink-500/20 text-pink-400 border border-pink-500/30 shrink-0">
                <Zap className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg sm:text-xl font-black text-white">ប្រព័ន្ធស្វ័យប្រវត្តិ VNGZZ2GAME API Gateway (Stock 2)</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30 flex items-center space-x-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>ONLINE</span>
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  ភ្ជាប់ផ្ទាល់ជាមួយ <code className="text-pink-300 font-mono">https://www.vngzz2game.site/api/v1/game2/profile</code> សម្រាប់ពិនិត្យសមតុល្យ Reseller, ផ្ទៀងផ្ទាត់ ID 150+ ហ្គេម និងបញ្ជូនពេជ្រ Real-Time
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-black/40 p-2 rounded-2xl border border-white/10 shrink-0">
              <div className="px-3 py-1">
                <span className="text-[10px] text-slate-400 block font-bold">API Profile</span>
                <span className="text-xs font-mono font-black text-emerald-400">
                  {providerProfile?.status || 'SUCCESS'}
                </span>
              </div>
              {providerProfile?.user?.balance !== undefined && (
                <div className="px-3 py-1 border-l border-white/10">
                  <span className="text-[10px] text-slate-400 block font-bold">Live Wallet</span>
                  <span className="text-xs font-mono font-black text-white">
                    ${Number(providerProfile.user.balance).toFixed(2)} USD
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══ RESELLER REAL-TIME ID CHECKER TOOL (MLBB & FREE FIRE) ═══════ */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-cyan-500/30 p-6 sm:p-8 shadow-2xl shadow-cyan-500/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center space-x-3.5">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-amber-500 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/25 shrink-0">
                <Sparkles className="h-6 w-6 fill-current" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    ឧបករណ៍ពិនិត្យ ID ហ្គេម Mobile Legends & Free Fire
                  </h2>
                  <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black border border-cyan-500/30">
                    Live Real-Time
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  ផ្ទៀងផ្ទាត់ឈ្មោះពិតក្នុងហ្គេម (Real In-Game Nickname) របស់អតិថិជនភ្លាមៗមុនពេលបញ្ជូនពេជ្រ
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Moonton & Garena Live API</span>
              </span>
            </div>
          </div>

          <ResellerGameChecker />
        </div>

        {/* ══ RESELLER TIERS ═══════════════════════════════════════════ */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">កម្រិតសមាជិក Reseller</h2>
            <p className="text-slate-400 text-sm">ជ្រើសរើសកម្រិតដែលស័ក្តិសមជាមួយអាជីវកម្មរបស់អ្នក</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bronze Tier */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-5 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-xl bg-amber-700/20 text-amber-500 flex items-center justify-center font-black">
                  🥉
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Starter Reseller</h3>
                  <p className="text-xs text-slate-400">សម្រាប់អ្នកទើបចាប់ផ្តើមលក់ដំបូង</p>
                </div>
                <div className="text-2xl font-black text-amber-400">បញ្ចុះតម្លៃ 5%</div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>បញ្ចូលស្វ័យប្រវត្តតាមវិបសាយ 24/7</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>ទូទាត់រហ័សតាម ABA & Bakong KHQR</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>របាយការណ៍បញ្ជាទិញលម្អិត</span>
                  </li>
                </ul>
              </div>
              <a
                href="https://t.me/darazzdev"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center block transition-colors"
              >
                ដាក់ពាក្យ Starter
              </a>
            </div>

            {/* Silver / Gold VIP Tier */}
            <div className="rounded-2xl bg-gradient-to-b from-slate-900 via-purple-950/40 to-slate-900 border-2 border-pink-500/50 p-6 space-y-5 flex flex-col justify-between relative shadow-xl shadow-pink-500/10">
              <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-black uppercase tracking-wider">
                ពេញនិយមបំផុត
              </div>
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-black">
                  🥈
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">VIP Partner</h3>
                  <p className="text-xs text-slate-400">សម្រាប់ហាងលក់ហ្គេម និង Page ធំៗ</p>
                </div>
                <div className="text-2xl font-black text-pink-400">បញ្ចុះតម្លៃ 8%</div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>អាទិភាពខ្ពស់បំផុតក្នុងការបញ្ជូនពេជ្រ</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>ជំនួយការផ្ទាល់ 1-on-1 Support តាម Telegram</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>បញ្ចុះតម្លៃគ្រប់កញ្ចប់ពេជ្រ និង Pass</span>
                  </li>
                </ul>
              </div>
              <a
                href="https://t.me/darazzdev"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs text-center block transition-colors shadow-md shadow-pink-500/20"
              >
                ដាក់ពាក្យ VIP Partner
              </a>
            </div>

            {/* Platinum Master Tier */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-5 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-black">
                  👑
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">API Wholesaler</h3>
                  <p className="text-xs text-slate-400">សម្រាប់អ្នកមាន Web ផ្ទាល់ខ្លួន</p>
                </div>
                <div className="text-2xl font-black text-amber-300">បញ្ចុះតម្លៃ 12%</div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>API Key ផ្ទាល់ខ្លួនបញ្ចូលស្វ័យប្រវត្តិ</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Real-time Webhook Callbacks</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>តម្លៃពិសេសជាងគេលើទីផ្សារកម្ពុជា</span>
                  </li>
                </ul>
              </div>
              <a
                href="https://t.me/darazzdev"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center block transition-colors"
              >
                ទាក់ទងបើក API
              </a>
            </div>
          </div>
        </div>

        {/* ══ PROFIT ESTIMATOR CALCULATOR ══════════════════════════════ */}
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">គណនាប្រាក់ចំណេញប៉ាន់ស្មាន</h3>
              <p className="text-xs text-slate-400">ប៉ាន់ប្រមាណប្រាក់ចំណេញសរុបប្រចាំខែរបស់អ្នក</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-300">ទំហំលក់ប៉ាន់ស្មានប្រចាំខែ ($):</span>
              <span className="font-black text-pink-400 text-lg">${monthlyVolume}</span>
            </div>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={monthlyVolume}
              onChange={(e) => setMonthlyVolume(Number(e.target.value))}
              className="w-full accent-pink-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
              <span>$100 / ខែ</span>
              <span>$2,500 / ខែ</span>
              <span>$5,000+ / ខែ</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-4">
              <span className="text-xs text-slate-400">អត្រាបញ្ចុះតម្លៃទទួលបាន:</span>
              <div className="text-2xl font-black text-pink-400 mt-1">{calculatedDiscount}%</div>
            </div>
            <div className="rounded-xl bg-slate-950/70 border border-emerald-500/30 p-4">
              <span className="text-xs text-emerald-400">ប្រាក់ចំណេញសន្សំបានប្រចាំខែ:</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">${estimatedSavings} USD</div>
            </div>
          </div>
        </div>

        {/* ══ LIVE GAME ID CHECKER SYSTEM FOR RESELLERS (MLBB & FREE FIRE) ══════════════ */}
        <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-cyan-500/30 p-6 sm:p-8 space-y-6 shadow-2xl shadow-cyan-500/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="flex items-center space-x-3.5">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-amber-500 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20 shrink-0">
                <Sparkles className="h-6 w-6 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-black text-white">ប្រព័ន្ធពិនិត្យ ID Mobile Legends & Free Fire សម្រាប់ Reseller</h3>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black border border-emerald-500/40">
                    Live Moonton & Garena API
                  </span>
                </div>
                <p className="text-xs text-slate-400">ផ្ទៀងផ្ទាត់ Real In-Game Nickname របស់អតិថិជនភ្លាមៗមុនពេលកុម្ម៉ង់ទិញពេជ្រ</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-cyan-400 font-bold bg-cyan-950/40 px-3.5 py-1.5 rounded-xl border border-cyan-500/20 self-start sm:self-auto">
              <Zap className="h-4 w-4 text-cyan-400" />
              <span>Free & Unlimited Live Checks</span>
            </div>
          </div>

          <ResellerGameChecker />
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ResellerGameChecker() {
  const [selectedGame, setSelectedGame] = useState<'mobile-legend' | 'free-fire'>('mobile-legend');
  const [playerId, setPlayerId] = useState('');
  const [playerZoneId, setPlayerZoneId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [copied, setCopied] = useState(false);

  const isFF = selectedGame === 'free-fire';

  const handlePlayerIdInput = (val: string) => {
    const comboMatch = val.match(/^(\d{4,12})[\s_()\-]+(\d{3,6})\)?$/);
    if (comboMatch && !isFF) {
      setPlayerId(comboMatch[1]);
      setPlayerZoneId(comboMatch[2]);
      return;
    }
    setPlayerId(val);
  };

  const handleZoneInput = (val: string) => {
    setPlayerZoneId(val.replace(/[()]/g, ''));
  };

  const handleCheck = async (overrideId?: string, overrideZone?: string, overrideGame?: 'mobile-legend' | 'free-fire') => {
    const game = overrideGame || selectedGame;
    const isFreeFire = game === 'free-fire';
    const id = (overrideId !== undefined ? overrideId : playerId).trim();
    const zone = (overrideZone !== undefined ? overrideZone : playerZoneId).trim();

    if (!id || id.length < 3) {
      setError('សូមបញ្ចូល User ID / Player ID យ៉ាងតិច 3 ខ្ទង់');
      return;
    }
    if (!isFreeFire && !zone) {
      setError('សូមបញ្ចូល Zone ID (លេខក្នុងវង់ក្រចក) សម្រាប់ Mobile Legends');
      return;
    }

    setLoading(true);
    setError('');
    setProfile(null);

    try {
      const res = await lookupPlayerProfile(game, id, isFreeFire ? undefined : zone);
      if (res && res.success && res.nickname) {
        setProfile(res);
      } else {
        setError(res?.error || `រកមិនឃើញគណនី ${isFreeFire ? 'Free Fire' : 'Mobile Legends'} នេះទេ។ សូមពិនិត្យមើល ID ម្ដងទៀត`);
      }
    } catch (err: any) {
      setError(err.message || 'មិនអាចផ្ទៀងផ្ទាត់ឈ្មោះបានទេ សូមព្យាយាមម្តងទៀត');
    } finally {
      setLoading(false);
    }
  };

  const handlePreset = (id: string, zone: string, game?: 'mobile-legend' | 'free-fire') => {
    const targetGame = game || selectedGame;
    if (targetGame !== selectedGame) setSelectedGame(targetGame);
    setPlayerId(id);
    setPlayerZoneId(zone);
    handleCheck(id, zone, targetGame);
  };

  const copyNickname = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Game Switcher Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setSelectedGame('mobile-legend');
            setError('');
            setProfile(null);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            selectedGame === 'mobile-legend'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-md shadow-cyan-500/10'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <img src="/images/games/mlbb.png" alt="MLBB" className="h-5 w-5 rounded-md object-contain" />
          <span>Mobile Legends</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedGame('free-fire');
            setError('');
            setProfile(null);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            selectedGame === 'free-fire'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-400 shadow-md shadow-amber-500/10'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <img src="/images/games/freefire.png" alt="Free Fire" className="h-5 w-5 rounded-md object-contain" />
          <span>Free Fire</span>
        </button>
      </div>

      {/* Input Fields */}
      <div className={`grid grid-cols-1 ${isFF ? 'sm:grid-cols-1' : 'sm:grid-cols-2'} gap-4`}>
        <div>
          <label className="block text-slate-300 text-xs font-bold mb-1.5 flex justify-between">
            <span>{isFF ? 'Free Fire Player UID' : 'Mobile Legends User ID'}</span>
            <span className="text-[10px] text-slate-500 font-normal">{isFF ? 'e.g. 11676873799' : 'e.g. 1523754961'}</span>
          </label>
          <input
            type="text"
            placeholder={isFF ? 'បញ្ចូល Free Fire Player UID (5-14 ខ្ទង់)' : 'បញ្ចូល User ID អតិថិជន'}
            value={playerId}
            onChange={(e) => handlePlayerIdInput(e.target.value)}
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[46px]"
          />
        </div>

        {!isFF && (
          <div>
            <label className="block text-slate-300 text-xs font-bold mb-1.5 flex justify-between">
              <span>Zone ID (លេខក្នុងវង់ក្រចក)</span>
              <span className="text-[10px] text-slate-500 font-normal">e.g. (11766)</span>
            </label>
            <input
              type="text"
              placeholder="បញ្ចូល Zone ID (4-5 ខ្ទង់)"
              value={playerZoneId}
              onChange={(e) => handleZoneInput(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[46px]"
            />
          </div>
        )}
      </div>

      {/* Preset Buttons & Helper */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 font-semibold text-[11px]">គំរូសាកល្បងរហ័ស:</span>
          {isFF ? (
            <>
              <button
                type="button"
                onClick={() => handlePreset('11676873799', '', 'free-fire')}
                className="px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 text-amber-300 font-mono text-[11px] cursor-pointer flex items-center gap-1"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping"></span>
                <span>11676873799 (Live Player)</span>
              </button>
              <button
                type="button"
                onClick={() => handlePreset('12345678', '', 'free-fire')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] cursor-pointer"
              >
                12345678
              </button>
              <button
                type="button"
                onClick={() => handlePreset('87654321', '', 'free-fire')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] cursor-pointer"
              >
                87654321
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handlePreset('1523754961', '11766', 'mobile-legend')}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] cursor-pointer flex items-center gap-1"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>1523754961 (11766)</span>
              </button>
              <button
                type="button"
                onClick={() => handlePreset('12345678', '1234', 'mobile-legend')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] cursor-pointer"
              >
                12345678 (1234)
              </button>
              <button
                type="button"
                onClick={() => handlePreset('998877', '1234', 'mobile-legend')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] cursor-pointer"
              >
                998877 (1234)
              </button>
            </>
          )}
        </div>

        <span className="text-[11px] text-cyan-400 font-medium flex items-center gap-1">
          <Zap className="h-3.5 w-3.5" />
          <span>ផ្ទៀងផ្ទាត់ស្វ័យប្រវត្តិតាម Real-Time {isFF ? 'Garena Free Fire' : 'Moonton'} Servers</span>
        </span>
      </div>

      {/* Check Action Button */}
      <button
        type="button"
        onClick={() => handleCheck()}
        disabled={loading || !playerId.trim() || (!isFF && !playerZoneId.trim())}
        className="w-full py-3.5 px-6 rounded-2xl font-black text-sm bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 flex items-center justify-center space-x-2 shadow-xl shadow-cyan-500/20 transition-all disabled:opacity-40 cursor-pointer min-h-[48px]"
      >
        {loading ? (
          <>
            <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            <span>កំពុងផ្ទៀងផ្ទាត់ឈ្មោះពិតក្នុង {isFF ? 'Free Fire' : 'Mobile Legends'}...</span>
          </>
        ) : (
          <>
            <Search className="h-4 w-4 stroke-[2.5]" />
            <span>ពិនិត្យឈ្មោះពិត {isFF ? 'Free Fire' : 'Mobile Legends'} (Verify Real In-Game Nickname)</span>
          </>
        )}
      </button>

      {/* Error Message */}
      {error && !loading && (
        <div className="flex items-start space-x-2.5 bg-red-950/40 border border-red-500/30 rounded-2xl p-3.5 text-left">
          <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-300 text-xs font-medium">{error}</p>
        </div>
      )}

      {/* Verified Profile Card */}
      {profile && !loading && (
        <div className="rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 p-5 shadow-xl shadow-emerald-500/10 space-y-4 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="relative shrink-0">
                <img
                  src={profile.avatarUrl || (isFF ? '/images/games/freefire.png' : '/images/games/mlbb.png')}
                  alt="Game Avatar"
                  className="h-14 w-14 rounded-2xl object-cover border-2 border-emerald-400 bg-slate-950 p-0.5 shadow-md"
                />
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md">
                  <CheckCircle className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    <span>✓ Real Name Verified</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono bg-slate-950/60 px-2 py-0.5 rounded-md border border-slate-800">
                    ID: {profile.playerId}{profile.playerZoneId ? ` (${profile.playerZoneId})` : ''}
                  </span>
                </div>

                <div className="mt-1">
                  <span className="text-[11px] text-slate-400 font-semibold">ឈ្មោះពិតក្នុងហ្គេម: </span>
                  <h3 className="text-xl font-black text-emerald-300 tracking-tight">
                    {profile.nickname}
                  </h3>
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                  <span className="text-emerald-400 font-semibold">📍 {profile.region || 'Cambodia (Asia)'}</span>
                  {profile.level && <span className="text-cyan-300 font-semibold">⚡ Lv. {profile.level}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => copyNickname(profile.nickname)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer border border-slate-700"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'បានចម្លង!' : 'ចម្លងឈ្មោះ'}</span>
              </button>

              <Link
                href={isFF ? `/games/free-fire?playerId=${encodeURIComponent(profile.playerId)}` : `/games/mobile-legend?playerId=${encodeURIComponent(profile.playerId)}&playerZoneId=${encodeURIComponent(profile.playerZoneId || playerZoneId)}`}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-500/20"
              >
                <span>បញ្ចូលពេជ្រគណនីនេះ (Top Up)</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

