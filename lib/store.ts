// ─────────────────────────────────────────────────────────────
// ONE LOVE — client-side data layer (browser localStorage, no backend)
// All shop data (products, coupons, payments, orders, settings)
// lives under one localStorage key: "onelove_db_v1".
// ─────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  price: number; // LKR
  oldPrice?: number; // LKR, for discount display
  category: string;
  image: string; // URL or dataURL
  video?: string; // optional product video URL (mp4)
  stock: number;
  description: string;
  featured?: boolean;
  flashSale?: boolean;
  rating: number; // 0..5 decorative
}

export interface Review {
  id: string;
  productId: string;
  name: string;
  rating: number; // 1..5
  text: string;
  date: string; // ISO
  approved: boolean;
}

export interface Banner {
  id: string;
  title: string;
  sub: string;
  cta: string;
  link: string; // where the CTA button goes, e.g. "/?cat=Gifts"
  active: boolean;
}

export interface Coupon {
  code: string;
  kind: 'percent' | 'flat';
  value: number; // % or Rs.
  minOrder: number; // minimum subtotal in Rs.
  expiry: string; // YYYY-MM-DD
  active: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  details: string; // shown at checkout
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  customer: string;
  phone: string;
  whatsapp?: string;
  address: string;
  city?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  giftWrapFee: number;
  giftMessage?: string;
  total: number;
  paymentMethod: string;
  coupon?: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  date: string; // ISO
}

export interface Promo {
  id: string;
  title: string;
  image: string; // URL or dataURL
  video?: string; // optional promo video URL or dataURL
  price: number; // LKR offer price
  oldPrice?: number; // LKR original price
  offer?: string; // short offer label e.g. "Diwali Special -20%"
  description: string;
  date: string; // ISO
}

export interface Settings {
  adminPasswordHash: string;
  announcement: string;
  flashSaleEnd: string; // ISO datetime
  groqApiKey?: string; // for the AI support chat agent (stored in browser only)
  ntfyTopic?: string; // push-notification topic for new-order alerts (via ntfy.sh)
}

export interface Db {
  products: Product[];
  promos: Promo[];
  banners: Banner[];
  reviews: Review[];
  coupons: Coupon[];
  paymentMethods: PaymentMethod[];
  orders: Order[];
  settings: Settings;
}

const DB_KEY = 'onelove_db_v1';
const DEFAULT_PASSWORD = 'onelove2026';

// Simple salted hash ("hashed-ish") — keeps the password out of plain sight
// in localStorage. Not military-grade; this is a storefront demo gate.
export function hashPassword(pw: string): string {
  const s = 'onelove::$' + pw;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x811c9dc5) >>> 0;
  }
  return (h1.toString(16) + h2.toString(16)).padStart(16, '0');
}

const pic = (seed: string) => `https://picsum.photos/seed/${seed}/600/600`;

