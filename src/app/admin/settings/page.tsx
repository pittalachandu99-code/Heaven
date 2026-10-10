'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Settings,
  Save,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Truck,
  CreditCard,
  Building,
  Sparkles,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [form, setForm] = useState({
    storeName: 'HEAVEN',
    storeEmail: 'concierge@heavenperfume.com',
    storePhone: '+91 800-HEAVEN-0',
    shippingFee: '250',
    freeShippingThreshold: '5000',
    lowStockThreshold: '10',
    enableDemoUpi: true,
    enableDemoCard: true,
    enableDemoCod: true,
    partnerEarningPerDelivery: '180',
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          const s = data.settings;
          setForm({
            storeName: s.storeName || 'HEAVEN',
            storeEmail: s.storeEmail || 'concierge@heavenperfume.com',
            storePhone: s.storePhone || '+91 800-HEAVEN-0',
            shippingFee: s.shippingFee?.toString() || '250',
            freeShippingThreshold: s.freeShippingThreshold?.toString() || '5000',
            lowStockThreshold: s.lowStockThreshold?.toString() || '10',
            enableDemoUpi: s.enableDemoUpi ?? true,
            enableDemoCard: s.enableDemoCard ?? true,
            enableDemoCod: s.enableDemoCod ?? true,
            partnerEarningPerDelivery: s.partnerEarningPerDelivery?.toString() || '180',
          });
        }
      } catch {
        setNotification({ type: 'error', message: 'Failed to load store settings.' });
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setNotification(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setNotification({ type: 'error', message: data.error || 'Failed to save settings.' });
        setSubmitting(false);
        return;
      }

      setNotification({ type: 'success', message: 'Store settings saved successfully.' });
    } catch {
      setNotification({ type: 'error', message: 'A network error occurred.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout
      title="Boutique &amp; Operational Settings"
      breadcrumbs={[{ label: 'Settings' }]}
    >
      <div>
        <h2 className="font-cinzel text-xl text-neutral-900 font-semibold">
          Global Store Configuration
        </h2>
        <p className="text-xs text-neutral-500 font-light mt-0.5">
          Configure concierge contact coordinates, shipping fee thresholds, and demonstration payment options.
        </p>
      </div>

      {notification && (
        <div
          className={`p-4 border text-xs flex items-start gap-3 rounded ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-xs text-neutral-400">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading Store Configuration...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl text-xs">
          {/* Identity & Concierge Coordinates */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 font-cinzel font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
              <Building className="w-4 h-4 text-[#C5A059]" />
              <span>Maison Brand &amp; Concierge Coordinates</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                  Brand Display Name *
                </label>
                <input
                  type="text"
                  value={form.storeName}
                  onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                  className="input-heaven w-full py-2 px-3 text-xs bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                  Concierge Support Email *
                </label>
                <input
                  type="email"
                  value={form.storeEmail}
                  onChange={(e) => setForm({ ...form, storeEmail: e.target.value })}
                  className="input-heaven w-full py-2 px-3 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                  Concierge Phone *
                </label>
                <input
                  type="text"
                  value={form.storePhone}
                  onChange={(e) => setForm({ ...form, storePhone: e.target.value })}
                  className="input-heaven w-full py-2 px-3 text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* Shipping & Delivery Economics */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 font-cinzel font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
              <Truck className="w-4 h-4 text-[#C5A059]" />
              <span>Logistics &amp; Threshold Rules</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                  Standard Courier Fee (INR ₹) *
                </label>
                <input
                  type="number"
                  value={form.shippingFee}
                  onChange={(e) => setForm({ ...form, shippingFee: e.target.value })}
                  className="input-heaven w-full py-2 px-3 text-xs bg-white font-mono"
                />
                <p className="text-[10px] text-neutral-400 mt-1">Charged for orders below threshold</p>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                  Complimentary Shipping Threshold (INR ₹) *
                </label>
                <input
                  type="number"
                  value={form.freeShippingThreshold}
                  onChange={(e) => setForm({ ...form, freeShippingThreshold: e.target.value })}
                  className="input-heaven w-full py-2 px-3 text-xs bg-white font-mono"
                />
                <p className="text-[10px] text-neutral-400 mt-1">Complimentary dispatch when order exceeds this</p>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                  Low Stock Alert Threshold *
                </label>
                <input
                  type="number"
                  value={form.lowStockThreshold}
                  onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                  className="input-heaven w-full py-2 px-3 text-xs bg-white font-mono"
                />
                <p className="text-[10px] text-neutral-400 mt-1">Triggers depletion alert</p>
              </div>
            </div>
          </div>

          {/* Demonstration Checkout Availability */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 font-cinzel font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
              <CreditCard className="w-4 h-4 text-[#C5A059]" />
              <span>Demonstration Payment Gateways</span>
            </div>

            <p className="text-[11px] text-neutral-500">
              Control which simulated payment methods appear on the customer checkout screen.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <label className="p-3 border border-neutral-200 rounded flex items-center gap-2.5 cursor-pointer hover:bg-neutral-50">
                <input
                  type="checkbox"
                  checked={form.enableDemoUpi}
                  onChange={(e) => setForm({ ...form, enableDemoUpi: e.target.checked })}
                  className="w-4 h-4 text-black rounded"
                />
                <div>
                  <div className="font-semibold text-neutral-900">Simulated UPI</div>
                  <div className="text-[10px] text-neutral-400">QR / VPA instant demo</div>
                </div>
              </label>

              <label className="p-3 border border-neutral-200 rounded flex items-center gap-2.5 cursor-pointer hover:bg-neutral-50">
                <input
                  type="checkbox"
                  checked={form.enableDemoCard}
                  onChange={(e) => setForm({ ...form, enableDemoCard: e.target.checked })}
                  className="w-4 h-4 text-black rounded"
                />
                <div>
                  <div className="font-semibold text-neutral-900">Simulated Card</div>
                  <div className="text-[10px] text-neutral-400">Credit / Debit demo</div>
                </div>
              </label>

              <label className="p-3 border border-neutral-200 rounded flex items-center gap-2.5 cursor-pointer hover:bg-neutral-50">
                <input
                  type="checkbox"
                  checked={form.enableDemoCod}
                  onChange={(e) => setForm({ ...form, enableDemoCod: e.target.checked })}
                  className="w-4 h-4 text-black rounded"
                />
                <div>
                  <div className="font-semibold text-neutral-900">Demo Cash on Delivery</div>
                  <div className="text-[10px] text-neutral-400">Handover collection demo</div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-heaven-primary py-2.5 px-6 text-xs uppercase tracking-wider inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-[#C5A059]" />
              <span>{submitting ? 'Saving Configuration...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      )}
    </AdminLayout>
  );
}
