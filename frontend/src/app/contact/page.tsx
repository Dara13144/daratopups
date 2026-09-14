'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Send, Mail, Phone, MessageSquare, CheckCircle, AlertCircle,
  HelpCircle, Clock, ShieldCheck, Sparkles, ExternalLink, RefreshCw,
  Search, ArrowRight, User, FileText, ChevronDown, Check, Zap, MessageCircle
} from 'lucide-react';
import { submitContactMessage, fetchContactTicket, ContactMessageItem } from '../../lib/api';
import { subscribeToContactMessagesRealtime } from '../../lib/supabase';

const FAQ_ITEMS = [
  {
    q: 'តើការបញ្ចូលពេជ្រចំណាយពេលប៉ុន្មាន? (How long does top-up take?)',
    a: 'ការបញ្ជាទិញភាគច្រើនត្រូវបានដំណើរការដោយស្វ័យប្រវត្តិក្នុងរយៈពេលពី 1 ទៅ 3 នាទី បន្ទាប់ពីការទូទាត់ជោគជ័យតាម KHQR ឬ ABA។ Most orders are completed within 1-3 minutes.'
  },
  {
    q: 'ចុះបើខ្ញុំផ្ទេរប្រាក់ហើយតែមិនទាន់ទទួលបានពេជ្រ? (Paid but diamonds not received?)',
    a: 'សូមកុំបារម្ភ! លោកអ្នកអាចយកលេខកូដវិក្កយបត្រ (Transaction ID) មកត្រួតពិនិត្យក្នុងទំព័រ "តាមដាន" ឬផ្ញើសារតាមរយៈទម្រង់ Contact នេះ ឬទាក់ទងមកកាន់ Telegram @darazzdev ដោយផ្ទាល់។'
  },
  {
    q: 'តើខ្ញុំអាចបង់ប្រាក់តាមមធ្យោបាយណាខ្លះ? (What payment methods are supported?)',
    a: 'យើងខ្ញុំគាំទ្រការទូទាត់ប្រាក់តាមរយៈ Bakong KHQR (គ្រប់ធនាគារនៅកម្ពុជា ABA, Wing, ACLEDA, Canadia, etc.) និង ABA Mobile PayWay ដោយសុវត្ថិភាពខ្ពស់។'
  },
  {
    q: 'តើខ្ញុំអាចកែប្រែ Player ID បន្ទាប់ពីបញ្ជាទិញបានទេ? (Can I edit Player ID after order?)',
    a: 'ប្រសិនបើការបញ្ជាទិញស្ថិតក្នុងស្ថានភាព PENDING លោកអ្នកអាចទាក់ទងមកក្រុមការងារ Support តាម Telegram ភ្លាមៗដើម្បីជួយកែសម្រួលមុនពេលប្រព័ន្ធបញ្ជូនពេជ្រ។'
  }
];

