'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Package,
} from 'lucide-react';

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [recentMovements, setRecentMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');

  // Adjustment Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [adjustmentType, setAdjustmentType] = useState('STOCK_RECEIVED');
  const [quantity, setQuantity] = useState('10');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.set('q', search);
      if (selectedFilter) params.set('filter', selectedFilter);

      const res = await fetch(`/api/admin/inventory?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setRecentMovements(data.recentMovements || []);
        setPagination(data.pagination);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [pagination.page, selectedFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((p) => ({ ...p, page: 1 }));
    fetchInventory();
  };

  const openAdjustmentModal = (prod?: any) => {
    setSelectedProduct(prod || products[0] || null);
    setAdjustmentType('STOCK_RECEIVED');
    setQuantity('10');
    setReason('');
    setModalError('');
    setModalOpen(true);
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setSubmitting(true);
    setModalError('');

    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          adjustmentType,
          quantity: parseInt(quantity, 10),
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error || 'Failed to adjust inventory.');
        setSubmitting(false);
        return;
      }

      setNotification({ type: 'success', message: data.message });
      setModalOpen(false);
      fetchInventory();
    } catch {
      setModalError('A network error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout
      title="Cellar Reserves &amp; Inventory"
      breadcrumbs={[{ label: 'Inventory' }]}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-cinzel text-xl text-neutral-900 font-semibold">
            Flacon Inventory Management ({pagination.total})
          </h2>
          <p className="text-xs text-neutral-500 font-light mt-0.5">
            Monitor stock balances, audit cellar replenishments, and log damaged or corrected allocations.
          </p>
        </div>

        <button
          onClick={() => openAdjustmentModal()}
          className="btn-heaven-primary py-2.5 px-5 text-xs tracking-wider uppercase inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#C5A059]" />
          <span>Record Adjustment</span>
        </button>
      </div>

      {/* Notification Toast */}
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

      {/* Filter and Search Bar */}
      <div className="bg-white border border-neutral-200 p-4 rounded-lg shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search inventory by flacon title or SKU code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-neutral-200 rounded focus:border-black outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedFilter}
              onChange={(e) => {
                setSelectedFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="py-2 px-3 text-xs border border-neutral-200 rounded bg-white text-neutral-800 focus:border-black outline-none"
            >
              <option value="">All Stock Levels</option>
              <option value="low_stock">Low Stock (&le;10)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
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

      {/* Inventory Table */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-neutral-400">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading Cellar Reserves...
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center text-xs text-neutral-400 space-y-2">
            <Boxes className="w-8 h-8 mx-auto text-neutral-300" />
            <div className="font-semibold text-neutral-700">No Stock Records Found</div>
            <p>Try modifying your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Flacon &amp; SKU</th>
                  <th className="py-3 px-4">Olfactive Category</th>
                  <th className="py-3 px-4">Current Cellar Stock</th>
                  <th className="py-3 px-4">Threshold</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((p) => {
                  const isLow = p.stockQuantity <= (p.lowStockThreshold || 10) && p.stockQuantity > 0;
                  const isOut = p.stockQuantity <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-cinzel text-xs font-semibold text-neutral-900">
                          {p.name}
                        </div>
                        <div className="font-mono text-[11px] text-neutral-500 mt-0.5">
                          {p.sku || 'N/A'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-neutral-600">
                        {p.category?.name || 'Unassigned'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`font-bold font-mono text-sm ${
                            isOut
                              ? 'text-rose-700'
                              : isLow
                              ? 'text-amber-700'
                              : 'text-neutral-950'
                          }`}
                        >
                          {p.stockQuantity}
                        </span>
                        <span className="text-[10px] text-neutral-400 ml-1">flacons</span>
                      </td>

                      <td className="py-3.5 px-4 text-neutral-500">
                        {p.lowStockThreshold || 10} units
                      </td>

                      <td className="py-3.5 px-4">
                        {isOut ? (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold uppercase rounded">
                            Depleted
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase rounded">
                            Low Reserve
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold uppercase rounded">
                            Healthy
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openAdjustmentModal(p)}
                          className="btn-heaven-secondary py-1 px-3 text-[11px] tracking-wider uppercase inline-flex items-center gap-1"
                        >
                          <span>Adjust</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Inventory Movements History */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#C5A059]" />
            <h3 className="font-cinzel text-sm font-semibold text-neutral-900">
              Audited Cellar Movements Log
            </h3>
          </div>
          <span className="text-[11px] text-neutral-400">Immutable ledger</span>
        </div>

        {recentMovements.length === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-400">
            No stock movements recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 text-xs">
            {recentMovements.map((m) => {
              const isIncrease = m.changeQuantity > 0;
              return (
                <div key={m.id} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`p-1.5 rounded ${
                        isIncrease ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {isIncrease ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      )}
                    </span>
                    <div>
                      <div className="font-semibold text-neutral-900">
                        {m.product?.name || 'Product'} ({m.product?.sku || 'N/A'})
                      </div>
                      <div className="text-[11px] text-neutral-500">{m.reason}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-bold font-mono ${
                        isIncrease ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {isIncrease ? `+${m.changeQuantity}` : m.changeQuantity} units
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      Balance: {m.balanceAfter} &bull; {new Date(m.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 max-w-md w-full p-6 rounded-lg space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-cinzel text-base font-semibold text-neutral-900">
                Cellar Stock Adjustment
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAdjustmentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                  Select Fragrance Flacon *
                </label>
                <select
                  value={selectedProduct?.id || ''}
                  onChange={(e) => {
                    const found = products.find((p) => p.id === e.target.value);
                    setSelectedProduct(found || null);
                  }}
                  className="input-heaven w-full py-2 px-3 text-xs bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) &bull; Current Stock: {p.stockQuantity}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                    Adjustment Type *
                  </label>
                  <select
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value)}
                    className="input-heaven w-full py-2 px-3 text-xs bg-white font-medium"
                  >
                    <option value="STOCK_RECEIVED">Stock Received (+)</option>
                    <option value="CORRECTION_INCREASE">Correction Increase (+)</option>
                    <option value="CORRECTION_DECREASE">Correction Decrease (-)</option>
                    <option value="DAMAGED_STOCK">Damaged Stock (-)</option>
                    <option value="REMOVED_FROM_SALE">Removed From Sale (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="input-heaven w-full py-2 px-3 text-xs bg-white font-semibold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                  Audited Reason / Reference Note *
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Atelier cellar shipment batch #HVN-2026-B"
                  className="input-heaven w-full py-2 px-3 text-xs bg-white"
                  required
                />
              </div>

              {selectedProduct && (
                <div className="p-3 bg-neutral-50 border border-neutral-100 rounded text-[11px] flex justify-between items-center text-neutral-700">
                  <span>Resulting Cellar Balance:</span>
                  <span className="font-bold font-mono text-neutral-900">
                    {adjustmentType.includes('INCREASE') || adjustmentType === 'STOCK_RECEIVED'
                      ? selectedProduct.stockQuantity + (parseInt(quantity, 10) || 0)
                      : Math.max(0, selectedProduct.stockQuantity - (parseInt(quantity, 10) || 0))}{' '}
                    flacons
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-heaven-secondary py-2 px-4 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-heaven-primary py-2 px-5 text-xs uppercase tracking-wider"
                >
                  {submitting ? 'Applying...' : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
