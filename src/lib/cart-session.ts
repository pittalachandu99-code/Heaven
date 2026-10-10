import { cookies } from 'next/headers';
import prisma from './prisma';

export const GUEST_SESSION_COOKIE = 'heaven_guest_session';

export function getGuestSessionId(): string {
  const cookieStore = cookies();
  let sessionId = cookieStore.get(GUEST_SESSION_COOKIE)?.value;
  if (!sessionId) {
    sessionId = 'guest_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
  return sessionId;
}

export async function getOrCreateCart(userId?: string, guestSessionId?: string) {
  if (userId) {
    let userCart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { category: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!userCart) {
      userCart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: { category: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });
    }

    // If guest cart existed, merge items into user cart
    if (guestSessionId) {
      const guestCart = await prisma.cart.findUnique({
        where: { anonymousSessionId: guestSessionId },
        include: { items: true }
      });

      if (guestCart && guestCart.items.length > 0) {
        for (const guestItem of guestCart.items) {
          const existingItem = userCart.items.find(i => i.productId === guestItem.productId);
          if (existingItem) {
            await prisma.cartItem.update({
              where: { id: existingItem.id },
              data: { quantity: existingItem.quantity + guestItem.quantity }
            });
          } else {
            await prisma.cartItem.create({
              data: {
                cartId: userCart.id,
                productId: guestItem.productId,
                quantity: guestItem.quantity
              }
            });
          }
        }
        // Remove guest cart after merging
        await prisma.cart.delete({ where: { id: guestCart.id } }).catch(() => {});

        // Refetch merged user cart
        userCart = await prisma.cart.findUnique({
          where: { id: userCart.id },
          include: {
            items: {
              include: {
                product: {
                  include: { category: true }
                }
              },
              orderBy: { createdAt: 'desc' }
            }
          }
        }) as NonNullable<typeof userCart>;
      }
    }

    return userCart;
  }

  // Guest Cart
  const effectiveGuestId = guestSessionId || getGuestSessionId();
  let guestCart = await prisma.cart.findUnique({
    where: { anonymousSessionId: effectiveGuestId },
    include: {
      items: {
        include: {
          product: {
            include: { category: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!guestCart) {
    guestCart = await prisma.cart.create({
      data: { anonymousSessionId: effectiveGuestId },
      include: {
        items: {
          include: {
            product: {
              include: { category: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  return guestCart;
}

export async function calculateCartSummary(cartItems: Array<{
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    stockQuantity: number;
    primaryImage: string;
    size: string;
    slug: string;
  };
}>) {
  const settings = await prisma.storeSettings.findUnique({
    where: { id: 'default' }
  });

  const freeShippingThreshold = settings?.freeShippingThreshold || 5000.0;
  const standardShippingFee = settings?.shippingFee || 250.0;

  const subtotal = cartItems.reduce((acc, item) => {
    return acc + item.product.price * item.quantity;
  }, 0);

  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const qualifiesForFreeShipping = subtotal >= freeShippingThreshold || subtotal === 0;
  const shippingFee = subtotal === 0 ? 0 : qualifiesForFreeShipping ? 0 : standardShippingFee;
  const total = subtotal + shippingFee;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return {
    subtotal,
    shippingFee,
    total,
    totalItemsCount,
    freeShippingThreshold,
    qualifiesForFreeShipping,
    amountToFreeShipping,
    freeShippingProgress,
    currencySymbol: settings?.currencySymbol || '₹',
    currencyCode: settings?.currencyCode || 'INR',
  };
}
