'use client';
// Backwards-compatible: /product?id=<id> redirects client-side to /product/<slug>.
// (Static export has no server redirects, so this runs in the browser.)

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { loadDb, productSlug, findBySlug } from '@/lib/store';

function RedirectInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [db] = useState(loadDb);

  useEffect(() => {
    const id = params.get('id') || '';
    const product =
      db.products.find((p) => p.id === id) || findBySlug(db.products, id);
    if (product) {
      router.replace(`/product/${productSlug(product.name)}/`);
    } else {
      router.replace('/');
    }
  }, [params, router, db]);

  return <div className="py-10 text-center text-neutral-600">Loading…</div>;
}

export default function ProductRedirect() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-neutral-600">Loading…</div>}>
      <RedirectInner />
    </Suspense>
  );
}
