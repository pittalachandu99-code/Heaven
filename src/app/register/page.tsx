'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { Lock, Mail, User, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const passwordLengthMet = password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!passwordLengthMet) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to create account.');
        setLoading(false);
        return;
      }

      // Success -> Redirect to home
      router.push('/');
      router.refresh();
    } catch {
      setErrorMessage('A network error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFCFC]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 border border-neutral-200/80 shadow-sm">
          {/* Header */}
          <div className="text-center space-y-2">
            <span className="heaven-wordmark text-2xl tracking-[0.35em] text-neutral-900 block">
              HEAVEN
            </span>
            <h1 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-800">
              Create Your Private Account
            </h1>
            <p className="text-xs text-neutral-500 font-light">
              Join the HEAVEN clientele for bespoke allocations and white-glove service.
            </p>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="flex items-start gap-3 p-3.5 bg-neutral-50 border-l-2 border-black text-xs text-neutral-800">
              <AlertCircle className="w-4 h-4 text-neutral-900 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Registration Form */}
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1.5 font-medium">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Lady Victoria Sterling"
                  className="input-heaven text-xs pl-10"
                />
                <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

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
              <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1.5 font-medium">
                Password
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

            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1.5 font-medium">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="input-heaven text-xs pl-10"
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password Validation Indicators */}
            <div className="p-3.5 bg-neutral-50 border border-neutral-100 text-[11px] text-neutral-500 space-y-1.5">
              <div className="font-semibold text-neutral-700 uppercase tracking-wider text-[10px]">Security Criteria:</div>
              <div className="text-[11px]">
                <span className={`flex items-center gap-1.5 ${passwordLengthMet ? 'text-black font-medium' : 'text-neutral-400'}`}>
                  <CheckCircle2 className="w-3 h-3" /> Password must be at least 6 characters
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-heaven-primary w-full py-4 text-xs tracking-[0.25em]"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="text-center pt-2 border-t border-neutral-100">
            <p className="text-xs text-neutral-500">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-black underline underline-offset-4 hover:text-[#C5A059]"
              >
                Sign In to Lounge
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
