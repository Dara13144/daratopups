'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { loginWithGoogle } from '../../lib/api';
import {
  Gamepad2,
  AlertCircle,
  CheckCircle2,
  Loader2,
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

    // Catch OAuth direct redirect tokens from URL hash (#access_token=... or ?access_token=...)
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.substring(1);
      const search = window.location.search.substring(1);
      const params = new URLSearchParams(hash || search);
      const accessToken = params.get('access_token');
      const idToken = params.get('id_token');
      const token = accessToken || idToken;

      if (token) {
        // If opened inside popup window, send message to parent window
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

      // Listen for popup messages from child window
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
      return () => window.removeEventListener('message', handlePopupMessage);
    }
  }, []);

  // Universal Direct Google OAuth Popup Flow (100% immune to FedCM, works on all browsers & origins)
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
              Welcome to NA-DY TOPUP
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
              disabled={googleLoading}
              className="w-full flex items-center justify-center space-x-3 py-3.5 px-5 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-cyan-400 rounded-2xl text-slate-800 font-black text-sm sm:text-base transition-all shadow-md hover:shadow-cyan-500/10 active:scale-[0.99] disabled:opacity-50 min-h-[50px] cursor-pointer"
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
