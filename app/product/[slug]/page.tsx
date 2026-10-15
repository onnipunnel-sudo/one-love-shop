// SEO-friendly product page: /product/<slug> (statically generated at build time
// for seed products). Products added via admin live only in the browser's
// localStorage, so unknown slugs fall back to a client-side render instead
// of a 404. The old /product?id=<id> route is kept as a backwards-compatible
// redirect.

import type { Metadata } from 'next';
import { loadDb, money, productSlug, findBySlug, SHOP_CITY } from '@/lib/store';
import { ProductDetail } from './ProductDetail';
import { LocalProduct } from './LocalProduct';

const SITE_URL = 'https://one-love-shop.vercel.app';

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

  if (!product) {
    // Not a seed product — it may have been added via admin on this device.
    // Render client-side from the browser's localStorage instead of 404ing.
    return <LocalProduct slug={params.slug} />;
  }

  const related = db.products
    .filter((p) => p.id !== product.id && (p.category === product.category || p.category === 'All'))
    .slice(0, 5);

  return <ProductDetail product={product} related={related} />;
}