export default function ContactPage() {
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [subject, setSubject] = useState('TOPUP_ISSUE');
  const [txnId, setTxnId] = useState('');
  const [message, setMessage] = useState('');

  // Status State
  const [submitting, setSubmitting] = useState(false);
  const [successTicket, setSuccessTicket] = useState<{ id: string; message: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Ticket Lookup State
  const [searchTicketId, setSearchTicketId] = useState('');
  const [searchingTicket, setSearchingTicket] = useState(false);
  const [ticketResult, setTicketResult] = useState<any | null>(null);
  const [ticketSearchError, setTicketSearchError] = useState('');

  // FAQ Accordion
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!name.trim()) {
      setErrorMessage('សូមបញ្ចូលឈ្មោះរបស់អ្នក (Please enter your name)');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែលត្រឹមត្រូវ (Please enter a valid email)');
      return;
    }
    if (!message.trim()) {
      setErrorMessage('សូមបញ្ចូលសារពិពណ៌នាបញ្ហារបស់អ្នក (Please write your message)');
      return;
    }

    setSubmitting(true);
    try {
      const subjectLabels: Record<string, string> = {
        TOPUP_ISSUE: 'Top-up Issue / បញ្ហាមិនទាន់ចូលពេជ្រ',
        PAYMENT_FAILED: 'Payment Failed / បញ្ហាស្កេនទូទាត់ KHQR',
        WRONG_ID: 'Wrong Player ID / ច្រឡំ Player ID',
        RESELLER_INQUIRY: 'Reseller / Creator Partnership',
        GENERAL_SUPPORT: 'General Support / សំណួរទូទៅ',
      };

      const result = await submitContactMessage({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        telegram: telegram.trim() || undefined,
        subject: subjectLabels[subject] || subject,
        message: message.trim(),
        txnId: txnId.trim() || undefined,
      });

      setSuccessTicket({
        id: result.ticketId || result.data?.id || 'TICK-' + Date.now().toString().slice(-6),
        message: result.message || 'សាររបស់អ្នកត្រូវបានផ្ញើដោយជោគជ័យ! ក្រុមការងារ Support នឹងឆ្លើយតបយ៉ាងឆាប់រហ័ស។',
      });

      // Clear form
      setName('');
      setEmail('');
      setPhone('');
      setTelegram('');
      setTxnId('');
      setMessage('');
    } catch (err: any) {
      console.error('Contact submission error:', err);
      setErrorMessage(err.message || 'មានបញ្ហាក្នុងការផ្ញើសារ។ សូមទាក់ទងមក Telegram @darazzdev ដោយផ្ទាល់។');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearchTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTicketId.trim()) return;

    setSearchingTicket(true);
    setTicketSearchError('');
    setTicketResult(null);

    try {
      const res = await fetchContactTicket(searchTicketId.trim());
      if (res && res.ticket) {
        setTicketResult(res.ticket);
      } else {
        setTicketSearchError('រកមិនឃើញសំបុត្រ Support នេះទេ។ សូមពិនិត្យលេខ Ticket ID ឡើងវិញ។');
      }
    } catch (err: any) {
      setTicketSearchError('រកមិនឃើញសំបុត្រ Support នេះទេ (Ticket not found).');
    } finally {
      setSearchingTicket(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d020d] text-slate-100 selection:bg-pink-500 selection:text-white pb-24 pt-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center space-x-2 text-xs text-pink-300/70 mb-6">
          <Link href="/" className="hover:text-pink-400 transition-colors">ទំព័រដើម</Link>
          <span>/</span>
          <span className="text-white font-semibold">ទាក់ទងមកយើង (Contact & Support)</span>
        </div>

        {/* Hero Section */}
        <div className="relative rounded-3xl p-6 sm:p-10 mb-10 overflow-hidden border border-pink-900/40 bg-gradient-to-br from-[#240a23]/90 via-[#190618]/90 to-[#0d020d]/95 backdrop-blur-xl shadow-2xl shadow-pink-950/40">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-pink-500/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-bold mb-4 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>សេវាកម្មបម្រើអតិថិជន ២៤/៧ (24/7 Fast Support)</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-4 leading-tight">
              ត្រូវការជំនួយ ឬមានសំណួរ? <br />
              <span className="bg-gradient-to-r from-pink-400 via-rose-300 to-fuchsia-300 bg-clip-text text-transparent">
                យើងខ្ញុំរីករាយនឹងជួយលោកអ្នក!
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300/80 leading-relaxed max-w-2xl">
              ប្រសិនបើលោកអ្នកមានបញ្ហាទាក់ទងនឹងការបញ្ចូលពេជ្រ ការទូទាត់ប្រាក់ KHQR ឬចង់សហការជា Reseller សូមផ្ញើសារមកកាន់យើងខ្ញុំ ឬទាក់ទងមក Telegram ផ្ទាល់។
            </p>
          </div>
        </div>

        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {/* Telegram Card */}
          <a
            href="https://t.me/darazzdev"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative rounded-2xl p-5 border border-sky-500/30 bg-sky-950/20 hover:bg-sky-950/40 transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-sky-500/20"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                <Send className="w-6 h-6 -rotate-12 fill-current" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-sky-400">Telegram Live Support</div>
                <div className="text-base font-black text-white group-hover:text-sky-300 transition-colors">@darazzdev</div>
                <div className="text-[11px] text-slate-400 mt-0.5">ឆ្លើយតបរហ័សក្នុង 1-3 នាទី</div>
              </div>
            </div>
          </a>

          {/* Email Support Card */}
          <a
            href="mailto:support@darashop.com"
            className="group relative rounded-2xl p-5 border border-pink-500/30 bg-pink-950/20 hover:bg-pink-950/40 transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-pink-500/20"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-pink-400">Email Support</div>
                <div className="text-base font-black text-white group-hover:text-pink-300 transition-colors">support@darashop.com</div>
                <div className="text-[11px] text-slate-400 mt-0.5">សេវាកម្មសំបុត្រ Support 24/7</div>
              </div>
            </div>
          </a>

          {/* Order Tracking Card */}
          <Link
            href="/history"
            className="group relative rounded-2xl p-5 border border-purple-500/30 bg-purple-950/20 hover:bg-purple-950/40 transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-purple-500/20"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-purple-400">Track Top-Up Order</div>
                <div className="text-base font-black text-white group-hover:text-purple-300 transition-colors">ពិនិត្យស្ថានភាពកុម្ម៉ង់</div>
                <div className="text-[11px] text-slate-400 mt-0.5">តាមដានតាម Transaction ID</div>
              </div>
            </div>
          </Link>
        </div>

        {/* Main 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Left Column: Contact Form */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl p-6 sm:p-8 border border-pink-900/40 bg-[#160616]/90 backdrop-blur-md shadow-xl">
              
              <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-pink-900/30">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">ផ្ញើសារមកកាន់ក្រុមការងារ (Send Support Message)</h2>
                  <p className="text-xs text-slate-400">យើងនឹងឆ្លើយតបទៅកាន់អ៊ីមែល ឬ Telegram របស់លោកអ្នក</p>
                </div>
              </div>

              {/* Success Notification Alert */}
              {successTicket && (
                <div className="mb-6 p-5 rounded-2xl border border-emerald-500/40 bg-emerald-950/40 text-emerald-200 animate-in fade-in duration-300">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-white text-sm">ផ្ញើសារបានជោគជ័យ! (Message Sent Successfully)</h4>
                      <p className="text-xs text-emerald-300/90 mt-1 leading-relaxed">{successTicket.message}</p>
                      <div className="mt-3 inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-500/40 text-xs font-mono font-bold text-white">
                        <span>Ticket ID: {successTicket.id}</span>
                      </div>
                      <p className="text-[11px] text-emerald-400/80 mt-2">
                        * សូមរក្សាទុកលេខ Ticket ID នេះដើម្បីត្រួតពិនិត្យការឆ្លើយតបនៅផ្នែកខាងក្រោម។
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {errorMessage && (
                <div className="mb-6 p-4 rounded-2xl border border-rose-500/40 bg-rose-950/40 text-rose-200 flex items-center space-x-3 text-xs animate-in fade-in duration-200">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Name & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      ឈ្មោះរបស់អ្នក (Your Name) <span className="text-pink-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="ឧ. Sok Dara"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-pink-900/40 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      អ៊ីមែល (Email Address) <span className="text-pink-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@gmail.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-pink-900/40 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Telegram & Phone Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Telegram Username (ស្រេចចិត្ត)
                    </label>
                    <div className="relative">
                      <Send className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={telegram}
                        onChange={(e) => setTelegram(e.target.value)}
                        placeholder="@yourtelegram"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-pink-900/40 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      លេខទូរស័ព្ទ (Phone Number)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="012 345 678"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-pink-900/40 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Subject & Transaction ID Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      ប្រធានបទ (Subject) <span className="text-pink-400">*</span>
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-pink-900/40 text-white text-xs focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all cursor-pointer"
                    >
                      <option value="TOPUP_ISSUE">💎 បញ្ហាមិនទាន់ចូលពេជ្រ (Top-up Delay)</option>
                      <option value="PAYMENT_FAILED">💳 បញ្ហាទូទាត់ប្រាក់ KHQR / ABA</option>
                      <option value="WRONG_ID">⚠️ ច្រឡំ Player ID / Zone ID</option>
                      <option value="RESELLER_INQUIRY">🤝 ចង់សហការជា Reseller / Creator</option>
                      <option value="GENERAL_SUPPORT">💬 សំណួរទូទៅ (General Support)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Transaction ID (បើមាន)
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={txnId}
                        onChange={(e) => setTxnId(e.target.value)}
                        placeholder="ឧ. TXN-171..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-pink-900/40 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Message Textarea */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    សារពិពណ៌នា (Message Description) <span className="text-pink-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="សូមរៀបរាប់លម្អិតអំពីបញ្ហា ឬសំណួររបស់អ្នក..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-pink-900/40 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all resize-none"
                  ></textarea>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-600 hover:from-pink-400 hover:to-fuchsia-500 text-white font-black text-sm tracking-wide flex items-center justify-center space-x-2 shadow-lg shadow-pink-600/30 hover:shadow-pink-600/50 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>កំពុងផ្ញើសារ...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 fill-current -rotate-12" />
                      <span>ផ្ញើសារឥឡូវនេះ (Submit Message)</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Ticket Status Checker & Telegram Live */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Live Ticket Status Checker */}
            <div className="rounded-3xl p-6 border border-purple-900/40 bg-[#17071c]/90 backdrop-blur-md shadow-xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">តាមដានសំបុត្រ Support (Track Ticket)</h3>
                  <p className="text-[11px] text-slate-400">ពិនិត្យការឆ្លើយតបពីក្រុម Admin</p>
                </div>
              </div>

              <form onSubmit={handleSearchTicket} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={searchTicketId}
                  onChange={(e) => setSearchTicketId(e.target.value)}
                  placeholder="បញ្ចូល Ticket ID..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-purple-900/40 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-purple-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={searchingTicket}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center space-x-1 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {searchingTicket ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>ស្វែងរក</span>}
                </button>
              </form>

              {/* Ticket Search Error */}
              {ticketSearchError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{ticketSearchError}</span>
                </div>
              )}

              {/* Ticket Search Result */}
              {ticketResult && (
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/40 text-xs space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-mono text-[10px] text-purple-400">#{ticketResult.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ticketResult.status === 'RESOLVED'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : ticketResult.status === 'IN_PROGRESS'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {ticketResult.status}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px]">Subject: </span>
                    <span className="font-semibold text-white">{ticketResult.subject}</span>
                  </div>

                  {ticketResult.reply ? (
                    <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 mt-2">
                      <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-1 flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>Admin Support Reply:</span>
                      </div>
                      <p className="text-white text-xs leading-relaxed">{ticketResult.reply}</p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-[11px] flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>កំពុងស្ថិតក្នុងការពិនិត្យដោយក្រុម Admin... (Under Review)</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Direct Telegram Box */}
            <div className="rounded-3xl p-6 border border-sky-900/40 bg-gradient-to-br from-[#0c1a2d]/90 to-[#07111e]/90 backdrop-blur-md shadow-xl">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
                  <Send className="w-4 h-4 fill-current -rotate-12" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Telegram ជំនួយផ្ទាល់ (Instant Chat)</h3>
                  <p className="text-[11px] text-sky-300/70">ឆ្លើយតបលឿនបំផុត ២៤ ម៉ោង</p>
                </div>
              </div>
              <p className="text-xs text-slate-300/80 mb-4 leading-relaxed">
                ចង់បានការដោះស្រាយភ្លាមៗ? ផ្ញើសារផ្ទាល់ទៅកាន់ Admin តាម Telegram ដោយគ្រាន់តែចុចប៊ូតុងខាងក្រោម។
              </p>
              <a
                href="https://t.me/darazzdev"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-sky-600/30 active:scale-95"
              >
                <span>ឆាតផ្ទាល់លើ Telegram (@darazzdev)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>
        </div>

        {/* FAQ Section */}
        <div className="rounded-3xl p-6 sm:p-8 border border-pink-900/40 bg-[#160616]/90 backdrop-blur-md shadow-xl mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">សំណួរដែលសួរញឹកញាប់ (Frequently Asked Questions)</h2>
              <p className="text-xs text-slate-400">ចម្លើយរហ័សចំពោះចម្ងល់ទូទៅអំពីការទិញពេជ្រ</p>
            </div>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-pink-900/30 bg-slate-950/60 overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-slate-200 hover:text-pink-300 transition-colors cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <ChevronDown className={`w-4 h-4 text-pink-400 shrink-0 ml-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs text-slate-400 leading-relaxed border-t border-pink-900/20 pt-3 animate-in fade-in duration-200">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
