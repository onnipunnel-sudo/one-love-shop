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
  deletedProductIds?: string[]; // seed product ids the admin deleted on purpose (never re-merge)
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
{ id: 'p19', name: "Chocolate Truffle Birthday Cake", price: 3490, category: 'Cakes', image: '/products/wa-01.jpg', stock: 20, description: 'Rich chocolate truffle birthday cake with piped chocolate border, pearls and nut crunch. A decadent centrepiece for any birthday celebration.', rating: 4.6 },
    { id: 'p20', name: "Pink Daisy Birthday Cake", price: 3490, category: 'Cakes', image: '/products/wa-02.jpg', stock: 20, description: 'Pretty pink birthday cake decorated with daisies and pearl details. Sweet, soft and perfect for her special day.', rating: 4.7 },
    { id: 'p21', name: "Strawberry Cream Birthday Cake", price: 3790, category: 'Cakes', image: '/products/wa-03.jpg', stock: 20, description: 'Elegant white cream cake topped with fresh strawberries, baby\'s breath and pink ribbon bows. Fresh, romantic and delicious.', rating: 4.8 },
    { id: 'p22', name: "Pleated Floral Birthday Cake", price: 3990, category: 'Cakes', image: '/products/wa-04.jpg', stock: 20, description: 'Stunning white pleated designer cake adorned with red baby\'s breath flowers. A premium statement cake for unforgettable birthdays.', rating: 4.9 },
    { id: 'p23', name: "Black and White Ribbon Birthday Cake", price: 3490, category: 'Cakes', image: '/products/wa-05.jpg', stock: 20, description: 'Chic black and white birthday cake with satin ribbon bows and heart sprinkles. Classy design for a stylish celebration.', rating: 4.5 },
    { id: 'p24', name: "Pink Bow Birthday Cake", price: 3290, category: 'Cakes', image: '/products/wa-06.jpg', stock: 20, description: 'Adorable pink birthday cake with fondant bows, pearls and a gold candle topper. The cutest cake for her birthday.', rating: 4.6 },
    { id: 'p25', name: "Lucky Cat Preserved Flower Box", price: 5990, category: 'Gifts', image: '/products/wa-07.jpg', stock: 20, description: 'Adorable lucky cat figurine nestled in pink preserved roses and dried flowers inside a clear acrylic gift box with ribbon. Fully customizable to your needs.', rating: 4.7 },
    { id: 'p26', name: "Money Flower Box - Birthday Square", price: 7990, category: 'Gifts', image: '/products/wa-08.jpg', stock: 20, description: 'Creative money cake made of rolled banknotes topped with a pink rose, presented in a clear square gift box with Happy Birthday topper. The gift that always impresses.', rating: 4.8 },
    { id: 'p27', name: "Money Flower Box - Pink Rose Round", price: 7990, category: 'Gifts', image: '/products/wa-09.jpg', stock: 20, description: 'Rolled banknote money cake crowned with pink and white roses in an elegant round clear box with satin ribbon. Luxury gifting, customized to your budget.', rating: 4.9 },
    { id: 'p28', name: "Money Flower Box - Sunshine Round", price: 7990, category: 'Gifts', image: '/products/wa-10.jpg', stock: 20, description: 'Cheerful money cake of rolled banknotes with yellow gerberas and daisies in a round gift box. A bright, unforgettable surprise gift.', rating: 4.5 },
    { id: 'p29', name: "Customized Family Photo Frame", price: 1990, category: 'Gifts', image: '/products/wa-11.jpg', stock: 20, description: 'Your favourite family photo printed and framed in a premium black and gold frame. A heartfelt keepsake for the home.', rating: 4.6 },
    { id: 'p30', name: "Personalized Portrait Photo Frame", price: 1790, category: 'Gifts', image: '/products/wa-12.jpg', stock: 20, description: 'Custom portrait photo printing in an elegant black frame. Send us your photo and we turn it into a timeless framed memory.', rating: 4.7 },
    { id: 'p31', name: "Blue Rose Bouquet and Mens Perfume Set", price: 6990, category: 'Gifts', image: '/products/wa-13.jpg', stock: 20, description: 'Dreamy blue satin rose bouquet paired with premium men\'s perfumes in ribbon-tied gift boxes. The ultimate luxury gift for him.', rating: 4.8 },
    { id: 'p32', name: "Personalized Mens Gift Box", price: 5990, category: 'Gifts', image: '/products/wa-14.jpg', stock: 20, description: 'Customized gift box for him with a premium shirt, wallet and artificial roses, plus a personalized photo message on the lid. Made to order with your words.', rating: 4.9 },
    { id: 'p33', name: "Mens Luxury Gift Set", price: 8990, category: 'Gifts', image: '/products/wa-15.jpg', stock: 20, description: 'Premium purple gift box with Jaguar Classic perfume, a silver wristwatch and a steel chain bracelet. The complete luxury set for him.', rating: 4.5 },
    { id: 'p34', name: "Mens Classic Gift Box", price: 6990, category: 'Gifts', image: '/products/wa-16.jpg', stock: 20, description: 'Stylish black gift box with a leather wallet and chronograph wristwatch, decorated with red dried flowers and a greeting card. A classy gift for him.', rating: 4.6 },
    { id: 'p35', name: "Mens Accessories Gift Box", price: 7490, category: 'Gifts', image: '/products/wa-17.jpg', stock: 20, description: 'All-in-one accessories box for him: wallet, wristwatch, sunglasses and beaded bracelet with a sweet message card. Everything he needs in one box.', rating: 4.7 },
    { id: 'p36', name: "Single Rose Bouquet with Babys Breath", price: 1350, category: 'Gifts', image: '/products/wa-18.jpg', stock: 20, description: 'One perfect rose with delicate baby\'s breath, elegantly wrapped. Available in red, pink, white and cream. Simple, sweet and budget friendly.', rating: 4.8 },
    { id: 'p37', name: "Red Rose Valentines Bouquet", price: 2990, category: 'Gifts', image: '/products/wa-19.jpg', stock: 20, description: 'Five fresh red roses with baby\'s breath and eucalyptus in white wrap with a Happy Valentine\'s Day tag. The classic romantic gesture.', rating: 4.9 },
    { id: 'p38', name: "Luxury Red Rose Bouquet", price: 3990, category: 'Gifts', image: '/products/wa-20.jpg', stock: 20, description: 'Seven premium red roses with baby\'s breath in dramatic black and gold wrap with a red satin bow. Bold, luxurious and unforgettable.', rating: 4.5 },
    { id: 'p39', name: "Birthday Surprise Combo", price: 9990, category: 'Gifts', image: '/products/wa-21.jpg', stock: 20, description: 'Complete birthday surprise: a Happy Birthday cake, a premium shirt gift box and a personalized Happy Birthday photo frame. Everything for his special day in one order.', rating: 4.6 },
    { id: 'p40', name: "Chocolate and Perfume Hamper Basket", price: 4990, category: 'Gifts', image: '/products/wa-22.jpg', stock: 20, description: 'Quilted blush-pink hamper basket loaded with Snickers, KitKat, Twix, Bella Vita perfume and a pink rose. A sweet treat for chocolate lovers.', rating: 4.7 },
    { id: 'p41', name: "White Rose Bouquet and Chocolate Hamper Combo", price: 5990, category: 'Gifts', image: '/products/wa-23.jpg', stock: 20, description: 'Elegant white rose bouquet in lavender wrap paired with a chocolate and perfume hamper basket. Double the delight for someone special.', rating: 4.8 },
    { id: 'p42', name: "Beauty and Care Gift Bouquet", price: 6490, category: 'Gifts', image: '/products/wa-24.jpg', stock: 20, description: 'Gorgeous purple gift bouquet packed with Nivea body care, Lakme makeup, Fudge cake, makeup brushes and fresh roses. The ultimate pamper gift for her.', rating: 4.9 },
    { id: 'p43', name: "Makeup and Jewelry Gift Box", price: 7490, category: 'Gifts', image: '/products/wa-25.jpg', stock: 20, description: 'Luxury black round gift box with eyeshadow palette, lipsticks, nail polishes, Korean face masks, Ferrero Rocher and a pendant necklace among pink roses.', rating: 4.5 },
    { id: 'p44', name: "Mens Grooming Gift Bouquet", price: 6990, category: 'Gifts', image: '/products/wa-26.jpg', stock: 20, description: 'Fun polka-dot gift bouquet for him with Bella Vita perfume, shampoo, key holder, Kinder Joy and grooming essentials. Practical and playful.', rating: 4.6 },
    { id: 'p45', name: "Mens Grand Luxury Bouquet", price: 9990, category: 'Gifts', image: '/products/wa-27.jpg', stock: 20, description: 'Showstopper champagne-gold bouquet with Engage Homme perfume, wristwatch, ring, keychain, diary and pen. The grandest gift for the most important man.', rating: 4.7 },
    { id: 'p46', name: "Anniversary Memory Gift Box", price: 6490, category: 'Gifts', image: '/products/wa-28.jpg', stock: 20, description: 'Romantic anniversary box with a customized couple photo frame, premium shirt, Ferrero Rocher chocolates and cream roses. Celebrate your story.', rating: 4.8 },
    { id: 'p47', name: "Fairy Light Photo Memory Jar", price: 2490, category: 'Gifts', image: '/products/wa-29.jpg', stock: 20, description: 'Glowing memory jar with fairy lights, your photos, golden glitter and heart confetti. A dreamy personalized gift, customized with your pictures.', rating: 4.9 },
    { id: 'p48', name: "Red Satin Rose Bouquet", price: 3490, oldPrice: 4490, category: 'Gifts', image: '/products/wa-30.jpg', stock: 20, description: 'Nine velvety red satin roses in white and gold wrap with champagne ribbon. Everlasting roses at a special offer price.', rating: 4.5 },
    { id: 'p49', name: "Champagne Rose Daisy Bouquet", price: 2790, oldPrice: 3490, category: 'Gifts', image: '/products/wa-31.jpg', stock: 20, description: 'Three champagne roses with daisies in blush wrap. Part of our limited-time special offer on all flower bouquets.', rating: 4.6 },
    { id: 'p50', name: "Customized Couple Memory Frame", price: 1990, category: 'Gifts', image: '/products/wa-32.jpg', stock: 20, description: 'Personalized couple photo frame with your names, dates and a heartfelt message. Designed exactly with your idea.', rating: 4.7 },
    { id: 'p51', name: "Birthday Gift Box for Her", price: 4490, category: 'Gifts', image: '/products/wa-33.jpg', stock: 20, description: 'Sweet birthday box for her with a floral glass tumbler, Happy Birthday candle, satin scrunchie, lip gloss, KitKat and a greeting card. Ready to gift.', rating: 4.8 },
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
        // ensure ntfy topic default exists on old settings
        if (!db.settings.ntfyTopic) db.settings.ntfyTopic = seedDb().settings.ntfyTopic;
        // merge new seed products (e.g. WhatsApp catalog imports) into older saved
        // DBs, without resurrecting products the admin deleted on purpose
        const gone = new Set<string>(db.deletedProductIds ?? []);
        const have = new Set(db.products.map((p) => p.id));
        let added = 0;
        for (const p of seedDb().products) {
          if (!have.has(p.id) && !gone.has(p.id)) { db.products.push(p); have.add(p.id); added++; }
        }
        if (added > 0) {
          try { window.localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch { /* ignore */ }
        }
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
