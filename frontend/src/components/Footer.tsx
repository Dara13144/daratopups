import React from 'react';
import { ShieldCheck, Zap, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white/90 backdrop-blur-sm text-slate-600">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 border-b border-slate-200 pb-8 text-center md:text-left">
          {/* Feature 1 */}
          <div className="flex flex-col items-center md:items-start">
            <div className="h-12 w-auto mb-3 flex items-center justify-center">
              <img
                src="/images/instant-delivery.png"
                alt="Instant Delivery"
                className="h-10 w-auto object-contain rounded-lg shadow-md hover:scale-105 transition-all"
              />
            </div>
            <h3 className="text-slate-900 font-bold text-sm mb-1">Instant Delivery</h3>
            <p className="text-slate-500 text-xs max-w-xs">
              Automated system triggers direct game top-ups or voucher delivery immediately after payment is verified.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center md:items-start">
            <div className="h-12 w-auto mb-3 flex items-center justify-center">
              <img
                src="/images/secure-payment.png"
                alt="Secure Payment"
                className="h-10 w-auto object-contain rounded-lg shadow-md hover:scale-105 transition-all"
              />
            </div>
            <h3 className="text-slate-900 font-bold text-sm mb-1">Secure Payments</h3>
            <p className="text-slate-500 text-xs max-w-xs">
              Direct checkout integration with ABA PayWay and ABA KHQR. We do not store card or banking details.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center md:items-start">
            <div className="h-12 w-auto mb-3 flex items-center justify-center">
              <img
                src="/images/official-verified.png"
                alt="Official Verification"
                className="h-10 w-auto object-contain rounded-full shadow-md hover:scale-105 transition-all"
              />
            </div>
            <h3 className="text-slate-900 font-bold text-sm mb-1">Official Verification</h3>
            <p className="text-slate-500 text-xs max-w-xs">
              All transactions are auto-verified with bank gateways. Live status check screen with instant Telegram alerts.
            </p>
          </div>
        </div>

        {/* Footer Bottom info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} 𝙍𝙊𝘽𝘽𝙔-𝙏𝙊𝙋𝙐𝙋. All rights reserved.
          </p>
          <a
            href="https://t.me/darazzdev"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-900 border border-slate-800 hover:border-[#229ED9] text-slate-400 hover:text-[#229ED9] transition-all hover:scale-110 shadow-sm"
            title="Telegram Support"
          >
            <svg className="w-4 h-4 fill-current text-[#229ED9]" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.535-.197 1.006.128.832.946z"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
