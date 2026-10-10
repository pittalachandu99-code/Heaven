import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  TrendingUp,
  Users,
  Package,
  AlertTriangle,
  Truck,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  DollarSign,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function AdminDashboardPage() {
  const session = await getServerSession();

  if (!session || session.role !== 'ADMIN') {
    redirect('/admin/login');
  }

  // 1. Fetch KPI Counts & Summaries
  const [
    totalOrders,
    awaitingProcessingOrders,
    deliveredOrders,
    allOrders,
    totalCustomers,
    activeProducts,
    lowStockProducts,
    activeAssignments,
    recentOrders,
    recentCustomers,
    recentMovements,
    categories,
    settings,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({
      where: { status: { in: ['PLACED', 'CONFIRMED', 'PREPARING'] } },
    }),
    prisma.order.count({
      where: { status: 'DELIVERED' },
    }),
    prisma.order.findMany({
      select: {
        id: true,
        totalAmount: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        createdAt: true,
      },
    }),
    prisma.user.count({
      where: { role: 'CUSTOMER' },
    }),
    prisma.product.count({
      where: { isPublished: true, isArchived: false },
    }),
    prisma.product.findMany({
      where: {
        isPublished: true,
        isArchived: false,
        stockQuantity: { lte: 10 },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        lowStockThreshold: true,
        price: true,
      },
      take: 5,
    }),
    prisma.deliveryAssignment.count({
      where: { status: { in: ['ASSIGNED', 'PICKED_UP'] } },
    }),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true, email: true } },
        items: true,
        deliveryAssignment: {
          include: {
            deliveryPartner: {
              include: { user: { select: { fullName: true } } },
            },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
        orders: { select: { id: true } },
      },
    }),
    prisma.inventoryMovement.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { name: true, sku: true } } },
    }),
    prisma.category.findMany({
      include: {
        products: {
          select: { id: true, price: true },
        },
      },
    }),
    prisma.storeSettings.findUnique({ where: { id: 'default' } }),
  ]);

  // 2. Revenue Calculations according to financial rules:
  // Exclude failed payments and cancelled orders
  const eligibleOrders = allOrders.filter((o) => o.status !== 'CANCELLED');
  const eligibleRevenue = eligibleOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Collected demo payments: completed payments (UPI/Card completed, COD delivered)
  const collectedPayments = allOrders
    .filter((o) => o.paymentStatus === 'COMPLETED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  // COD pending collection
  const codPendingCollection = allOrders
    .filter((o) => o.paymentMethod === 'COD' && o.paymentStatus === 'COD_PENDING')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  // Unassigned orders count
  const unassignedOrdersCount = await prisma.order.count({
    where: {
      status: { in: ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'] },
      deliveryAssignment: null,
    },
  });

  return (
    <AdminLayout
      title="Store Operations Overview"
      breadcrumbs={[{ label: 'Executive Dashboard' }]}
      currentAdmin={session}
    >
      {/* Demo Simulation Labeling Notice */}
      <div className="bg-amber-50/80 border border-amber-200/80 p-4 rounded-md flex items-start gap-3 text-xs text-amber-900 shadow-sm">
        <Sparkles className="w-4 h-4 text-[#C5A059] flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong className="font-semibold block uppercase tracking-wider text-[11px]">
            Demonstration Store Operations &bull; Simulated Environment
          </strong>
          <p className="text-amber-800 leading-relaxed text-[11px]">
            All financial figures represent recorded order acquisition value from demonstration UPI, card, and COD simulated checkouts. No real financial debits or bank collections have taken place.
          </p>
        </div>
      </div>

      {/* 8 Primary Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Eligible Sales Revenue */}
        <div className="bg-white border border-neutral-200 p-5 rounded-lg shadow-sm space-y-3">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] uppercase tracking-wider font-medium">Recorded Order Value</span>
            <span className="p-2 bg-neutral-100 rounded-md text-neutral-800">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="font-cinzel text-2xl font-bold text-neutral-950">
              {formatINR(eligibleRevenue)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Collected: <span className="font-medium text-emerald-700">{formatINR(collectedPayments)}</span> &bull; COD Pending: {formatINR(codPendingCollection)}
            </div>
          </div>
        </div>

        {/* KPI 2: Total Orders */}
        <div className="bg-white border border-neutral-200 p-5 rounded-lg shadow-sm space-y-3">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] uppercase tracking-wider font-medium">Total Orders</span>
            <span className="p-2 bg-neutral-100 rounded-md text-neutral-800">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="font-cinzel text-2xl font-bold text-neutral-950">
              {totalOrders}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Across all customer accounts
            </div>
          </div>
        </div>

        {/* KPI 3: Orders Awaiting Processing */}
        <div className="bg-white border border-neutral-200 p-5 rounded-lg shadow-sm space-y-3">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] uppercase tracking-wider font-medium">In Atelier Pipeline</span>
            <span className="p-2 bg-amber-50 rounded-md text-amber-700">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="font-cinzel text-2xl font-bold text-amber-950">
              {awaitingProcessingOrders}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Staging &amp; cellar preparation
            </div>
          </div>
        </div>

        {/* KPI 4: Delivered Orders */}
        <div className="bg-white border border-neutral-200 p-5 rounded-lg shadow-sm space-y-3">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] uppercase tracking-wider font-medium">Delivered Dispatches</span>
            <span className="p-2 bg-emerald-50 rounded-md text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="font-cinzel text-2xl font-bold text-emerald-950">
              {deliveredOrders}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Recipient signature completed
            </div>
          </div>
        </div>

        {/* KPI 5: Total Customers */}
        <div className="bg-white border border-neutral-200 p-5 rounded-lg shadow-sm space-y-3">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] uppercase tracking-wider font-medium">Registered Clients</span>
            <span className="p-2 bg-neutral-100 rounded-md text-neutral-800">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="font-cinzel text-2xl font-bold text-neutral-950">
              {totalCustomers}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Private lounge dossiers
            </div>
          </div>
        </div>

        {/* KPI 6: Active Products */}
        <div className="bg-white border border-neutral-200 p-5 rounded-lg shadow-sm space-y-3">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] uppercase tracking-wider font-medium">Active Catalogue Flacons</span>
            <span className="p-2 bg-neutral-100 rounded-md text-neutral-800">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="font-cinzel text-2xl font-bold text-neutral-950">
              {activeProducts}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Published in boutique
            </div>
          </div>
        </div>

        {/* KPI 7: Low Stock Alerts */}
        <div className={`p-5 rounded-lg shadow-sm space-y-3 border ${
          lowStockProducts.length > 0 ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-neutral-200'
        }`}>
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] uppercase tracking-wider font-medium">Depletion Alerts</span>
            <span className={`p-2 rounded-md ${lowStockProducts.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-neutral-100 text-neutral-800'}`}>
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className={`font-cinzel text-2xl font-bold ${lowStockProducts.length > 0 ? 'text-rose-950' : 'text-neutral-950'}`}>
              {lowStockProducts.length}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Stock &le; 10 units threshold
            </div>
          </div>
        </div>

        {/* KPI 8: Active Delivery Assignments */}
        <div className="bg-white border border-neutral-200 p-5 rounded-lg shadow-sm space-y-3">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] uppercase tracking-wider font-medium">Active Transit Couriers</span>
            <span className="p-2 bg-indigo-50 rounded-md text-indigo-700">
              <Truck className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="font-cinzel text-2xl font-bold text-indigo-950">
              {activeAssignments}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              {unassignedOrdersCount} unassigned awaiting dispatch
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Middle Section: Operational Alerts & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Operational Priority Alerts */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-lg p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <h2 className="font-cinzel text-base font-semibold text-neutral-900">
              Operational Priority Attention
            </h2>
            <span className="text-[11px] text-neutral-400">Real-time cellar telemetry</span>
          </div>

          <div className="space-y-3">
            {/* Alert 1: Unassigned Orders */}
            {unassignedOrdersCount > 0 && (
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-indigo-950">
                      {unassignedOrdersCount} Confirmed Orders Awaiting Courier Assignment
                    </div>
                    <div className="text-[11px] text-indigo-700">
                      Orders verified and staged; require white-glove driver allocation.
                    </div>
                  </div>
                </div>
                <Link
                  href="/admin/delivery-partners"
                  className="btn-heaven-primary py-1.5 px-3 text-[11px] uppercase tracking-wider"
                >
                  Assign Fleet
                </Link>
              </div>
            )}

            {/* Alert 2: Low Stock */}
            {lowStockProducts.length > 0 ? (
              <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-md space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-950 font-semibold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Low Stock Flacons ({lowStockProducts.length})</span>
                  </div>
                  <Link
                    href="/admin/inventory"
                    className="text-[11px] font-semibold text-rose-700 hover:underline"
                  >
                    Manage Inventory &rarr;
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  {lowStockProducts.map((p) => (
                    <div
                      key={p.id}
                      className="p-2 bg-white border border-rose-100 rounded flex justify-between items-center text-[11px]"
                    >
                      <span className="font-medium text-neutral-900 truncate pr-2">{p.name}</span>
                      <span className="font-bold text-rose-600 whitespace-nowrap">
                        {p.stockQuantity} remaining
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-neutral-50 border border-neutral-100 rounded-md text-xs text-neutral-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>All catalogue flacons maintain healthy inventory reserves.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Fragrance Category Distribution */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <h3 className="font-cinzel text-base font-semibold text-neutral-900">
              Olfactive Realms
            </h3>
            <Link
              href="/admin/categories"
              className="text-[11px] text-neutral-500 hover:text-black"
            >
              Manage
            </Link>
          </div>

          <div className="space-y-3">
            {categories.map((c) => (
              <div key={c.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-neutral-800">{c.name}</span>
                  <span className="text-neutral-500">{c.products.length} Flacons</span>
                </div>
                <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-neutral-900 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (c.products.length / Math.max(1, activeProducts)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity: Recent Orders & Recent Customer Dossiers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-lg p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <h3 className="font-cinzel text-base font-semibold text-neutral-900">
                Recent Acquisitions &amp; Dispatches
              </h3>
              <p className="text-[11px] text-neutral-500">Most recent customer allocations</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-neutral-900 hover:text-[#C5A059] flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400 space-y-1">
              <ShoppingBag className="w-6 h-6 mx-auto text-neutral-300 mb-1" />
              <div className="font-semibold text-neutral-700">No Orders Placed Yet</div>
              <p>Acquisitions will appear here as customers checkout from the boutique storefront.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-400 uppercase tracking-wider text-[10px]">
                    <th className="pb-2">Order #</th>
                    <th className="pb-2">Client</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Courier</th>
                    <th className="pb-2 text-right">Amount</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {recentOrders.map((order) => {
                    const courierName =
                      order.deliveryAssignment?.deliveryPartner?.user?.fullName;
                    return (
                      <tr key={order.id} className="hover:bg-neutral-50/50">
                        <td className="py-3 font-semibold text-neutral-900">
                          #{order.orderNumber}
                        </td>
                        <td className="py-3 text-neutral-700">
                          <div className="font-medium">{order.shippingRecipient}</div>
                          <div className="text-[10px] text-neutral-400">{order.user.email}</div>
                        </td>
                        <td className="py-3">
                          <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 font-semibold bg-neutral-100 text-neutral-800 rounded border border-neutral-200">
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 text-neutral-600">
                          {courierName ? (
                            <span className="text-neutral-900 font-medium">{courierName}</span>
                          ) : (
                            <span className="text-amber-700 font-medium">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 text-right font-cinzel font-semibold text-neutral-900">
                          {formatINR(order.totalAmount)}
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="p-1.5 text-neutral-500 hover:text-black inline-block"
                            title="Inspect Order"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recently Registered Clients */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <h3 className="font-cinzel text-base font-semibold text-neutral-900">
                New Client Profiles
              </h3>
              <p className="text-[11px] text-neutral-500">Latest registered customers</p>
            </div>
            <Link
              href="/admin/customers"
              className="text-xs font-semibold text-neutral-900 hover:text-[#C5A059]"
            >
              All Clients
            </Link>
          </div>

          <div className="divide-y divide-neutral-100 space-y-2">
            {recentCustomers.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                No customer accounts registered yet.
              </div>
            ) : (
              recentCustomers.map((c) => (
                <div key={c.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-medium text-neutral-900">{c.fullName}</div>
                    <div className="text-[10px] text-neutral-400">{c.email}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-500">
                      {c.orders.length} {c.orders.length === 1 ? 'order' : 'orders'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
