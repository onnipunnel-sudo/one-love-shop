'use client';
// Hero banner carousel — banners are admin-configurable via Admin > Banners.
// CSS-only radio-button technique, no JS timers.

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Banner, loadDb } from '@/lib/store';

const BG_GRADIENTS = [
  'radial-gradient(1200px 500px at 20% 10%, #3a2f10 0%, #2a1650 40%, #141416 70%), linear-gradient(135deg,#1a1a1e,#0d0d0f)',
  'radial-gradient(1000px 500px at 80% 20%, #4c1d95 0%, #3a2f10 40%, #141416 70%), linear-gradient(225deg,#1a1a1e,#0d0d0f)',
  'radial-gradient(1100px 500px at 50% 100%, #2c2408 0%, #3d1a6e 45%, #141416 75%), linear-gradient(180deg,#16161a,#0d0d0f)',
  'radial-gradient(900px 500px at 30% 80%, #6d28d9 0%, #2c2408 50%, #141416 75%), linear-gradient(135deg,#1a1a1e,#0d0d0f)',
  'radial-gradient(1000px 500px at 70% 30%, #3a2f10 0%, #4c1d95 45%, #141416 75%), linear-gradient(225deg,#16161a,#0d0d0f)',
];

const FALLBACK: Banner[] = [
  { id: 'b1', title: 'ONE LOVE Mega Sale', sub: 'Up to 40% off luxury gifts & more', cta: 'Shop Flash Sale', link: '/?flash=1', active: true },
  { id: 'b2', title: 'Gifts That Say It All', sub: 'Golden gift boxes, hampers & keepsakes', cta: 'Explore Gifts', link: '/?cat=Gifts', active: true },
  { id: 'b3', title: 'New Electronics Arrivals', sub: 'Earbuds, speakers & smart gadgets', cta: 'Shop Electronics', link: '/?cat=Electronics', active: true },
];

export function HeroCarousel() {
  const [banners, setBanners] = useState<Banner[]>(FALLBACK);

  useEffect(() => {
    try {
      const db = loadDb();
      const active = (db.banners || []).filter((b) => b.active);
      if (active.length > 0) setBanners(active);
    } catch {
      /* keep fallback */
    }
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl ring-1 ring-royal/30">
      {banners.map((s, i) => (
        <div key={s.id}>
          <input
            type="radio"
            name="hero-slide"
            id={`hero-${i}`}
            defaultChecked={i === 0}
            className="peer hidden"
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 peer-checked:opacity-100"
            style={{ background: BG_GRADIENTS[i % BG_GRADIENTS.length] }}
          >
            <div className="flex h-44 flex-col justify-center px-6 sm:h-60 sm:px-10">
              <div className="font-serif text-2xl text-gold sm:text-4xl">{s.title}</div>
              <div className="mt-2 text-sm text-neutral-300 sm:text-base">{s.sub}</div>
              <Link
                href={s.link || '/'}
                className="pointer-events-auto mt-4 inline-block w-fit rounded-md bg-gradient-to-r from-gold to-royal px-4 py-2 text-sm font-bold text-black"
              >
                {s.cta}
              </Link>
            </div>
          </div>
        </div>
      ))}
      {/* Spacer keeps carousel height (slides are absolute) */}
      <div className="h-44 sm:h-60" />
      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
        {banners.map((s, i) => (
          <label
            key={s.id}
            htmlFor={`hero-${i}`}
            className="h-2.5 w-2.5 cursor-pointer rounded-full bg-white/25 transition hover:bg-gold"
          />
        ))}
      </div>
    </div>
  );
}
