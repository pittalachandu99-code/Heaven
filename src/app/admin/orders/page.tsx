'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  ShoppingBag,
  Search,
  Filter,
  ExternalLink,
  Truck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';

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
      return <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold uppercase tracking-wider rounded">Confirmed</span>;
    case 'PREPARING':
      return <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-semibold uppercase tracking-wider rounded">Cellar Staging</span>;
    case 'READY_FOR_PICKUP':
      return <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-semibold uppercase tracking-wider rounded">Ready Courier</span>;
    case 'PICKED_UP':
    case 'OUT_FOR_DELIVERY':
      return <span className="px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-semibold uppercase tracking-wider rounded">In Transit</span>;
    case 'DELIVERED':
      return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold uppercase tracking-wider rounded">Delivered</span>;
    case 'CANCELLED':
      return <span className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-semibold uppercase tracking-wider rounded">Cancelled</span>;
    default:
      return <span className="px-2 py-0.5 bg-neutral-100 text-neutral-800 border border-neutral-200 text-[10px] font-semibold uppercase tracking-wider rounded">{status}</span>;
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');
  const [selectedAssigned, setSelectedAssigned] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.set('q', search);
      if (selectedStatus) params.set('status', selectedStatus);
      if (selectedPaymentStatus) params.set('paymentStatus', selectedPaymentStatus);
      if (selectedAssigned) params.set('assigned', selectedAssigned);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setPagination(data.pagination);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, selectedStatus, selectedPaymentStatus, selectedAssigned]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchOrders();
  };

  return (
    <AdminLayout
      title="Acquisition &amp; Order Pipeline"
      breadcrumbs={[{ label: 'Orders' }]}
    >
      {/* Top Header */}
      <div>
        <h2 className="font-cinzel text-xl text-neutral-900 font-semibold">
          Customer Orders Management ({pagination.total})
        </h2>
        <p className="text-xs text-neutral-500 font-light mt-0.5">
          Monitor dispatch fulfillment, customer delivery coordinates, and courier partner handovers.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-neutral-200 p-4 rounded-lg shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by order #, client name, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-neutral-200 rounded focus:border-black outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="py-2 px-3 text-xs border border-neutral-200 rounded bg-white text-neutral-800 focus:border-black outline-none"
            >
              <option value="">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PREPARING">Cellar Staging</option>
              <option value="READY_FOR_PICKUP">Ready for Courier</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={selectedPaymentStatus}
              onChange={(e) => {
                setSelectedPaymentStatus(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="py-2 px-3 text-xs border border-neutral-200 rounded bg-white text-neutral-800 focus:border-black outline-none"
            >
              <option value="">All Payment Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="COD_PENDING">COD Pending</option>
              <option value="REFUNDED">Refunded</option>
            </select>

            <select
              value={selectedAssigned}
              onChange={(e) => {
                setSelectedAssigned(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="py-2 px-3 text-xs border border-neutral-200 rounded bg-white text-neutral-800 focus:border-black outline-none"
            >
              <option value="">All Courier Assignments</option>
              <option value="unassigned">Unassigned Only</option>
              <option value="assigned">Assigned Couriers</option>
            </select>

            <button
              type="submit"
              className="py-2 px-4 bg-neutral-900 hover:bg-black text-white text-xs uppercase tracking-wider font-semibold rounded"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-neutral-400">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading Order Records...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center text-xs text-neutral-400 space-y-2">
            <ShoppingBag className="w-8 h-8 mx-auto text-neutral-300" />
            <div className="font-semibold text-neutral-700">No Orders Recorded Yet</div>
            <p>Orders will appear here automatically when clients complete checkout from the customer storefront.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Order # &amp; Date</th>
                  <th className="py-3 px-4">Client Dossier</th>
                  <th className="py-3 px-4">Items / Total</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Fulfillment Status</th>
                  <th className="py-3 px-4">Courier Partner</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.map((order) => {
                  const courier = order.deliveryAssignment?.deliveryPartner?.user?.fullName;
                  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-cinzel text-xs font-semibold text-neutral-900">
                          #{order.orderNumber}
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          {formattedDate}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-neutral-900">
                          {order.shippingRecipient}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {order.user.email} &bull; {order.shippingCity}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-cinzel font-semibold text-neutral-900">
                          {formatINR(order.totalAmount)}
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          {order.items.length} {order.items.length === 1 ? 'flacon' : 'flacons'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-neutral-800 text-[11px] uppercase tracking-wider">
                          {order.paymentMethod}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {order.paymentStatus}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {getStatusBadge(order.status)}
                      </td>

                      <td className="py-3.5 px-4">
                        {courier ? (
                          <div className="flex items-center gap-1.5 text-neutral-800">
                            <Truck className="w-3.5 h-3.5 text-[#C5A059]" />
                            <span className="font-medium">{courier}</span>
                          </div>
                        ) : (
                          <span className="text-amber-700 text-[11px] font-semibold">
                            Awaiting Driver
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="btn-heaven-secondary py-1.5 px-3 text-[11px] tracking-wider inline-flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-neutral-200 bg-neutral-50/50 flex items-center justify-between text-xs">
            <span className="text-neutral-500">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total orders)
            </span>

            <div className="flex items-center gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="p-1.5 border border-neutral-200 rounded disabled:opacity-40 hover:bg-white"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="p-1.5 border border-neutral-200 rounded disabled:opacity-40 hover:bg-white"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
