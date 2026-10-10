import React from 'react';
import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import AdminLayout from '@/components/admin/AdminLayout';
import ProductForm from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

export default async function AdminEditProductPage({
  params,
}: {
  params: { productId: string };
}) {
  const session = await getServerSession();

  if (!session || session.role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const { productId } = params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
    }),
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <AdminLayout
      title={`Edit: ${product.name}`}
      breadcrumbs={[
        { label: 'Products', href: '/admin/products' },
        { label: product.name },
        { label: 'Edit' },
      ]}
      currentAdmin={session}
    >
      <div className="space-y-6">
        <div>
          <h2 className="font-cinzel text-xl text-neutral-900 font-semibold">
            Edit Flacon Dossier
          </h2>
          <p className="text-xs text-neutral-500 font-light mt-0.5">
            Modify pricing, notes, descriptions, or inventory levels for {product.name}.
          </p>
        </div>

        <ProductForm initialData={product} categories={categories} isEditing={true} />
      </div>
    </AdminLayout>
  );
}
