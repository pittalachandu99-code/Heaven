import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { user: { fullName: { contains: search } } },
        { user: { email: { contains: search } } },
        { user: { phone: { contains: search } } },
        { vehicleNumber: { contains: search } },
      ];
    }

    const partners = await prisma.deliveryPartnerProfile.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true, isActive: true } },
        assignments: {
          where: { status: { in: ['ASSIGNED', 'PICKED_UP'] } },
          include: {
            order: { select: { id: true, orderNumber: true, status: true, shippingCity: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Also fetch unassigned orders eligible for courier allocation
    const unassignedOrders = await prisma.order.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'] },
        deliveryAssignment: null,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        shippingRecipient: true,
        shippingCity: true,
        shippingState: true,
        totalAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      partners,
      unassignedOrders,
    });
  } catch (error) {
    console.error('Fetch delivery partners error:', error);
    return NextResponse.json({ error: 'Failed to retrieve delivery partners.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { orderId, deliveryPartnerId } = body;

    if (!orderId || !deliveryPartnerId) {
      return NextResponse.json({ error: 'orderId and deliveryPartnerId are required.' }, { status: 400 });
    }

    // Validate partner
    const partner = await prisma.deliveryPartnerProfile.findUnique({
      where: { id: deliveryPartnerId },
      include: { user: true },
    });

    if (!partner || !partner.user.isActive) {
      return NextResponse.json({ error: 'Selected delivery partner is inactive or not found.' }, { status: 400 });
    }

    // Validate order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { deliveryAssignment: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      return NextResponse.json({
        error: `Cannot assign courier to order with terminal status "${order.status}".`,
      }, { status: 400 });
    }

    // Atomic assignment or reassignment
    const assignment = await prisma.$transaction(async (tx) => {
      // Upsert delivery assignment
      const createdAssignment = await tx.deliveryAssignment.upsert({
        where: { orderId: order.id },
        update: {
          deliveryPartnerId: partner.id,
          status: 'ASSIGNED',
          assignedAt: new Date(),
        },
        create: {
          orderId: order.id,
          deliveryPartnerId: partner.id,
          status: 'ASSIGNED',
        },
      });

      // Record Order Status Event
      await tx.orderStatusEvent.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: order.status,
          title: 'White-Glove Courier Allocated',
          description: `Assigned courier ${partner.user.fullName} (${partner.vehicleType || 'Executive Van'}) by ${session.fullName}.`,
          actorId: session.id,
          actorRole: 'ADMIN',
        },
      });

      return createdAssignment;
    });

    await logAuditEvent({
      userId: session.id,
      action: 'ASSIGN_DELIVERY_PARTNER',
      entityType: 'ORDER',
      entityId: order.id,
      details: `Assigned courier ${partner.user.fullName} to order #${order.orderNumber}`,
    });

    return NextResponse.json({
      success: true,
      message: `Courier ${partner.user.fullName} assigned to order #${order.orderNumber}.`,
      assignment,
    });
  } catch (error) {
    console.error('Assign delivery partner error:', error);
    return NextResponse.json({ error: 'Failed to assign delivery partner.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required.' }, { status: 400 });
    }

    const assignment = await prisma.deliveryAssignment.findUnique({
      where: { orderId },
      include: { order: true, deliveryPartner: { include: { user: true } } },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'No assignment found for this order.' }, { status: 404 });
    }

    if (assignment.status === 'DELIVERED') {
      return NextResponse.json({ error: 'Cannot remove courier from delivered order.' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.deliveryAssignment.delete({ where: { orderId } });
      await tx.orderStatusEvent.create({
        data: {
          orderId,
          fromStatus: assignment.order.status,
          toStatus: assignment.order.status,
          title: 'Courier Assignment Relieved',
          description: `Relieved courier ${assignment.deliveryPartner.user.fullName} by ${session.fullName}.`,
          actorId: session.id,
          actorRole: 'ADMIN',
        },
      });
    });

    await logAuditEvent({
      userId: session.id,
      action: 'UNASSIGN_DELIVERY_PARTNER',
      entityType: 'ORDER',
      entityId: orderId,
      details: `Relieved courier from order #${assignment.order.orderNumber}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Courier assignment removed.',
    });
  } catch (error) {
    console.error('Unassign delivery partner error:', error);
    return NextResponse.json({ error: 'Failed to remove courier assignment.' }, { status: 500 });
  }
}
