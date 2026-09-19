'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, CheckCircle2, Download, AlertCircle, Smartphone, Home 
} from 'lucide-react';
import { 
  OrderStatusDetails, getOrderStatus, simulatePaymentCallback, 
  verifyPayment 
} from '../lib/api';
import { subscribeToOrderRealtime } from '../lib/supabase';

interface AbaKhqrModalProps {
  order: OrderStatusDetails;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: (order: OrderStatusDetails) => void;
}

// ── Official Bakong KHQR Vector Brandmark (Matches Image 1) ───────────────────
export const KhqrWordmark = ({ className = 'h-6 sm:h-7' }: { className?: string }) => (
  <svg viewBox="20 20 206 60" className={className} fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
    <g fill="#ffffff">
      {/* K */}
      <path d="M25 24 H37 V48 L56 24 H71 L49 50 L72 76 H57 L37 53 V76 H25 Z" />
      {/* H */}
      <path d="M80 24 H92 V44 H112 V24 H124 V76 H112 V55 H92 V76 H80 Z" />
      {/* Q (with official inner square hole) */}
      <path fillRule="evenodd" clipRule="evenodd" d="M133 34 C133 28 138 24 145 24 H165 C172 24 177 28 177 34 V66 C177 72 172 76 165 76 H145 C138 76 133 72 133 66 V34 Z M144 35 C144 33.5 145.5 32 147 32 H163 C164.5 32 166 33.5 166 35 V65 C166 66.5 164.5 68 163 68 H147 C145.5 68 144 66.5 144 65 V35 Z M151 46 H159 V54 H151 Z" />
      {/* R */}
      <path d="M187 24 H207 C215.5 24 221 28.5 221 37 C221 44.5 216 48.5 210 49.5 L222 76 H208 L198 52 H198 V76 H187 Z M198 33 V43.5 H206 C209 43.5 211 41.5 211 38.2 C211 35 209 33 206 33 Z" />
    </g>
  </svg>
);

// ── Official ABA' PAYWAY Wordmark (Exact Match to User Screenshot) ────────────
export const AbaPaywayWordmark = ({ className = 'h-4' }: { className?: string }) => (
  <svg viewBox="0 0 152 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* ABA */}
    <text x="2" y="18" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="17" fill="#ffffff" letterSpacing="0.08em">
      ABA
    </text>
    {/* White Accent Apostrophe in ABA' */}
    <rect x="52" y="4" width="3.5" height="8.5" rx="1" fill="#ffffff" />
    {/* PAYWAY (Slanted Italic Geometric) */}
    <g transform="skewX(-14)">
      <text x="64" y="18" fontFamily="system-ui, -apple-system, sans-serif" fontStyle="italic" fontWeight="900" fontSize="16" fill="#ffffff" letterSpacing="0.1em">
        PAYWAY
      </text>
    </g>
  </svg>
);

