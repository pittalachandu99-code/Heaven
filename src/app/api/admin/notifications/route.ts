import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const [lowStockCount, unassignedOrdersCount, pendingOrdersCount, failedPaymentsCount] =
      await Promise.all([
        prisma.product.count({
          where: {
            isPublished: true,
            isArchived: false,
            stockQuantity: { lte: 10 },
          },
        }),
        prisma.order.count({
          where: {
            status: { in: ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'] },
            deliveryAssignment: null,
          },
        }),
        prisma.order.count({
          where: {
            status: { in: ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY'] },
          },
        }),
        prisma.paymentSimulation.count({
          where: { status: 'FAILED' },
        }),
      ]);

    return NextResponse.json({
      lowStockCount,
      unassignedOrdersCount,
      pendingOrdersCount,
      failedPaymentsCount,
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch operational alerts' }, { status: 500 });
  }
}
