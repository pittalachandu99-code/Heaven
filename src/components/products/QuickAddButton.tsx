'use client';

import React, { useState } from 'react';
import { useCartWishlist } from '@/context/CartWishlistContext';
import { ShoppingBag, Check } from 'lucide-react';

interface QuickAddButtonProps {
  productId: string;
  productName: string;
  className?: string;
}

export default function QuickAddButton({
  productId,
  productName,
  className = '',
}: QuickAddButtonProps) {
  const [loading, setLoading] = useState(false);
  const { addToCart } = useCartWishlist();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    await addToCart(productId, 1);
    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-medium text-black hover:text-[#C5A059] underline underline-offset-4 disabled:opacity-50 transition-colors ${className}`}
    >
      <ShoppingBag className="w-3.5 h-3.5" />
      <span>{loading ? 'Adding...' : 'Acquire'}</span>
    </button>
  );
}
