'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { loginWithGoogle, login, register } from '../../lib/api';
import {
  signInWithSupabaseGoogle,
  signInWithSupabaseEmail,
  signUpWithSupabaseEmail,
  supabase,
} from '../../lib/supabase';
import {
  Gamepad2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  Lock,
  UserPlus,
  LogIn,
  Sparkles,
} from 'lucide-react';

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '206329302084-7h656a65vmoeusu10c0cor9lvbp3042v.apps.googleusercontent.com';

declare global {
  interface Window {
    google?: any;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'google' | 'email'>('google');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Centralized authentication success handler
  const handleAuthSuccess = (data: any) => {
    setSuccess('Signed in successfully! Redirecting...');
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    if (data.user?.role) {
      localStorage.setItem('user_role', data.user.role);
    }
    if (data.user?.email) {
      localStorage.setItem('user_email', data.user.email);
    }

    setTimeout(() => {
      if (data.user?.role === 'ADMIN') {
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

  // Handle Supabase Auth state changes (e.g. OAuth redirect return)
  useEffect(() => {
    initializeGoogleGSI();

    // 1. Supabase Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        const userEmail = session.user.email;
        if (userEmail && session.access_token) {
          try {
            // Synchronize with backend API
            const data = await loginWithGoogle(
              session.access_token,
              userEmail,
              session.user.user_metadata?.full_name || session.user.user_metadata?.name
            );
            handleAuthSuccess(data);
          } catch (e: any) {
            console.warn('[Supabase Auth] Sync fallback:', e);
            // Fallback: Store Supabase session locally
            localStorage.setItem('token', session.access_token);
            localStorage.setItem('user_email', userEmail);
            localStorage.setItem('user_role', userEmail === 'mdara9695@gmail.com' ? 'ADMIN' : 'USER');
            handleAuthSuccess({
              token: session.access_token,
              user: {
                email: userEmail,
                role: userEmail === 'mdara9695@gmail.com' ? 'ADMIN' : 'USER',
              },
            });
          }
        }
      }
    });

    // 2. Catch OAuth direct redirect tokens from URL hash (#access_token=... or ?access_token=...)
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.substring(1);
      const search = window.location.search.substring(1);
      const params = new URLSearchParams(hash || search);
      const accessToken = params.get('access_token');
      const idToken = params.get('id_token');
      const token = accessToken || idToken;

      if (token) {
        if (window.opener && !window.opener.closed) {
          try {
            window.opener.postMessage({ type: 'GOOGLE_OAUTH_TOKEN', token }, window.location.origin);
            window.close();
            return;
          } catch (e) {
            console.warn('Popup postMessage warning:', e);
          }
        }

        window.history.replaceState(null, '', window.location.pathname);
        setGoogleLoading(true);
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then(async (userInfo) => {
            const data = await loginWithGoogle(token, userInfo.email, userInfo.name || userInfo.given_name);
            handleAuthSuccess(data);
          })
          .catch((err) => {
            setError(err.message || 'Failed to process Google authentication token');
            setGoogleLoading(false);
          });
      }

      const handlePopupMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'GOOGLE_OAUTH_TOKEN' && event.data.token) {
          const popupToken = event.data.token;
          setGoogleLoading(true);
          try {
            const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${popupToken}` },
            });
            const userInfo = await userRes.json();
            const data = await loginWithGoogle(popupToken, userInfo.email, userInfo.name || userInfo.given_name);
            handleAuthSuccess(data);
          } catch (err: any) {
            setError(err.message || 'Failed to authenticate Google token from popup');
            setGoogleLoading(false);
          }
        }
      };

      window.addEventListener('message', handlePopupMessage);
      return () => {
        window.removeEventListener('message', handlePopupMessage);
        subscription.unsubscribe();
      };
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Universal Direct Google OAuth Popup Flow
  const openGoogleOAuthDirect = () => {
    if (typeof window === 'undefined') return;
    setGoogleLoading(true);
    const redirectUri = window.location.origin + '/login';
    const state = 'oauth_state_' + Math.random().toString(36).substring(2, 15);
    try { sessionStorage.setItem('oauth_state', state); } catch {}

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      GOOGLE_CLIENT_ID
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token&scope=${encodeURIComponent(
      'openid email profile'
    )}&state=${encodeURIComponent(state)}&prompt=select_account`;

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
      window.location.href = authUrl;
    }
  };

  // Interactive Google Sign-In button click
  const handleCustomGoogleClick = async () => {
    setError('');
    setSuccess('');

    // Method 1: Try Supabase OAuth Sign-In first for full ecosystem support
    try {
      setGoogleLoading(true);
      await signInWithSupabaseGoogle();
      return;
    } catch (supabaseErr: any) {
      console.warn('Supabase Google OAuth fallback to Google Identity Services:', supabaseErr?.message);
    }

    // Method 2: Google Identity Services OAuth2 TokenClient
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      try {
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
            openGoogleOAuthDirect();
          },
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('OAuth2 TokenClient failed, falling back to direct OAuth:', err);
      }
    }

    // Method 3: Direct Google OAuth 2.0 Web Flow
    openGoogleOAuthDirect();
  };

  // Email / Password Form Submit
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isRegisterMode) {
        // Try Backend API register first
        try {
          const data = await register(email.trim(), password);
          handleAuthSuccess(data);
          return;
        } catch (apiErr: any) {
          // Fallback to Supabase Sign Up
          const sbData = await signUpWithSupabaseEmail(email.trim(), password);
          if (sbData.session) {
            handleAuthSuccess({
              token: sbData.session.access_token,
              user: {
                email: sbData.user?.email || email.trim(),
                role: email.trim().toLowerCase() === 'mdara9695@gmail.com' ? 'ADMIN' : 'USER',
              },
            });
            return;
          }
          setSuccess('Account created! Please check your email for confirmation or sign in.');
          setIsRegisterMode(false);
        }
      } else {
        // Login flow
        try {
          const data = await login(email.trim(), password);
          handleAuthSuccess(data);
          return;
        } catch (apiErr: any) {
          // Fallback to Supabase Password Login
          const sbData = await signInWithSupabaseEmail(email.trim(), password);
          if (sbData.session) {
            handleAuthSuccess({
              token: sbData.session.access_token,
              user: {
                email: sbData.user?.email || email.trim(),
                role: email.trim().toLowerCase() === 'mdara9695@gmail.com' ? 'ADMIN' : 'USER',
              },
            });
            return;
          }
          throw apiErr;
        }
      }
    } catch (err: any) {
      console.error('Email authentication error:', err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
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

      <main className="flex-grow flex items-center justify-center py-8 sm:py-16 px-3 sm:px-4 pb-24 md:pb-12 overflow-x-hidden">
        <div className="max-w-md w-full glass-panel p-6 sm:p-8 bg-white border-slate-200 shadow-xl relative rounded-2xl sm:rounded-3xl">
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex bg-gradient-to-r from-red-600 via-amber-600 to-red-500 p-3 rounded-2xl text-white mb-3 shadow-md shadow-red-500/20">
              <Gamepad2 className="h-7 w-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {isRegisterMode ? 'Create Account' : 'Welcome to NA-DY TOPUP'}
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xs mx-auto">
              {isRegisterMode
                ? 'Register to manage top-up orders and save your gaming IDs'
                : 'Sign in with Google or Email to access your recharge orders and top-up dashboard'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => { setActiveTab('google'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'google'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Google 1-Click
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('email'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'email'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Email & Password
            </button>
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

          {/* Google Sign In Tab */}
          {activeTab === 'google' && (
            <div className="space-y-3">
              <button
                type="button"
                id="google-custom-btn"
                onClick={handleCustomGoogleClick}
                disabled={googleLoading}
                className="w-full flex items-center justify-center space-x-3 py-3.5 px-5 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-red-500 rounded-2xl text-slate-800 font-black text-sm sm:text-base transition-all shadow-md hover:shadow-red-500/10 active:scale-[0.99] disabled:opacity-50 min-h-[50px] cursor-pointer"
              >
                {googleLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 text-red-600 animate-spin" />
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

              <div id="google-btn-native" className="flex justify-center my-1"></div>
            </div>
          )}

          {/* Email / Password Sign In Tab */}
          {activeTab === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-black text-sm rounded-xl transition-all shadow-md shadow-red-500/20 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : isRegisterMode ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setIsRegisterMode(!isRegisterMode); setError(''); }}
                  className="text-xs font-bold text-slate-600 hover:text-red-600 transition-colors"
                >
                  {isRegisterMode
                    ? 'Already have an account? Sign In'
                    : "Don't have an account yet? Create one"}
                </button>
              </div>
            </form>
          )}

          {/* Support Link */}
          <div className="mt-6 text-center text-xs text-slate-400">
            Need help?{' '}
            <a
              href="https://t.me/darazzdev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 font-bold hover:underline"
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
