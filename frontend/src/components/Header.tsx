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
    <header className="sticky top-0 z-50 glass-panel border-x-0 border-t-0 rounded-none bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-orange-500/60 group-hover:ring-orange-400 transition-all shadow-lg shadow-orange-900/30">
              <Image
                src="/images/daratopup-avatar.png"
                alt="DaraTopup"
                width={40}
                height={40}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-orange-400 to-cyan-400 bg-clip-text text-transparent">
                𝘿𝘼𝙍𝘼-𝙏𝙊𝙋𝙐𝙋
              </span>
              <span className="text-[9px] text-slate-500 font-semibold">
                • គុណភាព • សុវត្ថិភាព • តម្លៃសមរម្យ
              </span>
            </div>
          </Link>

          {/* Navigation links */}
          <nav className="flex items-center space-x-1">
            {mounted && isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname.startsWith('/admin') ? 'text-violet-400 bg-slate-900/60' : 'text-slate-300 hover:text-violet-400 hover:bg-slate-900/30'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>{t.adminDashboard}</span>
              </Link>
            )}
          </nav>

          {/* Right Section: Admin Auth only */}
          <div className="flex items-center space-x-3">
            {mounted && isLoggedIn && isAdmin && (
              <div className="flex items-center space-x-3">
                <span className="hidden md:inline-block text-xs text-slate-400 font-medium">
                  {t.loggedInAs}: <strong className="text-slate-200">{userEmail}</strong>
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-red-950/30 hover:border-red-900 text-slate-300 hover:text-red-400 text-sm font-medium transition-all"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
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
