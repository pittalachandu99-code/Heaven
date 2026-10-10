'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  const [search, setSearch] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.set('q', search);
      if (selectedEntity) params.set('entityType', selectedEntity);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, selectedEntity]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((p) => ({ ...p, page: 1 }));
    fetchLogs();
  };

  return (
    <AdminLayout
      title="Administrative Audit Trail"
      breadcrumbs={[{ label: 'Audit Logs' }]}
    >
      <div>
        <h2 className="font-cinzel text-xl text-neutral-900 font-semibold">
          Security &amp; Operational Audit Trail ({pagination.total})
        </h2>
        <p className="text-xs text-neutral-500 font-light mt-0.5">
          Immutable ledger recording all administrative product mutations, status transitions, stock alterations, and courier allocations.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-neutral-200 p-4 rounded-lg shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search audit trail by summary details, actor, or action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-neutral-200 rounded focus:border-black outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedEntity}
              onChange={(e) => {
                setSelectedEntity(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="py-2 px-3 text-xs border border-neutral-200 rounded bg-white text-neutral-800 focus:border-black outline-none"
            >
              <option value="">All Entity Types</option>
              <option value="PRODUCT">PRODUCT</option>
              <option value="CATEGORY">CATEGORY</option>
              <option value="ORDER">ORDER</option>
              <option value="INVENTORY">INVENTORY</option>
              <option value="SETTINGS">SETTINGS</option>
            </select>

            <button
              type="submit"
              className="py-2 px-4 bg-neutral-900 hover:bg-black text-white text-xs uppercase tracking-wider font-semibold rounded"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-neutral-400">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading Audit Ledger...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center text-xs text-neutral-400 space-y-2">
            <ShieldCheck className="w-8 h-8 mx-auto text-neutral-300" />
            <div className="font-semibold text-neutral-700">No Audit Events Found</div>
            <p>Important administrative actions will automatically be recorded here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Safe Summary Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3 px-4 text-neutral-500 whitespace-nowrap font-sans text-xs">
                      {new Date(log.createdAt).toLocaleString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    <td className="py-3 px-4 font-sans text-xs">
                      <div className="font-semibold text-neutral-900">
                        {log.user?.fullName || 'System Administrator'}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        {log.user?.email || 'admin@heaven.com'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-neutral-900 text-white text-[10px] uppercase font-bold rounded">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-neutral-700">
                      <span className="font-semibold">{log.entityType}</span>
                      {log.entityId && (
                        <span className="text-[10px] text-neutral-400 ml-1">
                          ({log.entityId.slice(0, 10)}...)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-sans text-xs text-neutral-800 max-w-md truncate">
                      {log.details || 'Operational transaction committed'}
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
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total log entries)
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
