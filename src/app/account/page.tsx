import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import AccountProfileForm from '@/components/account/AccountProfileForm';
import SavedAddressesManager from '@/components/account/SavedAddressesManager';
import { 
  User, 
  ShoppingBag, 
  Heart, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Package,
  Truck,
  ExternalLink
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function AccountPage() {
  const session = await getServerSession();

  if (!session) {
    redirect('/login?callbackUrl=/account');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      customerProfile: true,
      savedAddresses: {
        orderBy: { createdAt: 'desc' },
      },
      orders: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      },
    },
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[#FCFCFC] text-neutral-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Welcome Header */}
        <div className="bg-white border border-neutral-200 p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A059] font-medium block">
              Private Client Lounge
            </span>
            <h1 className="font-cinzel text-3xl sm:text-4xl text-neutral-950 font-normal">
              {user.fullName}
            </h1>
            <p className="text-xs text-neutral-500 font-light">
              Client Dossier &bull; Member since {new Date(user.createdAt).getFullYear()}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/orders"
              className="btn-heaven-secondary py-3 px-5 text-xs tracking-wider inline-flex items-center gap-2"
            >
              <Package className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Acquisition Archive</span>
            </Link>
            <Link
              href="/wishlist"
              className="btn-heaven-secondary py-3 px-5 text-xs tracking-wider inline-flex items-center gap-2"
            >
              <Heart className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Saved Flacons</span>
            </Link>
            <Link
              href="/cart"
              className="btn-heaven-primary py-3 px-5 text-xs tracking-wider inline-flex items-center gap-2"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Current Bag</span>
            </Link>
          </div>
        </div>

        {/* Profile & Preferences Form */}
        <div className="bg-white border border-neutral-200 p-8 sm:p-10 space-y-6">
          <div className="border-b border-neutral-100 pb-4">
            <h2 className="font-cinzel text-xl text-neutral-950">
              Personal Information &amp; Olfactive Profile
            </h2>
            <p className="text-xs text-neutral-500 font-light mt-1">
              Your bespoke preferences assist our parfumeurs in curating personalized allocations.
            </p>
          </div>

          <AccountProfileForm
            initialFullName={user.fullName}
            initialPhone={user.phone || ''}
            initialNotes={user.customerProfile?.preferredNotes || ''}
            email={user.email}
          />
        </div>

        {/* Saved Delivery Addresses Management */}
        <div className="bg-white border border-neutral-200 p-8 sm:p-10">
          <SavedAddressesManager initialAddresses={user.savedAddresses as any} />
        </div>

        {/* Order History */}
        <div className="bg-white border border-neutral-200 p-8 sm:p-10 space-y-6">
          <div className="border-b border-neutral-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="font-cinzel text-xl text-neutral-950">
                Recent Acquisitions
              </h2>
              <p className="text-xs text-neutral-500 font-light mt-1">
                Your recent perfume dispatches and tracking history.
              </p>
            </div>

            {user.orders.length > 0 && (
              <Link
                href="/orders"
                className="text-xs font-semibold text-black hover:text-[#C5A059] flex items-center gap-1 uppercase tracking-wider transition-colors"
              >
                <span>View All Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {user.orders.length === 0 ? (
            <div className="text-center py-12 space-y-3 bg-neutral-50 border border-neutral-100 p-6">
              <Clock className="w-8 h-8 text-neutral-400 mx-auto" />
              <div className="text-sm font-semibold text-neutral-800">
                No Acquisitions on Record
              </div>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                You have not completed any acquisitions yet. Select flacons from our collection to reserve your first fragrance.
              </p>
              <Link
                href="/products"
                className="btn-heaven-primary py-3 px-6 text-xs mt-2 inline-block"
              >
                Explore Flacons
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {user.orders.map((order) => (
                <div key={order.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-cinzel font-semibold text-black text-sm">#{order.orderNumber}</span>
                      <span className="text-neutral-400">&bull;</span>
                      <span className="text-neutral-500">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="text-neutral-500">
                      {order.items.length} {order.items.length === 1 ? 'flacon' : 'flacons'} &bull; Total: <span className="font-semibold text-neutral-900">{formatINR(order.totalAmount)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 bg-neutral-100 text-neutral-800 font-semibold border border-neutral-200">
                      {order.status}
                    </span>
                    <Link
                      href={`/track/${order.id}`}
                      className="btn-heaven-secondary py-1.5 px-3 text-[11px] inline-flex items-center gap-1"
                    >
                      <Truck className="w-3 h-3 text-[#C5A059]" />
                      <span>Track</span>
                    </Link>
                    <Link
                      href={`/orders/${order.id}`}
                      className="btn-heaven-primary py-1.5 px-3 text-[11px] inline-flex items-center gap-1"
                    >
                      <span>Details</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
