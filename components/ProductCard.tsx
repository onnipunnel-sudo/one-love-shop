'use client';
// Daraz-style product card: image, name, price, old price + discount badge, stars.

import Link from 'next/link';
import { Product, money, productSlug } from '@/lib/store';
import { WishlistHeart } from './WishlistHeart';

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
      href={`/product/${productSlug(p.name)}/`}
      className="group flex flex-col overflow-hidden rounded-xl bg-ink-card ring-1 ring-royal/20 transition duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(212,175,55,0.15)] hover:ring-gold/60"
    >
      <div className="relative aspect-square overflow-hidden bg-ink-soft">
        <img
          src={p.image}
          alt={p.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
        {pct && (
          <span className="absolute left-2 top-2 rounded-full bg-gradient-to-r from-gold to-gold-light px-2 py-0.5 text-[11px] font-extrabold text-black shadow">
            -{pct}%
          </span>
        )}
        {p.flashSale && (
          <span className="absolute right-2 top-2 animate-pulse rounded-full bg-royal px-2 py-0.5 text-[11px] font-extrabold text-white shadow">
            ⚡ FLASH
          </span>
        )}
        <div className="absolute bottom-2 right-2 opacity-90 transition group-hover:opacity-100">
          <WishlistHeart productId={p.id} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="line-clamp-2 min-h-[2.5rem] text-sm leading-snug text-neutral-200 transition group-hover:text-gold-light">{p.name}</div>
        <div className="mt-auto pt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-extrabold text-gold">{money(p.price)}</span>
            {p.oldPrice && p.oldPrice > p.price && (
              <span className="text-xs text-neutral-500 line-through">{money(p.oldPrice)}</span>
            )}
          </div>
          <div className="mt-1 flex items-center justify-between">
            <Stars rating={p.rating} />
            <span className={`text-[11px] font-medium ${p.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {p.stock > 0 ? '● In stock' : '● Sold out'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
