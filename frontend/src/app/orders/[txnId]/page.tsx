'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import AbaKhqrModal from '../../../components/AbaKhqrModal';
import { getOrderStatus, simulatePaymentCallback, verifyPayment, OrderStatusDetails, API_BASE } from '../../../lib/api';
import { subscribeToOrderRealtime } from '../../../lib/supabase';
import { CheckCircle2, XCircle, Clock, CreditCard, Copy, Check, Info, Sparkles, QrCode, X, Download, ChevronLeft, RefreshCw, AlertCircle, Home } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '../../../lib/LanguageContext';

export default function CheckoutPage() {
  const router = useRouter();
  const routeParams = useParams();
  const txnId = (routeParams?.txnId as string) || '';
  const [order, setOrder] = useState<OrderStatusDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState('');
  const [showKhqrModal, setShowKhqrModal] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const autoOpenedRef = useRef<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    }
  }, []);

  const getAbaDeepLink = () => {
    if (!order) return '';
    if (order.deepLink) return order.deepLink;
    if (order.paymentQrCode) {
      return `abamobilebank://ababank.com?type=payway&qrcode=${encodeURIComponent(order.paymentQrCode)}`;
    }
    return '';
  };

  const handleOpenAba = () => {
    const deepLink = getAbaDeepLink();
    if (!deepLink) return;
    window.location.href = deepLink;
  };

  // Auto-open ABA Mobile app on mobile devices when KHQR is generated
  useEffect(() => {
    if (order && order.status === 'PENDING' && (order.paymentQrCode || order.deepLink)) {
      if (autoOpenedRef.current !== order.paymentTxnId) {
        autoOpenedRef.current = order.paymentTxnId;
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
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
  }, [order?.paymentTxnId, order?.status, order?.paymentQrCode, order?.deepLink]);

  // Polling ref/timer
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = async (showLoading = false) => {
    if (!txnId) return;
    if (showLoading) setLoading(true);
    try {
      const data = await getOrderStatus(txnId);
      setOrder(data);
      
      // Stop polling if order has reached terminal states
      if (data.status === 'COMPLETED' || data.status === 'SUCCESS' || data.status === 'PAID' || data.status === 'FAILED' || data.status === 'CANCELLED') {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    } catch (err: any) {
      console.error('Fetch status error:', err);
      setError(`Failed to retrieve checkout order details from "${API_BASE}". Details: ${err.message || err}`);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (!txnId) return;

    fetchStatus(true);

    // 1. Live Supabase Realtime WebSocket listener for instant zero-latency updates
    const unsubscribe = subscribeToOrderRealtime(txnId, (updatedOrder) => {
      console.log('[Supabase Realtime] Order status changed:', updatedOrder);
      fetchStatus(false);
    });

    // 2. High-reliability continuous auto-check every 2 seconds
    pollingRef.current = setInterval(() => {
      fetchStatus(false);
    }, 2000);

    // 3. Instant auto-check on window focus & visibility change (tab return from banking app)
    const handleFocus = () => {
      fetchStatus(false);
    };
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchStatus(false);
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [txnId]);

  // Countdown Timer hook (15 minutes validity)
  useEffect(() => {
    if (!order || order.status !== 'PENDING') {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const createdAt = new Date(order.createdAt).getTime();
      const now = Date.now();
      const elapsedSecs = Math.floor((now - createdAt) / 1000);
      const validitySecs = 900; // 15 minutes validity
      const remaining = validitySecs - elapsedSecs;
      return remaining > 0 ? remaining : 0;
    };

    setTimeLeft(calculateTimeLeft());

    const intervalId = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(intervalId);
        fetchStatus(false);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [order]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePayment = async (status: 'PAID' | 'FAILED') => {
    if (!order) return;
    setSimulating(true);
    setError('');
    try {
      await simulatePaymentCallback(order.paymentTxnId, status);
      await fetchStatus(false);
    } catch (err: any) {
      console.error(err);
      setError('Simulation failed: ' + err.message);
    } finally {
      setSimulating(false);
    }
  };

  const handleDownloadReceipt = () => {
    if (!order) return;
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 680;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative header line
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 80);
    ctx.lineTo(470, 80);
    ctx.stroke();

    // App name / title
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Payment Success', 40, 50);

    // Brand
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('NADYTOPUP.SITE', 330, 50);

    // Green check icon container
    ctx.fillStyle = '#e6f4ea';
    ctx.beginPath();
    ctx.arc(250, 140, 36, 0, 2 * Math.PI);
    ctx.fill();

    // Green check mark
    ctx.strokeStyle = '#137333';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(238, 140);
    ctx.lineTo(246, 148);
    ctx.lineTo(262, 132);
    ctx.stroke();

    // Khmer success text
    ctx.fillStyle = '#137333';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ការទិញរបស់អ្នកត្រូវបានជោគជ័យ', 250, 205);

    // Invoice details table
    ctx.textAlign = 'left';
    ctx.font = '13px sans-serif';
    let y = 250;
    const lineHeight = 38;

    const isServer = (order.gameSlug || '').includes('genshin') || (order.gameSlug || '').includes('star-rail') || (order.gameSlug || '').includes('zenless') || (order.gameSlug || '').includes('wuthering');
    const zoneLabel = isServer ? 'Server ID:' : 'Zone ID:';

    const rows: [string, string][] = [
      ['Product:', `${order.gameName} - ${order.packageName}`],
      ['User ID:', order.playerId],
    ];

    if (order.playerZoneId) {
      rows.push([zoneLabel, order.playerZoneId]);
    }

    rows.push(
      ['Nickname:', order.playerNickname || 'Verified Account'],
      ['Payment:', order.paymentMethod || 'KHQR'],
      ['Price:', `${Number(order.price || 0).toFixed(2)} USD`],
      ['Transaction ID:', order.paymentTxnId],
      ['Date:', new Date(order.createdAt).toLocaleString()]
    );

    rows.forEach(([label, value]) => {
      // Row line
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

    // Footer note
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Thank you for choosing NADYTOPUP.SITE Cambodia!', 250, 620);
    ctx.fillText('Support Telegram: @darazzdev', 250, 640);

    // Save and download
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt-${order.paymentTxnId}.png`;
    link.click();
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex-grow flex items-center justify-center py-20">
          <div className="text-center">
            <div className="h-10 w-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 text-xs sm:text-sm font-semibold">Initializing checkout gateway...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error && !order) {
    return (
      <>
        <Header />
        <div className="flex-grow max-w-md w-full mx-auto flex flex-col justify-center py-16 px-4">
          <div className="glass-panel p-6 sm:p-8 text-center bg-slate-900/90 border-slate-800 shadow-xl rounded-2xl sm:rounded-3xl">
            <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-white font-extrabold text-lg mb-2">{t.invoiceNotFound}</h3>
            <p className="text-slate-400 text-xs sm:text-sm mb-6">{error}</p>
            <Link
              href="/"
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold transition-all min-h-[44px]"
            >
              <span>{t.browseGames}</span>
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!order) return null;

  const isKhqr = !order.paymentMethod || order.paymentMethod === 'BAKONG' || order.paymentMethod === 'ABA' || order.paymentMethod === 'CANADIA' || order.paymentMethod === 'KHQR';

  return (
    <>
      <Header />
      
      <main className="flex-grow max-w-4xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-4 sm:py-10 pb-24 md:pb-12 overflow-x-hidden">
        <div className="max-w-md mx-auto space-y-4 sm:space-y-6">
          
          {/* Payment Portal (QR scan or Card info) */}
          <div className="space-y-4 sm:space-y-6">
            
            {order.status === 'PENDING' && (
              <>
                <AbaKhqrModal
                  order={order}
                  isOpen={showKhqrModal}
                  onClose={() => setShowKhqrModal(false)}
                  onPaymentSuccess={(updated) => {
                    setOrder(updated);
                    fetchStatus(false);
                  }}
                />

                {!showKhqrModal && (
                  <div className="glass-panel p-6 sm:p-8 bg-slate-900/90 border border-slate-800 text-center space-y-4 rounded-2xl sm:rounded-3xl shadow-xl">
                    <div className="w-14 h-14 bg-[#E11D24]/15 rounded-full flex items-center justify-center text-[#E11D24] mx-auto border border-[#E11D24]/30">
                      <QrCode className="w-7 h-7" />
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <h3 className="text-xl font-black text-white">Pending KHQR Payment</h3>
                      <p className="text-slate-400 text-xs mt-1">Please scan the ABA KHQR code to complete your recharge.</p>
                    </div>
                    <button
                      onClick={() => setShowKhqrModal(true)}
                      className="w-full py-3 rounded-xl bg-[#E11D24] hover:bg-[#c8111a] text-white font-bold text-sm shadow-md flex items-center justify-center space-x-2 transition-all active:scale-[0.99]"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Open ABA KHQR Payment Modal</span>
                    </button>
                  </div>
                )}
              </>
            )}


            {/* PAYMENT SUCCESS STATUS STATE */}

            {(order.status === 'COMPLETED' || order.status === 'SUCCESS' || order.status === 'PAID') && (
              <div className="glass-panel p-6 sm:p-8 bg-slate-900/90 border-emerald-500/40 text-center space-y-4 rounded-2xl sm:rounded-3xl shadow-xl">
                <div className="h-14 w-14 sm:h-16 sm:w-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mx-auto border border-emerald-500/30">
                  <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">{t.paymentSuccessful}</h3>
                  <p className="text-slate-400 text-xs mt-1">
                    {t.directTopupSuccessDesc}
                  </p>
                </div>

                {order.stockDeliveredCode ? (
                  /* VOUCHER CARD REDEMPTION CODE DISPLAY */
                  <div className="bg-slate-800/80 border border-slate-700 p-4 sm:p-6 rounded-2xl max-w-sm w-full mx-auto text-center space-y-2">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold">{t.digitalVoucherCode}</span>
                    <div className="text-white font-mono font-black text-lg sm:text-xl bg-slate-900 px-4 py-2.5 rounded-lg border border-slate-700 select-all tracking-wide shadow-xs">
                      {order.stockDeliveredCode}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal pt-1">
                      {t.voucherNotice}
                    </p>
                  </div>
                ) : (
                  /* DIRECT TOPUP VERIFICATION NICKNAME DISPLAY */
                  <div className="bg-slate-800/80 border border-slate-700 p-3.5 sm:p-4 rounded-xl max-w-xs mx-auto text-xs space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t.recipientNickname}:</span>
                      <strong className="text-white font-bold">{order.playerNickname}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t.recipientPlayerId}:</span>
                      <strong className="text-white font-mono">{order.playerId}</strong>
                    </div>
                    {order.playerZoneId && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">
                          {(order.gameSlug || '').includes('genshin') || (order.gameSlug || '').includes('star-rail') || (order.gameSlug || '').includes('zenless') || (order.gameSlug || '').includes('wuthering') ? 'Server' : 'Zone ID'}:
                        </span>
                        <strong className="text-cyan-400 font-mono font-bold">{order.playerZoneId}</strong>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t.deliveryStatus}:</span>
                      <span className="text-emerald-400 font-bold">{t.autoDelivered} ✅</span>
                    </div>
                  </div>
                )}
                
                <div className="pt-3 flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    onClick={handleDownloadReceipt}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-1.5 min-h-[44px]"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Receipt</span>
                  </button>
                  <Link
                    href="/"
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 shadow-sm flex items-center justify-center min-h-[44px]"
                  >
                    {t.buyMoreRecharge}
                  </Link>
                </div>
              </div>
            )}

            {/* PAYMENT FAILURE STATE */}
            {(order.status === 'FAILED' || order.status === 'CANCELLED') && (
              <div className="glass-panel p-6 sm:p-8 bg-slate-900/90 border-red-500/40 text-center space-y-4 rounded-2xl sm:rounded-3xl shadow-xl">
                <div className="h-14 w-14 sm:h-16 sm:w-16 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 mx-auto border border-red-500/30">
                  <XCircle className="h-8 w-8 sm:h-10 sm:w-10" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">{t.paymentUnsuccessful}</h3>
                  <p className="text-slate-400 text-xs mt-1">
                    {t.expiredNotice}
                  </p>
                </div>
                
                <div className="pt-3 flex justify-center">
                  <Link
                    href="/"
                    className="px-5 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 font-bold text-xs min-h-[44px] flex items-center justify-center"
                  >
                    {t.browseGames}
                  </Link>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* PAYMENT SUCCESS OVERLAY MODAL */}
        {(order.status === 'COMPLETED' || order.status === 'SUCCESS' || order.status === 'PAID') && showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
            <div className="bg-slate-900 rounded-2xl sm:rounded-3xl w-full max-w-[380px] sm:max-w-md max-h-[92vh] overflow-y-auto shadow-2xl relative border border-slate-800 flex flex-col p-4 sm:p-6 text-slate-100 animate-in fade-in zoom-in duration-200">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 sm:mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 stroke-[2.5]" />
                  </div>
                  <span className="font-extrabold text-sm text-white tracking-tight font-sans">Payment Success</span>
                </div>
                <button 
                  onClick={() => setShowSuccessModal(false)} 
                  className="text-slate-400 hover:text-white transition-colors p-1.5 hover:bg-slate-800 rounded-full"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tick Circle Block */}
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex flex-col items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2 border border-emerald-500/30">
                  <CheckCircle2 className="h-7 w-7 stroke-[2.5]" />
                </div>
                <span className="text-emerald-400 font-bold text-sm sm:text-base text-center tracking-wide font-sans">
                  ការទិញរបស់អ្នកត្រូវបានជោគជ័យ
                </span>
              </div>

              {/* Details List */}
              <div className="space-y-1 mb-5">
                <div className="flex justify-between items-center py-2 border-b border-slate-800 text-xs">
                  <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase">Product</span>
                  <span className="text-white font-extrabold text-right truncate max-w-[190px] flex items-center justify-end gap-1.5">
                    <img src="/images/diamond-icon.png" alt="Diamond" className="h-4 w-4 rounded-xs object-cover inline-block shrink-0" />
                    <span className="truncate">{order.gameName} - {order.packageName}</span>
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800 text-xs">
                  <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase">USER ID</span>
                  <span className="text-white font-mono font-bold select-all">{order.playerId}</span>
                </div>
                {order.playerZoneId && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-800 text-xs">
                    <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase">
                      {(order.gameSlug || '').includes('genshin') || (order.gameSlug || '').includes('star-rail') || (order.gameSlug || '').includes('zenless') || (order.gameSlug || '').includes('wuthering') ? 'SERVER ID' : 'ZONE ID'}
                    </span>
                    <span className="text-cyan-400 font-mono font-bold select-all">{order.playerZoneId}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-slate-800 text-xs">
                  <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase">NICKNAME</span>
                  <span className="text-white font-bold truncate max-w-[190px]">{order.playerNickname || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800 text-xs">
                  <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase">PAYMENT</span>
                  <span className="text-white font-extrabold">{order.paymentMethod || 'KHQR'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800 text-xs">
                  <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase">PRICE</span>
                  <span className="text-cyan-400 font-black">{Number(order.price || 0).toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800 text-xs">
                  <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase">TRANSACTION ID</span>
                  <span className="text-cyan-300 font-mono font-bold select-all text-[11px] truncate max-w-[160px]">{order.paymentTxnId}</span>
                </div>
              </div>

              {/* Note Label */}
              <p className="text-[10px] text-slate-400 font-bold text-center select-none mb-3 tracking-wide font-sans">
                សូមថតវិក្កយបត្រទុកដើម្បីផ្ទៀងផ្ទាត់
              </p>

              {/* Buttons: Return to Home + Download Receipt */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  href="/"
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md uppercase tracking-wider flex items-center justify-center space-x-2 transition-all active:scale-[0.99] min-h-[44px]"
                >
                  <Home className="h-4 w-4" />
                  <span>Return to Home / ត្រឡប់ទៅដើម</span>
                </Link>
                <button
                  onClick={handleDownloadReceipt}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs border border-slate-700 shadow-md uppercase tracking-wider flex items-center justify-center space-x-2 transition-all active:scale-[0.99] min-h-[44px]"
                >
                  <Download className="h-4 w-4" />
                  <span>Receipt</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