function seedDb(): Db {
  const products: Product[] = [
    { id: 'p1', name: '"Reasons Why I Love You" Memory Jar', price: 1890, oldPrice: 2490, category: 'Gifts', image: '/products/love-jar.jpg', stock: 25, description: 'A beautiful glass jar filled with handwritten "reasons why I love you" scrolls — the perfect romantic keepsake gift.', featured: true, flashSale: true, rating: 4.8 },
    { id: 'p2', name: 'LED Photo Memory Jar', price: 2490, oldPrice: 3290, category: 'Gifts', image: '/products/memory-jar-led.jpg', stock: 20, description: 'Glowing memory jar with fairy lights, your photo, seashells and sand — a dreamy personalized gift.', featured: true, rating: 4.9 },
    { id: 'p3', name: 'Fairy Light Polaroid Photo Jar', price: 2290, category: 'Gifts', image: '/products/fairy-photo-jar.jpg', stock: 22, description: 'Mason jar wrapped in warm fairy lights with polaroid-style photos and golden glitter — memories that glow.', featured: true, rating: 4.7 },
    { id: 'p4', name: 'Ferrero Rocher & Blue Rose Bouquet', price: 3490, oldPrice: 4490, category: 'Gifts', image: '/products/ferrero-bouquet.jpg', stock: 15, description: 'Luxury bouquet of Ferrero Rocher chocolates nestled in elegant blue satin roses with gold wrapping.', flashSale: true, rating: 4.8 },
    { id: 'p5', name: 'Classic Red Rose Bouquet', price: 2990, oldPrice: 3990, category: 'Gifts', image: '/products/red-rose-bouquet.jpg', stock: 18, description: 'Timeless bouquet of fresh red roses with baby\'s breath in premium white wrapping.', rating: 4.9 },
    { id: 'p6', name: '"Open When You Feel" Message Bottle', price: 1590, category: 'Gifts', image: '/products/message-bottle.jpg', stock: 30, description: 'Glass message bottle with colour-coded notes — open one when angry, happy, tired, sad or needing motivation.', rating: 4.6 },
    { id: 'p7', name: 'Personalized Couple Photo Frame', price: 1990, oldPrice: 2590, category: 'Gifts', image: '/products/couple-frame.jpg', stock: 25, description: 'Elegant framed print with your couple photo and a heartfelt message — a timeless anniversary gift.', rating: 4.7 },
    { id: 'p8', name: "Men's Luxury Gift Hamper", price: 5990, oldPrice: 7990, category: 'Gifts', image: '/products/mens-hamper.jpg', stock: 12, description: 'Premium gift hamper for him — shirt, luxury perfume, watch and grooming essentials in a "For You" keepsake box.', featured: true, flashSale: true, rating: 4.8 },
    { id: 'p9', name: 'Flower & Chocolate Gift Set', price: 2790, category: 'Gifts', image: '/products/flower-choco-set.jpg', stock: 20, description: 'Beautiful white flower bouquet paired with a luxury chocolate and perfume gift bag — double the delight.', rating: 4.6 },
    { id: 'p10', name: 'Mini Message Bottle with Dried Flowers', price: 990, oldPrice: 1290, category: 'Gifts', image: '/products/mini-bottle.jpg', stock: 40, description: 'Adorable mini glass bottle with tiny love scrolls, dried lavender and purple crystals — a sweet little surprise.', rating: 4.5 },
    { id: 'p11', name: 'Stainless Steel Watch — Gold', price: 8990, oldPrice: 11990, category: 'Fashion', image: pic('onelove-watch'), stock: 15, description: 'Elegant gold-tone wristwatch with Japanese movement.', rating: 4.9 },
    { id: 'p12', name: 'Aroma Diffuser with LED', price: 3890, category: 'Home', image: pic('onelove-diffuser'), stock: 26, description: 'Ultrasonic aroma diffuser with 7-colour LED mood light.', rating: 4.4 },
    { id: 'p13', name: "Girls' Floral Summer Dress", price: 2990, oldPrice: 3990, category: 'Girls', image: pic('onelove-dress'), stock: 30, description: 'Pretty floral summer dress for girls — soft cotton, sizes 4-14.', rating: 4.6 },
    { id: 'p14', name: "Girls' Hair Accessories Gift Set", price: 1290, category: 'Girls', image: pic('onelove-hairset'), stock: 55, description: '24-piece hair clips, bands and bows gift set in a golden box.', rating: 4.5 },
    { id: 'p15', name: 'Cute Plush Teddy Bear (60cm)', price: 3490, oldPrice: 4490, category: 'Girls', image: pic('onelove-teddy'), stock: 20, description: 'Super-soft 60cm teddy bear — the perfect cuddly gift.', featured: true, rating: 4.8 },
    { id: 'p16', name: "Boys' Graphic T-Shirt Pack (3 pcs)", price: 2490, oldPrice: 3290, category: 'Boys', image: pic('onelove-tees'), stock: 40, description: 'Pack of 3 cool graphic tees for boys — 100% cotton.', rating: 4.5 },
    { id: 'p17', name: 'Remote Control Racing Car', price: 5990, oldPrice: 7990, category: 'Boys', image: pic('onelove-rccar'), stock: 18, description: 'High-speed RC racing car with 2.4GHz controller, 30-min playtime.', flashSale: true, rating: 4.7 },
    { id: 'p18', name: "Boys' Digital Sports Watch", price: 4490, category: 'Boys', image: pic('onelove-sportwatch'), stock: 25, description: 'Shock-proof digital sports watch with alarm and stopwatch.', rating: 4.4 },
  ];
  return {
    products,
    promos: [
      { id: 'promo1', title: 'Ferrero Rocher & Blue Rose Bouquet — Special Offer', image: '/products/ferrero-bouquet.jpg', price: 3490, oldPrice: 4490, offer: 'Festival Special −22%', description: 'Luxury Ferrero Rocher bouquet in blue satin roses — now at a special festival price. Limited stock!', date: new Date().toISOString() },
      { id: 'promo2', title: 'RC Racing Car — Flash Deal', image: pic('onelove-rccar'), price: 5990, oldPrice: 7990, offer: 'Flash Deal −25%', description: 'High-speed remote control racing car. Grab it before the flash sale ends!', date: new Date().toISOString() },
    ],
    banners: [
      { id: 'b1', title: 'ONE LOVE Mega Sale', sub: 'Up to 40% off luxury gifts & more', cta: 'Shop Flash Sale', link: '/?flash=1', active: true },
      { id: 'b2', title: 'Gifts That Say It All', sub: 'Golden gift boxes, hampers & keepsakes', cta: 'Explore Gifts', link: '/?cat=Gifts', active: true },
      { id: 'b3', title: 'New Electronics Arrivals', sub: 'Earbuds, speakers & smart gadgets', cta: 'Shop Electronics', link: '/?cat=Electronics', active: true },
    ],
    coupons: [
      { code: 'WELCOME10', kind: 'percent', value: 10, minOrder: 0, expiry: '2027-12-31', active: true },
      { code: 'LOVE50', kind: 'flat', value: 50, minOrder: 1000, expiry: '2027-12-31', active: true },
    ],
    reviews: [
      { id: 'r1', productId: 'p1', name: 'Fathima', rating: 5, text: 'My wife loved it! The scrolls are so sweet and the jar looks beautiful on our shelf.', date: new Date(Date.now() - 5 * 86400000).toISOString(), approved: true },
      { id: 'r2', productId: 'p1', name: 'Rizwan', rating: 4, text: 'Nice gift for anniversary. Delivery was quick.', date: new Date(Date.now() - 12 * 86400000).toISOString(), approved: true },
      { id: 'r3', productId: 'p4', name: 'Ayesha', rating: 5, text: 'The bouquet is even more gorgeous in real life. Chocolates were fresh!', date: new Date(Date.now() - 3 * 86400000).toISOString(), approved: true },
    ],
    paymentMethods: [
      { id: 'cod', name: 'Cash on Delivery', details: 'Pay in cash when your order arrives.' },
    ],
    orders: [],
    settings: {
      adminPasswordHash: hashPassword(DEFAULT_PASSWORD),
      announcement: '✨ Free islandwide delivery on orders over Rs. 5,000 ✨',
      // Flash sale ends 48h after first seed
      flashSaleEnd: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      ntfyTopic: 'onelove-orders-x7k2m9q4',
    },
  };
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadDb(): Db {
  if (!isBrowser()) return seedDb(); // SSR/prerender: seed shape only
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    if (raw) {
      const db = JSON.parse(raw) as Db;
      if (db && Array.isArray(db.products)) {
        // migrate older DBs: ensure promos/banners/reviews exist
        if (!Array.isArray((db as Db).promos)) (db as Db).promos = seedDb().promos;
        if (!Array.isArray((db as Db).banners)) (db as Db).banners = seedDb().banners;
        if (!Array.isArray((db as Db).reviews)) (db as Db).reviews = seedDb().reviews;
        db.settings = { ...seedDb().settings, ...db.settings };
        return db;
      }
    }
  } catch {
    /* corrupted -> reseed below */
  }
  const db = seedDb();
  window.localStorage.setItem(DB_KEY, JSON.stringify(db));
  return db;
}

