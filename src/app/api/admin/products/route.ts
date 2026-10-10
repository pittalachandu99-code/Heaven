import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const status = searchParams.get('status') || ''; // 'published', 'draft', 'archived', 'low_stock'
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
        { sku: { contains: search } },
        { fragranceFamily: { contains: search } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status === 'published') {
      where.isPublished = true;
      where.isArchived = false;
    } else if (status === 'draft') {
      where.isPublished = false;
      where.isArchived = false;
    } else if (status === 'archived') {
      where.isArchived = true;
    } else if (status === 'low_stock') {
      where.isArchived = false;
      where.stockQuantity = { lte: 10 };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    if (sort === 'price_desc') orderBy = { price: 'desc' };
    if (sort === 'stock_asc') orderBy = { stockQuantity: 'asc' };
    if (sort === 'stock_desc') orderBy = { stockQuantity: 'desc' };
    if (sort === 'name_asc') orderBy = { name: 'asc' };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { orderItems: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin products fetch error:', error);
    return NextResponse.json({ error: 'Failed to retrieve product list.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      sku,
      subtitle,
      description,
      categoryId,
      fragranceFamily,
      topNotes,
      heartNotes,
      baseNotes,
      size = '100ml / 3.4 FL. OZ.',
      price,
      stockQuantity = 50,
      lowStockThreshold = 10,
      primaryImage,
      isFeatured = false,
      isNewArrival = false,
      isBestSeller = false,
      isPublished = true,
    } = body;

    // Validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Product name is required (min 2 characters).' }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ error: 'Category selection is required.' }, { status: 400 });
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return NextResponse.json({ error: 'Price must be a positive number in INR.' }, { status: 400 });
    }

    const parsedStock = parseInt(stockQuantity, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      return NextResponse.json({ error: 'Stock quantity cannot be negative.' }, { status: 400 });
    }

    // Generate slug if not provided
    const cleanSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Check slug uniqueness
    const existingSlug = await prisma.product.findUnique({
      where: { slug: cleanSlug },
    });
    if (existingSlug) {
      return NextResponse.json({ error: `Product slug "${cleanSlug}" is already in use.` }, { status: 409 });
    }

    // Clean SKU
    const cleanSku = sku ? sku.trim().toUpperCase() : `HVN-${cleanSlug.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const existingSku = await prisma.product.findUnique({
      where: { sku: cleanSku },
    });
    if (existingSku) {
      return NextResponse.json({ error: `SKU "${cleanSku}" is already assigned to another product.` }, { status: 409 });
    }

    const fallbackImage = primaryImage?.trim() || '/perfumes/heaven-bottle-1.jpg';

    // Create product
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        slug: cleanSlug,
        sku: cleanSku,
        subtitle: subtitle ? subtitle.trim() : null,
        description: description?.trim() || 'Haute Parfumerie Creation from Maison HEAVEN.',
        categoryId,
        fragranceFamily: fragranceFamily?.trim() || 'Woody & Oriental',
        topNotes: topNotes?.trim() || 'Bergamot, Saffron',
        heartNotes: heartNotes?.trim() || 'Damask Rose, Amber',
        baseNotes: baseNotes?.trim() || 'Cambodian Oud, White Musk',
        size: size?.trim() || '100ml / 3.4 FL. OZ.',
        price: parsedPrice,
        stockQuantity: parsedStock,
        lowStockThreshold: parseInt(lowStockThreshold, 10) || 10,
        primaryImage: fallbackImage,
        isFeatured: Boolean(isFeatured),
        isNewArrival: Boolean(isNewArrival),
        isBestSeller: Boolean(isBestSeller),
        isPublished: Boolean(isPublished),
        isArchived: false,
      },
    });

    // Record inventory initial movement if stock > 0
    if (parsedStock > 0) {
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          changeQuantity: parsedStock,
          balanceAfter: parsedStock,
          reason: 'INITIAL_STOCK',
          referenceId: session.id,
        },
      });
    }

    // Log Audit Event
    await logAuditEvent({
      userId: session.id,
      action: 'CREATE_PRODUCT',
      entityType: 'PRODUCT',
      entityId: product.id,
      details: JSON.stringify({ name: product.name, sku: product.sku, price: product.price }),
    });

    return NextResponse.json({
      success: true,
      message: 'Product created successfully.',
      product,
    }, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Failed to create product.' }, { status: 500 });
  }
}
