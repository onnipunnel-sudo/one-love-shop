import type { MetadataRoute } from 'next';
import { loadDb, productSlug } from '@/lib/store';

const SITE_URL = 'https://one-love-shop.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const db = loadDb(); // seed products (server-side at build)

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/cart/`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/checkout/`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/promo/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ];

  const productPages: MetadataRoute.Sitemap = db.products.map((p) => ({
    url: `${SITE_URL}/product/${productSlug(p.name)}/`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...productPages];
}
