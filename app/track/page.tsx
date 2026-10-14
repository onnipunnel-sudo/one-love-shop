'use client';
// Track your order: enter the phone number used at checkout to see order status.

import { useState } from 'react';
import { Order, loadDb, money } from '@/lib/store';

const STATUS_STEPS = ['pending', 'confirmed', 'shipped', 'delivered'] as const;

const STATUS_LABEL: Record<string, string> = {
  pending: 'Order Received',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_EMOJI: Record<string, string> = {
  pending: '📝',
  confirmed: '✅',
  shipped: '🚚',
  delivered: '📦',
  completed: '🎉',
  cancelled: '❌',
};

function normalize(phone: string) {
  return phone.replace(/[\s\-+]/g, '');
}

function OrderTimeline({ order }: { order: Order }) {
  if (order.status === 'cancelled') {
    return (
      <div className="mt-3 rounded-md bg-red-900/30 p-3 text-sm text-red-300 ring-1 ring-red-900">
        ❌ This order was cancelled. Contact us on WhatsApp if you have questions.
      </div>
    );
  }
  const currentIdx = STATUS_STEPS.indexOf(
    (['pending', 'confirmed', 'shipped', 'delivered'].includes(order.status)
      ? order.status
      : 'delivered') as (typeof STATUS_STEPS)[number],
  );
  return (
    <div className="mt-4">
      <div className="flex items-center">
        {STATUS_STEPS.map((step, i) => {
          const done = i <= currentIdx;
          const isLast = i === STATUS_STEPS.length - 1;
          return (
            <div key={step} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-lg ring-2 ${
                    done ? 'bg-gold text-black ring-gold' : 'bg-ink-card text-neutral-500 ring-royal/30'
                  }`}
                >
                  {STATUS_EMOJI[step]}
                </div>
                <div className={`mt-1 text-[11px] font-semibold ${done ? 'text-gold' : 'text-neutral-500'}`}>
                  {STATUS_LABEL[step]}
                </div>
              </div>
              {!isLast && (
                <div className={`mx-1 mb-5 h-0.5 flex-1 ${i < currentIdx ? 'bg-gold' : 'bg-royal/30'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TrackPage() {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [searched, setSearched] = useState(false);

  const search = () => {
    const needle = normalize(phone);
    if (!needle) return;
    try {
      const db = loadDb();
      const found = (db.orders || []).filter(
        (o) => normalize(o.phone).endsWith(needle.slice(-9)) || normalize(o.phone) === needle,
      );
      setOrders(found);
    } catch {
      setOrders([]);
    }
    setSearched(true);
  };

  return (
    <div className="mx-auto max-w-2xl py-6">
      <h1 className="mb-2 text-2xl font-bold text-gold">📦 Track Your Order</h1>
      <p className="mb-6 text-sm text-neutral-400">
        Enter the phone number you used when placing the order.
      </p>

      <div className="flex gap-2">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="e.g. 0771234567"
          inputMode="tel"
          className="h-11 flex-1 rounded-md bg-ink-card px-4 text-sm text-neutral-100 outline-none ring-1 ring-royal/30 placeholder:text-neutral-500 focus:ring-gold"
        />
        <button
          onClick={search}
          className="rounded-md bg-gradient-to-r from-gold to-royal px-6 font-bold text-black hover:opacity-90"
        >
          Track
        </button>
      </div>

      {searched && (
        <div className="mt-6">
          {orders && orders.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-neutral-400">
                Found {orders.length} order{orders.length !== 1 ? 's' : ''}:
              </p>
              {orders.map((o) => (
                <div key={o.id} className="rounded-lg bg-ink-card p-5 ring-1 ring-royal/20">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-sm text-gold">{o.id}</span>
                      <div className="text-xs text-neutral-500">
                        {new Date(o.date).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gold">{money(o.total)}</div>
                      <div className="text-xs text-neutral-400">
                        {o.items.reduce((s, i) => s + i.qty, 0)} item(s) · {o.paymentMethod}
                      </div>
                    </div>
                  </div>
                  <OrderTimeline order={o} />
                  <div className="mt-3 border-t border-royal/20 pt-3 text-sm text-neutral-300">
                    {o.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between py-0.5">
                        <span className="line-clamp-1">
                          {i.name} × {i.qty}
                        </span>
                        <span className="shrink-0 tabular-nums">{money(i.price * i.qty)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-ink-card p-8 text-center ring-1 ring-royal/20">
              <div className="text-4xl">🔍</div>
              <p className="mt-3 text-neutral-400">
                No orders found for this phone number.
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Check the number and try again, or contact us on WhatsApp.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
