'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import DeliveryLayout from '@/components/delivery/DeliveryLayout';
import OrderTrackingMap from '@/components/orders/OrderTrackingMap';
import OrderStatusTimeline from '@/components/orders/OrderStatusTimeline';
import {
  ArrowLeft,
  Truck,
  Package,
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ExternalLink,
  Navigation,
  FileText,
  X,
} from 'lucide-react';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DeliveryOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState('');

  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueReason, setIssueReason] = useState('CUSTOMER_UNAVAILABLE');
  const [issueNotes, setIssueNotes] = useState('');

  // Live Location Sharing state
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/delivery/orders/${orderId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to retrieve order dispatch details.');
      }
      const data = await res.json();
      setOrder(data.order);
    } catch (err: any) {
      setError(err?.message || 'Error communicating with dispatch server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  // Handle Workflow Action
  const executeAction = async (action: string, payload: any = {}) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/delivery/orders/${orderId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to execute delivery action.');
      } else {
        setShowHandoverModal(false);
        setShowIssueModal(false);
        await fetchOrderDetail();
      }
    } catch {
      alert('Network error while processing status transition.');
    } finally {
      setActionLoading(false);
    }
  };

  // Browser Geolocation Telemetry Sharing
  const startLocationSharing = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setLocationStatus('Acquiring satellite GPS fix...');
    setIsSharingLocation(true);

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await fetch('/api/delivery/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude }),
          });
          setLocationStatus(
            `Live GPS Active: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E (Updated: ${new Date().toLocaleTimeString()})`
          );
        } catch {
          setLocationStatus('Failed to transmit location coordinates to dispatch.');
        }
      },
      (err) => {
        setIsSharingLocation(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationStatus('Location access denied by user or device settings.');
        } else {
          setLocationStatus(`Location error: ${err.message}`);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );

    setWatchId(id);
  };

  const stopLocationSharing = () => {
    if (watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsSharingLocation(false);
    setLocationStatus('Location sharing paused.');
  };

  // Clean up geolocation watcher on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  if (loading) {
    return (
      <DeliveryLayout title="Dispatch Fulfillment Console">
        <div className="p-20 text-center text-xs text-neutral-400">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading Order Manifest &amp; Corridor Coordinates...
        </div>
      </DeliveryLayout>
    );
  }

  if (error || !order) {
    return (
      <DeliveryLayout title="Dispatch Fulfillment Console">
        <div className="p-16 text-center space-y-4 bg-white border border-neutral-200 rounded-lg">
          <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
          <div className="font-cinzel text-lg text-neutral-900">Order Dispatch Unavailable</div>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">{error}</p>
          <Link href="/delivery/orders" className="btn-heaven-primary py-2.5 px-6 text-xs inline-block">
            Return to Assigned Orders
          </Link>
        </div>
      </DeliveryLayout>
    );
  }

  const isAwaitingPickup = ['ASSIGNED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(order.status);
  const isPickedUp = order.status === 'PICKED_UP';
  const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY';
  const isDelivered = order.status === 'DELIVERED';
  const isFailed = order.status === 'DELIVERY_FAILED';

  const pickupOrigin = order.pickupOrigin;
  const assignment = order.assignment;

  return (
    <DeliveryLayout
      title={`Dispatch Console: #${order.orderNumber}`}
      breadcrumbs={[
        { label: 'Orders', href: '/delivery/orders' },
        { label: `#${order.orderNumber}` },
      ]}
    >
      {/* Top Header & Quick Status */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href="/delivery/orders"
            className="text-xs text-neutral-500 hover:text-black flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Assigned Orders</span>
          </Link>
          <div className="flex items-center gap-3">
            <h2 className="font-cinzel text-2xl font-bold text-neutral-900">
              #{order.orderNumber}
            </h2>
            <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded bg-neutral-900 text-white">
              {order.status}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Recipient: <span className="font-semibold text-neutral-800">{order.shippingRecipient}</span> &bull; Destination:{' '}
            <span className="font-medium text-neutral-800">{order.shippingCity}, {order.shippingState}</span>
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isAwaitingPickup && (
            <button
              onClick={() => executeAction('pickup')}
              disabled={actionLoading}
              className="btn-heaven-primary py-2.5 px-5 text-xs tracking-wider"
            >
              {actionLoading ? 'Securing...' : '1. Confirm Atelier Pickup'}
            </button>
          )}

          {isPickedUp && (
            <button
              onClick={() => executeAction('out_for_delivery')}
              disabled={actionLoading}
              className="py-2.5 px-5 bg-neutral-900 hover:bg-black text-white text-xs font-semibold uppercase tracking-wider rounded"
            >
              {actionLoading ? 'Starting...' : '2. Start Transit (Out for Delivery)'}
            </button>
          )}

          {isOutForDelivery && (
            <button
              onClick={() => setShowHandoverModal(true)}
              disabled={actionLoading}
              className="py-2.5 px-5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold uppercase tracking-wider rounded flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>3. Confirm Handover &amp; Deliver</span>
            </button>
          )}

          {!isDelivered && (
            <button
              onClick={() => setShowIssueModal(true)}
              className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold uppercase tracking-wider rounded flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Report Issue</span>
            </button>
          )}
        </div>
      </div>

      {/* Two-Column Layout: Left = Logistics Details & Workflow, Right = Map & Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Origin, Destination, Manifest */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pickup Details Card */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#C5A059]" />
                <h3 className="font-cinzel text-sm font-semibold text-neutral-900">
                  Pickup Origin &amp; Cellar Vault
                </h3>
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${pickupOrigin?.latitude || 28.5901},${pickupOrigin?.longitude || 77.1942}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-neutral-600 hover:text-black flex items-center gap-1 underline"
              >
                <Navigation className="w-3 h-3 text-indigo-600" />
                <span>Directions to Atelier</span>
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <div className="font-semibold text-neutral-900">{pickupOrigin?.name}</div>
                <div className="text-neutral-500">{pickupOrigin?.cellar}</div>
                <div className="text-neutral-600">{pickupOrigin?.addressLine1}</div>
                <div className="text-neutral-600">{pickupOrigin?.city}, {pickupOrigin?.state} {pickupOrigin?.postalCode}</div>
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-100 rounded space-y-1 text-[11px]">
                <div className="font-medium text-neutral-800">Dispatch Instructions:</div>
                <p className="text-neutral-500 leading-relaxed">{pickupOrigin?.instructions}</p>
                <div className="text-neutral-600 pt-1 font-mono">
                  Atelier Concierge: {pickupOrigin?.contactPhone}
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Destination & Recipient Card */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C5A059]" />
                <h3 className="font-cinzel text-sm font-semibold text-neutral-900">
                  Recipient Destination Coordinates
                </h3>
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  `${order.shippingAddressLine1}, ${order.shippingCity}, ${order.shippingState} ${order.shippingPostalCode}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-neutral-600 hover:text-black flex items-center gap-1 underline"
              >
                <Navigation className="w-3 h-3 text-emerald-600" />
                <span>Directions to Client</span>
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <div className="font-bold text-neutral-900 text-sm">{order.shippingRecipient}</div>
                <div className="text-neutral-600">{order.shippingAddressLine1}</div>
                {order.shippingAddressLine2 && <div className="text-neutral-600">{order.shippingAddressLine2}</div>}
                <div className="text-neutral-600 font-medium">
                  {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}
                </div>

                {order.shippingPhone && (
                  <div className="pt-2">
                    <a
                      href={`tel:${order.shippingPhone}`}
                      className="btn-heaven-secondary py-1.5 px-3 text-[11px] inline-flex items-center gap-1.5"
                    >
                      <Phone className="w-3 h-3 text-[#C5A059]" />
                      <span>Call Client: {order.shippingPhone}</span>
                    </a>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {order.shippingInstructions && (
                  <div className="p-3 bg-neutral-50 border border-neutral-100 rounded text-xs space-y-1">
                    <span className="font-medium text-neutral-800 text-[11px]">Client Instructions:</span>
                    <p className="text-neutral-600 italic text-[11px]">{order.shippingInstructions}</p>
                  </div>
                )}

                <div className="p-3 bg-neutral-50 border border-neutral-100 rounded text-xs space-y-1">
                  <div className="flex justify-between text-neutral-600">
                    <span>Payment Mode:</span>
                    <span className="font-semibold uppercase text-neutral-900">{order.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Collection Status:</span>
                    <span className="font-semibold text-neutral-900">{order.paymentStatus}</span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-200 pt-1 font-cinzel font-semibold text-neutral-900">
                    <span>Total Amount:</span>
                    <span>{formatINR(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Package Items Manifest */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#C5A059]" />
                <h3 className="font-cinzel text-sm font-semibold text-neutral-900">
                  Flacon Package Manifest ({order.items?.length || 0})
                </h3>
              </div>
              <span className="text-[11px] text-neutral-400">Handle with extreme care</span>
            </div>

            <div className="divide-y divide-neutral-100">
              {order.items?.map((item: any) => (
                <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    {item.productImage && (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-10 h-10 object-contain bg-neutral-50 border border-neutral-200 rounded p-1"
                      />
                    )}
                    <div>
                      <div className="font-semibold text-neutral-900">{item.productName}</div>
                      <div className="text-[11px] text-neutral-500">{item.productSize}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-medium text-neutral-800">Qty: {item.quantity}</span>
                    <div className="font-cinzel font-semibold text-neutral-900 text-[11px]">
                      {formatINR(item.totalPrice)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Timeline */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm space-y-4">
            <h3 className="font-cinzel text-sm font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
              Custody Transfer Timeline
            </h3>
            <OrderStatusTimeline currentStatus={order.status} events={order.events || []} />
          </div>
        </div>

        {/* Right Column (1 Col): Live Map & GPS Location Telemetry */}
        <div className="space-y-6">
          {/* Live Map */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600" />
                <h3 className="font-cinzel text-sm font-semibold text-neutral-900">
                  Corridor Telemetry
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded">
                Live
              </span>
            </div>

            <OrderTrackingMap
              orderNumber={order.orderNumber}
              recipientCity={order.shippingCity}
              recipientState={order.shippingState}
              orderStatus={order.status}
              partnerName={assignment?.deliveryPartner?.user?.fullName}
              vehicleType={assignment?.deliveryPartner?.vehicleType}
              partnerLat={assignment?.deliveryPartner?.currentLatitude}
              partnerLng={assignment?.deliveryPartner?.currentLongitude}
            />

            {/* Live GPS Sharing Control */}
            <div className="pt-2 border-t border-neutral-100 space-y-3">
              <div className="text-xs font-semibold text-neutral-900 flex items-center justify-between">
                <span>Courier Geolocation Sharing:</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  isSharingLocation ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                }`}>
                  {isSharingLocation ? 'Broadcasting' : 'Inactive'}
                </span>
              </div>

              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Transmits your vehicle coordinates to the client's order tracking screen for precise white-glove ETA estimation.
              </p>

              {locationStatus && (
                <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded text-[11px] font-mono text-neutral-700">
                  {locationStatus}
                </div>
              )}

              <div className="flex gap-2">
                {!isSharingLocation ? (
                  <button
                    onClick={startLocationSharing}
                    className="w-full py-2 px-3 bg-neutral-900 hover:bg-black text-white text-xs font-semibold uppercase tracking-wider rounded flex items-center justify-center gap-1.5"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Start Live Location Sharing</span>
                  </button>
                ) : (
                  <button
                    onClick={stopLocationSharing}
                    className="w-full py-2 px-3 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-semibold uppercase tracking-wider rounded"
                  >
                    Pause Location Sharing
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Handover Delivery Confirmation Modal */}
      {showHandoverModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-cinzel text-base font-semibold text-neutral-900">
                  Confirm Delivery Handover
                </h3>
              </div>
              <button onClick={() => setShowHandoverModal(false)} className="text-neutral-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              You are about to record the completed delivery of flacons for Order{' '}
              <span className="font-semibold text-neutral-900">#{order.orderNumber}</span> to recipient{' '}
              <span className="font-semibold text-neutral-900">{order.shippingRecipient}</span>.
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-neutral-700">
                Handover Notes / Client Acknowledgment (Optional):
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Handed directly to recipient at concierge lobby. Signature verified."
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                className="w-full p-2.5 text-xs border border-neutral-200 rounded focus:border-black outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                onClick={() => setShowHandoverModal(false)}
                className="btn-heaven-secondary py-2 px-4 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => executeAction('delivered', { handoverNotes })}
                disabled={actionLoading}
                className="py-2 px-5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold uppercase tracking-wider rounded"
              >
                {actionLoading ? 'Recording...' : 'Confirm Completed Handover'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exception Report Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-cinzel text-base font-semibold text-neutral-900">
                  Report Delivery Issue
                </h3>
              </div>
              <button onClick={() => setShowIssueModal(false)} className="text-neutral-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Flag this order as unfulfilled. The issue will be recorded in the store audit log for administration.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-neutral-700 mb-1">
                  Primary Issue Reason:
                </label>
                <select
                  value={issueReason}
                  onChange={(e) => setIssueReason(e.target.value)}
                  className="w-full p-2.5 text-xs border border-neutral-200 rounded focus:border-black outline-none bg-white"
                >
                  <option value="CUSTOMER_UNAVAILABLE">Recipient unavailable at destination coordinates</option>
                  <option value="INCORRECT_ADDRESS">Destination address clarification required</option>
                  <option value="ACCESS_RESTRICTED">Security / diplomatic gate access restricted</option>
                  <option value="CUSTOMER_REQUESTED_RESCHEDULE">Recipient requested delivery rescheduling</option>
                  <option value="OTHER">Other operational courier exception</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-700 mb-1">
                  Operational Notes:
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide concise operational details regarding the delivery issue..."
                  value={issueNotes}
                  onChange={(e) => setIssueNotes(e.target.value)}
                  className="w-full p-2.5 text-xs border border-neutral-200 rounded focus:border-black outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                onClick={() => setShowIssueModal(false)}
                className="btn-heaven-secondary py-2 px-4 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => executeAction('issue', { issueReason, issueNotes })}
                disabled={actionLoading}
                className="py-2 px-5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold uppercase tracking-wider rounded"
              >
                {actionLoading ? 'Recording...' : 'Submit Issue Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DeliveryLayout>
  );
}
