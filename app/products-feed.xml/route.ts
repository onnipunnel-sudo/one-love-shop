import { loadDb, productSlug, money } from '@/lib/store';

const SITE_URL = 'https://one-love.vercel.app';

// Google Merchant Center product feed (RSS 2.0 + Google namespace).
// Kayer: upload this URL in Merchant Center > Products > Feeds:
//   https://one-love.vercel.app/products-feed.xml
export async function GET() {
  const db = loadDb();
  const items = db.products
    .map((p) => {
      const url = `${SITE_URL}/product/${productSlug(p.name)}/`;
      const availability = p.stock > 0 ? 'in_stock' : 'out_of_stock';
      // Google semantics: <g:price> = regular price, <g:sale_price> = discounted price (must be lower).
      const hasDiscount = p.oldPrice != null && p.oldPrice > p.price;
      const regularPrice = hasDiscount ? p.oldPrice : p.price;
      const imageUrl = p.image.startsWith('http') ? p.image : `${SITE_URL}${p.image}`;
      return `    <item>
      <g:id>${p.id}</g:id>
      <g:title><![CDATA[${p.name}]]></g:title>
      <g:description><![CDATA[${p.description}]]></g:description>
      <g:link>${url}</g:link>
      <g:image_link>${imageUrl}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${regularPrice} LKR</g:price>
      ${hasDiscount ? `<g:sale_price>${p.price} LKR</g:sale_price>` : ''}
      <g:brand>ONE LOVE</g:brand>
      <g:product_type><![CDATA[${p.category}]]></g:product_type>
      <g:google_product_category>Gift &amp; Lifestyle</g:google_product_category>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>ONE LOVE — Product Feed</title>
    <link>${SITE_URL}/</link>
    <description>ONE LOVE Sri Lanka product feed for Google Merchant Center.</description>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
