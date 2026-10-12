'use client';
// Product detail page (route: /product?id=<id> — query param keeps static export happy).

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { useCart } from '@/lib/cart';
import { ProductCard, Stars, discountPct } from '@/components/ProductCard';
import { loadDb, money } from '@/lib/store';
import { useMediaUrl } from '@/lib/useMediaUrl';

function DetailInner() {
  const params = useSearchParams();
  const id = params.get('id') || '';
  const [db] = useState(loadDb);
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const product = useMemo(() => db.products.find((p) => p.id === id), [db, id]);
  const related = useMemo(
    () =>
      product
        ? db.products.filter((p) => p.id !== product.id && (p.category === product.category || p.category === 'All')).slice(0, 5)
        : [],
    [db, product],
  );

  const videoUrl = useMediaUrl(product?.video);

  if (!product) {
    return (
      <div className="py-16 text-center">
        <div className="text-xl text-neutral-700">Product not found.</div>
        <Link href="/" className="mt-4 inline-block text-gold underline">
          Back to home
        </Link>
      </div>
    );
  }

  const pct = discountPct(product);
  const doAdd = () => {
    add(product.id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="py-6">
      <Link href="/" className="text-sm text-neutral-600 hover:text-gold">
        ← Back to products
      </Link>

      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-xl bg-white ring-1 ring-neutral-200">
          {videoUrl ? (
            <video
              src={videoUrl}
              poster={product.image}
              controls
              playsInline
              className="aspect-square w-full object-cover"
            />
          ) : (
            <img src={product.image} alt={product.name} className="aspect-square w-full object-cover" />
          )}
          {pct && (
            <span className="absolute left-3 top-3 rounded bg-gold px-2 py-1 text-sm font-bold text-black">
              -{pct}%
            </span>
          )}
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-neutral-500">{product.category}</div>
          <h1 className="mt-1 text-2xl font-bold text-neutral-900">{product.name}</h1>
          <div className="mt-2">
            <Stars rating={product.rating} />{' '}
            <span className="text-xs text-neutral-500">{product.rating.toFixed(1)} / 5</span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gold">{money(product.price)}</span>
            {product.oldPrice && product.oldPrice > product.price && (
              <span className="text-lg text-neutral-500 line-through">{money(product.oldPrice)}</span>
            )}
          </div>

          <div className="mt-2 text-sm">
            {product.stock > 0 ? (
              <span className="text-green-400">● In stock ({product.stock} available)</span>
            ) : (
              <span className="text-red-400">● Sold out</span>
            )}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <span className="text-sm text-neutral-600">Qty</span>
            <div className="flex items-center rounded-md ring-1 ring-neutral-200">
              <button
                onClick={() => setQty((v) => Math.max(1, v - 1))}
                className="px-3 py-2 text-lg hover:text-gold"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-10 text-center tabular-nums">{qty}</span>
              <button
                onClick={() => setQty((v) => Math.min(product.stock || 99, v + 1))}
                className="px-3 py-2 text-lg hover:text-gold"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={doAdd}
              disabled={product.stock <= 0}
              className="flex-1 rounded-md border border-gold px-6 py-3 font-semibold text-gold hover:bg-gold/10 disabled:opacity-40"
            >
              {added ? '✓ Added to cart' : 'Add to Cart'}
            </button>
            <Link
              href="/checkout"
              onClick={doAdd}
              className={`flex-1 rounded-md bg-gold px-6 py-3 text-center font-bold text-black hover:bg-gold-dark ${
                product.stock <= 0 ? 'pointer-events-none opacity-40' : ''
              }`}
            >
              Buy Now
            </Link>
          </div>

          <div className="mt-8 border-t border-neutral-200 pt-4">
            <div className="mb-2 text-sm font-bold uppercase tracking-wider text-gold">
              Description
            </div>
            <p className="text-sm leading-relaxed text-neutral-700">{product.description}</p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold text-gold">Related Products</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {related.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function ProductPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-neutral-600">Loading…</div>}>
      <DetailInner />
    </Suspense>
  );
}
