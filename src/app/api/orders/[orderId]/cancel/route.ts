import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
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
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Ownership check
    if (order.userId !== session.id && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    // Status transition validity check
    const cancellableStatuses = ['PLACED', 'CONFIRMED'];
    if (!cancellableStatuses.includes(order.status)) {
      return NextResponse.json(
        {
          error: `Cannot cancel order at stage "${order.status}". Dispatches currently preparing or in transit cannot be recalled directly.`,
        },
        { status: 400 }
      );
    }

    // Atomic cancellation transaction: restore inventory, record movements, update order
    const updatedOrder = await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (item.productId) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });
          if (product) {
            const restoredBalance = product.stockQuantity + item.quantity;
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQuantity: restoredBalance },
            });

            await tx.inventoryMovement.create({
              data: {
                productId: item.productId,
                changeQuantity: item.quantity,
                balanceAfter: restoredBalance,
                reason: 'ORDER_CANCELLED',
                referenceId: order.id,
              },
            });
          }
        }
      }

      await tx.orderStatusEvent.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: 'CANCELLED',
          title: 'Order Cancelled',
          description: 'Acquisition cancelled by client. Allocated flacons returned to cellar reserve.',
          actorId: session.id,
          actorRole: session.role,
        },
      });

      return await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          paymentStatus: order.paymentStatus === 'COMPLETED' ? 'REFUNDED' : 'CANCELLED',
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully. Cellar allocation released.',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Order cancellation error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order.' },
      { status: 500 }
    );
  }
}
