import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import prisma from '@/lib/prisma';
import { formatINR } from '@/lib/utils';
import ProductDetailActions from '@/components/products/ProductDetailActions';
import { ArrowLeft, Sparkles, Shield, Droplets } from 'lucide-react';

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!product || !product.isPublished) {
    notFound();
  }

  // Related perfumes in the same category or family
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
    include: { category: true },
  });

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Breadcrumb Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center space-x-2 text-xs text-neutral-400">
            <Link href="/" className="hover:text-black transition-colors">
              Maison
            </Link>
            <span>/</span>
            <Link href="/products" className="hover:text-black transition-colors">
              Collection
            </Link>
            <span>/</span>
            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-black transition-colors"
            >
              {product.category.name}
            </Link>
            <span>/</span>
            <span className="text-black font-medium truncate max-w-[200px]">
              {product.name}
            </span>
          </nav>
        </div>

        {/* Product Showcase Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Visual Column */}
            <div className="space-y-4">
              <div className="relative aspect-square w-full bg-neutral-50 border border-neutral-200 overflow-hidden shadow-sm">
                <Image
                  src={product.primaryImage}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center"
                  priority
                />
                {product.isBestSeller && (
                  <span className="absolute top-4 left-4 bg-black text-white text-[10px] uppercase tracking-[0.2em] px-3 py-1 font-medium">
                    Best Seller Edition
                  </span>
                )}
                {product.isNewArrival && (
                  <span className="absolute top-4 left-4 bg-[#C5A059] text-white text-[10px] uppercase tracking-[0.2em] px-3 py-1 font-medium">
                    New Harvest
                  </span>
                )}
              </div>
            </div>

            {/* Information Column */}
            <div className="space-y-8">
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-[0.25em] text-[#C5A059] font-medium">
                    {product.category.name} &bull; {product.fragranceFamily}
                  </span>
                </div>
                <h1 className="font-cinzel text-3xl sm:text-4xl text-neutral-950 font-normal">
                  {product.name}
                </h1>
                {product.subtitle && (
                  <p className="text-xs sm:text-sm text-neutral-500 italic font-light">
                    {product.subtitle}
                  </p>
                )}
                <div className="pt-2 flex items-baseline gap-4">
                  <span className="font-cinzel text-2xl sm:text-3xl font-bold text-neutral-950">
                    {formatINR(product.price)}
                  </span>
                  <span className="text-xs text-neutral-500 uppercase tracking-wider">
                    {product.size} &bull; Pure Parfum
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3 text-xs sm:text-sm text-neutral-600 font-light leading-relaxed">
                <p>{product.description}</p>
              </div>

              {/* Olfactive Pyramid */}
              <div className="bg-neutral-50 border border-neutral-200 p-6 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-200">
                  <Droplets className="w-4 h-4 text-[#C5A059]" />
                  <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-black">
                    Olfactive Architecture
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="block font-semibold uppercase tracking-wider text-black text-[10px] mb-0.5">
                      Top Notes (First Impression)
                    </span>
                    <p className="text-neutral-600">{product.topNotes}</p>
                  </div>
                  <div>
                    <span className="block font-semibold uppercase tracking-wider text-black text-[10px] mb-0.5">
                      Heart Notes (The Signature Core)
                    </span>
                    <p className="text-neutral-600">{product.heartNotes}</p>
                  </div>
                  <div>
                    <span className="block font-semibold uppercase tracking-wider text-black text-[10px] mb-0.5">
                      Base Notes (Lingering Sillage)
                    </span>
                    <p className="text-neutral-600">{product.baseNotes}</p>
                  </div>
                </div>
              </div>

              {/* Actions & Stepper */}
              <ProductDetailActions
                productId={product.id}
                productName={product.name}
                stockQuantity={product.stockQuantity}
              />
            </div>
          </div>
        </section>

        {/* Related Fragrances Section */}
        {relatedProducts.length > 0 && (
          <section className="bg-neutral-50 border-t border-neutral-200 py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
                <span className="text-xs uppercase tracking-[0.3em] text-[#C5A059] font-medium">
                  Complementary Creations
                </span>
                <h2 className="font-cinzel text-2xl sm:text-3xl text-neutral-900">
                  Related Olfactive Expressions
                </h2>
                <p className="text-xs text-neutral-500 font-light">
                  Flacons sharing harmonious notes and botanical affinities.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((rel) => (
                  <div
                    key={rel.id}
                    className="group bg-white border border-neutral-200 hover:border-black transition-all flex flex-col justify-between"
                  >
                    <div className="relative aspect-square bg-neutral-100 overflow-hidden">
                      <Image
                        src={rel.primaryImage}
                        alt={rel.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 25vw"
                        className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="text-[10px] uppercase tracking-wider text-neutral-400">
                        {rel.fragranceFamily}
                      </div>
                      <Link
                        href={`/products/${rel.slug}`}
                        className="block font-cinzel text-sm font-semibold text-neutral-900 group-hover:text-[#C5A059] transition-colors"
                      >
                        {rel.name}
                      </Link>
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs">
                        <span className="font-cinzel font-semibold text-neutral-900">
                          {formatINR(rel.price)}
                        </span>
                        <Link
                          href={`/products/${rel.slug}`}
                          className="text-[11px] uppercase tracking-wider text-black underline underline-offset-4 font-medium"
                        >
                          Explore
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
