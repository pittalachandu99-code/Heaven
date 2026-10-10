'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import OrderStatusTimeline from '@/components/orders/OrderStatusTimeline';
import {
  CheckCircle2,
  Clock,
  MapPin,
  CreditCard,
  Truck,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  Package,
  ShieldCheck,
  ChevronRight,
  XCircle,
  FileText
} from 'lucide-react';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function OrderDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = params?.orderId as string;
  const isNewOrder = searchParams.get('newOrder') === 'true';

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelMessage, setCancelMessage] = useState('');

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.status === 401) {
        router.push(`/login?callbackUrl=/orders/${orderId}`);
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to retrieve order details.');
        setLoading(false);
        return;
      }

      const data = await res.json();
      setOrder(data.order);
    } catch {
      setError('A network error occurred while retrieving order information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleCancelOrder = async () => {
    setCancelling(true);
    setCancelMessage('');
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setCancelMessage(data.error || 'Failed to cancel acquisition.');
        setCancelling(false);
        return;
      }

      // Success
      setShowCancelModal(false);
      await fetchOrder();
    } catch {
      setCancelMessage('A network error occurred. Please try again.');
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-16">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-xs uppercase tracking-widest text-neutral-500">
              Retrieving Acquisition Dossier...
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#FCFCFC] text-neutral-900 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-20 text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="font-cinzel text-3xl text-neutral-950">Acquisition Not Found</h1>
            <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
              {error || 'The requested order could not be located or you do not have permission to view this record.'}
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <Link href="/orders" className="btn-heaven-secondary py-3 px-6 text-xs">
              Return to Archive
            </Link>
            <Link href="/products" className="btn-heaven-primary py-3 px-6 text-xs">
              Explore Collection
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isCancellable = order.status === 'PLACED' || order.status === 'CONFIRMED';
  const courier = order.deliveryAssignment?.deliveryPartner;

  return (
    <div className="min-h-screen bg-[#FCFCFC] text-neutral-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <Link href="/orders" className="hover:text-black flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Acquisition Archive</span>
          </Link>
          <span>/</span>
          <span className="text-neutral-900 font-medium">#{order.orderNumber}</span>
        </div>

        {/* Celebration Confirmation Banner (Shown when arriving from checkout) */}
        {isNewOrder && (
          <div className="bg-black text-white p-8 sm:p-10 border border-neutral-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#C5A059] text-[10px] uppercase tracking-widest font-semibold">
                  <Sparkles className="w-3 h-3" />
                  Acquisition Successfully Registered
                </div>
                <h1 className="font-cinzel text-3xl sm:text-4xl text-white font-normal">
                  Thank You for Acquiring HEAVEN
                </h1>
                <p className="text-xs text-neutral-300 max-w-xl font-light leading-relaxed">
                  Your reservation #{order.orderNumber} has been verified and registered into our atelier records. Our master parfumeurs are now hand-inspecting and packaging your selection.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  href={`/track/${order.id}`}
                  className="bg-[#C5A059] hover:bg-[#b08e4d] text-black font-semibold text-xs tracking-wider py-3.5 px-6 uppercase text-center transition-all inline-flex items-center justify-center gap-2"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Track White-Glove Dispatch</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Order Header Summary */}
        <div className="bg-white border border-neutral-200 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A059] font-medium block">
              Allocation Dossier
            </span>
            <h2 className="font-cinzel text-2xl sm:text-3xl text-neutral-950 font-normal">
              Order #{order.orderNumber}
            </h2>
            <p className="text-xs text-neutral-500 font-light">
              Registered on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/track/${order.id}`}
              className="btn-heaven-primary py-3 px-5 text-xs tracking-wider inline-flex items-center gap-2"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Live Map Tracking</span>
            </Link>

            {isCancellable && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="btn-heaven-secondary text-rose-800 hover:border-rose-300 hover:bg-rose-50 py-3 px-5 text-xs tracking-wider inline-flex items-center gap-2"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel Acquisition</span>
              </button>
            )}
          </div>
        </div>

        {/* Order Timeline Component */}
        <div className="bg-white border border-neutral-200 p-8 space-y-6">
          <div className="border-b border-neutral-200 pb-4">
            <h3 className="font-cinzel text-lg text-neutral-950">
              Fulfillment &amp; Dispatch Protocol
            </h3>
            <p className="text-xs text-neutral-500 font-light mt-0.5">
              Live tracking through each stage of preparation, inspection, and white-glove transit.
            </p>
          </div>

          <OrderStatusTimeline
            currentStatus={order.status}
            events={order.events || []}
          />
        </div>

        {/* Two-Column Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Line Items */}
          <div className="lg:col-span-2 bg-white border border-neutral-200 p-8 space-y-6">
            <div className="border-b border-neutral-200 pb-4 flex items-center justify-between">
              <div>
                <h3 className="font-cinzel text-lg text-neutral-950">
                  Allocated Flacons ({order.items?.length || 0})
                </h3>
                <p className="text-xs text-neutral-500 font-light mt-0.5">
                  Itemized inventory snapshots preserved at time of purchase.
                </p>
              </div>
            </div>

            <div className="divide-y divide-neutral-100">
              {order.items?.map((item: any) => (
                <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 bg-neutral-50 border border-neutral-200 overflow-hidden flex-shrink-0">
                      <Image
                        src={item.productImage || '/perfumes/heaven-bottle-1.jpg'}
                        alt={item.productName}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <Link
                        href={`/products/${item.productSlug}`}
                        className="font-cinzel text-sm font-medium text-neutral-950 hover:text-[#C5A059] transition-colors"
                      >
                        {item.productName}
                      </Link>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        Quantity: {item.quantity} &bull; Volume: {item.productSize}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {formatINR(item.unitPrice)} each
                      </div>
                    </div>
                  </div>

                  <div className="font-cinzel text-sm font-semibold text-neutral-950">
                    {formatINR(item.totalPrice)}
                  </div>
                </div>
              ))}
            </div>

            {/* Price Calculation Summary */}
            <div className="pt-6 border-t border-neutral-200 space-y-3">
              <div className="flex justify-between text-xs text-neutral-600">
                <span>Subtotal</span>
                <span className="font-cinzel font-medium text-neutral-900">{formatINR(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-600">
                <span>White-Glove Courier Logistics</span>
                <span className="font-cinzel font-medium text-neutral-900">
                  {order.shippingFee === 0 ? 'Complimentary' : formatINR(order.shippingFee)}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-700">
                  <span>Maison Allocation Privilege</span>
                  <span>-{formatINR(order.discountAmount)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-neutral-200 flex justify-between items-baseline">
                <span className="text-xs uppercase tracking-wider font-semibold text-neutral-950">
                  Total Payable
                </span>
                <span className="font-cinzel text-xl font-bold text-neutral-950">
                  {formatINR(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Address & Payment Details */}
          <div className="space-y-6">
            {/* Delivery Address Card */}
            <div className="bg-white border border-neutral-200 p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <MapPin className="w-4 h-4 text-[#C5A059]" />
                <h4 className="font-cinzel text-sm font-semibold text-neutral-950">
                  Delivery Destination
                </h4>
              </div>

              <div className="text-xs space-y-1.5 text-neutral-600">
                <div className="font-medium text-neutral-950 text-sm">
                  {order.shippingRecipient}
                </div>
                <div>{order.shippingPhone}</div>
                <div>{order.shippingAddressLine1}</div>
                {order.shippingAddressLine2 && <div>{order.shippingAddressLine2}</div>}
                <div>
                  {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}
                </div>
                {order.shippingInstructions && (
                  <div className="pt-2 text-[11px] text-neutral-500 italic border-t border-neutral-100 mt-2">
                    Instructions: &ldquo;{order.shippingInstructions}&rdquo;
                  </div>
                )}
              </div>
            </div>

            {/* Payment Details Card */}
            <div className="bg-white border border-neutral-200 p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <CreditCard className="w-4 h-4 text-[#C5A059]" />
                <h4 className="font-cinzel text-sm font-semibold text-neutral-950">
                  Payment Verification
                </h4>
              </div>

              <div className="text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Method</span>
                  <span className="font-medium text-neutral-900 uppercase tracking-wider">
                    {order.paymentMethod === 'UPI' && 'Simulated UPI'}
                    {order.paymentMethod === 'CARD' && 'Simulated Card'}
                    {order.paymentMethod === 'COD' && 'Cash on Delivery Demo'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Status</span>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    order.paymentStatus === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : order.paymentStatus === 'COD_PENDING'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-neutral-100 text-neutral-700'
                  }`}>
                    {order.paymentStatus}
                  </span>
                </div>
                {order.paymentSimulations?.[0] && (
                  <div className="pt-2 border-t border-neutral-100 text-[10px] text-neutral-500 font-mono">
                    Ref: {order.paymentSimulations[0].transactionReference}
                  </div>
                )}
              </div>
            </div>

            {/* White-Glove Dispatch Courier (if assigned) */}
            {courier && (
              <div className="bg-neutral-50 border border-neutral-200 p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#C5A059]" />
                  <h4 className="font-cinzel text-sm font-semibold text-neutral-950">
                    White-Glove Courier Assigned
                  </h4>
                </div>
                <div className="text-xs space-y-1 text-neutral-700">
                  <div className="font-medium text-neutral-900">{courier.user?.fullName}</div>
                  <div className="text-[11px] text-neutral-500">Vehicle: {courier.vehicleType || 'Executive Van'}</div>
                  {courier.user?.phone && (
                    <div className="text-[11px] text-neutral-500">Contact: {courier.user.phone}</div>
                  )}
                </div>
                <Link
                  href={`/track/${order.id}`}
                  className="btn-heaven-primary w-full py-2.5 text-[11px] tracking-wider block text-center mt-3"
                >
                  View Route on Live Map
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Cancel Order Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 max-w-md w-full p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-cinzel text-xl text-neutral-950">
                Cancel Allocation #{order.orderNumber}?
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Cancelling this order will release your reserved flacons back to the cellar inventory. Any simulated payment authorization will be voided.
              </p>
            </div>

            {cancelMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700">
                {cancelMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelMessage('');
                }}
                disabled={cancelling}
                className="btn-heaven-secondary py-2.5 px-5 text-xs"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="bg-red-700 hover:bg-red-800 text-white font-semibold text-xs tracking-wider py-2.5 px-5 uppercase transition-all"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
