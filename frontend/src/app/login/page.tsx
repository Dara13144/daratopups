'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { loginWithGoogle } from '../../lib/api';
import {
  signInWithSupabaseGoogle,
  supabase,
} from '../../lib/supabase';
import {
  Gamepad2,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '';

const ADMIN_EMAILS = [
  'mdara9695@gmail.com',
];

declare global {
  interface Window {
    google?: any;
  }
}

export default function LoginPage() {
  const router = useRouter();

  // Google OAuth state
  const [googleLoading, setGoogleLoading] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ─── Auth Success Handler ────────────────────────────────────────────────────
  const handleAuthSuccess = (data: any) => {
    setSuccess('Signed in successfully! Redirecting...');
    const email = (data.user?.email || '').toLowerCase();
    const isAdminUser = email === 'mdara9695@gmail.com';
    const finalRole = isAdminUser ? 'ADMIN' : 'USER';

    if (data.token) {
      localStorage.setItem('token', data.token);
      if (isAdminUser) {
        localStorage.setItem('admin_token', data.token);
      } else {
        localStorage.removeItem('admin_token');
      }
      try {
        document.cookie = `token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
      } catch (e) {}
    }
    localStorage.setItem('user_role', finalRole);
    if (email) localStorage.setItem('user_email', email);

    setTimeout(() => {
      if (finalRole === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }
      router.refresh();
    }, 600);
  };

  // ─── Google GSI Init ─────────────────────────────────────────────────────────
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

  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response || !response.credential) return;
    setGoogleLoading(true);
    setError('');
    setSuccess('');
    try {
      const data = await loginWithGoogle(response.credential);
      handleAuthSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with Google');
      setGoogleLoading(false);
    }
  };

  // ─── Supabase OAuth + URL hash handler ──────────────────────────────────────
  useEffect(() => {
    initializeGoogleGSI();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
          const userEmail = session.user.email;
          if (userEmail && session.access_token) {
            try {
              const data = await loginWithGoogle(
                session.access_token,
                userEmail,
                session.user.user_metadata?.full_name || session.user.user_metadata?.name
              );
              handleAuthSuccess(data);
            } catch (e: any) {
              console.warn('[Supabase Auth] Sync fallback:', e);
              const isAdminUser = userEmail.toLowerCase() === 'mdara9695@gmail.com';
              const finalRole = isAdminUser ? 'ADMIN' : 'USER';
              localStorage.setItem('token', session.access_token);
              if (isAdminUser) {
                localStorage.setItem('admin_token', session.access_token);
              } else {
                localStorage.removeItem('admin_token');
              }
              localStorage.setItem('user_email', userEmail);
              localStorage.setItem('user_role', finalRole);
              handleAuthSuccess({
                token: session.access_token,
                user: { email: userEmail, role: finalRole },
              });
            }
          }
        }
      }
    );

    if (typeof window !== 'undefined') {
      const hash = window.location.hash.substring(1);
      const search = window.location.search.substring(1);
      const params = new URLSearchParams(hash || search);
      const accessToken = params.get('access_token') || params.get('id_token');
      if (accessToken) {
        window.history.replaceState(null, '', window.location.pathname);
        setGoogleLoading(true);
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
          .then((r) => r.json())
          .then(async (info) => {
            const data = await loginWithGoogle(accessToken, info.email, info.name || info.given_name);
            handleAuthSuccess(data);
          })
          .catch((err) => {
            setError(err.message || 'Failed to process Google token');
            setGoogleLoading(false);
          });
      }

      const handlePopupMsg = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'GOOGLE_OAUTH_TOKEN' && event.data.token) {
          setGoogleLoading(true);
          try {
            const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${event.data.token}` },
            });
            const info = await userRes.json();
            const data = await loginWithGoogle(event.data.token, info.email, info.name || info.given_name);
            handleAuthSuccess(data);
          } catch (err: any) {
            setError(err.message || 'Google token error');
            setGoogleLoading(false);
          }
        }
      };
      window.addEventListener('message', handlePopupMsg);
      return () => {
        window.removeEventListener('message', handlePopupMsg);
        subscription.unsubscribe();
      };
    }
    return () => { subscription.unsubscribe(); };
  }, []);

  // ─── Google OAuth Popup Flow (fallback) ──────────────────────────────────────
  const openGoogleOAuthDirect = () => {
    if (typeof window === 'undefined') return;
    // Use GSI token client (avoids redirect_uri_mismatch issues)
    if (window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.error) {
              setError('Google sign-in was cancelled or failed.');
              setGoogleLoading(false);
              return;
            }
            if (tokenResponse?.access_token) {
              try {
                const result = await loginWithGoogle(tokenResponse.access_token);
                handleAuthSuccess(result);
              } catch (e: any) {
                setError(e?.message || 'Google login failed');
                setGoogleLoading(false);
              }
            }
          },
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (e) {
        console.warn('GSI token client fallback error:', e);
      }
    }
    // Last resort: GSI id flow
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };


  const handleGoogleClick = async () => {
    setError(''); setSuccess('');
    try {
      setGoogleLoading(true);
      await signInWithSupabaseGoogle();
      return;
    } catch (e: any) {
      console.warn('Supabase Google OAuth fallback:', e?.message);
    }
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      try {
        const tc = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          callback: async (tr: any) => {
            if (tr?.error) { setGoogleLoading(false); return; }
            if (tr?.access_token) {
              try {
                const info = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${tr.access_token}` } }).then(r => r.json());
                const data = await loginWithGoogle(tr.access_token, info.email, info.name || info.given_name);
                handleAuthSuccess(data);
              } catch (err: any) { setError(err.message || 'Google auth failed'); setGoogleLoading(false); }
            }
          },
          error_callback: () => { setGoogleLoading(false); openGoogleOAuthDirect(); },
        });
        tc.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch {}
    }
    openGoogleOAuthDirect();
  };

  const isLoading = googleLoading;

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={initializeGoogleGSI} />
      <Header />

      <main className="flex-grow flex items-center justify-center py-8 sm:py-16 px-3 sm:px-4 pb-24 md:pb-12 overflow-x-hidden">
        <div className="max-w-md w-full">

          {/* ── Card ── */}
          <div className="bg-white border border-slate-200 shadow-2xl rounded-3xl overflow-hidden">

            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#0369a1] via-[#0284c7] to-pink-600 px-6 py-6 text-center text-white">
              <div className="inline-flex items-center justify-center h-16 w-24 bg-slate-950/80 rounded-2xl mb-3 backdrop-blur-sm ring-2 ring-cyan-400/50 p-1 shadow-lg shadow-cyan-500/20">
                <img src="/images/nady-logo.png" alt="NADYTOPUP.SITE" className="h-full w-full object-contain" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">NADYTOPUP.SITE</h1>
              <p className="text-cyan-100/90 text-sm mt-1">Sign in to manage your account</p>
            </div>

            <div className="p-6 sm:p-8 space-y-5">

              {/* Alerts */}
              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3.5 text-red-700 text-sm animate-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-emerald-700 text-sm animate-in slide-in-from-top-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              {/* ── Sign In Form ── */}
              <div className="space-y-4">
                <p className="text-center text-slate-500 text-sm">
                  Sign in with your Google account to track orders, view recharge history, and access benefits.
                </p>

                {/* Google Button */}
                <button
                  type="button"
                  id="google-custom-btn"
                  onClick={handleGoogleClick}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-5 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-red-500 rounded-2xl text-slate-800 font-black text-sm transition-all shadow-md hover:shadow-red-500/10 active:scale-[0.99] disabled:opacity-50 min-h-[52px]"
                >
                  {googleLoading ? (
                    <><Loader2 className="w-5 h-5 text-red-600 animate-spin" /><span>Signing in with Google...</span></>
                  ) : (
                    <>
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                <div id="google-btn-native" className="flex justify-center my-1" />
              </div>

              {/* Footer */}
              <p className="text-center text-xs text-slate-400 pt-2">
                Need help?{' '}
                <a href="https://t.me/darazzdev" target="_blank" rel="noopener noreferrer" className="text-red-600 font-bold hover:underline">
                  Contact Telegram Support
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
