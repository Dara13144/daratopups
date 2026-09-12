'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LogOut, LayoutDashboard, Menu, X, 
  Home, Gamepad2, Send, User, ChevronRight, Sparkles,
  Sun, Search, Zap, HelpCircle, Users, Award, ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import Image from 'next/image';
import AnnouncementTicker from './AnnouncementTicker';
import { fetchProducts, GameProduct } from '../lib/api';

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

  // Load games for smart search
  useEffect(() => {
    fetchProducts().then(setAllGames).catch(console.error);
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
      setIsLoggedIn(true);
      setUserEmail(email || '');
      setIsAdmin(role === 'ADMIN');
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
    if (mobileMenuOpen || searchModalOpen || resellerModalOpen || creatorModalOpen || faqModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen, searchModalOpen, resellerModalOpen, creatorModalOpen, faqModalOpen]);

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
            <Link href="/" className="flex items-center space-x-2 shrink-0 group">
              <div className="relative h-9 w-9 rounded-full overflow-hidden ring-2 ring-pink-500/60 group-hover:ring-pink-400 transition-all shadow-md shrink-0 bg-slate-950">
                <Image
                  src="/images/nady-logo.png"
                  alt="NA-DY TOPUP"
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-black text-sm sm:text-base tracking-tight bg-gradient-to-r from-pink-400 via-rose-300 to-fuchsia-300 bg-clip-text text-transparent">
                  𝙉𝘼-𝘿𝙔 𝙏𝙊𝙋𝙐𝙋
                </span>
                <span className="text-[8px] text-pink-300/70 font-semibold hidden min-[400px]:block">
                  TOP-UP STORE
                </span>
              </div>
            </Link>

            {/* Complete Desktop Navigation Bar matching the exact design */}
            <nav className="hidden lg:flex items-center space-x-2 xl:space-x-3 text-xs font-bold">
              {/* Home */}
              <Link
                href="/"
                className="px-2.5 py-1.5 rounded-lg text-slate-200 hover:text-white font-bold transition-colors"
              >
                ទំព័រដើម
              </Link>

              {/* Games Pill (White pill with black text) */}
              <Link
                href="/#catalog"
                className="px-3.5 py-1 rounded-full bg-white hover:bg-slate-200 text-slate-950 font-black transition-all shadow-sm active:scale-95"
              >
                ហ្គេម
              </Link>

              {/* Track Orders */}
              <Link
                href="/history"
                className="px-2.5 py-1.5 rounded-lg text-slate-200 hover:text-white font-bold transition-colors"
              >
                តាមដាន
              </Link>

              {/* Reseller Program */}
              <button
                type="button"
                onClick={() => setResellerModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg text-slate-200 hover:text-white font-bold transition-colors cursor-pointer"
              >
                Reseller
              </button>

              {/* Creator Program */}
              <button
                type="button"
                onClick={() => setCreatorModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg text-slate-200 hover:text-white font-bold transition-colors cursor-pointer"
              >
                Creator
              </button>

              {/* FAQ */}
              <button
                type="button"
                onClick={() => setFaqModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg text-slate-200 hover:text-white font-bold transition-colors cursor-pointer"
              >
                FAQ
              </button>

              {/* Telegram Updates Sky Blue Pill */}
              <a
                href="https://t.me/darazzdev"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white font-black flex items-center space-x-1.5 shadow-md transition-all active:scale-95"
              >
                <Send className="h-3.5 w-3.5 fill-current -rotate-12" />
                <span>Updates</span>
              </a>

              {/* Theme Sun Toggle Button */}
              <button
                type="button"
                title="Brightness Mode"
                className="h-8 w-8 rounded-full bg-slate-900/90 hover:bg-slate-800 text-amber-400 border border-slate-700/60 transition-colors flex items-center justify-center cursor-pointer"
              >
                <Sun className="h-4 w-4" />
              </button>

              {/* ✨ Smart Search Button */}
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-white font-bold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-orange-400 fill-orange-400" />
                <span>Smart</span>
                <Search className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
              </button>

              {/* Quick Track Button */}
              <Link
                href="/history"
                className="px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-slate-200 hover:text-white font-bold transition-colors"
              >
                តាមដាន
              </Link>

              {/* ⚡ TOP UP White Pill Button */}
              <Link
                href="/#catalog"
                className="px-4 py-1.5 rounded-full bg-white hover:bg-slate-200 text-slate-950 font-black flex items-center space-x-1 shadow-md transition-all active:scale-95"
              >
                <Zap className="h-3.5 w-3.5 fill-current text-slate-950" />
                <span>TOP UP</span>
              </Link>

              {/* Admin Button (if logged in as admin) */}
              {mounted && isAdmin && (
                <Link
                  href="/admin"
                  className="px-3.5 py-1.5 rounded-full bg-violet-950/80 border border-violet-500/40 text-violet-400 hover:bg-violet-900/60 transition-all font-bold flex items-center space-x-1"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>Admin</span>
                </Link>
              )}
            </nav>

            {/* Right Quick Section for Mobile / Tablet */}
            <div className="flex items-center space-x-1.5 lg:hidden">
              {/* Smart Search on mobile */}
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>

              {/* ⚡ TOP UP Button on Mobile */}
              <Link
                href="/#catalog"
                className="px-2.5 py-1.5 rounded-xl bg-white text-slate-950 font-black text-xs flex items-center space-x-1 shadow-sm"
              >
                <Zap className="h-3 w-3 fill-current" />
                <span>TOP UP</span>
              </Link>

              {/* Mobile Hamburger Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-800 focus:outline-none"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
            <a
              href="https://t.me/darazzdev"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center space-x-1.5 shadow-md"
            >
              <Send className="h-3.5 w-3.5 fill-current" />
              <span>Apply via Telegram @darazzdev</span>
            </a>
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
            <a
              href="https://t.me/darazzdev"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-1.5 shadow-md"
            >
              <Send className="h-3.5 w-3.5 fill-current" />
              <span>Contact for Creator Sponsorship</span>
            </a>
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
            <button
              onClick={() => setFaqModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ══ MOBILE SLIDE-OVER DRAWER MENU ════════════════════════════════ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-[300px] h-full bg-slate-950 border-l border-slate-800 shadow-2xl z-10 flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300 text-slate-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full overflow-hidden ring-2 ring-cyan-500/50 shadow-xs">
                  <Image
                    src="/images/nady-avatar.png"
                    alt="NA-DY TOPUP"
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>
                <div className="font-black text-sm text-white">
                  MENU
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User Profile Card / Status */}
            <div className="p-4 border-b border-slate-800">
              {mounted && isLoggedIn ? (
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
              ) : (
                <div className="p-3 bg-gradient-to-br from-cyan-950/50 to-violet-950/50 border border-cyan-500/30 rounded-2xl">
                  <div className="text-xs font-bold text-white mb-1">
                    Welcome to NA-DY TOPUP
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                    Sign in to easily track your recharge invoices and digital codes.
                  </p>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center space-x-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-xs font-black shadow-sm glow-btn"
                  >
                    <span>{t.login} / Register</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>

            {/* Navigation List */}
            <div className="flex-1 p-3 space-y-1">
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

              <Link
                href="/history"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-900 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-cyan-400 font-black">📋</span>
                  <span>តាមដានការកុម្ម៉ង់ (Track Order)</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setResellerModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-900 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <Users className="h-4 w-4 text-cyan-400" />
                  <span>Reseller Program</span>
                </div>
                <span className="text-[10px] font-black bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-800">
                  VIP
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setCreatorModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-900 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <Award className="h-4 w-4 text-amber-400" />
                  <span>Creator Program</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-600" />
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
                  <span>FAQ (សំណួរញឹកញាប់)</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>

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
    </>
  );
}
