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

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error('Fetch categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, description, isActive = true } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Category name is required (min 2 characters).' }, { status: 400 });
    }

    const cleanSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Check uniqueness
    const existing = await prisma.category.findFirst({
      where: {
        OR: [{ name: name.trim() }, { slug: cleanSlug }],
      },
    });

    if (existing) {
      return NextResponse.json({
        error: `A category with name "${name}" or slug "${cleanSlug}" already exists.`,
      }, { status: 409 });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: cleanSlug,
        description: description ? description.trim() : null,
        isActive: Boolean(isActive),
      },
    });

    await logAuditEvent({
      userId: session.id,
      action: 'CREATE_CATEGORY',
      entityType: 'CATEGORY',
      entityId: category.id,
      details: JSON.stringify({ name: category.name, slug: category.slug }),
    });

    return NextResponse.json({
      success: true,
      message: 'Category created successfully.',
      category,
    }, { status: 201 });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: 'Failed to create category.' }, { status: 500 });
  }
}
