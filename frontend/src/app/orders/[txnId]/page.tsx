'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { getOrderStatus, simulatePaymentCallback, verifyPayment, OrderStatusDetails } from '../../../lib/api';
import { CheckCircle2, XCircle, Clock, CreditCard, Copy, Check, Info, Sparkles, QrCode, X, Download } from 'lucide-react';
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
      console.error(err);
      setError('Failed to retrieve checkout order details.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Manual verify button handler
  const handleManualVerify = async () => {
    if (verifyStatus === 'checking') return;
    setVerifyStatus('checking');
    try {
      await fetchStatus(false);
      setVerifyStatus('idle');
    } catch (e) {
      setVerifyStatus('idle');
    }
  };

  useEffect(() => {
    if (!txnId) return;

    // First fetch
    fetchStatus(true);

    // Setup polling every 3 seconds for status
    pollingRef.current = setInterval(() => {
      fetchStatus(false);
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [txnId]);

  // Countdown Timer hook
  useEffect(() => {
    if (!order || order.status !== 'PENDING') {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const createdAt = new Date(order.createdAt).getTime();
      const now = Date.now();
      const elapsedSecs = Math.floor((now - createdAt) / 1000);
      const validitySecs = 15; // 15 seconds
      const remaining = validitySecs - elapsedSecs;
      return remaining > 0 ? remaining : 0;
    };

    setTimeLeft(calculateTimeLeft());

    const intervalId = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(intervalId);
        // Refresh status
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
      // Re-fetch instantly
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

    // Green success check circle
    ctx.fillStyle = '#ecfdf5';
    ctx.beginPath();
    ctx.arc(250, 160, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(250, 160, 40, 0, Math.PI * 2);
    ctx.stroke();

    // Checkmark inside circle
    ctx.beginPath();
    ctx.moveTo(235, 160);
    ctx.lineTo(245, 170);
    ctx.lineTo(270, 145);
    ctx.stroke();

    // Khmer success text
    ctx.fillStyle = '#065f46';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ការទិញរបស់អ្នកត្រូវបានជោគជ័យ', 250, 230);

    // Table parameters
    const startY = 270;
    const rowHeight = 45;
    const rows = [
      { label: 'PRODUCT', value: `${order.gameName} - ${order.packageName}` },
      { label: 'USER ID', value: order.playerId },
      { label: 'NICKNAME', value: order.playerNickname || 'N/A' },
      { label: 'PAYMENT', value: order.paymentMethod || 'KHQR' },
      { label: 'PRICE', value: `${order.price.toFixed(2)} USD` },
      { label: 'TRANSACTION ID', value: order.paymentTxnId || '' },
    ];

    rows.forEach((row, i) => {
      const y = startY + i * rowHeight;
      
      // Bottom border for each row
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(40, y + 15);
      ctx.lineTo(460, y + 15);
      ctx.stroke();

      // Label text
      ctx.textAlign = 'left';
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(row.label, 40, y);

      // Value text
      ctx.textAlign = 'right';
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(row.value, 460, y);
    });

    // Khmer note at bottom
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('សូមថតវិក្កយបត្រទុកដើម្បីផ្ទៀងផ្ទាត់', 250, 580);

    // Trigger PNG download
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
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="h-10 w-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 text-sm">Initializing checkout gateway...</p>
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
          <div className="glass-panel p-8 text-center bg-slate-950 border-slate-900">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-white font-extrabold text-lg mb-2">{t.invoiceNotFound}</h3>
            <p className="text-slate-400 text-sm mb-6">{error}</p>
            <Link
              href="/"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all"
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

  // Render QR image using qrserver public QR generator API
  // If payment method is BAKONG or CANADIA, we show the QR code.
  const isKhqr = order.paymentMethod === 'BAKONG' || order.paymentMethod === 'CANADIA';

  return (
    <>
      <Header />
      
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          
          {/* Column 1: Payment Portal (QR scan or Card info) */}
          <div className="md:col-span-3 space-y-6">
            
            {order.status === 'PENDING' && (
              <div className="glass-panel p-6 bg-slate-950/40 border-slate-900 text-center">
                
                {isKhqr ? (
                  /* KHQR SCAN FLOW (Bakong / Canadia) */
                  <div className="flex flex-col items-center">
                    <span className="inline-flex items-center space-x-1.5 text-[10px] font-extrabold tracking-wider text-purple-400 uppercase bg-[#251c3d] border border-purple-500/20 px-3.5 py-1.5 rounded-full shadow-sm mb-4 select-none">
                      <QrCode className="h-3.5 w-3.5" />
                      <span>{order.paymentMethod === 'CANADIA' ? t.canadiaTitle : 'ស្កេនទូទាត់ បាគង/KHQR'}</span>
                    </span>

                    {/* Official KHQR Ticket Card Container */}
                    <div className="w-full max-w-[300px] bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 mb-6 flex flex-col text-slate-800 animate-in fade-in duration-200">
                      {/* Red KHQR Header */}
                      <div className="bg-[#E51821] py-4 px-6 flex items-center justify-center relative text-white">
                        <span className="font-extrabold tracking-widest text-lg font-sans select-none">
                          PAYMENT
                        </span>
                      </div>

                      {/* Total Amount Panel */}
                      <div className="text-center pt-6 px-6">
                        <span className="block text-[10px] text-slate-400 font-extrabold tracking-wider uppercase select-none">
                          Total Amount
                        </span>
                        <span className="block text-slate-800 font-black text-2xl tracking-wide mt-1">
                          $ {order.price.toFixed(2)}
                        </span>
                      </div>

                      {/* QR Code Canvas */}
                      <div className="px-6 py-4 flex justify-center">
                        <div className="relative p-2.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center shadow-inner">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(order.paymentQrCode || order.paymentTxnId)}`}
                            alt="KHQR Code"
                            className="w-44 h-44 rounded-lg"
                          />
                          {/* Floating central black circle with white $ sign */}
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-slate-950 flex items-center justify-center shadow-lg border border-slate-800 select-none font-sans">
                            <span className="text-[#03c39a] font-extrabold text-sm font-sans">$</span>
                          </div>
                        </div>
                      </div>

                      {/* Scanning Instructions inside card */}
                      <p className="text-slate-500 text-[10px] px-6 text-center leading-normal mb-5 select-none font-medium font-sans">
                        Scan with ABA Mobile or any app supporting KHQR to complete payment.
                      </p>

                      {/* Status indicators — Real-time MD5 check */}
                      <div className="px-6 pb-6 text-center space-y-2">
                        <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-[11px] font-extrabold select-none shadow-sm mx-auto animate-pulse">
                          <span className="h-3 w-3 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin"></span>
                          <span>Waiting for payment...</span>
                        </div>
                        {timeLeft !== null && timeLeft > 0 && (
                          <div className="text-slate-500 font-bold text-xs mt-1.5 font-sans select-none">
                            Code expires in: <span className="text-red-500 font-black">{formatTime(timeLeft)}</span>
                          </div>
                        )}
                        {/* Live check indicator */}
                        <div className="flex items-center justify-center space-x-1.5 text-[10px] text-slate-400 font-medium select-none">
                          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
                          <span>Gateway live check active</span>
                        </div>

                        {/* Manual Verify Payment Button */}
                        <div className="pt-2">
                          <button
                            id="verify-payment-btn"
                            onClick={handleManualVerify}
                            disabled={verifyStatus === 'checking'}
                            className={`w-full py-2.5 rounded-xl font-extrabold text-xs tracking-wide uppercase transition-all shadow-sm flex items-center justify-center space-x-2 ${
                              verifyStatus === 'checking'
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : verifyStatus === 'paid'
                                ? 'bg-emerald-500 text-white'
                                : verifyStatus === 'not_paid'
                                ? 'bg-red-500/90 text-white hover:bg-red-600'
                                : 'bg-[#E51821] text-white hover:bg-[#c01019] active:scale-[0.98]'
                            }`}
                          >
                            {verifyStatus === 'checking' && (
                              <span className="h-3.5 w-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                            )}
                            {verifyStatus === 'paid' && <CheckCircle2 className="h-3.5 w-3.5" />}
                            {verifyStatus === 'not_paid' && <XCircle className="h-3.5 w-3.5" />}
                            <span>
                              {verifyStatus === 'checking' ? 'Verifying...' :
                               verifyStatus === 'paid' ? 'Payment Confirmed ✅' :
                               verifyStatus === 'not_paid' ? 'Not Paid Yet — Try Again' :
                               'Verify My Payment'}
                            </span>
                          </button>
                          {verifyStatus === 'not_paid' && (
                            <p className="text-red-400 text-[10px] font-semibold mt-1.5 text-center select-none">
                              ⚠️ Payment not detected. Please scan and pay first, then tap Verify.
                            </p>
                          )}
                        </div>

                      </div>

                    </div>


                  </div>

                ) : (
                  /* ABA PAYWAY CARD FLOW */
                  <div className="flex flex-col items-center py-6">
                    <span className="inline-flex items-center space-x-1 text-[10px] font-bold tracking-wider text-cyan-400 uppercase bg-cyan-950/50 px-2.5 py-1 rounded-full border border-cyan-500/20 mb-6">
                      <CreditCard className="h-3 w-3" />
                      <span>ABA PayWay Checkout Portal</span>
                    </span>

                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl max-w-sm w-full text-left space-y-4 mb-6">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-855">
                        <span className="text-slate-400 text-xs font-semibold">ABA Merchant ID</span>
                        <span className="text-white font-bold text-xs">{order.abaPayload?.merchant_id || 'MOCK_MERCHANT_ID'}</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-slate-855">
                        <span className="text-slate-400 text-xs font-semibold">Reference Transaction</span>
                        <span className="text-cyan-400 font-mono font-bold text-xs select-all">{order.paymentTxnId}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-xs font-semibold">Billing currency</span>
                        <span className="text-white font-bold text-xs">USD ($)</span>
                      </div>
                    </div>

                    {order.abaPayload && order.abaApiUrl ? (
                      <form action={order.abaApiUrl} method="POST" className="w-full max-w-sm px-6">
                        {Object.entries(order.abaPayload).map(([key, val]: any) => (
                          <input key={key} type="hidden" name={key} value={val} />
                        ))}
                        <button
                          type="submit"
                          className="w-full py-3 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-sm transition-all shadow-md text-center block uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98]"
                        >
                          Proceed to Pay
                        </button>
                      </form>
                    ) : (
                      <div className="text-center py-2">
                        <h4 className="text-white font-bold text-sm mb-1">Pay with ABA</h4>
                        <p className="text-slate-400 text-xs max-w-xs">
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
              <div className="glass-panel p-8 bg-slate-950/40 border-emerald-500/20 text-center space-y-4">
                <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">{t.paymentSuccessful}</h3>
                  <p className="text-slate-400 text-xs mt-1">
                    {t.directTopupSuccessDesc}
                  </p>
                </div>

                {order.stockDeliveredCode ? (
                  /* VOUCHER CARD REDEMPTION CODE DISPLAY */
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-sm w-full mx-auto text-center space-y-2.5">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold">{t.digitalVoucherCode}</span>
                    <div className="text-white font-mono font-black text-xl bg-slate-950 px-4 py-2.5 rounded-lg border border-slate-850 select-all tracking-wide">
                      {order.stockDeliveredCode}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal pt-1">
                      {t.voucherNotice}
                    </p>
                  </div>
                ) : (
                  /* DIRECT TOPUP VERIFICATION NICKNAME DISPLAY */
                  <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl max-w-xs mx-auto text-xs space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t.recipientNickname}:</span>
                      <strong className="text-white font-bold">{order.playerNickname}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t.recipientPlayerId}:</span>
                      <strong className="text-white font-mono">{order.playerId}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t.deliveryStatus}:</span>
                      <span className="text-emerald-400 font-bold">{t.autoDelivered} ✅</span>
                    </div>
                  </div>
                )}
                
                <div className="pt-4 flex gap-4 justify-center">
                  <Link
                    href="/"
                    className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white font-bold text-xs shadow-md glow-btn"
                  >
                    {t.buyMoreRecharge}
                  </Link>
                  <Link
                    href="/history"
                    className="px-5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs"
                  >
                    {t.viewPurchaseHistory}
                  </Link>
                </div>
              </div>
            )}

            {/* PAYMENT FAILURE STATE */}
            {(order.status === 'FAILED' || order.status === 'CANCELLED') && (
              <div className="glass-panel p-8 bg-slate-950/40 border-red-500/20 text-center space-y-4">
                <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-400 mx-auto">
                  <XCircle className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">{t.paymentUnsuccessful}</h3>
                  <p className="text-slate-400 text-xs mt-1">
                    {t.expiredNotice}
                  </p>
                </div>
                
                <div className="pt-4 flex gap-4 justify-center">
                  <Link
                    href="/"
                    className="px-5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs"
                  >
                    {t.browseGames}
                  </Link>
                </div>
              </div>
            )}

          </div>

          {/* Column 2: Order Invoice Details Sidebar */}
          <div className="md:col-span-2 space-y-6">
            <div className="glass-panel p-6 bg-slate-950/70 border-slate-900 space-y-6">
              <div>
                <h4 className="text-white font-extrabold text-sm border-b border-slate-900 pb-2 mb-3">{t.orderInvoice}</h4>
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <Clock className="h-4 w-4 text-cyan-400" />
                  <span>{t.statusLabel}: </span>
                  <span className={`font-bold select-none capitalize ${
                    (order.status === 'COMPLETED' || order.status === 'SUCCESS' || order.status === 'PAID') ? 'text-emerald-400' : order.status === 'PENDING' ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Invoice details fields */}
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-900">
                  <span className="text-slate-500">{t.invoiceReference}:</span>
                  <code className="text-slate-300 font-mono truncate max-w-[120px]" title={order.paymentTxnId}>
                    {order.paymentTxnId}
                  </code>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">{t.selectedProduct}:</span>
                  <span className="text-white font-bold text-right">{order.gameName}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">{t.packageItem}:</span>
                  <span className="text-white font-bold text-right">{order.packageName}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">{t.playerId}:</span>
                  <span className="text-white font-mono font-semibold text-right">{order.playerId}</span>
                </div>



                <div className="flex justify-between">
                  <span className="text-slate-500">{t.paymentGateway}:</span>
                  <span className="text-white font-bold text-right">{order.paymentMethod}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">{t.paymentStatusLabel}:</span>
                  <span className={`font-bold text-right uppercase ${
                    order.paymentStatus === 'PAID' || order.paymentStatus === 'SUCCESS' ? 'text-emerald-400' : order.paymentStatus === 'PENDING' || order.paymentStatus === 'UNPAID' ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {order.paymentStatus}
                  </span>
                </div>

                <div className="border-t border-slate-900 pt-3 flex justify-between items-end">
                  <span className="text-slate-400">{t.totalPrice}:</span>
                  <span className="text-cyan-400 text-lg font-black">
                    ${order.price.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Status information notice */}
              {order.status === 'PENDING' && (
                <div className="p-3 bg-slate-900/30 border border-slate-850 rounded-lg text-[10px] text-slate-500 flex items-start space-x-1.5 leading-normal">
                  <Info className="h-4.5 w-4.5 text-cyan-500 shrink-0 mt-0.5" />
                  <p>
                    {t.invoiceNotice}
                  </p>
                </div>
              )}

              {/* 100% Security Trust Badge */}
              {order.status === 'PENDING' && (
                <div className="p-3 bg-emerald-950/10 border border-emerald-500/20 rounded-xl flex items-center space-x-3 text-left">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-emerald-400 font-extrabold text-[11px] uppercase tracking-wider">សន្តិសុខសុវត្ថិភាព 100% / 100% Secure</h4>
                    <p className="text-slate-400 text-[10px] leading-tight mt-0.5">
                      ប្រព័ន្ធសុវត្ថិភាពខ្ពស់ និងការផ្ទៀងផ្ទាត់ការទូទាត់ស្វ័យប្រវត្តិតាមរយៈ Bakong KHQR dynamic check។
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* PAYMENT SUCCESS OVERLAY MODAL */}
        {(order.status === 'COMPLETED' || order.status === 'SUCCESS' || order.status === 'PAID') && showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative border border-slate-100 flex flex-col p-6 text-slate-800 animate-in fade-in zoom-in duration-200">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center shrink-0">
                    {(order.gameSlug || '').includes('free-fire') ? (
                      <img 
                        src="https://api.dicebear.com/7.x/adventurer/svg?seed=freefire" 
                        className="w-full h-full rounded-full object-cover" 
                        alt="" 
                      />
                    ) : (order.gameSlug || '').includes('mobile-legends') ? (
                      <img 
                        src="https://api.dicebear.com/7.x/adventurer/svg?seed=mlbb" 
                        className="w-full h-full rounded-full object-cover" 
                        alt="" 
                      />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 stroke-[2.5]" />
                    )}
                  </div>
                  <span className="font-extrabold text-sm text-slate-900 tracking-tight font-sans">Payment Success</span>
                </div>
                <button 
                  onClick={() => setShowSuccessModal(false)} 
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-50 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tick Circle Block */}
              <div className="bg-[#fcfdfd] border border-slate-100 rounded-2xl p-5 flex flex-col items-center mb-4">
                <div className="w-16 h-16 rounded-full bg-[#e6f4ea] flex items-center justify-center text-[#137333] mb-3">
                  <CheckCircle2 className="h-9 w-9 stroke-[2.5]" />
                </div>
                <span className="text-[#137333] font-bold text-base sm:text-lg text-center tracking-wide font-sans">
                  ការទិញរបស់អ្នកត្រូវបានជោគជ័យ
                </span>
              </div>

              {/* Details List */}
              <div className="space-y-0.5 mb-6">
                <div className="flex justify-between items-center py-2.5 border-b border-slate-100 text-xs">
                  <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase">Product</span>
                  <span className="text-slate-800 font-extrabold text-right">
                    {order.gameName} - {order.packageName}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-slate-100 text-xs">
                  <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase">USER ID</span>
                  <span className="text-slate-800 font-mono font-bold select-all">{order.playerId}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-slate-100 text-xs">
                  <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase">NICKNAME</span>
                  <span className="text-slate-800 font-bold">{order.playerNickname || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-slate-100 text-xs">
                  <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase">PAYMENT</span>
                  <span className="text-slate-800 font-extrabold">{order.paymentMethod || 'KHQR'}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-slate-100 text-xs">
                  <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase">PRICE</span>
                  <span className="text-slate-850 font-black">{order.price.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-slate-100 text-xs">
                  <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase">TRANSACTION ID</span>
                  <span className="text-slate-800 font-mono font-bold select-all">{order.paymentTxnId}</span>
                </div>
              </div>

              {/* Note Label */}
              <p className="text-[10px] text-slate-400 font-bold text-center select-none mb-4 tracking-wide font-sans">
                សូមថតវិក្កយបត្រទុកដើម្បីផ្ទៀងផ្ទាត់
              </p>

              {/* Download Button */}
              <button
                onClick={handleDownloadReceipt}
                className="w-full py-3 rounded-xl bg-[#099268] hover:bg-[#087f5b] text-white font-extrabold text-xs shadow-md uppercase tracking-wider flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
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
