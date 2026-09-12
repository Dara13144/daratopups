'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Gamepad2, History, User, MessageCircle, ShieldCheck } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('user_role');
    setIsLoggedIn(!!token);
    setIsAdmin(role === 'ADMIN');
  }, [pathname]);

  // Don't display bottom nav inside admin dashboard to prevent cluttering admin tools
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      label: 'Games',
      href: '/#catalog',
      icon: Gamepad2,
      isActive: pathname === '/#catalog' || pathname.startsWith('/games'),
    },
    {
      label: 'Orders',
      href: '/history',
      icon: History,
      isActive: pathname === '/history' || pathname.startsWith('/orders'),
    },
    {
      label: 'Support',
      href: 'https://t.me/darazzdev',
      icon: MessageCircle,
      isActive: false,
      isExternal: true,
    },
    {
      label: mounted && isAdmin ? 'Admin' : mounted && isLoggedIn ? 'Account' : 'Login',
      href: mounted && isAdmin ? '/admin' : mounted && isLoggedIn ? '/history' : '/login',
      icon: mounted && isAdmin ? ShieldCheck : User,
      isActive: pathname === '/login' || pathname === '/admin',
    },
  ];

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 shadow-[0_-8px_25px_rgba(0,0,0,0.5)] safe-area-pb"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          if (item.isExternal) {
            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center flex-1 h-full min-h-[44px] py-1 text-slate-400 hover:text-cyan-400 transition-colors group select-none active:scale-95"
              >
                <div className="relative p-1 rounded-xl group-hover:bg-slate-800 transition-colors">
                  <Icon className="h-5 w-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-cyan-400 mt-0.5 tracking-tight">
                  {item.label}
                </span>
              </a>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] py-1 transition-all select-none active:scale-95 ${
                active ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`relative p-1 rounded-xl transition-all ${
                active ? 'bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 scale-105' : ''
              }`}>
                <Icon className={`h-5 w-5 ${active ? 'text-cyan-400 stroke-[2.5]' : 'text-slate-400'}`} />
                {active && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full" />
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 ${
                active ? 'font-black text-cyan-400' : 'font-semibold text-slate-400'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
