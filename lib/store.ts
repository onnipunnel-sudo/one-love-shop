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
  stock: number;
  description: string;
  featured?: boolean;
  flashSale?: boolean;
  rating: number; // 0..5 decorative
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
  address: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  coupon?: string;
  status: 'pending' | 'completed';
  date: string; // ISO
}

export interface Settings {
  adminPasswordHash: string;
  announcement: string;
  flashSaleEnd: string; // ISO datetime
}

export interface Db {
  products: Product[];
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
    { id: 'p1', name: 'Golden Rose Gift Box', price: 2490, oldPrice: 3490, category: 'Gifts', image: pic('onelove-rose'), stock: 25, description: 'Luxury preserved rose in a golden gift box with ribbon — the signature ONE LOVE gift.', featured: true, flashSale: true, rating: 4.8 },
    { id: 'p2', name: 'Bluetooth Wireless Earbuds Pro', price: 4990, oldPrice: 6990, category: 'Electronics', image: pic('onelove-buds'), stock: 40, description: 'Noise-cancelling wireless earbuds with 36h battery and fast charging.', flashSale: true, rating: 4.6 },
    { id: 'p3', name: "Men's Classic Leather Wallet", price: 1890, oldPrice: 2490, category: 'Fashion', image: pic('onelove-wallet'), stock: 60, description: 'Genuine leather bifold wallet with RFID protection.', rating: 4.5 },
    { id: 'p4', name: 'Scented Candle Gift Set (3 pcs)', price: 1590, category: 'Home', image: pic('onelove-candle'), stock: 35, description: 'Set of 3 hand-poured scented candles — vanilla, oud and jasmine.', featured: true, rating: 4.7 },
    { id: 'p5', name: 'Smart LED Table Lamp', price: 3290, oldPrice: 4290, category: 'Electronics', image: pic('onelove-lamp'), stock: 30, description: 'Touch-control LED lamp with 16M colours and app control.', flashSale: true, rating: 4.4 },
    { id: 'p6', name: 'Couple Mug Set — King & Queen', price: 1290, category: 'Gifts', image: pic('onelove-mugs'), stock: 50, description: 'Ceramic couple mug set in a gold-trimmed gift box.', rating: 4.6 },
    { id: 'p7', name: "Women's Silk Scarf", price: 2190, oldPrice: 2990, category: 'Fashion', image: pic('onelove-scarf'), stock: 45, description: 'Premium silk scarf with elegant golden pattern.', rating: 4.5 },
    { id: 'p8', name: 'Wall Photo Frame Collage (12 pcs)', price: 2790, category: 'Home', image: pic('onelove-frames'), stock: 28, description: '12-piece black & gold photo frame set for your memory wall.', rating: 4.3 },
    { id: 'p9', name: 'Portable Bluetooth Speaker', price: 5990, oldPrice: 7990, category: 'Electronics', image: pic('onelove-speaker'), stock: 22, description: '360° surround sound speaker, waterproof, 24h playtime.', rating: 4.7 },
    { id: 'p10', name: 'Chocolate Celebration Hamper', price: 3490, category: 'Gifts', image: pic('onelove-choco'), stock: 33, description: 'Assorted premium chocolates in a golden celebration hamper.', featured: true, rating: 4.8 },
    { id: 'p11', name: 'Stainless Steel Watch — Gold', price: 8990, oldPrice: 11990, category: 'Fashion', image: pic('onelove-watch'), stock: 15, description: 'Elegant gold-tone wristwatch with Japanese movement.', rating: 4.9 },
    { id: 'p12', name: 'Aroma Diffuser with LED', price: 3890, category: 'Home', image: pic('onelove-diffuser'), stock: 26, description: 'Ultrasonic aroma diffuser with 7-colour LED mood light.', rating: 4.4 },
  ];
  return {
    products,
    coupons: [
      { code: 'WELCOME10', kind: 'percent', value: 10, minOrder: 0, expiry: '2027-12-31', active: true },
      { code: 'LOVE50', kind: 'flat', value: 50, minOrder: 1000, expiry: '2027-12-31', active: true },
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
      if (db && Array.isArray(db.products)) return db;
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

export const uid = (p = 'id'): string =>
  p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const SHOP_PHONE = '075-1346314';
export const SHOP_WHATSAPP = '94751346314'; // wa.me needs country code, no +
export const SHOP_CITY = 'Akkaraipattu';
export const SHOP_EMAIL = 'rusaikahamed86@gmail.com';
