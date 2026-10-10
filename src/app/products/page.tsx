'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { formatINR } from '@/lib/utils';
import { useCartWishlist } from '@/context/CartWishlistContext';
import { 
  Search, 
  Heart, 
  ShoppingBag, 
  SlidersHorizontal, 
  X, 
  Sparkles,
  Check,
  ArrowRight
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  subtitle?: string | null;
  description: string;
  fragranceFamily: string;
  topNotes: string;
  heartNotes: string;
  baseNotes: string;
  size: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  primaryImage: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

const FAMILIES = ['All', 'Floral', 'Woody', 'Oriental', 'Fresh', 'Gourmand', 'Citrus'];

function CatalogueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedFamily, setSelectedFamily] = useState(searchParams.get('family') || 'All');
  const [selectedSort, setSelectedSort] = useState(searchParams.get('sort') || 'featured');

  const { addToCart, toggleWishlist, isInWishlist } = useCartWishlist();

  // Load categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (e) {
        console.error('Error fetching categories:', e);
      }
    }
    fetchCategories();
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
        if (selectedFamily && selectedFamily !== 'All') params.set('family', selectedFamily);
        if (selectedSort) params.set('sort', selectedSort);

        const res = await fetch(`/api/products?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (e) {
        console.error('Error fetching products:', e);
      } finally {
        setLoading(false);
      }
    }

    const debounceTimer = setTimeout(() => {
      fetchProducts();
    }, 200);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedCategory, selectedFamily, selectedSort]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedFamily('All');
    setSelectedSort('featured');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Title & Introduction */}
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
        <span className="text-[10px] uppercase tracking-[0.35em] text-[#C5A059] font-medium block">
          Haute Parfumerie Reserve
        </span>
        <h1 className="font-cinzel text-4xl sm:text-5xl text-neutral-950 font-normal tracking-wide">
          The Fragrance Collection
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed">
          Six olfactive realms formulated with pure botanical extracts, precious oud, and golden resins. Each flacon is individually blended and numbered.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-neutral-50 border border-neutral-200 p-4 sm:p-6 mb-12 space-y-5">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by note (e.g. Jasmine, Sandalwood, Vanilla)..."
              className="w-full bg-white border border-neutral-300 py-3 pl-10 pr-10 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <span className="text-xs uppercase tracking-wider text-neutral-500 font-medium hidden sm:inline">
              Sort By:
            </span>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="bg-white border border-neutral-300 py-3 px-4 text-xs text-neutral-900 focus:outline-none focus:border-black uppercase tracking-wider"
            >
              <option value="featured">Curated Editions</option>
              <option value="popular">Best Sellers</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Olfactive Family Pill Filters */}
        <div className="pt-2 border-t border-neutral-200 flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-neutral-400 mr-2 font-medium">
            Olfactive Realm:
          </span>
          {FAMILIES.map((family) => (
            <button
              key={family}
              onClick={() => setSelectedFamily(family)}
              className={`px-3.5 py-1.5 text-xs uppercase tracking-wider transition-all ${
                selectedFamily === family
                  ? 'bg-black text-white font-medium'
                  : 'bg-white text-neutral-700 border border-neutral-300 hover:border-black'
              }`}
            >
              {family}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid Status */}
      <div className="flex items-center justify-between mb-8 text-xs text-neutral-500">
        <div>
          Showing <span className="font-semibold text-black">{products.length}</span> luxury flacons
        </div>
        {(searchQuery || selectedCategory !== 'all' || selectedFamily !== 'All') && (
          <button
            onClick={handleResetFilters}
            className="text-black underline underline-offset-4 hover:text-[#C5A059] flex items-center gap-1 font-medium"
          >
            <span>Reset Active Filters</span>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Grid of Flacons */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-16">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse space-y-4">
              <div className="aspect-square bg-neutral-100" />
              <div className="h-4 bg-neutral-100 w-3/4" />
              <div className="h-3 bg-neutral-100 w-1/2" />
              <div className="h-4 bg-neutral-100 w-1/4" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24 space-y-4 bg-neutral-50 border border-neutral-200 p-8">
          <Sparkles className="w-10 h-10 text-neutral-400 mx-auto stroke-[1.2]" />
          <h3 className="font-cinzel text-xl text-neutral-900">
            No Fragrances Match Your Olfactory Query
          </h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
            We could not find fragrances matching &ldquo;{searchQuery}&rdquo;. Try exploring our complete collection or clear the active realm filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="btn-heaven-primary py-3.5 px-8 text-xs"
          >
            View All Flacons
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => {
            const saved = isInWishlist(product.id);
            const isLowStock = product.stockQuantity <= product.lowStockThreshold && product.stockQuantity > 0;

            return (
              <div
                key={product.id}
                className="group flex flex-col bg-white border border-neutral-200 hover:border-black transition-all shadow-none hover:shadow-md"
              >
                {/* Flacon Image Container */}
                <div className="relative aspect-square bg-neutral-50 overflow-hidden">
                  <Link href={`/products/${product.slug}`} className="block w-full h-full">
                    <Image
                      src={product.primaryImage}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    />
                  </Link>

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1 z-10 pointer-events-none">
                    {product.isBestSeller && (
                      <span className="bg-black text-white text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 font-medium">
                        Best Seller
                      </span>
                    )}
                    {product.isNewArrival && (
                      <span className="bg-[#C5A059] text-white text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 font-medium">
                        New Harvest
                      </span>
                    )}
                    {isLowStock && (
                      <span className="bg-amber-950 text-amber-300 text-[8px] uppercase tracking-[0.2em] px-2 py-0.5 font-medium border border-amber-800">
                        Reserve ({product.stockQuantity} left)
                      </span>
                    )}
                  </div>

                  {/* Wishlist Toggle Button */}
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white text-black rounded-full shadow-sm transition-all z-10"
                    title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
                    aria-label="Wishlist toggle"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 transition-colors ${
                        saved ? 'fill-red-600 text-red-600' : 'text-neutral-700'
                      }`}
                    />
                  </button>
                </div>

                {/* Information Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">
                      {product.category.name} &bull; {product.fragranceFamily}
                    </div>

                    <Link
                      href={`/products/${product.slug}`}
                      className="block font-cinzel text-base text-neutral-950 hover:text-[#C5A059] transition-colors leading-snug"
                    >
                      {product.name}
                    </Link>

                    {product.subtitle && (
                      <div className="text-[11px] text-neutral-500 italic">
                        {product.subtitle}
                      </div>
                    )}

                    {/* Olfactive Notes snippet */}
                    <div className="pt-2 text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                      <span className="font-semibold text-neutral-800">Notes:</span> {product.heartNotes}
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-neutral-400 uppercase tracking-wider">
                        {product.size}
                      </div>
                      <div className="font-cinzel text-sm font-semibold text-neutral-900">
                        {formatINR(product.price)}
                      </div>
                    </div>

                    <button
                      onClick={() => addToCart(product.id, 1)}
                      disabled={product.stockQuantity <= 0}
                      className="inline-flex items-center gap-1.5 bg-black hover:bg-neutral-800 text-white px-3.5 py-2 text-[11px] font-medium uppercase tracking-wider transition-colors disabled:opacity-40"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{product.stockQuantity <= 0 ? 'Out of Stock' : 'Acquire'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<div className="p-16 text-center text-xs text-neutral-400">Loading fragrance reserve...</div>}>
          <CatalogueContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
