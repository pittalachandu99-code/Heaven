'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DeliveryLayout from '@/components/delivery/DeliveryLayout';
import {
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ExternalLink,
  Info,
  Clock,
  ShieldCheck,
} from 'lucide-react';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DeliveryEarningsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/delivery/earnings?period=${period}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [period]);

  const summary = data?.summary || {
    totalEarnings: 0,
    todayEarnings: 0,
    completedCount: 0,
    ratePerDelivery: 180,
  };
  const deliveries = data?.deliveries || [];

  return (
    <DeliveryLayout
      title="Courier Demonstration Compensation &amp; Earnings"
      breadcrumbs={[{ label: 'Earnings' }]}
    >
      {/* Simulation Notice Disclaimer */}
      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start gap-3 text-xs text-amber-900">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold uppercase tracking-wider text-[11px]">
            Operational Simulation Notice
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            All compensation amounts displayed here are demonstration figures calculated at the configured rate of{' '}
            <span className="font-semibold">{formatINR(summary.ratePerDelivery)} per completed white-glove handover</span>.
            This terminal simulates courier logistics telemetry and does not connect to bank accounts or process actual payroll disbursements.
          </p>
        </div>
      </div>

      {/* Period Filter & Metric Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-cinzel text-xl text-neutral-900 font-semibold">
            Earnings Overview
          </h2>
          <p className="text-xs text-neutral-500 font-light mt-0.5">
            Audit simulated white-glove courier fees earned across completed customer dispatches.
          </p>
        </div>

        <div className="inline-flex bg-white border border-neutral-200 p-1 rounded text-xs shadow-sm">
          {[
            { id: 'today', label: 'Today' },
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: 'all', label: 'All Time' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`py-1.5 px-3.5 rounded text-[11px] font-medium transition-colors ${
                period === p.id
                  ? 'bg-neutral-900 text-white font-semibold'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500 text-xs uppercase tracking-wider font-medium">
            <span>Period Demo Earnings</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-cinzel text-3xl font-bold text-neutral-900">
            {formatINR(summary.totalEarnings)}
          </div>
          <div className="text-[11px] text-neutral-400">
            Across {summary.completedCount} completed handovers
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500 text-xs uppercase tracking-wider font-medium">
            <span>Today's Earnings</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="font-cinzel text-3xl font-bold text-neutral-900">
            {formatINR(summary.todayEarnings)}
          </div>
          <div className="text-[11px] text-neutral-400">Simulated today</div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500 text-xs uppercase tracking-wider font-medium">
            <span>Demo Fee Per Delivery</span>
            <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div className="font-cinzel text-3xl font-bold text-neutral-900">
            {formatINR(summary.ratePerDelivery)}
          </div>
          <div className="text-[11px] text-neutral-400">Configured in store settings</div>
        </div>
      </div>

      {/* Qualifying Delivery Breakdown */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="font-cinzel text-base font-semibold text-neutral-900">
            Completed Run Compensation Breakdown ({deliveries.length})
          </h3>
          <span className="text-[11px] text-neutral-400">Audited completed dispatches</span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-xs text-neutral-400">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Calculating Earnings Records...
          </div>
        ) : deliveries.length === 0 ? (
          <div className="p-16 text-center text-xs text-neutral-400 space-y-2">
            <DollarSign className="w-8 h-8 text-neutral-300 mx-auto" />
            <div className="font-semibold text-neutral-700">No Qualifying Deliveries in Period</div>
            <p className="max-w-md mx-auto">
              Complete assigned order handovers to accumulate simulated courier earnings.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Order Number</th>
                  <th className="py-2.5 px-3">Client &amp; City</th>
                  <th className="py-2.5 px-3">Delivered Timestamp</th>
                  <th className="py-2.5 px-3">Order Total</th>
                  <th className="py-2.5 px-3 text-right">Demo Partner Fee</th>
                  <th className="py-2.5 px-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {deliveries.map((d: any) => (
                  <tr key={d.id} className="hover:bg-neutral-50/50">
                    <td className="py-3 px-3 font-cinzel font-semibold text-neutral-900">
                      #{d.orderNumber}
                    </td>
                    <td className="py-3 px-3 text-neutral-700">
                      <div>{d.recipient}</div>
                      <div className="text-[10px] text-neutral-400">{d.city}</div>
                    </td>
                    <td className="py-3 px-3 text-neutral-500">
                      {new Date(d.deliveredAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3 font-cinzel text-neutral-900">
                      {formatINR(d.orderTotal)}
                    </td>
                    <td className="py-3 px-3 text-right font-cinzel font-semibold text-emerald-800">
                      +{formatINR(d.demoEarnings)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/delivery/orders/${d.orderId}`}
                        className="btn-heaven-secondary py-1 px-2.5 text-[10px] inline-flex items-center gap-1"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DeliveryLayout>
  );
}
