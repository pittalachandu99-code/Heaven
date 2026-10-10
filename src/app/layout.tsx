import type { Metadata } from 'next';
import './globals.css';
import { CartWishlistProvider } from '@/context/CartWishlistContext';
import CartDrawer from '@/components/common/CartDrawer';

export const metadata: Metadata = {
  title: 'HEAVEN | Luxury Perfume Haute Parfumerie',
  description: 'Pure olfactive craftsmanship. Discover artisanal fragrances distilled from rare floral absolutes, ancient barks, and exotic amber.',
  keywords: 'Heaven Perfume, Luxury Fragrance, Jasmine Eau de Parfum, Haute Parfumerie, Artisanal Perfume',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-900 antialiased selection:bg-black selection:text-white">
        <CartWishlistProvider>
          {children}
          <CartDrawer />
        </CartWishlistProvider>
      </body>
    </html>
  );
}
