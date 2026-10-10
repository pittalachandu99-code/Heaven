'use client';

import React, { useState } from 'react';
import { useCartWishlist } from '@/context/CartWishlistContext';
import { ShoppingBag, Heart, Plus, Minus, Check, ShieldCheck, Truck, Sparkles } from 'lucide-react';

interface ProductDetailActionsProps {
  productId: string;
  productName: string;
  stockQuantity: number;
}

export default function ProductDetailActions({
  productId,
  productName,
  stockQuantity,
}: ProductDetailActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const { addToCart, toggleWishlist, isInWishlist } = useCartWishlist();

  const isSaved = isInWishlist(productId);

  const handleAddToCart = async () => {
    setAdding(true);
    await addToCart(productId, quantity);
    setAdding(false);
  };

  return (
    <div className="space-y-6 pt-4 border-t border-neutral-200">
      {/* Quantity & Add to Cart Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        {/* Quantity Stepper */}
        <div className="flex items-center border border-neutral-300 w-32 justify-between px-2 py-3 bg-white">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className="p-1 text-neutral-500 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Decrease quantity"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="font-semibold text-sm text-neutral-900">{quantity}</span>
          <button
            onClick={() => setQuantity(Math.min(stockQuantity, quantity + 1))}
            disabled={quantity >= stockQuantity}
            className="p-1 text-neutral-500 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Increase quantity"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={stockQuantity <= 0 || adding}
          className="btn-heaven-primary flex-1 py-4 text-xs tracking-[0.25em] flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>
            {stockQuantity <= 0
              ? 'Harvest Allocation Exhausted'
              : adding
              ? 'Reserving Flacon...'
              : 'Acquire Flacon'}
          </span>
        </button>

        {/* Wishlist Button */}
        <button
          onClick={() => toggleWishlist(productId)}
          className={`p-4 border transition-colors flex items-center justify-center ${
            isSaved
              ? 'border-red-500 bg-red-50 text-red-600'
              : 'border-neutral-300 hover:border-black text-neutral-700 hover:text-black'
          }`}
          title={isSaved ? 'Remove from private wishlist' : 'Save to private wishlist'}
          aria-label="Save to Wishlist"
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Stock Notification */}
      <div className="text-xs text-neutral-500 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span>
          Cellar Status: <strong className="text-black font-semibold">{stockQuantity}</strong> bottles
          ready for immediate white-glove dispatch.
        </span>
      </div>

      {/* Luxury Assurances */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-neutral-100 text-[11px] text-neutral-600">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#C5A059]" />
          <span>White-Glove Delivery</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
          <span>Maison Certificate</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#C5A059]" />
          <span>Pure Distillation</span>
        </div>
      </div>
    </div>
  );
}
