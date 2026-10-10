'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { useCartWishlist } from '@/context/CartWishlistContext';
import { formatINR } from '@/lib/utils';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';

export default function WishlistPage() {
  const {
    wishlistItems,
    toggleWishlist,
    addToCart,
  } = useCartWishlist();

  return (
    <div className="min-h-screen bg-[#FCFCFC] text-neutral-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Title */}
        <div className="mb-10 space-y-2">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A059] font-medium block">
            Client Archive
          </span>
          <h1 className="font-cinzel text-3xl sm:text-4xl text-neutral-950 font-normal">
            Your Saved Fragrances
          </h1>
          <p className="text-xs text-neutral-500 font-light">
            Perfumes you have earmarked for future acquisition or private gifting.
          </p>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="bg-white border border-neutral-200 p-16 text-center space-y-5">
            <Heart className="w-16 h-16 text-neutral-300 mx-auto stroke-[1]" />
            <div className="space-y-1">
              <h2 className="font-cinzel text-xl text-neutral-900">
                Your Wishlist is Empty
              </h2>
              <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
                Save your favorite olfactive creations to track their harvest availability.
              </p>
            </div>
            <Link
              href="/products"
              className="btn-heaven-primary py-4 px-10 text-xs tracking-[0.25em] inline-flex items-center gap-2"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {wishlistItems.map((item) => (
              <div
                key={item.id}
                className="group bg-white border border-neutral-200 hover:border-black transition-all flex flex-col justify-between"
              >
                {/* Visual */}
                <div className="relative aspect-square bg-neutral-50 overflow-hidden">
                  <Link href={`/products/${item.product.slug}`} className="block w-full h-full">
                    <Image
                      src={item.product.primaryImage}
                      alt={item.product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  <button
                    onClick={() => toggleWishlist(item.productId)}
                    className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white text-neutral-500 hover:text-black rounded-full shadow-sm transition-colors"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-neutral-400">
                      {item.product.category?.name || item.product.fragranceFamily}
                    </div>
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="font-cinzel text-base text-neutral-950 hover:text-[#C5A059] transition-colors block"
                    >
                      {item.product.name}
                    </Link>
                    <div className="text-xs text-neutral-500">
                      {item.product.size} &bull; {formatINR(item.product.price)}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                    <button
                      onClick={() => addToCart(item.productId, 1)}
                      className="w-full btn-heaven-primary py-3 text-[11px] tracking-wider flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Acquire Flacon</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
