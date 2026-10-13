// Site footer with shop info.

import Link from 'next/link';
import { SHOP_CITY, SHOP_EMAIL, SHOP_PHONE } from '@/lib/store';

export function Footer() {
  return (
    <footer className="mt-12 border-t border-gold/20 bg-neutral-100">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="ONE LOVE" className="h-12 w-12 rounded-full ring-2 ring-gold" />
            <div>
              <div className="font-serif text-xl text-gold">ONE LOVE</div>
              <div className="text-xs text-neutral-600">{SHOP_CITY}, Sri Lanka</div>
            </div>
          </div>
          <p className="mt-3 text-sm text-neutral-600">
            Your luxury gift & lifestyle store — quality products, honest prices, delivered to your
            doorstep.
          </p>
        </div>
        <div>
          <div className="mb-3 font-semibold text-gold">Contact</div>
          <div className="text-sm text-neutral-600">📞 / WhatsApp: {SHOP_PHONE}</div>
          <div className="text-sm text-neutral-600">
            ✉️{' '}
            <a href={`mailto:${SHOP_EMAIL}`} className="text-gold hover:underline">
              {SHOP_EMAIL}
            </a>
          </div>
          <div className="text-sm text-neutral-600">📍 {SHOP_CITY}, Sri Lanka</div>
          <div className="mt-2 text-sm text-neutral-600">🕘 Open daily 9:00 AM – 9:00 PM</div>
        </div>
        <div>
          <div className="mb-3 font-semibold text-gold">Customer Care</div>
          <ul className="space-y-1 text-sm text-neutral-600">
            <li>Help Center</li>
            <li>Track Your Order</li>
            <li><Link href="/returns/" className="hover:text-gold">Returns & Refunds</Link></li>
            <li>Privacy Policy</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-200 py-4 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} ONE LOVE · {SHOP_CITY} · All rights reserved.
      </div>
    </footer>
  );
}
