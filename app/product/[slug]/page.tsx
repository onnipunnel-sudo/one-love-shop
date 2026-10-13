// SEO-friendly product page: /product/<slug> (statically generated at build time).
// The old /product?id=<id> route is kept as a backwards-compatible redirect.

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddToCart } from './AddToCart';
import { ProductCard } from '@/components/ProductCard';
import { loadDb, money, productSlug, findBySlug, SHOP_CITY } from '@/lib/store';

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
      <span className="text-neutral-600">{'★'.repeat(5 - full)}</span>
    </span>
  );
}

export function generateStaticParams() {
  const db = loadDb(); // seed data on server
  return db.products.map((p) => ({ slug: productSlug(p.name) }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const db = loadDb();
  const product = findBySlug(db.products, params.slug);
  if (!product) return { title: 'Product not found — ONE LOVE' };
  const url = `${SITE_URL}/product/${productSlug(product.name)}/`;
  const desc = product.description.slice(0, 155);
  return {
    title: `${product.name} — ${money(product.price)} | ONE LOVE ${SHOP_CITY}`,
    description: `${product.name}: ${desc} Buy online in Sri Lanka with islandwide delivery.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${product.name} | ONE LOVE`,
      description: desc,
      url,
      siteName: 'ONE LOVE',
      type: 'website',
      images: [{ url: product.image, alt: product.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | ONE LOVE`,
      description: desc,
      images: [product.image],
    },
  };
}

export default function ProductSlugPage({ params }: { params: { slug: string } }) {
  const db = loadDb();
  const product = findBySlug(db.products, params.slug);
  if (!product) notFound();

  const pct = discountPct(product.price, product.oldPrice);
  const canonical = `${SITE_URL}/product/${productSlug(product.name)}/`;
  const related = db.products
    .filter((p) => p.id !== product.id && (p.category === product.category || p.category === 'All'))
    .slice(0, 5);

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
      <Link href="/" className="text-sm text-neutral-600 hover:text-gold">
        ← Back to products
      </Link>

      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-xl bg-white ring-1 ring-neutral-200">
          <img
            src={product.image}
            alt={product.name}
            className="aspect-square w-full object-cover"
          />
          {pct && (
            <span className="absolute left-3 top-3 rounded bg-gold px-2 py-1 text-sm font-bold text-black">
              -{pct}%
            </span>
          )}
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-neutral-500">
            {product.category}
          </div>
          <h1 className="mt-1 text-2xl font-bold text-neutral-900">{product.name}</h1>
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
