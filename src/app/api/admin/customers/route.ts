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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);

    const where: any = { role: 'CUSTOMER' };

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
          orders: {
            select: {
              id: true,
              totalAmount: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          customerProfile: {
            select: { preferredNotes: true },
          },
        },
      }),
    ]);

    // Aggregate spend without exposing private data
    const customers = users.map((u) => {
      const eligibleOrders = u.orders.filter((o) => o.status !== 'CANCELLED');
      const totalSpend = eligibleOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const lastOrder = u.orders[0];

      return {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        isActive: u.isActive,
        createdAt: u.createdAt,
        orderCount: u.orders.length,
        totalSpend,
        lastOrderDate: lastOrder ? lastOrder.createdAt : null,
        preferredNotes: u.customerProfile?.preferredNotes || null,
      };
    });

    return NextResponse.json({
      success: true,
      customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Fetch customers error:', error);
    return NextResponse.json({ error: 'Failed to retrieve customers.' }, { status: 500 });
  }
}
