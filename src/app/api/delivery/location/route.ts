import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'DELIVERY_PARTNER') {
      return NextResponse.json(
        { error: 'Unauthorized. Delivery partner privileges required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { latitude, longitude } = body;

    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        { error: 'Invalid geographic coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.' },
        { status: 400 }
      );
    }

    const partnerProfile = await prisma.deliveryPartnerProfile.findUnique({
      where: { userId: session.id },
    });

    if (!partnerProfile) {
      return NextResponse.json(
        { error: 'Delivery partner profile not found.' },
        { status: 404 }
      );
    }

    const updatedProfile = await prisma.deliveryPartnerProfile.update({
      where: { id: partnerProfile.id },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
      },
      select: {
        id: true,
        currentLatitude: true,
        currentLongitude: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Courier live coordinates updated successfully.',
      location: {
        latitude: updatedProfile.currentLatitude,
        longitude: updatedProfile.currentLongitude,
        updatedAt: updatedProfile.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update delivery location error:', error);
    return NextResponse.json(
      { error: 'Failed to update courier telemetry.' },
      { status: 500 }
    );
  }
}

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
      select: {
        id: true,
        currentLatitude: true,
        currentLongitude: true,
        isAvailable: true,
        updatedAt: true,
      },
    });

    if (!partnerProfile) {
      return NextResponse.json(
        { error: 'Delivery partner profile not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      location: {
        latitude: partnerProfile.currentLatitude,
        longitude: partnerProfile.currentLongitude,
        isAvailable: partnerProfile.isAvailable,
        updatedAt: partnerProfile.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get delivery location error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve courier location.' },
      { status: 500 }
    );
  }
}
