'use client';
// Cart page: line items with qty steppers, remove, subtotal,
// coupon input (validated against admin coupons), checkout button.

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/lib/cart';
import { validateCoupon } from '@/lib/coupon';
import { loadDb, money, productSlug } from '@/lib/store';

export default function CartPage() {
  const { lines, setQty, remove, subtotal } = useCart();
  const [db] = useState(loadDb);
  const [code, setCode] = useState('');
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [msg, setMsg] = useState('');

  const products = new Map(db.products.map((p) => [p.id, p]));

  const applyCoupon = () => {
    const r = validateCoupon(db, code, subtotal);
    setMsg(r.message);
    if (r.ok && r.coupon) {
      setCouponCode(r.coupon.code);
      setCouponDiscount(r.discount);
    } else {
      setCouponCode(null);
      setCouponDiscount(0);
    }
  };

  const total = Math.max(0, subtotal - couponDiscount);

  if (lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="text-5xl">🛒</div>
        <div className="mt-4 text-xl text-neutral-700">Your cart is empty</div>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-gold px-6 py-3 font-bold text-black hover:bg-gold-dark"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6">
      <h1 className="mb-6 text-2xl font-bold text-gold">Shopping Cart</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {lines.map((l) => {
            const p = products.get(l.productId);
            if (!p) return null;
            return (
              <div
                key={l.productId}
                className="flex gap-4 rounded-lg bg-white p-3 ring-1 ring-neutral-200"
              >
                <Link href={`/product/${productSlug(p.name)}/`} className="shrink-0">
                  <img src={p.image} alt={p.name} className="h-20 w-20 rounded-md object-cover" />
                </Link>
                <div className="flex flex-1 flex-col">
                  <Link href={`/product/${productSlug(p.name)}/`} className="text-sm text-neutral-800 hover:text-gold">
                    {p.name}
                  </Link>
                  <div className="mt-1 text-sm font-bold text-gold">{money(p.price)}</div>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center rounded-md ring-1 ring-neutral-200">
                      <button
                        onClick={() => setQty(l.productId, l.qty - 1)}
                        className="px-2.5 py-1 hover:text-gold"
                        aria-label="Decrease"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm tabular-nums">{l.qty}</span>
                      <button
                        onClick={() => setQty(l.productId, l.qty + 1)}
                        className="px-2.5 py-1 hover:text-gold"
                        aria-label="Increase"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => remove(l.productId)}
                      className="text-xs text-neutral-500 hover:text-red-400"
                    >
                      🗑 Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="h-fit rounded-lg bg-white p-5 ring-1 ring-neutral-200">
          <div className="mb-4 text-sm font-bold uppercase tracking-wider text-gold">Order Summary</div>
          <div className="flex justify-between text-sm text-neutral-700">
            <span>Subtotal</span>
            <span className="tabular-nums">{money(subtotal)}</span>
          </div>

          {/* Coupon input */}
          <div className="mt-4">
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Coupon code"
                className="h-10 w-full rounded-md bg-white px-3 text-sm uppercase outline-none ring-1 ring-neutral-200 placeholder:normal-case placeholder:text-neutral-500 focus:ring-gold"
              />
              <button
                onClick={applyCoupon}
                className="shrink-0 rounded-md bg-gold px-4 text-sm font-bold text-black hover:bg-gold-dark"
              >
                Apply
              </button>
            </div>
            {msg && (
              <div
                className={`mt-2 text-xs ${couponCode ? 'text-green-400' : 'text-red-400'}`}
              >
                {msg}
              </div>
            )}
          </div>

          {couponDiscount > 0 && (
            <div className="mt-3 flex justify-between text-sm text-green-400">
              <span>Coupon ({couponCode})</span>
              <span className="tabular-nums">− {money(couponDiscount)}</span>
            </div>
          )}
          <div className="mt-3 flex justify-between border-t border-neutral-200 pt-3 text-base font-bold">
            <span>Total</span>
            <span className="text-gold tabular-nums">{money(total)}</span>
          </div>
          <Link
            href={`/checkout${couponCode ? `?coupon=${encodeURIComponent(couponCode)}` : ''}`}
            className="mt-5 block rounded-md bg-gold py-3 text-center font-bold text-black hover:bg-gold-dark"
          >
            Proceed to Checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}
