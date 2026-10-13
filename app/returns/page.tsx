import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Returns & Refunds | ONE LOVE',
  description: 'ONE LOVE return policy — 7-day easy returns on all gift items in Sri Lanka.',
};

export default function ReturnsPage() {
  return (
    <div className="py-10">
      <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 ring-1 ring-neutral-200">
        <h1 className="text-2xl font-bold text-neutral-900">Returns & Refunds</h1>
        <p className="mt-1 text-sm text-neutral-500">Last updated: October 2026</p>

        <div className="mt-6 space-y-4 text-sm leading-relaxed text-neutral-700">
          <p>
            At <b>ONE LOVE</b> we want you to love every gift. If something isn&apos;t right,
            we offer <b>7-day easy returns</b> on all items.
          </p>

          <h2 className="pt-2 text-base font-bold text-neutral-900">Return conditions</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Request your return within <b>7 days</b> of delivery.</li>
            <li>Items must be <b>unused</b> and in their <b>original packaging</b>.</li>
            <li>Personalized items (e.g. custom photo frames) can only be returned if damaged or incorrect.</li>
          </ul>

          <h2 className="pt-2 text-base font-bold text-neutral-900">How to return</h2>
          <p>
            Contact us on WhatsApp at <b>075-1346314</b> with your order details and a photo
            of the item. We&apos;ll confirm your return and arrange pickup or drop-off.
          </p>

          <h2 className="pt-2 text-base font-bold text-neutral-900">Refunds</h2>
          <p>
            Once we receive and check your returned item, your refund will be processed
            within <b>3–5 business days</b> via bank transfer or cash — whichever suits you.
          </p>

          <h2 className="pt-2 text-base font-bold text-neutral-900">Exchanges</h2>
          <p>
            Yes, we accept exchanges! If you&apos;d like a different item instead of a refund,
            just tell us on WhatsApp and we&apos;ll arrange it.
          </p>

          <h2 className="pt-2 text-base font-bold text-neutral-900">Damaged or wrong items</h2>
          <p>
            Received a damaged or wrong item? Send us a photo on WhatsApp within 48 hours
            and we&apos;ll replace it or refund you in full — no return shipping needed.
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm font-medium text-gold hover:underline">
            ← Back to shop
          </Link>
        </div>
      </div>
    </div>
  );
}
