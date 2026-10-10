import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { GUEST_SESSION_COOKIE, getGuestSessionId } from '@/lib/cart-session';

async function getOrCreateWishlist(userId?: string, guestSessionId?: string) {
  if (userId) {
    let userWishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { category: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!userWishlist) {
      userWishlist = await prisma.wishlist.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: { category: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    }
    return userWishlist;
  }

  const effectiveGuestId = guestSessionId || getGuestSessionId();
  let guestWishlist = await prisma.wishlist.findUnique({
    where: { anonymousSessionId: effectiveGuestId },
    include: {
      items: {
        include: {
          product: {
            include: { category: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!guestWishlist) {
    guestWishlist = await prisma.wishlist.create({
      data: { anonymousSessionId: effectiveGuestId },
      include: {
        items: {
          include: {
            product: {
              include: { category: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  return guestWishlist;
}

export async function GET() {
  try {
    const session = await getServerSession();
    const cookieStore = cookies();
    const guestSessionId = cookieStore.get(GUEST_SESSION_COOKIE)?.value || getGuestSessionId();

    const wishlist = await getOrCreateWishlist(session?.id, guestSessionId);

    return NextResponse.json({
      success: true,
      items: wishlist.items,
      count: wishlist.items.length,
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve wishlist.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID required.' },
        { status: 400 }
      );
    }

    const session = await getServerSession();
    const cookieStore = cookies();
    const guestSessionId = cookieStore.get(GUEST_SESSION_COOKIE)?.value || getGuestSessionId();

    const wishlist = await getOrCreateWishlist(session?.id, guestSessionId);

    const existing = wishlist.items.find((i) => i.productId === productId);
    let isSaved = false;

    if (existing) {
      await prisma.wishlistItem.delete({
        where: { id: existing.id },
      });
      isSaved = false;
    } else {
      await prisma.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          productId,
        },
      });
      isSaved = true;
    }

    const updatedWishlist = await getOrCreateWishlist(session?.id, guestSessionId);

    const response = NextResponse.json({
      success: true,
      isSaved,
      message: isSaved
        ? 'Perfume saved to your private wishlist.'
        : 'Perfume removed from your wishlist.',
      count: updatedWishlist.items.length,
      items: updatedWishlist.items,
    });

    if (!session && !cookieStore.get(GUEST_SESSION_COOKIE)) {
      response.cookies.set(GUEST_SESSION_COOKIE, guestSessionId, {
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
        sameSite: 'lax',
        httpOnly: true,
      });
    }

    return response;
  } catch (error) {
    console.error('Error updating wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to update wishlist.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID required.' },
        { status: 400 }
      );
    }

    const session = await getServerSession();
    const cookieStore = cookies();
    const guestSessionId = cookieStore.get(GUEST_SESSION_COOKIE)?.value;

    const wishlist = await getOrCreateWishlist(session?.id, guestSessionId);

    await prisma.wishlistItem.deleteMany({
      where: {
        wishlistId: wishlist.id,
        productId,
      },
    });

    const updated = await getOrCreateWishlist(session?.id, guestSessionId);

    return NextResponse.json({
      success: true,
      items: updated.items,
      count: updated.items.length,
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove from wishlist.' },
      { status: 500 }
    );
  }
}
