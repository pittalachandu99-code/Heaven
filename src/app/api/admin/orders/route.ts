import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';
    const paymentStatus = searchParams.get('paymentStatus') || '';
    const paymentMethod = searchParams.get('paymentMethod') || '';
    const assigned = searchParams.get('assigned') || ''; // 'assigned', 'unassigned'
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);

    const where: any = {};

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { shippingRecipient: { contains: search } },
        { shippingPhone: { contains: search } },
        { user: { email: { contains: search } } },
        { user: { fullName: { contains: search } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (assigned === 'assigned') {
      where.deliveryAssignment = { isNot: null };
    } else if (assigned === 'unassigned') {
      where.deliveryAssignment = null;
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { fullName: true, email: true } },
          items: true,
          deliveryAssignment: {
            include: {
              deliveryPartner: {
                include: { user: { select: { fullName: true } } },
              },
            },
          },
          events: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin orders fetch error:', error);
    return NextResponse.json({ error: 'Failed to retrieve orders.' }, { status: 500 });
  }
}
