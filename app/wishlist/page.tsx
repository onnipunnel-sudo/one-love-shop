'use client';
// Wishlist page: all saved products in one place.

import Link from 'next/link';
import { useMemo } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { loadDb } from '@/lib/store';
import { useWishlist } from '@/lib/wishlist';

export default function WishlistPage() {
  const { ids, remove } = useWishlist();
  const products = useMemo(() => {
    const db = loadDb();
    const map = new Map(db.products.map((p) => [p.id, p]));
    return ids.map((id) => map.get(id)).filter(Boolean);
  }, [ids]);

  return (
    <div className="py-6">
      <h1 className="mb-6 text-2xl font-bold text-gold">❤️ My Wishlist</h1>
      {products.length === 0 ? (
        <div className="py-16 text-center">
          <div className="text-5xl">💔</div>
          <p className="mt-4 text-neutral-400">Your wishlist is empty.</p>
          <p className="mt-1 text-sm text-neutral-500">
            Tap the 🤍 heart on any product to save it here.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-md bg-gradient-to-r from-gold to-royal px-6 py-2.5 font-bold text-black"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-neutral-400">
            {products.length} saved item{products.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {products.map((p) => (
              <div key={p!.id} className="relative">
                <ProductCard p={p!} />
                <button
                  onClick={() => remove(p!.id)}
                  className="absolute right-2 top-10 rounded-full bg-black/60 px-2 py-1 text-xs text-white hover:text-red-400"
                  title="Remove from wishlist"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
