import React from 'react';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import AdminLayout from '@/components/admin/AdminLayout';
import ProductForm from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

export default async function AdminNewProductPage() {
  const session = await getServerSession();

  if (!session || session.role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return (
    <AdminLayout
      title="Create New Flacon"
      breadcrumbs={[
        { label: 'Products', href: '/admin/products' },
        { label: 'New Flacon' },
      ]}
      currentAdmin={session}
    >
      <div className="space-y-6">
        <div>
          <h2 className="font-cinzel text-xl text-neutral-900 font-semibold">
            Catalogue Allocation Creation
          </h2>
          <p className="text-xs text-neutral-500 font-light mt-0.5">
            Add an exclusive haute parfumerie fragrance to the HEAVEN client repository.
          </p>
        </div>

        <ProductForm categories={categories} isEditing={false} />
      </div>
    </AdminLayout>
  );
}
