'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DeliveryLayout from '@/components/delivery/DeliveryLayout';
import {
  Truck,
  Package,
  Clock,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  ExternalLink,
  MapPin,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Phone,
} from 'lucide-react';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DeliveryDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/delivery/dashboard');
      if (!res.ok) {
        throw new Error('Failed to load dispatch telemetry.');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err?.message || 'Error communicating with dispatch server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

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
        await fetchDashboard();
      }
    } catch {
      alert('Network error while recording delivery action.');
    } finally {
      setActionLoading(null);
    }
  };

  const partner = data?.partner;
  const metrics = data?.metrics || {
    activeCount: 0,
    awaitingPickupCount: 0,
    outForDeliveryCount: 0,
    completedTotalCount: 0,
    completedTodayCount: 0,
    totalDemoEarnings: 0,
    todayDemoEarnings: 0,
  };
  const activeAssignments = data?.activeAssignments || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <DeliveryLayout
      title="Courier Logistics Dispatch"
      breadcrumbs={[{ label: 'Dashboard' }]}
      currentCourier={partner}
    >
      {/* Top Welcome Banner */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-neutral-900 text-lg">
              {partner?.fullName || 'Elite Courier'}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
              Active On Duty
            </span>
          </div>
          <p className="text-xs text-neutral-500 font-light">
            Assigned Vehicle: <span className="font-medium text-neutral-800">{partner?.vehicleType}</span> ({partner?.vehicleNumber}) &bull; Rating: {partner?.rating?.toFixed(1) || '5.0'} / 5.0
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="p-2 border border-neutral-200 rounded hover:bg-neutral-50 text-neutral-600 transition-colors"
            title="Refresh Dispatch Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/delivery/orders"
            className="btn-heaven-primary py-2 px-4 text-xs tracking-wider inline-flex items-center gap-1.5"
          >
            <span>View All Assigned Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Deliveries */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500 text-xs uppercase tracking-wider font-medium">
            <span>Active Runs</span>
            <Truck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="font-cinzel text-2xl font-bold text-neutral-900">
            {metrics.activeCount}
          </div>
          <div className="text-[11px] text-neutral-400">Parcels currently in your care</div>
        </div>

        {/* Card 2: Awaiting Pickup */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500 text-xs uppercase tracking-wider font-medium">
            <span>Awaiting Pickup</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-cinzel text-2xl font-bold text-neutral-900">
            {metrics.awaitingPickupCount}
          </div>
          <div className="text-[11px] text-neutral-400">Staged in Flagship Atelier vault</div>
        </div>

        {/* Card 3: Out for Delivery */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500 text-xs uppercase tracking-wider font-medium">
            <span>In Transit</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-cinzel text-2xl font-bold text-neutral-900">
            {metrics.outForDeliveryCount}
          </div>
          <div className="text-[11px] text-neutral-400">En route to client destination</div>
        </div>

        {/* Card 4: Today's Demo Earnings */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500 text-xs uppercase tracking-wider font-medium">
            <span>Demo Earnings</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-cinzel text-2xl font-bold text-neutral-900">
            {formatINR(metrics.todayDemoEarnings)}
          </div>
          <div className="text-[11px] text-neutral-400">Simulated today ({metrics.completedTodayCount} runs)</div>
        </div>
      </div>

      {/* Active Work Queue Section */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h2 className="font-cinzel text-base font-semibold text-neutral-900">
              Active Dispatch Queue ({activeAssignments.length})
            </h2>
            <p className="text-[11px] text-neutral-500">
              Immediate white-glove orders requiring pickup or final customer presentation
            </p>
          </div>
          <Link
            href="/delivery/orders"
            className="text-xs font-semibold text-neutral-900 hover:text-[#C5A059] flex items-center gap-1"
          >
            <span>All Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-400">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading Dispatch Telemetry...
          </div>
        ) : activeAssignments.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <div className="font-semibold text-neutral-700">Dispatch Queue Clear</div>
            <p className="max-w-md mx-auto">
              No orders currently in transit. Orders assigned by store administration in Module 4 will appear here instantly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAssignments.map((assignment: any) => {
              const order = assignment.order;
              const isAwaitingPickup = ['ASSIGNED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(order.status);
              const isPickedUp = order.status === 'PICKED_UP';
              const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY';

              return (
                <div
                  key={assignment.id}
                  className="p-5 border border-neutral-200 rounded-lg space-y-3 bg-[#FCFCFC] hover:border-black transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-cinzel font-semibold text-sm text-neutral-900">
                        #{order.orderNumber}
                      </div>
                      <div className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#C5A059]" />
                        <span>{order.shippingCity}, {order.shippingState}</span>
                      </div>
                    </div>

                    <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-neutral-100 text-neutral-800 rounded border border-neutral-300">
                      {order.status}
                    </span>
                  </div>

                  {/* Recipient Coordinates */}
                  <div className="p-3 bg-white border border-neutral-100 rounded text-xs space-y-1">
                    <div className="font-medium text-neutral-900">{order.shippingRecipient}</div>
                    <div className="text-[11px] text-neutral-500 truncate">{order.shippingAddressLine1}</div>
                    {order.shippingPhone && (
                      <div className="text-[11px] text-neutral-600 flex items-center gap-1 pt-1">
                        <Phone className="w-3 h-3 text-neutral-400" />
                        <span>{order.shippingPhone}</span>
                      </div>
                    )}
                  </div>

                  {/* Parcels Count */}
                  <div className="text-[11px] text-neutral-500 flex items-center justify-between">
                    <span>
                      {order.items?.length || 1} {order.items?.length === 1 ? 'Flacon Package' : 'Flacon Packages'}
                    </span>
                    <span className="font-cinzel font-semibold text-neutral-900">
                      {formatINR(order.totalAmount)}
                    </span>
                  </div>

                  {/* Workflow Action Buttons */}
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2">
                    <Link
                      href={`/delivery/orders/${order.id}`}
                      className="btn-heaven-secondary py-1.5 px-3 text-[11px] flex items-center gap-1"
                    >
                      <span>Dispatch Console</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>

                    {isAwaitingPickup && (
                      <button
                        onClick={() => handleQuickAction(order.id, 'pickup')}
                        disabled={actionLoading === order.id}
                        className="btn-heaven-primary py-1.5 px-3 text-[11px] tracking-wider"
                      >
                        {actionLoading === order.id ? 'Securing...' : 'Confirm Pickup'}
                      </button>
                    )}

                    {isPickedUp && (
                      <button
                        onClick={() => handleQuickAction(order.id, 'out_for_delivery')}
                        disabled={actionLoading === order.id}
                        className="py-1.5 px-3 bg-neutral-900 hover:bg-black text-white text-[11px] font-semibold uppercase tracking-wider rounded"
                      >
                        {actionLoading === order.id ? 'Updating...' : 'Start Transit'}
                      </button>
                    )}

                    {isOutForDelivery && (
                      <Link
                        href={`/delivery/orders/${order.id}`}
                        className="py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold uppercase tracking-wider rounded flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Handover &amp; Deliver</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Handover History Summary */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h3 className="font-cinzel text-base font-semibold text-neutral-900">
              Recent Handover Activity
            </h3>
            <p className="text-[11px] text-neutral-500">
              Archive of all completed and past delivery assignments
            </p>
          </div>
          <Link
            href="/delivery/history"
            className="text-xs font-semibold text-neutral-900 hover:text-[#C5A059] flex items-center gap-1"
          >
            <span>Full History Archive</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentActivity.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            No completed delivery records logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Order Number</th>
                  <th className="py-2.5 px-3">Destination</th>
                  <th className="py-2.5 px-3">Assigned Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Demo Compensation</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {recentActivity.map((a: any) => (
                  <tr key={a.id} className="hover:bg-neutral-50/50">
                    <td className="py-3 px-3 font-cinzel font-semibold text-neutral-900">
                      #{a.order.orderNumber}
                    </td>
                    <td className="py-3 px-3 text-neutral-700">
                      <div>{a.order.shippingRecipient}</div>
                      <div className="text-[10px] text-neutral-400">{a.order.shippingCity}</div>
                    </td>
                    <td className="py-3 px-3 text-neutral-500">
                      {new Date(a.assignedAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[9px] uppercase px-2 py-0.5 rounded font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200">
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-cinzel font-semibold text-emerald-800">
                      {a.status === 'DELIVERED' ? formatINR(a.demoEarnings || 180) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/delivery/orders/${a.order.id}`}
                        className="btn-heaven-secondary py-1 px-2.5 text-[10px] inline-flex items-center gap-1"
                      >
                        <span>Details</span>
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
    </DeliveryLayout>
  );
}
