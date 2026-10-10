'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { useCartWishlist } from '@/context/CartWishlistContext';
import { formatINR } from '@/lib/utils';
import { 
  ShoppingBag, 
  MapPin, 
  CreditCard, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Truck, 
  ShieldCheck, 
  AlertCircle,
  Sparkles,
  Smartphone
} from 'lucide-react';

interface SavedAddress {
  id: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
  deliveryInstructions?: string | null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, cartSummary, loadingCart, refreshCart } = useCartWishlist();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Address State
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    recipientName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    deliveryInstructions: '',
    saveToAccount: true,
  });
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  // Payment Simulation State
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'COD'>('UPI');
  const [simulateOutcome, setSimulateOutcome] = useState<'SUCCESS' | 'FAILED'>('SUCCESS');
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');

  // Generate idempotency key on mount
  useEffect(() => {
    setIdempotencyKey('idem_' + Math.random().toString(36).substring(2) + Date.now().toString(36));
  }, []);

  // Fetch saved addresses
  useEffect(() => {
    async function loadAddresses() {
      try {
        const res = await fetch('/api/addresses');
        if (res.ok) {
          const data = await res.json();
          setSavedAddresses(data.addresses || []);
          if (data.addresses && data.addresses.length > 0) {
            const defaultAddr = data.addresses.find((a: SavedAddress) => a.isDefault) || data.addresses[0];
            setSelectedAddressId(defaultAddr.id);
            setUseNewAddress(false);
          } else {
            setUseNewAddress(true);
          }
        }
      } catch (err) {
        console.error('Failed to load addresses:', err);
      }
    }
    loadAddresses();
  }, []);

  // Validate Address step
  const validateAddressStep = () => {
    const errors: Record<string, string> = {};
    if (useNewAddress) {
      if (!newAddress.recipientName.trim() || newAddress.recipientName.length < 2) {
        errors.recipientName = 'Recipient name must be at least 2 characters.';
      }
      const cleanPhone = newAddress.phone.replace(/[\s-]/g, '');
      if (!cleanPhone || !/^(\+91)?[6-9]\d{9}$/.test(cleanPhone)) {
        errors.phone = 'Valid 10-digit Indian phone number is required.';
      }
      if (!newAddress.addressLine1.trim() || newAddress.addressLine1.length < 5) {
        errors.addressLine1 = 'Address line 1 must be at least 5 characters.';
      }
      if (!newAddress.city.trim()) errors.city = 'City is required.';
      if (!newAddress.state.trim()) errors.state = 'State is required.';
      if (!/^[1-9][0-9]{5}$/.test(newAddress.postalCode.trim())) {
        errors.postalCode = 'Valid 6-digit postal PIN code is required.';
      }
    } else if (!selectedAddressId) {
      errors.selectedAddress = 'Please select a delivery address.';
    }

    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    setSubmissionError('');
    if (step === 2) {
      if (!validateAddressStep()) return;
    }
    setStep((prev) => Math.min(4, prev + 1) as 1 | 2 | 3 | 4);
  };

  const handlePrevStep = () => {
    setSubmissionError('');
    setStep((prev) => Math.max(1, prev - 1) as 1 | 2 | 3 | 4);
  };

  // Submit Final Order
  const handleFinalizeAcquisition = async () => {
    setSubmitting(true);
    setSubmissionError('');

    try {
      const payload: any = {
        paymentMethod,
        simulateOutcome,
        idempotencyKey,
      };

      if (useNewAddress) {
        payload.newAddress = newAddress;
      } else {
        payload.addressId = selectedAddressId;
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmissionError(data.error || 'Failed to place order.');
        setSubmitting(false);
        return;
      }

      // Success -> refresh cart and route to order confirmation
      await refreshCart();
      router.push(`/orders/${data.orderId}?newOrder=true`);
    } catch {
      setSubmissionError('A network error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  if (loadingCart) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-16">
          <div className="text-xs uppercase tracking-widest text-neutral-400">
            Initializing White-Glove Checkout...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#FCFCFC] text-neutral-900 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-20 text-center space-y-6">
          <ShoppingBag className="w-16 h-16 text-neutral-300 mx-auto stroke-[1]" />
          <div className="space-y-2">
            <h1 className="font-cinzel text-3xl text-neutral-950">Your Selection Bag is Empty</h1>
            <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
              You must have at least one flacon in your bag before proceeding to acquisition.
            </p>
          </div>
          <Link href="/products" className="btn-heaven-primary py-4 px-8 text-xs tracking-[0.2em] inline-block">
            Explore Collection
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFCFC] text-neutral-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Header */}
        <div className="mb-12 space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[10px] uppercase tracking-[0.35em] text-[#C5A059] font-medium block">
              Maison Allocation Protocol
            </span>
            <h1 className="font-cinzel text-3xl sm:text-4xl text-neutral-950 font-normal">
              Acquisition Checkout
            </h1>
          </div>

          {/* Stepper Wizard Bar */}
          <div className="max-w-3xl mx-auto grid grid-cols-4 gap-2 pt-4">
            {[
              { num: 1, label: 'Selection' },
              { num: 2, label: 'Delivery' },
              { num: 3, label: 'Summary' },
              { num: 4, label: 'Payment' },
            ].map((s) => (
              <div
                key={s.num}
                className={`text-center pb-3 border-b-2 transition-all ${
                  step === s.num
                    ? 'border-black text-black font-semibold'
                    : step > s.num
                    ? 'border-neutral-900 text-neutral-800'
                    : 'border-neutral-200 text-neutral-400'
                }`}
              >
                <span className="text-xs uppercase tracking-wider block">
                  Step 0{s.num}
                </span>
                <span className="text-[11px] font-cinzel hidden sm:inline">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Global Error Banner */}
        {submissionError && (
          <div className="max-w-4xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block uppercase tracking-wider font-semibold">Payment Simulation Notice</strong>
              <p>{submissionError}</p>
            </div>
          </div>
        )}

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Left Column: Active Step Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* STEP 1: REVIEW SELECTION BAG */}
            {step === 1 && (
              <div className="bg-white border border-neutral-200 p-8 space-y-6">
                <div className="border-b border-neutral-200 pb-4">
                  <h2 className="font-cinzel text-xl text-neutral-950">
                    Step 1: Review Reserved Flacons
                  </h2>
                  <p className="text-xs text-neutral-500 font-light mt-1">
                    Verify quantities and fragrance selections before address confirmation.
                  </p>
                </div>

                <div className="divide-y divide-neutral-100">
                  {cartItems.map((item) => (
                    <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 bg-neutral-50 border border-neutral-200 flex-shrink-0 overflow-hidden">
                          <Image
                            src={item.product.primaryImage}
                            alt={item.product.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-cinzel text-sm text-neutral-900 font-medium">
                            {item.product.name}
                          </div>
                          <div className="text-xs text-neutral-500">
                            Qty: {item.quantity} &bull; {item.product.size}
                          </div>
                        </div>
                      </div>

                      <div className="font-cinzel text-sm font-semibold text-neutral-900">
                        {formatINR(item.product.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-neutral-200 flex justify-end">
                  <button
                    onClick={handleNextStep}
                    className="btn-heaven-primary py-4 px-8 text-xs tracking-[0.2em] flex items-center gap-2"
                  >
                    <span>Proceed to Delivery Address</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: DELIVERY ADDRESS */}
            {step === 2 && (
              <div className="bg-white border border-neutral-200 p-8 space-y-6">
                <div className="border-b border-neutral-200 pb-4">
                  <h2 className="font-cinzel text-xl text-neutral-950">
                    Step 2: White-Glove Delivery Address
                  </h2>
                  <p className="text-xs text-neutral-500 font-light mt-1">
                    Select a destination from your client dossier or add a new boutique location.
                  </p>
                </div>

                {/* Saved Addresses Options */}
                {savedAddresses.length > 0 && (
                  <div className="space-y-4">
                    <div className="text-xs uppercase tracking-wider font-semibold text-neutral-700">
                      Saved Client Addresses:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {savedAddresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() => {
                            setSelectedAddressId(addr.id);
                            setUseNewAddress(false);
                          }}
                          className={`p-5 border cursor-pointer transition-all ${
                            !useNewAddress && selectedAddressId === addr.id
                              ? 'border-black bg-neutral-50 ring-1 ring-black'
                              : 'border-neutral-200 hover:border-neutral-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-xs text-black">
                              {addr.recipientName}
                            </span>
                            {addr.isDefault && (
                              <span className="text-[9px] uppercase tracking-wider bg-black text-white px-2 py-0.5">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-600 line-clamp-2">
                            {addr.addressLine1}, {addr.city}, {addr.state} - {addr.postalCode}
                          </p>
                          <div className="text-[11px] text-neutral-500 mt-2">
                            Phone: {addr.phone}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => setUseNewAddress(!useNewAddress)}
                        className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-black font-semibold underline underline-offset-4"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{useNewAddress ? 'Use a Saved Address Instead' : 'Add New Delivery Address'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* New Address Form */}
                {useNewAddress && (
                  <div className="space-y-4 pt-4 border-t border-neutral-100">
                    <div className="text-xs uppercase tracking-wider font-semibold text-neutral-800">
                      Enter Destination Details:
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1">
                          Recipient Full Name *
                        </label>
                        <input
                          type="text"
                          value={newAddress.recipientName}
                          onChange={(e) => setNewAddress({ ...newAddress, recipientName: e.target.value })}
                          placeholder="Lady Victoria Sterling"
                          className="input-heaven text-xs"
                        />
                        {addressErrors.recipientName && (
                          <span className="text-[11px] text-red-600 mt-1 block">{addressErrors.recipientName}</span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1">
                          Mobile Phone *
                        </label>
                        <input
                          type="tel"
                          value={newAddress.phone}
                          onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                          placeholder="9876543210"
                          className="input-heaven text-xs"
                        />
                        {addressErrors.phone && (
                          <span className="text-[11px] text-red-600 mt-1 block">{addressErrors.phone}</span>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1">
                          Address Line 1 (Street, Residence, Suite) *
                        </label>
                        <input
                          type="text"
                          value={newAddress.addressLine1}
                          onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                          placeholder="Villa 14, Royal Palm Avenue"
                          className="input-heaven text-xs"
                        />
                        {addressErrors.addressLine1 && (
                          <span className="text-[11px] text-red-600 mt-1 block">{addressErrors.addressLine1}</span>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1">
                          Address Line 2 (Optional)
                        </label>
                        <input
                          type="text"
                          value={newAddress.addressLine2}
                          onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                          placeholder="Near Embassy Quarter"
                          className="input-heaven text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          placeholder="New Delhi"
                          className="input-heaven text-xs"
                        />
                        {addressErrors.city && (
                          <span className="text-[11px] text-red-600 mt-1 block">{addressErrors.city}</span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1">
                          State *
                        </label>
                        <input
                          type="text"
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                          placeholder="Delhi"
                          className="input-heaven text-xs"
                        />
                        {addressErrors.state && (
                          <span className="text-[11px] text-red-600 mt-1 block">{addressErrors.state}</span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1">
                          PIN / Postal Code *
                        </label>
                        <input
                          type="text"
                          value={newAddress.postalCode}
                          onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                          placeholder="110021"
                          maxLength={6}
                          className="input-heaven text-xs"
                        />
                        {addressErrors.postalCode && (
                          <span className="text-[11px] text-red-600 mt-1 block">{addressErrors.postalCode}</span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1">
                          Delivery Instructions (Optional)
                        </label>
                        <input
                          type="text"
                          value={newAddress.deliveryInstructions}
                          onChange={(e) => setNewAddress({ ...newAddress, deliveryInstructions: e.target.value })}
                          placeholder="Leave with concierge desk"
                          className="input-heaven text-xs"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="saveToAccount"
                        checked={newAddress.saveToAccount}
                        onChange={(e) => setNewAddress({ ...newAddress, saveToAccount: e.target.checked })}
                        className="rounded border-neutral-300 text-black focus:ring-black"
                      />
                      <label htmlFor="saveToAccount" className="text-xs text-neutral-600">
                        Save this address to my client dossier for future acquisitions
                      </label>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="pt-6 border-t border-neutral-200 flex items-center justify-between">
                  <button
                    onClick={handlePrevStep}
                    className="btn-heaven-secondary py-3 px-6 text-xs flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Cart</span>
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="btn-heaven-primary py-3 px-8 text-xs flex items-center gap-2"
                  >
                    <span>Proceed to Review Bill</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: BILL SUMMARY */}
            {step === 3 && (
              <div className="bg-white border border-neutral-200 p-8 space-y-6">
                <div className="border-b border-neutral-200 pb-4">
                  <h2 className="font-cinzel text-xl text-neutral-950">
                    Step 3: Verification &amp; Final Bill
                  </h2>
                  <p className="text-xs text-neutral-500 font-light mt-1">
                    Itemized transparent billing calculated strictly on the server.
                  </p>
                </div>

                {/* Selected Address Preview */}
                <div className="bg-neutral-50 p-5 border border-neutral-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-wider font-semibold text-black text-[11px] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#C5A059]" /> Delivery Destination
                    </span>
                    <button
                      onClick={() => setStep(2)}
                      className="text-black underline underline-offset-4 hover:text-[#C5A059]"
                    >
                      Change
                    </button>
                  </div>
                  <div className="text-neutral-800 font-medium">
                    {useNewAddress ? newAddress.recipientName : savedAddresses.find(a => a.id === selectedAddressId)?.recipientName}
                  </div>
                  <div className="text-neutral-600">
                    {useNewAddress
                      ? `${newAddress.addressLine1}, ${newAddress.city}, ${newAddress.state} - ${newAddress.postalCode}`
                      : (() => {
                          const a = savedAddresses.find(x => x.id === selectedAddressId);
                          return a ? `${a.addressLine1}, ${a.city}, ${a.state} - ${a.postalCode}` : '';
                        })()}
                  </div>
                </div>

                {/* Items Breakdown Table */}
                <div className="divide-y divide-neutral-100 text-xs">
                  {cartItems.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-neutral-900">{item.product.name}</span>
                        <span className="text-neutral-500 ml-2">x {item.quantity}</span>
                      </div>
                      <div className="font-cinzel font-semibold text-black">
                        {formatINR(item.product.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Navigation Buttons */}
                <div className="pt-6 border-t border-neutral-200 flex items-center justify-between">
                  <button
                    onClick={handlePrevStep}
                    className="btn-heaven-secondary py-3 px-6 text-xs flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Address</span>
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="btn-heaven-primary py-3 px-8 text-xs flex items-center gap-2"
                  >
                    <span>Proceed to Demo Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: SIMULATED PAYMENT */}
            {step === 4 && (
              <div className="bg-white border border-neutral-200 p-8 space-y-6">
                <div className="border-b border-neutral-200 pb-4">
                  <h2 className="font-cinzel text-xl text-neutral-950">
                    Step 4: Simulated Payment Method
                  </h2>
                  <p className="text-xs text-neutral-500 font-light mt-1">
                    Select a safe demonstration method to finalize your allocation.
                  </p>
                </div>

                {/* DEMO PAYMENT NOTICE BADGE */}
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-none space-y-1">
                  <div className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C5A059]" />
                    <span>DEMO PAYMENT — NO REAL MONEY WILL BE CHARGED</span>
                  </div>
                  <p className="text-amber-800 leading-relaxed font-light">
                    This is a demonstration system. No real credit card numbers, CVVs, UPI PINs, or banking passwords are required or stored.
                  </p>
                </div>

                {/* Payment Methods */}
                <div className="space-y-3">
                  <label
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-4 border block cursor-pointer transition-all ${
                      paymentMethod === 'UPI'
                        ? 'border-black bg-neutral-50 ring-1 ring-black'
                        : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-black" />
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider text-black">
                            Simulated UPI (Instant Demo)
                          </div>
                          <div className="text-[11px] text-neutral-500">
                            Simulates BHIM, Google Pay, or PhonePe verification.
                          </div>
                        </div>
                      </div>
                      <input
                        type="radio"
                        checked={paymentMethod === 'UPI'}
                        onChange={() => setPaymentMethod('UPI')}
                        className="text-black focus:ring-black"
                      />
                    </div>
                  </label>

                  <label
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-4 border block cursor-pointer transition-all ${
                      paymentMethod === 'CARD'
                        ? 'border-black bg-neutral-50 ring-1 ring-black'
                        : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-black" />
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider text-black">
                            Simulated Luxury Card (Demo)
                          </div>
                          <div className="text-[11px] text-neutral-500">
                            Simulates Visa / Mastercard / American Express Black.
                          </div>
                        </div>
                      </div>
                      <input
                        type="radio"
                        checked={paymentMethod === 'CARD'}
                        onChange={() => setPaymentMethod('CARD')}
                        className="text-black focus:ring-black"
                      />
                    </div>
                  </label>

                  <label
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-4 border block cursor-pointer transition-all ${
                      paymentMethod === 'COD'
                        ? 'border-black bg-neutral-50 ring-1 ring-black'
                        : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Truck className="w-5 h-5 text-black" />
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider text-black">
                            Cash on Delivery Demonstration
                          </div>
                          <div className="text-[11px] text-neutral-500">
                            Payment remains pending collection upon white-glove handover.
                          </div>
                        </div>
                      </div>
                      <input
                        type="radio"
                        checked={paymentMethod === 'COD'}
                        onChange={() => setPaymentMethod('COD')}
                        className="text-black focus:ring-black"
                      />
                    </div>
                  </label>
                </div>

                {/* Developer Simulation Outcome Control */}
                <div className="p-4 bg-neutral-100 border border-neutral-200 text-xs space-y-2">
                  <span className="font-semibold text-neutral-800 uppercase tracking-wider text-[10px] block">
                    Demo Simulation Test Control:
                  </span>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="simulateOutcome"
                        value="SUCCESS"
                        checked={simulateOutcome === 'SUCCESS'}
                        onChange={() => setSimulateOutcome('SUCCESS')}
                        className="text-black focus:ring-black"
                      />
                      <span>Simulate Approved Transaction (Success)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="simulateOutcome"
                        value="FAILED"
                        checked={simulateOutcome === 'FAILED'}
                        onChange={() => setSimulateOutcome('FAILED')}
                        className="text-black focus:ring-black"
                      />
                      <span className="text-red-700 font-medium">Simulate Bank Decline (Failure Test)</span>
                    </label>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="pt-6 border-t border-neutral-200 flex items-center justify-between">
                  <button
                    onClick={handlePrevStep}
                    disabled={submitting}
                    className="btn-heaven-secondary py-3 px-6 text-xs flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Bill</span>
                  </button>

                  <button
                    onClick={handleFinalizeAcquisition}
                    disabled={submitting}
                    className="btn-heaven-primary py-4 px-10 text-xs tracking-[0.25em] flex items-center gap-2 bg-black hover:bg-neutral-800"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
                    <span>{submitting ? 'Confirming Order...' : 'Confirm Acquisition'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Persistent Order Summary Card */}
          {cartSummary && (
            <div className="bg-white border border-neutral-200 p-8 space-y-6 sticky top-28">
              <h3 className="font-cinzel text-lg text-neutral-950 pb-4 border-b border-neutral-200">
                Order Total
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal ({cartSummary.totalItemsCount} flacons)</span>
                  <span className="font-semibold text-black">
                    {formatINR(cartSummary.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between text-neutral-600">
                  <span>White-Glove Courier Delivery</span>
                  <span>
                    {cartSummary.shippingFee === 0 ? (
                      <span className="text-emerald-700 font-semibold uppercase tracking-wider text-[10px]">
                        Complimentary
                      </span>
                    ) : (
                      formatINR(cartSummary.shippingFee)
                    )}
                  </span>
                </div>

                <div className="pt-4 border-t border-neutral-200 flex justify-between items-baseline">
                  <span className="font-cinzel text-base text-neutral-900 font-medium">Final Payable</span>
                  <span className="font-cinzel text-2xl font-bold text-neutral-950">
                    {formatINR(cartSummary.total)}
                  </span>
                </div>
              </div>

              {/* Guarantees */}
              <div className="pt-4 border-t border-neutral-100 space-y-2.5 text-[11px] text-neutral-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                  <span>Sealed with signed certificate of origin</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#C5A059]" />
                  <span>Direct atelier climate-controlled courier</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
