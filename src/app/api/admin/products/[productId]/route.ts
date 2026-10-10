import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { productId } = params;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        _count: { select: { orderItems: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Fetch product detail error:', error);
    return NextResponse.json({ error: 'Failed to retrieve product details.' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { productId } = params;
    const existing = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
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
      size,
      price,
      stockQuantity,
      lowStockThreshold,
      primaryImage,
      isFeatured,
      isNewArrival,
      isBestSeller,
      isPublished,
      isArchived,
    } = body;

    // Validate price
    const parsedPrice = price !== undefined ? parseFloat(price) : existing.price;
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return NextResponse.json({ error: 'Price must be a positive number.' }, { status: 400 });
    }

    // Validate stock
    const parsedStock = stockQuantity !== undefined ? parseInt(stockQuantity, 10) : existing.stockQuantity;
    if (isNaN(parsedStock) || parsedStock < 0) {
      return NextResponse.json({ error: 'Stock quantity cannot be negative.' }, { status: 400 });
    }

    // Check slug conflict
    let cleanSlug = existing.slug;
    if (slug && slug !== existing.slug) {
      cleanSlug = slug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      const slugConflict = await prisma.product.findFirst({
        where: { slug: cleanSlug, id: { not: productId } },
      });
      if (slugConflict) {
        return NextResponse.json({ error: `Slug "${cleanSlug}" is already in use.` }, { status: 409 });
      }
    }

    // Check SKU conflict
    let cleanSku = existing.sku;
    if (sku && sku !== existing.sku) {
      cleanSku = sku.trim().toUpperCase();
      const skuConflict = await prisma.product.findFirst({
        where: { sku: cleanSku, id: { not: productId } },
      });
      if (skuConflict) {
        return NextResponse.json({ error: `SKU "${cleanSku}" is already assigned to another product.` }, { status: 409 });
      }
    }

    // Record stock adjustment if manually altered
    const stockDiff = parsedStock - existing.stockQuantity;

    const updated = await prisma.$transaction(async (tx) => {
      if (stockDiff !== 0) {
        await tx.inventoryMovement.create({
          data: {
            productId,
            changeQuantity: stockDiff,
            balanceAfter: parsedStock,
            reason: stockDiff > 0 ? 'ADMIN_MANUAL_INCREASE' : 'ADMIN_MANUAL_DECREASE',
            referenceId: session.id,
          },
        });
      }

      return await tx.product.update({
        where: { id: productId },
        data: {
          name: name ? name.trim() : existing.name,
          slug: cleanSlug,
          sku: cleanSku,
          subtitle: subtitle !== undefined ? subtitle : existing.subtitle,
          description: description ? description.trim() : existing.description,
          categoryId: categoryId || existing.categoryId,
          fragranceFamily: fragranceFamily ? fragranceFamily.trim() : existing.fragranceFamily,
          topNotes: topNotes ? topNotes.trim() : existing.topNotes,
          heartNotes: heartNotes ? heartNotes.trim() : existing.heartNotes,
          baseNotes: baseNotes ? baseNotes.trim() : existing.baseNotes,
          size: size ? size.trim() : existing.size,
          price: parsedPrice,
          stockQuantity: parsedStock,
          lowStockThreshold: lowStockThreshold !== undefined ? parseInt(lowStockThreshold, 10) : existing.lowStockThreshold,
          primaryImage: primaryImage ? primaryImage.trim() : existing.primaryImage,
          isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : existing.isFeatured,
          isNewArrival: isNewArrival !== undefined ? Boolean(isNewArrival) : existing.isNewArrival,
          isBestSeller: isBestSeller !== undefined ? Boolean(isBestSeller) : existing.isBestSeller,
          isPublished: isPublished !== undefined ? Boolean(isPublished) : existing.isPublished,
          isArchived: isArchived !== undefined ? Boolean(isArchived) : existing.isArchived,
        },
      });
    });

    // Log Audit
    await logAuditEvent({
      userId: session.id,
      action: 'UPDATE_PRODUCT',
      entityType: 'PRODUCT',
      entityId: productId,
      details: JSON.stringify({
        name: updated.name,
        price: updated.price,
        stockDiff,
        isPublished: updated.isPublished,
        isArchived: updated.isArchived,
      }),
    });

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully.',
      product: updated,
    });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Failed to update product.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { productId } = params;
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        _count: { select: { orderItems: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    // Safety rule: If product has order items, DO NOT hard delete. Archive instead.
    if (product._count.orderItems > 0) {
      const archived = await prisma.product.update({
        where: { id: productId },
        data: {
          isArchived: true,
          isPublished: false,
        },
      });

      await logAuditEvent({
        userId: session.id,
        action: 'ARCHIVE_PRODUCT',
        entityType: 'PRODUCT',
        entityId: productId,
        details: `Safely archived product "${product.name}" (${product._count.orderItems} historical orders protected)`,
      });

      return NextResponse.json({
        success: true,
        archived: true,
        message: `Product has ${product._count.orderItems} historical orders. It has been safely archived and unpublished rather than permanently deleted.`,
        product: archived,
      });
    }

    // Otherwise safe to delete: clean up foreign references and delete
    await prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({ where: { productId } });
      await tx.wishlistItem.deleteMany({ where: { productId } });
      await tx.inventoryMovement.deleteMany({ where: { productId } });
      await tx.productImage.deleteMany({ where: { productId } });
      await tx.product.delete({ where: { id: productId } });
    });

    await logAuditEvent({
      userId: session.id,
      action: 'DELETE_PRODUCT',
      entityType: 'PRODUCT',
      entityId: productId,
      details: `Permanently deleted product "${product.name}"`,
    });

    return NextResponse.json({
      success: true,
      deleted: true,
      message: 'Product permanently removed from database.',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Failed to delete product.' }, { status: 500 });
  }
}
