'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { Lock, Mail, ArrowRight, AlertCircle, ShieldCheck, Truck } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    errorParam === 'unauthorized_admin'
      ? 'Administrator privileges are required to access the admin portal.'
      : errorParam === 'unauthorized_delivery'
      ? 'Delivery partner credentials are required for courier access.'
      : ''
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, expectedRole: 'CUSTOMER' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to sign in. Please verify your credentials.');
        setLoading(false);
        return;
      }

      // Success
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setErrorMessage('A network error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 border border-neutral-200/80 shadow-sm">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="heaven-wordmark text-2xl tracking-[0.35em] text-neutral-900 block">
          HEAVEN
        </span>
        <h1 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-800">
          Customer Lounge Sign In
        </h1>
        <p className="text-xs text-neutral-500 font-light">
          Access your saved perfumes, bespoke orders, and private allocations.
        </p>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="flex items-start gap-3 p-3.5 bg-neutral-50 border-l-2 border-black text-xs text-neutral-800">
          <AlertCircle className="w-4 h-4 text-neutral-900 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1.5 font-medium">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="victoria@example.com"
              className="input-heaven text-xs pl-10"
            />
            <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs uppercase tracking-wider text-neutral-600 font-medium">
              Password
            </label>
          </div>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="input-heaven text-xs pl-10"
            />
            <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-heaven-primary w-full py-4 text-xs tracking-[0.25em]"
        >
          {loading ? 'Authenticating...' : 'Sign In to Lounge'}
          {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="text-center pt-2 border-t border-neutral-100">
        <p className="text-xs text-neutral-500">
          New to HEAVEN?{' '}
          <Link
            href="/register"
            className="font-medium text-black underline underline-offset-4 hover:text-[#C5A059]"
          >
            Create a Private Account
          </Link>
        </p>
      </div>

      {/* Customer Lounge Access Information */}
      <div className="p-4 bg-neutral-50 border border-neutral-200 text-[11px] text-neutral-600 space-y-1">
        <div className="font-semibold text-neutral-900 uppercase tracking-wider text-[10px]">Private Customer Lounge:</div>
        <div>Registered Customer: <code className="bg-white px-1.5 py-0.5 border text-black">pitallachandu99@gmail.com</code></div>
        <div className="text-neutral-500 text-[10px]">Enter your personal salon credentials above to access your collection.</div>
      </div>

      {/* Role Separation Footer Links */}
      <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-1 hover:text-black transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Admin Portal</span>
        </Link>
        <Link
          href="/delivery/login"
          className="inline-flex items-center gap-1 hover:text-black transition-colors"
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Courier Portal</span>
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCFCFC]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="p-10 text-center text-xs text-neutral-400">Loading Lounge Access...</div>}>
          <LoginForm />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
