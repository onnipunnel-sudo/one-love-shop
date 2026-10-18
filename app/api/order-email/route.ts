// POST /api/order-email — emails the full order details to the shop admin.
// Called fire-and-forget from checkout right after an order is placed.
// Sends via Resend (free tier). Requires RESEND_API_KEY env var on Vercel.
// NOTE: the connected Resend account belongs to onnipunnel@gmail.com, and the
// free tier only delivers to the account owner's address, so admin
// notifications go there (not the website email) until a domain is verified
// or a second Resend account is added.
import { NextResponse } from 'next/server';

const ADMIN_EMAIL = 'onnipunnel@gmail.com';

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function money(n: number): string {
  return 'Rs. ' + Number(n || 0).toLocaleString('en-LK');
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'email not configured' }, { status: 500 });
    }
    const o = await req.json();
    // Basic shape validation — our own checkout only.
    if (!o || typeof o.id !== 'string' || !o.id.startsWith('ORD') || !Array.isArray(o.items) || o.items.length === 0 || o.items.length > 50) {
      return NextResponse.json({ ok: false, error: 'bad order' }, { status: 400 });
    }
    const rows = o.items
      .map(
        (i: { name: string; qty: number; price: number }) =>
          `<tr><td style="padding:8px;border-bottom:1px solid #eee">${esc(i.name)}</td>` +
          `<td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${esc(i.qty)}</td>` +
          `<td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${money(i.price)}</td>` +
          `<td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${money(i.price * i.qty)}</td></tr>`,
      )
      .join('');
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#222">
        <h2 style="color:#7C3AED">🛍️ New Order — ONE LOVE</h2>
        <p><b>Order ID:</b> ${esc(o.id)}<br>
        <b>Date:</b> ${esc(o.date ? new Date(o.date).toLocaleString('en-GB') : '')}<br>
        <b>Payment:</b> ${esc(o.paymentMethod)}${o.coupon ? `<br><b>Coupon:</b> ${esc(o.coupon)}` : ''}</p>
        <h3>Customer</h3>
        <p><b>Name:</b> ${esc(o.customer)}<br>
        <b>Phone:</b> ${esc(o.phone)}${o.whatsapp ? `<br><b>WhatsApp:</b> ${esc(o.whatsapp)}` : ''}<br>
        <b>Address:</b> ${esc(o.address)}${o.city ? ', ' + esc(o.city) : ''}</p>
        <h3>Items</h3>
        <table style="width:100%;border-collapse:collapse">
          <tr style="background:#f5f0ff"><th style="padding:8px;text-align:left">Item</th><th style="padding:8px">Qty</th><th style="padding:8px;text-align:right">Price</th><th style="padding:8px;text-align:right">Total</th></tr>
          ${rows}
        </table>
        <p><b>Subtotal:</b> ${money(o.subtotal)}<br>
        ${o.discount ? `<b>Discount:</b> − ${money(o.discount)}<br>` : ''}
        <b>Delivery:</b> ${o.deliveryFee ? money(o.deliveryFee) : 'FREE'}<br>
        ${o.giftWrapFee ? `<b>Gift wrap:</b> ${money(o.giftWrapFee)}<br>` : ''}
        ${o.giftMessage ? `<b>Gift message:</b> ${esc(o.giftMessage)}<br>` : ''}
        <b style="font-size:18px">Total: ${money(o.total)}</b></p>
      </div>`;
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'ONE LOVE <onboarding@resend.dev>',
        to: [ADMIN_EMAIL],
        subject: `🛍️ New Order ${o.id} — ${money(o.total)}`,
        html,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: data?.message || 'send failed' }, { status: 502 });
    }
    return NextResponse.json({ ok: true, id: data?.id });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'server error' }, { status: 500 });
  }
}
