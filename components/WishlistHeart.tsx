'use client';
// Wishlist heart button — drop onto any product surface.

import { useWishlist } from '@/lib/wishlist';

export function WishlistHeart({ productId, big = false }: { productId: string; big?: boolean }) {
  const { has, toggle } = useWishlist();
  const wished = has(productId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
      title={wished ? 'Remove from wishlist' : 'Add to wishlist'}
      className={`rounded-full backdrop-blur transition ${
        big ? 'p-2.5 text-xl' : 'p-1.5 text-base'
      } ${wished ? 'bg-gold/90 text-black' : 'bg-black/50 text-white hover:text-gold'}`}
    >
      {wished ? '❤️' : '🤍'}
    </button>
  );
}