export function saveDb(db: Db): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function resetDb(): Db {
  const db = seedDb();
  saveDb(db);
  return db;
}

/** Re-read the DB from localStorage (picks up admin changes made in another tab). */
export function refreshDb(): Db {
  return loadDb();
}

export const money = (n: number): string => 'Rs. ' + n.toLocaleString('en-LK');

/** URL-friendly slug from product name, e.g. "Golden Rose Gift Box" -> "golden-rose-gift-box" */
export function productSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

/** Find a product by its slug (matches seed products at build time). */
export function findBySlug(products: Product[], slug: string): Product | undefined {
  return products.find((p) => productSlug(p.name) === slug || p.id === slug);
}

export const uid = (p = 'id'): string =>
  p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const SHOP_PHONE = '075-1346314';
export const SHOP_WHATSAPP = '94751346314'; // wa.me needs country code, no +
export const SHOP_CITY = 'Akkaraipattu';
export const SHOP_EMAIL = 'rusaikahamed86@gmail.com';

// Delivery fees (matches Merchant Center shipping policy)
export const DELIVERY_FEE = 350; // Rs. flat islandwide
export const FREE_DELIVERY_MIN = 5000; // free delivery above this subtotal
export const deliveryFeeFor = (subtotal: number): number =>
  subtotal >= FREE_DELIVERY_MIN ? 0 : DELIVERY_FEE;
