import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { 
  Package, 
  Clock, 
  MapPin, 
  CreditCard, 
  ExternalLink, 
  Truck, 
  ChevronRight, 
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-semibold uppercase tracking-wider">
          <Clock className="w-3 h-3 text-amber-700" />
          Confirmed
        </span>
      );
    case 'PREPARING':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-900 border border-indigo-200 text-[10px] font-semibold uppercase tracking-wider">
          <Package className="w-3 h-3 text-indigo-700" />
          Cellar Staging
        </span>
      );
    case 'READY_FOR_PICKUP':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-900 border border-purple-200 text-[10px] font-semibold uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-purple-700" />
          Ready for Courier
        </span>
      );
    case 'PICKED_UP':
    case 'OUT_FOR_DELIVERY':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-900 border border-sky-200 text-[10px] font-semibold uppercase tracking-wider">
          <Truck className="w-3 h-3 text-sky-700" />
          Out for Delivery
        </span>
      );
    case 'DELIVERED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10px] font-semibold uppercase tracking-wider">
          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
          Delivered
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-900 border border-rose-200 text-[10px] font-semibold uppercase tracking-wider">
          <AlertCircle className="w-3 h-3 text-rose-700" />
          Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-800 border border-neutral-200 text-[10px] font-semibold uppercase tracking-wider">
          {status}
        </span>
      );
  }
}

export default async function OrdersHistoryPage() {
  const session = await getServerSession();

  if (!session) {
    redirect('/login?callbackUrl=/orders');
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: 'desc' },
    include: {
      items: true,
      deliveryAssignment: {
        include: {
          deliveryPartner: {
            include: {
              user: { select: { fullName: true } },
            },
          },
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-[#FCFCFC] text-neutral-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Header Section */}
        <div className="bg-white border border-neutral-200 p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-[0.35em] text-[#C5A059] font-medium block">
              Private Client Dossier
            </span>
            <h1 className="font-cinzel text-3xl sm:text-4xl text-neutral-950 font-normal">
              Acquisition Archive
            </h1>
            <p className="text-xs text-neutral-500 font-light">
              Review and track your past haute parfumerie allocations and white-glove dispatches.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/products"
              className="btn-heaven-secondary py-3 px-5 text-xs tracking-wider inline-flex items-center gap-2"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Explore Collection</span>
            </Link>
            <Link
              href="/account"
              className="btn-heaven-primary py-3 px-5 text-xs tracking-wider inline-flex items-center gap-2"
            >
              <span>Account Dossier</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Empty State */}
        {orders.length === 0 ? (
          <div className="bg-white border border-neutral-200 p-16 text-center space-y-6 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-neutral-50 border border-neutral-200 flex items-center justify-center mx-auto text-neutral-400">
              <Package className="w-8 h-8 stroke-[1.2]" />
            </div>
            <div className="space-y-2">
              <h2 className="font-cinzel text-2xl text-neutral-950">
                No Allocations on Record
              </h2>
              <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
                You have not acquired any HEAVEN fragrances yet. Explore our curated flacons of haute parfumerie to place your first reservation.
              </p>
            </div>
            <Link
              href="/products"
              className="btn-heaven-primary py-4 px-8 text-xs tracking-[0.2em] inline-block"
            >
              Discover Fragrances
            </Link>
          </div>
        ) : (
          /* Orders List */
          <div className="space-y-6">
            {orders.map((order) => {
              const courierName = order.deliveryAssignment?.deliveryPartner?.user?.fullName;
              const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              return (
                <div
                  key={order.id}
                  className="bg-white border border-neutral-200 hover:border-neutral-300 transition-all shadow-sm"
                >
                  {/* Order Top Bar */}
                  <div className="p-6 bg-neutral-50/70 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-neutral-500 block">
                          Order Number
                        </span>
                        <span className="font-cinzel text-sm font-semibold text-neutral-950">
                          #{order.orderNumber}
                        </span>
                      </div>
                      <div className="hidden sm:block border-l border-neutral-200 h-8" />
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-neutral-500 block">
                          Acquisition Date
                        </span>
                        <span className="text-xs text-neutral-800 font-medium">
                          {formattedDate}
                        </span>
                      </div>
                      <div className="hidden sm:block border-l border-neutral-200 h-8" />
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-neutral-500 block">
                          Total Investment
                        </span>
                        <span className="font-cinzel text-sm font-bold text-neutral-950">
                          {formatINR(order.totalAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  {/* Order Body */}
                  <div className="p-6 space-y-6">
                    {/* Item list */}
                    <div className="divide-y divide-neutral-100">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative w-14 h-14 bg-neutral-50 border border-neutral-200 overflow-hidden flex-shrink-0">
                              <Image
                                src={item.productImage || '/perfumes/heaven-bottle-1.jpg'}
                                alt={item.productName}
                                fill
                                sizes="56px"
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <Link
                                href={`/products/${item.productSlug}`}
                                className="font-cinzel text-sm font-medium text-neutral-900 hover:text-[#C5A059] transition-colors"
                              >
                                {item.productName}
                              </Link>
                              <div className="text-xs text-neutral-500 mt-0.5">
                                Qty: {item.quantity} &bull; {item.productSize} &bull; {formatINR(item.unitPrice)} each
                              </div>
                            </div>
                          </div>

                          <div className="font-cinzel text-sm font-semibold text-neutral-950">
                            {formatINR(item.totalPrice)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Metadata Footer */}
                    <div className="pt-4 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                      <div className="flex flex-wrap items-center gap-4 text-neutral-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                          <span>
                            {order.shippingRecipient} &bull; {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}
                          </span>
                        </div>
                        {courierName && (
                          <div className="flex items-center gap-1.5 text-neutral-700">
                            <Truck className="w-3.5 h-3.5 text-[#C5A059]" />
                            <span>Courier: {courierName}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/track/${order.id}`}
                          className="btn-heaven-secondary py-2 px-4 text-[11px] tracking-wider inline-flex items-center gap-1.5"
                        >
                          <Truck className="w-3 h-3 text-[#C5A059]" />
                          <span>Track Dispatch</span>
                        </Link>
                        <Link
                          href={`/orders/${order.id}`}
                          className="btn-heaven-primary py-2 px-4 text-[11px] tracking-wider inline-flex items-center gap-1.5"
                        >
                          <span>View Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
