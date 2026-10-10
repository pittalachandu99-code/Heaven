'use client';

import React, { useState } from 'react';
import { MapPin, Plus, Trash2, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface SavedAddress {
  id: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  deliveryInstructions?: string | null;
  isDefault: boolean;
}

interface SavedAddressesManagerProps {
  initialAddresses: SavedAddress[];
}

export default function SavedAddressesManager({ initialAddresses }: SavedAddressesManagerProps) {
  const [addresses, setAddresses] = useState<SavedAddress[]>(initialAddresses);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [form, setForm] = useState({
    recipientName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    deliveryInstructions: '',
    isDefault: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.recipientName.trim() || form.recipientName.trim().length < 2) {
      errs.recipientName = 'Recipient name is required (min 2 characters).';
    }
    const cleanPhone = form.phone.replace(/[\s-]/g, '');
    if (!cleanPhone || !/^(\+91)?[6-9]\d{9}$/.test(cleanPhone)) {
      errs.phone = 'Valid 10-digit mobile number starting with 6-9 is required.';
    }
    if (!form.addressLine1.trim() || form.addressLine1.trim().length < 5) {
      errs.addressLine1 = 'House/building/street address is required (min 5 characters).';
    }
    if (!form.city.trim()) {
      errs.city = 'City is required.';
    }
    if (!form.state.trim()) {
      errs.state = 'State / Province is required.';
    }
    if (!/^\d{6}$/.test(form.postalCode.trim())) {
      errs.postalCode = 'Valid 6-digit Indian PIN code is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setNotification(null);

    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setNotification({ type: 'error', message: data.error || 'Failed to save address.' });
        setLoading(false);
        return;
      }

      setAddresses((prev) => [data.address, ...prev]);
      setShowAddForm(false);
      setForm({
        recipientName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        deliveryInstructions: '',
        isDefault: false,
      });
      setNotification({ type: 'success', message: 'Delivery address securely registered.' });
    } catch {
      setNotification({ type: 'error', message: 'A network error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you certain you wish to remove this saved delivery destination?')) {
      return;
    }

    setDeletingId(id);
    setNotification(null);

    try {
      const res = await fetch(`/api/addresses?addressId=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        setNotification({ type: 'error', message: data.error || 'Failed to delete address.' });
        setDeletingId(null);
        return;
      }

      setAddresses((prev) => prev.filter((a) => a.id !== id));
      setNotification({ type: 'success', message: 'Address removed successfully.' });
    } catch {
      setNotification({ type: 'error', message: 'A network error occurred.' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Toggle Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
        <div>
          <h2 className="font-cinzel text-xl text-neutral-950">
            Saved Delivery Destinations
          </h2>
          <p className="text-xs text-neutral-500 font-light mt-1">
            Manage your residential and private residence delivery coordinates for expedited checkout.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowAddForm((prev) => !prev);
            setNotification(null);
          }}
          className="btn-heaven-secondary py-2.5 px-4 text-xs tracking-wider inline-flex items-center gap-2 self-start sm:self-auto"
        >
          {showAddForm ? (
            <>
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Add Destination</span>
            </>
          )}
        </button>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 border text-xs flex items-start gap-3 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Add Address Form */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-neutral-50 border border-neutral-200 p-6 space-y-4 animate-in fade-in">
          <div className="font-cinzel text-sm font-semibold text-neutral-950 border-b border-neutral-200 pb-2">
            New Delivery Address
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                Recipient Full Name *
              </label>
              <input
                type="text"
                value={form.recipientName}
                onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                placeholder="e.g. Eleanor Vance"
                className="input-heaven text-xs w-full py-2.5 px-3 bg-white"
              />
              {errors.recipientName && (
                <p className="text-[11px] text-red-600 mt-1">{errors.recipientName}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                Mobile Number *
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. +91 98765 43210"
                className="input-heaven text-xs w-full py-2.5 px-3 bg-white"
              />
              {errors.phone && (
                <p className="text-[11px] text-red-600 mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
              Address Line 1 (House, Apartment, Street) *
            </label>
            <input
              type="text"
              value={form.addressLine1}
              onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
              placeholder="e.g. Penthouse 4B, The Regent Residences, Barakhamba Road"
              className="input-heaven text-xs w-full py-2.5 px-3 bg-white"
            />
            {errors.addressLine1 && (
              <p className="text-[11px] text-red-600 mt-1">{errors.addressLine1}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
              Address Line 2 (Suite, Landmark, Area)
            </label>
            <input
              type="text"
              value={form.addressLine2}
              onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
              placeholder="e.g. Near French Embassy"
              className="input-heaven text-xs w-full py-2.5 px-3 bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                City *
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. New Delhi"
                className="input-heaven text-xs w-full py-2.5 px-3 bg-white"
              />
              {errors.city && (
                <p className="text-[11px] text-red-600 mt-1">{errors.city}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                State *
              </label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                placeholder="e.g. Delhi"
                className="input-heaven text-xs w-full py-2.5 px-3 bg-white"
              />
              {errors.state && (
                <p className="text-[11px] text-red-600 mt-1">{errors.state}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                PIN Code *
              </label>
              <input
                type="text"
                maxLength={6}
                value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                placeholder="e.g. 110001"
                className="input-heaven text-xs w-full py-2.5 px-3 bg-white"
              />
              {errors.postalCode && (
                <p className="text-[11px] text-red-600 mt-1">{errors.postalCode}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
              Delivery Instructions (Optional)
            </label>
            <input
              type="text"
              value={form.deliveryInstructions}
              onChange={(e) => setForm({ ...form, deliveryInstructions: e.target.value })}
              placeholder="e.g. Hand over directly to recipient; ring private bell."
              className="input-heaven text-xs w-full py-2.5 px-3 bg-white"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-700">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="w-4 h-4 text-black border-neutral-300 rounded"
              />
              <span>Set as default delivery address</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="btn-heaven-primary py-2.5 px-6 text-xs uppercase tracking-wider"
            >
              {loading ? 'Saving...' : 'Save Address'}
            </button>
          </div>
        </form>
      )}

      {/* Address Cards List */}
      {addresses.length === 0 ? (
        <div className="bg-neutral-50 border border-neutral-100 p-8 text-center space-y-2">
          <MapPin className="w-8 h-8 text-neutral-300 mx-auto" />
          <div className="text-sm font-semibold text-neutral-800">No Saved Addresses</div>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            You do not have any saved delivery addresses yet. Add your preferred destination for swift checkout.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="bg-white border border-neutral-200 p-5 space-y-3 relative hover:border-neutral-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-cinzel text-sm font-semibold text-neutral-950">
                      {addr.recipientName}
                    </span>
                    {addr.isDefault && (
                      <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 bg-neutral-900 text-white font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500">{addr.phone}</div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(addr.id)}
                  disabled={deletingId === addr.id}
                  className="text-neutral-400 hover:text-red-600 transition-colors p-1"
                  title="Remove address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-neutral-700 leading-relaxed border-t border-neutral-100 pt-2">
                <div>{addr.addressLine1}</div>
                {addr.addressLine2 && <div>{addr.addressLine2}</div>}
                <div>
                  {addr.city}, {addr.state} {addr.postalCode}
                </div>
                {addr.deliveryInstructions && (
                  <div className="text-[11px] text-neutral-500 italic mt-1">
                    Instructions: &ldquo;{addr.deliveryInstructions}&rdquo;
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
