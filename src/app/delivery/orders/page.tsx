'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DeliveryLayout from '@/components/delivery/DeliveryLayout';
import {
  Package,
  Search,
  Filter,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Truck,
  ArrowRight,
} from 'lucide-react';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DeliveryOrdersPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrders = async (tab = activeTab, query = search) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ tab });
      if (query.trim()) params.set('q', query.trim());

      const res = await fetch(`/api/delivery/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(activeTab, search);
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(activeTab, search);
  };

  const handleQuickAction = async (orderId: string, action: string) => {
    try {
      setActionLoading(orderId);
      const res = await fetch(`/api/delivery/orders/${orderId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Failed to update order status.');
      } else {
        await fetchOrders(activeTab, search);
      }
    } catch {
      alert('Network error while processing delivery update.');
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'new', label: 'New Staged' },
    { id: 'pickup', label: 'Awaiting Pickup' },
    { id: 'out_for_delivery', label: 'In Transit' },
    { id: 'delivered', label: 'Completed' },
    { id: 'failed', label: 'Exceptions' },
  ];

  return (
    <DeliveryLayout
      title="My Assigned Orders &amp; Dispatches"
      breadcrumbs={[{ label: 'Orders' }]}
    >
      {/* Top Search Toolbar & Tab Navigation */}
      <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by Order # (e.g. HVN-2026-XXXXXX)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs border border-neutral-200 rounded focus:border-black outline-none"
            />
          </div>
          <button
            type="submit"
            className="py-2.5 px-5 bg-neutral-900 hover:bg-black text-white text-xs uppercase tracking-wider font-semibold rounded"
          >
            Search
          </button>
        </form>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-1.5 px-3.5 rounded text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-neutral-900 text-white font-semibold'
                  : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List Container */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-neutral-400">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Filtering Assigned Dispatches...
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-16 text-center text-xs text-neutral-400 space-y-2">
            <Package className="w-8 h-8 text-neutral-300 mx-auto" />
            <div className="font-semibold text-neutral-700">No Orders Matching Filter</div>
            <p className="max-w-md mx-auto">
              There are currently no orders under this status tab. Select another filter or wait for store administrator dispatches.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {assignments.map((assignment) => {
              const order = assignment.order;
              const isAwaitingPickup = ['ASSIGNED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(order.status);
              const isPickedUp = order.status === 'PICKED_UP';
              const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY';
              const isDelivered = order.status === 'DELIVERED';
              const isFailed = order.status === 'DELIVERY_FAILED';

              return (
                <div
                  key={assignment.id}
                  className="p-5 sm:p-6 hover:bg-neutral-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-3">
                      <span className="font-cinzel text-base font-bold text-neutral-900">
                        #{order.orderNumber}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-200">
                        {order.status}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        Assigned:{' '}
                        {new Date(assignment.assignedAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Coordinates & Recipient */}
                    <div className="text-xs space-y-0.5">
                      <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>{order.shippingRecipient} &bull; {order.shippingCity}, {order.shippingState}</span>
                      </div>
                      <div className="text-neutral-500 pl-5 text-[11px]">
                        {order.shippingAddressLine1} {order.shippingPostalCode}
                      </div>
                      {order.shippingPhone && (
                        <div className="text-neutral-600 pl-5 text-[11px] flex items-center gap-1 pt-0.5">
                          <Phone className="w-3 h-3 text-neutral-400" />
                          <a href={`tel:${order.shippingPhone}`} className="hover:underline">
                            {order.shippingPhone}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Packaging summary */}
                    <div className="text-[11px] text-neutral-500 pt-1">
                      {order.items?.length || 1} {order.items?.length === 1 ? 'flacon item' : 'flacon items'} &bull; Payment:{' '}
                      <span className="font-medium uppercase text-neutral-700">{order.paymentMethod}</span> ({order.paymentStatus})
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-end gap-2.5">
                    <div className="font-cinzel text-sm font-semibold text-neutral-900">
                      {formatINR(order.totalAmount)}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/delivery/orders/${order.id}`}
                        className="btn-heaven-secondary py-2 px-3 text-xs tracking-wider inline-flex items-center gap-1"
                      >
                        <span>Dispatch Console</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>

                      {isAwaitingPickup && (
                        <button
                          onClick={() => handleQuickAction(order.id, 'pickup')}
                          disabled={actionLoading === order.id}
                          className="btn-heaven-primary py-2 px-3 text-xs tracking-wider"
                        >
                          {actionLoading === order.id ? 'Securing...' : 'Confirm Pickup'}
                        </button>
                      )}

                      {isPickedUp && (
                        <button
                          onClick={() => handleQuickAction(order.id, 'out_for_delivery')}
                          disabled={actionLoading === order.id}
                          className="py-2 px-3 bg-neutral-900 hover:bg-black text-white text-xs font-semibold uppercase tracking-wider rounded"
                        >
                          {actionLoading === order.id ? 'Updating...' : 'Start Transit'}
                        </button>
                      )}

                      {isOutForDelivery && (
                        <Link
                          href={`/delivery/orders/${order.id}`}
                          className="py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold uppercase tracking-wider rounded flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Handover Delivery</span>
                        </Link>
                      )}

                      {isDelivered && (
                        <span className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded font-semibold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Fulfilled</span>
                        </span>
                      )}

                      {isFailed && (
                        <span className="text-[11px] text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded font-semibold inline-flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Issue Pending Review</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DeliveryLayout>
  );
}
