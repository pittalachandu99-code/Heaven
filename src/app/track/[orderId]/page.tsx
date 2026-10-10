'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import OrderTrackingMap from '@/components/orders/OrderTrackingMap';
import OrderStatusTimeline from '@/components/orders/OrderStatusTimeline';
import { 
  ArrowLeft, 
  Truck, 
  MapPin, 
  Clock, 
  Package, 
  Sparkles, 
  Phone, 
  AlertCircle,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function TrackOrderPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return;
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`/api/orders/${orderId}`);
        if (res.status === 401) {
          router.push(`/login?callbackUrl=/track/${orderId}`);
          return;
        }
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || 'Unable to retrieve tracking telemetry.');
          setLoading(false);
          return;
        }
        const data = await res.json();
        setOrder(data.order);
      } catch {
        setError('A network error occurred while connecting to tracking telemetry.');
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-16">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-xs uppercase tracking-widest text-neutral-500">
              Connecting to Maison Telemetry Network...
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
            <h1 className="font-cinzel text-3xl text-neutral-950">Tracking Telemetry Unavailable</h1>
            <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
              {error || 'This order does not exist or you do not have permission to access tracking data.'}
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <Link href="/orders" className="btn-heaven-secondary py-3 px-6 text-xs">
              Return to Orders
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
          <Link href={`/orders/${order.id}`} className="hover:text-black transition-colors">
            #{order.orderNumber}
          </Link>
          <span>/</span>
          <span className="text-neutral-900 font-medium">Live Telemetry</span>
        </div>

        {/* Tracking Header */}
        <div className="bg-white border border-neutral-200 p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-[0.35em] text-[#C5A059] font-medium block">
              White-Glove Dispatch Telemetry
            </span>
            <h1 className="font-cinzel text-3xl sm:text-4xl text-neutral-950 font-normal">
              Tracking #{order.orderNumber}
            </h1>
            <p className="text-xs text-neutral-500 font-light">
              Destination: {order.shippingCity}, {order.shippingState} &bull; Estimated delivery: 2-4 business days
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/orders/${order.id}`}
              className="btn-heaven-secondary py-3 px-5 text-xs tracking-wider inline-flex items-center gap-2"
            >
              <span>View Full Order Dossier</span>
            </Link>
          </div>
        </div>

        {/* Live Interactive Map */}
        <div className="bg-white border border-neutral-200 p-8 space-y-6">
          <div className="border-b border-neutral-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-cinzel text-xl text-neutral-950">
                Live Geographic Transit Route
              </h2>
              <p className="text-xs text-neutral-500 font-light mt-0.5">
                Monitoring transit corridor between HEAVEN Chanakyapuri Atelier and recipient destination.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 border border-neutral-200 text-xs text-neutral-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-[11px] uppercase tracking-wider">
                Corridor Active
              </span>
            </div>
          </div>

          <OrderTrackingMap
            orderNumber={order.orderNumber}
            recipientCity={order.shippingCity}
            recipientState={order.shippingState}
            orderStatus={order.status}
            partnerName={courier?.user?.fullName}
            vehicleType={courier?.vehicleType}
            partnerLat={courier?.currentLatitude}
            partnerLng={courier?.currentLongitude}
          />
        </div>

        {/* Status Timeline */}
        <div className="bg-white border border-neutral-200 p-8 space-y-6">
          <div className="border-b border-neutral-200 pb-4">
            <h3 className="font-cinzel text-lg text-neutral-950">
              Custody Transfer Timeline
            </h3>
            <p className="text-xs text-neutral-500 font-light mt-0.5">
              Audited step-by-step progress from cellar preparation to recipient signature.
            </p>
          </div>

          <OrderStatusTimeline
            currentStatus={order.status}
            events={order.events || []}
          />
        </div>

        {/* Logistics Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Atelier Origin */}
          <div className="bg-white border border-neutral-200 p-6 space-y-3">
            <div className="flex items-center gap-2 text-neutral-950 font-semibold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <span>Dispatch Origin</span>
            </div>
            <div className="text-xs space-y-1 text-neutral-600">
              <div className="font-medium text-neutral-900">HEAVEN Maison Flagship</div>
              <div>Chanakyapuri Atelier &amp; Cellars</div>
              <div>New Delhi, DL 110021</div>
            </div>
          </div>

          {/* Recipient Destination */}
          <div className="bg-white border border-neutral-200 p-6 space-y-3">
            <div className="flex items-center gap-2 text-neutral-950 font-semibold text-xs uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-[#C5A059]" />
              <span>Recipient Destination</span>
            </div>
            <div className="text-xs space-y-1 text-neutral-600">
              <div className="font-medium text-neutral-900">{order.shippingRecipient}</div>
              <div>{order.shippingAddressLine1}</div>
              {order.shippingAddressLine2 && <div>{order.shippingAddressLine2}</div>}
              <div>{order.shippingCity}, {order.shippingState} {order.shippingPostalCode}</div>
              {order.shippingInstructions && (
                <div className="text-[11px] text-neutral-500 italic mt-1 pt-1 border-t border-neutral-100">
                  Instructions: {order.shippingInstructions}
                </div>
              )}
            </div>
          </div>

          {/* Courier Protocol */}
          <div className="bg-white border border-neutral-200 p-6 space-y-3">
            <div className="flex items-center gap-2 text-neutral-950 font-semibold text-xs uppercase tracking-wider">
              <Truck className="w-4 h-4 text-[#C5A059]" />
              <span>Courier Protocol</span>
            </div>
            <div className="text-xs space-y-1 text-neutral-600">
              {courier ? (
                <>
                  <div className="font-medium text-neutral-900">{courier.user?.fullName}</div>
                  <div>Vehicle: {courier.vehicleType || 'Climate-Controlled Van'}</div>
                  {courier.user?.phone && <div>Contact: {courier.user.phone}</div>}
                </>
              ) : (
                <>
                  <div className="font-medium text-neutral-900">White-Glove Staging</div>
                  <div className="text-neutral-500 text-[11px] leading-relaxed">
                    A dedicated courier partner will be assigned once cellaring and verification packaging are finalized.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
