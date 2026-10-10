import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { categoryId } = params;
    const body = await request.json();
    const { name, slug, description, isActive } = body;

    const existing = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    }

    let cleanSlug = existing.slug;
    if (slug && slug !== existing.slug) {
      cleanSlug = slug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      const conflict = await prisma.category.findFirst({
        where: { slug: cleanSlug, id: { not: categoryId } },
      });
      if (conflict) {
        return NextResponse.json({ error: `Slug "${cleanSlug}" is already taken.` }, { status: 409 });
      }
    }

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: name ? name.trim() : existing.name,
        slug: cleanSlug,
        description: description !== undefined ? description : existing.description,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      },
    });

    await logAuditEvent({
      userId: session.id,
      action: 'UPDATE_CATEGORY',
      entityType: 'CATEGORY',
      entityId: categoryId,
      details: JSON.stringify({ name: updated.name, isActive: updated.isActive }),
    });

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully.',
      category: updated,
    });
  } catch (error) {
    console.error('Update category error:', error);
    return NextResponse.json({ error: 'Failed to update category.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { categoryId } = params;
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    }

    // Safeguard: Prevent deleting categories that have products assigned!
    if (category._count.products > 0) {
      return NextResponse.json({
        error: `Cannot delete category "${category.name}". It currently contains ${category._count.products} assigned products. Reassign or archive the products first, or deactivate the category instead.`,
      }, { status: 400 });
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    await logAuditEvent({
      userId: session.id,
      action: 'DELETE_CATEGORY',
      entityType: 'CATEGORY',
      entityId: categoryId,
      details: `Deleted empty category "${category.name}"`,
    });

    return NextResponse.json({
      success: true,
      message: `Category "${category.name}" deleted successfully.`,
    });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json({ error: 'Failed to delete category.' }, { status: 500 });
  }
}
