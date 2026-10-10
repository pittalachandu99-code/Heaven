import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  User,
  Mail,
  Phone,
  Clock,
  MapPin,
  ShoppingBag,
  ArrowLeft,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: { customerId: string };
}) {
  const session = await getServerSession();

  if (!session || session.role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const { customerId } = params;

  const customer = await prisma.user.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      customerProfile: true,
      savedAddresses: { orderBy: { createdAt: 'desc' } },
      orders: {
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      },
    },
  });

  if (!customer || customer.role !== 'CUSTOMER') {
    notFound();
  }

  const eligibleOrders = customer.orders.filter((o) => o.status !== 'CANCELLED');
  const totalSpend = eligibleOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <AdminLayout
      title={`Client Dossier: ${customer.fullName}`}
      breadcrumbs={[
        { label: 'Customers', href: '/admin/customers' },
        { label: customer.fullName },
      ]}
      currentAdmin={session}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/customers"
            className="text-xs text-neutral-500 hover:text-black flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Clients Directory</span>
          </Link>
          <h2 className="font-cinzel text-2xl text-neutral-900 font-normal">
            {customer.fullName}
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Client ID: <span className="font-mono text-neutral-700">{customer.id}</span> &bull; Member since{' '}
            {new Date(customer.createdAt).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Grid Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4 shadow-sm text-xs">
          <div className="flex items-center gap-2 font-cinzel font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
            <User className="w-4 h-4 text-[#C5A059]" />
            <span>Identity &amp; Coordinates</span>
          </div>

          <div className="space-y-2 text-neutral-700">
            <div className="flex justify-between">
              <span className="text-neutral-500">Email Address</span>
              <span className="font-medium text-neutral-900">{customer.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Telephone</span>
              <span>{customer.phone || 'Not recorded'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Account Status</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-semibold uppercase rounded">
                Active
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-neutral-100">
              <span className="text-neutral-500">Recorded Order Spend</span>
              <span className="font-cinzel font-semibold text-neutral-900 text-sm">
                {formatINR(totalSpend)}
              </span>
            </div>
          </div>
        </div>

        {/* Olfactive Profile Card */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4 shadow-sm text-xs">
          <div className="flex items-center gap-2 font-cinzel font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
            <Sparkles className="w-4 h-4 text-[#C5A059]" />
            <span>Curated Olfactory Profile</span>
          </div>

          <div className="space-y-2">
            <p className="text-neutral-500 text-[11px] leading-relaxed">
              Customer preferences recorded in the private lounge assisting our master parfumeurs in bespoke curation.
            </p>
            <div className="p-3 bg-neutral-50 border border-neutral-100 rounded text-neutral-800 italic">
              {customer.customerProfile?.preferredNotes ? (
                <span>&ldquo;{customer.customerProfile.preferredNotes}&rdquo;</span>
              ) : (
                <span className="text-neutral-400 not-italic">No custom olfactory notes defined yet.</span>
              )}
            </div>
          </div>
        </div>

        {/* Saved Destinations Summary */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4 shadow-sm text-xs">
          <div className="flex items-center gap-2 font-cinzel font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
            <MapPin className="w-4 h-4 text-[#C5A059]" />
            <span>Saved Destinations ({customer.savedAddresses.length})</span>
          </div>

          {customer.savedAddresses.length === 0 ? (
            <div className="text-neutral-400 italic">No saved delivery coordinates on file.</div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {customer.savedAddresses.map((addr) => (
                <div key={addr.id} className="p-2.5 bg-neutral-50 border border-neutral-100 rounded text-[11px]">
                  <div className="font-semibold text-neutral-900">{addr.recipientName}</div>
                  <div className="text-neutral-500">
                    {addr.addressLine1}, {addr.city}, {addr.state} {addr.postalCode}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Customer Orders History */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#C5A059]" />
            <h3 className="font-cinzel text-sm font-semibold text-neutral-900">
              Acquisition History ({customer.orders.length})
            </h3>
          </div>
          <span className="text-[11px] text-neutral-400">All customer allocations</span>
        </div>

        {customer.orders.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            This client has not placed any flacon acquisitions yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Order Number</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Flacons</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {customer.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50/50">
                    <td className="py-3 px-3 font-cinzel font-semibold text-neutral-900">
                      #{order.orderNumber}
                    </td>
                    <td className="py-3 px-3 text-neutral-500">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-3 text-neutral-700">
                      {order.items.length} {order.items.length === 1 ? 'flacon' : 'flacons'}
                    </td>
                    <td className="py-3 px-3 uppercase text-[11px] text-neutral-600">
                      {order.paymentMethod}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[9px] uppercase px-2 py-0.5 bg-neutral-100 text-neutral-800 rounded font-semibold border border-neutral-200">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-cinzel font-semibold text-neutral-900">
                      {formatINR(order.totalAmount)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="btn-heaven-secondary py-1 px-2.5 text-[10px] inline-flex items-center gap-1"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
