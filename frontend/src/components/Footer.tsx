'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Send, X, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  return (
    <>
      <footer className="mt-auto border-t border-pink-900/40 bg-[#1a0818]/95 backdrop-blur-md text-slate-300 pb-28 md:pb-12 pt-10 sm:pt-14 select-none">
        <div className="max-w-4xl mx-auto px-4 text-center">
          
          {/* Main Brand Title */}
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black bg-gradient-to-r from-pink-400 via-rose-300 to-fuchsia-300 bg-clip-text text-transparent tracking-wider uppercase mb-2 sm:mb-3">
            NA-DY TOPUP
          </h2>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-pink-200/60 font-medium max-w-xl mx-auto mb-6 sm:mb-8 leading-relaxed">
            Fast delivery. Secure payment. Trusted top-up service for gamers worldwide.
          </p>

          {/* Social Media Circular Buttons */}
          <div className="flex items-center justify-center space-x-3 sm:space-x-4 mb-8">
            {/* Facebook */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-slate-900/90 border border-pink-900/40 hover:border-pink-400 hover:bg-pink-950/60 text-pink-200 hover:text-pink-400 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-md active:scale-95 cursor-pointer"
              title="Facebook"
              aria-label="Facebook"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>

            {/* Telegram */}
            <a
              href="https://t.me/darazzdev"
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-slate-900/90 border border-pink-900/40 hover:border-pink-400 hover:bg-pink-950/60 text-pink-200 hover:text-pink-400 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-md active:scale-95 cursor-pointer"
              title="Telegram Channel"
              aria-label="Telegram"
            >
              <Send className="w-5 h-5 fill-current -rotate-12" />
            </a>

            {/* TikTok */}
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-slate-900/90 border border-pink-900/40 hover:border-pink-400 hover:bg-pink-950/60 text-pink-200 hover:text-pink-400 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-md active:scale-95 cursor-pointer"
              title="TikTok"
              aria-label="TikTok"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.48 2.79 1.4-.04 2.67-.97 3.04-2.31.13-.48.16-.98.16-1.48.01-4.88-.01-9.76.01-14.64.01-.01 0-.02 0-.03z"/>
              </svg>
            </a>
          </div>

          {/* Thin Divider */}
          <div className="w-full max-w-2xl mx-auto border-t border-slate-800/80 mb-6"></div>

          {/* Privacy Policy & Support Links */}
          <div className="flex items-center justify-center space-x-3 text-xs font-semibold text-slate-400 mb-3">
            <button
              type="button"
              onClick={() => setPrivacyModalOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="text-slate-600">|</span>
            <button
              type="button"
              onClick={() => setSupportModalOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Support
            </button>
          </div>

          {/* Copyright */}
          <p className="text-[11px] sm:text-xs text-slate-400 font-medium mb-6">
            © {new Date().getFullYear()} NA-DY TOPUP. All rights reserved.
          </p>

          {/* Payment Badges (We accept: ABA | KHQR) */}
          <div className="inline-flex items-center justify-center space-x-2.5 bg-slate-900/90 border border-slate-800/80 px-4 py-2 rounded-2xl shadow-inner">
            <span className="text-xs font-bold text-slate-300">
              We accept:
            </span>

            {/* ABA Badge */}
            <div className="h-6 px-2.5 rounded-md bg-[#002f43] border border-cyan-500/40 flex items-center justify-center shadow-xs">
              <span className="text-white font-black text-[11px] tracking-wider">ABA</span>
              <span className="h-2 w-0.5 bg-red-500 ml-1 rounded-full"></span>
            </div>

            {/* KHQR Badge */}
            <div className="h-6 px-2.5 rounded-md bg-[#e11d48] border border-rose-400/40 flex items-center justify-center shadow-xs">
              <span className="text-white font-black text-[11px] tracking-wider font-mono">KHQR</span>
            </div>
          </div>

        </div>
      </footer>

      {/* ══ MODAL: PRIVACY POLICY ═════════════════════════════════════════ */}
      {privacyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-200 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="font-black text-base text-white">Privacy Policy</h3>
              </div>
              <button onClick={() => setPrivacyModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-300 max-h-72 overflow-y-auto leading-relaxed pr-1">
              <p>
                At <strong>NA-DY TOPUP</strong>, your data privacy and digital safety are our highest priorities.
              </p>
              <p>
                1. <strong>No Password Storage:</strong> We only require your public Game ID and Zone ID to process top-ups. We NEVER ask for game account passwords.
              </p>
              <p>
                2. <strong>Payment Security:</strong> All KHQR payments are encrypted and processed through official banking gateways (ABA / Bakong). We do not store sensitive payment credentials.
              </p>
              <p>
                3. <strong>Fast Delivery Guarantee:</strong> Digital voucher codes and diamond balance recharges are delivered automatically within seconds of payment receipt.
              </p>
            </div>
            <button
              onClick={() => setPrivacyModalOpen(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ══ MODAL: SUPPORT ════════════════════════════════════════════════ */}
      {supportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-200 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <Send className="h-5 w-5 text-cyan-400" />
                <h3 className="font-black text-base text-white">Contact Customer Support</h3>
              </div>
              <button onClick={() => setSupportModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Need help with your top-up, have questions about a payment, or need account assistance?
            </p>
            <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 mb-4 space-y-1.5 text-xs text-slate-300">
              <div className="text-white font-bold">⚡ Response Time: Under 2 Minutes</div>
              <div className="text-slate-400">Available 24/7 for top-up verification and inquiries.</div>
            </div>
            <a
              href="https://t.me/darazzdev"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
            >
              <Send className="h-4 w-4 fill-current" />
              <span>Chat on Telegram @darazzdev</span>
            </a>
          </div>
        </div>
      )}
    </>
  );
}
