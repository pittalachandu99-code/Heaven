import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

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

    const profile = await prisma.deliveryPartnerProfile.findUnique({
      where: { userId: session.id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Delivery partner profile not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        fullName: profile.user.fullName,
        email: profile.user.email,
        phone: profile.user.phone,
        vehicleType: profile.vehicleType,
        vehicleNumber: profile.vehicleNumber,
        isAvailable: profile.isAvailable,
        deliveriesCompleted: profile.deliveriesCompleted,
        rating: profile.rating,
        currentLatitude: profile.currentLatitude,
        currentLongitude: profile.currentLongitude,
        joinedAt: profile.user.createdAt,
      },
    });
  } catch (error) {
    console.error('Fetch delivery profile error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve delivery profile.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'DELIVERY_PARTNER') {
      return NextResponse.json(
        { error: 'Unauthorized. Delivery partner privileges required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { phone, vehicleType, vehicleNumber, isAvailable } = body;

    const partnerProfile = await prisma.deliveryPartnerProfile.findUnique({
      where: { userId: session.id },
    });

    if (!partnerProfile) {
      return NextResponse.json(
        { error: 'Delivery partner profile not found.' },
        { status: 404 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update phone on user if supplied
      if (typeof phone === 'string') {
        await tx.user.update({
          where: { id: session.id },
          data: { phone: phone.trim() },
        });
      }

      // Update delivery partner profile fields
      const profileData: any = {};
      if (typeof vehicleType === 'string' && vehicleType.trim()) {
        profileData.vehicleType = vehicleType.trim();
      }
      if (typeof vehicleNumber === 'string' && vehicleNumber.trim()) {
        profileData.vehicleNumber = vehicleNumber.trim();
      }
      if (typeof isAvailable === 'boolean') {
        profileData.isAvailable = isAvailable;
      }

      const updatedProfile = await tx.deliveryPartnerProfile.update({
        where: { id: partnerProfile.id },
        data: profileData,
        include: {
          user: {
            select: { fullName: true, email: true, phone: true },
          },
        },
      });

      return updatedProfile;
    });

    await logAuditEvent({
      userId: session.id,
      action: 'UPDATE_DELIVERY_PROFILE',
      entityType: 'DELIVERY_PARTNER_PROFILE',
      entityId: partnerProfile.id,
      details: 'Courier updated operational coordinates or vehicle settings.',
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully.',
      profile: {
        id: updated.id,
        fullName: updated.user.fullName,
        email: updated.user.email,
        phone: updated.user.phone,
        vehicleType: updated.vehicleType,
        vehicleNumber: updated.vehicleNumber,
        isAvailable: updated.isAvailable,
        deliveriesCompleted: updated.deliveriesCompleted,
        rating: updated.rating,
      },
    });
  } catch (error) {
    console.error('Update delivery profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update courier profile.' },
      { status: 500 }
    );
  }
}
