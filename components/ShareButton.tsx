'use client';
// Share button: native share sheet when available, WhatsApp share fallback.

import { useState } from 'react';
import { money, productSlug } from '@/lib/store';

export function ShareButton({ name, price }: { name: string; price: number }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}/product/${productSlug(name)}`;
    const text = `🛍️ ${name} — ${money(price)}\n${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: name, text, url });
        return;
      }
    } catch {
      return; // user dismissed the share sheet
    }
    // Fallback: WhatsApp share
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/product/${productSlug(name)}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={share}
        title="Share this product"
        className="rounded-full p-2 text-xl ring-1 ring-neutral-300 transition hover:ring-gold"
        aria-label="Share product"
      >
        🔗
      </button>
      <button
        onClick={copy}
        title="Copy product link"
        className="rounded-full px-2 py-2 text-xs font-bold text-neutral-500 ring-1 ring-neutral-300 transition hover:text-gold hover:ring-gold"
        aria-label="Copy product link"
      >
        {copied ? '✅ Copied!' : '📋 Copy link'}
      </button>
    </div>
  );
}
