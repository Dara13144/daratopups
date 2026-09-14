'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import GameIcon from '../../../components/GameIcon';
import { fetchProduct, createOrder, lookupNickname, lookupPlayerProfile, PlayerProfile, GameProduct, GamePackage, API_BASE } from '../../../lib/api';
import { subscribeToAllRealtime } from '../../../lib/supabase';
import { Gamepad2, ArrowLeft, ShieldAlert, CheckCircle, CreditCard, ShoppingCart, ShieldCheck, Gem, X, Layers, Sparkles, UserCheck, Send, Search, RefreshCw, Zap } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '../../../lib/LanguageContext';
import { getGameZoneConfig } from '../../../lib/gameConfig';

// --- PREMIUM SVG GRAPHICS FOR RECHARGE PACKAGES (MATCHING USER SCREENSHOTS) ---
const PinkDiamondIcon = () => (
  <div className="h-7 w-8 sm:h-8 sm:w-9 relative flex items-center justify-center shrink-0">
    <svg viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full drop-shadow-xs">
      <path d="M12 2L4 12L20 30L36 12L28 2H12Z" fill="url(#pinkGemGrad)" />
      <path d="M12 2L20 12L28 2H12Z" fill="#F472B6" opacity="0.95" />
      <path d="M4 12H36L20 30L4 12Z" fill="url(#pinkGemBottom)" opacity="0.9" />
      <path d="M12 2L4 12H13L20 12L12 2Z" fill="#FBCFE8" opacity="0.95" />
      <path d="M28 2L36 12H27L20 12L28 2Z" fill="#EC4899" opacity="0.95" />
      <path d="M13 12L20 30L20 12H13Z" fill="#BE185D" opacity="0.98" />
      <path d="M27 12L20 30L20 12H27Z" fill="#9D174D" opacity="0.98" />
      <path d="M4 12L20 30L13 12H4Z" fill="#E11D48" opacity="0.85" />
      <path d="M36 12L20 30L27 12H36Z" fill="#881337" opacity="0.9" />
      <circle cx="15" cy="8" r="1.5" fill="#FFFFFF" opacity="0.85" />
      <circle cx="25" cy="8" r="1" fill="#FFFFFF" opacity="0.75" />
      <defs>
        <linearGradient id="pinkGemGrad" x1="20" y1="2" x2="20" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F472B6" />
          <stop stopColor="#9D174D" />
        </linearGradient>
        <linearGradient id="pinkGemBottom" x1="20" y1="12" x2="20" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#DB2777" />
          <stop stopColor="#831843" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

const WeeklyPassIcon = () => (
  <div className="h-6 w-9 sm:h-7 sm:w-10 relative flex items-center justify-center shrink-0">
    <svg viewBox="0 0 46 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full rounded shadow-xs overflow-hidden">
      <rect x="0.5" y="0.5" width="45" height="29" rx="3" fill="url(#weeklyGrad)" stroke="#C084FC" strokeWidth="1" />
      <rect x="13" y="4.5" width="20" height="12" rx="2" fill="#7C3AED" stroke="#E9D5FF" strokeWidth="0.8" />
      <text x="23" y="13.5" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">2X</text>
      <path d="M4 22H42" stroke="#E9D5FF" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="2 2" />
      <circle cx="7" cy="8" r="2" fill="#F472B6" opacity="0.85" />
      <circle cx="39" cy="8" r="2" fill="#A855F7" opacity="0.85" />
      <defs>
        <linearGradient id="weeklyGrad" x1="0" y1="0" x2="46" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6B21A8" />
          <stop stopColor="#3B0764" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

const WeeklyLitePassIcon = () => (
  <div className="h-6 w-9 sm:h-7 sm:w-10 relative flex items-center justify-center shrink-0">
    <svg viewBox="0 0 46 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full rounded shadow-xs overflow-hidden">
      <rect x="0.5" y="0.5" width="45" height="29" rx="3" fill="url(#weeklyLiteGrad)" stroke="#38BDF8" strokeWidth="1" />
      <rect x="13" y="4.5" width="20" height="12" rx="2" fill="#0284C7" stroke="#BAE6FD" strokeWidth="0.8" />
      <text x="23" y="13.5" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">2X</text>
      <path d="M4 22H42" stroke="#BAE6FD" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="2 2" />
      <circle cx="7" cy="8" r="2" fill="#38BDF8" opacity="0.85" />
      <circle cx="39" cy="8" r="2" fill="#0EA5E9" opacity="0.85" />
      <defs>
        <linearGradient id="weeklyLiteGrad" x1="0" y1="0" x2="46" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0369A1" />
          <stop stopColor="#082F49" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

const MonthlyPassIcon = () => (
  <div className="h-6 w-9 sm:h-7 sm:w-10 relative flex items-center justify-center shrink-0">
    <svg viewBox="0 0 46 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full rounded shadow-xs overflow-hidden">
      <rect x="0.5" y="0.5" width="45" height="29" rx="3" fill="url(#monthlyGrad)" stroke="#F59E0B" strokeWidth="1" />
      <rect x="13" y="4.5" width="20" height="12" rx="2" fill="#D97706" stroke="#FEF3C7" strokeWidth="0.8" />
      <path d="M23 7L24.5 10H21.5L23 7Z" fill="#FEF08A" />
      <text x="23" y="14.5" fill="#FFFFFF" fontSize="6.5" fontWeight="900" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">VIP</text>
      <path d="M4 22H42" stroke="#FEF3C7" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="2 2" />
      <circle cx="7" cy="8" r="2" fill="#FBBF24" opacity="0.85" />
      <circle cx="39" cy="8" r="2" fill="#F59E0B" opacity="0.85" />
      <defs>
        <linearGradient id="monthlyGrad" x1="0" y1="0" x2="46" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B45309" />
          <stop stopColor="#78350F" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

const getPackageIcon = (pkgOrName: GamePackage | string) => {
  if (typeof pkgOrName === 'object' && pkgOrName?.image) {
    const imgSrc = pkgOrName.image.startsWith('http') || pkgOrName.image.startsWith('/')
      ? pkgOrName.image
      : `${API_BASE}${pkgOrName.image}`;
    return (
      <div className="h-7 w-8 sm:h-8 sm:w-9 relative flex items-center justify-center shrink-0 rounded-lg overflow-hidden">
        <img
          src={imgSrc}
          alt={pkgOrName.name}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }
  const name = typeof pkgOrName === 'string' ? pkgOrName : (pkgOrName?.name || '');
  const norm = name.toLowerCase();
  if (norm.includes('lite')) return <WeeklyLitePassIcon />;
  if (norm.includes('monthly') || norm.includes('ប្រចាំខែ')) return <MonthlyPassIcon />;
  if (norm.includes('weekly') || norm.includes('សប្តាហ៍')) return <WeeklyPassIcon />;
  return <PinkDiamondIcon />;
};

const groupPackagesByCategory = (packages: GamePackage[]) => {
  const groups: { [key: string]: GamePackage[] } = {};
  const orderPriority = ['ពេជ្រ', 'ប្រចាំសប្តាហ៍', 'ប្រចាំសប្តាហ៍ (Lite)', 'ប្រចាំខែ'];

  for (const pkg of packages) {
    let cat = pkg.category || 'ពេជ្រ';
    const norm = (pkg.name || '').toLowerCase();

    if (cat === 'DIAMOND' || norm.includes('diamond') || /^\d+$/.test(pkg.name.trim())) {
      cat = 'ពេជ្រ';
    } else if (norm.includes('lite')) {
      cat = 'ប្រចាំសប្តាហ៍ (Lite)';
    } else if (norm.includes('weekly') || cat === 'WEEKLY' || norm.includes('សប្តាហ៍')) {
      cat = 'ប្រចាំសប្តាហ៍';
    } else if (norm.includes('monthly') || cat === 'MONTHLY' || norm.includes('ប្រចាំខែ')) {
      cat = 'ប្រចាំខែ';
    } else if (cat === 'NORMAL' || cat === 'BEST_SELLER') {
      if (norm.includes('pass') || norm.includes('membership')) {
        cat = 'ប្រចាំសប្តាហ៍';
      } else {
        cat = 'ពេជ្រ';
      }
    }

    if (!groups[cat]) {
      groups[cat] = [];
    }
    groups[cat].push(pkg);
  }

  const sortedCategories = Object.keys(groups).sort((a, b) => {
    const idxA = orderPriority.indexOf(a);
    const idxB = orderPriority.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  return { groups, sortedCategories };
};

export default function GameDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [product, setProduct] = useState<GameProduct | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<GamePackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'ABA' | 'BAKONG' | 'CANADIA'>('BAKONG');
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

    const loadGame = () => {
      fetchProduct(slug)
        .then((data) => {
          setProduct(data);
          if (data.packages && data.packages.length > 0) {
            setSelectedPackage((prev) => prev ? (data.packages.find((p: any) => p.id === prev.id) || data.packages[0]) : data.packages[0]);
          }
          setLoading(false);
        })
        .catch((err) => {
          setProduct(null);
          setError(err.message || 'Product not found or has been removed');
          setLoading(false);
        });
    };

    loadGame();

    const unsub = subscribeToAllRealtime({
      onProductChange: (payload) => {
        if (payload.eventType === 'DELETE') {
          if (payload.old?.slug === slug || payload.old?.id === product?.id) {
            setProduct(null);
            setError('This game was removed from the catalog.');
          }
        } else {
          loadGame();
        }
      },
      onPackageChange: () => {
        loadGame();
      }
    });

    return () => {
      unsub();
    };
  }, [slug, product?.id]);

  const zoneConfig = getGameZoneConfig(product);

  // Dedicated Check Name Action
  const handlePerformCheckName = async () => {
    const cleanId = playerId.trim();
    if (!cleanId || cleanId.length < 3) {
      setCheckNameError('សូមបញ្ចូល Player ID យ៉ាងតិច 3 ខ្ទង់ (Please enter a valid Player ID)');
      return;
    }
    if (zoneConfig.required && (!playerZoneId.trim() || playerZoneId.trim().length < (zoneConfig.isServer ? 2 : 3))) {
      setCheckNameError(`សូមបញ្ចូល ${zoneConfig.label || 'Zone ID'} (Please enter ${zoneConfig.label || 'Zone ID'})`);
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

    if (zoneConfig.required && (!playerZoneId.trim() || playerZoneId.trim().length < (zoneConfig.isServer ? 2 : 3))) {
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
  }, [playerId, playerZoneId, slug, zoneConfig.required, zoneConfig.isServer]);

  const handleOrderSubmit = async () => {
    if (!playerId) {
      setError(t.nicknameRequired);
      return;
    }
    if (zoneConfig.required && !playerZoneId.trim()) {
      setError(`សូមបញ្ចូល ${zoneConfig.label || 'Zone ID'} (${zoneConfig.label || 'Zone ID'} is required)`);
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
      
      <main className="flex-grow max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-12 overflow-x-hidden">
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

                {zoneConfig.hasZone ? (
                  <div>
                    <label className="block text-slate-300 text-xs font-bold mb-1.5 flex items-center justify-between">
                      <span>{zoneConfig.label || t.zoneId}</span>
                      <span className="text-[10px] text-slate-500 font-normal">{zoneConfig.placeholder}</span>
                    </label>
                    <input
                      type="text"
                      placeholder={zoneConfig.placeholder}
                      value={playerZoneId}
                      onChange={(e) => setPlayerZoneId(e.target.value)}
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[44px]"
                    />
                    {zoneConfig.isServer && zoneConfig.serverOptions && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {zoneConfig.serverOptions.map((srv) => (
                          <button
                            key={srv}
                            type="button"
                            onClick={() => setPlayerZoneId(srv)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              playerZoneId.toLowerCase() === srv.toLowerCase()
                                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                            }`}
                          >
                            {srv}
                          </button>
                        ))}
                      </div>
                    )}
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

              {zoneConfig.hasZone && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/60 border border-slate-800/80 rounded-xl px-3 py-2">
                    <span className="flex items-center gap-1.5 text-cyan-300">
                      <Zap className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      <span>{zoneConfig.hint || 'សូមបញ្ចូល User ID និង Zone ID ត្រឹមត្រូវ'}</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handlePerformCheckName}
                    disabled={checkingName || !playerId.trim() || (zoneConfig.required && !playerZoneId.trim())}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10 transition-all disabled:opacity-40 cursor-pointer min-h-[42px]"
                  >
                    {checkingName ? (
                      <>
                        <div className="h-4 w-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                        <span>កំពុងស្វែងរកឈ្មោះគណនី (Verifying Account)...</span>
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        <span>ពិនិត្យឈ្មោះគណនី & Zone ID (Check Player Profile)</span>
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
                            ID: {playerId}{playerZoneId ? ` (${zoneConfig.isServer ? 'Server' : 'Zone'}: ${playerZoneId})` : ''}
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

            {/* STEP 2: Select Package (Matching User Design: Images 1 & 2) */}
            <div className="p-4 sm:p-6 bg-[#FFF5F8] border border-pink-100/90 shadow-sm rounded-2xl sm:rounded-3xl">
              <div className="flex items-center space-x-2.5 mb-4 sm:mb-6">
                <span className="h-7 w-7 rounded-lg bg-[#9D174D] flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm">
                  2
                </span>
                <h3 className="text-slate-900 font-extrabold text-sm sm:text-base">
                  {t.selectRechargePackage || 'ជ្រើសរើសកញ្ចប់'}
                </h3>
              </div>

              {/* Categorized Packages Grid */}
              {product.packages.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No packages available for this game.
                </div>
              ) : (
                <div className="space-y-5">
                  {(() => {
                    const { groups, sortedCategories } = groupPackagesByCategory(product.packages);
                    return sortedCategories.map((category) => (
                      <div key={category}>
                        <h4 className="text-slate-700 font-bold text-xs sm:text-sm mb-2.5 tracking-wide">
                          {category}
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
                          {groups[category].map((pkg) => {
                            const isSelected = selectedPackage?.id === pkg.id;
                            return (
                              <button
                                key={pkg.id}
                                type="button"
                                onClick={() => setSelectedPackage(pkg)}
                                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl text-left relative transition-all flex flex-col justify-between min-h-[96px] sm:min-h-[106px] active:scale-[0.98] cursor-pointer bg-white ${
                                  isSelected
                                    ? 'border-2 border-[#BE185D] ring-2 ring-[#BE185D]/20 shadow-md scale-[1.01]'
                                    : 'border border-pink-200/80 hover:border-pink-300 shadow-xs hover:shadow-sm'
                                }`}
                              >
                                {pkg.badge && (
                                  <span className="absolute top-0 right-0 z-10 text-[7.5px] sm:text-[8px] font-black bg-gradient-to-r from-red-600 to-pink-600 text-white px-2 py-0.5 rounded-bl-lg uppercase shadow-xs tracking-wide">
                                    {pkg.badge}
                                  </span>
                                )}

                                {/* Top Row: Package Icon on Left, Selection Radio on Right */}
                                <div className="flex items-center justify-between w-full">
                                  <div className="shrink-0">
                                    {getPackageIcon(pkg)}
                                  </div>
                                  <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center transition-all ${
                                    isSelected
                                      ? 'border-2 border-[#BE185D] bg-white'
                                      : 'border border-pink-200 bg-white'
                                  }`}>
                                    {isSelected && (
                                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#BE185D]" />
                                    )}
                                  </div>
                                </div>

                                {/* Content Below: Name & Price */}
                                <div className="mt-2.5">
                                  <div className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-1 leading-tight">
                                    {pkg.name}
                                  </div>
                                  <div className="font-black text-sm sm:text-base text-[#9D174D] mt-0.5">
                                    ${pkg.price.toFixed(2)}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
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
                {/* ABA KHQR Payment Card with Checkmark (Interactive Animated Design) */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('BAKONG')}
                  className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 text-left flex items-center justify-between border-[#00c988] bg-white ring-2 ring-[#00c988]/30 shadow-md min-h-[58px] active:scale-[0.99] cursor-pointer group hover:shadow-xl hover:shadow-[#00c988]/20 hover:border-emerald-400"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl overflow-hidden shrink-0 bg-slate-950 p-0.5 flex items-center justify-center border border-slate-800 shadow-xs group-hover:scale-105 transition-transform duration-300">
                      <img
                        src="/images/payments/aba-khqr.svg"
                        alt="ABA KHQR"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-slate-900 font-black text-xs sm:text-sm tracking-tight">ABA KHQR</h4>
                        <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300/80 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600"></span>
                          </span>
                          <span>Instant Scan</span>
                        </span>
                      </div>
                      <span className="text-slate-500 text-[11px] sm:text-xs leading-tight block mt-0.5 truncate">Scan to pay with any banking app in Cambodia</span>
                    </div>
                  </div>

                  {/* Green Checkmark Badge on Right */}
                  <div className="h-7 w-7 rounded-full bg-emerald-100 border border-emerald-500 flex items-center justify-center text-emerald-600 shrink-0 ml-2 shadow-xs group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-200">
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

            {/* Error banner if validation fails */}
            {error && (
              <div className="text-xs sm:text-sm text-red-400 font-bold bg-red-950/80 p-3 rounded-xl border border-red-800 text-center">
                ⚠️ {error}
              </div>
            )}

          </div>
        </main>

      <Footer />
    </>
  );
}
