'use client';
// Homepage: announcement banner, category sidebar + hero carousel,
// Flash Sale (live countdown), "Just For You" product grid.
// Filters via query params: ?q= (search) and ?cat= (category).

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { HeroCarousel } from '@/components/HeroCarousel';
import { Countdown } from '@/components/Countdown';
import { ProductCard } from '@/components/ProductCard';
import { CATEGORIES } from '@/components/Header';
import { loadDb } from '@/lib/store';

function HomeInner() {
  const params = useSearchParams();
  const q = (params.get('q') || '').toLowerCase();
  const cat = params.get('cat') || '';
  // Load once per render — picks up admin edits on navigation.
  const [db] = useState(loadDb);

  const filtered = useMemo(() => {
    return db.products.filter((p) => {
      if (cat && p.category !== cat && p.category !== 'All') return false;
      if (q && !(p.name + ' ' + p.description + ' ' + p.category).toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [db, q, cat]);

  const flash = db.products.filter((p) => p.flashSale);
  const browsing = q || cat;

  return (
    <div className="py-4">
      {/* Announcement banner (editable in admin settings) */}
      {db.settings.announcement && (
        <div className="mb-4 rounded-md bg-gradient-to-r from-gold-dark via-gold to-gold-dark px-4 py-2 text-center text-sm font-semibold text-black">
          {db.settings.announcement}
        </div>
      )}

      {/* Sidebar + hero */}
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <aside className="hidden rounded-xl bg-ink-card p-4 ring-1 ring-royal/20 lg:block">
          <div className="mb-3 text-sm font-bold uppercase tracking-wider text-gold">
            Categories
          </div>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/" className="text-neutral-300 hover:text-gold">
                All Products
              </Link>
            </li>
            {CATEGORIES.map((c) => (
              <li key={c}>
                <Link
                  href={`/?cat=${encodeURIComponent(c)}`}
                  className={`hover:text-gold ${cat === c ? 'text-gold font-semibold' : 'text-neutral-300'}`}
                >
                  {c}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-royal/20 pt-4 text-xs text-neutral-400">
            💬 WhatsApp orders welcome
            <br />
            📞 075-1346314
          </div>
        </aside>
        <HeroCarousel />
      </div>

      {browsing ? (
        /* ── Search / category results ── */
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-bold text-gold">
            {cat ? `${cat}` : `Results for "${params.get('q')}"`}{' '}
            <span className="text-sm font-normal text-neutral-400">({filtered.length} items)</span>
          </h2>
          {filtered.length === 0 ? (
            <p className="text-neutral-400">No products found. Try another search.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {filtered.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* ── Flash Sale ── */}
          {flash.length > 0 && (
            <section className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gold">⚡ Flash Sale</h2>
                <Countdown endISO={db.settings.flashSaleEnd} />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {flash.map((p) => (
                  <ProductCard key={p.id} p={p} />
                ))}
              </div>
            </section>
          )}

          {/* ── Just For You (Daraz signature grid) ── */}
          <section className="mt-8">
            <h2 className="mb-4 text-xl font-bold text-gold">✨ Just For You</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {db.products.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default function Home() {
  // Suspense boundary required for useSearchParams with static export
  return (
    <Suspense fallback={<div className="py-10 text-center text-neutral-600">Loading…</div>}>
      <HomeInner />
    </Suspense>
  );
}
