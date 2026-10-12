'use client';
// Daraz-style product card: image, name, price, old price + discount badge, stars.

import Link from 'next/link';
import { Product, money } from '@/lib/store';

export function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="text-xs text-gold" aria-label={`${rating} stars`}>
      {'★'.repeat(full)}
      <span className="text-neutral-600">{'★'.repeat(5 - full)}</span>
    </span>
  );
}

export function discountPct(p: Product): number | null {
  if (p.oldPrice && p.oldPrice > p.price) return Math.round((1 - p.price / p.oldPrice) * 100);
  return null;
}

export function ProductCard({ p }: { p: Product }) {
  const pct = discountPct(p);
  return (
    <Link
      href={`/product?id=${p.id}`}
      className="group flex flex-col overflow-hidden rounded-lg bg-white ring-1 ring-neutral-200 transition hover:ring-gold/60"
    >
      <div className="relative aspect-square overflow-hidden bg-neutral-100">
        <img
          src={p.image}
          alt={p.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        {pct && (
          <span className="absolute left-2 top-2 rounded bg-gold px-1.5 py-0.5 text-[11px] font-bold text-black">
            -{pct}%
          </span>
        )}
        {p.flashSale && (
          <span className="absolute right-2 top-2 rounded bg-red-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
            FLASH
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="line-clamp-2 text-sm text-neutral-800">{p.name}</div>
        <div className="mt-auto">
          <div className="text-base font-bold text-gold">{money(p.price)}</div>
          {p.oldPrice && p.oldPrice > p.price && (
            <div className="text-xs text-neutral-500 line-through">{money(p.oldPrice)}</div>
          )}
          <div className="mt-1 flex items-center justify-between">
            <Stars rating={p.rating} />
            <span className="text-[11px] text-neutral-500">
              {p.stock > 0 ? `In stock` : 'Sold out'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
