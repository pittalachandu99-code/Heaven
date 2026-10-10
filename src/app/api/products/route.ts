import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('search') || '';
    const categorySlug = searchParams.get('category');
    const family = searchParams.get('family');
    const sort = searchParams.get('sort') || 'featured';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const isFeatured = searchParams.get('featured') === 'true';
    const isBestSeller = searchParams.get('bestseller') === 'true';
    const isNewArrival = searchParams.get('new') === 'true';

    const where: Prisma.ProductWhereInput = {
      isPublished: true,
    };

    if (query) {
      where.OR = [
        { name: { contains: query } },
        { description: { contains: query } },
        { subtitle: { contains: query } },
        { topNotes: { contains: query } },
        { heartNotes: { contains: query } },
        { baseNotes: { contains: query } },
        { fragranceFamily: { contains: query } },
      ];
    }

    if (categorySlug && categorySlug !== 'all') {
      where.category = { slug: categorySlug };
    }

    if (family && family !== 'all') {
      where.fragranceFamily = family;
    }

    if (isFeatured) {
      where.isFeatured = true;
    }

    if (isBestSeller) {
      where.isBestSeller = true;
    }

    if (isNewArrival) {
      where.isNewArrival = true;
    }

    // Sorting
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (sort === 'name_asc') {
      orderBy = { name: 'asc' };
    } else if (sort === 'popular') {
      orderBy = { isBestSeller: 'desc' };
    } else if (sort === 'featured') {
      orderBy = { isFeatured: 'desc' };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy,
      take: limit,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch catalogue products.' },
      { status: 500 }
    );
  }
}
