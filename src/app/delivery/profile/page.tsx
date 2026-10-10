'use client';

import React, { useState, useEffect } from 'react';
import DeliveryLayout from '@/components/delivery/DeliveryLayout';
import {
  User,
  Truck,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Radio,
  Clock,
} from 'lucide-react';

export default function DeliveryProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/delivery/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setPhone(data.profile.phone || '');
        setVehicleType(data.profile.vehicleType || '');
        setVehicleNumber(data.profile.vehicleNumber || '');
        setIsAvailable(data.profile.isAvailable ?? true);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      const res = await fetch('/api/delivery/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          vehicleType,
          vehicleNumber,
          isAvailable,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error || 'Failed to update courier profile.', type: 'error' });
      } else {
        setMessage({ text: 'Courier profile coordinates updated successfully.', type: 'success' });
        setProfile(data.profile);
      }
    } catch {
      setMessage({ text: 'A network error occurred while updating profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DeliveryLayout
      title="Courier Partner Profile &amp; Fleet Coordinates"
      breadcrumbs={[{ label: 'Profile' }]}
      currentCourier={profile}
    >
      {message && (
        <div
          className={`p-4 rounded-lg text-xs flex items-center gap-2.5 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Editable Fleet & Coordinates Form */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-lg p-6 shadow-sm space-y-6">
          <div className="border-b border-neutral-100 pb-3">
            <h2 className="font-cinzel text-base font-semibold text-neutral-900">
              Operational Fleet &amp; Vehicle Settings
            </h2>
            <p className="text-xs text-neutral-500 font-light mt-0.5">
              Maintain vehicle identification and dispatch availability for customer parcel handovers.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {/* Read-Only Account Identity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                  Courier Full Name (Verified)
                </label>
                <input
                  type="text"
                  value={profile?.fullName || ''}
                  disabled
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded text-neutral-700 font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                  Registered Dispatch Email
                </label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded text-neutral-700 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            {/* Editable Telephone */}
            <div>
              <label className="block text-[11px] font-semibold text-neutral-800 mb-1">
                Direct Courier Telephone (Visible to Clients for Handover)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 XXXXX"
                className="w-full p-2.5 border border-neutral-200 rounded focus:border-black outline-none"
              />
            </div>

            {/* Editable Vehicle Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-800 mb-1">
                  Vehicle Type / Model
                </label>
                <input
                  type="text"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  placeholder="e.g. Executive Climate-Controlled Van"
                  className="w-full p-2.5 border border-neutral-200 rounded focus:border-black outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-800 mb-1">
                  Vehicle License Plate
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="e.g. DL-01-HV-7777"
                  className="w-full p-2.5 border border-neutral-200 rounded focus:border-black outline-none font-mono"
                />
              </div>
            </div>

            {/* Availability On-Duty Toggle */}
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between">
              <div>
                <div className="font-semibold text-neutral-900 text-xs">
                  Active Dispatch Availability
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5">
                  When enabled, store administrators can allocate incoming luxury flacon orders to your queue.
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="btn-heaven-primary py-2.5 px-6 text-xs tracking-wider inline-flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Updating Fleet...' : 'Save Fleet Coordinates'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column (1 Col): Courier Badge & Lifetime Metrics */}
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
              <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
              <h3 className="font-cinzel text-sm font-semibold text-neutral-900">
                Partner Operational Credentials
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-neutral-500">Service Rating</span>
                <span className="font-semibold text-neutral-900">
                  {profile?.rating ? profile.rating.toFixed(2) : '5.00'} / 5.0
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-neutral-500">Completed Deliveries</span>
                <span className="font-semibold text-neutral-900">
                  {profile?.deliveriesCompleted || 0} handovers
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-neutral-500">Account Role</span>
                <span className="font-semibold uppercase text-neutral-800 text-[10px] bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                  DELIVERY_PARTNER
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-neutral-500">Current Status</span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  isAvailable ? 'bg-emerald-50 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                }`}>
                  {isAvailable ? 'Active on Duty' : 'Off Duty'}
                </span>
              </div>

              <div className="flex justify-between border-t border-neutral-100 pt-2">
                <span className="text-neutral-500">Member Since</span>
                <span className="text-neutral-700">
                  {profile?.joinedAt
                    ? new Date(profile.joinedAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        year: 'numeric',
                      })
                    : '2026'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DeliveryLayout>
  );
}
