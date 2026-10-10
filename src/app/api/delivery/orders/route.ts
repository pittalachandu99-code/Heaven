import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'DELIVERY_PARTNER') {
      return NextResponse.json(
        { error: 'Unauthorized. Delivery partner privileges required.' },
        { status: 403 }
      );
    }

    const partnerProfile = await prisma.deliveryPartnerProfile.findUnique({
      where: { userId: session.id },
    });

    if (!partnerProfile) {
      return NextResponse.json(
        { error: 'Delivery partner profile not found.' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const tab = searchParams.get('tab') || 'all';

    const where: any = {
      deliveryPartnerId: partnerProfile.id,
    };

    if (search) {
      where.order = {
        orderNumber: { contains: search },
      };
    }

    // Tab filter
    if (tab === 'new') {
      where.status = 'ASSIGNED';
      where.order = { ...(where.order || {}), status: { notIn: ['DELIVERED', 'CANCELLED'] } };
    } else if (tab === 'pickup') {
      where.order = {
        ...(where.order || {}),
        status: { in: ['ASSIGNED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'] },
      };
    } else if (tab === 'out_for_delivery') {
      where.order = {
        ...(where.order || {}),
        status: 'OUT_FOR_DELIVERY',
      };
    } else if (tab === 'delivered') {
      where.status = 'DELIVERED';
    } else if (tab === 'failed') {
      where.order = {
        ...(where.order || {}),
        status: 'DELIVERY_FAILED',
      };
    }

    const assignments = await prisma.deliveryAssignment.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            shippingRecipient: true,
            shippingPhone: true,
            shippingAddressLine1: true,
            shippingAddressLine2: true,
            shippingCity: true,
            shippingState: true,
            shippingPostalCode: true,
            shippingInstructions: true,
            totalAmount: true,
            paymentMethod: true,
            paymentStatus: true,
            createdAt: true,
            items: {
              select: {
                id: true,
                productName: true,
                productSize: true,
                quantity: true,
                productImage: true,
              },
            },
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      tab,
      total: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error('Fetch delivery orders error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve assigned orders.' },
      { status: 500 }
    );
  }
}
