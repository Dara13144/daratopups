'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import GameIcon from '../../../components/GameIcon';
import { fetchProduct, createOrder, lookupNickname, lookupPlayerProfile, PlayerProfile, GameProduct, GamePackage, API_BASE } from '../../../lib/api';
import { Gamepad2, ArrowLeft, ShieldAlert, CheckCircle, CreditCard, ShoppingCart, ShieldCheck, Gem, X, Layers, Sparkles, UserCheck, Send, Search, RefreshCw, Zap } from 'lucide-react';
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

const getPackageIcon = (pkgOrName: GamePackage | string) => {
  if (typeof pkgOrName === 'object' && pkgOrName?.image) {
    const imgSrc = pkgOrName.image.startsWith('http') || pkgOrName.image.startsWith('/')
      ? pkgOrName.image
      : `${API_BASE}${pkgOrName.image}`;
    return (
      <div className="h-8 w-9 sm:h-10 sm:w-11 relative flex items-center justify-center shrink-0 rounded-lg overflow-hidden border border-cyan-400/40 shadow-xs bg-slate-900">
        <img
          src={imgSrc}
          alt={pkgOrName.name}
          className="h-full w-full object-contain p-0.5 rounded hover:scale-110 transition-transform"
        />
      </div>
    );
  }
  const name = typeof pkgOrName === 'string' ? pkgOrName : (pkgOrName?.name || '');
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
  const [packageCategoryFilter, setPackageCategoryFilter] = useState<'ALL' | 'DIAMONDS' | 'PASSES' | 'SPECIALS'>('ALL');
  const { t } = useLanguage();
  
  // Player credentials inputs & rich game profile
  const [playerId, setPlayerId] = useState('');
  const [playerZoneId, setPlayerZoneId] = useState('');
  const [autoNickname, setAutoNickname] = useState('');
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  const [checkingName, setCheckingName] = useState(false);
  const [checkNameError, setCheckNameError] = useState('');

  // Form states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Unwrap params
  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError('');

    fetchProduct(slug)
      .then((data) => {
        setProduct(data);
        if (data.packages && data.packages.length > 0) {
          setSelectedPackage(data.packages[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        setProduct(null);
        setError(err.message || 'Product not found or has been removed');
        setLoading(false);
      });
  }, [slug]);

  // Dedicated Check Name Action
  const handlePerformCheckName = async () => {
    const cleanId = playerId.trim();
    if (!cleanId || cleanId.length < 3) {
      setCheckNameError('សូមបញ្ចូល Player ID យ៉ាងតិច 3 ខ្ទង់ (Please enter a valid Player ID)');
      return;
    }
    const isMLBB = slug === 'mobile-legends' || slug === 'moonton-mlbb' || slug.startsWith('mobile-legends-');
    if (isMLBB && (!playerZoneId.trim() || playerZoneId.trim().length < 3)) {
      setCheckNameError('សូមបញ្ចូល Zone ID (Please enter Zone ID)');
      return;
    }

    setCheckingName(true);
    setCheckNameError('');
    try {
      const profile = await lookupPlayerProfile(slug, cleanId, playerZoneId.trim());
      if (profile) {
        setPlayerProfile(profile);
        setAutoNickname(profile.nickname);
      }
    } catch (err: any) {
      setCheckNameError(err.message || 'មិនអាចផ្ទៀងផ្ទាត់ឈ្មោះបានទេ (Check name failed)');
    } finally {
      setCheckingName(false);
    }
  };

  // Automatic Debounced Player Name Verification
  useEffect(() => {
    const cleanId = playerId.trim();
    if (!slug || cleanId.length < 3) {
      setAutoNickname('');
      setPlayerProfile(null);
      setCheckingName(false);
      return;
    }

    const isMLBB = slug === 'mobile-legends' || slug === 'moonton-mlbb' || slug.startsWith('mobile-legends-');
    if (isMLBB && (!playerZoneId.trim() || playerZoneId.trim().length < 3)) {
      setAutoNickname('');
      setPlayerProfile(null);
      setCheckingName(false);
      return;
    }

    setCheckingName(true);
    setCheckNameError('');
    const timer = setTimeout(async () => {
      try {
        const profile = await lookupPlayerProfile(slug, cleanId, playerZoneId.trim());
        if (profile) {
          setPlayerProfile(profile);
          setAutoNickname(profile.nickname);
        }
      } catch {
        // Non-blocking auto check
      } finally {
        setCheckingName(false);
      }
    }, 600);

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
    if (!termsAccepted) {
      setError('សូមយល់ព្រមលើលក្ខខណ្ឌប្រតិបត្តិ និងគោលការណ៍ទិញមុននឹងបន្ត (Please accept terms & conditions).');
      return;
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
        email,
        slug,
        selectedPackage.name,
        selectedPackage.price,
        selectedPackage.amount
      );
      
      // If mobile, auto-open ABA Mobile application
      if (typeof window !== 'undefined' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        const qr = (res.paymentDetails as any)?.qrCode;
        const deepLink = (res.paymentDetails as any)?.deepLink || (qr ? `abamobilebank://ababank.com?type=payway&qrcode=${encodeURIComponent(qr)}` : null);
        if (deepLink) {
          setTimeout(() => {
            window.location.href = deepLink;
          }, 400);
        }
      }

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
          className="inline-flex items-center space-x-1.5 text-slate-400 hover:text-cyan-400 text-xs font-bold mb-4 sm:mb-6 transition-colors min-h-[36px]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t.backToHome}</span>
        </Link>

        {/* Game Intro Banner Card */}
        <div className="glass-panel p-4 sm:p-8 bg-slate-900/90 border-slate-800 shadow-xl mb-6 sm:mb-8 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6 rounded-2xl sm:rounded-3xl">
          <div className="shrink-0 h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden border border-slate-800 shadow-md bg-slate-950">
            <GameIcon slug={product.slug} name={product.name} image={product.image} className="h-full w-full" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-3xl font-extrabold text-white leading-tight">{product.name}</h1>
            <p className="text-slate-400 text-xs mt-1.5 flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
              <span>{t.category}:</span>
              <span className="text-slate-200 uppercase font-bold">{product.category.replace('_', ' ')}</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">⚡ {t.instantDelivery}</span>
            </p>
          </div>
        </div>

        {/* Main Form Steps Container */}
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
            
            {/* STEP 1: Enter Player ID & Live Profile Verification */}
            <div className="glass-panel p-4 sm:p-6 bg-slate-900/90 border-slate-800 shadow-xl rounded-2xl sm:rounded-3xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center space-x-2">
                  <span className="h-6 w-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-black text-xs shrink-0">
                    1
                  </span>
                  <h3 className="text-white font-extrabold text-sm sm:text-base">{t.enterAccountDetails}</h3>
                </div>
                <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span>Auto-Verify</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-bold mb-1.5 flex items-center justify-between">
                    <span>{t.playerId}</span>
                    <span className="text-[10px] text-slate-500 font-normal">e.g. 12345678</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t.playerId}
                    value={playerId}
                    onChange={(e) => setPlayerId(e.target.value)}
                    className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[44px]"
                  />
                </div>

                {(product.slug === 'mobile-legends' || product.slug === 'moonton-mlbb' || product.slug.startsWith('mobile-legends-')) ? (
                  <div>
                    <label className="block text-slate-300 text-xs font-bold mb-1.5 flex items-center justify-between">
                      <span>{t.zoneId}</span>
                      <span className="text-[10px] text-slate-500 font-normal">e.g. 1234</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1234"
                      value={playerZoneId}
                      onChange={(e) => setPlayerZoneId(e.target.value)}
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[44px]"
                    />
                  </div>
                ) : (
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handlePerformCheckName}
                      disabled={checkingName || !playerId.trim()}
                      className="w-full flex items-center justify-center space-x-1.5 py-3 sm:py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all disabled:opacity-40 cursor-pointer min-h-[44px]"
                    >
                      {checkingName ? (
                        <>
                          <div className="h-4 w-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                          <span>កំពុងពិនិត្យឈ្មោះ...</span>
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          <span>ពិនិត្យឈ្មោះ (Check Name)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {(product.slug === 'mobile-legends' || product.slug === 'moonton-mlbb' || product.slug.startsWith('mobile-legends-')) && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handlePerformCheckName}
                    disabled={checkingName || !playerId.trim() || !playerZoneId.trim()}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all disabled:opacity-40 cursor-pointer min-h-[40px]"
                  >
                    {checkingName ? (
                      <>
                        <div className="h-4 w-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                        <span>កំពុងស្វែងរកឈ្មោះគណនី (Verifying Account)...</span>
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        <span>ពិនិត្យឈ្មោះគណនី (Check Player Profile)</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Loading State */}
              {checkingName && (
                <div className="mt-4 flex items-center space-x-3 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl p-3.5 animate-pulse">
                  <div className="h-5 w-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
                  <div>
                    <p className="text-cyan-300 font-bold text-xs">កំពុងផ្ទៀងផ្ទាត់ឈ្មោះគណនីហ្គេម (Verifying with Game Server)...</p>
                    <p className="text-slate-400 text-[10px]">សូមរង់ចាំមួយភ្លែត ប្រព័ន្ធកំពុងទាញយកទិន្នន័យ Profile ផ្ទាល់</p>
                  </div>
                </div>
              )}

              {/* Error Notice */}
              {checkNameError && !checkingName && (
                <div className="mt-4 flex items-start space-x-2.5 bg-red-950/40 border border-red-500/30 rounded-2xl p-3 text-left">
                  <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-300 font-medium text-xs">{checkNameError}</p>
                </div>
              )}

              {/* ══ GLOW GAME PROFILE CARD ════════════════════════════════════ */}
              {!checkingName && (playerProfile || autoNickname) && (
                <div className="mt-4 rounded-2xl sm:rounded-3xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/50 via-slate-900/90 to-slate-950/80 p-4 sm:p-5 shadow-[0_0_25px_rgba(16,185,129,0.15)] relative overflow-hidden text-left">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    {/* Avatar & Player Info */}
                    <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <img
                          src={playerProfile?.avatarUrl || product.image || '/images/games/freefire.png'}
                          alt="Avatar"
                          className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl object-cover border-2 border-emerald-400/60 shadow-md bg-slate-950 p-0.5"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/images/games/freefire.png'; }}
                        />
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md">
                          <CheckCircle className="h-3.5 w-3.5 stroke-[3]" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            <span>Verified Player</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {playerId}{playerZoneId ? ` (${playerZoneId})` : ''}
                          </span>
                        </div>

                        <h4 className="text-white font-black text-sm sm:text-base truncate mt-0.5 tracking-tight text-shadow-sm">
                          {playerProfile?.nickname || autoNickname}
                        </h4>

                        <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-0.5">
                          <span className="text-emerald-300 font-semibold">📍 {playerProfile?.region || 'Cambodia (Asia)'}</span>
                          {playerProfile?.level && (
                            <span className="text-cyan-300 font-semibold">⚡ Lv. {playerProfile.level}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Re-check Action */}
                    <button
                      type="button"
                      onClick={handlePerformCheckName}
                      className="self-end sm:self-center shrink-0 flex items-center space-x-1 text-[11px] font-bold text-slate-400 hover:text-cyan-400 bg-slate-950/60 hover:bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 transition-all cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>ផ្ទៀងផ្ទាត់ឡើងវិញ (Re-check)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: Select Package */}
            <div className="glass-panel p-4 sm:p-6 bg-slate-900/90 border-slate-800 shadow-md rounded-2xl sm:rounded-3xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                <div className="flex items-center space-x-2">
                  <span className="h-6 w-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-black text-xs shrink-0">
                    2
                  </span>
                  <h3 className="text-white font-extrabold text-sm sm:text-base">{t.selectRechargePackage}</h3>
                </div>

                {/* Package Category Filter Tabs (Working on phone & computer) */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setPackageCategoryFilter('ALL')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      packageCategoryFilter === 'ALL'
                        ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    All Packages
                  </button>
                  <button
                    type="button"
                    onClick={() => setPackageCategoryFilter('DIAMONDS')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      packageCategoryFilter === 'DIAMONDS'
                        ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    💎 Diamonds
                  </button>
                  <button
                    type="button"
                    onClick={() => setPackageCategoryFilter('PASSES')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      packageCategoryFilter === 'PASSES'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    🔥 Passes / VIP
                  </button>
                  <button
                    type="button"
                    onClick={() => setPackageCategoryFilter('SPECIALS')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      packageCategoryFilter === 'SPECIALS'
                        ? 'bg-violet-500 text-white shadow-md font-black'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    ⚡ Specials
                  </button>
                </div>
              </div>

              {/* Filtered Packages Grid */}
              {(() => {
                const filteredPkgs = product.packages.filter(pkg => {
                  if (packageCategoryFilter === 'ALL') return true;
                  const name = pkg.name.toLowerCase();
                  if (packageCategoryFilter === 'DIAMONDS') {
                    return !name.includes('pass') && !name.includes('weekly') && !name.includes('monthly') && !name.includes('evo');
                  }
                  if (packageCategoryFilter === 'PASSES') {
                    return pkg.category === 'BEST_SELLER' || name.includes('pass') || name.includes('weekly') || name.includes('monthly') || name.includes('evo') || !!pkg.badge;
                  }
                  if (packageCategoryFilter === 'SPECIALS') {
                    return !!pkg.badge || pkg.category === 'BEST_SELLER' || name.includes('special') || name.includes('lite');
                  }
                  return true;
                });

                if (filteredPkgs.length === 0) {
                  return (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      No packages in this filter category.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
                    {filteredPkgs.map((pkg) => {
                      const isSelected = selectedPackage?.id === pkg.id;
                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => setSelectedPackage(pkg)}
                          className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl text-left relative overflow-hidden transition-all flex flex-col justify-between min-h-[96px] sm:min-h-[106px] active:scale-[0.98] cursor-pointer bg-white shadow-md ${
                            isSelected
                              ? 'border-2 border-[#00c988] ring-2 ring-[#00c988]/40 shadow-xl shadow-[#00c988]/15 scale-[1.01]'
                              : 'border-2 border-slate-200 hover:border-[#00c988] hover:shadow-lg'
                          }`}
                        >
                          {pkg.badge && (
                            <span className="absolute top-0 right-0 z-10 text-[7.5px] sm:text-[8px] font-black bg-gradient-to-r from-red-600 to-orange-500 text-white px-2 py-0.5 rounded-bl-lg uppercase shadow-xs tracking-wide">
                              {pkg.badge}
                            </span>
                          )}

                          <div className="flex items-start justify-between gap-1 w-full text-left">
                            <div className="font-extrabold text-slate-900 text-[11px] sm:text-xs line-clamp-2 leading-tight pr-1 sm:pr-4">
                              {pkg.name}
                            </div>
                            <div className="shrink-0 scale-90 sm:scale-95 translate-y-0.5">
                              {getPackageIcon(pkg)}
                            </div>
                          </div>

                          <div className="text-[#00c988] font-black text-xs sm:text-sm mt-2 flex justify-between items-end">
                            <span className="font-black text-sm sm:text-base">${pkg.price.toFixed(2)}</span>
                            {isSelected && (
                              <span className="text-[8.5px] bg-[#00c988] text-slate-950 font-black px-1.5 py-0.5 rounded-md select-none shadow-xs">
                                {t.selectedBadge}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* STEP 3: Choose Payment Gateway (Matching Exact User UI Design) */}
            <div className="glass-panel p-4 sm:p-6 bg-slate-900/90 border-slate-800 shadow-md rounded-2xl sm:rounded-3xl">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <span className="h-6 w-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-black text-xs shrink-0">
                  3
                </span>
                <h3 className="text-white font-extrabold text-sm sm:text-base">វិធីបង់ប្រាក់ (Payment Method)</h3>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {/* ABA KHQR Payment Card with Checkmark (White Card Design) */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('BAKONG')}
                  className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all text-left flex items-center justify-between border-[#00c988] bg-white ring-2 ring-[#00c988]/30 shadow-md min-h-[58px] active:scale-[0.99] cursor-pointer group"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl overflow-hidden shrink-0 bg-slate-950 p-0.5 flex items-center justify-center border border-slate-800 shadow-xs">
                      <img
                        src="/images/payments/aba-khqr.svg"
                        alt="ABA KHQR"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-slate-900 font-black text-xs sm:text-sm">ABA KHQR</h4>
                        <span className="text-[8px] sm:text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded">Instant Scan</span>
                      </div>
                      <span className="text-slate-500 text-[11px] sm:text-xs leading-tight block mt-0.5 truncate">Scan to pay with any banking app</span>
                    </div>
                  </div>

                  {/* Green Checkmark Badge on Right */}
                  <div className="h-6 w-6 rounded-full bg-emerald-100 border border-emerald-500 flex items-center justify-center text-emerald-600 shrink-0 ml-2 shadow-xs">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                </button>
              </div>
            </div>

            {/* ══ TERMS & CONDITIONS AGREEMENT BOX (Matching User Design) ═════ */}
            <div 
              onClick={() => setTermsAccepted(!termsAccepted)}
              className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 flex items-center space-x-3 cursor-pointer select-none transition-all shadow-md"
            >
              <div className={`h-5 w-5 rounded-md flex items-center justify-center transition-all shrink-0 ${
                termsAccepted 
                  ? 'bg-[#03c39a] text-slate-950 font-black shadow-xs' 
                  : 'bg-slate-950 border border-slate-700 text-transparent'
              }`}>
                {termsAccepted && <span className="text-xs">✓</span>}
              </div>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                ខ្ញុំបានអាន និងយល់ព្រមលើ <span className="text-amber-400 font-bold hover:underline">លក្ខខណ្ឌប្រតិបត្តិ</span> និងគោលការណ៍ទិញ។
              </p>
            </div>

            {/* ══ IN-PAGE TOTAL PRICE & KHMER ORDER NOW BOX (Matching User Design) ══ */}
            <div className="bg-slate-900/95 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex items-center justify-between shadow-2xl shadow-black/50">
              <div>
                <div className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider">
                  TOTAL PRICE
                </div>
                <div className="text-2xl sm:text-3xl font-black text-[#03c39a] leading-none mt-1">
                  ${selectedPackage ? selectedPackage.price.toFixed(2) : '0.00'}
                </div>
              </div>

              <button
                type="button"
                onClick={handleOrderSubmit}
                disabled={orderSubmitting || !selectedPackage}
                className="px-6 sm:px-8 py-3 rounded-2xl bg-[#03c39a] hover:bg-[#02b18b] text-slate-950 font-black text-sm sm:text-base flex items-center space-x-1.5 shadow-lg shadow-[#03c39a]/25 transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <span>{orderSubmitting ? 'ដំណើរការ...' : 'បញ្ជាទិញ'}</span>
                <span className="text-base font-bold">›</span>
              </button>
            </div>

          </div>

        {/* ══ STICKY FLOATING QUICK-CHECKOUT BAR (Matching User Design) ═════════════════════════ */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#060913]/95 backdrop-blur-xl border-t border-slate-800/80 shadow-[0_-8px_25px_rgba(0,0,0,0.7)] px-4 sm:px-8 py-2.5 sm:py-3 select-none">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            
            {/* Left: Icon circle + Package info + Glowing Price */}
            <div className="flex items-center space-x-3.5 min-w-0">
              {/* Circle Avatar Icon with subtle ring */}
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0 shadow-inner">
                <span className="font-black text-sm text-cyan-400 select-none">N</span>
              </div>

              {/* Name & Glowing Price */}
              <div className="min-w-0 flex flex-col justify-center">
                <div className="text-[11px] sm:text-xs text-slate-200 font-extrabold uppercase tracking-wider truncate max-w-[180px] sm:max-w-xs">
                  {selectedPackage ? selectedPackage.name : 'សូមជ្រើសរើសកញ្ចប់'}
                </div>
                <div className="text-base sm:text-xl font-black text-[#00c988] leading-tight">
                  ${selectedPackage ? selectedPackage.price.toFixed(2) : '0.00'}
                </div>
              </div>
            </div>

            {/* Right: TOP UP NOW / បញ្ជាទិញ Button */}
            <button
              type="button"
              onClick={handleOrderSubmit}
              disabled={orderSubmitting || !selectedPackage}
              className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-2xl bg-[#00c988] hover:bg-[#00b077] text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-[#00c988]/30 transition-all duration-200 disabled:opacity-50 min-h-[44px] flex items-center justify-center space-x-1.5 shrink-0 active:scale-95 cursor-pointer"
            >
              <span>{orderSubmitting ? 'ដំណើរការ...' : 'បញ្ជាទិញ'}</span>
              <span className="text-base font-bold">›</span>
            </button>
          </div>

          {/* Quick error banner if validation fails */}
          {error && (
            <div className="max-w-md mx-auto mt-2 text-[10px] text-red-400 font-bold bg-red-950/80 p-1.5 rounded-lg border border-red-800 text-center">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* ══ FLOATING TELEGRAM LIVE SUPPORT BUBBLE (Bottom-Right) ══════════════ */}
        <a
          href="https://t.me/darazzdev"
          target="_blank"
          rel="noopener noreferrer"
          title="Chat with Support on Telegram"
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 h-12 w-12 rounded-full bg-[#229ED9] hover:bg-[#198fca] text-white flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95 cursor-pointer group"
        >
          <Send className="h-5 w-5 fill-current -rotate-12 group-hover:scale-110 transition-transform" />
        </a>
      </main>

      <Footer />
    </>
  );
}
