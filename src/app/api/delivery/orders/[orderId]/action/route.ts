import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const VALID_ACTIONS = ['pickup', 'out_for_delivery', 'delivered', 'issue'];
const VALID_ISSUE_REASONS: Record<string, string> = {
  CUSTOMER_UNAVAILABLE: 'Recipient not available at destination coordinates',
  INCORRECT_ADDRESS: 'Destination address clarification required',
  ACCESS_RESTRICTED: 'Security or diplomatic gate access restricted',
  CUSTOMER_REQUESTED_RESCHEDULE: 'Recipient requested delivery rescheduling',
  OTHER: 'Operational courier exception',
};

export async function POST(
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
    const body = await request.json();
    const { action, handoverNotes, issueReason, issueNotes } = body;

    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Permitted actions: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 }
      );
    }

    const partnerProfile = await prisma.deliveryPartnerProfile.findUnique({
      where: { userId: session.id },
      include: { user: true },
    });

    if (!partnerProfile) {
      return NextResponse.json(
        { error: 'Delivery partner profile not found.' },
        { status: 404 }
      );
    }

    // Find Order and Assignment
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: {
        deliveryAssignment: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Verify Active Assignment Ownership
    if (!order.deliveryAssignment || order.deliveryAssignment.deliveryPartnerId !== partnerProfile.id) {
      return NextResponse.json(
        { error: 'Access denied. You do not hold an active assignment for this order.' },
        { status: 403 }
      );
    }

    const settings = await prisma.storeSettings.findUnique({ where: { id: 'default' } });
    const earningPerDelivery = settings?.partnerEarningPerDelivery ?? 180.0;

    // Execute state transitions atomically
    const result = await prisma.$transaction(async (tx) => {
      if (action === 'pickup') {
        const allowedStatuses = ['ASSIGNED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'];
        if (!allowedStatuses.includes(order.status)) {
          throw new Error(
            `Cannot confirm pickup from current order status "${order.status}". Order must be staged in atelier.`
          );
        }

        const now = new Date();
        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: { status: 'PICKED_UP' },
        });

        await tx.deliveryAssignment.update({
          where: { orderId: order.id },
          data: {
            status: 'PICKED_UP',
            pickedUpAt: now,
          },
        });

        await tx.orderStatusEvent.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: 'PICKED_UP',
            title: 'Flacon Parcel Secured by Courier',
            description: `Parfum secured from Atelier vault by courier ${partnerProfile.user.fullName} (${partnerProfile.vehicleType}). Climate-controlled custody established.`,
            actorId: session.id,
            actorRole: 'DELIVERY_PARTNER',
          },
        });

        return { order: updatedOrder, message: 'Pickup confirmed. Custody transferred to courier.' };
      }

      if (action === 'out_for_delivery') {
        if (order.status !== 'PICKED_UP') {
          throw new Error(
            `Cannot mark out for delivery. Parcel must be picked up first (Current status: "${order.status}").`
          );
        }

        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: { status: 'OUT_FOR_DELIVERY' },
        });

        await tx.deliveryAssignment.update({
          where: { orderId: order.id },
          data: { status: 'OUT_FOR_DELIVERY' },
        });

        await tx.orderStatusEvent.create({
          data: {
            orderId: order.id,
            fromStatus: 'PICKED_UP',
            toStatus: 'OUT_FOR_DELIVERY',
            title: 'Out for Final White-Glove Handover',
            description: `Courier ${partnerProfile.user.fullName} is en route to ${order.shippingCity} recipient in ${partnerProfile.vehicleType || 'Executive Van'}.`,
            actorId: session.id,
            actorRole: 'DELIVERY_PARTNER',
          },
        });

        return { order: updatedOrder, message: 'Order status updated to Out for Delivery.' };
      }

      if (action === 'delivered') {
        if (order.status === 'DELIVERED') {
          throw new Error('This order has already been completed and confirmed delivered.');
        }

        if (!['OUT_FOR_DELIVERY', 'PICKED_UP'].includes(order.status)) {
          throw new Error(
            `Order cannot be delivered directly from status "${order.status}". Order must be in transit.`
          );
        }

        const now = new Date();
        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: { status: 'DELIVERED' },
        });

        await tx.deliveryAssignment.update({
          where: { orderId: order.id },
          data: {
            status: 'DELIVERED',
            deliveredAt: now,
            demoEarnings: earningPerDelivery,
            notes: handoverNotes ? String(handoverNotes).slice(0, 500) : null,
          },
        });

        // Increment lifetime courier completed counter
        await tx.deliveryPartnerProfile.update({
          where: { id: partnerProfile.id },
          data: {
            deliveriesCompleted: { increment: 1 },
          },
        });

        await tx.orderStatusEvent.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: 'DELIVERED',
            title: 'Acquisition Delivered & Signed',
            description: `White-glove handover confirmed by courier ${partnerProfile.user.fullName}. Flacon presented in bespoke packaging. ${
              handoverNotes ? `Handover note: "${handoverNotes}".` : ''
            }`,
            actorId: session.id,
            actorRole: 'DELIVERY_PARTNER',
          },
        });

        return { order: updatedOrder, message: 'Delivery confirmed successfully. Demo earnings logged.' };
      }

      if (action === 'issue') {
        if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
          throw new Error(`Cannot report issue on terminal order with status "${order.status}".`);
        }

        const reasonKey = issueReason && VALID_ISSUE_REASONS[issueReason] ? issueReason : 'OTHER';
        const reasonDesc = VALID_ISSUE_REASONS[reasonKey];
        const combinedNotes = `${reasonDesc}${issueNotes ? ` — ${issueNotes}` : ''}`;

        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: { status: 'DELIVERY_FAILED' },
        });

        await tx.deliveryAssignment.update({
          where: { orderId: order.id },
          data: {
            notes: combinedNotes,
          },
        });

        await tx.orderStatusEvent.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: 'DELIVERY_FAILED',
            title: 'Delivery Exception Encountered',
            description: `Courier reported issue: ${combinedNotes}. Staged for administrative dispatch review.`,
            actorId: session.id,
            actorRole: 'DELIVERY_PARTNER',
          },
        });

        return { order: updatedOrder, message: 'Delivery issue recorded and flagged for administration.' };
      }

      throw new Error('Unsupported action.');
    });

    await logAuditEvent({
      userId: session.id,
      action: `DELIVERY_${action.toUpperCase()}`,
      entityType: 'ORDER',
      entityId: order.id,
      details: `Courier ${partnerProfile.user.fullName} executed action "${action}" on order #${order.orderNumber}`,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      order: {
        id: result.order.id,
        orderNumber: result.order.orderNumber,
        status: result.order.status,
      },
    });
  } catch (error: any) {
    console.error('Delivery action error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to execute delivery action.' },
      { status: 400 }
    );
  }
}
