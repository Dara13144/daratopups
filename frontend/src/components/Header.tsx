'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LogOut, LayoutDashboard, Menu, X, 
  Home, Gamepad2, Send, User, ChevronRight, Sparkles,
  Sun, Moon, Search, Zap, HelpCircle, Users, Award, ShieldCheck, MessageSquare
} from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { useTheme } from '../lib/ThemeContext';
import Image from 'next/image';
import AnnouncementTicker from './AnnouncementTicker';
import CheckIdModal from './CheckIdModal';
import { fetchProducts, GameProduct } from '../lib/api';
import { subscribeToProductsRealtime } from '../lib/supabase';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  // Modals state for navbar actions
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allGames, setAllGames] = useState<GameProduct[]>([]);
  const [resellerModalOpen, setResellerModalOpen] = useState(false);
  const [creatorModalOpen, setCreatorModalOpen] = useState(false);
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [updatesModalOpen, setUpdatesModalOpen] = useState(false);
  const [checkIdModalOpen, setCheckIdModalOpen] = useState(false);
  const { theme, toggleTheme, isNight } = useTheme();

  // Load games for smart search
  useEffect(() => {
    fetchProducts().then(setAllGames).catch(console.error);

    const unsubscribe = subscribeToProductsRealtime((payload) => {
      if (payload?.eventType === 'DELETE' && payload.old?.id) {
        setAllGames((prev) => prev.filter((g) => g.id !== payload.old.id && g.slug !== payload.old.slug));
      }
      fetchProducts().then(setAllGames).catch(console.error);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Wait for client-side mount before reading localStorage
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('user_role');
    const email = localStorage.getItem('user_email');

    if (token) {
      const cleanEmail = (email || '').toLowerCase().trim();
      setIsLoggedIn(true);
      setUserEmail(cleanEmail);
      setIsAdmin(role === 'ADMIN' && cleanEmail === 'mdara9695@gmail.com');
    } else {
      setIsLoggedIn(false);
      setIsAdmin(false);
      setUserEmail('');
    }
    // Close mobile menu whenever pathname changes
    setMobileMenuOpen(false);
  }, [pathname, mounted]);

  // Lock body scroll when mobile menu or modal is open
  useEffect(() => {
    if (mobileMenuOpen || searchModalOpen || resellerModalOpen || creatorModalOpen || faqModalOpen || updatesModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen, searchModalOpen, resellerModalOpen, creatorModalOpen, faqModalOpen, updatesModalOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUserEmail('');
    setMobileMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  const filteredGames = allGames.filter(g => 
    !searchQuery || 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    g.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Top Animated Announcement Marquee Banner (Across All Pages) */}
      <AnnouncementTicker />

      <header className="sticky top-0 z-40 glass-panel border-x-0 border-t-0 rounded-none bg-[#1a0818]/95 backdrop-blur-md border-b border-pink-900/40 shadow-xl shadow-black/50 select-none">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-15 sm:h-16 gap-2">
            
            {/* Logo & Branding */}
            <Link href="/" className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0 group min-w-0">
              <div className="relative h-9 sm:h-12 w-auto shrink-0 transition-transform group-hover:scale-105">
                <Image
                  src="/images/nady-logo.png"
                  alt="NADYTOPUP.SITE"
                  width={68}
                  height={48}
                  className="h-full w-auto object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
                  priority
                  unoptimized
                />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-black text-xs sm:text-base tracking-tight bg-gradient-to-r from-cyan-300 via-sky-200 to-pink-300 bg-clip-text text-transparent">
                  NADYTOPUP.SITE
                </span>
                <span className="text-[7.5px] sm:text-[8.5px] font-extrabold text-cyan-400/90 tracking-wider flex items-center gap-1 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  <span>TOPUP STORE</span>
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links (Admin shortcut only) */}
            {mounted && isAdmin && (
              <nav className="hidden xl:flex items-center space-x-2 text-xs font-bold mr-2">
                <Link
                  href="/admin"
                  className="px-3 py-1.5 rounded-full bg-violet-950/80 border border-violet-500/40 text-violet-400 hover:bg-violet-900/60 transition-all font-bold flex items-center space-x-1 text-xs"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>Admin</span>
                </Link>
              </nav>
            )}

            {/* Header Right Actions (Language Switcher & Menu) */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto z-10">

              {/* Language Switcher Pill (KH / EN) */}
              <button
                type="button"
                onClick={() => setLanguage(language === 'KH' ? 'EN' : 'KH')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-xs font-black text-slate-200 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer"
                title={language === 'KH' ? 'Switch to English' : 'ប្តូរទៅភាសាខ្មែរ'}
                aria-label="Toggle Language"
              >
                <span className="text-sm">{language === 'KH' ? '🇰🇭' : '🇬🇧'}</span>
                <span className="text-[11px] tracking-wide font-black uppercase text-cyan-400">
                  {language === 'KH' ? 'ខ្មែរ' : 'EN'}
                </span>
              </button>

              {/* System Menu Button (Hamburger ☰) */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="btn-sys-dark-control"
                aria-label="System Menu"
                title="System Menu"
              >
                {mobileMenuOpen ? <X className="w-4.5 h-4.5 stroke-[2.5]" /> : <Menu className="w-4.5 h-4.5 stroke-[2.5]" />}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ══ MODAL: SMART SEARCH ══════════════════════════════════════════ */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div 
            className="fixed inset-0"
            onClick={() => setSearchModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 text-slate-200 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-orange-400 fill-orange-400" />
                <span className="font-extrabold text-sm text-white">Smart Game Search</span>
              </div>
              <button 
                onClick={() => setSearchModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                autoFocus
                placeholder="Search games (e.g. Free Fire, Mobile Legends, Roblox)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {filteredGames.slice(0, 8).map(game => (
                <Link
                  key={game.slug}
                  href={`/games/${game.slug}`}
                  onClick={() => setSearchModalOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 transition-all group"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <img 
                      src={game.image} 
                      alt={game.name}
                      onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40/1e293b/94a3b8?text=IMG'; }}
                      className="w-9 h-9 rounded-lg object-cover border border-slate-800 shrink-0" 
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white group-hover:text-cyan-400 truncate">{game.name}</div>
                      <div className="text-[10px] text-slate-400">{game.category} • {game.packages?.length || 0} packages</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500 text-slate-950 font-black text-[10px] uppercase shadow-xs shrink-0">
                    Top Up
                  </span>
                </Link>
              ))}
              {filteredGames.length === 0 && (
                <p className="text-center py-6 text-xs text-slate-500">No games found matching &quot;{searchQuery}&quot;</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: RESELLER PROGRAM ══════════════════════════════════════ */}
      {resellerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-200 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-cyan-400" />
                <h3 className="font-black text-base text-white">NA-DY TOPUP Reseller Program</h3>
              </div>
              <button onClick={() => setResellerModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Get wholesale discounted top-up pricing, VIP automated API endpoints, and instant Telegram delivery for your store or team.
            </p>
            <div className="space-y-2 mb-5 text-xs text-slate-400 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center space-x-2 text-white font-bold">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Wholesale rates up to 15% discount</span>
              </div>
              <div className="flex items-center space-x-2 text-white font-bold">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Automated instant KHQR checkout</span>
              </div>
              <div className="flex items-center space-x-2 text-white font-bold">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>24/7 dedicated support representative</span>
              </div>
            </div>
            <div className="space-y-2">
              <a
                href="https://t.me/darazzdev"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center space-x-1.5 shadow-md"
              >
                <Send className="h-3.5 w-3.5 fill-current" />
                <span>Apply via Telegram @darazzdev</span>
              </a>
              <Link
                href="/reseller"
                onClick={() => setResellerModalOpen(false)}
                className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-cyan-400 font-bold text-xs text-center block border border-cyan-500/20"
              >
                View Full Reseller Program Details →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: CREATOR PROGRAM ═══════════════════════════════════════ */}
      {creatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-200 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-amber-400" />
                <h3 className="font-black text-base text-white">Creator Partner Program</h3>
              </div>
              <button onClick={() => setCreatorModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Are you a TikToker, Streamer, or YouTuber in Cambodia? Partner with <strong>NA-DY TOPUP</strong> to earn commissions and host giveaways for your community.
            </p>
            <div className="space-y-2 mb-5 text-xs text-slate-400 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center space-x-2 text-white font-bold">
                <Award className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Custom Promo Code for your followers</span>
              </div>
              <div className="flex items-center space-x-2 text-white font-bold">
                <Award className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Free monthly diamond sponsor packs</span>
              </div>
            </div>
            <div className="space-y-2">
              <a
                href="https://t.me/darazzdev"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-1.5 shadow-md"
              >
                <Send className="h-3.5 w-3.5 fill-current" />
                <span>Contact for Creator Sponsorship</span>
              </a>
              <Link
                href="/creator"
                onClick={() => setCreatorModalOpen(false)}
                className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-amber-400 font-bold text-xs text-center block border border-amber-500/20"
              >
                View Full Creator Perks & Requirements →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: FAQ / HELP ════════════════════════════════════════════ */}
      {faqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-200 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <HelpCircle className="h-5 w-5 text-cyan-400" />
                <h3 className="font-black text-base text-white">Frequently Asked Questions</h3>
              </div>
              <button onClick={() => setFaqModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs mb-5 max-h-72 overflow-y-auto pr-1">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <strong className="text-white block mb-1">តើត្រូវចំណាយពេលប៉ុន្មានទើបទទួលបាន?</strong>
                <p className="text-slate-400 text-[11px]">ការបញ្ចូលទឹកប្រាក់គឺស្វ័យប្រវត្តិកំពូលលឿន (ប្រហែល 5 ទៅ 60 វិនាទី) បន្ទាប់ពីការស្កេន KHQR ជោគជ័យ។</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <strong className="text-white block mb-1">តើអាចបង់ប្រាក់តាមធនាគារណាខ្លះ?</strong>
                <p className="text-slate-400 text-[11px]">យើងគាំទ្រ KHQR គ្រប់ធនាគារ (ABA, Bakong, Canadia, Wing, ACLEDA, Sathapana, etc.)។</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <strong className="text-white block mb-1">ចុះបើមានបញ្ហា ត្រូវទាក់ទងអ្នកណា?</strong>
                <p className="text-slate-400 text-[11px]">អាចទាក់ទងមកកាន់ Telegram Support @darazzdev បាន 24/7។</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href="/faq"
                onClick={() => setFaqModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 text-center font-bold text-xs border border-pink-500/30"
              >
                View Full FAQ Page →
              </Link>
              <button
                onClick={() => setFaqModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: TELEGRAM UPDATES & ANNOUNCEMENTS ════════════════════════ */}
      {updatesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-200 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                  <Send className="h-4 w-4 fill-current -rotate-12" />
                </div>
                <h3 className="font-black text-base text-white">NA-DY TOPUP Updates & News</h3>
              </div>
              <button onClick={() => setUpdatesModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-3 text-xs mb-5 max-h-72 overflow-y-auto pr-1">
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-sky-500/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded-full border border-sky-800">
                    Flash Sale ⚡
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">Today</span>
                </div>
                <strong className="text-white block pt-1">🎉 បញ្ចុះតម្លៃពិសេស 10% គ្រប់កញ្ចប់ពេជ្រ MLBB & Free Fire!</strong>
                <p className="text-slate-400 text-[11px] leading-relaxed">បញ្ចូលពេជ្ររហ័ស 24/7 តាម ABA KHQR & Bakong ដោយឥតគិតថ្លៃសេវាបន្ថែម។</p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-pink-400 bg-pink-950/80 px-2 py-0.5 rounded-full border border-pink-800">
                    System Notice
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">Live 24/7</span>
                </div>
                <strong className="text-white block pt-1">🚀 ប្រព័ន្ធ Server & API ដំណើរការពេញលេញ 100%</strong>
                <p className="text-slate-400 text-[11px] leading-relaxed">ការទូទាត់ប្រាក់និងការបញ្ជូនពេជ្រគឺស្វ័យប្រវត្តក្នុងរយៈពេលពី 1 ទៅ 30 វិនាទី។</p>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href="https://t.me/darazzdev"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs flex items-center justify-center space-x-2 shadow-lg shadow-sky-500/25 transition-all"
              >
                <Send className="h-4 w-4 fill-current -rotate-12" />
                <span>Join Official Telegram Channel</span>
              </a>
              <button
                onClick={() => setUpdatesModalOpen(false)}
                className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ SYSTEM SLIDE-OVER DRAWER MENU (All Devices) ════════════════════════ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-[320px] h-full bg-slate-950 border-l border-slate-800 shadow-2xl z-10 flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300 text-slate-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
              <div className="flex items-center space-x-2.5">
                <div className="h-9 w-13 rounded-xl overflow-hidden ring-2 ring-cyan-500/50 shadow-xs bg-slate-950/90 p-0.5">
                  <Image
                    src="/images/nady-logo.png"
                    alt="NADYTOPUP.SITE"
                    width={52}
                    height={36}
                    className="h-full w-full object-contain"
                    unoptimized
                  />
                </div>
                <div>
                  <div className="font-black text-sm text-cyan-300 leading-tight">
                    NADYTOPUP.SITE
                  </div>
                  <div className="text-[10px] font-bold text-slate-400">
                    System Menu & Services
                  </div>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="h-9 w-9 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>


            {/* User Profile Card / Status (Only when logged in) */}
            {mounted && isLoggedIn && (
              <div className="p-4 border-b border-slate-800">
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl">
                  <div className="flex items-center space-x-2.5">
                    <div className="h-9 w-9 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm border border-cyan-500/30">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase font-bold text-slate-500">
                        {isAdmin ? 'Administrator' : 'Customer Account'}
                      </div>
                      <div className="text-xs font-bold text-slate-200 truncate" title={userEmail}>
                        {userEmail}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation List */}
            <div className="flex-1 p-3 space-y-1">
              {/* Language Switcher inside Drawer */}
              <div className="p-3 rounded-xl border border-cyan-500/25 bg-cyan-500/10 mb-2">
                <div className="text-[10px] uppercase font-black text-cyan-300 mb-2 flex items-center justify-between">
                  <span>{language === 'KH' ? 'ជ្រើសរើសភាសា (Language)' : 'Select Language'}</span>
                  <span className="text-white font-extrabold">{language === 'KH' ? '🇰🇭 ខ្មែរ (KH)' : '🇬🇧 English (EN)'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLanguage('KH')}
                    className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      language === 'KH'
                        ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 shadow-md'
                        : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                    }`}
                  >
                    <span className="text-sm">🇰🇭</span>
                    <span>ខ្មែរ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('EN')}
                    className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      language === 'EN'
                        ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 shadow-md'
                        : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                    }`}
                  >
                    <span className="text-sm">🇬🇧</span>
                    <span>English</span>
                  </button>
                </div>
              </div>

              {/* Light / Night Mode Switcher inside Drawer */}
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer border border-pink-500/25 bg-pink-500/10 hover:bg-pink-500/20 text-slate-100 mb-2"
              >
                <div className="flex items-center space-x-3">
                  {isNight ? (
                    <Sun className="h-4 w-4 text-amber-400 fill-amber-400/20" />
                  ) : (
                    <Moon className="h-4 w-4 text-pink-400 fill-pink-400" />
                  )}
                  <span>{isNight ? (language === 'KH' ? 'ប្ដូរទៅពន្លឺ (Light Mode)' : 'Switch to Light Mode') : (language === 'KH' ? 'ប្ដូរទៅរាត្រី (Night Mode)' : 'Switch to Night Mode')}</span>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  isNight ? 'bg-amber-400 text-slate-950' : 'bg-pink-600 text-white'
                }`}>
                  {isNight ? 'NIGHT' : 'LIGHT'}
                </span>
              </button>

              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                  pathname === '/'
                    ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 font-black'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Home className="h-4 w-4 text-cyan-400" />
                  <span>{t.browseGames}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </Link>

              <Link
                href="/#catalog"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-900 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <Gamepad2 className="h-4 w-4 text-emerald-400" />
                  <span>{t.allProducts}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setCheckIdModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-amber-400 font-black">🔍</span>
                  <span>{language === 'KH' ? 'ពិនិត្យ ID ហ្គេម (MLBB & Free Fire)' : 'Check Game ID (Live Check)'}</span>
                </div>
                <span className="text-[10px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full shadow-xs">
                  {language === 'KH' ? 'ឥតគិតថ្លៃ' : 'FREE'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setFaqModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-900 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <HelpCircle className="h-4 w-4 text-sky-400" />
                  <span>{t.faq}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>

              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-900 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-4 w-4 text-pink-400" />
                  <span>{t.contact}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </Link>

              <a
                href="https://t.me/darazzdev"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl text-xs font-bold text-white bg-[#0284c7]/20 border border-[#0284c7]/40 hover:bg-[#0284c7]/30 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <Send className="h-4 w-4 text-[#0284c7]" />
                  <span>Telegram Updates</span>
                </div>
                <span className="text-[10px] font-black bg-[#0284c7] text-white px-2 py-0.5 rounded-full shadow-xs">
                  Updates
                </span>
              </a>

              {mounted && isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                    pathname.startsWith('/admin')
                      ? 'bg-violet-950/60 text-violet-400 border border-violet-500/30'
                      : 'text-violet-400 hover:bg-violet-950/30'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <LayoutDashboard className="h-4 w-4 text-violet-400" />
                    <span>Admin Dashboard</span>
                  </div>
                  <span className="text-[10px] font-black bg-violet-900/50 text-violet-300 px-2 py-0.5 rounded-full">
                    Panel
                  </span>
                </Link>
              )}
            </div>

            {/* Drawer Footer Actions */}
            {mounted && isLoggedIn && (
              <div className="p-4 border-t border-slate-800 mt-auto bg-slate-900/50">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border border-red-900/60 bg-red-950/30 text-red-400 hover:bg-red-900/50 text-xs font-bold transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t.logout}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Check ID Modal */}
      <CheckIdModal
        isOpen={checkIdModalOpen}
        onClose={() => setCheckIdModalOpen(false)}
      />
    </>
  );
}
