import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PLACED: ['CONFIRMED', 'PREPARING', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'READY_FOR_PICKUP', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP', 'CANCELLED'],
  READY_FOR_PICKUP: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { orderId } = params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        items: true,
        events: { orderBy: { createdAt: 'desc' } },
        paymentSimulations: { orderBy: { createdAt: 'desc' } },
        deliveryAssignment: {
          include: {
            deliveryPartner: {
              include: { user: { select: { fullName: true, phone: true, email: true } } },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Fetch order detail error:', error);
    return NextResponse.json({ error: 'Failed to retrieve order details.' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { orderId } = params;
    const body = await request.json();
    const { status: targetStatus, note, paymentStatus } = body;

    const order = await prisma.order.findFirst({
      where: { OR: [{ id: orderId }, { orderNumber: orderId }] },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // 1. Status transition check
    if (targetStatus && targetStatus !== order.status) {
      const allowed = VALID_TRANSITIONS[order.status] || [];
      if (!allowed.includes(targetStatus)) {
        return NextResponse.json({
          error: `Invalid transition from "${order.status}" to "${targetStatus}". Allowed transitions: ${allowed.join(', ') || 'None (terminal state)'}.`,
        }, { status: 400 });
      }

      // 2. Perform transition atomically
      const updatedOrder = await prisma.$transaction(async (tx) => {
        // If transitioning to CANCELLED, restore inventory
        if (targetStatus === 'CANCELLED' && order.status !== 'CANCELLED') {
          for (const item of order.items) {
            if (item.productId) {
              const prod = await tx.product.findUnique({ where: { id: item.productId } });
              if (prod) {
                const newStock = prod.stockQuantity + item.quantity;
                await tx.product.update({
                  where: { id: item.productId },
                  data: { stockQuantity: newStock },
                });

                await tx.inventoryMovement.create({
                  data: {
                    productId: item.productId,
                    changeQuantity: item.quantity,
                    balanceAfter: newStock,
                    reason: 'ORDER_CANCELLED',
                    referenceId: order.id,
                  },
                });
              }
            }
          }
        }

        // Record Status Event
        await tx.orderStatusEvent.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: targetStatus,
            title: `Order status changed to ${targetStatus}`,
            description: note || `Administrative transition by ${session.fullName}`,
            actorId: session.id,
            actorRole: 'ADMIN',
          },
        });

        const newPaymentStatus =
          targetStatus === 'CANCELLED'
            ? order.paymentStatus === 'COMPLETED'
              ? 'REFUNDED'
              : 'CANCELLED'
            : targetStatus === 'DELIVERED' && order.paymentMethod === 'COD'
            ? 'COMPLETED' // Mark COD payment collected upon delivery
            : paymentStatus || order.paymentStatus;

        return await tx.order.update({
          where: { id: order.id },
          data: {
            status: targetStatus,
            paymentStatus: newPaymentStatus,
          },
        });
      });

      // Log Audit
      await logAuditEvent({
        userId: session.id,
        action: 'UPDATE_ORDER_STATUS',
        entityType: 'ORDER',
        entityId: order.id,
        details: `Changed order #${order.orderNumber} status from ${order.status} to ${targetStatus}`,
      });

      return NextResponse.json({
        success: true,
        message: `Order #${order.orderNumber} updated to ${targetStatus}.`,
        order: updatedOrder,
      });
    }

    // Direct payment status update if requested
    if (paymentStatus && paymentStatus !== order.paymentStatus) {
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus },
      });

      await logAuditEvent({
        userId: session.id,
        action: 'UPDATE_PAYMENT_STATUS',
        entityType: 'ORDER',
        entityId: order.id,
        details: `Updated payment status for #${order.orderNumber} to ${paymentStatus}`,
      });

      return NextResponse.json({
        success: true,
        message: 'Payment status updated.',
        order: updatedOrder,
      });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: 'Failed to update order status.' }, { status: 500 });
  }
}
