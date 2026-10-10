'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  ShoppingBag,
  ArrowLeft,
  Truck,
  MapPin,
  CreditCard,
  User,
  Clock,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Status transition state
  const [selectedStatus, setSelectedStatus] = useState('');
  const [transitionNote, setTransitionNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delivery partner selection
  const [partners, setPartners] = useState<any[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [assigningPartner, setAssigningPartner] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to retrieve order.');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setOrder(data.order);
      setSelectedStatus(data.order.status);
    } catch {
      setError('A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPartners = async () => {
    try {
      const res = await fetch('/api/admin/delivery-partners');
      if (res.ok) {
        const data = await res.json();
        setPartners(data.partners || []);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
      fetchPartners();
    }
  }, [orderId]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus || selectedStatus === order.status) return;

    setUpdatingStatus(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedStatus,
          note: transitionNote.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to update order status.' });
        setUpdatingStatus(false);
        return;
      }

      setStatusMessage({ type: 'success', text: data.message });
      setTransitionNote('');
      fetchOrder();
    } catch {
      setStatusMessage({ type: 'error', text: 'A network error occurred.' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerId) return;

    setAssigningPartner(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/admin/delivery-partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          deliveryPartnerId: selectedPartnerId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to assign courier.' });
        setAssigningPartner(false);
        return;
      }

      setStatusMessage({ type: 'success', text: 'White-glove courier assigned successfully.' });
      setSelectedPartnerId('');
      fetchOrder();
    } catch {
      setStatusMessage({ type: 'error', text: 'A network error occurred.' });
    } finally {
      setAssigningPartner(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Order Details" breadcrumbs={[{ label: 'Orders', href: '/admin/orders' }]}>
        <div className="p-16 text-center text-xs text-neutral-400">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Retrieving Order Dossier...
        </div>
      </AdminLayout>
    );
  }

  if (error || !order) {
    return (
      <AdminLayout title="Order Not Found" breadcrumbs={[{ label: 'Orders', href: '/admin/orders' }]}>
        <div className="bg-white border border-neutral-200 p-12 text-center space-y-4 rounded-lg">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h2 className="font-cinzel text-lg text-neutral-900 font-semibold">Order Dossier Not Found</h2>
          <p className="text-xs text-neutral-500">{error || 'This order could not be located in records.'}</p>
          <Link href="/admin/orders" className="btn-heaven-primary py-2 px-5 text-xs inline-block">
            Return to Orders
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const courier = order.deliveryAssignment?.deliveryPartner;

  return (
    <AdminLayout
      title={`Order #${order.orderNumber}`}
      breadcrumbs={[
        { label: 'Orders', href: '/admin/orders' },
        { label: `#${order.orderNumber}` },
      ]}
    >
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/orders"
            className="text-xs text-neutral-500 hover:text-black flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Orders List</span>
          </Link>
          <h2 className="font-cinzel text-2xl text-neutral-900 font-normal">
            Order #{order.orderNumber}
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Placed on {new Date(order.createdAt).toLocaleString('en-IN')} &bull; Status:{' '}
            <span className="font-semibold text-neutral-900 uppercase">{order.status}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/track/${order.id}`}
            target="_blank"
            className="btn-heaven-secondary py-2.5 px-4 text-xs tracking-wider uppercase inline-flex items-center gap-1.5"
          >
            <Truck className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Customer Track View</span>
          </Link>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-4 border text-xs flex items-start gap-3 rounded ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Items, Breakdown & Customer Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Purchased Line Items */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4 shadow-sm">
            <h3 className="font-cinzel text-sm font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
              Allocated Flacons ({order.items.length})
            </h3>

            <div className="divide-y divide-neutral-100">
              {order.items.map((item: any) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="relative w-14 h-14 bg-neutral-50 border border-neutral-200 rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={item.productImage || '/perfumes/heaven-bottle-1.jpg'}
                        alt={item.productName}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-cinzel text-xs font-semibold text-neutral-900">
                        {item.productName}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        Qty: {item.quantity} &bull; {item.productSize}
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {formatINR(item.unitPrice)} each
                      </div>
                    </div>
                  </div>

                  <div className="font-cinzel text-sm font-semibold text-neutral-900">
                    {formatINR(item.totalPrice)}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="pt-4 border-t border-neutral-200 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span className="font-medium text-neutral-900">{formatINR(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>White-Glove Courier Logistics</span>
                <span className="font-medium text-neutral-900">
                  {order.shippingFee === 0 ? 'Complimentary' : formatINR(order.shippingFee)}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Privilege Discount</span>
                  <span>-{formatINR(order.discountAmount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-neutral-200 flex justify-between items-baseline font-bold">
                <span className="text-neutral-900 uppercase tracking-wider">Total Amount</span>
                <span className="font-cinzel text-lg text-neutral-950">
                  {formatINR(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Address & Customer Dossier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-2 text-xs shadow-sm">
              <div className="flex items-center gap-2 font-cinzel font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
                <MapPin className="w-4 h-4 text-[#C5A059]" />
                <span>Delivery Coordinates</span>
              </div>
              <div className="font-medium text-neutral-900 pt-1">{order.shippingRecipient}</div>
              <div className="text-neutral-500">{order.shippingPhone}</div>
              <div className="text-neutral-700">{order.shippingAddressLine1}</div>
              {order.shippingAddressLine2 && <div className="text-neutral-700">{order.shippingAddressLine2}</div>}
              <div className="text-neutral-700">
                {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}
              </div>
              {order.shippingInstructions && (
                <div className="p-2 bg-neutral-50 border border-neutral-100 rounded text-[11px] italic text-neutral-600 mt-2">
                  Instructions: &ldquo;{order.shippingInstructions}&rdquo;
                </div>
              )}
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-2 text-xs shadow-sm">
              <div className="flex items-center gap-2 font-cinzel font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
                <CreditCard className="w-4 h-4 text-[#C5A059]" />
                <span>Payment Verification</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-neutral-500">Method</span>
                <span className="font-semibold text-neutral-900 uppercase">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Status</span>
                <span className="font-semibold text-neutral-900 uppercase">{order.paymentStatus}</span>
              </div>
              {order.paymentSimulations?.[0] && (
                <div className="pt-2 border-t border-neutral-100 font-mono text-[10px] text-neutral-500">
                  Ref: {order.paymentSimulations[0].transactionReference}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Status Transitions, Courier Assignment & Audit Timeline */}
        <div className="space-y-6">
          {/* Order Lifecycle Transition Card */}
          <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-4 shadow-sm text-xs">
            <h3 className="font-cinzel text-sm font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
              Fulfillment Status Control
            </h3>

            <form onSubmit={handleStatusUpdate} className="space-y-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                  Transition Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="input-heaven w-full py-2 px-3 text-xs bg-white font-medium"
                >
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PREPARING">PREPARING (Cellar Staging)</option>
                  <option value="READY_FOR_PICKUP">READY_FOR_PICKUP</option>
                  <option value="PICKED_UP">PICKED_UP (Courier Handover)</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED (Restores Stock)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 mb-1 font-medium">
                  Administrative Note (Optional)
                </label>
                <input
                  type="text"
                  value={transitionNote}
                  onChange={(e) => setTransitionNote(e.target.value)}
                  placeholder="e.g. Staged in climate vault; courier verified"
                  className="input-heaven w-full py-2 px-3 text-xs bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={updatingStatus || selectedStatus === order.status}
                className="btn-heaven-primary w-full py-2 text-xs uppercase tracking-wider disabled:opacity-40"
              >
                {updatingStatus ? 'Updating...' : 'Apply Transition'}
              </button>
            </form>
          </div>

          {/* White-Glove Courier Assignment Card */}
          <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-4 shadow-sm text-xs">
            <h3 className="font-cinzel text-sm font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
              White-Glove Courier Allocation
            </h3>

            {courier ? (
              <div className="space-y-2">
                <div className="p-3 bg-neutral-50 border border-neutral-100 rounded space-y-1">
                  <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>{courier.user?.fullName}</span>
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Vehicle: {courier.vehicleType} &bull; Rating: {courier.rating}★
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Contact: {courier.user?.phone || 'On File'}
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAssignCourier} className="space-y-3">
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  Assign an available white-glove courier to pick up and deliver this flacon allocation.
                </p>

                <select
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  className="input-heaven w-full py-2 px-3 text-xs bg-white"
                >
                  <option value="">Select Available Courier...</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.user?.fullName} ({p.vehicleType || 'Executive Van'})
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={assigningPartner || !selectedPartnerId}
                  className="btn-heaven-primary w-full py-2 text-xs uppercase tracking-wider disabled:opacity-40"
                >
                  {assigningPartner ? 'Assigning...' : 'Assign Courier'}
                </button>
              </form>
            )}
          </div>

          {/* Audited Event History */}
          <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-3 shadow-sm text-xs">
            <h3 className="font-cinzel text-sm font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
              Audited Dispatch History ({order.events?.length || 0})
            </h3>

            <div className="divide-y divide-neutral-100 max-h-60 overflow-y-auto space-y-2">
              {order.events?.map((ev: any) => (
                <div key={ev.id} className="pt-2 first:pt-0 space-y-0.5">
                  <div className="font-semibold text-neutral-900">{ev.title}</div>
                  {ev.description && (
                    <div className="text-[11px] text-neutral-500">{ev.description}</div>
                  )}
                  <div className="text-[10px] text-neutral-400">
                    {new Date(ev.createdAt).toLocaleString()} &bull; Actor: {ev.actorRole || 'System'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
