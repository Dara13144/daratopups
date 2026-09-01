'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GameIcon from '../components/GameIcon';
import { fetchProducts, GameProduct, API_BASE } from '../lib/api';
import { AlertCircle, Gamepad2, Search, X, Sparkles } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import Image from 'next/image';

const INITIAL_PAGE_SIZE = 48;

export default function Home() {
  const [products, setProducts] = useState<GameProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);
  const { t } = useLanguage();

  useEffect(() => {
    fetchProducts()
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Fetch products error:', err);
        setError(`Could not connect to the top-up server API at "${API_BASE}". Details: ${err.message || err}`);
        setLoading(false);
      });
  }, []);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(q);
      const slugMatch = p.slug.toLowerCase().includes(q);
      const catMatch = p.category.toLowerCase().includes(q);
      return nameMatch || slugMatch || catMatch;
    });
  }, [products, searchQuery]);

  const displayedProducts = useMemo(() => {
    if (searchQuery.trim()) {
      // When searching, show all matched results
      return filteredProducts;
    }
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount, searchQuery]);

  return (
    <>
      <Header />
      
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Banner Hero Section */}
        <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden mb-8 shadow-2xl shadow-slate-950/60 border border-slate-800">
          <Image
            src="/images/robby-banner.jpg"
            alt="RobbyTopup - Instant Top Up Games"
            width={1200}
            height={400}
            className="w-full h-auto object-cover"
            priority
            unoptimized
          />
        </div>

        {/* Search Bar Section (Glowing Neon Pill Design) */}
        <div className="mb-6">
          <div className="relative max-w-2xl mx-auto">
            <div className="relative flex items-center w-full rounded-full bg-white border border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.15)] focus-within:border-cyan-500 focus-within:shadow-[0_0_25px_rgba(6,182,212,0.3)] focus-within:ring-2 focus-within:ring-cyan-400/30 transition-all duration-300">
              <Search className="h-5 w-5 text-cyan-600 ml-4.5 sm:ml-5 shrink-0 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                autoComplete="off"
                spellCheck="false"
                className="w-full bg-transparent py-3 sm:py-3.5 pl-3 pr-10 text-sm sm:text-base text-slate-800 placeholder-slate-400 focus:outline-none rounded-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2-Row Animated Continuous Game Ticker (Matching User Design) */}
        {!searchQuery && products.length > 0 && (
          <div className="marquee-container overflow-hidden py-2 mb-8 -mx-4 sm:mx-0 select-none relative [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            {/* Row 1: Scrolling Left */}
            <div className="animate-marquee-left flex items-center gap-3 py-1.5">
              {[...products.slice(0, 16), ...products.slice(0, 16)].map((game, idx) => {
                const name = game.name.toLowerCase();
                let currency = 'TopUp';
                let curColor = 'text-cyan-600';
                let badgeText = '5s Instant';

                if (name.includes('mobile legends') || name.includes('mlbb') || name.includes('free fire') || name.includes('blood strike')) {
                  currency = 'Diamonds';
                  curColor = 'text-blue-600';
                  badgeText = '5s Instant';
                } else if (name.includes('fc') || name.includes('fifa') || name.includes('ea')) {
                  currency = 'Points';
                  curColor = 'text-cyan-600';
                  badgeText = '5s Instant';
                } else if (name.includes('valorant') || name.includes('league') || name.includes('lol')) {
                  currency = 'RP';
                  curColor = 'text-violet-600';
                  badgeText = 'Automated';
                } else if (name.includes('roblox')) {
                  currency = 'Robux';
                  curColor = 'text-emerald-600';
                  badgeText = '5s Instant';
                } else if (name.includes('genshin') || name.includes('honkai')) {
                  currency = 'Crystals';
                  curColor = 'text-amber-600';
                  badgeText = 'Automated';
                }

                return (
                  <Link
                    key={`row1-${game.id}-${idx}`}
                    href={`/games/${game.slug}`}
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-sm hover:shadow-cyan-500/20 hover:border-cyan-400 hover:scale-105 transition-all shrink-0 min-w-[190px] sm:min-w-[210px]"
                  >
                    <div className="h-9 w-9 rounded-xl overflow-hidden shrink-0 bg-slate-50 border border-slate-200">
                      <GameIcon slug={game.slug} name={game.name} image={game.image} className="w-full h-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-[11px] sm:text-xs text-slate-900 truncate leading-tight">
                        {game.name}
                      </h4>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className={`text-[10px] font-black ${curColor}`}>{currency}</span>
                        <span className="inline-flex items-center text-[9px] font-black text-emerald-700 bg-emerald-100/90 px-1.5 py-0.2 rounded border border-emerald-300">
                          ⚡ {badgeText}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Row 2: Scrolling Right */}
            <div className="animate-marquee-right flex items-center gap-3 py-1.5 mt-1">
              {[...products.slice(16, 32), ...products.slice(16, 32)].map((game, idx) => {
                const name = game.name.toLowerCase();
                let currency = 'TopUp';
                let curColor = 'text-cyan-600';
                let badgeText = 'Automated';

                if (name.includes('free fire') || name.includes('mobile legends') || name.includes('pubg')) {
                  currency = 'Diamonds';
                  curColor = 'text-blue-600';
                  badgeText = 'Automated';
                } else if (name.includes('journey') || name.includes('bullet') || name.includes('pixel') || name.includes('atlan')) {
                  currency = 'TopUp';
                  curColor = 'text-cyan-600';
                  badgeText = '5s Instant';
                } else if (name.includes('steam') || name.includes('voucher') || name.includes('gift')) {
                  currency = 'Voucher';
                  curColor = 'text-purple-600';
                  badgeText = '5s Instant';
                }

                return (
                  <Link
                    key={`row2-${game.id}-${idx}`}
                    href={`/games/${game.slug}`}
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-sm hover:shadow-cyan-500/20 hover:border-cyan-400 hover:scale-105 transition-all shrink-0 min-w-[190px] sm:min-w-[210px]"
                  >
                    <div className="h-9 w-9 rounded-xl overflow-hidden shrink-0 bg-slate-50 border border-slate-200">
                      <GameIcon slug={game.slug} name={game.name} image={game.image} className="w-full h-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-[11px] sm:text-xs text-slate-900 truncate leading-tight">
                        {game.name}
                      </h4>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className={`text-[10px] font-black ${curColor}`}>{currency}</span>
                        <span className="inline-flex items-center text-[9px] font-black text-emerald-700 bg-emerald-100/90 px-1.5 py-0.2 rounded border border-emerald-300">
                          ⚡ {badgeText}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Error notification display */}
        {error && (
          <div className="flex items-start space-x-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-8 text-red-700 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold mb-1">{t.serverIssueTitle}</h4>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Featured Hot Games Cards (Matching User Screenshot 1 - 6 Cards) */}
        {!searchQuery && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {[
              {
                title: 'Mobile Legends',
                slugMatch: 'mobile-legends',
                tags: ['Diamonds', 'Network Provider'],
                subtext: '110 Diamonds sold',
                isHot: true,
                isBlue: true,
              },
              {
                title: 'FREE FIRE KH',
                slugMatch: 'free-fire',
                tags: ['Diamonds', 'Network Provider'],
                subtext: 'Free Fire Diamonds Instant',
                isHot: false,
                isBlue: false,
              },
              {
                title: 'Age of Empire Mobile',
                slugMatch: 'age-of-empire',
                tags: ['TopUp', 'Network Provider'],
                subtext: '',
                isHot: false,
                isBlue: false,
              },
              {
                title: 'Bullet Echo',
                slugMatch: 'bullet-echo',
                tags: ['TopUp', 'Network Provider'],
                subtext: '',
                isHot: false,
                isBlue: false,
              },
              {
                title: 'Crystal of Atlan',
                slugMatch: 'atlan',
                tags: ['TopUp', 'Network Provider'],
                subtext: '',
                isHot: false,
                isBlue: false,
              },
              {
                title: 'Call of Duty Mobile Garena SGMY',
                slugMatch: 'call-of-duty',
                tags: ['CP', 'Network Provider'],
                subtext: '',
                isHot: false,
                isBlue: false,
              },
            ].map((feat, idx) => {
              const matchedGame = products.find(p => 
                p.slug.toLowerCase().includes(feat.slugMatch) || 
                p.name.toLowerCase().includes(feat.title.toLowerCase())
              ) || products[idx] || products[0];

              if (!matchedGame) return null;

              return (
                <Link
                  key={`feat-${idx}-${matchedGame.id}`}
                  href={`/games/${matchedGame.slug}`}
                  className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-3xl bg-white border border-slate-200 border-l-[6px] border-l-blue-500 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                    <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden shrink-0 bg-slate-900 border border-slate-100 shadow-sm">
                      <GameIcon slug={matchedGame.slug} name={matchedGame.name} image={matchedGame.image} className="w-full h-full" />
                      {feat.isHot && (
                        <span className="absolute top-0 right-0 z-20 bg-[#f59e0b] text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-bl-lg uppercase shadow-sm">
                          HOT
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className={`font-extrabold text-sm sm:text-base ${feat.isBlue ? 'text-blue-600' : 'text-slate-900'} truncate`}>
                        {feat.title}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {feat.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[10px] sm:text-xs text-slate-600 font-semibold px-2.5 py-0.5 rounded-full border border-slate-200 bg-slate-50/80"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      {feat.subtext && (
                        <p className="text-[11px] sm:text-xs font-black text-blue-600 mt-2">
                          {feat.subtext}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="ml-3 shrink-0">
                    <span className="inline-flex items-center px-4 sm:px-5 py-2.5 rounded-full bg-[#d97706] hover:bg-[#b45309] text-slate-950 font-black text-xs uppercase tracking-wide shadow-md transition-transform group-hover:scale-105">
                      VIEW NOW →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Main Game Catalog Grid (Matching User Screenshot 2 & 3) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-xl shadow-slate-200/50 mb-12">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
            <h2 className="text-slate-900 font-black text-lg sm:text-xl uppercase tracking-wider flex items-center space-x-2.5">
              <span className="h-3 w-3 rounded-full bg-[#03c39a] shadow-[0_0_10px_#03c39a]"></span>
              <span>{searchQuery ? `SEARCH: "${searchQuery}"` : 'CHOOSE SPECIAL GAMES'}</span>
            </h2>
            <div className="bg-[#eef2f7] text-[#1e293b] font-bold text-xs sm:text-sm px-4 py-1.5 rounded-full border border-slate-200/60 shadow-inner select-none">
              {displayedProducts.length} of {products.length}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-52 sm:h-64 animate-pulse bg-slate-100 border border-slate-200 rounded-2xl"></div>
              ))}
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 border border-slate-200 rounded-2xl">
              <Gamepad2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-slate-900 font-bold text-lg mb-1">{t.noProductsFound}</h3>
              <p className="text-slate-500 text-sm mb-4">{t.trySearchingElse}</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-cyan-500/20"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {displayedProducts.map((product) => {
                  const isOutOfStock = !product.isActive || (product.packages && product.packages.length === 0);

                  return (
                    <Link
                      key={product.id}
                      href={isOutOfStock ? '#' : `/games/${product.slug}`}
                      className={`group relative overflow-hidden flex flex-col justify-between h-full bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 transition-all duration-200 shadow-sm ${
                        isOutOfStock 
                          ? 'opacity-60 cursor-not-allowed' 
                          : 'hover:border-[#03c39a] hover:shadow-lg hover:shadow-[#03c39a]/10 hover:-translate-y-1'
                      }`}
                      onClick={(e) => {
                        if (isOutOfStock) e.preventDefault();
                      }}
                    >
                      {/* Game Card image container */}
                      <div className="relative aspect-square w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-100 mb-2">
                        <GameIcon slug={product.slug} name={product.name} image={product.image} className="w-full h-full" />
                      </div>

                      {/* Game Name (centered, bold dark text) */}
                      <h3 className="text-slate-900 font-extrabold text-xs sm:text-[13px] text-center tracking-tight line-clamp-1 mb-2.5 min-h-[20px] flex items-center justify-center">
                        {product.name}
                      </h3>

                      {/* Action Button */}
                      <div className="mt-auto">
                        {isOutOfStock ? (
                          <div className="w-full py-2 text-center text-[10px] sm:text-xs font-bold text-slate-400 bg-slate-100 rounded-lg select-none border border-slate-200">
                            Out of stock
                          </div>
                        ) : (
                          <div className="w-full py-2 text-center text-[11px] sm:text-xs font-black uppercase text-slate-950 bg-[#03c39a] group-hover:bg-[#02b18b] rounded-lg transition-colors select-none shadow-sm">
                            TOP UP
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Load More Button (Only when not actively searching) */}
              {!searchQuery && visibleCount < filteredProducts.length && (
                <div className="mt-10 text-center flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 48)}
                    className="px-6 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold transition-all shadow-sm hover:border-[#03c39a]"
                  >
                    Load More Games (+48)
                  </button>
                  <button
                    onClick={() => setVisibleCount(filteredProducts.length)}
                    className="px-6 py-2.5 rounded-xl bg-[#03c39a]/10 hover:bg-[#03c39a]/20 border border-[#03c39a]/30 text-[#03c39a] text-xs font-bold transition-all"
                  >
                    Show All ({filteredProducts.length})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
