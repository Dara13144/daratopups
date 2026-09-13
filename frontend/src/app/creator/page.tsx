'use client';

import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Link from 'next/link';
import {
  Sparkles,
  Tv,
  Gift,
  Coins,
  Send,
  ArrowRight,
  CheckCircle2,
  Video,
  Award,
  Zap,
} from 'lucide-react';

export default function CreatorPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12">
        {/* ══ HERO BANNER ══════════════════════════════════════════════ */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-rose-950/40 to-slate-900 border border-rose-500/20 p-6 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
              <Tv className="h-4 w-4" />
              <span>កម្មវិធីឧបត្ថម្ភអ្នកបង្កើតមាតិកា (NA-DY Creator Partnership)</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              ក្លាយជា <span className="bg-gradient-to-r from-rose-400 via-pink-300 to-amber-300 bg-clip-text text-transparent">Official Creator</span> ទទួលពេជ្រ & កម្រៃជើងសារ
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              អ្នកជា Streamer, TikToker, YouTuber ឬអ្នករៀបចំការប្រកួត Tournament មែនទេ? សហការជាមួយ <span className="text-rose-400 font-bold">NA-DY TOPUP</span> ដើម្បីទទួលបានកូដបញ្ចុះតម្លៃផ្ទាល់ខ្លួន កញ្ចប់ពេជ្រឧបត្ថម្ភ និងកម្រៃជើងសារ (Commission) ប្រចាំខែ!
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="https://t.me/darazzdev"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-sm shadow-lg shadow-rose-500/25 flex items-center space-x-2 transition-all active:scale-95"
              >
                <Send className="h-4 w-4" />
                <span>ដាក់ពាក្យជា Creator តាម Telegram</span>
              </a>
              <Link
                href="/#catalog"
                className="px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm transition-all flex items-center space-x-2"
              >
                <span>មើលហ្គេម & កញ្ចប់ពេជ្រ</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* ══ CREATOR PERKS ════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4 hover:border-slate-700 transition-all">
            <div className="h-12 w-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Gift className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black text-white">ពេជ្រឧបត្ថម្ភប្រចាំខែ</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              ទទួលបានកញ្ចប់ពេជ្រ Free ប្រចាំខែសម្រាប់ធ្វើ Giveaway ជូនអ្នកគាំទ្រ ឬទិញ Skin/Hero ថ្មីៗក្នុង Livestream របស់អ្នក។
            </p>
          </div>

          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4 hover:border-slate-700 transition-all">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Coins className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black text-white">កម្រៃជើងសាររហូតដល់ 5%</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              រាល់ការបញ្ជាទិញតាមរយៈ Promo Code របស់អ្នក នឹងទទួលបាន Commission ដកប្រាក់រៀងរាល់ចុងខែតាម ABA ឬ Bakong KHQR។
            </p>
          </div>

          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4 hover:border-slate-700 transition-all">
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black text-white">Custom Promo Code</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              កូដឈ្មោះផ្ទាល់ខ្លួនរបស់អ្នក (ឧ. CODE: DARA) ផ្តល់ការបញ្ចុះតម្លៃបន្ថែមដល់អ្នកទស្សនានិង Fan របស់អ្នកពេលបញ្ចូលពេជ្រ។
            </p>
          </div>
        </div>

        {/* ══ ELIGIBILITY & REQUIREMENTS ════════════════════════════════ */}
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-pink-500/20 text-pink-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">លក្ខខណ្ឌក្នុងការចូលរួម</h3>
              <p className="text-xs text-slate-400">យើងស្វាគមន៍អ្នកបង្កើតមាតិកាគ្រប់វេទិកា</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <CheckCircle2 className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold text-white block">TikTok / YouTube / Facebook Page</span>
                <p className="text-slate-400">មាន Followers ឬ Subscribers ចាប់ពី 2,000+ ឡើងទៅ និងមានសកម្មភាពផុសទៀងទាត់។</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <CheckCircle2 className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold text-white block">Game Content & Live Streaming</span>
                <p className="text-slate-400">មាតិកាទាក់ទងនឹងហ្គេម eSports ដូចជា MLBB, Free Fire, PUBG, Valorant, HOK ជាដើម។</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
