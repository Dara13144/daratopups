'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { login, register } from '../../lib/api';
import { Gamepad2, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        // Register API flow
        const data = await register(email, password);
        setSuccess('Registration successful! Logging you in...');
        
        // Save auth state
        localStorage.setItem('token', data.token);
        localStorage.setItem('user_role', data.user.role);
        localStorage.setItem('user_email', data.user.email);
        
        setTimeout(() => {
          if (data.user.role === 'ADMIN') {
            router.push('/admin');
          } else {
            router.push('/');
          }
          router.refresh();
        }, 1500);
      } else {
        // Login API flow
        const data = await login(email, password);
        setSuccess('Login successful! Redirecting...');
        
        // Save auth state
        localStorage.setItem('token', data.token);
        localStorage.setItem('user_role', data.user.role);
        localStorage.setItem('user_email', data.user.email);

        setTimeout(() => {
          if (data.user.role === 'ADMIN') {
            router.push('/admin');
          } else {
            router.push('/');
          }
          router.refresh();
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      
      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full glass-panel p-8 bg-slate-950/80 border-slate-900 shadow-2xl relative">
          {/* Accent glow behind login card */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

          {/* Form Header */}
          <div className="text-center mb-8">
            <div className="inline-flex bg-gradient-to-r from-cyan-500 to-violet-500 p-2.5 rounded-2xl text-white mb-3">
              <Gamepad2 className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-white">
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              {isRegister 
                ? 'Join KH-TOPUP to track your digital product orders' 
                : 'Sign in to access your dashboard and purchase history'}
            </p>
          </div>

          {/* Alerts display */}
          {error && (
            <div className="flex items-start space-x-2 bg-red-950/20 border border-red-900/30 rounded-xl p-3 mb-6 text-red-300 text-xs">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start space-x-2 bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3 mb-6 text-emerald-300 text-xs">
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1.5" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
            </div>


            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white font-bold text-sm shadow-md transition-all duration-300 glow-btn disabled:opacity-50"
            >
              <span>{loading ? 'Please wait...' : isRegister ? 'Sign Up' : 'Sign In'}</span>
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {/* Switch toggle tab */}
          <div className="mt-6 text-center text-xs text-slate-400">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
                setSuccess('');
              }}
              className="text-cyan-400 font-bold hover:underline"
            >
              {isRegister ? 'Sign In' : 'Create One'}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
