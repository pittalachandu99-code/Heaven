'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Truck, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export default function DeliveryLoginPage() {
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
        body: JSON.stringify({ email, password, expectedRole: 'DELIVERY_PARTNER' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Invalid courier credentials.');
        setLoading(false);
        return;
      }

      router.push('/delivery/dashboard');
      router.refresh();
    } catch {
      setErrorMessage('Network error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#F7F7F7] p-4 sm:p-6 text-neutral-900">
      <div className="max-w-md w-full bg-white border border-neutral-300 p-8 sm:p-10 shadow-lg space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-black text-white flex items-center justify-center mb-2">
            <Truck className="w-6 h-6 text-[#C5A059]" />
          </div>
          <span className="heaven-wordmark text-2xl tracking-[0.35em] text-black block">
            HEAVEN
          </span>
          <h1 className="text-xs uppercase tracking-[0.25em] font-medium text-neutral-700">
            White-Glove Courier Portal
          </h1>
          <p className="text-xs text-neutral-500 font-light">
            Dedicated portal for authenticated HEAVEN luxury delivery dispatchers.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1.5 font-medium">
              Courier Partner Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="delivery@heaven.com"
                className="input-heaven text-xs pl-10"
              />
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1.5 font-medium">
              Access Code / Password
            </label>
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
            className="btn-heaven-primary w-full py-3.5 text-xs tracking-[0.2em]"
          >
            {loading ? 'Authenticating Courier...' : 'Log In to Dispatch'}
            {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
          </button>
        </form>

        {/* Courier Dispatch Access */}
        <div className="p-4 bg-neutral-50 border border-neutral-200 text-[11px] text-neutral-600 space-y-1">
          <div className="font-semibold text-neutral-900 uppercase tracking-wider text-[10px]">
            Delivery Logistics Access:
          </div>
          <div>Courier Email: <code className="bg-white px-1.5 py-0.5 border text-black">delivery@heaven.com</code></div>
          <div className="text-neutral-500 text-[10px]">Enter your authorized courier access code above to open dispatch records.</div>
        </div>

        {/* Back Link */}
        <div className="text-center pt-2">
          <Link
            href="/"
            className="text-xs uppercase tracking-wider text-neutral-500 hover:text-black transition-colors"
          >
            &larr; Return to Boutique
          </Link>
        </div>
      </div>
    </div>
  );
}
