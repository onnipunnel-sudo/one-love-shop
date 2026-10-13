'use client';
// Client-side add-to-cart + quantity picker for the static product page.

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/lib/cart';

export function AddToCart({ productId, stock }: { productId: string; stock: number }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const doAdd = () => {
    add(productId, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      <div className="mt-6 flex items-center gap-3">
        <span className="text-sm text-neutral-600">Qty</span>
        <div className="flex items-center rounded-md ring-1 ring-neutral-200">
          <button
            onClick={() => setQty((v) => Math.max(1, v - 1))}
            className="px-3 py-2 text-lg hover:text-gold"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-10 text-center tabular-nums">{qty}</span>
          <button
            onClick={() => setQty((v) => Math.min(stock || 99, v + 1))}
            className="px-3 py-2 text-lg hover:text-gold"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={doAdd}
          disabled={stock <= 0}
          className="flex-1 rounded-md border border-gold px-6 py-3 font-semibold text-gold hover:bg-gold/10 disabled:opacity-40"
        >
          {added ? '✓ Added to cart' : 'Add to Cart'}
        </button>
        <Link
          href="/checkout"
          onClick={doAdd}
          className={`flex-1 rounded-md bg-gold px-6 py-3 text-center font-bold text-black hover:bg-gold-dark ${
            stock <= 0 ? 'pointer-events-none opacity-40' : ''
          }`}
        >
          Buy Now
        </Link>
      </div>
    </>
  );
}
