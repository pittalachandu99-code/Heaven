'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Phone, Sparkles, Check, AlertCircle } from 'lucide-react';

interface AccountProfileFormProps {
  initialFullName: string;
  initialPhone: string;
  initialNotes: string;
  email: string;
}

export default function AccountProfileForm({
  initialFullName,
  initialPhone,
  initialNotes,
  email,
}: AccountProfileFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [preferredNotes, setPreferredNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phone, preferredNotes }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to update preferences.');
        setSaving(false);
        return;
      }

      setSuccessMessage('Profile and olfactory preferences saved successfully.');
      setSaving(false);
      router.refresh();
    } catch {
      setErrorMessage('Network error occurred.');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
              className="input-heaven text-xs pl-10"
            />
            <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1.5 font-medium">
            Registered Email
          </label>
          <input
            type="email"
            disabled
            value={email}
            className="input-heaven text-xs bg-neutral-100 text-neutral-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1.5 font-medium">
            Concierge Phone Number
          </label>
          <div className="relative">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="input-heaven text-xs pl-10"
            />
            <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1.5 font-medium">
            Bespoke Olfactory Notes Preference
          </label>
          <div className="relative">
            <input
              type="text"
              value={preferredNotes}
              onChange={(e) => setPreferredNotes(e.target.value)}
              placeholder="e.g. Grandiflorum Jasmine, Smoky Oud, Tahitian Vanilla"
              className="input-heaven text-xs pl-10"
            />
            <Sparkles className="w-4 h-4 text-[#C5A059] absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={saving}
          className="btn-heaven-primary py-3.5 px-8 text-xs tracking-[0.2em]"
        >
          {saving ? 'Updating Dossier...' : 'Save Preferences'}
        </button>
      </div>
    </form>
  );
}
