'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import GameIcon from '../../../components/GameIcon';
import { fetchProduct, lookupNickname, createOrder, GameProduct, GamePackage, API_BASE } from '../../../lib/api';
import { Gamepad2, ArrowLeft, ShieldAlert, CheckCircle, CreditCard, ShoppingCart, ShieldCheck, Gem, X, Layers, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '../../../lib/LanguageContext';

// --- PREMIUM SVG GRAPHICS FOR RECHARGE PACKAGES ---
const DiamondPileIcon = () => (
  <div className="h-8 w-9 sm:h-10 sm:w-11 relative flex items-center justify-center shrink-0 rounded-lg overflow-hidden border border-cyan-400/40 shadow-xs bg-slate-900">
    <img
      src="/images/diamond-art.png"
      alt="Diamonds"
      className="h-full w-full object-cover rounded hover:scale-110 transition-transform"
    />
  </div>
);

const EvoCardIcon = ({ days }: { days: string }) => (
  <div className="relative flex items-center justify-center shrink-0">
    <svg className="h-8 w-10 sm:h-9 sm:w-12 text-rose-500" viewBox="0 0 56 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="52" height="32" rx="6" fill="url(#cardGrad)" stroke="#f43f5e" strokeWidth="1.5"/>
      <path d="M8 8H24V14H8V8Z" fill="#fda4af" opacity="0.3"/>
      <path d="M8 20H48V22H8V20Z" fill="#f43f5e" opacity="0.5"/>
      <defs>
        <linearGradient id="cardGrad" x1="28" y1="2" x2="28" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e11d48"/>
          <stop stopColor="#4c0519"/>
        </linearGradient>
      </defs>
    </svg>
    <span className="absolute text-[7px] font-black text-rose-100 tracking-wider font-sans select-none">{days}</span>
  </div>
);

const PassChestIcon = ({ type }: { type: string }) => (
  <div className="relative flex items-center justify-center shrink-0">
    <svg className="h-8 w-10 sm:h-9 sm:w-11 text-amber-500" viewBox="0 0 48 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 14H42V32H6V14Z" fill="url(#chestGrad)" stroke="#f59e0b" strokeWidth="1.5"/>
      <path d="M4 14C4 10 8 8 24 8C40 8 44 10 44 14H4Z" fill="url(#lidGrad)" stroke="#f59e0b" strokeWidth="1.5"/>
      <circle cx="24" cy="18" r="3" fill="#fef08a" stroke="#d97706" strokeWidth="1"/>
      <defs>
        <linearGradient id="chestGrad" x1="24" y1="14" x2="24" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#b45309"/>
          <stop stopColor="#f59e0b" stopOpacity="0.8"/>
        </linearGradient>
        <linearGradient id="lidGrad" x1="24" y1="8" x2="24" y2="14" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f59e0b"/>
          <stop stopColor="#78350f"/>
        </linearGradient>
      </defs>
    </svg>
    <span className="absolute -bottom-1 right-0 text-[6px] font-extrabold bg-slate-950 border border-slate-900 text-amber-400 px-1 py-0.2 rounded-md scale-90">{type}</span>
  </div>
);

const getPackageIcon = (name: string) => {
  const norm = name.toLowerCase();
  if (norm.includes('evo3d') || norm.includes('3d') || norm.includes('3 day')) return <EvoCardIcon days="3 DAY" />;
  if (norm.includes('evo7d') || norm.includes('7d') || norm.includes('7 day')) return <EvoCardIcon days="7 DAY" />;
  if (norm.includes('evo30d') || norm.includes('30d') || norm.includes('30 day')) return <EvoCardIcon days="30 DAY" />;
  if (norm.includes('weeklylite') || norm.includes('weekly-lite')) return <PassChestIcon type="LITE" />;
  if (norm.includes('weekly')) return <PassChestIcon type="WEEK" />;
  if (norm.includes('monthly')) return <PassChestIcon type="MONTH" />;
  if (norm.includes('pass')) return <PassChestIcon type="PASS" />;
  return <DiamondPileIcon />;
};

export default function GameDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [product, setProduct] = useState<GameProduct | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<GamePackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'ABA' | 'BAKONG' | 'CANADIA'>('BAKONG');
  const { t } = useLanguage();
  
  // Player credentials inputs
  const [playerId, setPlayerId] = useState('');
  const [playerZoneId, setPlayerZoneId] = useState('');
  const [nickname, setNickname] = useState('');
  const [lastValidNickname, setLastValidNickname] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [lookupSuccess, setLookupSuccess] = useState(false);

  // Form states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  // Unwrap params
  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    fetchProduct(slug)
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Fetch product detail error:', err);
        setError(`Failed to fetch game top-up configurations from "${API_BASE}". Details: ${err.message || err}`);
        setLoading(false);
      });
  }, [slug]);

  const handleLookup = async () => {
    if (!playerId) {
      setLookupError(t.nicknameRequired);
      return;
    }
    const isMLBB = slug === 'mobile-legends' || slug.startsWith('mobile-legends-');
    if (isMLBB && !playerZoneId) {
      setLookupError(t.zoneIdRequired);
      return;
    }

    setLookupError('');
    setLookupSuccess(false);
    setLookupLoading(true);

    try {
      const fetchedNickname = await lookupNickname(slug, playerId, playerZoneId);
      setNickname(fetchedNickname);
      setLastValidNickname(fetchedNickname);
      setLookupSuccess(true);
    } catch (err: any) {
      console.warn('ID lookup error:', err);
      setLookupError(err.message || 'Verification failed');
      setLookupSuccess(false);
    } finally {
      setLookupLoading(false);
    }
  };

  // Debounced auto-lookup
  useEffect(() => {
    if (!slug || !playerId) return;
    const isMLBB = slug === 'mobile-legends' || slug.startsWith('mobile-legends-');
    if (isMLBB) {
      if (!/^\d{3,10}$/.test(playerId.trim()) || !/^\d{3,10}$/.test(playerZoneId.trim())) return;
    } else {
      if (playerId.trim().length < 3) return;
    }

    const timer = setTimeout(() => {
      handleLookup();
    }, 800);

    return () => clearTimeout(timer);
  }, [playerId, playerZoneId, slug]);

  const handleOrderSubmit = async () => {
    if (!playerId) {
      setError(t.nicknameRequired);
      return;
    }
    const isMLBB = slug === 'mobile-legends' || slug.startsWith('mobile-legends-');
    if (isMLBB && !playerZoneId) {
      setError(t.zoneIdRequired);
      return;
    }
    if (!selectedPackage) {
      setError('Please select a top-up package');
      return;
    }

    const isValidationNeeded = slug === 'free-fire' || slug.startsWith('free-fire-') || isMLBB || slug === 'pubg-mobile' || slug === 'valorant' || slug === 'blood-strike' || slug === 'honor-of-kings' || slug === 'farlight-84' || slug === 'delta-force';
    if (isValidationNeeded && !lookupSuccess && !lastValidNickname) {
      try {
        const fetched = await lookupNickname(slug, playerId, playerZoneId);
        setNickname(fetched);
        setLastValidNickname(fetched);
        setLookupSuccess(true);
      } catch (err: any) {
        setError('Please validate your Player ID/Nickname before placing order: ' + (err.message || ''));
        return;
      }
    }

    setError('');
    setOrderSubmitting(true);

    try {
      const email = typeof window !== 'undefined' ? localStorage.getItem('user_email') || undefined : undefined;
      const res = await createOrder(
        selectedPackage.id,
        playerId,
        playerZoneId || null,
        paymentMethod,
        email
      );
      
      // Redirect directly to checkout invoice
      router.push(`/orders/${res.order.paymentTxnId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to submit top-up request.');
      setOrderSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex-grow flex items-center justify-center py-20">
          <div className="text-center">
            <div className="h-10 w-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 text-xs sm:text-sm font-semibold">Loading game modules...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <div className="flex-grow max-w-md w-full mx-auto flex flex-col justify-center py-16 px-4">
          <div className="glass-panel p-6 sm:p-8 text-center bg-white border-slate-200">
            <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-slate-900 font-extrabold text-lg mb-2">Game Not Found</h3>
            <p className="text-slate-500 text-xs sm:text-sm mb-6">
              The game configuration you requested does not exist or has been disabled.
            </p>
            <Link
              href="/"
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to games</span>
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      
      <main className="flex-grow max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-32 lg:pb-12 overflow-x-hidden">
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center space-x-1.5 text-slate-500 hover:text-cyan-600 text-xs font-bold mb-4 sm:mb-6 transition-colors min-h-[36px]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t.backToHome}</span>
        </Link>

        {/* Game Intro Banner Card */}
        <div className="glass-panel p-4 sm:p-8 bg-white border-slate-200 shadow-sm mb-6 sm:mb-8 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6 rounded-2xl sm:rounded-3xl">
          <div className="shrink-0 h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden border border-slate-200 shadow-xs bg-slate-50">
            <GameIcon slug={product.slug} name={product.name} image={product.image} className="h-full w-full" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 leading-tight">{product.name}</h1>
            <p className="text-slate-500 text-xs mt-1.5 flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
              <span>{t.category}:</span>
              <span className="text-slate-800 uppercase font-bold">{product.category.replace('_', ' ')}</span>
              <span>•</span>
              <span className="text-emerald-600 font-bold">⚡ {t.instantDelivery}</span>
            </p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Column 1 & 2: Steps Form */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            {/* STEP 1: Enter Player ID */}
            <div className="glass-panel p-4 sm:p-6 bg-white border-slate-200 shadow-xs rounded-2xl sm:rounded-3xl">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <span className="h-6 w-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 font-black text-xs shrink-0">
                  1
                </span>
                <h3 className="text-slate-900 font-extrabold text-sm sm:text-base">{t.enterAccountDetails}</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5">
                    {t.playerId}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t.playerId}
                    value={playerId}
                    onChange={(e) => {
                      setPlayerId(e.target.value);
                      setLookupSuccess(false);
                    }}
                    className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 min-h-[44px]"
                  />
                </div>

                {(product.slug === 'mobile-legends' || product.slug.startsWith('mobile-legends-')) && (
                  <div>
                    <label className="block text-slate-700 text-xs font-bold mb-1.5">
                      {t.zoneId}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1234"
                      value={playerZoneId}
                      onChange={(e) => {
                        setPlayerZoneId(e.target.value);
                        setLookupSuccess(false);
                      }}
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 min-h-[44px]"
                    />
                  </div>
                )}
              </div>

              {/* Verify Nickname button & status indicator */}
              {(product.slug === 'free-fire' || product.slug.startsWith('free-fire-') || product.slug === 'mobile-legends' || product.slug.startsWith('mobile-legends-') || product.slug === 'pubg-mobile' || product.slug === 'valorant' || product.slug === 'blood-strike' || product.slug === 'honor-of-kings' || product.slug === 'farlight-84' || product.slug === 'delta-force') && (
                <div className="mt-4 pt-3 sm:pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={handleLookup}
                    disabled={lookupLoading}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-xs min-h-[44px] flex items-center justify-center"
                  >
                    {lookupLoading ? `${t.verifying}...` : 'ផ្ទៀងផ្ទាត់ឈ្មោះអ្នកលេង'}
                  </button>

                  {lookupSuccess && nickname && (
                    <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-2 min-h-[44px]">
                      <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                      <div className="flex flex-col text-left">
                        <span className="text-[8px] text-emerald-600 font-bold uppercase tracking-wider">បានបញ្ជាក់</span>
                        <strong className="text-slate-900 font-black text-xs">{nickname}</strong>
                      </div>
                    </div>
                  )}

                  {lookupError && !lookupLoading && (
                    <span className="text-red-500 text-xs font-semibold py-1">
                      ⚠️ {lookupError}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* STEP 2: Select Package */}
            <div className="glass-panel p-4 sm:p-6 bg-white border-slate-200 shadow-xs rounded-2xl sm:rounded-3xl">
              <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                <span className="h-6 w-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 font-black text-xs shrink-0">
                  2
                </span>
                <h3 className="text-slate-900 font-extrabold text-sm sm:text-base">{t.selectRechargePackage}</h3>
              </div>

              {/* Best Seller Section */}
              {product.packages.filter(p => p.category === 'BEST_SELLER').length > 0 && (
                <div className="mb-5 sm:mb-6">
                  <h4 className="text-[#f59e0b] font-black text-xs uppercase tracking-wider mb-2.5 sm:mb-3.5 flex items-center gap-1.5 select-none">
                    <span className="animate-pulse">🔥</span> Best Seller Package
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
                    {product.packages
                      .filter(p => p.category === 'BEST_SELLER')
                      .map((pkg) => {
                        const isSelected = selectedPackage?.id === pkg.id;
                        return (
                          <button
                            key={pkg.id}
                            type="button"
                            onClick={() => setSelectedPackage(pkg)}
                            className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl text-left border relative overflow-hidden transition-all flex flex-col justify-between min-h-[88px] sm:min-h-[96px] active:scale-[0.98] ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50/20 shadow-md ring-2 ring-emerald-500/40'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                            }`}
                          >
                            {pkg.badge && (
                              <span className="absolute top-0 right-0 z-10 text-[7px] sm:text-[7.5px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded-bl-lg uppercase shadow-xs tracking-wide">
                                {pkg.badge}
                              </span>
                            )}

                            <div className="flex items-start justify-between gap-1 w-full text-left">
                              <div className="font-extrabold text-slate-900 text-[11px] sm:text-xs line-clamp-2 leading-tight pr-1 sm:pr-4">
                                {pkg.name}
                              </div>
                              <div className="shrink-0 scale-90 sm:scale-95 translate-y-0.5">
                                {getPackageIcon(pkg.name)}
                              </div>
                            </div>

                            <div className="text-[#03c39a] font-black text-xs sm:text-sm mt-2 flex justify-between items-end">
                              <span>${pkg.price.toFixed(2)}</span>
                              {isSelected && (
                                <span className="text-[8px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded-md select-none">
                                  {t.selectedBadge}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Normal Section */}
              {product.packages.filter(p => p.category !== 'BEST_SELLER').length > 0 && (
                <div>
                  <h4 className="text-cyan-600 font-black text-xs uppercase tracking-wider mb-2.5 sm:mb-3.5 flex items-center gap-1.5 select-none">
                    <Layers className="h-3.5 w-3.5" />
                    <span>Normal Package</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
                    {product.packages
                      .filter(p => p.category !== 'BEST_SELLER')
                      .map((pkg) => {
                        const isSelected = selectedPackage?.id === pkg.id;
                        return (
                          <button
                            key={pkg.id}
                            type="button"
                            onClick={() => setSelectedPackage(pkg)}
                            className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl text-left border relative overflow-hidden transition-all flex flex-col justify-between min-h-[88px] sm:min-h-[96px] active:scale-[0.98] ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50/20 shadow-md ring-2 ring-emerald-500/40'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                            }`}
                          >
                            {pkg.badge && (
                              <span className="absolute top-0 right-0 z-10 text-[7px] sm:text-[7.5px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded-bl-lg uppercase shadow-xs tracking-wide">
                                {pkg.badge}
                              </span>
                            )}

                            <div className="flex items-start justify-between gap-1 w-full text-left">
                              <div className="font-extrabold text-slate-900 text-[11px] sm:text-xs line-clamp-2 leading-tight pr-1 sm:pr-4">
                                {pkg.name}
                              </div>
                              <div className="shrink-0 scale-90 sm:scale-95 translate-y-0.5">
                                {getPackageIcon(pkg.name)}
                              </div>
                            </div>

                            <div className="text-[#03c39a] font-black text-xs sm:text-sm mt-2 flex justify-between items-end">
                              <span>${pkg.price.toFixed(2)}</span>
                              {isSelected && (
                                <span className="text-[8px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded-md select-none">
                                  {t.selectedBadge}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* STEP 3: Choose Payment Gateway */}
            <div className="glass-panel p-4 sm:p-6 bg-white border-slate-200 shadow-xs rounded-2xl sm:rounded-3xl">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <span className="h-6 w-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 font-black text-xs shrink-0">
                  3
                </span>
                <h3 className="text-slate-900 font-extrabold text-sm sm:text-base">{t.choosePaymentGateway}</h3>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {/* ABA KHQR */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('BAKONG')}
                  className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all text-left flex items-center space-x-3 sm:space-x-4 border-cyan-500 bg-cyan-50/50 ring-1 ring-cyan-500/50 shadow-xs min-h-[56px] active:scale-[0.99]"
                >
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl overflow-hidden shrink-0 bg-slate-950 p-0.5 flex items-center justify-center shadow-xs">
                    <img
                      src="/images/payments/aba-khqr.svg"
                      alt="ABA KHQR"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-slate-900 font-bold text-xs sm:text-sm">ABA KHQR</h4>
                      <span className="text-[8px] sm:text-[9px] font-black bg-cyan-100 text-cyan-700 border border-cyan-300 px-1.5 py-0.2 rounded">Instant Scan</span>
                    </div>
                    <span className="text-slate-500 text-[11px] sm:text-xs leading-tight block mt-0.5 truncate">Scan via ABA Mobile & any KHQR banking app</span>
                  </div>
                </button>
              </div>
            </div>

          </div>

          {/* Column 3: Desktop Summary Sidebar */}
          <div className="hidden lg:block space-y-6">
            <div className="glass-panel p-6 bg-white border-slate-200 shadow-md sticky top-24 rounded-3xl">
              <h3 className="text-slate-900 font-extrabold text-base border-b border-slate-100 pb-3 mb-4 flex items-center space-x-2">
                <ShoppingCart className="h-4.5 w-4.5 text-cyan-600" />
                <span>{t.orderSummary}</span>
              </h3>

              {/* Order Items list details */}
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">{t.selectedProduct}:</span>
                  <span className="text-slate-900 font-bold">{product.name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-500">{t.packageItem}:</span>
                  <span className="text-slate-900 font-semibold">{selectedPackage ? selectedPackage.name : 'Not selected'}</span>
                </div>

                {playerId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t.playerIdDetails}:</span>
                    <span className="text-slate-900 font-mono font-bold">
                      {playerId} {playerZoneId ? `(${playerZoneId})` : ''}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-slate-500">{t.paymentGateway}:</span>
                  <span className="text-slate-900 font-bold">{paymentMethod}</span>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between items-end">
                  <span className="text-slate-600 text-sm font-semibold">{t.totalPriceUsd}:</span>
                  <span className="text-cyan-600 text-xl font-black">
                    ${selectedPackage ? selectedPackage.price.toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>

              {/* Global Error Banner */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs leading-relaxed">
                  {error}
                </div>
              )}

              {/* Action Submit Checkout */}
              <button
                type="button"
                onClick={handleOrderSubmit}
                disabled={orderSubmitting}
                className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white font-black text-sm shadow-md transition-all duration-300 glow-btn disabled:opacity-50 min-h-[44px]"
              >
                {orderSubmitting ? t.generatingInvoice : t.purchaseTopUp}
              </button>
            </div>
          </div>
        </div>

        {/* ══ MOBILE FLOATING BOTTOM PURCHASE BAR ═════════════════════════ */}
        <div className="lg:hidden fixed bottom-16 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-6px_25px_rgba(0,0,0,0.08)] px-3 sm:px-4 py-2.5">
          <div className="max-w-md mx-auto flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">
                {selectedPackage ? selectedPackage.name : 'សូមជ្រើសរើសកញ្ចប់'}
              </div>
              <div className="text-lg font-black text-cyan-600">
                ${selectedPackage ? selectedPackage.price.toFixed(2) : '0.00'}
              </div>
            </div>

            <button
              type="button"
              onClick={handleOrderSubmit}
              disabled={orderSubmitting || !selectedPackage}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white font-black text-xs sm:text-sm shadow-md transition-all duration-200 glow-btn disabled:opacity-50 min-h-[44px] flex items-center justify-center shrink-0 active:scale-95"
            >
              {orderSubmitting ? 'Processing...' : 'TOP UP NOW ⚡'}
            </button>
          </div>

          {/* Quick mobile error display if any */}
          {error && (
            <div className="max-w-md mx-auto mt-2 text-[10px] text-red-600 font-bold bg-red-50 p-1.5 rounded-lg border border-red-200 text-center">
              ⚠️ {error}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
