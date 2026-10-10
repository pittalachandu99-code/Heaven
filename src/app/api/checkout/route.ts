import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { getOrCreateCart } from '@/lib/cart-session';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to finalize your acquisition.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      addressId,
      newAddress,
      paymentMethod = 'UPI',
      simulateOutcome = 'SUCCESS',
      idempotencyKey,
    } = body;

    // 1. Idempotency Check
    if (idempotencyKey && typeof idempotencyKey === 'string') {
      const existingOrder = await prisma.order.findUnique({
        where: { idempotencyKey },
        include: { items: true },
      });
      if (existingOrder) {
        return NextResponse.json({
          success: true,
          message: 'Order already submitted.',
          orderId: existingOrder.id,
          orderNumber: existingOrder.orderNumber,
          total: existingOrder.totalAmount,
        });
      }
    }

    // 2. Resolve Shipping Address
    let shippingDetails = {
      recipientName: '',
      phone: '',
      addressLine1: '',
      addressLine2: null as string | null,
      city: '',
      state: '',
      postalCode: '',
      deliveryInstructions: null as string | null,
      savedAddressId: null as string | null,
    };

    if (addressId) {
      const saved = await prisma.savedAddress.findUnique({
        where: { id: addressId },
      });
      if (!saved || saved.userId !== session.id) {
        return NextResponse.json(
          { error: 'Selected delivery address is invalid or unauthorized.' },
          { status: 400 }
        );
      }
      shippingDetails = {
        recipientName: saved.recipientName,
        phone: saved.phone,
        addressLine1: saved.addressLine1,
        addressLine2: saved.addressLine2,
        city: saved.city,
        state: saved.state,
        postalCode: saved.postalCode,
        deliveryInstructions: saved.deliveryInstructions,
        savedAddressId: saved.id,
      };
    } else if (newAddress) {
      const {
        recipientName,
        phone,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        deliveryInstructions,
        saveToAccount,
      } = newAddress;

      if (!recipientName || recipientName.trim().length < 2) {
        return NextResponse.json(
          { error: 'Recipient full name is required.' },
          { status: 400 }
        );
      }
      const cleanPhone = (phone || '').replace(/[\s-]/g, '');
      if (!cleanPhone || !/^(\+91)?[6-9]\d{9}$/.test(cleanPhone)) {
        return NextResponse.json(
          { error: 'Valid 10-digit mobile number is required.' },
          { status: 400 }
        );
      }
      if (!addressLine1 || addressLine1.trim().length < 5) {
        return NextResponse.json(
          { error: 'Complete delivery address line 1 is required.' },
          { status: 400 }
        );
      }
      if (!city || !state || !postalCode) {
        return NextResponse.json(
          { error: 'City, state, and postal code are required.' },
          { status: 400 }
        );
      }

      shippingDetails = {
        recipientName: recipientName.trim(),
        phone: cleanPhone,
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2 ? addressLine2.trim() : null,
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        deliveryInstructions: deliveryInstructions ? deliveryInstructions.trim() : null,
        savedAddressId: null,
      };

      if (saveToAccount) {
        const saved = await prisma.savedAddress.create({
          data: {
            userId: session.id,
            recipientName: shippingDetails.recipientName,
            phone: shippingDetails.phone,
            addressLine1: shippingDetails.addressLine1,
            addressLine2: shippingDetails.addressLine2,
            city: shippingDetails.city,
            state: shippingDetails.state,
            postalCode: shippingDetails.postalCode,
            deliveryInstructions: shippingDetails.deliveryInstructions,
            isDefault: false,
          },
        });
        shippingDetails.savedAddressId = saved.id;
      }
    } else {
      return NextResponse.json(
        { error: 'A valid delivery address is required.' },
        { status: 400 }
      );
    }

    // 3. Fetch Customer Cart
    const cart = await getOrCreateCart(session.id);
    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Your flacon selection bag is empty.' },
        { status: 400 }
      );
    }

    // 4. Validate Fresh Products & Stock Consistency
    let subtotal = 0;
    const validatedItems: Array<{
      productId: string;
      productName: string;
      productSlug: string;
      productSize: string;
      unitPrice: number;
      quantity: number;
      totalPrice: number;
      productImage: string;
      currentStock: number;
    }> = [];

    for (const item of cart.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product || !product.isPublished) {
        return NextResponse.json(
          { error: `The fragrance "${item.product.name}" is currently unavailable.` },
          { status: 400 }
        );
      }

      if (item.quantity > product.stockQuantity) {
        return NextResponse.json(
          {
            error: `Insufficient inventory for ${product.name}. Cellar stock available: ${product.stockQuantity} flacons.`,
          },
          { status: 400 }
        );
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productSize: product.size,
        unitPrice: product.price,
        quantity: item.quantity,
        totalPrice: itemTotal,
        productImage: product.primaryImage,
        currentStock: product.stockQuantity,
      });
    }

    // 5. Calculate Server-Side Shipping & Totals
    const settings = await prisma.storeSettings.findUnique({ where: { id: 'default' } });
    const freeShippingThreshold = settings?.freeShippingThreshold || 5000.0;
    const standardShippingFee = settings?.shippingFee || 250.0;
    const shippingFee = subtotal >= freeShippingThreshold ? 0 : standardShippingFee;
    const totalAmount = subtotal + shippingFee;

    // 6. Handle Simulated Payment
    if (simulateOutcome === 'FAILED') {
      return NextResponse.json(
        {
          error: 'Demo payment simulated rejection. Your bank simulation declined authorization. No funds were debited.',
          paymentFailed: true,
        },
        { status: 400 }
      );
    }

    const orderNumber = `HVN-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const transactionRef = `TXN-DEMO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const isCod = paymentMethod === 'COD';
    const paymentStatus = isCod ? 'COD_PENDING' : 'COMPLETED';

    // 7. Atomic Database Transaction: Order, Snapshots, Stock Deduction, Clearing Cart
    const createdOrder = await prisma.$transaction(async (tx) => {
      // Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: session.id,
          addressId: shippingDetails.savedAddressId,
          shippingRecipient: shippingDetails.recipientName,
          shippingPhone: shippingDetails.phone,
          shippingAddressLine1: shippingDetails.addressLine1,
          shippingAddressLine2: shippingDetails.addressLine2,
          shippingCity: shippingDetails.city,
          shippingState: shippingDetails.state,
          shippingPostalCode: shippingDetails.postalCode,
          shippingInstructions: shippingDetails.deliveryInstructions,
          subtotal,
          shippingFee,
          discountAmount: 0,
          taxAmount: 0,
          totalAmount,
          currency: 'INR',
          status: 'CONFIRMED',
          paymentStatus,
          paymentMethod,
          idempotencyKey: idempotencyKey || null,
        },
      });

      // Create Order Items with Historical Price Snapshots
      for (const item of validatedItems) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            productName: item.productName,
            productSlug: item.productSlug,
            productSize: item.productSize,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
            productImage: item.productImage,
          },
        });

        // Deduct inventory
        const newBalance = item.currentStock - item.quantity;
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: newBalance },
        });

        // Record Inventory Movement
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            changeQuantity: -item.quantity,
            balanceAfter: newBalance,
            reason: 'ORDER_PLACED',
            referenceId: order.id,
          },
        });
      }

      // Record Payment Simulation
      await tx.paymentSimulation.create({
        data: {
          orderId: order.id,
          paymentMethod,
          transactionReference: transactionRef,
          amount: totalAmount,
          currency: 'INR',
          status: 'SUCCESS',
          gatewayResponse: isCod
            ? 'Cash on Delivery demo confirmed. Amount to be collected on handover.'
            : 'Simulated payment gateway processed successfully.',
        },
      });

      // Record Order Status Event
      await tx.orderStatusEvent.create({
        data: {
          orderId: order.id,
          fromStatus: null,
          toStatus: 'CONFIRMED',
          title: 'Order Confirmed & Placed',
          description: isCod
            ? 'Order registered with Cash on Delivery. Dedicated white-glove packaging begun.'
            : 'Simulated payment captured. Dedicated white-glove packaging begun.',
          actorId: session.id,
          actorRole: 'CUSTOMER',
        },
      });

      // Clear customer cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return order;
    });

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully.',
      orderId: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
      total: createdOrder.totalAmount,
      paymentStatus: createdOrder.paymentStatus,
      status: createdOrder.status,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during order confirmation. Please try again.' },
      { status: 500 }
    );
  }
}
