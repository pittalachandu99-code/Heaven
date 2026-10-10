import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        customerProfile: true,
        savedAddresses: {
          orderBy: { isDefault: 'desc' },
        },
        orders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        preferredNotes: user.customerProfile?.preferredNotes || '',
        savedAddresses: user.savedAddresses,
        recentOrders: user.orders,
      },
    });
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve account details.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, phone, preferredNotes } = body;

    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: {
        fullName: fullName ? fullName.trim() : undefined,
        phone: phone ? phone.trim() : undefined,
      },
    });

    if (preferredNotes !== undefined) {
      await prisma.customerProfile.upsert({
        where: { userId: session.id },
        update: { preferredNotes },
        create: {
          userId: session.id,
          preferredNotes,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Account preferences updated.',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json(
      { error: 'Failed to update account details.' },
      { status: 500 }
    );
  }
}