export default function AbaKhqrModal({
  order: initialOrder,
  isOpen,
  onClose,
  onPaymentSuccess,
}: AbaKhqrModalProps) {
  const router = useRouter();
  const [currentOrder, setCurrentOrder] = useState<OrderStatusDetails>(initialOrder);
  const [isMobile, setIsMobile] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const autoOpenedRef = useRef<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state if prop changes
  useEffect(() => {
    setCurrentOrder(initialOrder);
  }, [initialOrder]);

  // Check mobile device
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    }
  }, []);

  const getAbaDeepLink = () => {
    if (!currentOrder) return '';
    if (currentOrder.deepLink) return currentOrder.deepLink;
    if (currentOrder.paymentQrCode) {
      return `abamobilebank://ababank.com?type=payway&qrcode=${encodeURIComponent(currentOrder.paymentQrCode)}`;
    }
    return '';
  };

  const handleOpenAbaApp = () => {
    const deepLink = getAbaDeepLink();
    if (!deepLink) return;
    window.location.href = deepLink;
  };

  // Auto-open ABA Mobile once on mobile devices
  useEffect(() => {
    if (
      isOpen &&
      currentOrder &&
      currentOrder.status === 'PENDING' &&
      (currentOrder.paymentQrCode || currentOrder.deepLink)
    ) {
      if (autoOpenedRef.current !== currentOrder.paymentTxnId) {
        autoOpenedRef.current = currentOrder.paymentTxnId;
        if (isMobile) {
          const deepLink = getAbaDeepLink();
          if (deepLink) {
            const timer = setTimeout(() => {
              window.location.href = deepLink;
            }, 600);
            return () => clearTimeout(timer);
          }
        }
      }
    }
  }, [isOpen, currentOrder?.paymentTxnId, currentOrder?.status, isMobile]);

  // Live Status Polling & Supabase Realtime WebSocket listener
  const checkStatus = async () => {
    if (!currentOrder?.paymentTxnId) return;
    try {
      const updated = await getOrderStatus(currentOrder.paymentTxnId);
      setCurrentOrder(updated);

      if (
        updated.status === 'COMPLETED' ||
        updated.status === 'SUCCESS' ||
        updated.status === 'PAID'
      ) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        if (onPaymentSuccess) {
          onPaymentSuccess(updated);
        }
        return;
      }

      // Continuous active verification with gateway
      if (updated.status === 'PENDING') {
        try {
          const v = await verifyPayment(currentOrder.paymentTxnId);
          if (v && v.verified) {
            const rechecked = await getOrderStatus(currentOrder.paymentTxnId);
            setCurrentOrder(rechecked);
            if (
              rechecked.status === 'COMPLETED' ||
              rechecked.status === 'SUCCESS' ||
              rechecked.status === 'PAID'
            ) {
              if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
              }
              if (onPaymentSuccess) {
                onPaymentSuccess(rechecked);
              }
            }
          }
        } catch {
          // non-blocking
        }
      }
    } catch (err) {
      console.warn('Status check notice:', err);
    }
  };

  useEffect(() => {
    if (!isOpen || !currentOrder?.paymentTxnId) return;

    if (
      currentOrder.status === 'COMPLETED' ||
      currentOrder.status === 'SUCCESS' ||
      currentOrder.status === 'PAID'
    ) {
      return;
    }

    // Immediate check upon opening
    checkStatus();

    // 1. Supabase Realtime channel listener for instant zero-latency payment detection
    const unsubscribe = subscribeToOrderRealtime(currentOrder.paymentTxnId, (payload) => {
      console.log('[Realtime] Order status updated in KHQR modal:', payload);
      checkStatus();
    });

    // 2. High-reliability continuous auto-check every 2.0s
    pollingRef.current = setInterval(() => {
      checkStatus();
    }, 2000);

    // 3. Instant auto-check on tab return / window focus (e.g. after paying in ABA Mobile)
    const handleFocus = () => {
      checkStatus();
    };
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkStatus();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isOpen, currentOrder?.paymentTxnId, currentOrder?.status]);

  // Receipt Canvas Generator for Instant PNG Download
  const handleDownloadReceipt = () => {
    if (!currentOrder) return;
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 680;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative line
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 80);
    ctx.lineTo(470, 80);
    ctx.stroke();

    // App header
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Payment Success', 40, 50);

    ctx.fillStyle = '#D61C24';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('ABA KHQR', 460, 50);

    // Green Check Circle
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e6f4ea';
    ctx.beginPath();
    ctx.arc(250, 140, 36, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = '#137333';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(238, 140);
    ctx.lineTo(246, 148);
    ctx.lineTo(262, 132);
    ctx.stroke();

    // Khmer Success Label
    ctx.fillStyle = '#137333';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ការទិញរបស់អ្នកត្រូវបានជោគជ័យ', 250, 205);

    // Invoice details table
    ctx.textAlign = 'left';
    ctx.font = '13px sans-serif';
    let y = 250;
    const lineHeight = 38;

    const rows: [string, string][] = [
      ['Product:', `${currentOrder.gameName} - ${currentOrder.packageName}`],
      ['User ID:', currentOrder.playerId],
    ];

    if (currentOrder.playerZoneId) {
      rows.push(['Zone/Server ID:', currentOrder.playerZoneId]);
    }

    rows.push(
      ['Nickname:', currentOrder.playerNickname || 'Verified Account'],
      ['Payment:', currentOrder.paymentMethod || 'KHQR'],
      ['Price:', `${Number(currentOrder.price || 0).toFixed(2)} USD`],
      ['Transaction ID:', currentOrder.paymentTxnId],
      ['Date:', new Date(currentOrder.createdAt).toLocaleString()]
    );

    rows.forEach(([label, value]) => {
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, y + 10);
      ctx.lineTo(460, y + 10);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.fillText(label, 40, y);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(value.length > 25 ? value.slice(0, 24) + '...' : value, 200, y);
      ctx.font = '13px sans-serif';
      y += lineHeight;
    });

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Thank you for choosing NADYTOPUP.SITE Cambodia!', 250, 620);
    ctx.fillText('Support Telegram: @darazzdev', 250, 640);

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `KHQR-Receipt-${currentOrder.paymentTxnId}.png`;
    link.click();
  };

  const isPaid =
    currentOrder?.status === 'COMPLETED' ||
    currentOrder?.status === 'SUCCESS' ||
    currentOrder?.status === 'PAID';

  const isFailed =
    currentOrder?.status === 'FAILED' || currentOrder?.status === 'CANCELLED';

  // Auto-redirect back to Home page when payment is completed
  useEffect(() => {
    if (!isOpen || !isPaid) return;
    setRedirectCountdown(6);
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => (prev !== null && prev > 1 ? prev - 1 : 0));
    }, 1000);
    const redirectTimer = setTimeout(() => {
      router.push('/');
    }, 6000);
    return () => {
      clearInterval(interval);
      clearTimeout(redirectTimer);
    };
  }, [isOpen, isPaid, router]);

  const handleModalClose = () => {
    if (isPaid) {
      router.push('/');
    }
    onClose();
  };

  if (!isOpen || !currentOrder) return null;

  const qrData = currentOrder.paymentQrCode || currentOrder.paymentTxnId;
  const rawMerchant = currentOrder.merchantName?.trim();
  const merchantLabel =
    !rawMerchant ||
    rawMerchant.toUpperCase().includes('SABAY') ||
    rawMerchant.toUpperCase().includes('NADY') ||
    rawMerchant === 'NA-DY TOPUP' ||
    rawMerchant === 'NADY TOPUP'
      ? 'NA-DY TOPUP ll'
      : rawMerchant;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#081b37]/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto aba-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleModalClose();
        }
      }}
    >
      {/* ── CARD CONTAINER (Pure White, Rounded 24px, Slide Down-to-Up Animation) ── */}
      <div className="relative w-full max-w-[390px] bg-white rounded-[24px] shadow-2xl p-5 sm:p-6 text-slate-800 border border-slate-100 aba-modal-slide-up">
        
        {/* ── 1. MODAL HEADER: "ABA KHQR" + Cyan Close (X) ── */}
        <div className="flex items-center justify-between pb-2">
          <h2 className="text-[20px] sm:text-[21px] font-bold text-[#0f172a] tracking-tight font-sans">
            {currentOrder.paymentMethod === 'CANADIA' ? 'CANADIA KHQR' : 'ABA KHQR'}
          </h2>

          {/* Cyan / Teal Close Button */}
          <button
            onClick={handleModalClose}
            className="text-[#00B4D8] hover:text-[#0096C7] p-1.5 rounded-full hover:bg-cyan-50 transition-colors focus:outline-hidden"
            aria-label="Close"
          >
            <X className="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        {/* ── 2. MAIN PAYMENT CARD / TICKET (Exact Match to Image 1) ─────────── */}
        {!isPaid && !isFailed ? (
          <div className="mt-3">
            {/* Outer Ticket Card */}
            <div className="bg-white rounded-[22px] border border-slate-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden relative">
              
              {/* ── Solid Red Header Banner with 45° Angle Cut on Top-Right & Light Shimmer ─── */}
              <div className="h-[62px] bg-[#D61C24] relative flex items-center justify-center khqr-header-cut overflow-hidden">
                <div className="aba-header-shimmer" />
                {/* Centered Crisp KHQR Logo */}
                <div className="relative z-10 flex items-center justify-center">
                  <KhqrWordmark className="h-6 sm:h-7" />
                </div>
              </div>

              {/* ── Ticket Body Section (Left-aligned, exact match to Image 1) ──── */}
              <div className="pt-4 pb-2 px-5 sm:px-6 bg-white text-left">
                {/* Merchant / Store Name */}
                <div className="text-[13px] sm:text-[14px] font-medium text-[#0f294a]">
                  {merchantLabel}
                </div>

                {/* Amount Display: 0.25 USD */}
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-[30px] sm:text-[34px] font-extrabold text-[#001f3f] leading-none tracking-tight font-sans">
                    {Number(currentOrder.price || 0).toFixed(2)}
                  </span>
                  <span className="text-[13px] sm:text-[14px] font-bold text-[#001f3f] uppercase">
                    USD
                  </span>
                </div>
              </div>

              {/* ── Dashed Separator Line with Left & Right Cutout Notches ── */}
              <div className="relative w-full my-2 flex items-center justify-center">
                {/* Left Ticket Cutout Notch */}
                <div
                  className="absolute -left-3.5 w-7 h-7 rounded-full bg-[#f8fafc] border-r border-slate-200/90 shadow-inner z-10"
                  aria-hidden="true"
                />
                {/* Dashed Line */}
                <div className="w-full border-t-[1.5px] border-dashed border-slate-300 mx-5" />
                {/* Right Ticket Cutout Notch */}
                <div
                  className="absolute -right-3.5 w-7 h-7 rounded-full bg-[#f8fafc] border-l border-slate-200/90 shadow-inner z-10"
                  aria-hidden="true"
                />
              </div>

              {/* ── Clean QR Code Section ─────────── */}
              <div className="p-4 flex flex-col items-center justify-center relative bg-white">
                <div
                  className="relative w-[220px] h-[220px] bg-white rounded-xl p-1 flex items-center justify-center cursor-pointer select-none group transition-all duration-300 hover:scale-[1.01]"
                  onClick={handleOpenAbaApp}
                  title="Tap to open in ABA Mobile"
                >
                  {/* QR Image */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=4&data=${encodeURIComponent(
                      qrData
                    )}`}
                    alt="ABA KHQR Code"
                    className="w-full h-full object-contain relative z-10"
                  />
                </div>
              </div>
            </div>

            {/* ── 3. FOOTER TEXT ── */}
            <div className="mt-4 text-center flex flex-col items-center">
              <p className="text-[12px] text-slate-500 font-medium leading-relaxed max-w-[280px] mx-auto">
                Scan with ABA Mobile, or other Mobile Banking App supporting KHQR
              </p>

              {/* Mobile Deep Link Shortcut */}
              {isMobile && (
                <button
                  onClick={handleOpenAbaApp}
                  className="mt-3.5 w-full py-2.5 px-4 bg-[#D61C24] hover:bg-[#b8141b] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Open ABA Mobile App</span>
                </button>
              )}
            </div>
          </div>
        ) : isPaid ? (
          /* ══ PAYMENT SUCCESS SCREEN ═══════════════════════════════════════ */
          <div className="mt-4 text-center space-y-4 animate-in fade-in zoom-in duration-200">
            {/* Animated ABA PayWay Celebratory Checkmark */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-500/30 flex items-center justify-center aba-success-circle shadow-lg shadow-emerald-500/20">
                <svg className="w-12 h-12 text-emerald-600" viewBox="0 0 52 52" fill="none">
                  <circle
                    className="aba-checkmark-circle stroke-emerald-500"
                    cx="26"
                    cy="26"
                    r="23"
                    strokeWidth="3.5"
                  />
                  <path
                    className="aba-checkmark-path stroke-emerald-600"
                    d="M14.1 27.2l7.1 7.2 16.7-16.8"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-[#0f172a]">Payment Successful!</h3>
              <p className="text-emerald-700 font-bold text-sm mt-0.5 font-sans">
                ការទិញរបស់អ្នកត្រូវបានជោគជ័យ
              </p>
            </div>

            {/* Voucher Code (if delivered) */}
            {currentOrder.stockDeliveredCode ? (
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Digital Voucher Code
                </div>
                <div className="font-mono font-black text-base text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 select-all shadow-2xs">
                  {currentOrder.stockDeliveredCode}
                </div>
              </div>
            ) : (
              /* Direct Topup In-Game Details */
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-500">Player Nickname:</span>
                  <strong className="text-slate-800 font-bold">{currentOrder.playerNickname || 'Verified'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Player ID:</span>
                  <strong className="text-slate-800 font-mono">{currentOrder.playerId}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Item:</span>
                  <div className="flex items-center gap-1.5 text-right font-bold text-slate-800">
                    <img src="/images/diamond-icon.png" alt="Diamond" className="h-4 w-4 rounded-xs object-cover inline-block shrink-0" />
                    <span>{currentOrder.gameName} - {currentOrder.packageName}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery:</span>
                  <span className="text-emerald-600 font-bold">Auto-Delivered ✅</span>
                </div>
              </div>
            )}

            {/* Auto-redirect countdown banner */}
            <div className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-xl flex items-center justify-center space-x-1.5">
              <span>Redirecting to Home page in</span>
              <span className="font-mono font-bold text-emerald-600 text-xs">
                {redirectCountdown !== null ? `${redirectCountdown}s` : '6s'}
              </span>
              <span>...</span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => router.push('/')}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Return to Home / ត្រឡប់ទៅដើម</span>
              </button>
              <button
                onClick={handleDownloadReceipt}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Receipt</span>
              </button>
            </div>
          </div>
        ) : (
          /* ══ PAYMENT FAILED / CANCELLED STATE ═════════════════════════════ */
          <div className="mt-4 text-center space-y-4 py-4">
            <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto border border-red-200">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Payment Unsuccessful</h3>
              <p className="text-xs text-slate-500 mt-1">This checkout QR has expired or was cancelled.</p>
            </div>
            <button
              onClick={onClose}
              className="py-2 px-5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl"
            >
              Try Again
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
