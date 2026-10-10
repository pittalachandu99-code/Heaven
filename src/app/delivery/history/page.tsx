'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DeliveryLayout from '@/components/delivery/DeliveryLayout';
import {
  Clock,
  Search,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Package,
  MapPin,
  DollarSign,
} from 'lucide-react';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DeliveryHistoryPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [search, setSearch] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/delivery/earnings?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setDeliveries(data.deliveries || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [period]);

  const filteredDeliveries = deliveries.filter((d) => {
    if (!search.trim()) return true;
    return d.orderNumber.toLowerCase().includes(search.toLowerCase().trim());
  });

  return (
    <DeliveryLayout
      title="Delivery History &amp; Handover Archive"
      breadcrumbs={[{ label: 'History' }]}
    >
      {/* Search and Period Filter Toolbar */}
      <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search history by Order #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs border border-neutral-200 rounded focus:border-black outline-none"
            />
          </div>

          <div className="inline-flex bg-neutral-100 p-1 rounded text-xs">
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'all', label: 'All Time' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`py-1.5 px-3 rounded text-[11px] font-medium transition-colors ${
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
      </div>

      {/* History Table */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-neutral-400">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading Delivery Archive...
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="p-16 text-center text-xs text-neutral-400 space-y-2">
            <Clock className="w-8 h-8 text-neutral-300 mx-auto" />
            <div className="font-semibold text-neutral-700">No Completed Runs Found</div>
            <p className="max-w-md mx-auto">
              Completed flacon handovers for the selected period will appear here with audited timestamps and demo earnings.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Recipient &amp; Destination</th>
                  <th className="py-3 px-4">Flacons</th>
                  <th className="py-3 px-4">Completion Date</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4 text-right">Demo Compensation</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredDeliveries.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-cinzel font-semibold text-neutral-900">
                      #{item.orderNumber}
                    </td>

                    <td className="py-3.5 px-4 text-neutral-700">
                      <div className="font-medium text-neutral-900">{item.recipient}</div>
                      <div className="text-[10px] text-neutral-400">{item.city}</div>
                    </td>

                    <td className="py-3.5 px-4 text-neutral-600">
                      {item.itemsCount} {item.itemsCount === 1 ? 'flacon' : 'flacons'}
                    </td>

                    <td className="py-3.5 px-4 text-neutral-500">
                      {item.deliveredAt
                        ? new Date(item.deliveredAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[9px] uppercase px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Delivered &amp; Signed
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-cinzel font-semibold text-emerald-800">
                      {formatINR(item.demoEarnings)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/delivery/orders/${item.orderId}`}
                        className="btn-heaven-secondary py-1 px-2.5 text-[10px] inline-flex items-center gap-1"
                      >
                        <span>Details</span>
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
