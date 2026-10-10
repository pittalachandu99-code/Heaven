'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Archive,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sort, setSort] = useState('newest');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort,
      });
      if (search) params.set('q', search);
      if (selectedCategory) params.set('categoryId', selectedCategory);
      if (selectedStatus) params.set('status', selectedStatus);

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setPagination(data.pagination);
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to load products.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [pagination.page, selectedCategory, selectedStatus, sort]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchProducts();
  };

  const handleTogglePublish = async (productId: string, currentPublished: boolean) => {
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !currentPublished }),
      });
      if (res.ok) {
        setNotification({
          type: 'success',
          message: `Product ${!currentPublished ? 'published' : 'unpublished'} successfully.`,
        });
        fetchProducts();
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to update publish status.' });
    }
  };

  const handleDelete = async (productId: string, name: string) => {
    if (!confirm(`Are you certain you wish to remove or archive "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setNotification({
          type: 'success',
          message: data.message || 'Product deleted or safely archived.',
        });
        fetchProducts();
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to delete product.' });
      }
    } catch {
      setNotification({ type: 'error', message: 'A network error occurred.' });
    }
  };

  return (
    <AdminLayout
      title="Flacon Catalogue Management"
      breadcrumbs={[{ label: 'Products' }]}
    >
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-cinzel text-xl text-neutral-900 font-semibold">
            Fragrance Inventory ({pagination.total})
          </h2>
          <p className="text-xs text-neutral-500 font-light mt-0.5">
            Manage allocations, olfactive realms, pricing, and stock status.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="btn-heaven-primary py-2.5 px-5 text-xs tracking-wider uppercase inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#C5A059]" />
          <span>New Flacon</span>
        </Link>
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

      {/* Filters & Search Toolbar */}
      <div className="bg-white border border-neutral-200 p-4 rounded-lg shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by perfume name, SKU, slug, or fragrance note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-neutral-200 rounded focus:border-black outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="py-2 px-3 text-xs border border-neutral-200 rounded bg-white text-neutral-800 focus:border-black outline-none"
            >
              <option value="">All Olfactive Families</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="py-2 px-3 text-xs border border-neutral-200 rounded bg-white text-neutral-800 focus:border-black outline-none"
            >
              <option value="">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft / Hidden</option>
              <option value="low_stock">Low Stock (&le;10)</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="py-2 px-3 text-xs border border-neutral-200 rounded bg-white text-neutral-800 focus:border-black outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="stock_asc">Stock: Low to High</option>
              <option value="stock_desc">Stock: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
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

      {/* Product Table */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-neutral-400">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading Fragrance Dossiers...
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center text-xs text-neutral-400 space-y-2">
            <Package className="w-8 h-8 mx-auto text-neutral-300" />
            <div className="font-semibold text-neutral-700">No Fragrances Found</div>
            <p>Try adjusting your search query or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Flacon</th>
                  <th className="py-3 px-4">SKU / Family</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Cellar Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((p) => {
                  const isLow = p.stockQuantity <= (p.lowStockThreshold || 10);
                  const isOut = p.stockQuantity <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 bg-neutral-50 border border-neutral-200 rounded overflow-hidden flex-shrink-0">
                            <Image
                              src={p.primaryImage || '/perfumes/heaven-bottle-1.jpg'}
                              alt={p.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-cinzel text-xs font-semibold text-neutral-900">
                              {p.name}
                            </div>
                            <div className="text-[10px] text-neutral-400">
                              {p.category?.name} &bull; {p.size}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] font-medium text-neutral-800">
                          {p.sku || 'N/A'}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {p.fragranceFamily}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-cinzel font-semibold text-neutral-900">
                        {formatINR(p.price)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold ${
                              isOut
                                ? 'text-rose-700'
                                : isLow
                                ? 'text-amber-700'
                                : 'text-neutral-900'
                            }`}
                          >
                            {p.stockQuantity}
                          </span>
                          {isOut ? (
                            <span className="text-[9px] uppercase px-1.5 py-0.2 bg-rose-100 text-rose-800 font-bold rounded">
                              Out
                            </span>
                          ) : isLow ? (
                            <span className="text-[9px] uppercase px-1.5 py-0.2 bg-amber-100 text-amber-800 font-bold rounded">
                              Low
                            </span>
                          ) : (
                            <span className="text-[9px] uppercase px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-bold rounded">
                              Good
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {p.isArchived ? (
                          <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 bg-neutral-200 text-neutral-700 font-semibold rounded">
                            Archived
                          </span>
                        ) : p.isPublished ? (
                          <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold rounded">
                            Published
                          </span>
                        ) : (
                          <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 bg-neutral-100 text-neutral-600 border border-neutral-200 font-semibold rounded">
                            Draft
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleTogglePublish(p.id, p.isPublished)}
                            className="p-1.5 text-neutral-400 hover:text-black transition-colors"
                            title={p.isPublished ? 'Unpublish' : 'Publish'}
                          >
                            {p.isPublished ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5 text-[#C5A059]" />
                            )}
                          </button>

                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className="p-1.5 text-neutral-400 hover:text-black transition-colors"
                            title="Edit Flacon"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 transition-colors"
                            title="Archive / Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-neutral-200 bg-neutral-50/50 flex items-center justify-between text-xs">
            <span className="text-neutral-500">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} flacons)
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
