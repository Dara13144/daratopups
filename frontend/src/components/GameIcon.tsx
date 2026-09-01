'use client';

import React, { useState } from 'react';
import { Gamepad2 } from 'lucide-react';
import { getGameArtwork } from '../lib/gameArtworks';

interface GameIconProps {
  slug: string;
  name?: string;
  image?: string;
  className?: string;
}

const GRADIENT_THEMES = [
  { bg: 'from-amber-600/40 via-orange-700/30 to-slate-950', border: 'border-amber-500/50', text: 'text-amber-300', glow: '#f59e0b', tag: 'RPG / ADVENTURE' },
  { bg: 'from-cyan-600/40 via-blue-700/30 to-slate-950', border: 'border-cyan-500/50', text: 'text-cyan-300', glow: '#06b6d4', tag: 'MOBA / TACTICAL' },
  { bg: 'from-rose-600/40 via-red-700/30 to-slate-950', border: 'border-rose-500/50', text: 'text-rose-300', glow: '#f43f5e', tag: 'ACTION / FPS' },
  { bg: 'from-purple-600/40 via-violet-700/30 to-slate-950', border: 'border-purple-500/50', text: 'text-purple-300', glow: '#a855f7', tag: 'ANIME / GACHA' },
  { bg: 'from-emerald-600/40 via-teal-700/30 to-slate-950', border: 'border-emerald-500/50', text: 'text-emerald-300', glow: '#10b981', tag: 'SURVIVAL / MMO' },
  { bg: 'from-indigo-600/40 via-blue-800/30 to-slate-950', border: 'border-indigo-500/50', text: 'text-indigo-300', glow: '#6366f1', tag: 'SPORTS / RACING' },
];

export default function GameIcon({ slug, name, image, className = 'w-full h-full' }: GameIconProps) {
  const [candidateIdx, setCandidateIdx] = useState(0);
  const normalizedSlug = slug.toLowerCase();

  // Known specific local assets
  let specificLocal = '';
  if (normalizedSlug.includes('arena-of-valor') || normalizedSlug.includes('rov') || normalizedSlug.includes('lien-quan')) {
    specificLocal = '/images/games/arenaofvalor.png';
  } else if (normalizedSlug.includes('wild-rift') || normalizedSlug.includes('wildrift')) {
    specificLocal = '/images/games/wildrift.png';
  } else if (normalizedSlug.includes('pokemon-unite') || normalizedSlug.includes('pokemonunite')) {
    specificLocal = '/images/games/pokemonunite.jpg';
  } else if (normalizedSlug.includes('free-fire') || normalizedSlug.includes('freefire')) {
    specificLocal = '/images/games/freefire.png';
  } else if (normalizedSlug.includes('mobile-legends') || normalizedSlug.includes('mlbb')) {
    specificLocal = '/images/games/mlbb.png';
  } else if (normalizedSlug.includes('magic-chess') || normalizedSlug.includes('magicchess')) {
    specificLocal = '/images/games/magicchess.png';
  } else if (normalizedSlug.includes('pubg')) {
    specificLocal = '/images/games/pubgm.png';
  } else if (normalizedSlug.includes('roblox')) {
    specificLocal = '/images/games/roblox.png';
  } else if (normalizedSlug.includes('blood-strike') || normalizedSlug.includes('bloodstrike')) {
    specificLocal = '/images/games/bloodstrike.png';
  } else if (normalizedSlug.includes('valorant')) {
    specificLocal = '/images/games/valorant.png';
  } else if (normalizedSlug.includes('honor-of-kings') || normalizedSlug.includes('hok')) {
    specificLocal = '/images/games/hok.png';
  } else if (normalizedSlug.includes('farlight')) {
    specificLocal = '/images/games/farlight.png';
  } else if (normalizedSlug.includes('delta-force') || normalizedSlug.includes('deltaforce')) {
    specificLocal = '/images/games/deltaforce.png';
  } else if (normalizedSlug.includes('bullet-echo') || normalizedSlug.includes('bulletecho')) {
    specificLocal = '/images/games/bullet-echo.png';
  } else if (normalizedSlug.includes('genshin-impact')) {
    specificLocal = '/images/games/genshin-impact.png';
  }

  // Build ordered candidate list
  const candidates: string[] = [];
  if (specificLocal) candidates.push(specificLocal);
  candidates.push(`/images/games/${normalizedSlug}.png`);
  candidates.push(`/images/games/${normalizedSlug}.jpg`);
  const cdnArt = getGameArtwork(slug, image);
  if (cdnArt && !candidates.includes(cdnArt)) candidates.push(cdnArt);
  if (image && !candidates.includes(image)) candidates.push(image);

  const currentSrc = candidates[candidateIdx];

  // Generate crisp monogram initials
  const displayName = name || slug.replace(/-/g, ' ');
  const words = displayName.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/);
  let monogram = '';
  if (words.length === 1) {
    monogram = words[0].slice(0, 4).toUpperCase();
  } else if (words.length === 2) {
    monogram = (words[0][0] + words[1].slice(0, 2)).toUpperCase();
  } else {
    monogram = words.slice(0, 3).map((w) => w[0]).join('').toUpperCase();
  }

  // Determine theme by hashing slug
  const hash = slug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const theme = GRADIENT_THEMES[hash % GRADIENT_THEMES.length];

  if (currentSrc && candidateIdx < candidates.length) {
    return (
      <div className={`relative overflow-hidden rounded-xl bg-slate-950 flex items-center justify-center ${className}`}>
        <img
          src={currentSrc}
          alt={displayName}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={() => setCandidateIdx((prev) => prev + 1)}
          loading="lazy"
        />
        {/* Subtle dark gradient overlay at bottom for title contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
      </div>
    );
  }

  // Premium Cyberpunk / Esports Gaming Cover Artwork Card Fallback
  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${theme.border} bg-gradient-to-br ${theme.bg} flex flex-col items-center justify-between p-3 select-none transition-all duration-300 ${className}`}
    >
      {/* Background geometric tech grid */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:10px_10px]" />
      
      {/* Top corner glowing tag */}
      <div className="relative z-10 w-full flex items-center justify-between">
        <span className="text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-slate-300">
          {theme.tag}
        </span>
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.glow, boxShadow: `0 0 6px ${theme.glow}` }} />
      </div>

      {/* Center Gaming Monogram & Icon */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center">
        <div className="h-9 w-9 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-center mb-1.5 shadow-md">
          <Gamepad2 className={`h-5 w-5 ${theme.text}`} />
        </div>
        <span className={`text-xs sm:text-sm font-black tracking-wider ${theme.text} font-mono uppercase truncate max-w-[85px] drop-shadow-md`}>
          {monogram}
        </span>
      </div>

      {/* Bottom glowing accent bar */}
      <div className="relative z-10 w-full h-1 rounded-full bg-slate-900 overflow-hidden">
        <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: theme.glow }} />
      </div>
    </div>
  );
}
