import React from 'react';
import Link from 'next/link';
import { Shield, Sparkles, Truck, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200 mt-24 text-neutral-800">
      {/* Brand Attributes Row */}
      <div className="border-b border-neutral-100 py-12 bg-neutral-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="w-10 h-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-black mb-1">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
            </div>
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-black">Dawn-Harvested Purity</h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Grandiflorum jasmine and Centifolia rose harvested exclusively at first morning dew.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="w-10 h-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-black mb-1">
              <Shield className="w-4 h-4 text-[#C5A059]" />
            </div>
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-black">Artisanal Numbered Flacons</h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Heavy crystal glass flacons crowned with precision chrome collars and signed certificates.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="w-10 h-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-black mb-1">
              <Truck className="w-4 h-4 text-[#C5A059]" />
            </div>
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-black">White-Glove Courier</h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Climate-controlled luxury courier dispatch ensuring olfactory notes remain uncompromised.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="w-10 h-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-black mb-1">
              <Lock className="w-4 h-4 text-[#C5A059]" />
            </div>
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-black">Guaranteed Authenticity</h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Direct maison dispatch. Every bottle carries an individual batch seal and authenticity card.
            </p>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <span className="heaven-wordmark text-2xl tracking-[0.35em] text-black">
              HEAVEN
            </span>
            <p className="text-xs text-neutral-500 max-w-sm leading-relaxed">
              HEAVEN Haute Parfumerie is an ode to the world&apos;s rarest botanical essences and sacred balsamic resins. Formulated in Grasse, celebrated globally.
            </p>
            <div className="pt-2 text-[11px] text-neutral-400">
              Concierge: concierge@heavenperfume.com | +91 (0) 800-HEAVEN-0
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-3">
            <h5 className="text-xs uppercase tracking-[0.2em] font-semibold text-black">Olfactive Worlds</h5>
            <ul className="space-y-2 text-xs text-neutral-600">
              <li><Link href="/#products" className="hover:text-black transition-colors">Floral Absolutes</Link></li>
              <li><Link href="/#products" className="hover:text-black transition-colors">Woody &amp; Sacred Barks</Link></li>
              <li><Link href="/#products" className="hover:text-black transition-colors">Royal Amber &amp; Oud</Link></li>
              <li><Link href="/#products" className="hover:text-black transition-colors">Fresh &amp; Oceanic Silks</Link></li>
              <li><Link href="/#products" className="hover:text-black transition-colors">Gourmand Warm Spices</Link></li>
            </ul>
          </div>

          {/* Maison & Salons */}
          <div className="space-y-3">
            <h5 className="text-xs uppercase tracking-[0.2em] font-semibold text-black">Maison Flagships</h5>
            <ul className="space-y-2 text-xs text-neutral-500">
              <li>Place Vendôme, Paris</li>
              <li>Mayfair, London</li>
              <li>Chanakyapuri, New Delhi</li>
              <li>Downtown Opera, Dubai</li>
            </ul>
          </div>

          {/* Portal Access */}
          <div className="space-y-3">
            <h5 className="text-xs uppercase tracking-[0.2em] font-semibold text-black">Portals</h5>
            <ul className="space-y-2 text-xs text-neutral-600">
              <li><Link href="/login" className="hover:text-black transition-colors">Customer Lounge</Link></li>
              <li><Link href="/delivery/login" className="hover:text-black transition-colors">Courier Partner Access</Link></li>
              <li><Link href="/admin/login" className="hover:text-black transition-colors">Admin Console</Link></li>
              <li><Link href="/intro" className="text-[#C5A059] hover:underline transition-colors">Replay 4K Intro</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-400 space-y-4 sm:space-y-0">
          <div>
            &copy; {new Date().getFullYear()} HEAVEN Haute Parfumerie. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <span>Discretion Policy</span>
            <span>Terms of Acquisition</span>
            <span>Delivery Protocol</span>
            <span>Authenticity Guarantee</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
