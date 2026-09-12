'use client';

import React from 'react';
import { Megaphone, Send } from 'lucide-react';

export default function AnnouncementTicker() {
  const tickerItems = [
    'បញ្ចូលទឹកប្រាក់ភ្លាមៗ',
    'KHQR គ្រប់ធនាគារ',
    '24/7 TELEGRAM SUPPORT',
    'ស្វ័យប្រវត្តិលឿនបំផុត',
    'NA-DY TOPUP',
    'សុវត្ថិភាព 100%',
  ];

  return (
    <div className="relative w-full bg-gradient-to-r from-[#e52d27] via-[#b31217] to-[#ff5722] text-white shadow-md border-b border-red-700/50 overflow-hidden z-30 select-none">
      <div className="max-w-7xl mx-auto flex items-center h-8 sm:h-9 px-2 sm:px-4">
        
        {/* Left Indicator Icon */}
        <div className="flex items-center space-x-1.5 shrink-0 pr-3 z-10">
          <div className="relative flex items-center justify-center">
            <Megaphone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-200 animate-bounce drop-shadow" />
          </div>
        </div>

        {/* Center Marquee Content with Seamless Infinite Loop */}
        <div className="flex-1 overflow-hidden relative marquee-container mask-linear-gradient flex items-center">
          <div className="animate-ticker-marquee flex items-center space-x-6 whitespace-nowrap text-[11px] sm:text-xs font-black tracking-wide">
            {/* Set 1 */}
            {tickerItems.map((item, idx) => (
              <span key={`t1-${idx}`} className="inline-flex items-center space-x-2 text-white/95">
                <span>{item}</span>
                <span className="text-amber-300 font-bold">•</span>
              </span>
            ))}
            {/* Set 2 (Duplicate for continuous loop) */}
            {tickerItems.map((item, idx) => (
              <span key={`t2-${idx}`} className="inline-flex items-center space-x-2 text-white/95">
                <span>{item}</span>
                <span className="text-amber-300 font-bold">•</span>
              </span>
            ))}
            {/* Set 3 */}
            {tickerItems.map((item, idx) => (
              <span key={`t3-${idx}`} className="inline-flex items-center space-x-2 text-white/95">
                <span>{item}</span>
                <span className="text-amber-300 font-bold">•</span>
              </span>
            ))}
            {/* Set 4 */}
            {tickerItems.map((item, idx) => (
              <span key={`t4-${idx}`} className="inline-flex items-center space-x-2 text-white/95">
                <span>{item}</span>
                <span className="text-amber-300 font-bold">•</span>
              </span>
            ))}
          </div>
        </div>

        {/* Right CTA: JOIN Telegram Button matching user design */}
        <div className="shrink-0 pl-2.5 sm:pl-4 z-10">
          <a
            href="https://t.me/darazzdev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 text-white font-extrabold text-[10px] sm:text-[11px] transition-all duration-200 hover:scale-105 active:scale-95 shadow-xs"
            title="Join Telegram Channel"
          >
            <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current text-white -rotate-12" />
            <span className="tracking-wide">JOIN NA-DY TOPUP</span>
          </a>
        </div>

      </div>
    </div>
  );
}
