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
  TrendingUp,
  Award,
  Send,
  ArrowRight,
  Sparkles,
  DollarSign,
} from 'lucide-react';

export default function ResellerPage() {
  const [monthlyVolume, setMonthlyVolume] = useState(500);

  // Profit calculation logic
  const calculatedDiscount = monthlyVolume >= 2000 ? 12 : monthlyVolume >= 1000 ? 8 : 5;
  const estimatedSavings = ((monthlyVolume * calculatedDiscount) / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
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
      </main>

      <Footer />
    </div>
  );
}
