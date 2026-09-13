'use client';

import React, { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Link from 'next/link';
import {
  HelpCircle,
  ChevronDown,
  Clock,
  ShieldCheck,
  CreditCard,
  Send,
  AlertCircle,
  Search,
  CheckCircle2,
} from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: 'តើការបញ្ចូលពេជ្រចំណាយពេលប៉ុន្មានទើបចូលក្នុងគណនីហ្គេម?',
    a: 'ការបញ្ចូលពេជ្រដំណើរការស្វ័យប្រវត្ត 24/7 (Instant Auto Delivery)។ ពេជ្រនឹងចូលក្នុងគណនីរបស់អ្នកចន្លោះពី 1 ទៅ 30 វិនាទី បន្ទាប់ពីការទូទាត់ជោគជ័យ។',
    category: 'SPEED',
  },
  {
    q: 'តើខ្ញុំអាចទូទាត់ប្រាក់តាមវិធីណាខ្លះ?',
    a: 'NA-DY TOPUP គាំទ្រការទូទាត់តាម Bakong KHQR (គ្រប់ធនាគារនៅកម្ពុជា: ABA, ACLEDA, Canadia, Wing, Sathapana, TrueMoney, Chip Mong...) និង ABA PAY ដោយផ្ទាល់ មិនគិតថ្លៃសេវាបន្ថែម។',
    category: 'PAYMENT',
  },
  {
    q: 'តើខ្ញុំត្រូវរក Player ID និង Zone ID នៅឯណា?',
    a: 'សម្រាប់ហ្គេម Mobile Legends: បើកហ្គេម ចុចលើ Profile របស់អ្នកនៅជ្រុងលើខាងឆ្វេង។ អ្នកនឹងឃើញលេខសម្គាល់ ឧទាហរណ៍: 12345678 (1234)។ 12345678 គឺជា User ID ហើយ 1234 គឺជា Zone ID។ សម្រាប់ហ្គេមផ្សេងៗ អ្នកអាចមើលតាមការណែនាំលើទំព័រហ្គេមនីមួយៗ។',
    category: 'ACCOUNT',
  },
  {
    q: 'ចុះបើខ្ញុំបញ្ចូល ID ខុស ឬមិនទាន់បានទទួលពេជ្រ?',
    a: 'ប្រសិនបើអ្នកជួបបញ្ហាមិនទាន់ចូលពេជ្រ ឬច្រឡំបញ្ចូល ID ខុស សូមទាក់ទងមកកាន់ Telegram Support ផ្លូវការរបស់យើង (@darazzdev) ភ្លាមៗ ជាមួយនឹងវិក្កយបត្រ ឬលេខកូដប្រតិបត្តិការ (Txn ID) ក្រុមការងារនឹងជួយដោះស្រាយជូន 24/7។',
    category: 'SUPPORT',
  },
  {
    q: 'តើពេជ្រមានសុវត្ថិភាព 100% និងស្របច្បាប់ដែរឬទេ?',
    a: 'ពេជ្រនិងកញ្ចប់ទាំងអស់ទទួលបានដោយផ្ទាល់ពីដៃគូផ្លូវការ Moonton, Garena, Tencent, Riot Games, NetEase 100% សុវត្ថិភាព មិនប៉ះពាល់ដល់គណនីហ្គេម ឬមិនមានបញ្ហាដកពេជ្រថយក្រោយឡើយ។',
    category: 'SECURITY',
  },
  {
    q: 'តើខ្ញុំអាចតាមដានស្ថានភាពបញ្ជាទិញដោយរបៀបណា?',
    a: 'អ្នកអាចចុចលើប៊ូតុង "តាមដាន" (Track History) នៅលើ Menu ខាងលើ រួចបញ្ចូលលេខប្រតិបត្តិការ (Txn ID) ឬមើលប្រវត្តិការបញ្ជាទិញរបស់អ្នកគ្រប់ពេលវេលា។',
    category: 'TRACKING',
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = FAQ_ITEMS.filter(
    (item) =>
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10">
        {/* ══ HEADER ════════════════════════════════════════════════════ */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-bold">
            <HelpCircle className="h-4 w-4" />
            <span>មជ្ឈមណ្ឌលជំនួយ & សំណួរញឹកញាប់</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            សំណួរដែលសួរញឹកញាប់ (FAQ)
          </h1>
          <p className="text-slate-400 text-sm">
            ចម្លើយរហ័សចំពោះសំណួរទូទៅទាក់ទងនឹងការបញ្ចូលពេជ្រ ការទូទាត់ និងសុវត្ថិភាពគណនី
          </p>

          {/* Search Box */}
          <div className="relative max-w-md mx-auto pt-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 mt-1" />
            <input
              type="text"
              placeholder="ស្វែងរកសំណួរ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
            />
          </div>
        </div>

        {/* ══ FAQ ACCORDION ═════════════════════════════════════════════ */}
        <div className="space-y-3">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl bg-slate-900/70 border border-slate-800/80 overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between space-x-4 cursor-pointer hover:bg-slate-900/90 transition-colors"
                >
                  <span className="font-bold text-sm sm:text-base text-white">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-pink-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ══ TELEGRAM SUPPORT CARD ═════════════════════════════════════ */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-pink-950/20 to-slate-900 border border-pink-500/20 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-lg font-black text-white">នៅតែមានចម្ងល់ ឬត្រូវការជំនួយបន្ទាន់?</h3>
            <p className="text-xs text-slate-400">ក្រុមការងារ Support ប្រចាំការ 24 ម៉ោង លើ 24 ម៉ោង រង់ចាំជួយអ្នក</p>
          </div>
          <a
            href="https://t.me/darazzdev"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs shadow-lg shadow-pink-500/20 flex items-center space-x-2 shrink-0 transition-all active:scale-95"
          >
            <Send className="h-4 w-4" />
            <span>Chat ទៅកាន់ Telegram Support</span>
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
