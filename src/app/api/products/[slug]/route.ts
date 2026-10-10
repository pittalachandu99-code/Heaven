import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!product || !product.isPublished) {
      return NextResponse.json(
        { error: 'Fragrance edition not found.' },
        { status: 404 }
      );
    }

    // Related products in the same category or fragrance family
    const relatedProducts = await prisma.product.findMany({
      where: {
        id: { not: product.id },
        isPublished: true,
        OR: [
          { categoryId: product.categoryId },
          { fragranceFamily: product.fragranceFamily },
        ],
      },
      take: 4,
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      product,
      relatedProducts,
    });
  } catch (error) {
    console.error('Error fetching product details:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve fragrance details.' },
      { status: 500 }
    );
  }
}
