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
    const period = searchParams.get('period') || '30d';

    const now = new Date();
    let startDate: Date;

    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'last_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    } else {
      // 30d default
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const totalOrdersCount = orders.length;
    const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
    const cancelledCount = orders.filter((o) => o.status === 'CANCELLED').length;
    const activeCount = orders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status)).length;

    // Financial rules:
    const eligibleOrders = orders.filter((o) => o.status !== 'CANCELLED');
    const eligibleRevenue = eligibleOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const collectedPayments = orders
      .filter((o) => o.paymentStatus === 'COMPLETED')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const codPendingCollection = orders
      .filter((o) => o.paymentMethod === 'COD' && o.paymentStatus === 'COD_PENDING')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const averageOrderValue =
      eligibleOrders.length > 0 ? Math.round(eligibleRevenue / eligibleOrders.length) : 0;

    // Daily revenue aggregation for charts
    const dailyMap: Record<string, { date: string; revenue: number; count: number }> = {};
    for (const o of eligibleOrders) {
      const dateStr = new Date(o.createdAt).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      });
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { date: dateStr, revenue: 0, count: 0 };
      }
      dailyMap[dateStr].revenue += o.totalAmount;
      dailyMap[dateStr].count += 1;
    }
    const salesTrend = Object.values(dailyMap);

    // Best-selling flacons
    const productSalesMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    for (const o of eligibleOrders) {
      for (const item of o.items) {
        if (!productSalesMap[item.productName]) {
          productSalesMap[item.productName] = { name: item.productName, quantity: 0, revenue: 0 };
        }
        productSalesMap[item.productName].quantity += item.quantity;
        productSalesMap[item.productName].revenue += item.totalPrice;
      }
    }
    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      period,
      metrics: {
        totalOrdersCount,
        deliveredCount,
        cancelledCount,
        activeCount,
        eligibleRevenue,
        collectedPayments,
        codPendingCollection,
        averageOrderValue,
      },
      salesTrend,
      topProducts,
    });
  } catch (error) {
    console.error('Fetch reports error:', error);
    return NextResponse.json({ error: 'Failed to generate analytics report.' }, { status: 500 });
  }
}
