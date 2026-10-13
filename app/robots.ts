import type { MetadataRoute } from 'next';

const SITE_URL = 'https://one-love-shop.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/checkout/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
