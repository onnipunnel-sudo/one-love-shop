'use client';
// Checkout: customer details, payment method (COD + admin-added methods),
// order summary, Place Order → saved to localStorage + WhatsApp order button.

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { useCart } from '@/lib/cart';
import { validateCoupon } from '@/lib/coupon';
import { Order, SHOP_WHATSAPP, deliveryFeeFor, loadDb, money, saveDb, uid } from '@/lib/store';

function CheckoutInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { lines, subtotal, clear } = useCart();
  const [db, setDb] = useState(loadDb);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [payId, setPayId] = useState('cod');
  const [placed, setPlaced] = useState<Order | null>(null);
  const [error, setError] = useState('');

  const products = useMemo(() => new Map(db.products.map((p) => [p.id, p])), [db]);

  const couponCode = params.get('coupon') || '';
  const couponRes = couponCode ? validateCoupon(db, couponCode, subtotal) : null;
  const discount = couponRes?.ok ? couponRes.discount : 0;
  const deliveryFee = deliveryFeeFor(subtotal - discount);
  const total = Math.max(0, subtotal - discount + deliveryFee);

  const placeOrder = () => {
    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      setError('Please fill in your name, phone, address and city.');
      return;
    }
    if (lines.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    setError('');
    const order: Order = {
      id: uid('ORD'),
      customer: name.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || undefined,
      address: address.trim(),
      city: city.trim(),
      items: lines.map((l) => {
        const p = products.get(l.productId);
        return { productId: l.productId, name: p?.name ?? l.productId, price: p?.price ?? 0, qty: l.qty };
      }),
      subtotal,
      discount,
      deliveryFee,
      total,
      paymentMethod: db.paymentMethods.find((m) => m.id === payId)?.name ?? payId,
      coupon: couponRes?.ok ? couponCode : undefined,
      status: 'pending',
      date: new Date().toISOString(),
    };
    const next = { ...db, orders: [order, ...db.orders] };
    saveDb(next);
    setDb(next);
    clear();
    setPlaced(order);
  };

  const waText = placed
    ? encodeURIComponent(
        `*NEW ORDER — ONE LOVE* 🛍️\nOrder: ${placed.id}\nName: ${placed.customer}\nPhone: ${placed.phone}\n` +
          (placed.whatsapp ? `WhatsApp: ${placed.whatsapp}\n` : '') +
          `Address: ${placed.address}${placed.city ? ', ' + placed.city : ''}\n\n` +
          placed.items.map((i) => `• ${i.name} × ${i.qty} — ${money(i.price * i.qty)}`).join('\n') +
          `\n\nSubtotal: ${money(placed.subtotal)}` +
          (placed.discount ? `\nDiscount: − ${money(placed.discount)}` : '') +
          (placed.deliveryFee ? `\nDelivery: ${money(placed.deliveryFee)}` : '\nDelivery: FREE') +
          `\n*Total: ${money(placed.total)}*\nPayment: ${placed.paymentMethod}`,
      )
    : '';

  if (placed) {
    return (
      <div className="mx-auto max-w-xl py-10 text-center">
        <div className="text-5xl">✅</div>
        <h1 className="mt-4 text-2xl font-bold text-gold">Order placed successfully!</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Order <span className="font-mono text-neutral-800">{placed.id}</span> · Total{' '}
          <span className="font-bold text-gold">{money(placed.total)}</span>
        </p>
        <p className="mt-3 text-sm text-neutral-600">
          Tap below to send your order to us on WhatsApp for fast confirmation:
        </p>
        <a
          href={`https://wa.me/${SHOP_WHATSAPP}?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-block rounded-md bg-[#25D366] px-8 py-3 font-bold text-white hover:brightness-110"
        >
          💬 Send Order via WhatsApp
        </a>
        <div>
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-sm text-neutral-600 underline hover:text-gold"
          >
            Continue shopping
          </button>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="py-16 text-center text-neutral-600">
        Your cart is empty.{' '}
        <button onClick={() => router.push('/')} className="text-gold underline">
          Shop now
        </button>
      </div>
    );
  }

  const inputCls =
    'h-11 w-full rounded-md bg-white px-3 text-sm text-neutral-900 outline-none ring-1 ring-neutral-200 placeholder:text-neutral-500 focus:ring-gold';

  return (
    <div className="py-6">
      <h1 className="mb-6 text-2xl font-bold text-gold">Checkout</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Customer details */}
          <section className="rounded-lg bg-white p-5 ring-1 ring-neutral-200">
            <div className="mb-4 text-sm font-bold uppercase tracking-wider text-gold">
              Delivery Details
            </div>
            <div className="space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name *" className={inputCls} />
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number *" className={inputCls} />
                <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp number" className={inputCls} />
              </div>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Delivery address * (street, house no.)"
                rows={2}
                className="w-full rounded-md bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none ring-1 ring-neutral-200 placeholder:text-neutral-500 focus:ring-gold"
              />
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City *" className={inputCls} />
            </div>
          </section>

          {/* Payment methods */}
          <section className="rounded-lg bg-white p-5 ring-1 ring-neutral-200">
            <div className="mb-4 text-sm font-bold uppercase tracking-wider text-gold">
              Payment Method
            </div>
            <div className="space-y-2">
              {db.paymentMethods.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-md p-3 ring-1 transition ${
                    payId === m.id ? 'bg-gold/10 ring-gold' : 'ring-neutral-300 hover:ring-gold/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="pay"
                    checked={payId === m.id}
                    onChange={() => setPayId(m.id)}
                    className="mt-1 accent-[#D4AF37]"
                  />
                  <div>
                    <div className="text-sm font-semibold text-neutral-900">{m.name}</div>
                    {m.details && <div className="text-xs text-neutral-600">{m.details}</div>}
                  </div>
                </label>
              ))}
            </div>
          </section>

          {error && <div className="rounded-md bg-red-900/30 p-3 text-sm text-red-300">{error}</div>}
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-lg bg-white p-5 ring-1 ring-neutral-200">
          <div className="mb-4 text-sm font-bold uppercase tracking-wider text-gold">Order Summary</div>
          <div className="max-h-56 space-y-2 overflow-y-auto text-sm">
            {lines.map((l) => {
              const p = products.get(l.productId);
              if (!p) return null;
              return (
                <div key={l.productId} className="flex justify-between text-neutral-700">
                  <span className="line-clamp-1">
                    {p.name} × {l.qty}
                  </span>
                  <span className="shrink-0 tabular-nums">{money(p.price * l.qty)}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 space-y-1 border-t border-neutral-200 pt-3 text-sm">
            <div className="flex justify-between text-neutral-700">
              <span>Subtotal</span>
              <span className="tabular-nums">{money(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Coupon ({couponCode})</span>
                <span className="tabular-nums">− {money(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-neutral-700">
              <span>Delivery</span>
              <span className="tabular-nums">{deliveryFee > 0 ? money(deliveryFee) : <b className="text-green-400">FREE</b>}</span>
            </div>
            {deliveryFee === 0 && (
              <div className="text-[11px] text-neutral-500">🎉 Free islandwide delivery on orders over Rs. 5,000</div>
            )}
            <div className="flex justify-between pt-2 text-base font-bold">
              <span>Total</span>
              <span className="text-gold tabular-nums">{money(total)}</span>
            </div>
          </div>
          <button
            onClick={placeOrder}
            className="mt-5 w-full rounded-md bg-gold py-3 font-bold text-black hover:bg-gold-dark"
          >
            Place Order
          </button>
        </aside>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-neutral-600">Loading…</div>}>
      <CheckoutInner />
    </Suspense>
  );
}
