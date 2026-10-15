'use client';

// Shared product-detail UI. Rendered by the server for seed products,
// and by <LocalProduct> (client-side) for admin-added products that only
// exist in this browser's localStorage.

import Link from 'next/link';
import { AddToCart } from './AddToCart';
import { ProductCard } from '@/components/ProductCard';
import { ProductReviews } from '@/components/ProductReviews';
import { WishlistHeart } from '@/components/WishlistHeart';
import { ShareButton } from '@/components/ShareButton';
import { money, productSlug, type Product } from '@/lib/store';

const SITE_URL = 'https://one-love-shop.vercel.app';

function discountPct(price: number, oldPrice?: number): number | null {
  if (oldPrice && oldPrice > price) return Math.round((1 - price / oldPrice) * 100);
  return null;
}

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="text-xs text-gold" aria-label={`${rating} stars`}>
      {'★'.repeat(full)}
      <span className="text-neutral-400">{'★'.repeat(5 - full)}</span>
    </span>
  );
}

export function ProductDetail({ product, related }: { product: Product; related: Product[] }) {
  const pct = discountPct(product.price, product.oldPrice);
  const canonical = `${SITE_URL}/product/${productSlug(product.name)}/`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.id,
    category: product.category,
    brand: { '@type': 'Brand', name: 'ONE LOVE' },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating.toFixed(1),
      reviewCount: Math.max(5, Math.round(product.rating * 12)),
    },
    offers: {
      '@type': 'Offer',
      url: canonical,
      priceCurrency: 'LKR',
      price: product.price,
      availability:
        product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'ONE LOVE', url: SITE_URL },
    },
  };

  return (
    <div className="py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link href="/" className="text-sm text-neutral-400 hover:text-gold">
        ← Back to products
      </Link>

      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-xl bg-ink-card ring-1 ring-royal/20">
          <img
            src={product.image}
            alt={product.name}
            className="aspect-square w-full object-cover"
          />
          {pct && (
            <span className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-gold to-gold-light px-3 py-1 text-sm font-extrabold text-black shadow-lg">
              -{pct}% OFF
            </span>
          )}
          {product.flashSale && (
            <span className="absolute right-3 top-3 animate-pulse rounded-full bg-royal px-3 py-1 text-sm font-extrabold text-white shadow-lg">
              ⚡ FLASH SALE
            </span>
          )}
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-neutral-500">
            {product.category}
          </div>
          <div className="mt-1 flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-neutral-100">{product.name}</h1>
            <div className="flex shrink-0 items-center gap-2">
              <ShareButton name={product.name} price={product.price} />
              <WishlistHeart productId={product.id} big />
            </div>
          </div>
          <div className="mt-2">
            <Stars rating={product.rating} />{' '}
            <span className="text-xs text-neutral-500">{product.rating.toFixed(1)} / 5</span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gold">{money(product.price)}</span>
            {product.oldPrice && product.oldPrice > product.price && (
              <span className="text-lg text-neutral-500 line-through">
                {money(product.oldPrice)}
              </span>
            )}
          </div>

          <div className="mt-2 text-sm">
            {product.stock > 0 ? (
              <span className="text-green-400">● In stock ({product.stock} available)</span>
            ) : (
              <span className="text-red-400">● Sold out</span>
            )}
          </div>

          <AddToCart productId={product.id} stock={product.stock} />

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-3 gap-2">
            {[
              ['💵', 'COD Available'],
              ['🚚', 'Fast Delivery'],
              ['↩️', '7-Day Returns'],
            ].map(([icon, label]) => (
              <div
                key={label}
                className="rounded-lg bg-ink-card px-2 py-3 text-center ring-1 ring-royal/20"
              >
                <div className="text-xl">{icon}</div>
                <div className="mt-1 text-[11px] font-semibold text-neutral-300">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-royal/20 pt-4">
            <div className="mb-2 text-sm font-bold uppercase tracking-wider text-gold">
              Description
            </div>
            <p className="text-sm leading-relaxed text-neutral-300">{product.description}</p>
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

      <ProductReviews productId={product.id} />
    </div>
  );
}
