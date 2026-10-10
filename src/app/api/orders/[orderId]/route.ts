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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: {
        items: true,
        events: {
          orderBy: { createdAt: 'asc' },
        },
        paymentSimulations: {
          orderBy: { createdAt: 'desc' },
        },
        deliveryAssignment: {
          include: {
            deliveryPartner: {
              include: {
                user: { select: { fullName: true, phone: true } },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Strict Ownership Security
    if (session.role === 'ADMIN') {
      // Admin has store-wide access
    } else if (session.role === 'DELIVERY_PARTNER') {
      // Courier must be specifically assigned to this order
      if (order.deliveryAssignment?.deliveryPartner?.userId !== session.id) {
        return NextResponse.json(
          { error: 'Access denied. You are not assigned to deliver this order.' },
          { status: 403 }
        );
      }
    } else if (order.userId !== session.id) {
      // Customer must own the order
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to view this order.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve order details.' },
      { status: 500 }
    );
  }
}
