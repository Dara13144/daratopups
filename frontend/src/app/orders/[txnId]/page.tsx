'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { getOrderStatus, simulatePaymentCallback, verifyPayment, OrderStatusDetails, API_BASE } from '../../../lib/api';
import { CheckCircle2, XCircle, Clock, CreditCard, Copy, Check, Info, Sparkles, QrCode, X, Download, ChevronLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '../../../lib/LanguageContext';

export default function CheckoutPage({ params }: { params: Promise<{ txnId: string }> }) {
  const router = useRouter();
  const [txnId, setTxnId] = useState('');
  const [order, setOrder] = useState<OrderStatusDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'checking' | 'not_paid' | 'paid'>('idle');
  const { t } = useLanguage();

  // Polling ref/timer
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    params.then((p) => setTxnId(p.txnId));
  }, [params]);

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

  // Manual verify button handler
  const handleManualVerify = async () => {
    if (verifyStatus === 'checking' || !order) return;
    setVerifyStatus('checking');
    try {
      const res = await verifyPayment(order.paymentTxnId);
      if (res && res.verified) {
        setVerifyStatus('paid');
        await fetchStatus(false);
      } else {
        setVerifyStatus('not_paid');
        await fetchStatus(false);
        setTimeout(() => {
          setVerifyStatus((prev) => (prev === 'not_paid' ? 'idle' : prev));
        }, 4000);
      }
    } catch (e) {
      await fetchStatus(false);
      setVerifyStatus('not_paid');
      setTimeout(() => {
        setVerifyStatus((prev) => (prev === 'not_paid' ? 'idle' : prev));
      }, 4000);
    }
  };

  useEffect(() => {
    if (!txnId) return;

    fetchStatus(true);

    pollingRef.current = setInterval(() => {
      fetchStatus(false);
    }, 3000);

    return () => {
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
    ctx.fillText('ROBBY-TOPUP', 350, 50);

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

    const rows = [
      ['Product:', `${order.gameName} - ${order.packageName}`],
      ['User ID:', order.playerId],
      ['Nickname:', order.playerNickname || 'Verified Account'],
      ['Payment:', order.paymentMethod || 'KHQR'],
      ['Price:', `${order.price.toFixed(2)} USD`],
      ['Transaction ID:', order.paymentTxnId],
      ['Date:', new Date(order.createdAt).toLocaleString()],
    ];

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
    ctx.fillText('Thank you for choosing ROBBY-TOPUP Cambodia!', 250, 620);
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
          <div className="glass-panel p-6 sm:p-8 text-center bg-white border-slate-200 shadow-sm rounded-2xl sm:rounded-3xl">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-slate-900 font-extrabold text-lg mb-2">{t.invoiceNotFound}</h3>
            <p className="text-slate-500 text-xs sm:text-sm mb-6">{error}</p>
            <Link
              href="/"
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all min-h-[44px]"
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

  const isKhqr = order.paymentMethod === 'BAKONG' || order.paymentMethod === 'CANADIA';

  return (
    <>
      <Header />
      
      <main className="flex-grow max-w-4xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-4 sm:py-10 pb-24 md:pb-12 overflow-x-hidden">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-8">
          
          {/* Column 1: Payment Portal (QR scan or Card info) */}
          <div className="md:col-span-3 space-y-4 sm:space-y-6">
            
            {order.status === 'PENDING' && (
              <div className="glass-panel p-3.5 sm:p-6 bg-white border-slate-200 shadow-sm text-center rounded-2xl sm:rounded-3xl">
                
                {isKhqr ? (
                  /* KHQR SCAN FLOW (Bakong / Canadia / ABA) */
                  <div className="flex flex-col items-center">
                    
                    {/* Header Bar: Back Chevron + ABA KHQR Title + Animated Circular Countdown */}
                    <div className="flex items-center justify-between w-full max-w-[304px] min-[360px]:max-w-[324px] mb-3 sm:mb-4 text-slate-800 px-1">
                      <div className="flex items-center space-x-2 font-bold text-sm">
                        <Link href="/" className="p-2 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center">
                          <ChevronLeft className="h-4 w-4" />
                        </Link>
                        <span className="font-extrabold text-sm sm:text-base tracking-wide text-slate-900 truncate">
                          {order.paymentMethod === 'CANADIA' ? 'CANADIA KHQR' : 'ABA KHQR'}
                        </span>
                      </div>
                      
                      {/* Circular Countdown Timer */}
                      <div className="flex items-center space-x-1.5 sm:space-x-2 font-mono text-[11px] sm:text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-inner shrink-0">
                        <div className="relative w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-slate-200"
                              strokeWidth="4"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="text-cyan-600 transition-all duration-1000 ease-linear"
                              strokeDasharray="100, 100"
                              strokeDashoffset={100 - ((timeLeft || 0) / 900) * 100}
                              strokeWidth="4"
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                        </div>
                        <span className="font-extrabold text-cyan-600">{formatTime(timeLeft || 0)}</span>
                      </div>
                    </div>

                    {/* Official KHQR Ticket Card Container */}
                    <div className="w-full max-w-[304px] min-[360px]:max-w-[324px] bg-white rounded-2xl sm:rounded-[24px] overflow-hidden shadow-xl sm:shadow-2xl border border-slate-200 flex flex-col text-slate-800 animate-in fade-in duration-200">
                      
                      {/* Red KHQR Header Banner */}
                      <div className="bg-[#E51821] py-3 sm:py-3.5 px-4 sm:px-6 flex items-center justify-between relative text-white rounded-t-2xl sm:rounded-t-[24px]">
                        <span className="font-black tracking-widest text-lg sm:text-xl font-sans select-none drop-shadow-xs">
                          KHQR
                        </span>
                        <span className="text-[10px] font-extrabold tracking-wider bg-white/20 px-2 py-0.5 rounded uppercase font-sans">
                          ABA
                        </span>
                      </div>

                      {/* Merchant Name & Total Amount */}
                      <div className="text-center pt-4 sm:pt-5 px-4 sm:px-6 space-y-0.5">
                        <span className="block text-[11px] sm:text-xs text-slate-400 font-extrabold tracking-wider uppercase font-sans select-none">
                          MAO DARA
                        </span>
                        <span className="block text-slate-900 font-black text-xl sm:text-2xl tracking-tight font-sans">
                          {order.price.toFixed(2)} <span className="text-xs sm:text-sm font-bold text-slate-500">USD</span>
                        </span>
                      </div>

                      {/* Dashed Separator Line */}
                      <div className="px-4 sm:px-6 py-1.5 sm:py-2">
                        <div className="border-b-2 border-dashed border-slate-200 w-full"></div>
                      </div>

                      {/* QR Code Canvas */}
                      <div className="px-4 sm:px-6 py-2 flex justify-center">
                        <div className="relative p-2.5 sm:p-3 bg-white rounded-xl sm:rounded-2xl border border-slate-100 flex items-center justify-center shadow-xs">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=4&data=${encodeURIComponent(order.paymentQrCode || order.paymentTxnId)}`}
                            alt="KHQR Code"
                            className="w-40 h-40 min-[360px]:w-48 min-[360px]:h-48 rounded-lg object-contain"
                          />
                          {/* Floating central black circle with white $ sign */}
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-slate-950 flex items-center justify-center shadow-xl border-2 border-white select-none font-sans">
                            <span className="text-white font-black text-sm sm:text-base font-sans">$</span>
                          </div>
                        </div>
                      </div>

                      {/* Scanning Instructions inside card */}
                      <p className="text-slate-400 text-[10px] sm:text-[11px] px-4 sm:px-6 text-center leading-tight py-2.5 sm:py-3 font-medium font-sans border-t border-slate-100 mt-1">
                        Scan with mobile banking app<br/>that supports KHQR
                      </p>
                    </div>

                    {/* Quick Manual Refresh & Verification */}
                    <div className="w-full max-w-[304px] min-[360px]:max-w-[324px] mt-3 space-y-2">
                      <button
                        type="button"
                        onClick={handleManualVerify}
                        disabled={verifyStatus === 'checking'}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 min-h-[44px]"
                      >
                        <RefreshCw className={`h-4 w-4 text-cyan-600 ${verifyStatus === 'checking' ? 'animate-spin' : ''}`} />
                        <span>{verifyStatus === 'checking' ? 'Checking Payment...' : 'I Have Paid — Verify Now'}</span>
                      </button>

                      {verifyStatus === 'not_paid' && (
                        <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 text-center font-medium">
                          Payment not yet detected by bank. Please scan the KHQR and try again.
                        </div>
                      )}
                    </div>

                  </div>
                ) : (
                  /* ABA PAYWAY CARD FLOW */
                  <div className="flex flex-col items-center py-4 sm:py-6">
                    <span className="inline-flex items-center space-x-1 text-[10px] font-bold tracking-wider text-cyan-700 uppercase bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200 mb-4 sm:mb-6">
                      <CreditCard className="h-3.5 w-3.5 text-cyan-600" />
                      <span>ABA PayWay Checkout Portal</span>
                    </span>

                    <div className="bg-slate-50 border border-slate-200 p-4 sm:p-6 rounded-2xl max-w-sm w-full text-left space-y-3 mb-6">
                      <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
                        <span className="text-slate-500 text-xs font-semibold">ABA Merchant ID</span>
                        <span className="text-slate-900 font-bold text-xs">{order.abaPayload?.merchant_id || 'MOCK_MERCHANT_ID'}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
                        <span className="text-slate-500 text-xs font-semibold">Reference Transaction</span>
                        <span className="text-cyan-600 font-mono font-bold text-xs select-all truncate max-w-[140px]">{order.paymentTxnId}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-xs font-semibold">Billing currency</span>
                        <span className="text-slate-900 font-bold text-xs">USD ($)</span>
                      </div>
                    </div>

                    {order.abaPayload && order.abaApiUrl ? (
                      <form action={order.abaApiUrl} method="POST" className="w-full max-w-sm px-4">
                        {Object.entries(order.abaPayload).map(([key, val]: any) => (
                          <input key={key} type="hidden" name={key} value={val} />
                        ))}
                        <button
                          type="submit"
                          className="w-full py-3 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md text-center block uppercase tracking-wider min-h-[44px]"
                        >
                          Proceed to Pay
                        </button>
                      </form>
                    ) : (
                      <div className="text-center py-2">
                        <h4 className="text-slate-900 font-bold text-sm mb-1">Pay with ABA</h4>
                        <p className="text-slate-500 text-xs max-w-xs">
                          Redirecting to secure bank portal or payment verification hooks.
                        </p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* PAYMENT SUCCESS STATUS STATE */}
            {(order.status === 'COMPLETED' || order.status === 'SUCCESS' || order.status === 'PAID') && (
              <div className="glass-panel p-6 sm:p-8 bg-white border-emerald-300 text-center space-y-4 rounded-2xl sm:rounded-3xl shadow-sm">
                <div className="h-14 w-14 sm:h-16 sm:w-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                  <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">{t.paymentSuccessful}</h3>
                  <p className="text-slate-500 text-xs mt-1">
                    {t.directTopupSuccessDesc}
                  </p>
                </div>

                {order.stockDeliveredCode ? (
                  /* VOUCHER CARD REDEMPTION CODE DISPLAY */
                  <div className="bg-slate-50 border border-slate-200 p-4 sm:p-6 rounded-2xl max-w-sm w-full mx-auto text-center space-y-2">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold">{t.digitalVoucherCode}</span>
                    <div className="text-slate-900 font-mono font-black text-lg sm:text-xl bg-white px-4 py-2.5 rounded-lg border border-slate-200 select-all tracking-wide shadow-xs">
                      {order.stockDeliveredCode}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal pt-1">
                      {t.voucherNotice}
                    </p>
                  </div>
                ) : (
                  /* DIRECT TOPUP VERIFICATION NICKNAME DISPLAY */
                  <div className="bg-slate-50 border border-slate-200 p-3.5 sm:p-4 rounded-xl max-w-xs mx-auto text-xs space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t.recipientNickname}:</span>
                      <strong className="text-slate-900 font-bold">{order.playerNickname}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t.recipientPlayerId}:</span>
                      <strong className="text-slate-900 font-mono">{order.playerId}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t.deliveryStatus}:</span>
                      <span className="text-emerald-600 font-bold">{t.autoDelivered} ✅</span>
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
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center justify-center min-h-[44px]"
                  >
                    {t.buyMoreRecharge}
                  </Link>
                </div>
              </div>
            )}

            {/* PAYMENT FAILURE STATE */}
            {(order.status === 'FAILED' || order.status === 'CANCELLED') && (
              <div className="glass-panel p-6 sm:p-8 bg-white border-red-200 text-center space-y-4 rounded-2xl sm:rounded-3xl shadow-sm">
                <div className="h-14 w-14 sm:h-16 sm:w-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto">
                  <XCircle className="h-8 w-8 sm:h-10 sm:w-10" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">{t.paymentUnsuccessful}</h3>
                  <p className="text-slate-500 text-xs mt-1">
                    {t.expiredNotice}
                  </p>
                </div>
                
                <div className="pt-3 flex justify-center">
                  <Link
                    href="/"
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs min-h-[44px] flex items-center justify-center"
                  >
                    {t.browseGames}
                  </Link>
                </div>
              </div>
            )}

          </div>

          {/* Column 2: Order Invoice Details Sidebar */}
          <div className="md:col-span-2 space-y-4 sm:space-y-6">
            <div className="glass-panel p-4 sm:p-6 bg-white border-slate-200 shadow-sm space-y-4 sm:space-y-6 rounded-2xl sm:rounded-3xl">
              <div>
                <h4 className="text-slate-900 font-extrabold text-sm border-b border-slate-100 pb-2 mb-2.5">{t.orderInvoice}</h4>
                <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                  <Clock className="h-4 w-4 text-cyan-600 shrink-0" />
                  <span>{t.statusLabel}: </span>
                  <span className={`font-bold select-none capitalize ${
                    (order.status === 'COMPLETED' || order.status === 'SUCCESS' || order.status === 'PAID') ? 'text-emerald-600' : order.status === 'PENDING' ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Invoice details fields */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-500">{t.invoiceReference}:</span>
                  <div className="flex items-center space-x-1">
                    <code className="text-slate-700 font-mono text-[11px] truncate max-w-[130px]" title={order.paymentTxnId}>
                      {order.paymentTxnId}
                    </code>
                    <button
                      onClick={() => copyToClipboard(order.paymentTxnId)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700"
                      title="Copy transaction ID"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">{t.selectedProduct}:</span>
                  <span className="text-slate-900 font-bold text-right truncate max-w-[160px]">{order.gameName}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">{t.packageItem}:</span>
                  <span className="text-slate-900 font-bold text-right truncate max-w-[160px]">{order.packageName}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">{t.playerId}:</span>
                  <span className="text-slate-900 font-mono font-semibold text-right">{order.playerId}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">{t.paymentGateway}:</span>
                  <span className="text-slate-900 font-bold text-right">{order.paymentMethod}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">{t.paymentStatusLabel}:</span>
                  <span className={`font-bold text-right uppercase ${
                    order.paymentStatus === 'PAID' || order.paymentStatus === 'SUCCESS' ? 'text-emerald-600' : order.paymentStatus === 'PENDING' || order.paymentStatus === 'UNPAID' ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {order.paymentStatus}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between items-end">
                  <span className="text-slate-600 font-semibold">{t.totalPrice}:</span>
                  <span className="text-cyan-600 text-lg font-black">
                    ${order.price.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* PAYMENT SUCCESS OVERLAY MODAL */}
        {(order.status === 'COMPLETED' || order.status === 'SUCCESS' || order.status === 'PAID') && showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-[380px] sm:max-w-md max-h-[92vh] overflow-y-auto shadow-2xl relative border border-slate-200 flex flex-col p-4 sm:p-6 text-slate-800 animate-in fade-in zoom-in duration-200">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3 sm:mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 stroke-[2.5]" />
                  </div>
                  <span className="font-extrabold text-sm text-slate-900 tracking-tight font-sans">Payment Success</span>
                </div>
                <button 
                  onClick={() => setShowSuccessModal(false)} 
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-100 rounded-full"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tick Circle Block */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex flex-col items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 mb-2">
                  <CheckCircle2 className="h-7 w-7 stroke-[2.5]" />
                </div>
                <span className="text-emerald-800 font-bold text-sm sm:text-base text-center tracking-wide font-sans">
                  ការទិញរបស់អ្នកត្រូវបានជោគជ័យ
                </span>
              </div>

              {/* Details List */}
              <div className="space-y-1 mb-5">
                <div className="flex justify-between items-center py-2 border-b border-slate-100 text-xs">
                  <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase">Product</span>
                  <span className="text-slate-800 font-extrabold text-right truncate max-w-[190px]">
                    {order.gameName} - {order.packageName}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 text-xs">
                  <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase">USER ID</span>
                  <span className="text-slate-800 font-mono font-bold select-all">{order.playerId}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 text-xs">
                  <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase">NICKNAME</span>
                  <span className="text-slate-800 font-bold truncate max-w-[190px]">{order.playerNickname || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 text-xs">
                  <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase">PAYMENT</span>
                  <span className="text-slate-800 font-extrabold">{order.paymentMethod || 'KHQR'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 text-xs">
                  <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase">PRICE</span>
                  <span className="text-slate-900 font-black">{order.price.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 text-xs">
                  <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase">TRANSACTION ID</span>
                  <span className="text-slate-800 font-mono font-bold select-all text-[11px] truncate max-w-[160px]">{order.paymentTxnId}</span>
                </div>
              </div>

              {/* Note Label */}
              <p className="text-[10px] text-slate-500 font-bold text-center select-none mb-3 tracking-wide font-sans">
                សូមថតវិក្កយបត្រទុកដើម្បីផ្ទៀងផ្ទាត់
              </p>

              {/* Download Button */}
              <button
                onClick={handleDownloadReceipt}
                className="w-full py-3 rounded-xl bg-[#099268] hover:bg-[#087f5b] text-white font-extrabold text-xs shadow-md uppercase tracking-wider flex items-center justify-center space-x-2 transition-all active:scale-[0.99] min-h-[44px]"
              >
                <Download className="h-4 w-4" />
                <span>Download Receipt</span>
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
