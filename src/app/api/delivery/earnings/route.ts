import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'DELIVERY_PARTNER') {
      return NextResponse.json(
        { error: 'Unauthorized. Delivery partner privileges required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    const partnerProfile = await prisma.deliveryPartnerProfile.findUnique({
      where: { userId: session.id },
    });

    if (!partnerProfile) {
      return NextResponse.json(
        { error: 'Delivery partner profile not found.' },
        { status: 404 }
      );
    }

    const settings = await prisma.storeSettings.findUnique({ where: { id: 'default' } });
    const defaultRate = settings?.partnerEarningPerDelivery ?? 180.0;

    const now = new Date();
    let startDate: Date | undefined;

    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } // 'all' leaves startDate undefined

    const where: any = {
      deliveryPartnerId: partnerProfile.id,
      status: 'DELIVERED',
    };

    if (startDate) {
      where.deliveredAt = { gte: startDate };
    }

    const completedAssignments = await prisma.deliveryAssignment.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            shippingRecipient: true,
            shippingCity: true,
            shippingState: true,
            totalAmount: true,
            createdAt: true,
            items: { select: { id: true, productName: true, quantity: true } },
          },
        },
      },
      orderBy: { deliveredAt: 'desc' },
    });

    const totalEarnings = completedAssignments.reduce(
      (sum, a) => sum + (a.demoEarnings || defaultRate),
      0
    );

    // Today's specific earnings
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayAssignments = completedAssignments.filter(
      (a) => a.deliveredAt && new Date(a.deliveredAt) >= todayStart
    );
    const todayEarnings = todayAssignments.reduce(
      (sum, a) => sum + (a.demoEarnings || defaultRate),
      0
    );

    return NextResponse.json({
      success: true,
      period,
      summary: {
        totalEarnings,
        todayEarnings,
        completedCount: completedAssignments.length,
        ratePerDelivery: defaultRate,
        currencySymbol: settings?.currencySymbol || '₹',
        currencyCode: settings?.currencyCode || 'INR',
        isSimulation: true,
        disclaimer:
          'Demonstration compensation system for operational simulation. No actual banking transfers or financial obligations are implied.',
      },
      deliveries: completedAssignments.map((a) => ({
        id: a.id,
        orderId: a.order.id,
        orderNumber: a.order.orderNumber,
        recipient: a.order.shippingRecipient,
        city: a.order.shippingCity,
        assignedAt: a.assignedAt,
        deliveredAt: a.deliveredAt,
        demoEarnings: a.demoEarnings || defaultRate,
        itemsCount: a.order.items.reduce((s, i) => s + i.quantity, 0),
        orderTotal: a.order.totalAmount,
      })),
    });
  } catch (error) {
    console.error('Fetch delivery earnings error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve earnings data.' },
      { status: 500 }
    );
  }
}
