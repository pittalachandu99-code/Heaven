import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    let settings = await prisma.storeSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: { id: 'default' },
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({ error: 'Failed to retrieve settings.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      storeName,
      storeEmail,
      storePhone,
      shippingFee,
      freeShippingThreshold,
      lowStockThreshold,
      enableDemoUpi,
      enableDemoCard,
      enableDemoCod,
      partnerEarningPerDelivery,
    } = body;

    // Validation
    const parsedShippingFee = parseFloat(shippingFee);
    if (isNaN(parsedShippingFee) || parsedShippingFee < 0) {
      return NextResponse.json({ error: 'Shipping fee must be a non-negative number.' }, { status: 400 });
    }

    const parsedFreeThreshold = parseFloat(freeShippingThreshold);
    if (isNaN(parsedFreeThreshold) || parsedFreeThreshold < 0) {
      return NextResponse.json({ error: 'Free shipping threshold must be a non-negative number.' }, { status: 400 });
    }

    const parsedLowStock = parseInt(lowStockThreshold, 10);
    if (isNaN(parsedLowStock) || parsedLowStock < 1) {
      return NextResponse.json({ error: 'Low stock threshold must be at least 1 unit.' }, { status: 400 });
    }

    const updated = await prisma.storeSettings.upsert({
      where: { id: 'default' },
      update: {
        storeName: storeName?.trim() || 'HEAVEN',
        storeEmail: storeEmail?.trim() || 'concierge@heavenperfume.com',
        storePhone: storePhone?.trim() || '+91 800-HEAVEN-0',
        shippingFee: parsedShippingFee,
        freeShippingThreshold: parsedFreeThreshold,
        lowStockThreshold: parsedLowStock,
        enableDemoUpi: Boolean(enableDemoUpi),
        enableDemoCard: Boolean(enableDemoCard),
        enableDemoCod: Boolean(enableDemoCod),
        partnerEarningPerDelivery: parseFloat(partnerEarningPerDelivery) || 180.0,
      },
      create: {
        id: 'default',
        storeName: storeName?.trim() || 'HEAVEN',
        storeEmail: storeEmail?.trim() || 'concierge@heavenperfume.com',
        storePhone: storePhone?.trim() || '+91 800-HEAVEN-0',
        shippingFee: parsedShippingFee,
        freeShippingThreshold: parsedFreeThreshold,
        lowStockThreshold: parsedLowStock,
        enableDemoUpi: Boolean(enableDemoUpi),
        enableDemoCard: Boolean(enableDemoCard),
        enableDemoCod: Boolean(enableDemoCod),
        partnerEarningPerDelivery: parseFloat(partnerEarningPerDelivery) || 180.0,
      },
    });

    // Log Audit
    await logAuditEvent({
      userId: session.id,
      action: 'UPDATE_STORE_SETTINGS',
      entityType: 'SETTINGS',
      entityId: 'default',
      details: `Updated shipping fee to ₹${updated.shippingFee}, free threshold to ₹${updated.freeShippingThreshold}, low stock threshold to ${updated.lowStockThreshold}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Store settings updated successfully.',
      settings: updated,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Failed to update store settings.' }, { status: 500 });
  }
}
