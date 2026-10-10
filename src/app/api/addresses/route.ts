import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addresses = await prisma.savedAddress.findMany({
      where: { userId: session.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      addresses,
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve saved addresses.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      recipientName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country = 'India',
      isDefault = false,
      deliveryInstructions,
    } = body;

    // Validation
    if (!recipientName || recipientName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Recipient full name is required (minimum 2 characters).' },
        { status: 400 }
      );
    }

    // Clean phone number: remove spaces and hyphens
    const cleanPhone = (phone || '').replace(/[\s-]/g, '');
    const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    if (!addressLine1 || addressLine1.trim().length < 5) {
      return NextResponse.json(
        { error: 'Address line 1 is required (minimum 5 characters).' },
        { status: 400 }
      );
    }

    if (!city || city.trim().length < 2) {
      return NextResponse.json(
        { error: 'City is required.' },
        { status: 400 }
      );
    }

    if (!state || state.trim().length < 2) {
      return NextResponse.json(
        { error: 'State is required.' },
        { status: 400 }
      );
    }

    const cleanPin = (postalCode || '').trim();
    const pinRegex = /^[1-9][0-9]{5}$/;
    if (!pinRegex.test(cleanPin)) {
      return NextResponse.json(
        { error: 'Please enter a valid 6-digit Indian PIN / Postal code.' },
        { status: 400 }
      );
    }

    // If setting as default, remove default flag from existing addresses
    if (isDefault) {
      await prisma.savedAddress.updateMany({
        where: { userId: session.id },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.savedAddress.create({
      data: {
        userId: session.id,
        recipientName: recipientName.trim(),
        phone: cleanPhone,
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2 ? addressLine2.trim() : null,
        city: city.trim(),
        state: state.trim(),
        postalCode: cleanPin,
        country: country.trim(),
        isDefault: Boolean(isDefault),
        deliveryInstructions: deliveryInstructions ? deliveryInstructions.trim() : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Address saved successfully.',
      address: newAddress,
    });
  } catch (error) {
    console.error('Error saving address:', error);
    return NextResponse.json(
      { error: 'Failed to save address.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Address ID required.' }, { status: 400 });
    }

    // Verify ownership
    const address = await prisma.savedAddress.findUnique({
      where: { id },
    });

    if (!address || address.userId !== session.id) {
      return NextResponse.json(
        { error: 'Address not found or unauthorized.' },
        { status: 404 }
      );
    }

    await prisma.savedAddress.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Address removed successfully.',
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { error: 'Failed to delete address.' },
      { status: 500 }
    );
  }
}
