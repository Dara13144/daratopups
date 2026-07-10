'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { fetchOrderHistory } from '../../lib/api';
import { History, Calendar, AlertCircle, ShoppingBag, Eye, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'SUCCESS':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'PROCESSING':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'FAILED':
      default:
        return 'bg-red-500/10 text-red-400 border-red-500/20';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'text-emerald-400';
      case 'UNPAID':
        return 'text-amber-400';
      case 'EXPIRED':
      default:
        return 'text-red-400';
    }
  };

  return (
    <>
      <Header />
      
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center space-x-2.5 mb-8">
          <div className="bg-cyan-500/10 p-2 rounded-xl text-cyan-400">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Order History</h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Review history of orders placed for <span className="text-slate-200">{userEmail}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start space-x-2 bg-red-950/20 border border-red-900/30 rounded-xl p-4 mb-8 text-red-300 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-panel h-20 animate-pulse bg-slate-900/40 border-slate-900 rounded-xl"></div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 glass-panel bg-slate-950/20 border-slate-900 rounded-2xl">
            <ShoppingBag className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-1">No orders found</h3>
            <p className="text-slate-400 text-sm mb-4">You have not purchased any packages yet.</p>
            <Link
              href="/"
              className="inline-flex items-center space-x-1 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white text-xs font-bold shadow-md shadow-cyan-900/30 glow-btn"
            >
              Browse Games
            </Link>
          </div>
        ) : (
          <div className="glass-panel overflow-hidden border-slate-900 rounded-2xl bg-slate-950/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-950/60 text-slate-400 text-xs font-semibold tracking-wider">
                    <th className="p-4">Game & Package</th>
                    <th className="p-4">Player Details</th>
                    <th className="p-4">Transaction ID</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Order Status</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-sm">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-900/10 transition-colors">
                      {/* Product Details */}
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 border border-slate-800">
                            <ShoppingBag className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <div className="text-white font-bold">{order.package.product.name}</div>
                            <div className="text-slate-400 text-xs">{order.package.name}</div>
                          </div>
                        </div>
                      </td>

                      {/* Player ID details */}
                      <td className="p-4">
                        <div className="text-slate-200 font-semibold">{order.playerNickname || 'N/A'}</div>
                        <div className="text-slate-400 text-xs">
                          ID: {order.playerId} {order.playerZoneId ? `(${order.playerZoneId})` : ''}
                        </div>
                      </td>

                      {/* Transaction ID */}
                      <td className="p-4">
                        <code className="text-cyan-400 text-xs font-mono">{order.paymentTxnId}</code>
                        <div className="text-[10px] text-slate-500 flex items-center mt-0.5">
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
                      <td className="p-4 text-white font-bold">${order.price.toFixed(2)}</td>

                      {/* Status Badges */}
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        
                        {/* Delivered voucher codes */}
                        {(order.status === 'COMPLETED' || order.status === 'SUCCESS') && order.stockDeliveredCode && (
                          <div className="mt-1 text-[10px] text-emerald-400">
                            Code: <code className="bg-slate-900 px-1 py-0.5 rounded border border-slate-800 font-mono text-white select-all">{order.stockDeliveredCode}</code>
                          </div>
                        )}
                      </td>

                      {/* Payment */}
                      <td className="p-4 text-xs">
                        <div className="flex items-center space-x-1">
                          <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-300 font-medium">{order.paymentMethod}</span>
                        </div>
                        <span className={`text-[10px] font-bold ${getPaymentStatusColor(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                      </td>

                      {/* Action trigger links */}
                      <td className="p-4 text-center">
                        <Link
                          href={`/orders/${order.paymentTxnId}`}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-cyan-950/20 hover:border-cyan-900 text-slate-400 hover:text-cyan-400 transition-all"
                          title="View Invoice & Pay"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
