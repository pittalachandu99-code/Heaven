'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    subtitle?: string | null;
    price: number;
    size: string;
    stockQuantity: number;
    primaryImage: string;
    category?: { name: string; slug: string };
  };
}

export interface CartSummary {
  subtotal: number;
  shippingFee: number;
  total: number;
  totalItemsCount: number;
  freeShippingThreshold: number;
  qualifiesForFreeShipping: boolean;
  amountToFreeShipping: number;
  freeShippingProgress: number;
  currencySymbol: string;
  currencyCode: string;
}

export interface WishlistItem {
  id: string;
  wishlistId: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    size: string;
    primaryImage: string;
    fragranceFamily: string;
    category?: { name: string; slug: string };
  };
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface CartWishlistContextType {
  cartItems: CartItem[];
  cartSummary: CartSummary | null;
  cartCount: number;
  wishlistItems: WishlistItem[];
  wishlistCount: number;
  loadingCart: boolean;
  cartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
  addToCart: (productId: string, quantity?: number) => Promise<{ success: boolean; error?: string }>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<{ success: boolean; error?: string }>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<boolean>;
  isInWishlist: (productId: string) => boolean;
  refreshCart: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const CartWishlistContext = createContext<CartWishlistContextType | undefined>(undefined);

export function CartWishlistProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        setCartItems(data.items || []);
        setCartSummary(data.summary || null);
      }
    } catch (e) {
      console.error('Failed to refresh cart:', e);
    } finally {
      setLoadingCart(false);
    }
  }, []);

  const refreshWishlist = useCallback(async () => {
    try {
      const res = await fetch('/api/wishlist');
      if (res.ok) {
        const data = await res.json();
        setWishlistItems(data.items || []);
      }
    } catch (e) {
      console.error('Failed to refresh wishlist:', e);
    }
  }, []);

  useEffect(() => {
    refreshCart();
    refreshWishlist();
  }, [refreshCart, refreshWishlist]);

  const addToCart = async (productId: string, quantity = 1) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || 'Unable to reserve flacon.', 'error');
        return { success: false, error: data.error };
      }
      setCartItems(data.items || []);
      setCartSummary(data.summary || null);
      addToast(data.message || 'Added to flacon selection.', 'success');
      setCartDrawerOpen(true);
      return { success: true };
    } catch {
      addToast('Network error adding to cart.', 'error');
      return { success: false, error: 'Network error' };
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId, quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || 'Cannot update quantity.', 'error');
        return { success: false, error: data.error };
      }
      setCartItems(data.items || []);
      setCartSummary(data.summary || null);
      return { success: true };
    } catch {
      addToast('Failed to update quantity.', 'error');
      return { success: false, error: 'Network error' };
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      const res = await fetch(`/api/cart?id=${cartItemId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setCartItems(data.items || []);
        setCartSummary(data.summary || null);
        addToast('Item removed from selection.', 'info');
      }
    } catch {
      addToast('Failed to remove item.', 'error');
    }
  };

  const toggleWishlist = async (productId: string) => {
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (res.ok) {
        setWishlistItems(data.items || []);
        addToast(data.message, 'success');
        return !!data.isSaved;
      }
      return false;
    } catch {
      addToast('Failed to update wishlist.', 'error');
      return false;
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some((item) => item.productId === productId);
  };

  const cartCount = cartSummary?.totalItemsCount || cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const wishlistCount = wishlistItems.length;

  return (
    <CartWishlistContext.Provider
      value={{
        cartItems,
        cartSummary,
        cartCount,
        wishlistItems,
        wishlistCount,
        loadingCart,
        cartDrawerOpen,
        setCartDrawerOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        toggleWishlist,
        isInWishlist,
        refreshCart,
        refreshWishlist,
        toasts,
        removeToast,
      }}
    >
      {children}

      {/* Floating Luxury Notifications / Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto max-w-sm px-4 py-3 border text-xs shadow-xl transition-all animate-in slide-in-from-bottom-2 ${
              toast.type === 'error'
                ? 'bg-neutral-900 border-red-500/50 text-red-200'
                : 'bg-black border-neutral-700 text-white'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-light tracking-wide">{toast.message}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
                className="text-neutral-400 hover:text-white text-sm"
              >
                &times;
              </button>
            </div>
          </div>
        ))}
      </div>
    </CartWishlistContext.Provider>
  );
}

export function useCartWishlist() {
  const context = useContext(CartWishlistContext);
  if (!context) {
    throw new Error('useCartWishlist must be used within a CartWishlistProvider');
  }
  return context;
}
