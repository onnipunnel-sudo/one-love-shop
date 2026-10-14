'use client';
// Site header: top utility strip, logo + search + cart, category nav.
// NOTE: there is intentionally NO link to /admin anywhere public.

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCart } from '@/lib/cart';
import { useWishlist } from '@/lib/wishlist';
import { SHOP_PHONE } from '@/lib/store';

export const CATEGORIES = ['Girls', 'Boys', 'Gifts', 'Electronics', 'Fashion', 'Home'];

function WishlistBadge() {
  const { count } = useWishlist();
  if (count === 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-black">
      {count}
    </span>
  );
}

export function Header() {
  const { count } = useCart();
  const router = useRouter();
  const [q, setQ] = useState('');

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : '/');
  };

  return (
    <header className="sticky top-0 z-40">
      {/* Top utility strip (decorative links) */}
      <div className="bg-ink-soft text-[11px] text-neutral-400">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5">
          <span className="text-gold">🚚 Free delivery on orders over Rs. 5,000</span>
          <div className="flex gap-4">
            <span className="cursor-pointer hover:text-gold">Help</span>
            <span className="cursor-pointer hover:text-gold">Track Order</span>
            <span className="hidden sm:inline">Hotline: {SHOP_PHONE}</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="border-b border-royal/30 bg-ink">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <img src="/logo.png" alt="ONE LOVE" className="h-11 w-11 rounded-full ring-2 ring-gold" />
            <span className="hidden font-serif text-2xl tracking-wide text-gold sm:block">ONE LOVE</span>
          </Link>

          <form onSubmit={search} className="flex flex-1">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products, brands and more…"
              className="h-10 w-full rounded-l-md bg-ink-card px-4 text-sm text-neutral-100 outline-none ring-royal/40 placeholder:text-neutral-500 focus:ring-2"
            />
            <button
              type="submit"
              className="h-10 shrink-0 rounded-r-md bg-gradient-to-r from-gold to-royal px-4 text-sm font-bold text-black hover:opacity-90"
            >
              🔍
            </button>
          </form>

          <Link href="/wishlist" className="relative shrink-0 p-2 text-2xl" aria-label="Wishlist">
            🤍
            <WishlistBadge />
          </Link>
          <Link href="/cart" className="relative shrink-0 p-2 text-2xl" aria-label="Cart">
            🛒
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-royal px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        </div>

        {/* Category nav */}
        <nav className="border-t border-royal/20">
          <div className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-4 py-2 text-sm">
            <Link href="/" className="whitespace-nowrap text-neutral-300 hover:text-gold">
              All Products
            </Link>
            {CATEGORIES.map((c) => (
              <Link
                key={c}
                href={`/?cat=${encodeURIComponent(c)}`}
                className="whitespace-nowrap text-neutral-300 hover:text-gold"
              >
                {c}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
