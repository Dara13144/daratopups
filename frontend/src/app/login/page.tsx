'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { loginWithGoogle } from '../../lib/api';
import { Gamepad2, AlertCircle, CheckCircle2 } from 'lucide-react';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '212551130685-hln5k9en81aq0d2884l8qk9v38ocb6rq.apps.googleusercontent.com';

declare global {
  interface Window {
    google?: any;
  }
}

export default function LoginPage() {
  const router = useRouter();
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
      }, 800);
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
            theme: 'outline',
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

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogleGSI}
      />
      <Header />
      
      <main className="flex-grow flex items-center justify-center py-8 sm:py-16 px-3 sm:px-4 pb-24 md:pb-12 overflow-x-hidden">
        <div className="max-w-md w-full glass-panel p-6 sm:p-8 bg-white border-slate-200 shadow-xl relative rounded-2xl sm:rounded-3xl">
          
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex bg-gradient-to-r from-cyan-500 to-violet-500 p-3 rounded-2xl text-white mb-3.5 shadow-md shadow-cyan-500/25">
              <Gamepad2 className="h-7 w-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Welcome to DARA-TOPUP
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1.5 max-w-xs mx-auto">
              Sign in with your Google account to access your recharge orders and top-up dashboard.
            </p>
          </div>

          {/* Alerts display */}
          {error && (
            <div className="flex items-start space-x-2 bg-red-50 border border-red-200 rounded-xl p-3.5 mb-5 text-red-700 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start space-x-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 mb-5 text-emerald-700 text-xs">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Google Sign In Primary Action */}
          <div className="space-y-4">
            <button
              type="button"
              id="google-custom-btn"
              onClick={handleCustomGoogleClick}
              disabled={googleLoading}
              className="w-full flex items-center justify-center space-x-3 py-3 px-5 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-cyan-400 rounded-2xl text-slate-800 font-black text-sm sm:text-base transition-all shadow-md hover:shadow-cyan-500/10 active:scale-[0.99] disabled:opacity-50 min-h-[50px] cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
              <span>{googleLoading ? 'Signing in with Google...' : 'Continue with Google'}</span>
            </button>

            {/* Native GSI Render Target */}
            <div id="google-btn-native" className="flex justify-center"></div>
          </div>

          {/* Support Link */}
          <div className="mt-6 text-center text-xs text-slate-400">
            Need help?{' '}
            <a
              href="https://t.me/darazzdev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-600 font-bold hover:underline"
            >
              Contact Telegram Support
            </a>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
