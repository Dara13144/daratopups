'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GameIcon from '../components/GameIcon';
import { fetchProducts, GameProduct, API_BASE } from '../lib/api';
import { AlertCircle, Gamepad2, Search, X, Sparkles, ChevronRight, Flame } from 'lucide-react';
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
      
      <main className="flex-grow max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 md:pb-12 overflow-x-hidden">
        {/* Banner Hero Section */}
        <div className="relative w-full rounded-xl sm:rounded-3xl overflow-hidden mb-5 sm:mb-8 shadow-xl shadow-slate-950/10 border border-slate-200">
          <Image
            src="/images/robby-banner.jpg"
            alt="DaraTopup - Instant Top Up Games"
            width={1200}
            height={400}
            className="w-full h-auto object-cover max-h-[360px]"
            priority
            unoptimized
          />
        </div>

        {/* Search Bar Section (Glowing Neon Pill Design) */}
        <div className="mb-5 sm:mb-7">
          <div className="relative max-w-2xl mx-auto">
            <div className="relative flex items-center w-full rounded-full bg-white border border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.12)] focus-within:border-cyan-500 focus-within:shadow-[0_0_25px_rgba(6,182,212,0.25)] focus-within:ring-2 focus-within:ring-cyan-400/30 transition-all duration-300">
              <Search className="h-5 w-5 text-cyan-600 ml-3.5 sm:ml-5 shrink-0 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                autoComplete="off"
                spellCheck="false"
                className="w-full bg-transparent py-3 sm:py-3.5 pl-2.5 sm:pl-3 pr-10 text-sm sm:text-base text-slate-800 placeholder-slate-400 focus:outline-none rounded-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 sm:right-3.5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2-Row Animated Continuous Game Ticker */}
        {!searchQuery && products.length > 0 && (
          <div className="marquee-container overflow-hidden py-1 mb-6 sm:mb-8 -mx-3 sm:mx-0 select-none relative [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
            {/* Row 1: Scrolling Left */}
            <div className="animate-marquee-left flex items-center gap-2.5 sm:gap-3 py-1">
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
                    className="flex items-center space-x-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-xs hover:shadow-cyan-500/20 hover:border-cyan-400 hover:scale-105 transition-all shrink-0 min-w-[170px] sm:min-w-[210px]"
                  >
                    <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl overflow-hidden shrink-0 bg-slate-50 border border-slate-200">
                      <GameIcon slug={game.slug} name={game.name} image={game.image} className="w-full h-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-[11px] sm:text-xs text-slate-900 truncate leading-tight">
                        {game.name}
                      </h4>
                      <div className="flex items-center space-x-1 sm:space-x-1.5 mt-0.5">
                        <span className={`text-[9px] sm:text-[10px] font-black ${curColor}`}>{currency}</span>
                        <span className="inline-flex items-center text-[8px] sm:text-[9px] font-black text-emerald-700 bg-emerald-100/90 px-1 sm:px-1.5 py-0.2 rounded border border-emerald-300">
                          ⚡ {badgeText}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Row 2: Scrolling Right */}
            <div className="animate-marquee-right flex items-center gap-2.5 sm:gap-3 py-1 mt-1">
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
                    className="flex items-center space-x-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-xs hover:shadow-cyan-500/20 hover:border-cyan-400 hover:scale-105 transition-all shrink-0 min-w-[170px] sm:min-w-[210px]"
                  >
                    <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl overflow-hidden shrink-0 bg-slate-50 border border-slate-200">
                      <GameIcon slug={game.slug} name={game.name} image={game.image} className="w-full h-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-[11px] sm:text-xs text-slate-900 truncate leading-tight">
                        {game.name}
                      </h4>
                      <div className="flex items-center space-x-1 sm:space-x-1.5 mt-0.5">
                        <span className={`text-[9px] sm:text-[10px] font-black ${curColor}`}>{currency}</span>
                        <span className="inline-flex items-center text-[8px] sm:text-[9px] font-black text-emerald-700 bg-emerald-100/90 px-1 sm:px-1.5 py-0.2 rounded border border-emerald-300">
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
          <div className="flex items-start space-x-3 bg-red-50 border border-red-200 rounded-xl p-3.5 sm:p-4 mb-6 text-red-700 text-xs sm:text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold mb-1">{t.serverIssueTitle}</h4>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Featured Hot Games Cards */}
        {!searchQuery && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
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
                  className="group relative flex items-center justify-between p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 border-l-[5px] sm:border-l-[6px] border-l-blue-500 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden min-h-[84px]"
                >
                  <div className="flex items-center space-x-2.5 sm:space-x-4 min-w-0 flex-1">
                    <div className="relative h-14 w-14 sm:h-20 sm:w-20 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 bg-slate-900 border border-slate-100 shadow-xs">
                      <GameIcon slug={matchedGame.slug} name={matchedGame.name} image={matchedGame.image} className="w-full h-full" />
                      {feat.isHot && (
                        <span className="absolute top-0 right-0 z-20 bg-[#f59e0b] text-slate-950 font-black text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded-bl-lg uppercase shadow-xs">
                          HOT
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className={`font-extrabold text-xs sm:text-base ${feat.isBlue ? 'text-blue-600' : 'text-slate-900'} truncate`}>
                        {feat.title}
                      </h3>
                      <div className="flex items-center gap-1 sm:gap-1.5 mt-1 sm:mt-1.5 flex-wrap">
                        {feat.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[9px] sm:text-xs text-slate-600 font-semibold px-2 py-0.2 sm:px-2.5 sm:py-0.5 rounded-full border border-slate-200 bg-slate-50"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      {feat.subtext && (
                        <p className="text-[10px] sm:text-xs font-black text-blue-600 mt-1 sm:mt-2 truncate">
                          {feat.subtext}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="ml-2 sm:ml-3 shrink-0">
                    <span className="inline-flex items-center px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#d97706] hover:bg-[#b45309] text-slate-950 font-black text-[10px] sm:text-xs uppercase tracking-wide shadow-xs transition-transform group-hover:scale-105 select-none min-h-[36px]">
                      VIEW →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Main Game Catalog Grid */}
        <div id="catalog" className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 shadow-xl shadow-slate-200/50 mb-6 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 sm:mb-6 border-b border-slate-100 pb-3 sm:pb-4">
            <h2 className="text-slate-900 font-black text-base sm:text-xl uppercase tracking-wider flex items-center space-x-2">
              <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-[#03c39a] shadow-[0_0_8px_#03c39a]"></span>
              <span className="truncate">{searchQuery ? `SEARCH: "${searchQuery}"` : 'CHOOSE SPECIAL GAMES'}</span>
            </h2>
            <div className="self-start sm:self-auto bg-[#eef2f7] text-[#1e293b] font-bold text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-slate-200/60 shadow-inner select-none">
              {displayedProducts.length} of {products.length}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-44 sm:h-64 animate-pulse bg-slate-100 border border-slate-200 rounded-xl sm:rounded-2xl"></div>
              ))}
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="text-center py-12 sm:py-16 bg-slate-50 border border-slate-200 rounded-2xl px-4">
              <Gamepad2 className="h-10 w-10 sm:h-12 sm:w-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-slate-900 font-bold text-base sm:text-lg mb-1">{t.noProductsFound}</h3>
              <p className="text-slate-500 text-xs sm:text-sm mb-4">{t.trySearchingElse}</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
                {displayedProducts.map((product) => {
                  const isOutOfStock = !product.isActive || (product.packages && product.packages.length === 0);

                  return (
                    <Link
                      key={product.id}
                      href={isOutOfStock ? '#' : `/games/${product.slug}`}
                      className={`group relative overflow-hidden flex flex-col justify-between h-full bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-2 sm:p-3 transition-all duration-200 shadow-xs ${
                        isOutOfStock 
                          ? 'opacity-60 cursor-not-allowed' 
                          : 'hover:border-[#03c39a] hover:shadow-md hover:shadow-[#03c39a]/10 hover:-translate-y-0.5 active:scale-[0.98]'
                      }`}
                      onClick={(e) => {
                        if (isOutOfStock) e.preventDefault();
                      }}
                    >
                      {/* Game Card image container */}
                      <div className="relative aspect-square w-full bg-slate-900 rounded-lg sm:rounded-xl overflow-hidden border border-slate-100 mb-1.5 sm:mb-2">
                        <GameIcon slug={product.slug} name={product.name} image={product.image} className="w-full h-full" />
                      </div>

                      {/* Game Name (centered, bold dark text) */}
                      <h3 className="text-slate-900 font-extrabold text-[11px] sm:text-[13px] text-center tracking-tight line-clamp-1 mb-1.5 sm:mb-2 min-h-[18px] sm:min-h-[20px] flex items-center justify-center">
                        {product.name}
                      </h3>

                      {/* Action Button */}
                      <div className="mt-auto">
                        {isOutOfStock ? (
                          <div className="w-full py-1.5 sm:py-2 text-center text-[9px] sm:text-xs font-bold text-slate-400 bg-slate-100 rounded-md sm:rounded-lg select-none border border-slate-200">
                            Out of stock
                          </div>
                        ) : (
                          <div className="w-full py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-black uppercase text-slate-950 bg-[#03c39a] group-hover:bg-[#02b18b] rounded-md sm:rounded-lg transition-colors select-none shadow-xs">
                            TOP UP
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Load More Button */}
              {!searchQuery && visibleCount < filteredProducts.length && (
                <div className="mt-6 sm:mt-10 text-center flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 48)}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold transition-all shadow-xs hover:border-[#03c39a] min-h-[44px] flex items-center justify-center"
                  >
                    Load More Games (+48)
                  </button>
                  <button
                    onClick={() => setVisibleCount(filteredProducts.length)}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#03c39a]/10 hover:bg-[#03c39a]/20 border border-[#03c39a]/30 text-[#03c39a] text-xs font-bold transition-all min-h-[44px] flex items-center justify-center"
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
