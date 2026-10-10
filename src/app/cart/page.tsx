'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { useCartWishlist } from '@/context/CartWishlistContext';
import { formatINR } from '@/lib/utils';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  Truck, 
  ShieldCheck, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';

export default function CartPage() {
  const {
    cartItems,
    cartSummary,
    loadingCart,
    updateQuantity,
    removeFromCart,
  } = useCartWishlist();

  if (loadingCart) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-16">
          <div className="text-xs uppercase tracking-widest text-neutral-400">
            Retrieving Flacon Selection...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFCFC] text-neutral-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Title */}
        <div className="mb-10 space-y-2">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A059] font-medium block">
            Maison Concierge
          </span>
          <h1 className="font-cinzel text-3xl sm:text-4xl text-neutral-950 font-normal">
            Your Private Flacon Selection
          </h1>
          <p className="text-xs text-neutral-500 font-light">
            Review your chosen fragrances before white-glove packaging and allocation.
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white border border-neutral-200 p-16 text-center space-y-5">
            <ShoppingBag className="w-16 h-16 text-neutral-300 mx-auto stroke-[1]" />
            <div className="space-y-1">
              <h2 className="font-cinzel text-xl text-neutral-900">
                Your Selection Bag is Empty
              </h2>
              <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
                You currently have no flacons reserved. Browse our permanent collection of artisanal creations.
              </p>
            </div>
            <Link
              href="/products"
              className="btn-heaven-primary py-4 px-10 text-xs tracking-[0.25em] inline-flex items-center gap-2"
            >
              <span>Explore The Collection</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            {/* Items Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Complimentary Shipping Progress Banner */}
              {cartSummary && (
                <div className="bg-white border border-neutral-200 p-5 space-y-2">
                  {cartSummary.qualifiesForFreeShipping ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      <span>
                        Complimentary White-Glove Courier Delivery has been unlocked for your order.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-neutral-600">
                        <span>
                          Add <strong className="text-black">{formatINR(cartSummary.amountToFreeShipping)}</strong> more to receive complimentary delivery
                        </span>
                        <span className="font-semibold text-black">
                          {cartSummary.freeShippingProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-black h-full transition-all duration-300"
                          style={{ width: `${cartSummary.freeShippingProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Items Card */}
              <div className="bg-white border border-neutral-200 divide-y divide-neutral-100">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between"
                  >
                    {/* Visual & Info */}
                    <div className="flex gap-5 items-center">
                      <div className="relative w-24 h-24 bg-neutral-50 border border-neutral-200 flex-shrink-0 overflow-hidden">
                        <Image
                          src={item.product.primaryImage}
                          alt={item.product.name}
                          fill
                          sizes="96px"
                          className="object-cover object-center"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] uppercase tracking-wider text-neutral-400">
                          {item.product.category?.name || 'Haute Parfumerie'}
                        </div>
                        <Link
                          href={`/products/${item.product.slug}`}
                          className="font-cinzel text-base text-neutral-950 font-normal hover:text-[#C5A059] transition-colors block"
                        >
                          {item.product.name}
                        </Link>
                        <div className="text-xs text-neutral-500">
                          {item.product.size} &bull; {formatINR(item.product.price)} each
                        </div>
                      </div>
                    </div>

                    {/* Stepper & Price */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-neutral-300">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="p-1.5 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5 text-neutral-600" />
                        </button>
                        <span className="px-3.5 text-xs font-semibold text-neutral-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stockQuantity}
                          className="p-1.5 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5 text-neutral-600" />
                        </button>
                      </div>

                      {/* Total */}
                      <div className="text-right">
                        <div className="font-cinzel text-sm font-semibold text-neutral-900">
                          {formatINR(item.product.price * item.quantity)}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-[11px] text-neutral-400 hover:text-black flex items-center gap-1 mt-1 ml-auto"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Continue Shopping Link */}
              <div className="pt-2">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-neutral-600 hover:text-black transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Continue Selecting Flacons</span>
                </Link>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            {cartSummary && (
              <div className="bg-white border border-neutral-200 p-8 space-y-6">
                <h3 className="font-cinzel text-lg text-neutral-950 pb-4 border-b border-neutral-200">
                  Acquisition Summary
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-neutral-600">
                    <span>Selected Flacons ({cartSummary.totalItemsCount})</span>
                    <span className="font-medium text-black">
                      {formatINR(cartSummary.subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between text-neutral-600">
                    <span>White-Glove Courier Delivery</span>
                    <span>
                      {cartSummary.shippingFee === 0 ? (
                        <span className="text-emerald-700 font-semibold uppercase tracking-wider text-[10px]">
                          Complimentary
                        </span>
                      ) : (
                        formatINR(cartSummary.shippingFee)
                      )}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-neutral-200 flex justify-between items-baseline">
                    <span className="font-cinzel text-base text-neutral-900">Total Due</span>
                    <span className="font-cinzel text-2xl font-bold text-neutral-950">
                      {formatINR(cartSummary.total)}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/checkout"
                    className="btn-heaven-primary w-full py-4 text-xs tracking-[0.25em] flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Acquisition</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Maison Promises */}
                <div className="pt-4 border-t border-neutral-100 space-y-2 text-[11px] text-neutral-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Sealed with Maison certificate of origin</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Dispatched in climate-controlled protective casing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Artisanal batch extraction guarantee</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
