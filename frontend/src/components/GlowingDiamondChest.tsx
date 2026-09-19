'use client';

import React from 'react';

interface GlowingDiamondChestProps {
  amount?: number | string;
  className?: string;
}

/**
 * Glowing Diamond Chest component inspired by official topup platforms (Codashop, Smile.one, VNG).
 * Features an open chest overflowing with radiant blue crystal diamonds,
 * a magical cyan/blue aura, sparkling light particles, and the bold number badge.
 */
export default function GlowingDiamondChest({
  amount = 100,
  className = 'w-16 h-12 sm:w-20 sm:h-14',
}: GlowingDiamondChestProps) {
  // Format amount cleanly (e.g. 100, 310, 1060, etc.)
  const displayAmount = String(amount).replace(/[^\d+kK]/g, '') || String(amount);

  return (
    <div className={`relative inline-flex items-center justify-center select-none shrink-0 ${className}`}>
      <svg
        viewBox="0 0 90 65"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_12px_rgba(0,180,255,0.7)] transition-transform duration-200 group-hover:scale-105"
      >
        <defs>
          {/* Intense Magical Blue Glow */}
          <filter id="auraGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Number Drop Shadow */}
          <filter id="badgeShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.85" />
          </filter>

          {/* Radial Blue Aura */}
          <radialGradient id="magicAura" cx="45" cy="24" r="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#0099ff" stopOpacity="0.65" />
            <stop offset="85%" stopColor="#0044ff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0022cc" stopOpacity="0" />
          </radialGradient>

          {/* Metallic Navy Chest Body */}
          <linearGradient id="chestBodyGrad" x1="45" y1="26" x2="45" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="45%" stopColor="#152132" />
            <stop offset="100%" stopColor="#0b131f" />
          </linearGradient>

          {/* Gold Latch and Trim */}
          <linearGradient id="goldTrimGrad" x1="15" y1="26" x2="75" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="35%" stopColor="#fef08a" />
            <stop offset="70%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          {/* Diamond Crystals Multi-Stop Gradients */}
          <linearGradient id="gemFacet1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e0f7ff" />
            <stop offset="60%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          <linearGradient id="gemFacet2" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#0369a1" />
            <stop offset="50%" stopColor="#00d2ff" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          <linearGradient id="gemFacet3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bbf2ff" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0044aa" />
          </linearGradient>
        </defs>

        {/* 1. Neon Blue Magical Radiance / Aura Behind Chest */}
        <ellipse cx="45" cy="27" rx="36" ry="23" fill="url(#magicAura)" filter="url(#auraGlow)" />

        {/* 2. Open Lid Back Arc */}
        <path
          d="M17 22 C17 8, 73 8, 73 22 L76 26 L14 26 Z"
          fill="#111827"
          stroke="#1e293b"
          strokeWidth="1.5"
        />
        {/* Lid Top Gold Band */}
        <path
          d="M21 15 C33 9, 57 9, 69 15"
          stroke="url(#goldTrimGrad)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* 3. Shimmering Blue Diamond Mountain */}
        <g filter="url(#auraGlow)">
          {/* Back gems */}
          <path d="M18 28 L28 17 L36 26 L23 33 Z" fill="url(#gemFacet1)" />
          <path d="M28 17 L38 7 L48 21 L36 26 Z" fill="url(#gemFacet2)" />
          <path d="M38 7 L50 3 L58 15 L48 21 Z" fill="#ffffff" opacity="0.9" />
          <path d="M50 3 L62 8 L68 21 L58 15 Z" fill="url(#gemFacet1)" />
          <path d="M62 8 L73 18 L68 27 L65 21 Z" fill="url(#gemFacet3)" />

          {/* Front gem cluster & crystal facets */}
          <polygon points="25,27 34,20 40,28 31,33" fill="url(#gemFacet3)" />
          <polygon points="34,20 46,11 53,23 40,28" fill="url(#gemFacet2)" />
          <polygon points="46,11 56,13 62,25 53,23" fill="#e0f9ff" />
          <polygon points="56,13 67,21 63,29 61,25" fill="url(#gemFacet1)" />
          <polygon points="39,27 49,21 57,29 47,35" fill="url(#gemFacet2)" />

          {/* Sparkling gems falling on sides */}
          <polygon points="12,38 18,33 19,42 13,44" fill="#38bdf8" />
          <polygon points="72,36 78,38 77,46 71,43" fill="#38bdf8" />
          <circle cx="14" cy="46" r="2.5" fill="#67e8f9" />
          <circle cx="76" cy="47" r="2.5" fill="#67e8f9" />

          {/* Glowing sparkle dots */}
          <circle cx="43" cy="13" r="2" fill="#ffffff" />
          <circle cx="53" cy="17" r="1.6" fill="#ffffff" />
          <circle cx="31" cy="23" r="1.4" fill="#ffffff" />
          <circle cx="63" cy="23" r="1.4" fill="#ffffff" />

          {/* Twinkle Star Glints */}
          <path d="M49 7 L50.5 10 L53.5 11.5 L50.5 13 L49 16 L47.5 13 L44.5 11.5 L47.5 10 Z" fill="#ffffff" />
          <path d="M28 14 L29 16 L31 17 L29 18 L28 20 L27 18 L25 17 L27 16 Z" fill="#ffffff" />
        </g>

        {/* 4. Chest Body (Front Box) */}
        <path
          d="M15 25 L75 25 L71 52 C71 55.5, 67.5 58, 63.5 58 L26.5 58 C22.5 58, 19 55.5, 19 52 Z"
          fill="url(#chestBodyGrad)"
          stroke="#334155"
          strokeWidth="1.2"
        />

        {/* 5. Gold Latch, Rim & Corner Straps */}
        {/* Top Gold Rim */}
        <path d="M14 25 L76 25 L75 29 L15 29 Z" fill="url(#goldTrimGrad)" />
        {/* Bottom Gold Rim */}
        <path d="M18 49 L72 49 L71 52 L19 52 Z" fill="url(#goldTrimGrad)" opacity="0.9" />

        {/* Gold Corner Straps */}
        <rect x="18" y="25" width="4.5" height="27" rx="1" fill="url(#goldTrimGrad)" />
        <rect x="67.5" y="25" width="4.5" height="27" rx="1" fill="url(#goldTrimGrad)" />

        {/* Center Golden Lock Plate */}
        <path
          d="M41 27 L49 27 L48 35 C48 37, 42 37, 42 35 Z"
          fill="url(#goldTrimGrad)"
          stroke="#78350f"
          strokeWidth="0.8"
        />
        <circle cx="45" cy="32" r="1.5" fill="#1e293b" />

        {/* 6. Front Bold Number Overlay (Exact Look from User Uploaded Screenshot) */}
        <g filter="url(#badgeShadow)">
          <text
            x="45"
            y="47"
            textAnchor="middle"
            fontFamily="'Inter', -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontWeight="900"
            fontSize={displayAmount.length >= 5 ? '17' : displayAmount.length >= 4 ? '19' : '22'}
            letterSpacing="-0.5"
            fill="#ffffff"
            stroke="#1e242d"
            strokeWidth="4.8"
            strokeLinejoin="round"
            style={{ paintOrder: 'stroke fill' }}
          >
            {displayAmount}
          </text>
        </g>
      </svg>
    </div>
  );
}
