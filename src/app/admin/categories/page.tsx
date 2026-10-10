'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  FolderTree,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Package,
} from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', isActive: true });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/categories?q=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to load categories.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [search]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setForm({ name: '', slug: '', description: '', isActive: true });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      isActive: cat.isActive,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.name.trim().length < 2) {
      setFormError('Category name is required (min 2 characters).');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : '/api/admin/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to save category.');
        setSubmitting(false);
        return;
      }

      setNotification({
        type: 'success',
        message: editingCategory
          ? 'Category updated successfully.'
          : 'New fragrance realm created.',
      });
      setModalOpen(false);
      fetchCategories();
    } catch {
      setFormError('A network error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat: any) => {
    if (!confirm(`Are you sure you wish to delete "${cat.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        setNotification({ type: 'error', message: data.error || 'Failed to delete category.' });
        return;
      }

      setNotification({ type: 'success', message: data.message });
      fetchCategories();
    } catch {
      setNotification({ type: 'error', message: 'A network error occurred.' });
    }
  };

  return (
    <AdminLayout
      title="Olfactive Realms &amp; Categories"
      breadcrumbs={[{ label: 'Categories' }]}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-cinzel text-xl text-neutral-900 font-semibold">
            Fragrance Categories ({categories.length})
          </h2>
          <p className="text-xs text-neutral-500 font-light mt-0.5">
            Organize flacons into sensory olfactory families and client discovery realms.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="btn-heaven-primary py-2.5 px-5 text-xs tracking-wider uppercase inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#C5A059]" />
          <span>New Realm</span>
        </button>
      </div>

      {/* Notifications */}
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

      {/* Search Toolbar */}
      <div className="bg-white border border-neutral-200 p-4 rounded-lg shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
          <input
            type="text"
            placeholder="Search categories by name, slug or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-neutral-200 rounded focus:border-black outline-none"
          />
        </div>
      </div>

      {/* Category Table */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-neutral-400">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading Fragrance Realms...
          </div>
        ) : categories.length === 0 ? (
          <div className="p-16 text-center text-xs text-neutral-400 space-y-2">
            <FolderTree className="w-8 h-8 mx-auto text-neutral-300" />
            <div className="font-semibold text-neutral-700">No Categories Found</div>
            <p>Create your first olfactory realm using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Realm Name</th>
                  <th className="py-3 px-4">Slug Identifier</th>
                  <th className="py-3 px-4">Associated Flacons</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-cinzel text-xs font-semibold text-neutral-900">
                        {cat.name}
                      </div>
                      {cat.description && (
                        <div className="text-[11px] text-neutral-500 line-clamp-1 max-w-sm mt-0.5">
                          {cat.description}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-600">
                      {cat.slug}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-neutral-900">
                        {cat._count?.products || 0}
                      </span>
                      <span className="text-neutral-400 text-[10px] ml-1">flacons</span>
                    </td>

                    <td className="py-3.5 px-4">
                      {cat.isActive ? (
                        <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold rounded">
                          Active
                        </span>
                      ) : (
                        <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 bg-neutral-100 text-neutral-600 font-semibold rounded">
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 text-neutral-400 hover:text-black transition-colors"
                          title="Edit Realm"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(cat)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 transition-colors"
                          title="Delete Realm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 max-w-md w-full p-6 rounded-lg space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-cinzel text-base font-semibold text-neutral-900">
                {editingCategory ? `Edit: ${editingCategory.name}` : 'New Fragrance Realm'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Amber &amp; Resins"
                  className="input-heaven w-full py-2 px-3 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                  Slug (Optional, auto-generated)
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="e.g. amber-and-resins"
                  className="input-heaven w-full py-2 px-3 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Atmospheric narrative defining this olfactory realm..."
                  className="input-heaven w-full p-2.5 text-xs bg-white"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 text-black rounded"
                />
                <span className="font-medium text-neutral-800">Active in Storefront Filter</span>
              </label>

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
                  {submitting ? 'Saving...' : editingCategory ? 'Update' : 'Create Realm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
