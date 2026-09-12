'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, Lock } from 'lucide-react';
import { fetchSecurityChallenge, verifySecurityChallenge } from '../lib/api';

interface SecurityChallengeModalProps {
  onSuccess?: () => void;
}

export default function SecurityChallengeModal({ onSuccess }: SecurityChallengeModalProps) {
  const [verifying, setVerifying] = useState(true);
  const [statusText, setStatusText] = useState('Checking your browser security before accessing NA-DY TOPUP...');
  const [error, setError] = useState('');

  const solveChallenge = async () => {
    setVerifying(true);
    setError('');
    setStatusText('Performing cryptographic proof-of-work...');

    try {
      // 1. Fetch challenge parameters from backend
      const challenge = await fetchSecurityChallenge();
      const { challengeId, nonce, timestamp } = challenge;

      // 2. Compute SHA-256(challengeId + ":" + nonce) via Web Crypto API
      const inputStr = `${challengeId}:${nonce}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(inputStr);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const clientHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Small 0.6s delay for smooth UI feedback
      await new Promise(r => setTimeout(r, 600));
      setStatusText('Verifying clearance with security server...');

      // 3. Verify with server
      const verifyRes = await verifySecurityChallenge(nonce, timestamp, clientHash);

      if (verifyRes.success && verifyRes.clearanceToken) {
        // Store clearance token in cookie and localStorage
        document.cookie = `nady_cf_clearance=${verifyRes.clearanceToken}; path=/; max-age=86400; SameSite=Lax`;
        localStorage.setItem('nady_cf_clearance', verifyRes.clearanceToken);
        setStatusText('Verification successful! Entering website...');
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            window.location.reload();
          }
        }, 500);
      } else {
        throw new Error('Verification failed. Please retry.');
      }
    } catch (err: any) {
      console.error('Challenge error:', err);
      setError(err.message || 'Verification timed out. Please click retry.');
      setVerifying(false);
    }
  };

  useEffect(() => {
    solveChallenge();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-cyan-500/30 p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(6,182,212,0.15)] space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Shield Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center shadow-lg">
          <ShieldCheck className="w-10 h-10 text-cyan-400 animate-pulse" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-cyan-500/50 flex items-center justify-center">
            <Lock className="w-3 h-3 text-cyan-300" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-lg sm:text-xl font-black text-white">NA-DY Shield DDoS Mitigation</h3>
          <p className="text-xs text-slate-400 mt-1.5">
            NA-DY TOPUP is running under active DDoS protection.
          </p>
        </div>

        {/* Status Indicator */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          {verifying ? (
            <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-cyan-300">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>{statusText}</span>
            </div>
          ) : (
            <div className="text-xs text-red-400 font-semibold">{error}</div>
          )}

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full animate-[pulse_1.5s_infinite]" style={{ width: verifying ? '75%' : '100%' }} />
          </div>
        </div>

        {/* Retry Button if failed */}
        {!verifying && (
          <button
            onClick={solveChallenge}
            className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-98"
          >
            Retry Verification
          </button>
        )}

        <div className="text-[10px] text-slate-500">
          Ray ID: <span className="font-mono text-slate-400">NADY-SHIELD-{Date.now().toString(36).toUpperCase()}</span> • Protected by NA-DY TOPUP
        </div>
      </div>
    </div>
  );
}
