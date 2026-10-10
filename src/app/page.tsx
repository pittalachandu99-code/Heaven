import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import prisma from '@/lib/prisma';
import { formatINR } from '@/lib/utils';
import QuickAddButton from '@/components/products/QuickAddButton';
import { Sparkles, Play, ArrowRight, ShieldCheck, Award } from 'lucide-react';

export default async function HomePage() {
  // Load products and categories from database
  const [featuredProducts, categories] = await Promise.all([
    prisma.product.findMany({
      take: 8,
      include: { category: true },
      orderBy: { price: 'desc' },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      take: 6,
    }),
  ]);

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex items-center justify-center bg-[#070707] text-white px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Subtle Ambient Background */}
          <div className="absolute inset-0 bg-radial-gradient from-neutral-900/60 to-black pointer-events-none" />
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:24px_24px]" />

          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8 py-20">
            {/* Emblem */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-neutral-800 bg-neutral-900/80 backdrop-blur-md text-[11px] uppercase tracking-[0.25em] text-[#C5A059]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Haute Parfumerie &bull; Grasse Extraction</span>
            </div>

            {/* Title */}
            <div className="space-y-3">
              <h1 className="heaven-wordmark text-5xl sm:text-7xl lg:text-8xl font-normal tracking-[0.35em] text-white">
                HEAVEN
              </h1>
              <p className="text-xs sm:text-sm uppercase tracking-[0.4em] text-neutral-400 font-light">
                The Essence of Pure Artisanal Luxury
              </p>
            </div>

            <p className="text-sm sm:text-base text-neutral-300 font-light max-w-2xl mx-auto leading-relaxed">
              Distilled from dawn-harvested Grandiflorum jasmine petals, aged Mysore sandalwood, and celestial resins. Encased in heavyweight crystal flacons.
            </p>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/products"
                className="btn-heaven-primary bg-white text-black hover:bg-[#C5A059] hover:text-white py-4 px-10 text-xs tracking-[0.25em] w-full sm:w-auto"
              >
                <span>Explore The Collection</span>
                <ArrowRight className="w-4 h-4 ml-2 inline-block" />
              </Link>

              <Link
                href="/intro"
                className="btn-heaven-secondary bg-transparent border-neutral-700 text-white hover:border-[#C5A059] hover:text-[#C5A059] py-4 px-8 text-xs tracking-[0.25em] w-full sm:w-auto inline-flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Experience 4K Intro</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Brand Mission Strip */}
        <section className="border-y border-neutral-200 bg-neutral-50 py-10 px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-2">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A059] font-semibold">
              The HEAVEN Standard
            </span>
            <p className="font-cinzel text-xl sm:text-2xl text-neutral-900 font-normal tracking-wide">
              &ldquo;Fragrance is not merely a scent — it is an invisible architecture of memory and soul.&rdquo;
            </p>
          </div>
        </section>

        {/* Flagship Jasmine Showcase */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="craftsmanship">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Visual Flacon Container */}
            <div className="relative aspect-square max-w-lg mx-auto w-full bg-neutral-100 border border-neutral-200 overflow-hidden shadow-xl group">
              <Link href="/products/jasmine-eau-de-parfum" className="block w-full h-full">
                <Image
                  src="/images/products/jasmine.jpg"
                  alt="HEAVEN Jasmine Eau De Parfum"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  priority
                />
              </Link>
              <div className="absolute top-4 left-4 bg-black text-white text-[10px] uppercase tracking-[0.2em] px-3 py-1 font-medium">
                Signature Flagship
              </div>
            </div>

            {/* Information */}
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-[0.25em] text-[#C5A059] font-medium">
                  Flagship Eau De Parfum
                </span>
                <h2 className="font-cinzel text-3xl sm:text-4xl text-neutral-950">
                  Jasmine Eau De Parfum
                </h2>
                <div className="text-sm text-neutral-500 italic">100ml / 3.4 FL. OZ. &bull; Haute Concentration</div>
              </div>

              <p className="text-sm text-neutral-600 leading-relaxed font-light">
                Our flagship composition is harvested exclusively by hand in Grasse during the cool twilight hours before dawn, when the floral blossoms release their highest concentration of fragrant indole. Balanced against golden Baltic amber and warm cashmere musks.
              </p>

              {/* Olfactive Pyramid */}
              <div className="space-y-3 pt-2 border-t border-neutral-200 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                  <span className="font-semibold uppercase tracking-wider text-black w-24">Top Notes</span>
                  <span className="text-neutral-600">Calabrian Bergamot, Green Mandarin, Dewy Petals</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                  <span className="font-semibold uppercase tracking-wider text-black w-24">Heart Notes</span>
                  <span className="text-neutral-600">Grasse Jasmine Grandiflorum, Sambac Absolute, Orange Blossom</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                  <span className="font-semibold uppercase tracking-wider text-black w-24">Base Notes</span>
                  <span className="text-neutral-600">Precious Amber, Cashmere Woods, White Musk</span>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-6">
                <span className="font-cinzel text-2xl font-bold text-neutral-900">
                  {formatINR(11500)}
                </span>
                <Link
                  href="/products/jasmine-eau-de-parfum"
                  className="btn-heaven-primary py-3.5 px-8 text-xs tracking-[0.2em]"
                >
                  Acquire Allocation
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Fragrance Families Categories */}
        <section className="py-20 bg-neutral-50 border-y border-neutral-200" id="categories">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
              <span className="text-xs uppercase tracking-[0.3em] text-[#C5A059] font-medium">
                Formulation Realms
              </span>
              <h2 className="font-cinzel text-3xl text-neutral-900">
                Olfactive Families
              </h2>
              <p className="text-xs text-neutral-500 font-light">
                Explore distinct olfactory architectures crafted from the finest natural absolutes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="p-8 bg-white border border-neutral-200 hover:border-black transition-all group"
                >
                  <h3 className="font-cinzel text-lg text-neutral-950 mb-2 group-hover:text-[#C5A059] transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-xs text-neutral-500 font-light leading-relaxed mb-6">
                    {category.description || 'Rare natural harvests and bespoke distillations.'}
                  </p>
                  <Link
                    href={`/products?category=${category.slug}`}
                    className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-medium text-black group-hover:translate-x-1 transition-transform"
                  >
                    <span>View Blends</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Database Products Catalogue */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="products">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-[0.3em] text-[#C5A059] font-medium">
                The Permanent Catalogue
              </span>
              <h2 className="font-cinzel text-3xl sm:text-4xl text-neutral-900">
                Artisanal Flacons
              </h2>
              <p className="text-xs text-neutral-500 font-light">
                Numbered bottles distilled in small batches. Sourced from the world&apos;s finest harvests.
              </p>
            </div>
            <Link
              href="/products"
              className="mt-4 md:mt-0 text-xs text-black uppercase tracking-wider font-semibold underline underline-offset-4 hover:text-[#C5A059]"
            >
              View Complete Collection &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="group flex flex-col bg-white border border-neutral-200/80 hover:border-black transition-all"
              >
                {/* Product Image */}
                <div className="relative aspect-square bg-neutral-50 overflow-hidden">
                  <Link href={`/products/${product.slug}`} className="block w-full h-full">
                    <Image
                      src={product.primaryImage}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>
                  {product.isBestSeller && (
                    <span className="absolute top-3 left-3 bg-black text-white text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 font-medium">
                      Best Seller
                    </span>
                  )}
                  {product.isNewArrival && (
                    <span className="absolute top-3 left-3 bg-[#C5A059] text-white text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 font-medium">
                      New Harvest
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">
                      {product.category.name}
                    </div>
                    <Link
                      href={`/products/${product.slug}`}
                      className="block font-cinzel text-base text-neutral-950 font-normal group-hover:text-[#C5A059] transition-colors"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs text-neutral-500 font-light line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-neutral-400 uppercase tracking-wider">
                        {product.size}
                      </div>
                      <div className="font-cinzel text-sm font-semibold text-neutral-900">
                        {formatINR(product.price)}
                      </div>
                    </div>

                    <QuickAddButton productId={product.id} productName={product.name} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
