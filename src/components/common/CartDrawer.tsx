'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartWishlist } from '@/context/CartWishlistContext';
import { formatINR } from '@/lib/utils';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck } from 'lucide-react';

export default function CartDrawer() {
  const {
    cartItems,
    cartSummary,
    cartDrawerOpen,
    setCartDrawerOpen,
    updateQuantity,
    removeFromCart,
  } = useCartWishlist();

  if (!cartDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setCartDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-neutral-200 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-black" />
              <h2 className="text-xs uppercase tracking-[0.25em] font-semibold text-black">
                Your Flacon Selection
              </h2>
            </div>
            <button
              onClick={() => setCartDrawerOpen(false)}
              className="p-1.5 text-neutral-400 hover:text-black transition-colors"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Complimentary Shipping Progress Banner */}
          {cartSummary && (
            <div className="bg-neutral-50 px-6 py-3 border-b border-neutral-100 text-xs">
              {cartSummary.qualifiesForFreeShipping && cartSummary.subtotal > 0 ? (
                <div className="flex items-center gap-2 text-emerald-800 font-medium">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>Complimentary White-Glove Courier Unlocked!</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-neutral-600">
                    <span>
                      Add {formatINR(cartSummary.amountToFreeShipping)} more for complimentary shipping
                    </span>
                    <span className="font-semibold text-black">
                      {cartSummary.freeShippingProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-black h-full transition-all duration-300"
                      style={{ width: `${cartSummary.freeShippingProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-neutral-400">
                <ShoppingBag className="w-12 h-12 stroke-[1.2]" />
                <div className="space-y-1">
                  <p className="text-sm uppercase tracking-wider text-neutral-800 font-medium">
                    Your Flacon Selection is Empty
                  </p>
                  <p className="text-xs text-neutral-500 font-light max-w-xs">
                    Explore the permanent collection and add master fragrance editions.
                  </p>
                </div>
                <button
                  onClick={() => setCartDrawerOpen(false)}
                  className="btn-heaven-primary py-3 px-6 text-xs"
                >
                  Explore Fragrances
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 pb-6 border-b border-neutral-100 last:border-b-0"
                >
                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 bg-neutral-50 border border-neutral-200 flex-shrink-0 overflow-hidden">
                    <Image
                      src={item.product.primaryImage}
                      alt={item.product.name}
                      fill
                      sizes="80px"
                      className="object-cover object-center"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <Link
                          href={`/products/${item.product.slug}`}
                          onClick={() => setCartDrawerOpen(false)}
                          className="font-cinzel text-sm text-neutral-900 hover:text-[#C5A059] transition-colors leading-tight"
                        >
                          {item.product.name}
                        </Link>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-neutral-400 hover:text-black p-1 transition-colors"
                          title="Remove flacon"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        {item.product.size}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-neutral-300">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="p-1 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3 text-neutral-600" />
                        </button>
                        <span className="px-3 text-xs font-semibold text-neutral-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stockQuantity}
                          className="p-1 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3 text-neutral-600" />
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div className="font-cinzel text-xs font-semibold text-neutral-900">
                        {formatINR(item.product.price * item.quantity)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary & Checkout CTAs */}
          {cartItems.length > 0 && cartSummary && (
            <div className="p-6 border-t border-neutral-200 bg-neutral-50 space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-black">
                    {formatINR(cartSummary.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>White-Glove Courier Delivery</span>
                  <span>
                    {cartSummary.shippingFee === 0 ? (
                      <span className="text-emerald-700 uppercase tracking-wider font-semibold text-[10px]">
                        Complimentary
                      </span>
                    ) : (
                      formatINR(cartSummary.shippingFee)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-black pt-2 border-t border-neutral-200 font-cinzel">
                  <span>Total Due</span>
                  <span>{formatINR(cartSummary.total)}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Link
                  href="/cart"
                  onClick={() => setCartDrawerOpen(false)}
                  className="btn-heaven-primary w-full py-3.5 text-xs tracking-[0.2em] flex items-center justify-center gap-2"
                >
                  <span>View Full Bag &amp; Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  onClick={() => setCartDrawerOpen(false)}
                  className="w-full text-center text-xs uppercase tracking-wider text-neutral-500 hover:text-black py-2 transition-colors"
                >
                  Continue Selecting Fragrances
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
