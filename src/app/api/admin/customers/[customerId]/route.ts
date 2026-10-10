import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { customerId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { customerId } = params;

    const user = await prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        customerProfile: true,
        savedAddresses: {
          orderBy: { createdAt: 'desc' },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
          },
        },
      },
    });

    if (!user || user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }

    const eligibleOrders = user.orders.filter((o) => o.status !== 'CANCELLED');
    const totalSpend = eligibleOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    return NextResponse.json({
      success: true,
      customer: {
        ...user,
        totalSpend,
      },
    });
  } catch (error) {
    console.error('Fetch customer details error:', error);
    return NextResponse.json({ error: 'Failed to retrieve customer details.' }, { status: 500 });
  }
}
