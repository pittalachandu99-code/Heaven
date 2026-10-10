'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, expectedRole: 'ADMIN' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Invalid administrator credentials.');
        setLoading(false);
        return;
      }

      router.push('/admin/dashboard');
      router.refresh();
    } catch {
      setErrorMessage('Network connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#0C0C0C] text-white p-4 sm:p-6">
      <div className="max-w-md w-full bg-[#141414] border border-neutral-800 p-8 sm:p-10 shadow-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white mb-2">
            <ShieldCheck className="w-6 h-6 text-[#C5A059]" />
          </div>
          <span className="heaven-wordmark text-2xl tracking-[0.35em] text-white block">
            HEAVEN
          </span>
          <h1 className="text-xs uppercase tracking-[0.25em] font-medium text-neutral-400">
            Executive Admin Console
          </h1>
          <p className="text-[11px] text-neutral-500 font-light">
            Restricted access. All administrative actions and log-ins are audited.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-start gap-3 p-3.5 bg-red-950/40 border border-red-800/60 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5 font-medium">
              Administrator Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@heaven.com"
                className="w-full bg-[#1C1C1C] border border-neutral-700 px-4 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#C5A059] transition-colors pl-10"
              />
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5 font-medium">
              Security Key / Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#1C1C1C] border border-neutral-700 px-4 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#C5A059] transition-colors pl-10"
              />
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black hover:bg-neutral-200 py-3.5 text-xs font-semibold tracking-[0.25em] uppercase transition-colors flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : 'Authorize Access'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Administrator Portal Reference */}
        <div className="p-3.5 bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
          <div className="font-semibold text-neutral-300 uppercase tracking-wider text-[10px]">
            Administrator Portal Access:
          </div>
          <div>Authorized Email: <code className="bg-black text-[#C5A059] px-1.5 py-0.5">24eg105t14@anurag.edu.in</code></div>
          <div className="text-neutral-500 text-[10px]">Enter your confidential administrator credentials above to proceed.</div>
        </div>

        {/* Back Link */}
        <div className="text-center pt-2">
          <Link
            href="/"
            className="text-[11px] uppercase tracking-wider text-neutral-500 hover:text-white transition-colors"
          >
            &larr; Return to Public Boutique
          </Link>
        </div>
      </div>
    </div>
  );
}
