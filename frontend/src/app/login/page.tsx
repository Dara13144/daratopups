'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { loginWithGoogle, login, register } from '../../lib/api';
import {
  Gamepad2,
  AlertCircle,
  CheckCircle2,
  Mail,
  Lock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '212551130685-hln5k9en81aq0d2884l8qk9v38ocb6rq.apps.googleusercontent.com';

declare global {
  interface Window {
    google?: any;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Email / Password accordion state
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Centralized authentication success handler
  const handleAuthSuccess = (data: any) => {
    setSuccess('Signed in successfully! Redirecting...');
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
    }, 600);
  };

  // Handle Google Credential Callback from official rendered GSI button
  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response || !response.credential) return;
    setGoogleLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await loginWithGoogle(response.credential);
      handleAuthSuccess(data);
    } catch (err: any) {
      console.error('Google credential verification error:', err);
      setError(err.message || 'Failed to authenticate with Google');
      setGoogleLoading(false);
    }
  };

  // Initialize Google Identity Services (without triggering FedCM One Tap prompt on button click)
  const initializeGoogleGSI = () => {
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true,
          use_fedcm_for_prompt: false,
        });

        const btnContainer = document.getElementById('google-btn-native');
        if (btnContainer) {
          btnContainer.innerHTML = '';
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

    // Catch OAuth direct redirect tokens from URL hash (#access_token=...)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      if (accessToken) {
        window.history.replaceState(null, '', window.location.pathname);
        setGoogleLoading(true);
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
          .then((res) => res.json())
          .then(async (userInfo) => {
            const data = await loginWithGoogle(accessToken, userInfo.email, userInfo.name);
            handleAuthSuccess(data);
          })
          .catch((err) => {
            setError(err.message || 'Failed to process Google authentication token');
            setGoogleLoading(false);
          });
      }
    }
  }, []);

  // Universal Direct Google OAuth Popup Flow (100% immune to FedCM, works on all browsers & origins)
  const openGoogleOAuthDirect = () => {
    if (typeof window === 'undefined') return;
    setGoogleLoading(true);
    const redirectUri = window.location.origin + '/login';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      GOOGLE_CLIENT_ID
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token&scope=${encodeURIComponent(
      'openid email profile'
    )}&prompt=select_account`;

    const width = 500;
    const height = 620;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      'google_login_popup',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      // Fallback if popup is blocked
      window.location.href = authUrl;
    }
  };

  // Interactive Google Sign-In button click
  const handleCustomGoogleClick = () => {
    setError('');
    setSuccess('');

    // Method 1: Google Identity Services OAuth2 TokenClient (Standard OAuth popup, bypasses FedCM)
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      try {
        setGoogleLoading(true);
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.error) {
              setGoogleLoading(false);
              if (tokenResponse.error !== 'access_denied') {
                setError(tokenResponse.error_description || 'Google sign-in was canceled');
              }
              return;
            }
            if (tokenResponse?.access_token) {
              try {
                const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await userRes.json();
                const data = await loginWithGoogle(
                  tokenResponse.access_token,
                  userInfo.email,
                  userInfo.name || userInfo.given_name
                );
                handleAuthSuccess(data);
              } catch (err: any) {
                console.error('Google token exchange error:', err);
                setError(err.message || 'Failed to authenticate Google user');
                setGoogleLoading(false);
              }
            }
          },
          error_callback: (err: any) => {
            setGoogleLoading(false);
            console.error('Google OAuth token error:', err);
            // Fallback to direct OAuth popup if tokenClient fails
            openGoogleOAuthDirect();
          },
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('OAuth2 TokenClient failed, falling back to direct OAuth:', err);
      }
    }

    // Method 2: Direct Google OAuth 2.0 Web Flow
    openGoogleOAuthDirect();
  };

  // Email / Password login submission
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setEmailLoading(true);

    try {
      let data;
      if (isRegister) {
        data = await register(email.trim(), password);
      } else {
        data = await login(email.trim(), password);
      }
      handleAuthSuccess(data);
    } catch (err: any) {
      console.error('Email authentication error:', err);
      setError(err.message || 'Invalid email or password');
    } finally {
      setEmailLoading(false);
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
          <div className="space-y-3">
            <button
              type="button"
              id="google-custom-btn"
              onClick={handleCustomGoogleClick}
              disabled={googleLoading || emailLoading}
              className="w-full flex items-center justify-center space-x-3 py-3 px-5 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-cyan-400 rounded-2xl text-slate-800 font-black text-sm sm:text-base transition-all shadow-md hover:shadow-cyan-500/10 active:scale-[0.99] disabled:opacity-50 min-h-[50px] cursor-pointer"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="w-5 h-5 text-cyan-600 animate-spin" />
                  <span>Signing in with Google...</span>
                </>
              ) : (
                <>
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
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Official GSI Button Container (Alternative 1-tap option) */}
            <div id="google-btn-native" className="flex justify-center my-1"></div>
          </div>

          {/* Email / Password Toggle */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setShowEmailLogin(!showEmailLogin);
                setError('');
              }}
              className="w-full flex items-center justify-between py-2 text-xs font-bold text-slate-500 hover:text-cyan-600 transition-colors"
            >
              <span>{showEmailLogin ? 'Hide email sign in' : 'Or sign in with email & password'}</span>
              {showEmailLogin ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showEmailLogin && (
              <form onSubmit={handleEmailSubmit} className="mt-3 space-y-3">
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="mdara9695@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="password"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={emailLoading || googleLoading}
                  className="w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {emailLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-1 text-[11px] text-slate-500">
                  {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(!isRegister);
                      setError('');
                    }}
                    className="text-cyan-600 font-bold hover:underline"
                  >
                    {isRegister ? 'Sign In' : 'Create One'}
                  </button>
                </div>
              </form>
            )}
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
