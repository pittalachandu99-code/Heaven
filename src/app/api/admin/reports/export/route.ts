import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function sanitizeCsvValue(val: any): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).replace(/"/g, '""');

  // Protect against spreadsheet formula injection (=, +, -, @)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  return `"${str}"`;
}

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
    } else {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: startDate } },
      include: {
        user: { select: { fullName: true, email: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Order Number',
      'Date',
      'Client Name',
      'Client Email',
      'Status',
      'Payment Method',
      'Payment Status',
      'Subtotal (INR)',
      'Shipping Fee (INR)',
      'Total Amount (INR)',
      'Items Count',
      'Items Detail',
    ];

    const rows = orders.map((o) => {
      const itemsDetail = o.items
        .map((i) => `${i.productName} (x${i.quantity})`)
        .join('; ');

      return [
        sanitizeCsvValue(o.orderNumber),
        sanitizeCsvValue(new Date(o.createdAt).toISOString()),
        sanitizeCsvValue(o.shippingRecipient || o.user?.fullName),
        sanitizeCsvValue(o.user?.email),
        sanitizeCsvValue(o.status),
        sanitizeCsvValue(o.paymentMethod),
        sanitizeCsvValue(o.paymentStatus),
        sanitizeCsvValue(o.subtotal),
        sanitizeCsvValue(o.shippingFee),
        sanitizeCsvValue(o.totalAmount),
        sanitizeCsvValue(o.items.length),
        sanitizeCsvValue(itemsDetail),
      ].join(',');
    });

    const csvContent = [headers.map((h) => `"${h}"`).join(','), ...rows].join('\r\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="HEAVEN_Orders_Report_${period}_${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json({ error: 'Failed to export CSV.' }, { status: 500 });
  }
}
