'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Users,
  Boxes,
  Truck,
  BarChart3,
  Settings,
  ShieldAlert,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Bell,
  ChevronRight,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
  currentAdmin?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
}

export default function AdminLayout({
  children,
  title,
  breadcrumbs = [],
  currentAdmin,
}: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [alerts, setAlerts] = useState<{
    lowStockCount: number;
    unassignedOrdersCount: number;
    pendingOrdersCount: number;
    failedPaymentsCount: number;
  }>({
    lowStockCount: 0,
    unassignedOrdersCount: 0,
    pendingOrdersCount: 0,
    failedPaymentsCount: 0,
  });

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch('/api/admin/notifications');
        if (res.ok) {
          const data = await res.json();
          setAlerts(data);
        }
      } catch {
        // Silent background notification poll
      }
    }
    fetchAlerts();
  }, []);

  const totalAlerts =
    alerts.lowStockCount +
    alerts.unassignedOrdersCount +
    alerts.pendingOrdersCount +
    alerts.failedPaymentsCount;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch {
      router.push('/admin/login');
    }
  };

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Products', href: '/admin/products', icon: Package },
    { label: 'Categories', href: '/admin/categories', icon: FolderTree },
    { label: 'Orders', href: '/admin/orders', icon: ShoppingBag, badge: alerts.pendingOrdersCount },
    { label: 'Customers', href: '/admin/customers', icon: Users },
    { label: 'Inventory', href: '/admin/inventory', icon: Boxes, badge: alerts.lowStockCount },
    { label: 'Delivery Fleet', href: '/admin/delivery-partners', icon: Truck, badge: alerts.unassignedOrdersCount },
    { label: 'Sales Reports', href: '/admin/reports', icon: BarChart3 },
    { label: 'Store Settings', href: '/admin/settings', icon: Settings },
    { label: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 flex">
      {/* Sidebar - Desktop */}
      <aside className="w-64 bg-[#0D0D0D] text-white flex-shrink-0 flex flex-col justify-between hidden lg:flex border-r border-neutral-800">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-neutral-800/80">
            <Link href="/admin/dashboard" className="block">
              <span className="font-cinzel text-xl tracking-[0.3em] text-white block">
                HEAVEN
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#C5A059] font-medium">
                  Executive Console
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/admin/dashboard'
                  ? pathname === '/admin/dashboard'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-medium uppercase tracking-wider rounded transition-all ${
                    isActive
                      ? 'bg-neutral-800 text-white shadow-sm border-l-2 border-[#C5A059]'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${isActive ? 'text-[#C5A059]' : 'text-neutral-400'}`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && item.badge > 0 ? (
                    <span className="text-[9px] px-1.5 py-0.2 bg-[#C5A059] text-black font-bold rounded-full">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Administrator Footer & Logout */}
        <div className="p-4 border-t border-neutral-800 bg-[#0A0A0A]">
          <div className="flex items-center justify-between mb-3">
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate">
                {currentAdmin?.fullName || 'Administrator'}
              </div>
              <div className="text-[10px] text-neutral-400 truncate">
                {currentAdmin?.email || 'admin@heaven.com'}
              </div>
            </div>
            <span className="text-[9px] uppercase px-1.5 py-0.5 bg-neutral-800 text-[#C5A059] border border-neutral-700 rounded font-semibold">
              ADMIN
            </span>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-neutral-900">
            <Link
              href="/"
              target="_blank"
              className="flex-1 py-1.5 px-2 text-[10px] uppercase tracking-wider text-neutral-400 hover:text-white hover:bg-neutral-900 rounded text-center inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Storefront</span>
            </Link>

            <button
              onClick={handleLogout}
              className="py-1.5 px-3 text-[10px] uppercase tracking-wider text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded inline-flex items-center gap-1 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 bg-[#0D0D0D] text-white flex flex-col justify-between h-full z-10 p-4">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                <span className="font-cinzel text-lg tracking-widest text-white">HEAVEN ADMIN</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="mt-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 text-xs font-medium uppercase tracking-wider rounded ${
                        isActive ? 'bg-neutral-800 text-white border-l-2 border-[#C5A059]' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-[#C5A059]" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && item.badge > 0 ? (
                        <span className="text-[9px] px-1.5 py-0.2 bg-[#C5A059] text-black font-bold rounded-full">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-neutral-800">
              <button
                onClick={handleLogout}
                className="w-full py-2 text-xs uppercase tracking-wider text-rose-400 flex items-center justify-center gap-2 bg-rose-950/20 rounded"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-neutral-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-neutral-600 hover:text-black"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                <Link href="/admin/dashboard" className="hover:text-black transition-colors">
                  Admin
                </Link>
                {breadcrumbs.map((b, i) => (
                  <React.Fragment key={i}>
                    <ChevronRight className="w-3 h-3 text-neutral-300" />
                    {b.href ? (
                      <Link href={b.href} className="hover:text-black transition-colors">
                        {b.label}
                      </Link>
                    ) : (
                      <span className="text-neutral-700 font-medium">{b.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <h1 className="font-cinzel text-base font-semibold text-neutral-900 leading-tight">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="p-2 text-neutral-600 hover:text-black relative transition-colors"
                title="Operational Alerts"
              >
                <Bell className="w-4 h-4" />
                {totalAlerts > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-600 rounded-full animate-ping" />
                )}
                {totalAlerts > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-600 rounded-full" />
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-neutral-200 shadow-xl rounded-md p-4 text-xs z-50 animate-in fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                    <span className="font-semibold text-neutral-900 uppercase tracking-wider text-[11px]">
                      Operational Alerts
                    </span>
                    <span className="text-[10px] text-neutral-400">{totalAlerts} active</span>
                  </div>

                  <div className="divide-y divide-neutral-100 py-2 space-y-2">
                    {alerts.lowStockCount > 0 && (
                      <Link
                        href="/admin/inventory"
                        onClick={() => setNotificationsOpen(false)}
                        className="flex items-start gap-2.5 pt-2 text-amber-800 hover:bg-amber-50/50 p-1 rounded"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold">{alerts.lowStockCount} Low-Stock Products</div>
                          <div className="text-[10px] text-neutral-500">Inventory levels near depletion threshold</div>
                        </div>
                      </Link>
                    )}

                    {alerts.unassignedOrdersCount > 0 && (
                      <Link
                        href="/admin/delivery-partners"
                        onClick={() => setNotificationsOpen(false)}
                        className="flex items-start gap-2.5 pt-2 text-indigo-800 hover:bg-indigo-50/50 p-1 rounded"
                      >
                        <Truck className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold">{alerts.unassignedOrdersCount} Orders Awaiting Courier</div>
                          <div className="text-[10px] text-neutral-500">Require courier dispatch assignment</div>
                        </div>
                      </Link>
                    )}

                    {alerts.pendingOrdersCount > 0 && (
                      <Link
                        href="/admin/orders"
                        onClick={() => setNotificationsOpen(false)}
                        className="flex items-start gap-2.5 pt-2 text-sky-800 hover:bg-sky-50/50 p-1 rounded"
                      >
                        <Clock className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold">{alerts.pendingOrdersCount} Active Orders</div>
                          <div className="text-[10px] text-neutral-500">Processing in atelier workflow</div>
                        </div>
                      </Link>
                    )}

                    {totalAlerts === 0 && (
                      <div className="py-4 text-center text-neutral-400 text-xs">
                        All systems operational. No active alerts.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* View Storefront */}
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-black border border-neutral-200 px-3 py-1.5 rounded transition-colors"
            >
              <span>Storefront</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            {/* Profile Pill */}
            <div className="flex items-center gap-2 pl-3 border-l border-neutral-200">
              <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center font-cinzel text-xs font-bold border border-neutral-700">
                {currentAdmin?.fullName?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
