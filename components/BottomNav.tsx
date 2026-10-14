'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart';

const ITEMS = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/promo', label: 'Promo', icon: '🎁' },
  { href: '/cart', label: 'Cart', icon: '🛒' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { count } = useCart();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-royal/30 bg-ink/95 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-3">
        {ITEMS.map((it) => {
          const active = it.href === '/' ? pathname === '/' : pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`relative flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
                active ? 'text-gold' : 'text-neutral-400'
              }`}
            >
              <span className="text-xl leading-none">{it.icon}</span>
              {it.label}
              {it.href === '/cart' && count > 0 && (
                <span className="absolute right-1/2 top-1 translate-x-5 rounded-full bg-gold px-1.5 text-[10px] font-bold text-black">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
