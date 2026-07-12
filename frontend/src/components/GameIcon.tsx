import React from 'react';
import { Gamepad2 } from 'lucide-react';

interface GameIconProps {
  slug: string;
  className?: string;
}

export default function GameIcon({ slug, className = "h-16 w-16" }: GameIconProps) {
  let imagePath = '';
  const normalizedSlug = slug.toLowerCase();
  if (normalizedSlug.includes('free-fire') || normalizedSlug.includes('freefire')) {
    imagePath = '/images/games/freefire.png';
  } else if (normalizedSlug.includes('mobile-legends') || normalizedSlug.includes('mlbb')) {
    imagePath = '/images/games/mlbb.png';
  } else if (normalizedSlug.includes('magic-chess') || normalizedSlug.includes('magicchess')) {
    imagePath = '/images/games/magicchess.png';
  } else if (normalizedSlug.includes('pubg')) {
    imagePath = '/images/games/pubgm.png';
  } else if (normalizedSlug.includes('roblox')) {
    imagePath = '/images/games/roblox.png';
  } else if (normalizedSlug.includes('blood-strike') || normalizedSlug.includes('bloodstrike')) {
    imagePath = '/images/games/bloodstrike.png';
  } else if (normalizedSlug.includes('valorant')) {
    imagePath = '/images/games/valorant.png';
  } else if (normalizedSlug.includes('honor-of-kings') || normalizedSlug.includes('hok')) {
    imagePath = '/images/games/hok.png';
  } else if (normalizedSlug.includes('farlight')) {
    imagePath = '/images/games/farlight.png';
  } else if (normalizedSlug.includes('delta-force') || normalizedSlug.includes('deltaforce')) {
    imagePath = '/images/games/deltaforce.png';
  }

  if (imagePath) {
    return (
      <div className="relative overflow-hidden border border-slate-800 rounded-xl shadow-lg flex items-center justify-center h-20 w-20 bg-slate-900 transition-all duration-300">
        <img
          src={imagePath}
          alt={slug}
          className="h-full w-full object-cover rounded-xl"
        />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-500/20 to-slate-600/20 border border-slate-500/30 p-4 rounded-xl shadow-lg flex items-center justify-center">
      <Gamepad2 className="h-10 w-10 text-slate-400" />
    </div>
  );
}
