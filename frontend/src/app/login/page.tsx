'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { login, register, loginWithGoogle } from '../../lib/api';
import { Gamepad2, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '206329302084-3fm2qg6o3r48f8hsi3n7pthefuoh3ggt.apps.googleusercontent.com';

declare global {
  interface Window {
    google?: any;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle Google Token Callback
  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response || !response.credential) return;
    setGoogleLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await loginWithGoogle(response.credential);
      setSuccess('Google login successful! Redirecting...');
      
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
      }, 1000);
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Failed to authenticate with Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Initialize Google Identity Services
  const initializeGoogleGSI = () => {
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        const btnContainer = document.getElementById('google-btn-native');
        if (btnContainer) {
          window.google.accounts.id.renderButton(btnContainer, {
            theme: 'filled_black',
            size: 'large',
            width: 320,
            text: 'continue_with',
            shape: 'pill',
          });
        }
      } catch (err) {
        console.warn('Google GSI init warning:', err);
      }
    }
  };

  useEffect(() => {
    initializeGoogleGSI();
  }, []);

  const handleCustomGoogleClick = () => {
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setError('Google Sign-in is initializing. Please try again in a moment.');
    }
  };

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
        }, 1200);
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
        }, 1200);
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
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogleGSI}
      />
      <Header />
      
      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full glass-panel p-8 bg-slate-950/80 border-slate-900 shadow-2xl relative rounded-2xl">
          {/* Accent glow behind login card */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

          {/* Form Header */}
          <div className="text-center mb-8">
            <div className="inline-flex bg-gradient-to-r from-cyan-500 to-violet-500 p-2.5 rounded-2xl text-white mb-3 shadow-lg shadow-cyan-500/20">
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
            <div className="flex items-start space-x-2 bg-red-950/40 border border-red-800/50 rounded-xl p-3 mb-6 text-red-300 text-xs">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start space-x-2 bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-3 mb-6 text-emerald-300 text-xs">
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          {/* Google Sign In Quick Button */}
          <div className="mb-6 space-y-3">
            <button
              type="button"
              onClick={handleCustomGoogleClick}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center space-x-3 py-2.5 px-4 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-xl text-white font-semibold text-sm transition-all duration-200 shadow-md active:scale-[0.99] disabled:opacity-50"
            >
              {/* Official Google Multicolor G Icon */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            {/* Hidden native container for Google One-Tap rendering */}
            <div id="google-btn-native" className="hidden"></div>

            <div className="relative flex items-center justify-center py-2">
              <div className="border-t border-slate-800 w-full"></div>
              <span className="bg-slate-950 px-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                or with email
              </span>
              <div className="border-t border-slate-800 w-full"></div>
            </div>
          </div>

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
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
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
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center space-x-1.5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white font-bold text-sm shadow-md transition-all duration-300 glow-btn disabled:opacity-50"
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
