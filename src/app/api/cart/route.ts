import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import {
  GUEST_SESSION_COOKIE,
  getGuestSessionId,
  getOrCreateCart,
  calculateCartSummary,
} from '@/lib/cart-session';

export async function GET() {
  try {
    const session = await getServerSession();
    const cookieStore = cookies();
    const guestSessionId = cookieStore.get(GUEST_SESSION_COOKIE)?.value || getGuestSessionId();

    const cart = await getOrCreateCart(session?.id, guestSessionId);
    const summary = await calculateCartSummary(cart.items);

    const response = NextResponse.json({
      success: true,
      cartId: cart.id,
      items: cart.items,
      summary,
    });

    if (!session && !cookieStore.get(GUEST_SESSION_COOKIE)) {
      response.cookies.set(GUEST_SESSION_COOKIE, guestSessionId, {
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        sameSite: 'lax',
        httpOnly: true,
      });
    }

    return response;
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve shopping cart.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, quantity = 1 } = body;

    if (!productId || typeof quantity !== 'number' || quantity < 1) {
      return NextResponse.json(
        { error: 'Invalid product or quantity specified.' },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isPublished) {
      return NextResponse.json(
        { error: 'The requested perfume edition is unavailable.' },
        { status: 404 }
      );
    }

    const session = await getServerSession();
    const cookieStore = cookies();
    const guestSessionId = cookieStore.get(GUEST_SESSION_COOKIE)?.value || getGuestSessionId();

    const cart = await getOrCreateCart(session?.id, guestSessionId);

    // Check existing item
    const existingItem = cart.items.find((i) => i.productId === productId);
    const currentQty = existingItem ? existingItem.quantity : 0;
    const requestedTotalQty = currentQty + quantity;

    if (requestedTotalQty > product.stockQuantity) {
      return NextResponse.json(
        {
          error: `Insufficient reserve flacons. Only ${product.stockQuantity} bottle${
            product.stockQuantity === 1 ? '' : 's'
          } currently available in our cellar.`,
        },
        { status: 400 }
      );
    }

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: requestedTotalQty },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    // Refetch updated cart
    const updatedCart = await getOrCreateCart(session?.id, guestSessionId);
    const summary = await calculateCartSummary(updatedCart.items);

    const response = NextResponse.json({
      success: true,
      message: `${product.name} added to your selection.`,
      cartId: updatedCart.id,
      items: updatedCart.items,
      summary,
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
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while adding to cart.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { cartItemId, quantity } = body;

    if (!cartItemId || typeof quantity !== 'number' || quantity < 1) {
      return NextResponse.json(
        { error: 'Invalid cart item or quantity.' },
        { status: 400 }
      );
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { product: true },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found.' },
        { status: 404 }
      );
    }

    if (quantity > cartItem.product.stockQuantity) {
      return NextResponse.json(
        {
          error: `Cannot exceed available harvest stock (${cartItem.product.stockQuantity} flacons).`,
        },
        { status: 400 }
      );
    }

    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    const session = await getServerSession();
    const cookieStore = cookies();
    const guestSessionId = cookieStore.get(GUEST_SESSION_COOKIE)?.value;

    const updatedCart = await getOrCreateCart(session?.id, guestSessionId);
    const summary = await calculateCartSummary(updatedCart.items);

    return NextResponse.json({
      success: true,
      items: updatedCart.items,
      summary,
    });
  } catch (error) {
    console.error('Error updating cart quantity:', error);
    return NextResponse.json(
      { error: 'Failed to update item quantity.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get('id');
    const clearAll = searchParams.get('clear') === 'true';

    const session = await getServerSession();
    const cookieStore = cookies();
    const guestSessionId = cookieStore.get(GUEST_SESSION_COOKIE)?.value;

    const cart = await getOrCreateCart(session?.id, guestSessionId);

    if (clearAll) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    } else if (cartItemId) {
      await prisma.cartItem.deleteMany({
        where: {
          id: cartItemId,
          cartId: cart.id,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Please specify an item to remove.' },
        { status: 400 }
      );
    }

    const updatedCart = await getOrCreateCart(session?.id, guestSessionId);
    const summary = await calculateCartSummary(updatedCart.items);

    return NextResponse.json({
      success: true,
      items: updatedCart.items,
      summary,
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    return NextResponse.json(
      { error: 'Failed to update cart.' },
      { status: 500 }
    );
  }
}
