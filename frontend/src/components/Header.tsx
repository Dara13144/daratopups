'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, LayoutDashboard, History, Zap } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import Image from 'next/image';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState('');
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
  }, [pathname, mounted]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUserEmail('');
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-x-0 border-t-0 rounded-none bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-cyan-500/60 group-hover:ring-cyan-400 transition-all shadow-lg shadow-cyan-900/30">
              <Image
                src="/images/robby-avatar.png"
                alt="ROBBY-TOPUP"
                width={40}
                height={40}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-orange-400 to-cyan-400 bg-clip-text text-transparent">
                𝙍𝙊𝘽𝘽𝙔-𝙏𝙊𝙋𝙐𝙋
              </span>
              <span className="text-[9px] text-slate-500 font-semibold">
                • គុណភាព • សុវត្ថិភាព • តម្លៃសមរម្យ
              </span>
            </div>
          </Link>

          {/* Navigation links */}
          <nav className="flex items-center space-x-2">
            {mounted && isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm ${
                  pathname.startsWith('/admin')
                    ? 'text-violet-700 bg-violet-100/80 border border-violet-300 shadow-sm'
                    : 'text-slate-700 hover:text-violet-600 bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200'
                }`}
              >
                <LayoutDashboard className="h-4 w-4 text-violet-600" />
                <span>Admin Dashboard</span>
              </Link>
            )}
          </nav>

          {/* Right Section: Telegram Support & Admin Auth */}
          <div className="flex items-center space-x-3">
            {/* Telegram Support Button - Icon Only */}
            <a
              href="https://t.me/darazzdev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center h-9 w-9 rounded-full bg-[#229ED9]/15 hover:bg-[#229ED9]/25 border border-[#229ED9]/40 hover:border-[#229ED9] text-[#229ED9] transition-all shadow-md shadow-[#229ED9]/10 hover:scale-110"
              title="Telegram Support"
            >
              <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.535-.197 1.006.128.832.946z"/>
              </svg>
            </a>

            {mounted && isLoggedIn && isAdmin && (
              <div className="flex items-center space-x-3">
                <span className="hidden md:inline-block text-xs text-slate-500 font-medium">
                  {t.loggedInAs}: <strong className="text-slate-800 font-bold">{userEmail}</strong>
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-300 text-slate-700 hover:text-red-600 text-xs font-bold transition-all shadow-sm"
                  title="Logout"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t.logout}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
