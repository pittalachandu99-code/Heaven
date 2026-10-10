import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'DELIVERY_PARTNER') {
      return NextResponse.json(
        { error: 'Unauthorized. Delivery partner privileges required.' },
        { status: 403 }
      );
    }

    const { orderId } = params;

    const partnerProfile = await prisma.deliveryPartnerProfile.findUnique({
      where: { userId: session.id },
    });

    if (!partnerProfile) {
      return NextResponse.json(
        { error: 'Delivery partner profile not found.' },
        { status: 404 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: {
        items: true,
        events: { orderBy: { createdAt: 'asc' } },
        deliveryAssignment: {
          include: {
            deliveryPartner: {
              include: { user: { select: { fullName: true, phone: true } } },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Strict Assignment Ownership Check
    if (order.deliveryAssignment?.deliveryPartnerId !== partnerProfile.id) {
      return NextResponse.json(
        { error: 'Access denied. This order is not assigned to your courier profile.' },
        { status: 403 }
      );
    }

    // Flagship Atelier Origin Coordinates
    const pickupOrigin = {
      name: 'HEAVEN Maison Flagship Atelier',
      cellar: 'Private Reserve Vault & White-Glove Staging',
      addressLine1: 'The Chanakya, Chanakyapuri Diplomatic Enclave',
      city: 'New Delhi',
      state: 'Delhi',
      postalCode: '110021',
      latitude: 28.5901,
      longitude: 77.1942,
      contactPhone: '+91 800-HEAVEN-0',
      instructions: 'Enter via secure courier bay #2. Present digital dispatch authorization.',
    };

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        shippingRecipient: order.shippingRecipient,
        shippingPhone: order.shippingPhone,
        shippingAddressLine1: order.shippingAddressLine1,
        shippingAddressLine2: order.shippingAddressLine2,
        shippingCity: order.shippingCity,
        shippingState: order.shippingState,
        shippingPostalCode: order.shippingPostalCode,
        shippingInstructions: order.shippingInstructions,
        items: order.items,
        events: order.events,
        assignment: order.deliveryAssignment,
        pickupOrigin,
      },
    });
  } catch (error) {
    console.error('Fetch order detail error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve order fulfillment detail.' },
      { status: 500 }
    );
  }
}
