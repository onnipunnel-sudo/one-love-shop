'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Db, Promo, loadDb, money } from '@/lib/store';
import { useMediaUrl } from '@/lib/useMediaUrl';

function PromoCard({ p }: { p: Promo }) {
  const videoUrl = useMediaUrl(p.video);
  const pct = p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const hasMedia = !!videoUrl || !!p.image;
  return (
    <article className="overflow-hidden rounded-xl bg-white ring-1 ring-neutral-200">
      {hasMedia && (
        <div className="relative">
          {videoUrl ? (
            <video src={videoUrl} poster={p.image || undefined} controls playsInline className="aspect-[4/3] w-full object-cover" />
          ) : (
            <img src={p.image} alt={p.title || 'Promo'} className="aspect-[4/3] w-full object-cover" />
          )}
          {p.offer && (
            <span className="absolute left-3 top-3 rounded bg-gold px-2 py-1 text-xs font-bold text-black">
              {p.offer}
            </span>
          )}
        </div>
      )}
      <div className="p-4">
        {p.title ? <h2 className="font-bold text-neutral-900">{p.title}</h2> : null}
        {p.price > 0 && (
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold text-gold">{money(p.price)}</span>
            {p.oldPrice ? (
              <span className="text-sm text-neutral-500 line-through">{money(p.oldPrice)}</span>
            ) : null}
            {pct > 0 && <span className="text-xs font-bold text-red-500">−{pct}%</span>}
          </div>
        )}
        {p.description && <p className="mt-2 text-sm text-neutral-600">{p.description}</p>}
        <div className="mt-3 text-xs text-neutral-400">
          Posted {new Date(p.date).toLocaleDateString('en-LK')}
        </div>
      </div>
    </article>
  );
}

export default function PromoPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  useEffect(() => {
    const db: Db = loadDb();
    setPromos([...(db.promos || [])].sort((a, b) => b.date.localeCompare(a.date)));
  }, []);

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold text-neutral-900">
        🎁 Promos <span className="text-sm font-normal text-neutral-500">— special offers from ONE LOVE</span>
      </h1>
      {promos.length === 0 && (
        <p className="mt-8 text-center text-neutral-500">No promos right now — check back soon!</p>
      )}
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {promos.map((p) => (
          <PromoCard key={p.id} p={p} />
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link href="/" className="text-sm font-medium text-gold hover:underline">
          ← Back to shop
        </Link>
      </div>
    </div>
  );
}
