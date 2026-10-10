'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Truck,
  LayoutDashboard,
  Package,
  Clock,
  DollarSign,
  User,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Radio,
  CheckCircle2,
} from 'lucide-react';

interface DeliveryLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
  currentCourier?: {
    fullName: string;
    vehicleType?: string | null;
    vehicleNumber?: string | null;
    isAvailable?: boolean;
    rating?: number;
  };
}

export default function DeliveryLayout({
  children,
  title,
  breadcrumbs = [],
  currentCourier,
}: DeliveryLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/delivery/login');
      router.refresh();
    } catch {
      router.push('/delivery/login');
    } finally {
      setLoggingOut(false);
    }
  };

  const navItems = [
    { label: 'Dashboard', href: '/delivery/dashboard', icon: LayoutDashboard },
    { label: 'My Assigned Orders', href: '/delivery/orders', icon: Package },
    { label: 'Delivery History', href: '/delivery/history', icon: Clock },
    { label: 'Demo Earnings', href: '/delivery/earnings', icon: DollarSign },
    { label: 'Courier Profile', href: '/delivery/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-neutral-200 px-4 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-black" />
          <span className="font-cinzel text-base tracking-[0.2em] font-bold text-black">
            HEAVEN
          </span>
          <span className="text-[9px] uppercase px-1.5 py-0.5 bg-neutral-100 border border-neutral-300 font-semibold text-neutral-700 rounded">
            Courier
          </span>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-neutral-700 hover:text-black focus:outline-none"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0A0A0A] text-neutral-200 flex flex-col justify-between transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen md:sticky md:top-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-180 -translate-x-full'
        }`}
      >
        <div>
          {/* Brand Wordmark & Role Badge */}
          <div className="p-6 border-b border-neutral-800">
            <Link href="/delivery/dashboard" className="block space-y-1">
              <span className="font-cinzel text-xl tracking-[0.25em] text-white block">
                HEAVEN
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C5A059] block font-medium">
                Logistics Dispatch Terminal
              </span>
            </Link>

            {currentCourier && (
              <div className="mt-4 pt-3 border-t border-neutral-900 flex items-center justify-between text-xs">
                <div>
                  <div className="text-white font-medium text-xs truncate max-w-[140px]">
                    {currentCourier.fullName}
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    {currentCourier.vehicleType || 'Executive Van'}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-[#C5A059]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{currentCourier.rating ? currentCourier.rating.toFixed(1) : '5.0'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/delivery/dashboard'
                  ? pathname === '/delivery/dashboard'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 text-xs rounded transition-colors ${
                    isActive
                      ? 'bg-neutral-800/90 text-white font-semibold border-l-2 border-[#C5A059]'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#C5A059]' : 'text-neutral-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Operational Controls */}
        <div className="p-4 border-t border-neutral-800 space-y-3">
          <div className="px-3 py-2 bg-neutral-900/80 border border-neutral-800 rounded text-[11px] flex items-center justify-between">
            <span className="text-neutral-400">Status</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active on Duty</span>
            </span>
          </div>

          <Link
            href="/"
            className="flex items-center justify-between px-3 py-2 text-[11px] text-neutral-400 hover:text-white transition-colors"
          >
            <span>Public Boutique</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs rounded transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{loggingOut ? 'Signing out...' : 'Courier Logout'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-neutral-200 px-6 py-4 hidden md:flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Link href="/delivery/dashboard" className="hover:text-black">
              Dispatch
            </Link>
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                <ChevronRight className="w-3 h-3 text-neutral-400" />
                {b.href ? (
                  <Link href={b.href} className="hover:text-black">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-neutral-900 font-medium">{b.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="inline-flex items-center gap-2 text-xs text-neutral-700 bg-neutral-50 px-3 py-1.5 border border-neutral-200 rounded">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-[11px] uppercase tracking-wider">
                GPS Corridor Linked
              </span>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {title && (
            <div className="border-b border-neutral-200 pb-4">
              <h1 className="font-cinzel text-2xl text-neutral-900 font-semibold tracking-wide">
                {title}
              </h1>
            </div>
          )}
          {children}
        </main>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
        />
      )}
    </div>
  );
}
