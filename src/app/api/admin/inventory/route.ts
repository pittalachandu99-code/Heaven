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
    const filter = searchParams.get('filter') || ''; // 'low_stock', 'out_of_stock'
    const categoryId = searchParams.get('categoryId') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);

    const where: any = { isArchived: false };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (filter === 'low_stock') {
      where.stockQuantity = { lte: 10, gt: 0 };
    } else if (filter === 'out_of_stock') {
      where.stockQuantity = { lte: 0 };
    }

    const [total, products, recentMovements] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: { stockQuantity: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { name: true } },
          inventoryMovements: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.inventoryMovement.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      products,
      recentMovements,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Fetch inventory error:', error);
    return NextResponse.json({ error: 'Failed to retrieve inventory.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { productId, adjustmentType, quantity, reason } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product selection is required.' }, { status: 400 });
    }

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return NextResponse.json({ error: 'Adjustment quantity must be a positive integer.' }, { status: 400 });
    }

    if (!reason || reason.trim().length < 3) {
      return NextResponse.json({ error: 'A specific explanation / reason is required for inventory audit.' }, { status: 400 });
    }

    const validTypes = [
      'STOCK_RECEIVED',
      'CORRECTION_INCREASE',
      'CORRECTION_DECREASE',
      'DAMAGED_STOCK',
      'REMOVED_FROM_SALE',
    ];

    if (!validTypes.includes(adjustmentType)) {
      return NextResponse.json({ error: `Invalid adjustment type "${adjustmentType}".` }, { status: 400 });
    }

    const isAddition = adjustmentType === 'STOCK_RECEIVED' || adjustmentType === 'CORRECTION_INCREASE';
    const delta = isAddition ? parsedQty : -parsedQty;

    // Atomic stock adjustment transaction
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error('Product not found.');
      }

      const newBalance = product.stockQuantity + delta;
      if (newBalance < 0) {
        throw new Error(`Insufficient stock. Current cellar balance is ${product.stockQuantity}; reduction by ${parsedQty} would result in negative stock.`);
      }

      // Update Product
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { stockQuantity: newBalance },
      });

      // Record immutable inventory movement
      const movement = await tx.inventoryMovement.create({
        data: {
          productId,
          changeQuantity: delta,
          balanceAfter: newBalance,
          reason: `${adjustmentType}: ${reason.trim()}`,
          referenceId: session.id,
        },
      });

      return { updatedProduct, movement };
    });

    // Log Audit
    await logAuditEvent({
      userId: session.id,
      action: 'INVENTORY_ADJUSTMENT',
      entityType: 'INVENTORY',
      entityId: productId,
      details: `${adjustmentType} for "${result.updatedProduct.name}" by ${delta} units. Reason: ${reason}. New balance: ${result.updatedProduct.stockQuantity}`,
    });

    return NextResponse.json({
      success: true,
      message: `Inventory updated for ${result.updatedProduct.name}. New balance: ${result.updatedProduct.stockQuantity} units.`,
      product: result.updatedProduct,
      movement: result.movement,
    });
  } catch (error: any) {
    console.error('Inventory adjustment error:', error);
    return NextResponse.json({ error: error.message || 'Failed to adjust inventory.' }, { status: 400 });
  }
}
