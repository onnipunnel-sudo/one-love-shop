# ONE LOVE — E-commerce Website 🛍️

A Daraz-style online store for **ONE LOVE** (gifts & lifestyle, Akkaraipattu, Sri Lanka —
📞/WhatsApp **075-1346314**), with a luxury black + gold identity.

**Tech:** Next.js 14 (App Router) + Tailwind CSS, fully **static export** (`output: 'export'`)
— deploys on Vercel / Netlify / any static host. All data lives in the browser's
**localStorage** (no backend, no database).

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export → ./out/
```

Deploy: push this repo to GitHub, then import it in Vercel (framework preset: Next.js).
No build settings to change — `npm run build` outputs the static site.

## Storefront

| Page | URL |
|---|---|
| Home (hero, flash sale ⏱, Just For You grid, search, categories) | `/` |
| Product detail | `/product?id=<id>` |
| Cart (qty steppers, coupon codes) | `/cart` |
| Checkout (COD + admin payment methods, WhatsApp order button) | `/checkout` |
| **Admin (hidden — no link anywhere public)** | **`/admin`** |

## Admin panel (`/admin`)

- **Default password:** `onelove2026` (you can change it in Settings → Change admin password;
  it is stored salted-hashed in localStorage, not in plain text)
- **Products** — add / edit / delete. Image = paste a URL **or** upload a file
  (stored as a dataURL in the browser).
- **Bulk Import** — the "50+ items in 1 click" tab. Paste lines in this format
  (one product per line, fields separated by `|`):

  ```
  name | price | oldPrice | category | imageURL | stock
  ```

  Example:
  ```
  Golden Rose Gift Box | 2490 | 3490 | Gifts | https://picsum.photos/seed/rose/600/600 | 25
  Bluetooth Earbuds Pro | 4990 | 6990 | Electronics | https://picsum.photos/seed/buds/600/600 | 40
  ```

  `oldPrice` and `stock` are optional; lines starting with `#` are ignored.
  You can also **load a `.csv` file** (`name,price,oldPrice,category,imageURL,stock`
  per line) and then hit **Import all**. Every line becomes a product instantly —
  paste 50+ lines, one click, done.
- **Payments** — add payment methods shown at checkout
  (e.g. `Bank Transfer` — `BOC Akkaraipattu A/C 123456789`). Cash on Delivery is built in.
- **Coupons** — coupon codes (`WELCOME10` = 10% off, `LOVE50` = Rs.50 flat over Rs.1000
  are pre-seeded). Set % or flat discount, minimum order, expiry date, active toggle.
  Also set the **flash-sale countdown end time** here (shown on the homepage).
- **Orders** — every checkout lands here (customer, items, total, payment method);
  mark completed or delete.
- **Settings** — announcement banner text, change admin password, **export/import all
  data as JSON** (backup), reset to demo data.

## Checkout → WhatsApp

Placing an order saves it to the admin Orders tab **and** shows a
**"Send Order via WhatsApp"** button that opens `wa.me/94751346314` with the full
order (items, totals, customer details) prefilled.

## Important limits (localStorage-only)

- All products/orders/coupons/settings live **in each browser's localStorage**.
  The admin must use the **same browser** (or import the JSON backup via
  Settings → Import backup) to see the same data.
- Uploaded product images are stored as dataURLs in localStorage — keep them
  reasonably sized (browser storage is ~5 MB).
- Demo product photos use `picsum.photos` placeholders — replace with real
  product photos in the admin panel before going live.
