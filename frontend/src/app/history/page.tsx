'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { fetchOrderHistory } from '../../lib/api';
import { History, Calendar, AlertCircle, ShoppingBag, Eye, Copy, Check, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('user_email');
    
    if (!token || !email) {
      router.push('/login');
      return;
    }

    setUserEmail(email);

    fetchOrderHistory(email)
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to fetch order history from server.');
        setLoading(false);
      });
  }, [router]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'SUCCESS':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30';
      case 'PENDING':
        return 'bg-amber-950/60 text-amber-400 border-amber-500/30';
      case 'PROCESSING':
        return 'bg-cyan-950/60 text-cyan-400 border-cyan-500/30';
      case 'FAILED':
      default:
        return 'bg-red-950/60 text-red-400 border-red-500/30';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'text-emerald-400 font-bold';
      case 'UNPAID':
        return 'text-amber-400 font-bold';
      case 'EXPIRED':
      default:
        return 'text-red-400 font-bold';
    }
  };

  return (
    <>
      <Header />
      
      <main className="flex-grow max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-10 pb-24 md:pb-12 overflow-x-hidden">
        {/* Header Title */}
        <div className="flex items-center space-x-3 mb-6 sm:mb-8">
          <div className="bg-cyan-500/10 p-2.5 rounded-2xl text-cyan-400 border border-cyan-500/20 shrink-0">
            <History className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">Order History</h1>
            <p className="text-slate-400 text-xs mt-0.5 truncate">
              Orders placed for <strong className="text-slate-200">{userEmail}</strong>
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start space-x-2 bg-red-950/60 border border-red-500/30 rounded-2xl p-4 mb-6 text-red-400 text-xs sm:text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-panel h-20 sm:h-24 animate-pulse bg-slate-900/60 border-slate-800 rounded-2xl"></div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 sm:py-16 glass-panel bg-slate-900/90 border-slate-800 rounded-3xl p-6 shadow-xl">
            <ShoppingBag className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-white font-bold text-base sm:text-lg mb-1">No orders found</h3>
            <p className="text-slate-400 text-xs sm:text-sm mb-5">You have not purchased any top-up packages yet.</p>
            <Link
              href="/"
              className="inline-flex items-center space-x-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white text-xs font-bold shadow-md min-h-[44px]"
            >
              Browse Games
            </Link>
          </div>
        ) : (
          <>
            {/* ══ MOBILE CARD VIEW (< md screens) ══════════════════════════ */}
            <div className="md:hidden space-y-3">
              {orders.map((order) => (
                <div 
                  key={`mobile-${order.id}`}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-md flex flex-col space-y-3"
                >
                  {/* Top Row: Game Name, Package, and Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-sm text-white truncate">
                        {order.package?.product?.name || 'Top-up Package'}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                        {order.package?.name}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-black rounded-full border shrink-0 ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Middle Row: Price, Date, and Player ID */}
                  <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Player ID:</span>
                      <span className="font-mono font-bold text-slate-200">
                        {order.playerId} {order.playerZoneId ? `(${order.playerZoneId})` : ''}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Payment:</span>
                      <span className="font-bold text-slate-200">{order.paymentMethod} • <span className={getPaymentStatusColor(order.paymentStatus)}>{order.paymentStatus}</span></span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-700">
                      <span className="text-slate-400 font-semibold text-[11px]">Total Price:</span>
                      <span className="font-black text-cyan-400 text-sm">${order.price.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Delivered Digital Code (if applicable) */}
                  {(order.status === 'COMPLETED' || order.status === 'SUCCESS') && order.stockDeliveredCode && (
                    <div className="bg-emerald-950/50 border border-emerald-500/30 rounded-xl p-2.5 text-xs">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">Delivered Code:</span>
                      <code className="font-mono font-bold text-white bg-slate-900 px-2 py-1 rounded border border-emerald-500/30 select-all block text-center">
                        {order.stockDeliveredCode}
                      </code>
                    </div>
                  )}

                  {/* Bottom Row: Txn ID and Action Link */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <span className="text-slate-400 text-[10px]">TXN:</span>
                      <code className="text-cyan-300 font-mono text-[11px] truncate max-w-[120px]">
                        {order.paymentTxnId}
                      </code>
                      <button
                        onClick={() => copyToClipboard(order.paymentTxnId)}
                        className="p-1 text-slate-400 hover:text-slate-200"
                        title="Copy Txn ID"
                      >
                        {copiedId === order.paymentTxnId ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    <Link
                      href={`/orders/${order.paymentTxnId}`}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] border border-slate-700 transition-colors shrink-0 min-h-[36px]"
                    >
                      <span>Invoice</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* ══ DESKTOP TABLE VIEW (>= md screens) ═════════════════════════ */}
            <div className="hidden md:block glass-panel overflow-hidden border-slate-800 rounded-2xl bg-slate-900/90 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs font-bold tracking-wider">
                      <th className="p-4">Game & Package</th>
                      <th className="p-4">Player Details</th>
                      <th className="p-4">Transaction ID</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-sm">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* Product Details */}
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-9 w-9 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 border border-slate-700 shrink-0">
                              <ShoppingBag className="h-4.5 w-4.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-white font-bold text-xs truncate max-w-[160px]">{order.package?.product?.name}</div>
                              <div className="text-slate-400 text-[11px] truncate max-w-[160px]">{order.package?.name}</div>
                            </div>
                          </div>
                        </td>

                        {/* Player ID details */}
                        <td className="p-4">
                          <div className="text-slate-200 font-bold text-xs">{order.playerNickname || 'N/A'}</div>
                          <div className="text-slate-400 text-[11px] font-mono">
                            ID: {order.playerId} {order.playerZoneId ? `(${order.playerZoneId})` : ''}
                          </div>
                        </td>

                        {/* Transaction ID */}
                        <td className="p-4">
                          <div className="flex items-center space-x-1">
                            <code className="text-cyan-300 text-xs font-mono truncate max-w-[130px]">{order.paymentTxnId}</code>
                            <button
                              onClick={() => copyToClipboard(order.paymentTxnId)}
                              className="p-0.5 text-slate-400 hover:text-slate-200"
                            >
                              {copiedId === order.paymentTxnId ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center mt-0.5">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(order.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>

                        {/* Price */}
                        <td className="p-4 text-cyan-400 font-black text-sm">${order.price.toFixed(2)}</td>

                        {/* Status Badges */}
                        <td className="p-4">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full border ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          
                          {(order.status === 'COMPLETED' || order.status === 'SUCCESS') && order.stockDeliveredCode && (
                            <div className="mt-1 text-[10px] text-emerald-400">
                              Code: <code className="bg-slate-900 px-1 py-0.5 rounded border border-emerald-500/30 font-mono text-white select-all">{order.stockDeliveredCode}</code>
                            </div>
                          )}
                        </td>

                        {/* Payment */}
                        <td className="p-4 text-xs font-semibold">
                          <div className="text-slate-200 font-bold">{order.paymentMethod}</div>
                          <div className={`text-[11px] ${getPaymentStatusColor(order.paymentStatus)}`}>
                            {order.paymentStatus}
                          </div>
                        </td>

                        {/* Action View */}
                        <td className="p-4 text-center">
                          <Link
                            href={`/orders/${order.paymentTxnId}`}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Invoice</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </>
  );
}
