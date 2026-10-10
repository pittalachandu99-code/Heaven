'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Truck,
  Search,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Star,
  ExternalLink,
  XCircle,
} from 'lucide-react';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminDeliveryPartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [unassignedOrders, setUnassignedOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Assignment action state
  const [selectedCourierMap, setSelectedCourierMap] = useState<Record<string, string>>({});
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/delivery-partners?q=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setPartners(data.partners);
        setUnassignedOrders(data.unassignedOrders);
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to load delivery fleet data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleAssign = async (orderId: string) => {
    const partnerId = selectedCourierMap[orderId];
    if (!partnerId) {
      alert('Please select a courier partner first.');
      return;
    }

    setAssigningOrderId(orderId);
    setNotification(null);

    try {
      const res = await fetch('/api/admin/delivery-partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, deliveryPartnerId: partnerId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setNotification({ type: 'error', message: data.error || 'Failed to assign courier.' });
        setAssigningOrderId(null);
        return;
      }

      setNotification({ type: 'success', message: data.message });
      fetchData();
    } catch {
      setNotification({ type: 'error', message: 'A network error occurred.' });
    } finally {
      setAssigningOrderId(null);
    }
  };

  const handleRelieveCourier = async (orderId: string) => {
    if (!confirm('Are you certain you wish to relieve the courier from this order?')) return;

    try {
      const res = await fetch(`/api/admin/delivery-partners?orderId=${orderId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        setNotification({ type: 'error', message: data.error || 'Failed to relieve courier.' });
        return;
      }

      setNotification({ type: 'success', message: data.message });
      fetchData();
    } catch {
      setNotification({ type: 'error', message: 'A network error occurred.' });
    }
  };

  return (
    <AdminLayout
      title="White-Glove Courier Logistics"
      breadcrumbs={[{ label: 'Delivery Fleet' }]}
    >
      {/* Top Header */}
      <div>
        <h2 className="font-cinzel text-xl text-neutral-900 font-semibold">
          Courier Fleet &amp; Dispatch Allocation
        </h2>
        <p className="text-xs text-neutral-500 font-light mt-0.5">
          Manage climate-controlled courier fleet and manually stage pending flacon orders for handover.
        </p>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 border text-xs flex items-start gap-3 rounded ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Staged Orders Awaiting Allocation */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <h3 className="font-cinzel text-sm font-semibold text-neutral-900">
              Orders Awaiting White-Glove Courier Allocation ({unassignedOrders.length})
            </h3>
          </div>
          <span className="text-[11px] text-neutral-400">Atelier Staging Queue</span>
        </div>

        {unassignedOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400 space-y-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
            <div className="font-medium text-neutral-700">Dispatch Queue Clear</div>
            <p>All active confirmed orders currently have assigned couriers.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Recipient / City</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Stage</th>
                  <th className="py-2.5 px-3">Assign White-Glove Courier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {unassignedOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-neutral-50/50">
                    <td className="py-3 px-3 font-cinzel font-semibold text-neutral-900">
                      #{ord.orderNumber}
                    </td>
                    <td className="py-3 px-3 text-neutral-700">
                      <div className="font-medium">{ord.shippingRecipient}</div>
                      <div className="text-[10px] text-neutral-400">
                        {ord.shippingCity}, {ord.shippingState}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-cinzel font-semibold text-neutral-900">
                      {formatINR(ord.totalAmount)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[9px] uppercase px-2 py-0.5 bg-neutral-100 text-neutral-800 rounded font-semibold border border-neutral-200">
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2 max-w-sm">
                        <select
                          value={selectedCourierMap[ord.id] || ''}
                          onChange={(e) =>
                            setSelectedCourierMap({ ...selectedCourierMap, [ord.id]: e.target.value })
                          }
                          className="input-heaven flex-1 py-1.5 px-2 text-xs bg-white"
                        >
                          <option value="">Select courier...</option>
                          {partners.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.user?.fullName} ({p.vehicleType || 'Executive Van'})
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAssign(ord.id)}
                          disabled={assigningOrderId === ord.id || !selectedCourierMap[ord.id]}
                          className="btn-heaven-primary py-1.5 px-3 text-[11px] uppercase tracking-wider disabled:opacity-40 whitespace-nowrap"
                        >
                          {assigningOrderId === ord.id ? 'Assigning...' : 'Assign'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Registered Couriers Fleet Table */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#C5A059]" />
            <h3 className="font-cinzel text-sm font-semibold text-neutral-900">
              Active White-Glove Fleet Dossiers ({partners.length})
            </h3>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search couriers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-200 rounded outline-none focus:border-black"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-xs text-neutral-400">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading Fleet Registry...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="bg-neutral-50/50 border border-neutral-200 rounded-lg p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-cinzel font-semibold text-neutral-900 text-sm">
                      {partner.user?.fullName}
                    </div>
                    <div className="text-[11px] text-neutral-400">{partner.user?.email}</div>
                  </div>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                    Active
                  </span>
                </div>

                <div className="text-xs space-y-1 text-neutral-600 border-t border-neutral-200/60 pt-2">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>{partner.vehicleType || 'Executive Van'} &bull; {partner.vehicleNumber}</span>
                  </div>
                  {partner.user?.phone && (
                    <div className="flex items-center gap-1.5 text-neutral-500">
                      <Phone className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{partner.user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] pt-1 text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-[#C5A059] fill-[#C5A059]" />
                      <span>{partner.rating || 4.9} Rating</span>
                    </span>
                    <span>{partner.deliveriesCompleted || 0} Deliveries Completed</span>
                  </div>
                </div>

                {/* Active Assignments */}
                <div className="border-t border-neutral-200/60 pt-2 text-xs">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-500 block mb-1">
                    Active Dispatches ({partner.assignments?.length || 0})
                  </span>
                  {partner.assignments?.length === 0 ? (
                    <span className="text-[11px] text-neutral-400 italic">No active dispatches</span>
                  ) : (
                    <div className="space-y-1.5">
                      {partner.assignments.map((as: any) => (
                        <div
                          key={as.id}
                          className="p-2 bg-white border border-neutral-200 rounded flex items-center justify-between text-[11px]"
                        >
                          <div>
                            <span className="font-semibold text-neutral-900">
                              #{as.order.orderNumber}
                            </span>
                            <span className="text-neutral-400 ml-1">({as.order.shippingCity})</span>
                          </div>
                          <button
                            onClick={() => handleRelieveCourier(as.order.id)}
                            className="text-neutral-400 hover:text-rose-600 p-0.5"
                            title="Relieve courier"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
