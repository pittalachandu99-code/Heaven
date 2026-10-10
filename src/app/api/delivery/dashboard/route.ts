import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'DELIVERY_PARTNER') {
      return NextResponse.json(
        { error: 'Unauthorized. Delivery partner privileges required.' },
        { status: 403 }
      );
    }

    const partnerProfile = await prisma.deliveryPartnerProfile.findUnique({
      where: { userId: session.id },
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
      },
    });

    if (!partnerProfile) {
      return NextResponse.json(
        { error: 'Delivery partner profile not found.' },
        { status: 404 }
      );
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Fetch all assignments for this partner
    const [
      allAssignments,
      activeAssignments,
      completedToday,
      settings,
    ] = await Promise.all([
      prisma.deliveryAssignment.findMany({
        where: { deliveryPartnerId: partnerProfile.id },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              shippingRecipient: true,
              shippingCity: true,
              shippingState: true,
              totalAmount: true,
              createdAt: true,
              items: { select: { id: true } },
            },
          },
        },
        orderBy: { assignedAt: 'desc' },
      }),
      prisma.deliveryAssignment.findMany({
        where: {
          deliveryPartnerId: partnerProfile.id,
          status: { in: ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'] },
          order: { status: { notIn: ['DELIVERED', 'CANCELLED'] } },
        },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              shippingRecipient: true,
              shippingPhone: true,
              shippingAddressLine1: true,
              shippingCity: true,
              shippingState: true,
              shippingPostalCode: true,
              shippingInstructions: true,
              totalAmount: true,
              createdAt: true,
              items: {
                select: {
                  id: true,
                  productName: true,
                  productSize: true,
                  quantity: true,
                  productImage: true,
                },
              },
            },
          },
        },
        orderBy: { assignedAt: 'desc' },
      }),
      prisma.deliveryAssignment.findMany({
        where: {
          deliveryPartnerId: partnerProfile.id,
          status: 'DELIVERED',
          deliveredAt: { gte: todayStart },
        },
      }),
      prisma.storeSettings.findUnique({ where: { id: 'default' } }),
    ]);

    const earningPerDelivery = settings?.partnerEarningPerDelivery ?? 180.0;

    // Derived Metrics
    const completedAssignments = allAssignments.filter((a) => a.status === 'DELIVERED');
    const awaitingPickup = activeAssignments.filter((a) =>
      ['ASSIGNED', 'READY_FOR_PICKUP', 'CONFIRMED', 'PREPARING'].includes(a.order.status)
    );
    const outForDelivery = activeAssignments.filter((a) => a.order.status === 'OUT_FOR_DELIVERY');

    const totalDemoEarnings = completedAssignments.reduce(
      (sum, a) => sum + (a.demoEarnings || earningPerDelivery),
      0
    );

    const todayDemoEarnings = completedToday.reduce(
      (sum, a) => sum + (a.demoEarnings || earningPerDelivery),
      0
    );

    return NextResponse.json({
      success: true,
      partner: {
        id: partnerProfile.id,
        fullName: partnerProfile.user.fullName,
        email: partnerProfile.user.email,
        phone: partnerProfile.user.phone,
        vehicleType: partnerProfile.vehicleType || 'Executive Climate-Controlled Van',
        vehicleNumber: partnerProfile.vehicleNumber || 'DL-01-HV-7777',
        isAvailable: partnerProfile.isAvailable,
        rating: partnerProfile.rating,
        deliveriesCompleted: partnerProfile.deliveriesCompleted,
        currentLatitude: partnerProfile.currentLatitude,
        currentLongitude: partnerProfile.currentLongitude,
      },
      metrics: {
        activeCount: activeAssignments.length,
        awaitingPickupCount: awaitingPickup.length,
        outForDeliveryCount: outForDelivery.length,
        completedTotalCount: completedAssignments.length,
        completedTodayCount: completedToday.length,
        totalDemoEarnings,
        todayDemoEarnings,
        earningPerDelivery,
      },
      activeAssignments,
      recentActivity: allAssignments.slice(0, 8),
    });
  } catch (error) {
    console.error('Delivery dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve delivery partner metrics.' },
      { status: 500 }
    );
  }
}
