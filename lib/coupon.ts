// Coupon validation shared by cart + checkout.

import { Coupon, Db, money } from './store';

export interface CouponResult {
  ok: boolean;
  coupon?: Coupon;
  discount: number;
  message: string;
}

export function validateCoupon(db: Db, code: string, subtotal: number): CouponResult {
  const c = db.coupons.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
  if (!c) return { ok: false, discount: 0, message: 'Invalid coupon code.' };
  if (!c.active) return { ok: false, discount: 0, message: 'This coupon is no longer active.' };
  if (c.expiry) {
    const today = new Date().toISOString().slice(0, 10);
    if (c.expiry < today)
      return { ok: false, discount: 0, message: `This coupon expired on ${c.expiry}.` };
  }
  if (subtotal < c.minOrder)
    return {
      ok: false,
      discount: 0,
      message: `Needs a minimum order of ${money(c.minOrder)} for this coupon.`,
    };
  const discount =
    c.kind === 'percent' ? Math.round((subtotal * c.value) / 100) : Math.min(c.value, subtotal);
  return { ok: true, coupon: c, discount, message: `Coupon ${c.code} applied!` };
}
