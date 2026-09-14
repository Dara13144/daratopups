'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function TelegramSupport() {
  const pathname = usePathname();

  // Hide inside admin panel to prevent covering admin controls
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <aside aria-label="Live Telegram Support" className="fixed bottom-6 right-6 z-50 flex items-center group">
      {/* Hover Tooltip on Desktop */}
      <div className="hidden sm:flex items-center mr-3 px-3.5 py-1.5 rounded-full bg-slate-900/95 border border-cyan-500/30 text-slate-100 text-xs font-bold shadow-xl shadow-black/50 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0 pointer-events-none">
        <span className="relative flex h-2 w-2 mr-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>Telegram Support 24/7</span>
      </div>

      {/* Floating Circular Telegram Button */}
      <a
        href="https://t.me/darazzdev"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact Telegram Support @darazzdev"
        className="relative h-13 w-13 md:h-14 md:w-14 rounded-full bg-gradient-to-tr from-[#0088cc] via-[#24A1DE] to-[#37bbee] text-white flex items-center justify-center shadow-[0_8px_25px_rgba(36,161,222,0.45)] hover:shadow-[0_12px_32px_rgba(36,161,222,0.65)] hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer border border-white/20"
      >
        {/* Telegram Official SVG Plane Icon */}
        <svg
          className="h-7 w-7 text-white fill-current transform -translate-x-0.5 translate-y-0.5 group-hover:rotate-6 transition-transform duration-300"
          viewBox="0 0 24 24"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>

        {/* Pulsing Status Dot */}
        <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-950"></span>
        </span>
      </a>
    </aside>
  );
}
