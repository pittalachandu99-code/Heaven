import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import prisma from '@/lib/prisma';
import { ArrowRight, Sparkles } from 'lucide-react';

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      products: {
        where: { isPublished: true },
        take: 3,
        select: {
          id: true,
          name: true,
          slug: true,
          primaryImage: true,
          price: true,
          fragranceFamily: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
      <Navbar />

      <main className="flex-1 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[10px] uppercase tracking-[0.35em] text-[#C5A059] font-medium block">
              Formulation Realms
            </span>
            <h1 className="font-cinzel text-4xl sm:text-5xl text-neutral-950 font-normal">
              Olfactive Families &amp; Terroirs
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed">
              Discover the six master fragrance realms created by HEAVEN Parfums. Each family represents distinct botanicals extracted at peak maturity.
            </p>
          </div>

          {/* Categories Grid */}
          <div className="space-y-16">
            {categories.map((category, idx) => (
              <div
                key={category.id}
                className="bg-neutral-50 border border-neutral-200 p-8 sm:p-12 transition-all hover:border-black"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-8 border-b border-neutral-200">
                  <div className="space-y-2 max-w-xl">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#C5A059] font-semibold">
                      Realm 0{idx + 1}
                    </span>
                    <h2 className="font-cinzel text-2xl sm:text-3xl text-neutral-900">
                      {category.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-neutral-600 font-light leading-relaxed">
                      {category.description}
                    </p>
                  </div>

                  <div>
                    <Link
                      href={`/products?category=${category.slug}`}
                      className="btn-heaven-primary py-3 px-6 text-xs tracking-[0.2em] inline-flex items-center gap-2"
                    >
                      <span>Explore All {category.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Sample Fragrances from this Category */}
                <div className="pt-8">
                  <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium mb-4">
                    Signature Creations in This Family:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {category.products.map((prod) => (
                      <Link
                        key={prod.id}
                        href={`/products/${prod.slug}`}
                        className="group bg-white border border-neutral-200 p-4 flex items-center gap-4 hover:border-black transition-all"
                      >
                        <div className="relative w-16 h-16 bg-neutral-100 flex-shrink-0 overflow-hidden">
                          <Image
                            src={prod.primaryImage}
                            alt={prod.name}
                            fill
                            sizes="64px"
                            className="object-cover object-center group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-cinzel text-xs font-semibold text-neutral-900 group-hover:text-[#C5A059] transition-colors truncate">
                            {prod.name}
                          </h3>
                          <div className="text-[10px] text-neutral-500 uppercase tracking-wider mt-0.5">
                            {prod.fragranceFamily}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
