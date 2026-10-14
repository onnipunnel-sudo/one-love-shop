import type { MetadataRoute } from 'next';

const SITE_URL = 'https://one-love-shop.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Explicit allow for Google's crawlers (Merchant Center diagnostics
      // flagged product pages as blocked for these user-agents).
      { userAgent: 'Googlebot', allow: '/' },
      { userAgent: 'Googlebot-Image', allow: '/' },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/checkout/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
