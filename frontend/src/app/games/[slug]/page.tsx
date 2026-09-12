'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import GameIcon from '../../../components/GameIcon';
import { fetchProduct, createOrder, lookupNickname, GameProduct, GamePackage, API_BASE } from '../../../lib/api';
import { Gamepad2, ArrowLeft, ShieldAlert, CheckCircle, CreditCard, ShoppingCart, ShieldCheck, Gem, X, Layers, Sparkles, UserCheck, Send } from 'lucide-react';
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
  const [packageCategoryFilter, setPackageCategoryFilter] = useState<'ALL' | 'DIAMONDS' | 'PASSES' | 'SPECIALS'>('ALL');
  const { t } = useLanguage();
  
  // Player credentials inputs
  const [playerId, setPlayerId] = useState('');
  const [playerZoneId, setPlayerZoneId] = useState('');
  const [autoNickname, setAutoNickname] = useState('');
  const [checkingName, setCheckingName] = useState(false);

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

    fetchProduct(slug)
      .then((data) => {
        setProduct(data);
        if (data.packages && data.packages.length > 0) {
          setSelectedPackage(data.packages[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Fetch product detail error:', err);
        setError(`Failed to fetch game top-up configurations from "${API_BASE}". Details: ${err.message || err}`);
        setLoading(false);
      });
  }, [slug]);

  // Automatic Debounced Player Name Verification
  useEffect(() => {
    const cleanId = playerId.trim();
    if (!slug || cleanId.length < 3) {
      setAutoNickname('');
      setCheckingName(false);
      return;
    }

    const isMLBB = slug === 'mobile-legends' || slug.startsWith('mobile-legends-');
    if (isMLBB && (!playerZoneId.trim() || playerZoneId.trim().length < 3)) {
      setAutoNickname('');
      setCheckingName(false);
      return;
    }

    setCheckingName(true);
    const timer = setTimeout(async () => {
      try {
        const name = await lookupNickname(slug, cleanId, playerZoneId.trim());
        if (name) {
          setAutoNickname(name);
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
        email
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

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Column 1 & 2: Steps Form */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            {/* STEP 1: Enter Player ID */}
            <div className="glass-panel p-4 sm:p-6 bg-slate-900/90 border-slate-800 shadow-md rounded-2xl sm:rounded-3xl">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <span className="h-6 w-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-black text-xs shrink-0">
                  1
                </span>
                <h3 className="text-white font-extrabold text-sm sm:text-base">{t.enterAccountDetails}</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-bold mb-1.5">
                    {t.playerId}
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

                {(product.slug === 'mobile-legends' || product.slug.startsWith('mobile-legends-')) && (
                  <div>
                    <label className="block text-slate-300 text-xs font-bold mb-1.5">
                      {t.zoneId}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1234"
                      value={playerZoneId}
                      onChange={(e) => setPlayerZoneId(e.target.value)}
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[44px]"
                    />
                  </div>
                )}
              </div>

              {/* Automatic Nickname Indicator */}
              {checkingName && (
                <div className="mt-3 flex items-center space-x-2 bg-blue-950/60 border border-blue-800/80 rounded-xl px-3.5 py-2 animate-pulse">
                  <div className="h-3.5 w-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
                  <span className="text-blue-300 font-bold text-xs">កំពុងស្វែងរកឈ្មោះស្វ័យប្រវត្តិ...</span>
                </div>
              )}

              {!checkingName && autoNickname && (
                <div className="mt-3 flex items-center space-x-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl px-3.5 py-2.5 shadow-xs">
                  <div className="h-6 w-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-4 w-4 stroke-[2.5]" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] text-emerald-400 font-black uppercase tracking-wider">ឈ្មោះគណនី (Verified Nickname)</span>
                    <strong className="text-white font-extrabold text-xs sm:text-sm">{autoNickname}</strong>
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
                              {getPackageIcon(pkg.name)}
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

          {/* Column 3: Desktop Summary Sidebar (Matching Exact User UI Design) */}
          <div className="hidden lg:block space-y-6">
            <div className="glass-panel p-6 bg-slate-900/90 border border-slate-800 shadow-2xl sticky top-24 rounded-3xl">
              <h3 className="text-white font-extrabold text-base border-b border-slate-800 pb-3 mb-4 flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-cyan-400" />
                <span>សេចក្ដីសង្ខេបនៃការបញ្ជាទិញ</span>
              </h3>

              {/* Order Items list details */}
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">ផលិតផលដែលបានជ្រើសរើស:</span>
                  <span className="text-white font-bold">{product.name}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">កញ្ចប់ផលិតផល:</span>
                  <span className="text-white font-bold">{selectedPackage ? selectedPackage.name : 'Not selected'}</span>
                </div>

                {playerId && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Player ID:</span>
                    <span className="text-cyan-400 font-mono font-bold">
                      {playerId} {playerZoneId ? `(${playerZoneId})` : ''}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">ច្រកបង់ប្រាក់:</span>
                  <span className="text-white font-bold uppercase">{paymentMethod === 'BAKONG' ? 'BAKONG' : paymentMethod}</span>
                </div>

                <div className="border-t border-slate-800 pt-4 flex justify-between items-end">
                  <span className="text-slate-200 text-sm font-bold">តម្លៃសរុប (USD):</span>
                  <span className="text-[#00c988] text-2xl font-black">
                    ${selectedPackage ? selectedPackage.price.toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>

              {/* Global Error Banner */}
              {error && (
                <div className="mt-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs leading-relaxed">
                  {error}
                </div>
              )}

              {/* Action Submit Checkout */}
              <button
                type="button"
                onClick={handleOrderSubmit}
                disabled={orderSubmitting}
                className="w-full mt-6 py-3.5 rounded-2xl bg-[#00c988] hover:bg-[#00b077] text-slate-950 font-black text-sm uppercase shadow-xl shadow-[#00c988]/30 transition-all duration-300 glow-btn disabled:opacity-50 min-h-[48px] flex items-center justify-center space-x-1.5 cursor-pointer active:scale-98"
              >
                <span>{orderSubmitting ? 'ដំណើរការ...' : 'បញ្ជាទិញ (TOP UP NOW)'}</span>
                <span className="text-base font-bold">›</span>
              </button>
            </div>
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
