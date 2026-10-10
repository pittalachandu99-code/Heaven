'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  Heart, 
  User as UserIcon, 
  Menu, 
  X, 
  ShieldCheck, 
  Truck, 
  LogOut,
  Play
} from 'lucide-react';
import { useCartWishlist } from '@/context/CartWishlistContext';

interface UserSession {
  id: string;
  email: string;
  fullName: string;
  role: 'CUSTOMER' | 'ADMIN' | 'DELIVERY_PARTNER';
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<UserSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const { cartCount, wishlistCount, setCartDrawerOpen } = useCartWishlist();

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setSessionUser(data.user);
          } else {
            setSessionUser(null);
          }
        }
      } catch {
        setSessionUser(null);
      } finally {
        setLoadingSession(false);
      }
    }
    fetchSession();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setSessionUser(null);
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 transition-all">
      {/* Top Banner */}
      <div className="bg-black text-neutral-300 text-[11px] py-2 px-4 text-center tracking-[0.2em] uppercase font-light">
        <span>Complimentary White-Glove Courier Delivery on Orders Above ₹5,000</span>
        <span className="mx-3 opacity-40">|</span>
        <span className="text-[#C5A059]">Artisanal Haute Parfumerie</span>
      </div>

      {/* Main Nav Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left: Storefront Links */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            href="/products" 
            className={`text-xs uppercase tracking-[0.2em] font-medium transition-colors ${
              pathname === '/products' ? 'text-black font-semibold' : 'text-neutral-700 hover:text-black'
            }`}
          >
            Collection
          </Link>
          <Link 
            href="/categories" 
            className={`text-xs uppercase tracking-[0.2em] font-medium transition-colors ${
              pathname === '/categories' ? 'text-black font-semibold' : 'text-neutral-700 hover:text-black'
            }`}
          >
            Olfactive Families
          </Link>
          <Link 
            href="/#craftsmanship" 
            className="text-xs uppercase tracking-[0.2em] font-medium text-neutral-700 hover:text-black transition-colors"
          >
            Artisanship
          </Link>
          <Link 
            href="/intro" 
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] font-medium text-[#C5A059] hover:text-[#AA771C] transition-colors"
          >
            <Play className="w-3 h-3 fill-current" />
            4K Experience
          </Link>
        </nav>

        {/* Center: Brand Wordmark */}
        <div className="flex-1 md:flex-none flex justify-center items-center">
          <Link href="/" className="group flex flex-col items-center">
            <span className="heaven-wordmark text-2xl md:text-3xl font-normal tracking-[0.35em] text-neutral-950 transition-transform group-hover:scale-[1.02]">
              HEAVEN
            </span>
            <span className="text-[9px] tracking-[0.4em] uppercase text-neutral-400 font-light -mt-0.5">
              HAUTE PARFUMERIE
            </span>
          </Link>
        </div>

        {/* Right: Actions & User Controls */}
        <div className="flex items-center space-x-5">
          {/* Role Portals Shortcuts */}
          <div className="hidden lg:flex items-center space-x-3 border-r border-neutral-200 pr-5">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.15em] text-neutral-500 hover:text-black transition-colors py-1 px-2 rounded hover:bg-neutral-100"
              title="Admin Management Portal"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </Link>
            <Link
              href="/delivery/login"
              className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.15em] text-neutral-500 hover:text-black transition-colors py-1 px-2 rounded hover:bg-neutral-100"
              title="Delivery Partner Portal"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Courier</span>
            </Link>
          </div>

          {/* User Account State */}
          {!loadingSession && (
            <>
              {sessionUser ? (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/account"
                    className="hidden sm:flex flex-col text-right hover:opacity-80 transition-opacity"
                    title="Customer Lounge Account"
                  >
                    <span className="text-xs font-medium text-neutral-900 truncate max-w-[120px]">
                      {sessionUser.fullName}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-[#C5A059]">
                      {sessionUser.role === 'CUSTOMER' ? 'Client Lounge' : sessionUser.role.replace('_', ' ')}
                    </span>
                  </Link>

                  {sessionUser.role === 'ADMIN' && (
                    <Link
                      href="/admin/dashboard"
                      className="text-xs font-semibold uppercase tracking-wider px-2 py-1 bg-black text-white hover:bg-neutral-800"
                    >
                      Console
                    </Link>
                  )}

                  {sessionUser.role === 'DELIVERY_PARTNER' && (
                    <Link
                      href="/delivery/dashboard"
                      className="text-xs font-semibold uppercase tracking-wider px-2 py-1 bg-black text-white hover:bg-neutral-800"
                    >
                      Deliveries
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="text-neutral-500 hover:text-black p-1.5 transition-colors"
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] font-medium text-neutral-800 hover:text-black border border-neutral-300 hover:border-black px-3.5 py-1.5 transition-all"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
              )}
            </>
          )}

          {/* Wishlist Link with Live Badge */}
          <Link
            href="/wishlist"
            className="relative text-neutral-700 hover:text-black transition-colors p-1"
            title="Saved Perfumes"
            aria-label="Wishlist"
          >
            <Heart className="w-4 h-4" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#C5A059] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Trigger with Live Badge & Drawer Opener */}
          <button
            onClick={() => setCartDrawerOpen(true)}
            className="relative text-neutral-700 hover:text-black transition-colors p-1"
            title="Open Selection Bag"
            aria-label="Shopping Bag"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-neutral-800 p-1"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white px-6 py-6 space-y-4">
          <Link
            href="/products"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm uppercase tracking-[0.2em] font-medium text-neutral-800"
          >
            Collection
          </Link>
          <Link
            href="/categories"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm uppercase tracking-[0.2em] font-medium text-neutral-800"
          >
            Olfactive Families
          </Link>
          <Link
            href="/wishlist"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm uppercase tracking-[0.2em] font-medium text-neutral-800 flex items-center justify-between"
          >
            <span>Saved Fragrances</span>
            {wishlistCount > 0 && (
              <span className="bg-[#C5A059] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link
            href="/cart"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm uppercase tracking-[0.2em] font-medium text-neutral-800 flex items-center justify-between"
          >
            <span>Shopping Bag</span>
            {cartCount > 0 && (
              <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {cartCount}
              </span>
            )}
          </Link>
          <Link
            href="/intro"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm uppercase tracking-[0.2em] font-medium text-[#C5A059]"
          >
            4K Experience
          </Link>
          {sessionUser && (
            <Link
              href="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm uppercase tracking-[0.2em] font-medium text-neutral-800"
            >
              Client Lounge Account
            </Link>
          )}
          <div className="pt-4 border-t border-neutral-100 flex flex-col space-y-3">
            <Link
              href="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs uppercase tracking-[0.15em] text-neutral-600 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" /> Admin Management Portal
            </Link>
            <Link
              href="/delivery/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs uppercase tracking-[0.15em] text-neutral-600 flex items-center gap-2"
            >
              <Truck className="w-4 h-4" /> Delivery Partner Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
