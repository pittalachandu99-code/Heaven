'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminReportsPage() {
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/reports?period=${period}`);
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
    fetchReports();
  }, [period]);

  const metrics = data?.metrics || {
    totalOrdersCount: 0,
    deliveredCount: 0,
    cancelledCount: 0,
    activeCount: 0,
    eligibleRevenue: 0,
    collectedPayments: 0,
    codPendingCollection: 0,
    averageOrderValue: 0,
  };

  return (
    <AdminLayout
      title="Sales Reports &amp; Financial Analytics"
      breadcrumbs={[{ label: 'Reports' }]}
    >
      {/* Top Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-cinzel text-xl text-neutral-900 font-semibold">
            Executive Sales Performance
          </h2>
          <p className="text-xs text-neutral-500 font-light mt-0.5">
            Audit recorded acquisition volume, demo collection timelines, and best-performing flacons.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex bg-white border border-neutral-200 rounded p-1 text-xs">
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'this_month', label: 'This Month' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`py-1.5 px-3 rounded text-[11px] font-medium transition-colors ${
                  period === p.id
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-500 hover:text-black'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <a
            href={`/api/admin/reports/export?period=${period}`}
            download
            className="btn-heaven-primary py-2 px-4 text-xs tracking-wider uppercase inline-flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Mandatory Demo Labeling Alert */}
      <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-md text-xs text-amber-900 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-[#C5A059] flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong className="font-semibold block uppercase tracking-wider text-[11px]">
            Demonstration Financial Disclosure
          </strong>
          <p className="text-amber-800 text-[11px] leading-relaxed">
            All order values represent demonstration simulated checkouts. No real money has been collected. Cancelled orders are strictly excluded from eligible revenue metrics.
          </p>
        </div>
      </div>

      {/* 4 Financial Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-5 rounded-lg shadow-sm space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium">
            Recorded Order Revenue
          </div>
          <div className="font-cinzel text-2xl font-bold text-neutral-950">
            {formatINR(metrics.eligibleRevenue)}
          </div>
          <div className="text-[10px] text-neutral-400">
            Across {metrics.totalOrdersCount - metrics.cancelledCount} eligible acquisitions
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-5 rounded-lg shadow-sm space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium">
            Collected Demo Payments
          </div>
          <div className="font-cinzel text-2xl font-bold text-emerald-950">
            {formatINR(metrics.collectedPayments)}
          </div>
          <div className="text-[10px] text-neutral-400">
            Authorized UPI, Cards &amp; fulfilled COD
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-5 rounded-lg shadow-sm space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium">
            COD Pending Collection
          </div>
          <div className="font-cinzel text-2xl font-bold text-amber-950">
            {formatINR(metrics.codPendingCollection)}
          </div>
          <div className="text-[10px] text-neutral-400">
            To be collected on white-glove handover
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-5 rounded-lg shadow-sm space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium">
            Average Order Value
          </div>
          <div className="font-cinzel text-2xl font-bold text-neutral-950">
            {formatINR(metrics.averageOrderValue)}
          </div>
          <div className="text-[10px] text-neutral-400">
            Per completed customer allocation
          </div>
        </div>
      </div>

      {/* Order Status Distribution Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 p-4 rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-md">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <div>
              <div className="text-neutral-500">Delivered Orders</div>
              <div className="font-cinzel text-lg font-bold text-neutral-950">
                {metrics.deliveredCount}
              </div>
            </div>
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold uppercase">Fulfilled</span>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-md">
              <Clock className="w-4 h-4" />
            </span>
            <div>
              <div className="text-neutral-500">In Pipeline / Transit</div>
              <div className="font-cinzel text-lg font-bold text-neutral-950">
                {metrics.activeCount}
              </div>
            </div>
          </div>
          <span className="text-[10px] text-indigo-700 font-semibold uppercase">Active</span>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-rose-50 text-rose-700 rounded-md">
              <XCircle className="w-4 h-4" />
            </span>
            <div>
              <div className="text-neutral-500">Cancelled Allocations</div>
              <div className="font-cinzel text-lg font-bold text-neutral-950">
                {metrics.cancelledCount}
              </div>
            </div>
          </div>
          <span className="text-[10px] text-rose-700 font-semibold uppercase">Restored</span>
        </div>
      </div>

      {/* Two-Column Section: Sales Trend & Top-Selling Flacons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Trend Bar Visualizer */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-lg p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#C5A059]" />
              <h3 className="font-cinzel text-sm font-semibold text-neutral-900">
                Daily Sales Velocity
              </h3>
            </div>
            <span className="text-[11px] text-neutral-400">Aggregated Timeline</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-neutral-400">Loading sales velocity...</div>
          ) : !data?.salesTrend || data.salesTrend.length === 0 ? (
            <div className="p-12 text-center text-xs text-neutral-400">
              No orders recorded within this timeframe.
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {data.salesTrend.map((t: any) => {
                const maxRev = Math.max(...data.salesTrend.map((s: any) => s.revenue), 1);
                const pct = Math.min(100, (t.revenue / maxRev) * 100);

                return (
                  <div key={t.date} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-neutral-800">{t.date}</span>
                      <span className="font-cinzel font-semibold text-neutral-900">
                        {formatINR(t.revenue)} ({t.count} orders)
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-neutral-900 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(8, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top-Selling Fragrances */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <h3 className="font-cinzel text-sm font-semibold text-neutral-900">
                Bestselling Flacons
              </h3>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-neutral-400">Loading bestsellers...</div>
          ) : !data?.topProducts || data.topProducts.length === 0 ? (
            <div className="p-12 text-center text-xs text-neutral-400">
              No product sales in selected period.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 space-y-2">
              {data.topProducts.map((p: any, idx: number) => (
                <div key={p.name} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-cinzel font-semibold text-neutral-900">
                      0{idx + 1}. {p.name}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      Volume: {p.quantity} flacons sold
                    </div>
                  </div>
                  <div className="font-cinzel font-semibold text-neutral-900">
                    {formatINR(p.revenue)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
