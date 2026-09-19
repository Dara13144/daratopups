'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import GameIcon from '../../../components/GameIcon';
import AbaKhqrModal from '../../../components/AbaKhqrModal';
import { fetchProduct, createOrder, lookupNickname, lookupPlayerProfile, getOrderStatus, OrderStatusDetails, PlayerProfile, GameProduct, GamePackage, API_BASE, getProductImageUrl } from '../../../lib/api';
import { subscribeToAllRealtime } from '../../../lib/supabase';
import { Gamepad2, ArrowLeft, ShieldAlert, CheckCircle, CreditCard, ShoppingCart, ShieldCheck, Gem, X, Layers, Sparkles, UserCheck, Send, Search, RefreshCw, Zap } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '../../../lib/LanguageContext';
import { getGameZoneConfig } from '../../../lib/gameConfig';
import GlowingDiamondChest from '../../../components/GlowingDiamondChest';

// --- PREMIUM SVG & IMAGE GRAPHICS FOR RECHARGE PACKAGES ---
const GameDiamondIcon = () => (
  <div className="h-6 w-7 sm:h-7 sm:w-8 relative flex items-center justify-center shrink-0">
    <svg viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full drop-shadow-sm">
      <path d="M12 2L4 12L20 30L36 12L28 2H12Z" fill="url(#cyanGemGrad)" />
      <path d="M12 2L20 12L28 2H12Z" fill="#38BDF8" opacity="0.95" />
      <path d="M4 12H36L20 30L4 12Z" fill="url(#cyanGemBottom)" opacity="0.9" />
      <path d="M12 2L4 12H13L20 12L12 2Z" fill="#BAE6FD" opacity="0.95" />
      <path d="M28 2L36 12H27L20 12L28 2Z" fill="#0284C7" opacity="0.95" />
      <path d="M13 12L20 30L20 12H13Z" fill="#0369A1" opacity="0.98" />
      <path d="M27 12L20 30L20 12H27Z" fill="#075985" opacity="0.98" />
      <circle cx="15" cy="8" r="1.5" fill="#FFFFFF" opacity="0.9" />
      <circle cx="25" cy="8" r="1" fill="#FFFFFF" opacity="0.8" />
      <defs>
        <linearGradient id="cyanGemGrad" x1="20" y1="2" x2="20" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop stopColor="#0369A1" />
        </linearGradient>
        <linearGradient id="cyanGemBottom" x1="20" y1="12" x2="20" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0284C7" />
          <stop stopColor="#082F49" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

const WeeklyPassIcon = ({ multiplier = '1' }: { multiplier?: string | number }) => {
  const m = String(multiplier);
  const src = ['1', '2', '3', '4', '5', '6', '10'].includes(m)
    ? `/images/weekly-x${m}.png`
    : '/images/weekly-pass.png';
  return (
    <div className="h-10 w-14 sm:h-12 sm:w-16 relative flex items-center justify-center shrink-0">
      <img
        src={src}
        alt={`Weekly Pass x${m}`}
        className="h-full w-full object-contain drop-shadow-[0_2px_8px_rgba(236,72,153,0.4)]"
      />
    </div>
  );
};

const WeeklyLitePassIcon = ({ multiplier = '1' }: { multiplier?: string | number }) => {
  const m = String(multiplier);
  const src = ['1', '2', '3', '4', '5', '6', '10'].includes(m)
    ? `/images/weekly-lite-x${m}.png`
    : '/images/weekly-lite-pass.png';
  return (
    <div className="h-10 w-14 sm:h-12 sm:w-16 relative flex items-center justify-center shrink-0">
      <img
        src={src}
        alt={`Weekly Lite x${m}`}
        className="h-full w-full object-contain drop-shadow-[0_2px_8px_rgba(0,180,255,0.4)]"
      />
    </div>
  );
};

const MonthlyPassIcon = ({ multiplier = '1' }: { multiplier?: string | number }) => {
  const m = String(multiplier);
  const src = ['1', '2', '3', '4', '5', '6', '10'].includes(m)
    ? `/images/monthly-x${m}.png`
    : '/images/monthly-pass.png';
  return (
    <div className="h-10 w-14 sm:h-12 sm:w-16 relative flex items-center justify-center shrink-0">
      <img
        src={src}
        alt={`Monthly Pass x${m}`}
        className="h-full w-full object-contain drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]"
      />
    </div>
  );
};

const TwilightPassIcon = () => (
  <div className="h-6 w-9 sm:h-7 sm:w-10 relative flex items-center justify-center shrink-0">
    <svg viewBox="0 0 46 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full rounded shadow-xs overflow-hidden">
      <rect x="0.5" y="0.5" width="45" height="29" rx="3" fill="url(#twilightGrad)" stroke="#E879F9" strokeWidth="1" />
      <rect x="9" y="4.5" width="28" height="12" rx="2" fill="#86198F" stroke="#F5D0FE" strokeWidth="0.8" />
      <text x="23" y="13.5" fill="#FFFFFF" fontSize="6.5" fontWeight="900" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">TWILIGHT</text>
      <path d="M4 22H42" stroke="#F5D0FE" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="2 2" />
      <defs>
        <linearGradient id="twilightGrad" x1="0" y1="0" x2="46" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4A044E" />
          <stop stopColor="#701A75" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

const LevelUpPassIcon = () => (
  <div className="h-6 w-9 sm:h-7 sm:w-10 relative flex items-center justify-center shrink-0">
    <svg viewBox="0 0 46 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full rounded shadow-xs overflow-hidden">
      <rect x="0.5" y="0.5" width="45" height="29" rx="3" fill="url(#levelUpGrad)" stroke="#34D399" strokeWidth="1" />
      <rect x="11" y="4.5" width="24" height="12" rx="2" fill="#059669" stroke="#A7F3D0" strokeWidth="0.8" />
      <text x="23" y="13.5" fill="#FFFFFF" fontSize="7" fontWeight="900" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">LV.UP</text>
      <path d="M4 22H42" stroke="#A7F3D0" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="2 2" />
      <defs>
        <linearGradient id="levelUpGrad" x1="0" y1="0" x2="46" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#064E3B" />
          <stop stopColor="#047857" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

const ComboPassIcon = () => (
  <div className="h-6 w-9 sm:h-7 sm:w-10 relative flex items-center justify-center shrink-0">
    <svg viewBox="0 0 46 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full rounded shadow-xs overflow-hidden">
      <rect x="0.5" y="0.5" width="45" height="29" rx="3" fill="url(#comboGrad)" stroke="#F87171" strokeWidth="1" />
      <rect x="9" y="4.5" width="28" height="12" rx="2" fill="#DC2626" stroke="#FECACA" strokeWidth="0.8" />
      <text x="23" y="13.5" fill="#FFFFFF" fontSize="6.5" fontWeight="900" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">3-IN-1</text>
      <path d="M4 22H42" stroke="#FECACA" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="2 2" />
      <defs>
        <linearGradient id="comboGrad" x1="0" y1="0" x2="46" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7F1D1D" />
          <stop stopColor="#991B1B" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

const getPackageIcon = (pkgOrName: GamePackage | string) => {
  if (typeof pkgOrName === 'object' && pkgOrName?.image && typeof pkgOrName.image === 'string' && pkgOrName.image.trim()) {
    const trimmedImg = pkgOrName.image.trim();
    if (trimmedImg !== 'undefined' && trimmedImg !== 'null' && trimmedImg !== 'none') {
      const imgSrc = getProductImageUrl(trimmedImg);
      if (imgSrc) {
        return (
          <div className="h-10 w-14 sm:h-12 sm:w-16 relative flex items-center justify-center shrink-0 rounded overflow-hidden">
            <img
              src={imgSrc}
              alt={pkgOrName.name}
              className="h-full w-full object-contain drop-shadow-[0_0_8px_rgba(0,180,255,0.7)]"
              onError={(e) => {
                // If custom admin image fails to load, gracefully hide broken img and render fallback icon
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        );
      }
    }
  }

  const name = typeof pkgOrName === 'string' ? pkgOrName : (pkgOrName?.name || '');
  const norm = name.toLowerCase();

  // Multiplier extraction: supports "2x W.Pass", "Weekly x2", "Weekly Lite x3", "Monthly Membership x6", or pkg.amount
  let multiplier = '1';
  if (typeof pkgOrName === 'object' && pkgOrName?.amount && Number(pkgOrName.amount) > 1) {
    multiplier = String(pkgOrName.amount);
  }
  const multMatch = norm.match(/(\d+)\s*x\b/i) || norm.match(/\bx\s*(\d+)/i) || norm.match(/x(\d+)/i);
  if (multMatch) {
    multiplier = multMatch[1];
  }

  if (norm.includes('twilight')) return <TwilightPassIcon />;
  if (norm.includes('lvup') || norm.includes('level up')) return <LevelUpPassIcon />;
  if (norm.includes('m+w+l') || norm.includes('combo') || norm.includes('3 in 1') || norm.includes('3in1')) return <ComboPassIcon />;
  if (norm.includes('lite') || norm.includes('w.elite')) return <WeeklyLitePassIcon multiplier={multiplier} />;
  if (norm.includes('monthly') || norm.includes('ប្រចាំខែ') || norm.includes('m.card') || norm.includes('m.epic')) return <MonthlyPassIcon multiplier={multiplier} />;
  if (norm.includes('weekly') || norm.includes('សប្តាហ៍') || norm.includes('w.card') || norm.includes('w.pass')) return <WeeklyPassIcon multiplier={multiplier} />;

  const amt = typeof pkgOrName === 'object'
    ? (pkgOrName.amount || pkgOrName.name.match(/\b\d+\b/)?.[0] || '100')
    : (name.match(/\b\d+\b/)?.[0] || '100');

  return <GlowingDiamondChest amount={amt} className="w-14 h-10 sm:w-16 sm:h-12" />;
};

const groupPackagesByCategory = (packages: GamePackage[]) => {
  const groups: { [key: string]: GamePackage[] } = {};
  const orderPriority = [
    'Diamonds',
    'Weekly Pass',
    'Weekly Lite',
    'Weekly Card',
    'Monthly Card',
    'Special Pass',
    'Level Up',
    'Combo Pass',
    'ពេជ្រ',
    'ប្រចាំសប្តាហ៍ (Lite)',
    'ប្រចាំសប្តាហ៍',
    'ប្រចាំខែ',
    'NORMAL',
    'BEST_SELLER'
  ];

  for (const pkg of packages) {
    let cat = pkg.category || 'Diamonds';
    const norm = (pkg.name || '').toLowerCase();

    if (norm.includes('w.lite') || (norm.includes('weekly') && norm.includes('lite'))) {
      cat = 'Weekly Lite';
    } else if (norm.includes('w.elite') || norm.includes('m.epic') || norm.includes('twilight')) {
      cat = 'Special Pass';
    } else if (norm.includes('w.pass') || (norm.includes('weekly') && norm.includes('pass'))) {
      cat = 'Weekly Pass';
    } else if (norm.includes('w.card') || (norm.includes('weekly') && !norm.includes('lite'))) {
      cat = 'Weekly Card';
    } else if (norm.includes('m.card') || norm.includes('monthly') || norm.includes('ប្រចាំខែ')) {
      cat = 'Monthly Card';
    } else if (norm.includes('m+w+l') || norm.includes('combo') || norm.includes('3 in 1') || norm.includes('3in1')) {
      cat = 'Combo Pass';
    } else if (norm.includes('lvup') || norm.includes('level up')) {
      cat = 'Level Up';
    } else if (
      norm.includes('dm') ||
      norm.includes('diamond') ||
      norm.includes('uc') ||
      norm.includes('token') ||
      /^\d+$/.test(pkg.name.trim()) ||
      cat === 'NORMAL' ||
      cat === 'BEST_SELLER' ||
      cat === 'ពេជ្រ'
    ) {
      cat = 'Diamonds';
    }

    if (!groups[cat]) {
      groups[cat] = [];
    }
    groups[cat].push(pkg);
  }

  // Sort within each category by price ascending
  for (const cat of Object.keys(groups)) {
    groups[cat].sort((a, b) => a.price - b.price);
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


export default function GameDetailsPage() {
  const router = useRouter();
  const routeParams = useParams();
  const slug = (routeParams?.slug as string) || '';
  const [product, setProduct] = useState<GameProduct | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<GamePackage | null>(null);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('ALL');
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
  const [activeOrder, setActiveOrder] = useState<OrderStatusDetails | null>(null);
  const [showKhqrModal, setShowKhqrModal] = useState(false);

  // Read URL searchParams on mount (e.g. redirected from Check ID Modal or Reseller)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const qPlayerId = sp.get('playerId') || sp.get('id') || '';
      const qZoneId = sp.get('playerZoneId') || sp.get('zoneId') || sp.get('zone') || sp.get('server') || '';
      if (qPlayerId) setPlayerId(qPlayerId);
      if (qZoneId) setPlayerZoneId(qZoneId.replace(/[()]/g, '').trim());
    }
  }, []);

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

  const cleanPlayerId = playerId.trim();
  const cleanZoneId = playerZoneId.trim().replace(/[()]/g, '');

  // Whether player ID verification is finished and approved
  const isIdCheckedDone = Boolean(
    product &&
    (product.hasCheckId === false
      ? cleanPlayerId.length >= 3
      : (playerProfile &&
          playerProfile.nickname &&
          playerProfile.playerId === cleanPlayerId &&
          (!zoneConfig.hasZone || (playerProfile.playerZoneId || '') === cleanZoneId)))
  );

  // Dedicated Check Name Action
  const handlePerformCheckName = async (): Promise<PlayerProfile | null> => {
    const cleanId = playerId.trim();
    if (!cleanId || cleanId.length < 3) {
      setCheckNameError('សូមបញ្ចូល Player ID យ៉ាងតិច 3 ខ្ទង់ (Please enter a valid Player ID)');
      return null;
    }
    if (zoneConfig.required && (!playerZoneId.trim() || playerZoneId.trim().length < (zoneConfig.isServer ? 2 : 3))) {
      setCheckNameError(`សូមបញ្ចូល ${zoneConfig.label || 'Zone ID'} (Please enter ${zoneConfig.label || 'Zone ID'})`);
      return null;
    }

    if (product && product.hasCheckId === false) {
      const fallbackNick = `Player_${cleanId.slice(-4) || 'Direct'}`;
      setAutoNickname(fallbackNick);
      const prof: PlayerProfile = {
        success: true,
        nickname: fallbackNick,
        playerId: cleanId,
        playerZoneId: playerZoneId.trim() || undefined,
        region: 'Direct Recharge',
        level: 1,
        avatarUrl: product.image || `/images/games/${slug}.png`,
      };
      setPlayerProfile(prof);
      setCheckNameError('');
      setError('');
      return prof;
    }

    setCheckingName(true);
    setCheckNameError('');
    setError('');
    try {
      const profile = await lookupPlayerProfile(
        slug,
        cleanId,
        playerZoneId.trim(),
        product?.checkIdGameCode || undefined,
        product?.hasCheckId !== false
      );
      if (profile && profile.nickname) {
        setPlayerProfile(profile);
        setAutoNickname(profile.nickname);
        setCheckNameError('');
        setError('');
        return profile;
      } else {
        setPlayerProfile(null);
        setAutoNickname('');
        setCheckNameError('រកមិនឃើញគណនីហ្គេមនេះទេ ឬ ID មិនត្រឹមត្រូវ (Player ID not found or invalid)');
        return null;
      }
    } catch (err: any) {
      setPlayerProfile(null);
      setAutoNickname('');
      setCheckNameError(err.message || 'រកមិនឃើញគណនីហ្គេមនេះទេ ឬ ID មិនត្រឹមត្រូវ (Player ID not found or invalid)');
      return null;
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

    if (product && product.hasCheckId === false) {
      const fallbackNick = `Player_${cleanId.slice(-4) || 'Direct'}`;
      setAutoNickname(fallbackNick);
      setPlayerProfile({
        success: true,
        nickname: fallbackNick,
        playerId: cleanId,
        playerZoneId: playerZoneId.trim() || undefined,
        region: 'Direct Recharge',
        level: 1,
        avatarUrl: product.image || `/images/games/${slug}.png`,
      });
      setCheckingName(false);
      return;
    }

    setCheckingName(true);
    setCheckNameError('');
    const timer = setTimeout(async () => {
      try {
        const profile = await lookupPlayerProfile(
          slug,
          cleanId,
          playerZoneId.trim(),
          product?.checkIdGameCode || undefined,
          product?.hasCheckId !== false
        );
        if (profile && profile.nickname) {
          setPlayerProfile(profile);
          setAutoNickname(profile.nickname);
          setCheckNameError('');
        } else {
          setPlayerProfile(null);
          setAutoNickname('');
          setCheckNameError('រកមិនឃើញគណនីហ្គេមនេះទេ ឬ ID មិនត្រឹមត្រូវ (Player ID not found or invalid)');
        }
      } catch (err: any) {
        setPlayerProfile(null);
        setAutoNickname('');
        setCheckNameError(err.message || 'រកមិនឃើញគណនីហ្គេមនេះទេ ឬ ID មិនត្រឹមត្រូវ (Player ID not found or invalid)');
      } finally {
        setCheckingName(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [playerId, playerZoneId, slug, zoneConfig.required, zoneConfig.isServer, product?.hasCheckId, product?.checkIdGameCode, product?.image]);

  const handleOrderSubmit = async () => {
    const cleanId = playerId.trim();
    if (!cleanId) {
      setError(t.nicknameRequired || 'សូមបញ្ចូល Player ID ជាមុនសិន (Please enter Player ID)');
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

    // MANDATORY ID CHECK: Cannot order unless Player ID has been verified
    if (product && product.hasCheckId !== false) {
      const cleanZone = playerZoneId.trim().replace(/[()]/g, '');
      const isAlreadyVerified = Boolean(
        playerProfile &&
        playerProfile.nickname &&
        playerProfile.playerId === cleanId &&
        (!zoneConfig.hasZone || (playerProfile.playerZoneId || '') === cleanZone)
      );

      if (!isAlreadyVerified) {
        setError('កំពុងពិនិត្យ Player ID មុននឹងបញ្ជាទិញ... (Verifying Player ID before ordering...)');
        const verified = await handlePerformCheckName();
        if (!verified || !verified.nickname) {
          setError('⚠️ Player ID មិនត្រឹមត្រូវ ឬរកមិនឃើញគណនីហ្គេមនេះទេ។ ត្រូវតែពិនិត្យ ID ឱ្យបានជោគជ័យសិន ទើបអាចបញ្ជាទិញបាន! (Invalid Player ID. You must verify ID successfully before ordering!)');
          return;
        }
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

      // Immediately pop up the authentic animated ABA KHQR modal fast with 0ms delay
      const orderPayload = res.order || res.data?.order || res.payload?.order || res;
      const detailsPayload = res.paymentDetails || res.data?.paymentDetails || res.payload?.paymentDetails || {};
      const immediateOrder: OrderStatusDetails = {
        id: orderPayload.id,
        paymentTxnId: orderPayload.paymentTxnId,
        gameName: product?.name || 'Top-up Package',
        gameSlug: product?.slug || slug,
        packageName: selectedPackage?.name || 'Selected Package',
        playerId: playerId,
        playerZoneId: playerZoneId || null,
        playerNickname: autoNickname || playerProfile?.nickname || '',
        price: orderPayload.price ?? selectedPackage?.price ?? 0,
        paymentMethod: paymentMethod,
        status: orderPayload.status || 'PENDING',
        paymentStatus: orderPayload.paymentStatus || 'PENDING',
        stockDeliveredCode: null,
        paymentQrCode: (detailsPayload as any)?.qrCode || (detailsPayload as any)?.qr_string || orderPayload.paymentTxnId,
        paymentMd5: (detailsPayload as any)?.md5 || (detailsPayload as any)?.qrMd5 || '',
        deepLink: (detailsPayload as any)?.deepLink || '',
        merchantName: (detailsPayload as any)?.merchantName || (orderPayload as any)?.merchantName || 'NA-DY TOPUP ll',
        createdAt: (orderPayload as any)?.createdAt || new Date().toISOString(),
      };
      setActiveOrder(immediateOrder);
      setShowKhqrModal(true);
      setOrderSubmitting(false);

      // Background check if needed
      const currentTxn = orderPayload.paymentTxnId || (res as any)?.paymentTxnId;
      if (currentTxn) {
        getOrderStatus(currentTxn).then((fullOrder) => {
          if (fullOrder) {
            setActiveOrder((prev) => (prev ? { ...prev, ...fullOrder } : fullOrder));
          }
        }).catch(() => {});
      }
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
        {/* Game Intro Banner Card */}
        <div className="p-4 sm:p-8 theme-container-card border shadow-xl mb-6 sm:mb-8 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6 rounded-2xl sm:rounded-3xl">
          <div className="shrink-0 h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden border border-pink-200 shadow-md bg-white">
            <GameIcon slug={product.slug} name={product.name} image={product.image} className="h-full w-full" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-3xl font-extrabold theme-card-title leading-tight">{product.name}</h1>
            <p className="theme-label text-xs mt-1.5 flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
              <span>{t.category}:</span>
              <span className="uppercase font-bold">{product.category.replace('_', ' ')}</span>
              <span>•</span>
              <span className="text-emerald-500 font-bold">⚡ {t.instantDelivery}</span>
            </p>
          </div>
        </div>

        {/* Main Form Steps Container */}
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
            
            {/* STEP 1: Enter Player ID & Live Profile Verification */}
            <div className="p-4 sm:p-6 theme-container-card border shadow-xl rounded-2xl sm:rounded-3xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center space-x-2">
                  <span className="h-7 w-7 rounded-lg bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-600 font-black text-xs shrink-0 shadow-sm">
                    1
                  </span>
                  <h3 className="theme-card-title font-extrabold text-sm sm:text-base">{t.enterAccountDetails}</h3>
                </div>
                {product?.hasCheckId === false ? (
                  <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    <span>Direct Recharge (បញ្ចូលផ្ទាល់)</span>
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-bold text-pink-600 bg-pink-500/10 border border-pink-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Zap className="h-3 w-3 text-pink-500" />
                    <span>Auto-Verify</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block theme-label text-xs font-bold mb-1.5 flex items-center justify-between">
                    <span>{slug.includes('telegram') ? 'Telegram Username' : t.playerId}</span>
                    <span className="text-[10px] opacity-70 font-normal">
                      {slug.includes('telegram') ? 'e.g. @darazzdev' : 'e.g. 1523754961'}
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={slug.includes('telegram') ? 'បញ្ចូល Telegram Username (@username)' : t.playerId}
                    value={playerId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPlayerProfile(null);
                      setAutoNickname('');
                      setCheckNameError('');
                      setError('');
                      const comboMatch = val.match(/^(\d{4,12})[\s_()\-]+(\d{3,6})\)?$/);
                      if (comboMatch && zoneConfig.hasZone) {
                        setPlayerId(comboMatch[1]);
                        setPlayerZoneId(comboMatch[2]);
                        return;
                      }
                      setPlayerId(val);
                    }}
                    className="w-full px-3.5 py-3 sm:py-2.5 theme-input border rounded-xl text-sm sm:text-base placeholder-slate-400 focus:outline-none focus:border-pink-500 min-h-[44px]"
                  />
                </div>

                {zoneConfig.hasZone ? (
                  <div>
                    <label className="block theme-label text-xs font-bold mb-1.5 flex items-center justify-between">
                      <span>{zoneConfig.label || t.zoneId}</span>
                      <span className="text-[10px] opacity-70 font-normal">e.g. (11766)</span>
                    </label>
                    <input
                      type="text"
                      placeholder={zoneConfig.placeholder}
                      value={playerZoneId}
                      onChange={(e) => {
                        setPlayerProfile(null);
                        setAutoNickname('');
                        setCheckNameError('');
                        setError('');
                        setPlayerZoneId(e.target.value.replace(/[()]/g, ''));
                      }}
                      className="w-full px-3.5 py-3 sm:py-2.5 theme-input border rounded-xl text-sm sm:text-base placeholder-slate-400 focus:outline-none focus:border-pink-500 min-h-[44px]"
                    />
                    {zoneConfig.isServer && zoneConfig.serverOptions && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {zoneConfig.serverOptions.map((srv) => (
                          <button
                            key={srv}
                            type="button"
                            onClick={() => {
                              setPlayerProfile(null);
                              setAutoNickname('');
                              setCheckNameError('');
                              setError('');
                              setPlayerZoneId(srv);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              playerZoneId.toLowerCase() === srv.toLowerCase()
                                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md font-black'
                                : 'bg-white text-slate-700 hover:bg-pink-50 border border-pink-200'
                            }`}
                          >
                            {srv}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : product?.hasCheckId === false ? (
                  <div className="flex items-end">
                    <div className="w-full flex items-center justify-center space-x-1.5 py-3 sm:py-2.5 px-3 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 min-h-[44px]">
                      <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                      <span>បញ្ចូលផ្ទាល់ (Direct ID Recharge)</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handlePerformCheckName}
                      disabled={checkingName || !playerId.trim()}
                      className="w-full flex items-center justify-center space-x-1.5 py-3 sm:py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 border border-pink-500/30 transition-all disabled:opacity-40 cursor-pointer min-h-[44px]"
                    >
                      {checkingName ? (
                        <>
                          <div className="h-4 w-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
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

              {zoneConfig.hasZone && product?.hasCheckId !== false && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handlePerformCheckName}
                    disabled={checkingName || !playerId.trim() || (zoneConfig.required && !playerZoneId.trim())}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-md shadow-pink-500/20 transition-all disabled:opacity-40 cursor-pointer min-h-[42px]"
                  >
                    {checkingName ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

              {/* Notice when ID entered but not verified yet */}
              {product?.hasCheckId !== false && !checkingName && !isIdCheckedDone && playerId.trim().length >= 3 && !checkNameError && (
                <div className="mt-3.5 flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs font-bold animate-in fade-in">
                  <div className="flex items-center space-x-2 min-w-0 flex-1 mr-2">
                    <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="truncate sm:whitespace-normal">ត្រូវពិនិត្យ Player ID ជាមុនសិនទើបអាចបញ្ជាទិញបាន (Check ID required)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handlePerformCheckName}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shrink-0 transition-colors shadow-xs cursor-pointer"
                  >
                    ពិនិត្យឥឡូវនេះ
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
                <div className="mt-4 rounded-2xl sm:rounded-3xl border border-emerald-400 bg-emerald-50/90 p-4 sm:p-5 shadow-md relative overflow-hidden text-left">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    {/* Avatar & Player Info */}
                    <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <img
                          src={playerProfile?.avatarUrl || product.image || '/images/games/telegram-premium.png'}
                          alt="User Photo"
                          referrerPolicy="no-referrer"
                          className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-md bg-white p-0.5"
                          onError={(e) => { (e.target as HTMLImageElement).src = product.image || '/images/games/telegram-premium.png'; }}
                        />
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                          <CheckCircle className="h-3.5 w-3.5 stroke-[3]" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300 flex items-center gap-1 shadow-xs">
                            <Sparkles className="h-3 w-3 text-emerald-600" />
                            <span>ផ្ទៀងផ្ទាត់ឈ្មោះពិតជោគជ័យ (Real In-Game Name Verified)</span>
                          </span>
                          <span className="text-[10px] text-slate-600 font-mono bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                            ID: {playerId}{playerZoneId ? ` (${zoneConfig.isServer ? 'Server' : 'Zone'}: ${playerZoneId})` : ''}
                          </span>
                        </div>

                        <div className="mt-1">
                          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                            <span>ឈ្មោះពិតក្នុងហ្គេម (Real Name):</span>
                          </div>
                          <h4 className="text-slate-900 font-black text-base sm:text-lg truncate tracking-tight text-emerald-700">
                            {playerProfile?.nickname || autoNickname}
                          </h4>
                        </div>

                        <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-1">
                          <span className="text-emerald-700 font-semibold">📍 {playerProfile?.region || 'Cambodia (Asia)'}</span>
                          {playerProfile?.level && (
                            <span className="text-pink-600 font-semibold">⚡ Lv. {playerProfile.level}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Re-check Action */}
                    <button
                      type="button"
                      onClick={handlePerformCheckName}
                      className="self-end sm:self-center shrink-0 flex items-center space-x-1 text-[11px] font-bold text-slate-700 hover:text-pink-600 bg-white hover:bg-pink-50 border border-pink-200 rounded-xl px-2.5 py-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>ផ្ទៀងផ្ទាត់ឡើងវិញ (Re-check)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: Select Package (Pink and White Theme) */}
            <div className="p-4 sm:p-6 theme-container-card border shadow-xl rounded-2xl sm:rounded-3xl">
              <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
                <div className="flex items-center space-x-2.5">
                  <span className="h-7 w-7 rounded-lg bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-600 font-black text-xs shrink-0 shadow-sm">
                    2
                  </span>
                  <h3 className="theme-card-title font-extrabold text-sm sm:text-base">
                    {t.selectRechargePackage || 'ជ្រើសរើសចំនួនកញ្ចប់ (SELECT PACKAGE)'}
                  </h3>
                </div>
                {slug.includes('telegram') && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    <span>តម្លៃពិសេស RESELLER</span>
                  </span>
                )}
              </div>

              {/* Categorized Packages Grid */}
              {product.packages.length === 0 ? (
                <div className="text-center py-8 theme-label text-xs">
                  No packages available for this game.
                </div>
              ) : (
                (() => {
                  const { groups, sortedCategories } = groupPackagesByCategory(product.packages);

                  return (
                    <div className="space-y-4">
                      {/* Packages Grid (3 Columns Pink and White Cards) */}
                      <div className="space-y-5">
                        {sortedCategories.map((category) => (
                          <div key={category}>
                            {sortedCategories.length > 1 && (
                              <h4 className="text-pink-600 font-bold text-xs mb-2.5 tracking-wider uppercase flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-pink-500"></span>
                                <span>{category}</span>
                                <span className="text-[10px] text-pink-400">({groups[category].length})</span>
                              </h4>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                                {groups[category].map((pkg) => {
                                  const isSelected = selectedPackage?.id === pkg.id;
                                  const matchNum = pkg.name.match(/\b\d+\b/);
                                  const qty = pkg.amount ? String(pkg.amount) : (matchNum ? matchNum[0] : '');
                                  const norm = (pkg.name || '').toLowerCase();
                                  const isPass = norm.includes('pass') || norm.includes('card') || norm.includes('membership') || norm.includes('combo') || norm.includes('lite') || norm.includes('level up') || norm.includes('twilight') || norm.includes('m.epic') || norm.includes('w.elite') || norm.includes('w.pass') || norm.includes('m.card') || norm.includes('w.card') || norm.includes('ប្រចាំ');

                                  let pkgMultiplier = '1';
                                  if (pkg.amount && Number(pkg.amount) > 1) {
                                    pkgMultiplier = String(pkg.amount);
                                  }
                                  const multMatch = norm.match(/(\d+)\s*x\b/i) || norm.match(/\bx\s*(\d+)/i) || norm.match(/x(\d+)/i);
                                  if (multMatch) {
                                    pkgMultiplier = multMatch[1];
                                  }

                                  let titleNum = qty;
                                  let unitText = 'Diamonds';

                                  if (isPass) {
                                    if (norm.includes('lite') || norm.includes('w.elite')) {
                                      const multStr = pkgMultiplier !== '1' ? `${pkgMultiplier}x ` : '';
                                      titleNum = `${multStr}Weekly Lite`;
                                      unitText = '';
                                    } else if (norm.includes('twilight')) {
                                      titleNum = 'Twilight Pass';
                                      unitText = '';
                                    } else if (norm.includes('m.epic')) {
                                      titleNum = 'Monthly Pass';
                                      unitText = '';
                                    } else if (norm.includes('w.pass')) {
                                      titleNum = pkg.name;
                                      unitText = '';
                                    } else if (norm.includes('monthly') || norm.includes('ប្រចាំខែ')) {
                                      const multStr = pkgMultiplier !== '1' ? `${pkgMultiplier}x ` : '';
                                      titleNum = `${multStr}Monthly`;
                                      unitText = '';
                                    } else if (norm.includes('weekly') || norm.includes('សប្តាហ៍')) {
                                      const multStr = pkgMultiplier !== '1' ? `${pkgMultiplier}x ` : '';
                                      titleNum = `${multStr}Weekly`;
                                      unitText = '';
                                    } else if (norm.includes('combo') || norm.includes('3 in 1') || norm.includes('3in1') || norm.includes('m+w+l')) {
                                      titleNum = '3-In-1';
                                      unitText = 'Combo Pass';
                                    } else if (norm.includes('level up') || norm.includes('lvup')) {
                                      titleNum = 'Level Up';
                                      unitText = 'Pass';
                                    } else {
                                      titleNum = pkg.name;
                                      unitText = '';
                                    }
                                  } else {
                                    if (norm.includes('uc')) unitText = 'UC';
                                    else if (norm.includes('token')) unitText = 'Tokens';
                                    else if (norm.includes('vp') || norm.includes('point')) unitText = 'Points';
                                    else if (norm.includes('crystal')) unitText = 'Crystals';
                                    else if (norm.includes('star')) unitText = 'Stars';
                                    else unitText = 'Diamonds';

                                    if (!titleNum) {
                                      titleNum = pkg.name;
                                    }
                                  }

                                  const isFreeFire = slug === 'free-fire' || norm.includes('membership');
                                  const isWeeklyPass = isFreeFire && (norm.includes('weekly') || norm.includes('សប្តាហ៍')) && !norm.includes('lite');
                                  const isMonthlyPass = isFreeFire && (norm.includes('monthly') || norm.includes('ប្រចាំខែ'));
                                  const displayBadge = pkg.badge || (isWeeklyPass ? 'ទទួលបាន 200💎 ភ្លាមៗ' : isMonthlyPass ? 'ទទួលបាន 1000💎 ភ្លាមៗ' : null);
                                  const isRedBadge = isWeeklyPass || isMonthlyPass;

                                  return (
                                    <button
                                      key={pkg.id}
                                      type="button"
                                      onClick={() => setSelectedPackage(pkg)}
                                      className={`p-3 sm:p-3.5 rounded-2xl relative transition-all duration-200 flex items-center justify-between text-left cursor-pointer min-h-[86px] sm:min-h-[94px] active:scale-[0.98] group bg-white dark:bg-slate-900/95 shadow-xs ${
                                        isSelected
                                          ? 'border-2 border-[#00b894] ring-2 ring-[#00b894]/25 shadow-md shadow-[#00b894]/15 scale-[1.01]'
                                          : 'border border-slate-200 hover:border-[#00b894]/60 dark:border-slate-800 dark:hover:border-[#00b894]/60'
                                      }`}
                                    >
                                      {displayBadge && (
                                        <span className={`absolute -top-2.5 right-2 z-10 text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-md shadow-xs ${
                                          isRedBadge ? 'bg-[#e71a24] text-white tracking-wide' : 'bg-[#00b894] text-white'
                                        }`}>
                                          {displayBadge}
                                        </span>
                                      )}

                                      {/* Left Side: Amount Number, Unit, Price */}
                                      <div className="flex flex-col justify-center min-w-0 pr-1 sm:pr-2">
                                        <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight leading-none truncate">
                                          {titleNum}
                                        </span>
                                        {unitText && (
                                          <span className="font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-tight mt-0.5 truncate">
                                            {unitText}
                                          </span>
                                        )}
                                        <span className="font-black text-sm sm:text-base text-[#00b894] dark:text-emerald-400 mt-1 sm:mt-1.5 tracking-tight">
                                          ${pkg.price.toFixed(2)}
                                        </span>
                                      </div>

                                      {/* Right Side: Glowing Diamond Chest with Number Badge */}
                                      <div className="flex items-center justify-center shrink-0 pl-1">
                                        {getPackageIcon(pkg)}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>


            {/* STEP 3: Choose Payment Gateway (Matching Exact User UI Design) */}
            {/* STEP 3: Choose Payment Gateway (Matching User UI Design) */}
            <div className="p-4 sm:p-6 theme-container-card border shadow-xl rounded-2xl sm:rounded-3xl">
              <div className="flex items-center space-x-2.5 mb-3 sm:mb-4">
                <span className="h-7 w-7 rounded-lg bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-600 font-black text-xs shrink-0 shadow-sm">
                  3
                </span>
                <h3 className="theme-card-title font-extrabold text-sm sm:text-base">វិធីបង់ប្រាក់ (Payment Method)</h3>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {/* ABA KHQR Payment Card with Checkmark (Interactive Animated Design) */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('BAKONG')}
                  className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 text-left flex items-center justify-between border-[#00c988] bg-white ring-2 ring-[#00c988]/30 shadow-md min-h-[58px] active:scale-[0.99] cursor-pointer group hover:shadow-xl hover:shadow-[#00c988]/20 hover:border-emerald-400 theme-payment-card"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl overflow-hidden shrink-0 bg-white p-0.5 flex items-center justify-center border border-pink-100 shadow-xs group-hover:scale-105 transition-transform duration-300">
                      <img
                        src="/images/payments/aba-khqr.svg"
                        alt="ABA KHQR"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h4 className="font-black text-xs sm:text-sm tracking-tight theme-card-title">ABA KHQR</h4>
                        <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300/80 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600"></span>
                          </span>
                          <span>Instant Scan</span>
                        </span>
                      </div>
                      <span className="theme-label text-[11px] sm:text-xs leading-tight block mt-0.5 truncate">Scan to pay with any banking app in Cambodia</span>
                    </div>
                  </div>

                  {/* Green Checkmark Badge on Right */}
                  <div className="h-7 w-7 rounded-full bg-emerald-100 border border-emerald-500 flex items-center justify-center text-emerald-600 shrink-0 ml-2 shadow-xs group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-200">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                </button>
              </div>
            </div>

            {/* ══ TERMS & CONDITIONS AGREEMENT BOX ═════ */}
            <div 
              onClick={() => setTermsAccepted(!termsAccepted)}
              className="p-3.5 sm:p-4 rounded-2xl border hover:border-pink-300 flex items-center space-x-3 cursor-pointer select-none transition-all shadow-md theme-agreement-box"
            >
              <div className={`h-5 w-5 rounded-md flex items-center justify-center transition-all shrink-0 ${
                termsAccepted 
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black shadow-xs' 
                  : 'bg-white border border-pink-300 text-transparent'
              }`}>
                {termsAccepted && <span className="text-xs">✓</span>}
              </div>
              <p className="text-xs theme-label font-medium leading-relaxed">
                ខ្ញុំបានអាន និងយល់ព្រមលើ <span className="text-pink-600 font-bold hover:underline">លក្ខខណ្ឌប្រតិបត្តិ</span> និងគោលការណ៍ទិញ។
              </p>
            </div>

            {/* ══ IN-PAGE TOTAL PRICE & KHMER ORDER NOW BOX ══ */}
            <div className="theme-bottom-box border rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex items-center justify-between shadow-2xl">
              <div className="flex items-center space-x-3">
                {selectedPackage && (
                  <div className="p-2 bg-pink-50 rounded-xl border border-pink-200 shadow-inner flex items-center justify-center shrink-0">
                    {getPackageIcon(selectedPackage)}
                  </div>
                )}
                <div>
                  <div className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span>TOTAL PRICE</span>
                    {selectedPackage && (
                      <span className="text-pink-600 font-bold">• {selectedPackage.name}</span>
                    )}
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#BE185D] leading-none mt-1">
                    ${selectedPackage ? selectedPackage.price.toFixed(2) : '0.00'}
                  </div>
                  {/* Real-time verification status badge */}
                  {product?.hasCheckId !== false && (
                    <div className="mt-1 flex items-center gap-1">
                      {isIdCheckedDone ? (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                          <span className="truncate max-w-[140px] sm:max-w-[200px]">ID បានពិនិត្យ: {playerProfile?.nickname || autoNickname}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                          <ShieldAlert className="h-3 w-3 text-amber-500 shrink-0" />
                          <span>ត្រូវពិនិត្យ ID ជាមុនសិន</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleOrderSubmit}
                disabled={orderSubmitting || !selectedPackage || checkingName}
                className={`px-6 sm:px-8 py-3 rounded-2xl font-black text-sm sm:text-base flex items-center space-x-1.5 shadow-lg transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50 ${
                  product?.hasCheckId !== false && !isIdCheckedDone
                    ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-amber-400/25'
                    : 'bg-[#03c39a] hover:bg-[#02b18b] text-slate-950 shadow-[#03c39a]/25'
                }`}
              >
                <span>
                  {orderSubmitting 
                    ? 'ដំណើរការ...' 
                    : checkingName 
                    ? 'កំពុងពិនិត្យ ID...' 
                    : (product?.hasCheckId !== false && !isIdCheckedDone)
                    ? 'ពិនិត្យ ID & បញ្ជាទិញ'
                    : 'បញ្ជាទិញ'}
                </span>
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

      {/* ══ AUTHENTIC ABA KHQR MODAL POPUP (SYSTEM-WIDE ANIMATION) ══ */}
      {activeOrder && (
        <AbaKhqrModal
          order={activeOrder}
          isOpen={showKhqrModal}
          onClose={() => setShowKhqrModal(false)}
          onPaymentSuccess={(updated) => {
            setActiveOrder(updated);
          }}
        />
      )}

      <Footer />
    </>
  );
}
