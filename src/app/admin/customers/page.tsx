'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Users,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Clock,
  Sparkles,
} from 'lucide-react';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.set('q', search);

      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers);
        setPagination(data.pagination);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchCustomers();
  };

  return (
    <AdminLayout
      title="Client Dossiers &amp; Patronage"
      breadcrumbs={[{ label: 'Customers' }]}
    >
      <div>
        <h2 className="font-cinzel text-xl text-neutral-900 font-semibold">
          Registered Client Dossiers ({pagination.total})
        </h2>
        <p className="text-xs text-neutral-500 font-light mt-0.5">
          View private lounge customer profiles, lifetime allocations, and olfactory preferences.
        </p>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white border border-neutral-200 p-4 rounded-lg shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search clients by name, email, or telephone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-neutral-200 rounded focus:border-black outline-none"
            />
          </div>
          <button
            type="submit"
            className="py-2 px-5 bg-neutral-900 hover:bg-black text-white text-xs uppercase tracking-wider font-semibold rounded"
          >
            Search
          </button>
        </form>
      </div>

      {/* Customer Table */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-neutral-400">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading Client Dossiers...
          </div>
        ) : customers.length === 0 ? (
          <div className="p-16 text-center text-xs text-neutral-400 space-y-2">
            <Users className="w-8 h-8 mx-auto text-neutral-300" />
            <div className="font-semibold text-neutral-700">No Clients Found</div>
            <p>Try modifying your search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Contact Coordinates</th>
                  <th className="py-3 px-4">Member Since</th>
                  <th className="py-3 px-4">Acquisitions</th>
                  <th className="py-3 px-4">Recorded Order Spend</th>
                  <th className="py-3 px-4">Olfactory Notes</th>
                  <th className="py-3 px-4 text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-neutral-900">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center font-cinzel text-[10px]">
                          {c.fullName.charAt(0)}
                        </div>
                        <span>{c.fullName}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-neutral-600">
                      <div>{c.email}</div>
                      {c.phone && <div className="text-[10px] text-neutral-400">{c.phone}</div>}
                    </td>

                    <td className="py-3 px-4 text-neutral-500">
                      {new Date(c.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-neutral-900">{c.orderCount}</span>
                      <span className="text-neutral-400 text-[10px] ml-1">orders</span>
                    </td>

                    <td className="py-3 px-4 font-cinzel font-semibold text-neutral-900">
                      {formatINR(c.totalSpend)}
                    </td>

                    <td className="py-3 px-4 text-[11px] text-neutral-500 max-w-xs truncate">
                      {c.preferredNotes ? (
                        <span className="text-[#C5A059] font-medium">{c.preferredNotes}</span>
                      ) : (
                        <span className="italic text-neutral-400">Standard preference</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/customers/${c.id}`}
                        className="btn-heaven-secondary py-1.5 px-3 text-[11px] tracking-wider inline-flex items-center gap-1"
                      >
                        <span>Profile</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-neutral-200 bg-neutral-50/50 flex items-center justify-between text-xs">
            <span className="text-neutral-500">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} clients)
            </span>

            <div className="flex items-center gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="p-1.5 border border-neutral-200 rounded disabled:opacity-40 hover:bg-white"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="p-1.5 border border-neutral-200 rounded disabled:opacity-40 hover:bg-white"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
