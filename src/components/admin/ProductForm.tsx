'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';

interface ProductFormProps {
  initialData?: any;
  categories: { id: string; name: string }[];
  isEditing?: boolean;
}

export default function ProductForm({
  initialData,
  categories,
  isEditing = false,
}: ProductFormProps) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    sku: initialData?.sku || '',
    subtitle: initialData?.subtitle || '',
    description: initialData?.description || '',
    categoryId: initialData?.categoryId || (categories[0]?.id || ''),
    fragranceFamily: initialData?.fragranceFamily || 'Floral',
    topNotes: initialData?.topNotes || '',
    heartNotes: initialData?.heartNotes || '',
    baseNotes: initialData?.baseNotes || '',
    size: initialData?.size || '100ml / 3.4 FL. OZ.',
    price: initialData?.price?.toString() || '11500',
    stockQuantity: initialData?.stockQuantity?.toString() || '50',
    lowStockThreshold: initialData?.lowStockThreshold?.toString() || '10',
    primaryImage: initialData?.primaryImage || '/perfumes/heaven-bottle-1.jpg',
    isPublished: initialData?.isPublished ?? true,
    isFeatured: initialData?.isFeatured ?? false,
    isNewArrival: initialData?.isNewArrival ?? false,
    isBestSeller: initialData?.isBestSeller ?? false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      errs.name = 'Product name is required (minimum 2 characters).';
    }
    if (!form.categoryId) {
      errs.categoryId = 'Category selection is required.';
    }
    const numPrice = parseFloat(form.price);
    if (isNaN(numPrice) || numPrice <= 0) {
      errs.price = 'Price must be a valid positive number in INR.';
    }
    const numStock = parseInt(form.stockQuantity, 10);
    if (isNaN(numStock) || numStock < 0) {
      errs.stockQuantity = 'Stock quantity cannot be negative.';
    }
    if (!form.description.trim()) {
      errs.description = 'Description is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError('');
    setSuccessMessage('');

    try {
      const url = isEditing
        ? `/api/admin/products/${initialData.id}`
        : '/api/admin/products';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || 'Failed to save product.');
        setSubmitting(false);
        return;
      }

      setSuccessMessage(
        isEditing
          ? 'Product dossier updated successfully.'
          : 'New flacon published into catalogue.'
      );

      setTimeout(() => {
        router.push('/admin/products');
        router.refresh();
      }, 1000);
    } catch {
      setServerError('A network error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
      {/* Top Bar Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/products"
          className="text-xs text-neutral-500 hover:text-black flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Products</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="btn-heaven-secondary py-2.5 px-5 text-xs tracking-wider uppercase"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn-heaven-primary py-2.5 px-6 text-xs tracking-wider uppercase inline-flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-[#C5A059]" />
            <span>{submitting ? 'Saving...' : isEditing ? 'Update Flacon' : 'Publish Flacon'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {serverError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 rounded">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5 rounded">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Core Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information Card */}
          <div className="bg-white border border-neutral-200 p-6 rounded-lg space-y-4 shadow-sm">
            <h3 className="font-cinzel text-sm font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
              Identity &amp; Classification
            </h3>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                Flacon Title / Fragrance Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Royal Amber Extrait"
                className="input-heaven text-xs w-full py-2.5 px-3 bg-white"
              />
              {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                  URL Slug (Optional, auto-generated)
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="e.g. royal-amber-extrait"
                  className="input-heaven text-xs w-full py-2.5 px-3 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                  SKU Code (Optional, auto-generated)
                </label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="e.g. HVN-AMB-099"
                  className="input-heaven text-xs w-full py-2.5 px-3 bg-white uppercase font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                  Olfactive Category / Realm *
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="input-heaven text-xs w-full py-2.5 px-3 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.categoryId}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                  Fragrance Family
                </label>
                <input
                  type="text"
                  value={form.fragranceFamily}
                  onChange={(e) => setForm({ ...form, fragranceFamily: e.target.value })}
                  placeholder="e.g. Woody Oriental, Floral, Citrus"
                  className="input-heaven text-xs w-full py-2.5 px-3 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                Subtitle / Formulation
              </label>
              <input
                type="text"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="e.g. Pure Extrait de Parfum &bull; Rare Harvest"
                className="input-heaven text-xs w-full py-2.5 px-3 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                Olfactory Description *
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Evocative olfactory narrative describing the scent journey and notes..."
                className="input-heaven text-xs w-full p-3 bg-white leading-relaxed"
              />
              {errors.description && (
                <p className="text-[11px] text-red-600 mt-1">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Olfactory Notes Architecture */}
          <div className="bg-white border border-neutral-200 p-6 rounded-lg space-y-4 shadow-sm">
            <h3 className="font-cinzel text-sm font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
              Fragrance Pyramid / Notes
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                  Top Notes (Initial Impression)
                </label>
                <input
                  type="text"
                  value={form.topNotes}
                  onChange={(e) => setForm({ ...form, topNotes: e.target.value })}
                  placeholder="e.g. Italian Bergamot, Pink Peppercorn, Saffron"
                  className="input-heaven text-xs w-full py-2.5 px-3 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                  Heart Notes (Core Character)
                </label>
                <input
                  type="text"
                  value={form.heartNotes}
                  onChange={(e) => setForm({ ...form, heartNotes: e.target.value })}
                  placeholder="e.g. Grasse Jasmine, Damask Rose, Orris Root"
                  className="input-heaven text-xs w-full py-2.5 px-3 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                  Base Notes (Lasting Resonance)
                </label>
                <input
                  type="text"
                  value={form.baseNotes}
                  onChange={(e) => setForm({ ...form, baseNotes: e.target.value })}
                  placeholder="e.g. Cambodian Agarwood, Bourbon Vanilla, Ambergris"
                  className="input-heaven text-xs w-full py-2.5 px-3 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing, Inventory & Imagery */}
        <div className="space-y-6">
          {/* Pricing & Stock Card */}
          <div className="bg-white border border-neutral-200 p-6 rounded-lg space-y-4 shadow-sm">
            <h3 className="font-cinzel text-sm font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
              Pricing &amp; Inventory
            </h3>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                Price (INR ₹) *
              </label>
              <input
                type="number"
                step="50"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="input-heaven text-xs w-full py-2.5 px-3 bg-white font-semibold"
              />
              {errors.price && <p className="text-[11px] text-red-600 mt-1">{errors.price}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                  Cellar Stock *
                </label>
                <input
                  type="number"
                  value={form.stockQuantity}
                  onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                  className="input-heaven text-xs w-full py-2.5 px-3 bg-white"
                />
                {errors.stockQuantity && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.stockQuantity}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  value={form.lowStockThreshold}
                  onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                  className="input-heaven text-xs w-full py-2.5 px-3 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                Flacon Volume / Size
              </label>
              <input
                type="text"
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
                className="input-heaven text-xs w-full py-2.5 px-3 bg-white"
              />
            </div>
          </div>

          {/* Image & Presentation Preview */}
          <div className="bg-white border border-neutral-200 p-6 rounded-lg space-y-4 shadow-sm">
            <h3 className="font-cinzel text-sm font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
              Flacon Imagery
            </h3>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                Primary Image Path / URL
              </label>
              <input
                type="text"
                value={form.primaryImage}
                onChange={(e) => setForm({ ...form, primaryImage: e.target.value })}
                placeholder="/perfumes/heaven-bottle-1.jpg"
                className="input-heaven text-xs w-full py-2.5 px-3 bg-white text-[11px]"
              />
              <p className="text-[10px] text-neutral-400 mt-1">
                Supports local perfume paths: /perfumes/heaven-bottle-1.jpg to bottle-5.jpg
              </p>
            </div>

            {/* Live Image Preview */}
            <div className="relative w-full h-44 bg-neutral-50 border border-neutral-200 rounded overflow-hidden flex items-center justify-center">
              {form.primaryImage ? (
                <Image
                  src={form.primaryImage}
                  alt={form.name || 'Preview'}
                  fill
                  sizes="300px"
                  className="object-cover"
                />
              ) : (
                <div className="text-center text-neutral-300">
                  <ImageIcon className="w-8 h-8 mx-auto mb-1 stroke-1" />
                  <span className="text-[11px]">No Image Selected</span>
                </div>
              )}
            </div>
          </div>

          {/* Visibility & Flags Card */}
          <div className="bg-white border border-neutral-200 p-6 rounded-lg space-y-3 shadow-sm text-xs">
            <h3 className="font-cinzel text-sm font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
              Boutique Visibility
            </h3>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className="w-4 h-4 text-black rounded"
              />
              <span className="font-medium text-neutral-800">Publish in Customer Catalogue</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="w-4 h-4 text-black rounded"
              />
              <span className="text-neutral-700">Feature on Storefront Homepage</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isNewArrival}
                onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })}
                className="w-4 h-4 text-black rounded"
              />
              <span className="text-neutral-700">Tag as &ldquo;New Arrival&rdquo;</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isBestSeller}
                onChange={(e) => setForm({ ...form, isBestSeller: e.target.checked })}
                className="w-4 h-4 text-black rounded"
              />
              <span className="text-neutral-700">Tag as &ldquo;Bestseller Allocation&rdquo;</span>
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}
