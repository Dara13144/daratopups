import React from 'react';
import { ShieldCheck, Zap, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-900 bg-slate-950/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 border-b border-slate-900 pb-8 text-center md:text-left">
          {/* Feature 1 */}
          <div className="flex flex-col items-center md:items-start">
            <div className="bg-cyan-500/10 p-3 rounded-xl text-cyan-400 mb-3">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-white font-bold text-sm mb-1">Instant Delivery</h3>
            <p className="text-slate-400 text-xs max-w-xs">
              Automated system triggers direct game top-ups or voucher delivery immediately after payment is verified.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center md:items-start">
            <div className="bg-violet-500/10 p-3 rounded-xl text-violet-400 mb-3">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-white font-bold text-sm mb-1">Secure Payments</h3>
            <p className="text-slate-400 text-xs max-w-xs">
              Direct checkout integration with ABA PayWay and Bakong KHQR. We do not store card or banking details.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center md:items-start">
            <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400 mb-3">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-white font-bold text-sm mb-1">Official Verification</h3>
            <p className="text-slate-400 text-xs max-w-xs">
              All transactions are auto-verified with bank gateways. Live status check screen with instant Telegram alerts.
            </p>
          </div>
        </div>

        {/* Footer Bottom info */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} 𝘿𝘼𝙍𝘼-𝙏𝙊𝙋𝙐𝙋. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
