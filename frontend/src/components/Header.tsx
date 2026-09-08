'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LogOut, LayoutDashboard, Menu, X, 
  Home, Gamepad2, Send, User, ChevronRight, Sparkles 
} from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import Image from 'next/image';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

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

  return (
    <>
      <header className="sticky top-0 z-40 glass-panel border-x-0 border-t-0 rounded-none bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-15 sm:h-16">
            
            {/* Logo & Branding */}
            <Link href="/" className="flex items-center space-x-2 sm:space-x-2.5 group shrink-0 min-w-0">
              <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full overflow-hidden ring-2 ring-cyan-500/60 group-hover:ring-cyan-400 transition-all shadow-md shadow-cyan-900/20 shrink-0">
                <Image
                  src="/images/robby-avatar.png"
                  alt="DARA-TOPUP"
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </div>
              <div className="flex flex-col leading-none truncate">
                <span className="font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-orange-500 via-amber-500 to-cyan-500 bg-clip-text text-transparent truncate">
                  𝘿𝘼𝙍𝘼-𝙏𝙊𝙋𝙐𝙋
                </span>
                <span className="text-[8.5px] sm:text-[9.5px] text-slate-500 font-semibold truncate">
                  • គុណភាព • សុវត្ថិភាព • តម្លៃសមរម្យ
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-2">
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  pathname === '/'
                    ? 'text-cyan-700 bg-cyan-50 border border-cyan-200'
                    : 'text-slate-700 hover:text-cyan-600 hover:bg-slate-100'
                }`}
              >
                {t.browseGames}
              </Link>
              {mounted && isAdmin && (
                <Link
                  href="/admin"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs ${
                    pathname.startsWith('/admin')
                      ? 'text-violet-700 bg-violet-100/90 border border-violet-300'
                      : 'text-slate-700 hover:text-violet-600 bg-slate-100 hover:bg-slate-200/80 border border-slate-200'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4 text-violet-600" />
                  <span>Admin</span>
                </Link>
              )}
            </nav>

            {/* Right Section: Support & Auth Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Telegram Support Button */}
              <a
                href="https://t.me/darazzdev"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-9 w-9 rounded-full bg-[#229ED9]/15 hover:bg-[#229ED9]/25 border border-[#229ED9]/40 hover:border-[#229ED9] text-[#229ED9] transition-all shadow-xs hover:scale-105 active:scale-95"
                title="Telegram Support"
                aria-label="Telegram Support"
              >
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.535-.197 1.006.128.832.946z"/>
                </svg>
              </a>

              {/* Desktop Auth Section */}
              <div className="hidden md:flex items-center space-x-2">
                {mounted && isLoggedIn ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500 font-medium max-w-[140px] truncate" title={userEmail}>
                      {userEmail}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-300 text-slate-700 hover:text-red-600 text-xs font-bold transition-all"
                      title="Logout"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>{t.logout}</span>
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center space-x-1 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white text-xs font-black shadow-xs transition-all glow-btn"
                  >
                    <span>{t.login}</span>
                  </Link>
                )}
              </div>

              {/* Mobile Hamburger Menu Button (Min 44x44px Touch Target) */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200/80 active:bg-slate-300 text-slate-700 transition-colors border border-slate-200/80 focus:outline-none"
                aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5 text-slate-800" />
                ) : (
                  <Menu className="h-5 w-5 text-slate-800" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ══ MOBILE SLIDE-OVER DRAWER MENU ════════════════════════════════ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-[300px] h-full bg-white shadow-2xl z-10 flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full overflow-hidden ring-2 ring-cyan-500/50 shadow-xs">
                  <Image
                    src="/images/robby-avatar.png"
                    alt="Logo"
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>
                <div className="font-black text-sm text-slate-900">
                  MENU
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User Profile Card / Status */}
            <div className="p-4 border-b border-slate-100">
              {mounted && isLoggedIn ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center space-x-2.5">
                    <div className="h-9 w-9 rounded-full bg-cyan-500/10 text-cyan-600 flex items-center justify-center font-bold text-sm border border-cyan-500/20">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        {isAdmin ? 'Administrator' : 'Customer Account'}
                      </div>
                      <div className="text-xs font-bold text-slate-800 truncate" title={userEmail}>
                        {userEmail}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gradient-to-br from-cyan-50 to-violet-50 border border-cyan-200/60 rounded-2xl">
                  <div className="text-xs font-bold text-slate-800 mb-1">
                    Welcome to DARA-TOPUP
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
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
                    ? 'bg-cyan-50 text-cyan-700 border border-cyan-200/80 font-black'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Home className="h-4 w-4 text-cyan-600" />
                  <span>{t.browseGames}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>

              <Link
                href="/#catalog"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <Gamepad2 className="h-4 w-4 text-emerald-600" />
                  <span>{t.allProducts}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>


              <a
                href="https://t.me/darazzdev"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl text-xs font-bold text-[#229ED9] hover:bg-sky-50 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <Send className="h-4 w-4 text-[#229ED9]" />
                  <span>Telegram Support</span>
                </div>
                <span className="text-[10px] font-black bg-[#229ED9]/10 text-[#229ED9] px-2 py-0.5 rounded-full">
                  Fast
                </span>
              </a>

              {mounted && isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                    pathname.startsWith('/admin')
                      ? 'bg-violet-50 text-violet-700 border border-violet-200'
                      : 'text-violet-700 hover:bg-violet-50/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <LayoutDashboard className="h-4 w-4 text-violet-600" />
                    <span>Admin Dashboard</span>
                  </div>
                  <span className="text-[10px] font-black bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                    Panel
                  </span>
                </Link>
              )}
            </div>

            {/* Drawer Footer Actions */}
            {mounted && isLoggedIn && (
              <div className="p-4 border-t border-slate-100 mt-auto bg-slate-50/50">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition-colors"
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
