'use client';

// Fallback for product slugs the server doesn't know about.
// Admin-added products live only in this browser's localStorage, so the
// server (which only has seed data) can't render them — this component
// looks the product up client-side instead of showing a 404.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadDb, findBySlug, type Product } from '@/lib/store';
import { ProductDetail } from './ProductDetail';

export function LocalProduct({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [related, setRelated] = useState<Product[]>([]);

  useEffect(() => {
    const db = loadDb(); // in the browser: seed + localStorage admin products
    const found = findBySlug(db.products, slug);
    setProduct(found ?? null);
    if (found) {
      setRelated(
        db.products
          .filter(
            (p) => p.id !== found.id && (p.category === found.category || p.category === 'All')
          )
          .slice(0, 5)
      );
    }
  }, [slug]);

  if (product === undefined) {
    return <div className="py-20 text-center text-sm text-neutral-400">Loading product…</div>;
  }

  if (product === null) {
    return (
      <div className="py-20 text-center">
        <div className="text-5xl">🔍</div>
        <h1 className="mt-4 text-xl font-bold text-neutral-100">Product not found</h1>
        <p className="mt-2 text-sm text-neutral-400">
          This product may have been removed or the link is wrong.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-gold px-6 py-2 text-sm font-bold text-black"
        >
          ← Back to products
        </Link>
      </div>
    );
  }

  return <ProductDetail product={product} related={related} />;
}
