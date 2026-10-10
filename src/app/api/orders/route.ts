import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        deliveryAssignment: {
          include: {
            deliveryPartner: {
              include: {
                user: { select: { fullName: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve order history.' },
      { status: 500 }
    );
  }
}
