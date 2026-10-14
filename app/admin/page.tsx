'use client';
// HIDDEN admin panel at /admin — no public link points here.
// Password gate first (default: onelove2026), then 6 tabs:
// Products, Bulk Import, Payment Methods, Coupons/Offers, Orders, Settings.

import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Banner,
  Coupon,
  Db,
  Order,
  PaymentMethod,
  Product,
  Promo,
  Review,
  hashPassword,
  loadDb,
  money,
  resetDb,
  saveDb,
  uid,
} from '@/lib/store';
import { dropIdbRef, saveMediaBlob } from '@/lib/mediaStore';
import { useMediaUrl } from '@/lib/useMediaUrl';

/** Max gallery video size: 500MB (stored in IndexedDB, not localStorage). */
const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

/** Shared gallery-video picker: stores the file in IndexedDB, returns an `idb:` ref. */
async function pickGalleryVideo(
  file: File | undefined,
  setVideo: (v: string) => void,
  setMsg: (m: string) => void,
): Promise<void> {
  if (!file) return;
  if (file.size > MAX_VIDEO_BYTES) {
    setMsg('Video too large (max 500MB) — use a shorter clip.');
    return;
  }
  try {
    const id = await saveMediaBlob(file);
    setVideo('idb:' + id);
    const mb = file.size > 1048576 ? ` (${(file.size / 1048576).toFixed(1)}MB)` : '';
    setMsg('Video added from gallery' + mb + '.');
  } catch {
    setMsg('Could not save video — browser storage blocked it.');
  }
}

/** Table thumbnail that resolves idb: video refs. */
function MediaThumb({ image, video }: { image: string; video?: string }) {
  const videoUrl = useMediaUrl(video);
  if (videoUrl) return <video src={videoUrl} className="h-10 w-10 rounded object-cover" muted playsInline />;
  return <img src={image} alt="" className="h-10 w-10 rounded object-cover" />;
}

/** Labeled form field wrapper — keeps every admin input self-explanatory. */
function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold text-neutral-600">{label}</div>
      {children}
      {hint && <div className="mt-1 text-[11px] leading-snug text-neutral-400">{hint}</div>}
    </label>
  );
}

/** Downscale a gallery photo so it fits browser storage. Resolves to a JPEG dataURL. */
function downscaleImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const max = 1200;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * scale));
        c.height = Math.max(1, Math.round(img.height * scale));
        c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.82));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable image')); };
    img.src = url;
  });
}

const TABS = ['Products', 'Promos', 'Banners', 'Reviews', 'Bulk Import', 'Payments', 'Coupons', 'Orders', 'Settings'] as const;

const inputCls =
  'h-10 w-full rounded-md bg-ink-card px-3 text-sm text-neutral-100 outline-none ring-1 ring-royal/30 placeholder:text-neutral-500 focus:ring-gold';
const btnGold = 'rounded-md bg-gradient-to-r from-gold to-royal px-4 py-2 text-sm font-bold text-black hover:opacity-90';
const btnGhost = 'rounded-md px-3 py-1.5 text-xs text-neutral-300 ring-1 ring-royal/30 hover:ring-gold hover:text-gold';
const thCls = 'px-3 py-2 text-left text-xs uppercase tracking-wider text-neutral-400';
const tdCls = 'px-3 py-2 text-sm text-neutral-200';

const emptyProduct: Product = {
  id: '',
  name: '',
  price: 0,
  oldPrice: undefined,
  category: 'Gifts',
  image: '',
  video: '',
  stock: 10,
  description: '',
  featured: false,
  flashSale: false,
  rating: 4.5,
};

export default function AdminPage() {
  const [db, setDb] = useState<Db>(loadDb);
  const [authed, setAuthed] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('onelove_admin') === '1',
  );
  const [pw, setPw] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [tab, setTab] = useState<(typeof TABS)[number]>('Products');

  const persist = (next: Db) => {
    saveDb(next);
    setDb(next);
  };

  const login = () => {
    if (hashPassword(pw) === db.settings.adminPasswordHash) {
      localStorage.setItem('onelove_admin', '1');
      setAuthed(true);
      setPwErr('');
    } else {
      setPwErr('Wrong password.');
    }
  };

  if (!authed) {
    return (
      <div className="mx-auto max-w-sm py-20">
        <div className="rounded-xl bg-white p-8 text-center ring-1 ring-gold/30">
          <img src="/logo.png" alt="ONE LOVE" className="mx-auto h-16 w-16 rounded-full ring-2 ring-gold" />
          <h1 className="mt-4 font-serif text-xl text-gold">Admin Access</h1>
          <p className="mt-1 text-xs text-neutral-500">This area is private.</p>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            placeholder="Enter admin password"
            className={`${inputCls} mt-5`}
          />
          {pwErr && <div className="mt-2 text-xs text-red-400">{pwErr}</div>}
          <button onClick={login} className={`${btnGold} mt-4 w-full py-2.5`}>
            Unlock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gold">Admin Dashboard</h1>
        <button
          onClick={() => {
            localStorage.removeItem('onelove_admin');
            setAuthed(false);
          }}
          className={btnGhost}
        >
          Log out
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-2 text-sm font-semibold ${
              tab === t ? 'bg-gold text-black' : 'bg-white text-neutral-700 ring-1 ring-neutral-300 hover:ring-gold/50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Products' && <ProductsTab db={db} persist={persist} />}
      {tab === 'Promos' && <PromosTab db={db} persist={persist} />}
      {tab === 'Banners' && <BannersTab db={db} persist={persist} />}
      {tab === 'Reviews' && <ReviewsTab db={db} persist={persist} />}
      {tab === 'Bulk Import' && <BulkTab db={db} persist={persist} />}
      {tab === 'Payments' && <PaymentsTab db={db} persist={persist} />}
      {tab === 'Coupons' && <CouponsTab db={db} persist={persist} />}
      {tab === 'Orders' && <OrdersTab db={db} persist={persist} />}
      {tab === 'Settings' && <SettingsTab db={db} persist={persist} />}
    </div>
  );
}

/* ───────────────────────── Products ───────────────────────── */

function ProductsTab({ db, persist }: { db: Db; persist: (d: Db) => void }) {
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Product>(emptyProduct);
  const [msg, setMsg] = useState('');
  const videoUrl = useMediaUrl(form.video);

  const set = (k: keyof Product, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  // Gallery-first uploads: photo is downscaled so it fits browser storage;
  // video is stored as-is (keep clips short, max ~10MB).
  const onImageFile = (file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 1200;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * scale));
      c.height = Math.max(1, Math.round(img.height * scale));
      c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      set('image', c.toDataURL('image/jpeg', 0.82));
      setMsg('Photo added from gallery.');
    };
    img.onerror = () => { URL.revokeObjectURL(url); setMsg('Could not read that photo.'); };
    img.src = url;
  };

  const onVideoFile = (file: File | undefined) =>
    pickGalleryVideo(file, (v) => set('video', v), setMsg);

  const save = () => {
    if (!form.name.trim() || !form.price || !form.image) {
      setMsg('Name, price and image are required.');
      return;
    }
    let products: Product[];
    if (editing && editing.video !== form.video) dropIdbRef(editing.video);
    if (editing) {
      products = db.products.map((p) => (p.id === editing.id ? { ...form, id: editing.id } : p));
    } else {
      products = [...db.products, { ...form, id: uid('p'), oldPrice: form.oldPrice || undefined }];
    }
    try {
      persist({ ...db, products });
    } catch {
      setMsg('Storage full — video/photo too large. Use a smaller file or a link.');
      return;
    }
    setMsg(editing ? 'Product updated.' : 'Product added.');
    setForm(emptyProduct);
    setEditing(null);
  };

  const del = (id: string) => {
    if (!confirm('Delete this product?')) return;
    const gone = db.products.find((p) => p.id === id);
    if (gone) dropIdbRef(gone.video);
    persist({ ...db, products: db.products.filter((p) => p.id !== id) });
  };

  return (
    <div>
      <div className="mb-4 rounded-lg bg-white p-5 ring-1 ring-neutral-200">
        <div className="mb-4 text-sm font-bold uppercase tracking-wider text-gold">
          {editing ? 'Edit product' : 'Add product'}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Product name *" hint="The title customers see. e.g. Golden Rose Gift Box">
            <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Golden Rose Gift Box" className={inputCls} />
          </Field>
          <Field label="Category *" hint="Girls / Boys = shows in that section. All = shows everywhere.">
            <select value={form.category} onChange={(e) => set('category', e.target.value)} className={inputCls} aria-label="Category">
              {['Girls', 'Boys', 'All', 'Gifts', 'Electronics', 'Fashion', 'Home'].map((c) => (
                <option key={c} value={c}>{c === 'All' ? 'All (shows everywhere)' : c}</option>
              ))}
            </select>
          </Field>
          <Field label="Price (Rs.) *" hint="Selling price in rupees. e.g. 2490">
            <input type="number" value={form.price || ''} onChange={(e) => set('price', Number(e.target.value))} placeholder="e.g. 2490" className={inputCls} />
          </Field>
          <Field label="Old price (Rs.)" hint="Optional — shows a discount badge. Must be higher than price. e.g. 3490">
            <input type="number" value={form.oldPrice || ''} onChange={(e) => set('oldPrice', Number(e.target.value) || undefined)} placeholder="e.g. 3490" className={inputCls} />
          </Field>
          <div className="sm:col-span-2">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Photo & video — from gallery only</div>
            <div className="flex flex-wrap gap-2">
              <label className={`${btnGhost} cursor-pointer`}>
                📷 Add photo from gallery
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { onImageFile(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
              <label className={`${btnGhost} cursor-pointer`}>
                🎥 Add video from gallery
                <input type="file" accept="video/*" className="hidden" onChange={(e) => { onVideoFile(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
              {form.video && (
                <button type="button" onClick={() => set('video', '')} className={`${btnGhost} hover:!text-red-400`}>✕ Remove video</button>
              )}
            </div>
          </div>
          <Field label="Stock" hint="How many pieces you have. 0 = shows as out of stock.">
            <input type="number" value={form.stock || ''} onChange={(e) => set('stock', Number(e.target.value))} placeholder="e.g. 25" className={inputCls} />
          </Field>
          <Field label="Description" hint="Short selling text shown on the product page.">
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="e.g. Luxury preserved rose in a golden gift box…" rows={2} className="w-full rounded-md bg-white px-3 py-2.5 text-sm outline-none ring-1 ring-neutral-200 placeholder:text-neutral-500 focus:ring-gold sm:col-span-2" />
          </Field>
          <div className="sm:col-span-2">
            <div className="mb-1 text-xs font-semibold text-neutral-600">Badges</div>
            <div className="flex items-center gap-6 text-sm text-neutral-700">
              <label className="flex items-center gap-2" title="Shows in the Featured section on the homepage">
                <input type="checkbox" checked={!!form.featured} onChange={(e) => set('featured', e.target.checked)} className="accent-[#D4AF37]" /> ⭐ Featured
              </label>
              <label className="flex items-center gap-2" title="Shows in the flash-sale section with countdown">
                <input type="checkbox" checked={!!form.flashSale} onChange={(e) => set('flashSale', e.target.checked)} className="accent-[#D4AF37]" /> ⚡ Flash sale
              </label>
            </div>
            <div className="mt-1 text-[11px] text-neutral-400">Featured = homepage spotlight. Flash sale = countdown deals section.</div>
          </div>
        </div>
        <div className="mt-3 flex gap-3">
          {form.image && <img src={form.image} alt="preview" className="h-20 w-20 rounded object-cover ring-1 ring-gold/40" />}
          {videoUrl && <video src={videoUrl} className="h-20 w-20 rounded object-cover ring-1 ring-gold/40" muted playsInline />}
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={save} className={btnGold}>{editing ? 'Save changes' : 'Add product'}</button>
          {editing && (
            <button onClick={() => { setEditing(null); setForm(emptyProduct); }} className={btnGhost}>Cancel</button>
          )}
        </div>
        {msg && <div className="mt-2 text-xs font-medium text-neutral-700">{msg}</div>}
      </div>

      <div className="overflow-x-auto rounded-lg bg-white ring-1 ring-neutral-200">
        <table className="w-full min-w-[720px]">
          <thead><tr className="border-b border-neutral-200"><th className={thCls}>Img</th><th className={thCls}>Name</th><th className={thCls}>Price</th><th className={thCls}>Stock</th><th className={thCls}>Flags</th><th className={thCls}>Actions</th></tr></thead>
          <tbody>
            {db.products.map((p) => (
              <tr key={p.id} className="border-b border-neutral-200">
                <td className={tdCls}><MediaThumb image={p.image} video={p.video} /></td>
                <td className={tdCls}>{p.name}<div className="text-xs text-neutral-500">{p.category}</div></td>
                <td className={tdCls}>{money(p.price)}{p.oldPrice ? <span className="text-xs text-neutral-500 line-through"> {money(p.oldPrice)}</span> : null}</td>
                <td className={tdCls}>{p.stock}</td>
                <td className={tdCls}>{p.flashSale ? '⚡' : ''}{p.featured ? '⭐' : ''}</td>
                <td className={tdCls}>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(p); setForm({ ...p }); window.scrollTo(0, 0); }} className={btnGhost}>Edit</button>
                    <button onClick={() => del(p.id)} className={`${btnGhost} hover:!text-red-400`}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ───────────────────────── Promos ───────────────────────── */

const emptyPromo: Promo = {
  id: '',
  title: '',
  image: '',
  video: '',
  price: 0,
  oldPrice: undefined,
  offer: '',
  description: '',
  date: '',
};

function PromosTab({ db, persist }: { db: Db; persist: (d: Db) => void }) {
  const [form, setForm] = useState<Promo>(emptyPromo);
  const [editing, setEditing] = useState<Promo | null>(null);
  const [msg, setMsg] = useState('');
  const videoUrl = useMediaUrl(form.video);
  const set = (k: keyof Promo, v: string | number | undefined) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onImageFile = (file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 1200;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * scale));
      c.height = Math.max(1, Math.round(img.height * scale));
      c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      set('image', c.toDataURL('image/jpeg', 0.82));
      setMsg('Photo added from gallery.');
    };
    img.onerror = () => { URL.revokeObjectURL(url); setMsg('Could not read that photo.'); };
    img.src = url;
  };

  const onVideoFile = (file: File | undefined) =>
    pickGalleryVideo(file, (v) => set('video', v), setMsg);

  const save = () => {
    if (!form.video?.trim() && !form.description.trim()) {
      setMsg('Add a video or a description (at least one is required).');
      return;
    }
    const promo: Promo = {
      ...form,
      id: editing ? editing.id : uid('promo'),
      date: editing ? editing.date : new Date().toISOString(),
      oldPrice: form.oldPrice || undefined,
      offer: form.offer?.trim() || undefined,
      video: form.video?.trim() || undefined,
    };
    const promos = editing
      ? db.promos.map((p) => (p.id === editing.id ? promo : p))
      : [promo, ...db.promos];
    if (editing && editing.video !== form.video) dropIdbRef(editing.video);
    try {
      persist({ ...db, promos });
    } catch {
      setMsg('Storage full — video/photo too large. Use a smaller file or a link.');
      return;
    }
    setMsg(editing ? 'Promo updated.' : 'Promo posted.');
    setForm(emptyPromo);
    setEditing(null);
  };

  const del = (id: string) => {
    if (!confirm('Delete this promo?')) return;
    const gone = db.promos.find((p) => p.id === id);
    if (gone) dropIdbRef(gone.video);
    persist({ ...db, promos: db.promos.filter((p) => p.id !== id) });
  };

  return (
    <div>
      <div className="mb-4 rounded-lg bg-white p-5 ring-1 ring-neutral-200">
        <div className="mb-4 text-sm font-bold uppercase tracking-wider text-gold">
          {editing ? 'Edit promo' : 'New promo post'}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Promo title (optional)" className={`${inputCls} sm:col-span-2`} />
          <input type="number" value={form.price || ''} onChange={(e) => set('price', Number(e.target.value))} placeholder="Offer price (Rs.) — optional" className={inputCls} />
          <input type="number" value={form.oldPrice || ''} onChange={(e) => set('oldPrice', Number(e.target.value) || undefined)} placeholder="Original price (Rs.) — optional" className={inputCls} />
          <input value={form.offer || ''} onChange={(e) => set('offer', e.target.value)} placeholder="Offer label (optional, e.g. Festival Special −30%)" className={`${inputCls} sm:col-span-2`} />
          <div className="sm:col-span-2">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Photo & video — from gallery only</div>
            <div className="flex flex-wrap gap-2">
              <label className={`${btnGhost} cursor-pointer`}>
                📷 Photo from gallery (optional)
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { onImageFile(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
              <label className={`${btnGhost} cursor-pointer`}>
                🎥 Video from gallery *
                <input type="file" accept="video/*" className="hidden" onChange={(e) => { onVideoFile(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
              {form.video && (
                <button type="button" onClick={() => set('video', '')} className={`${btnGhost} hover:!text-red-400`}>✕ Remove video</button>
              )}
            </div>
          </div>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Description * — sell it here" rows={3} className="w-full rounded-md bg-white px-3 py-2.5 text-sm outline-none ring-1 ring-neutral-200 placeholder:text-neutral-500 focus:ring-gold sm:col-span-2" />
        </div>
        <div className="mt-3 flex gap-3">
          {form.image && <img src={form.image} alt="preview" className="h-20 w-20 rounded object-cover ring-1 ring-gold/40" />}
          {videoUrl && <video src={videoUrl} className="h-20 w-20 rounded object-cover ring-1 ring-gold/40" muted playsInline />}
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={save} className={btnGold}>{editing ? 'Save changes' : 'Post promo'}</button>
          {editing && (
            <button onClick={() => { setEditing(null); setForm(emptyPromo); }} className={btnGhost}>Cancel</button>
          )}
        </div>
        {msg && <div className="mt-2 text-xs font-medium text-neutral-700">{msg}</div>}
      </div>

      <div className="overflow-x-auto rounded-lg bg-white ring-1 ring-neutral-200">
        <table className="w-full min-w-[720px]">
          <thead><tr className="border-b border-neutral-200"><th className={thCls}>Media</th><th className={thCls}>Title</th><th className={thCls}>Price</th><th className={thCls}>Offer</th><th className={thCls}>Actions</th></tr></thead>
          <tbody>
            {db.promos.map((p) => (
              <tr key={p.id} className="border-b border-neutral-200">
                <td className={tdCls}><MediaThumb image={p.image} video={p.video} /></td>
                <td className={tdCls}>{p.title}<div className="text-xs text-neutral-500">{new Date(p.date).toLocaleDateString('en-LK')}</div></td>
                <td className={tdCls}>{money(p.price)}{p.oldPrice ? <span className="text-xs text-neutral-500 line-through"> {money(p.oldPrice)}</span> : null}</td>
                <td className={tdCls}>{p.offer || '—'}</td>
                <td className={tdCls}>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(p); setForm({ ...p }); window.scrollTo(0, 0); }} className={btnGhost}>Edit</button>
                    <button onClick={() => del(p.id)} className={`${btnGhost} hover:!text-red-400`}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ───────────────────────── Banners ───────────────────────── */

const emptyBanner: Banner = { id: '', title: '', sub: '', cta: 'Shop Now', link: '/', active: true };

function BannersTab({ db, persist }: { db: Db; persist: (d: Db) => void }) {
  const banners = db.banners || [];
  const [form, setForm] = useState<Banner>(emptyBanner);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [msg, setMsg] = useState('');
  const set = (k: keyof Banner, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.title.trim()) { setMsg('Banner title is required.'); return; }
    const banner: Banner = { ...form, id: editing ? editing.id : uid('banner') };
    const next = editing
      ? banners.map((b) => (b.id === editing.id ? banner : b))
      : [...banners, banner];
    persist({ ...db, banners: next });
    setMsg(editing ? 'Banner updated.' : 'Banner added.');
    setForm(emptyBanner);
    setEditing(null);
  };

  const del = (id: string) => {
    if (!confirm('Delete this banner?')) return;
    persist({ ...db, banners: banners.filter((b) => b.id !== id) });
  };

  const toggle = (b: Banner) => {
    persist({ ...db, banners: banners.map((x) => (x.id === b.id ? { ...x, active: !x.active } : x)) });
  };

  const move = (id: string, dir: -1 | 1) => {
    const arr = [...banners];
    const i = arr.findIndex((b) => b.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    persist({ ...db, banners: arr });
  };

  const edit = (b: Banner) => { setForm({ ...b }); setEditing(b); setMsg(''); };

  return (
    <div>
      <div className="mb-4 rounded-lg bg-ink-card p-5 ring-1 ring-royal/20">
        <div className="mb-4 text-sm font-bold uppercase tracking-wider text-gold">
          {editing ? 'Edit banner' : 'New banner'}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Banner title (e.g. Diwali Mega Sale)" className={`${inputCls} sm:col-span-2`} />
          <input value={form.sub} onChange={(e) => set('sub', e.target.value)} placeholder="Subtitle (e.g. Up to 50% off)" className={`${inputCls} sm:col-span-2`} />
          <input value={form.cta} onChange={(e) => set('cta', e.target.value)} placeholder="Button text (e.g. Shop Now)" className={inputCls} />
          <input value={form.link} onChange={(e) => set('link', e.target.value)} placeholder="Button link (e.g. /?cat=Gifts)" className={inputCls} />
          <label className="flex items-center gap-2 text-sm text-neutral-300 sm:col-span-2">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="h-4 w-4 accent-purple-600" />
            Active (show on home page)
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={save} className={btnGold}>{editing ? 'Update Banner' : 'Add Banner'}</button>
          {editing && <button onClick={() => { setForm(emptyBanner); setEditing(null); }} className={btnGhost}>Cancel</button>}
        </div>
        {msg && <div className="mt-2 text-sm text-gold">{msg}</div>}
      </div>

      <div className="space-y-2">
        {banners.map((b, i) => (
          <div key={b.id} className={`flex items-center gap-3 rounded-lg p-3 ring-1 ${b.active ? 'bg-ink-card ring-royal/20' : 'bg-ink-soft ring-neutral-700 opacity-60'}`}>
            <div className="flex flex-col gap-1">
              <button onClick={() => move(b.id, -1)} disabled={i === 0} className="text-neutral-400 hover:text-gold disabled:opacity-30">▲</button>
              <button onClick={() => move(b.id, 1)} disabled={i === banners.length - 1} className="text-neutral-400 hover:text-gold disabled:opacity-30">▼</button>
            </div>
            <div className="flex-1">
              <div className="font-bold text-gold">{b.title}</div>
              <div className="text-xs text-neutral-400">{b.sub} → {b.cta} ({b.link})</div>
            </div>
            <button onClick={() => toggle(b)} className={btnGhost}>{b.active ? 'Hide' : 'Show'}</button>
            <button onClick={() => edit(b)} className={btnGhost}>Edit</button>
            <button onClick={() => del(b.id)} className="rounded-md px-3 py-1.5 text-xs text-red-400 ring-1 ring-red-900 hover:ring-red-500">Delete</button>
          </div>
        ))}
        {banners.length === 0 && <div className="text-sm text-neutral-500">No banners yet. Add one above!</div>}
      </div>
    </div>
  );
}

/* ───────────────────────── Reviews ───────────────────────── */

function ReviewsTab({ db, persist }: { db: Db; persist: (d: Db) => void }) {
  const reviews = db.reviews || [];
  const pending = reviews.filter((r) => !r.approved);
  const approved = reviews.filter((r) => r.approved);

  const productName = (id: string) =>
    db.products.find((p) => p.id === id)?.name ?? id;

  const approve = (r: Review) =>
    persist({ ...db, reviews: reviews.map((x) => (x.id === r.id ? { ...x, approved: true } : x)) });

  const del = (r: Review) => {
    if (!confirm('Delete this review?')) return;
    persist({ ...db, reviews: reviews.filter((x) => x.id !== r.id) });
  };

  const card = (r: Review) => (
    <div key={r.id} className={`rounded-lg p-4 ring-1 ${r.approved ? 'bg-ink-card ring-royal/20' : 'bg-ink-card ring-gold/50'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-semibold text-gold">{r.name}</span>
          <span className="ml-2 text-gold">{'★'.repeat(r.rating)}<span className="text-neutral-600">{'★'.repeat(5 - r.rating)}</span></span>
          <div className="text-xs text-neutral-400">
            {productName(r.productId)} · {new Date(r.date).toLocaleString()}
          </div>
        </div>
        <div className="flex gap-2">
          {!r.approved && <button onClick={() => approve(r)} className={btnGold}>✓ Approve</button>}
          <button onClick={() => del(r)} className="rounded-md px-3 py-1.5 text-xs text-red-400 ring-1 ring-red-900 hover:ring-red-500">Delete</button>
        </div>
      </div>
      <p className="mt-2 text-sm text-neutral-300">{r.text}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 text-sm font-bold uppercase tracking-wider text-gold">
          ⏳ Pending approval ({pending.length})
        </div>
        {pending.length === 0 ? (
          <p className="text-sm text-neutral-500">Nothing waiting for approval.</p>
        ) : (
          <div className="space-y-2">{pending.map(card)}</div>
        )}
      </div>
      <div>
        <div className="mb-3 text-sm font-bold uppercase tracking-wider text-gold">
          ✅ Published ({approved.length})
        </div>
        {approved.length === 0 ? (
          <p className="text-sm text-neutral-500">No published reviews yet.</p>
        ) : (
          <div className="space-y-2">{approved.map(card)}</div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── Bulk import ───────────────────────── */

function BulkTab({ db, persist }: { db: Db; persist: (d: Db) => void }) {
  const [msg, setMsg] = useState('');

  // ── Gallery bulk drafts ──
  interface GalleryDraft {
    key: string;
    image: string; // dataURL (photo, or auto-captured video poster)
    video?: string; // idb: ref for videos
    previewUrl?: string; // transient object URL for video preview
    isVideo: boolean;
    name: string;
    price: string;
    oldPrice: string;
    category: string;
    stock: string;
    description: string;
  }
  const [drafts, setDrafts] = useState<GalleryDraft[]>([]);

  const setDraft = (key: string, k: keyof GalleryDraft, v: string) =>
    setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, [k]: v } : d)));

  const removeDraft = (key: string) => {
    const gone = drafts.find((d) => d.key === key);
    if (gone?.video) dropIdbRef(gone.video);
    if (gone?.previewUrl) URL.revokeObjectURL(gone.previewUrl);
    setDrafts((ds) => ds.filter((d) => d.key !== key));
  };

  /** Grab a poster frame from a video file (used as the product photo). */
  const capturePoster = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const done = (v: string) => resolve(v);
      const timer = setTimeout(() => done(''), 8000);
      try {
        const url = URL.createObjectURL(file);
        const v = document.createElement('video');
        v.muted = true;
        (v as HTMLVideoElement).playsInline = true;
        v.preload = 'auto';
        v.src = url;
        v.onloadeddata = () => { try { v.currentTime = Math.min(0.5, (v.duration || 1) / 2); } catch { /* noop */ } };
        v.onseeked = () => {
          clearTimeout(timer);
          try {
            const s = Math.min(1, 600 / Math.max(v.videoWidth || 600, v.videoHeight || 600));
            const c = document.createElement('canvas');
            c.width = Math.max(1, Math.round((v.videoWidth || 600) * s));
            c.height = Math.max(1, Math.round((v.videoHeight || 600) * s));
            c.getContext('2d')?.drawImage(v, 0, 0, c.width, c.height);
            URL.revokeObjectURL(url);
            done(c.toDataURL('image/jpeg', 0.75));
          } catch {
            done('');
          }
        };
        v.onerror = () => { clearTimeout(timer); URL.revokeObjectURL(url); done(''); };
      } catch {
        clearTimeout(timer);
        done('');
      }
    });

  const onGalleryFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setMsg('Reading gallery files…');
    const next: GalleryDraft[] = [];
    for (const file of Array.from(files)) {
      const base = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'New product';
      if (file.type.startsWith('image/')) {
        try {
          const dataUrl = await downscaleImageFile(file);
          next.push({ key: uid('d'), image: dataUrl, isVideo: false, name: base, price: '', oldPrice: '', category: 'Gifts', stock: '10', description: '' });
        } catch {
          /* skip unreadable */
        }
      } else if (file.type.startsWith('video/')) {
        if (file.size > MAX_VIDEO_BYTES) {
          setMsg(`"${file.name}" is over 500MB — skipped.`);
          continue;
        }
        try {
          const id = await saveMediaBlob(file);
          const poster = await capturePoster(file);
          next.push({
            key: uid('d'), image: poster, video: 'idb:' + id,
            previewUrl: URL.createObjectURL(file), isVideo: true,
            name: base, price: '', oldPrice: '', category: 'Gifts', stock: '10', description: '',
          });
        } catch {
          setMsg(`Could not save "${file.name}".`);
        }
      }
    }
    if (next.length > 0) {
      setDrafts((d) => [...d, ...next]);
      setMsg(`${next.length} file(s) ready — fill in the details below, then hit “Add all products”.`);
    }
  };

  const addAll = () => {
    const valid = drafts.filter((d) => d.name.trim() && Number(d.price) > 0 && (d.image || d.video));
    if (valid.length === 0) {
      setMsg('Fill name + price for at least one item (photo/video required).');
      return;
    }
    try {
      const products = [
        ...db.products,
        ...valid.map((d) => ({
          id: uid('p'),
          name: d.name.trim(),
          price: Number(d.price),
          oldPrice: d.oldPrice ? Number(d.oldPrice) || undefined : undefined,
          category: d.category,
          image: d.image,
          video: d.video || undefined,
          stock: d.stock ? Number(d.stock) : 10,
          description: d.description.trim() || d.name.trim(),
          featured: false,
          flashSale: false,
          rating: 4.5,
        })),
      ];
      persist({ ...db, products });
    } catch {
      setMsg('Storage full — some videos too large.');
      return;
    }
    setDrafts([]);
    setMsg(`✅ Added ${valid.length} product${valid.length === 1 ? '' : 's'} from gallery!`);
  };

  return (
    <div className="rounded-lg bg-white p-5 ring-1 ring-neutral-200">
      <div className="mb-2 text-sm font-bold uppercase tracking-wider text-gold">
        📷 Bulk from gallery — select many at once
      </div>
      <p className="mb-3 text-xs text-neutral-600">
        Pick multiple photos/videos from the gallery in one go, then fill in the details for each below
        and hit <b>“Add all products”</b>. Photos are auto-compressed; videos up to 500MB each.
      </p>
      <label className={`${btnGhost} cursor-pointer`}>
        🖼️ Select photos / videos from gallery
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => { onGalleryFiles(e.target.files); e.target.value = ''; }}
        />
      </label>

      {drafts.length > 0 && (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {drafts.map((d) => (
              <div key={d.key} className="rounded-lg p-3 ring-1 ring-neutral-200">
                <div className="flex gap-3">
                  {d.isVideo ? (
                    <video src={d.previewUrl} className="h-16 w-16 shrink-0 rounded object-cover" muted playsInline />
                  ) : (
                    <img src={d.image} alt="" className="h-16 w-16 shrink-0 rounded object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <Field label="Product name *">
                      <input value={d.name} onChange={(e) => setDraft(d.key, 'name', e.target.value)} placeholder="e.g. Golden Rose Gift Box" className={inputCls} />
                    </Field>
                  </div>
                  <button onClick={() => removeDraft(d.key)} className="h-8 shrink-0 text-xs text-neutral-400 hover:text-red-500" aria-label="Remove">✕</button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Field label="Price (Rs.) *">
                    <input type="number" value={d.price} onChange={(e) => setDraft(d.key, 'price', e.target.value)} placeholder="2490" className={inputCls} />
                  </Field>
                  <Field label="Old price (Rs.)" hint="For discount display">
                    <input type="number" value={d.oldPrice} onChange={(e) => setDraft(d.key, 'oldPrice', e.target.value)} placeholder="3490" className={inputCls} />
                  </Field>
                  <Field label="Category *">
                    <select value={d.category} onChange={(e) => setDraft(d.key, 'category', e.target.value)} className={inputCls}>
                      {['Girls', 'Boys', 'All', 'Gifts', 'Electronics', 'Fashion', 'Home'].map((c) => (
                        <option key={c} value={c}>{c === 'All' ? 'All (shows everywhere)' : c}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Stock">
                    <input type="number" value={d.stock} onChange={(e) => setDraft(d.key, 'stock', e.target.value)} placeholder="10" className={inputCls} />
                  </Field>
                </div>
                <div className="mt-2">
                  <Field label="Description">
                    <input value={d.description} onChange={(e) => setDraft(d.key, 'description', e.target.value)} placeholder="Short selling description" className={inputCls} />
                  </Field>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={addAll} className={btnGold}>⚡ Add all products ({drafts.length})</button>
            <button onClick={() => setDrafts([])} className={btnGhost}>Clear all</button>
          </div>
        </>
      )}
      {msg && <div className="mt-3 text-sm text-green-400">{msg}</div>}
    </div>
  );
}

/* ───────────────────────── Payment methods ───────────────────────── */

function PaymentsTab({ db, persist }: { db: Db; persist: (d: Db) => void }) {
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const save = () => {
    if (!name.trim()) return;
    let methods: PaymentMethod[];
    if (editingId) {
      methods = db.paymentMethods.map((m) => (m.id === editingId ? { ...m, name: name.trim(), details: details.trim() } : m));
    } else {
      methods = [...db.paymentMethods, { id: uid('pm'), name: name.trim(), details: details.trim() }];
    }
    persist({ ...db, paymentMethods: methods });
    setName(''); setDetails(''); setEditingId(null);
  };

  const del = (id: string) => {
    if (id === 'cod') { alert('Cash on Delivery is the default method and cannot be deleted.'); return; }
    if (!confirm('Delete this payment method?')) return;
    persist({ ...db, paymentMethods: db.paymentMethods.filter((m) => m.id !== id) });
  };

  return (
    <div>
      <div className="mb-4 rounded-lg bg-white p-5 ring-1 ring-neutral-200">
        <div className="mb-3 text-sm font-bold uppercase tracking-wider text-gold">{editingId ? 'Edit' : 'Add'} payment method</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g. Bank Transfer)" className={inputCls} />
          <input value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Details shown at checkout (e.g. BOC Akkaraipattu A/C 123456)" className={inputCls} />
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={save} className={btnGold}>{editingId ? 'Save' : 'Add method'}</button>
          {editingId && <button onClick={() => { setEditingId(null); setName(''); setDetails(''); }} className={btnGhost}>Cancel</button>}
        </div>
      </div>
      <div className="space-y-2">
        {db.paymentMethods.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-lg bg-white p-4 ring-1 ring-neutral-200">
            <div>
              <div className="text-sm font-semibold text-neutral-900">{m.name}</div>
              <div className="text-xs text-neutral-600">{m.details || '—'}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditingId(m.id); setName(m.name); setDetails(m.details); }} className={btnGhost}>Edit</button>
              <button onClick={() => del(m.id)} className={btnGhost}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── Coupons & offers ───────────────────────── */

function CouponsTab({ db, persist }: { db: Db; persist: (d: Db) => void }) {
  const [form, setForm] = useState<Coupon>({ code: '', kind: 'percent', value: 10, minOrder: 0, expiry: '2027-12-31', active: true });
  const [editing, setEditing] = useState<string | null>(null);
  const [flashEnd, setFlashEnd] = useState(db.settings.flashSaleEnd.slice(0, 16));

  const set = (k: keyof Coupon, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.code.trim()) return;
    const c: Coupon = { ...form, code: form.code.trim().toUpperCase() };
    const coupons = editing
      ? db.coupons.map((x) => (x.code === editing ? c : x))
      : [...db.coupons, c];
    persist({ ...db, coupons });
    setForm({ code: '', kind: 'percent', value: 10, minOrder: 0, expiry: '2027-12-31', active: true });
    setEditing(null);
  };

  const saveFlash = () => {
    persist({ ...db, settings: { ...db.settings, flashSaleEnd: new Date(flashEnd).toISOString() } });
    alert('Flash sale countdown updated.');
  };

  return (
    <div className="space-y-6">
      {/* Flash sale countdown setting */}
      <div className="rounded-lg bg-white p-5 ring-1 ring-neutral-200">
        <div className="mb-3 text-sm font-bold uppercase tracking-wider text-gold">⚡ Flash sale countdown ends at</div>
        <div className="flex gap-3">
          <input type="datetime-local" value={flashEnd} onChange={(e) => setFlashEnd(e.target.value)} className={`${inputCls} max-w-xs`} />
          <button onClick={saveFlash} className={btnGold}>Save</button>
        </div>
      </div>

      {/* Coupon form */}
      <div className="rounded-lg bg-white p-5 ring-1 ring-neutral-200">
        <div className="mb-1 text-sm font-bold uppercase tracking-wider text-gold">{editing ? 'Edit' : 'Add'} coupon / offer</div>
        <p className="mb-3 text-xs text-neutral-500">
          Coupons give customers a discount at checkout when they type the code.
          Example: code <b>DIWALI20</b>, type <b>% percent off</b>, value <b>20</b> → customer gets 20% off.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Coupon code *" hint="What the customer types at checkout. CAPS, no spaces. e.g. DIWALI20, WELCOME10">
            <input value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="e.g. DIWALI20" className={inputCls} />
          </Field>
          <Field label="Offer type *" hint="% percent off = percentage of the cart total. Rs. flat off = fixed rupees off.">
            <select value={form.kind} onChange={(e) => set('kind', e.target.value)} className={inputCls}>
              <option value="percent">% percent off</option>
              <option value="flat">Rs. flat off</option>
            </select>
          </Field>
          <Field
            label={form.kind === 'percent' ? 'Percent value *' : 'Rupees value *'}
            hint={form.kind === 'percent' ? 'e.g. 20 = 20% off. 100 = full 100% off (free!).' : 'e.g. 500 = Rs. 500 off the total.'}
          >
            <input type="number" value={form.value || ''} onChange={(e) => set('value', Number(e.target.value))} placeholder={form.kind === 'percent' ? 'e.g. 20' : 'e.g. 500'} className={inputCls} />
          </Field>
          <Field label="Minimum order (Rs.)" hint="Coupon works only if the cart total is at least this much. 0 = works on any order.">
            <input type="number" value={form.minOrder || ''} onChange={(e) => set('minOrder', Number(e.target.value))} placeholder="e.g. 1000" className={inputCls} />
          </Field>
          <Field label="Expiry date *" hint="After this date the coupon stops working automatically.">
            <input type="date" value={form.expiry} onChange={(e) => set('expiry', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Active?" hint="Turn off to pause the coupon without deleting it.">
            <label className="flex h-10 items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="accent-[#D4AF37]" /> Active
            </label>
          </Field>
        </div>
        {form.code.trim() && (
          <div className="mt-3 rounded-md bg-neutral-50 p-3 text-xs text-neutral-600 ring-1 ring-neutral-200">
            Preview: customer types <b className="text-gold">{form.code.trim().toUpperCase()}</b> on a Rs. 2,000 cart
            {form.minOrder > 2000 ? (
              <> → <b className="text-red-500">won't apply</b> (needs Rs. {form.minOrder.toLocaleString('en-LK')} minimum)</>
            ) : (
              <> → pays <b>{form.kind === 'percent'
                ? `Rs. ${(2000 * (1 - form.value / 100)).toLocaleString('en-LK')} (${form.value}% off)`
                : `Rs. ${Math.max(0, 2000 - form.value).toLocaleString('en-LK')} (Rs. ${form.value} off)`}</b></>
            )}
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <button onClick={save} className={btnGold}>{editing ? 'Save' : 'Add coupon'}</button>
          {editing && <button onClick={() => { setEditing(null); setForm({ code: '', kind: 'percent', value: 10, minOrder: 0, expiry: '2027-12-31', active: true }); }} className={btnGhost}>Cancel</button>}
        </div>
      </div>

      {/* Coupon list */}
      <div className="overflow-x-auto rounded-lg bg-white ring-1 ring-neutral-200">
        <table className="w-full min-w-[640px]">
          <thead><tr className="border-b border-neutral-200"><th className={thCls}>Code</th><th className={thCls}>Discount</th><th className={thCls}>Min order</th><th className={thCls}>Expiry</th><th className={thCls}>Active</th><th className={thCls}>Actions</th></tr></thead>
          <tbody>
            {db.coupons.map((c) => (
              <tr key={c.code} className="border-b border-neutral-200">
                <td className={`${tdCls} font-mono text-gold`}>{c.code}</td>
                <td className={tdCls}>{c.kind === 'percent' ? `${c.value}%` : money(c.value)}</td>
                <td className={tdCls}>{c.minOrder ? money(c.minOrder) : '—'}</td>
                <td className={tdCls}>{c.expiry}</td>
                <td className={tdCls}>{c.active ? '✅' : '❌'}</td>
                <td className={tdCls}>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(c.code); setForm({ ...c }); }} className={btnGhost}>Edit</button>
                    <button onClick={() => { if (confirm('Delete coupon?')) persist({ ...db, coupons: db.coupons.filter((x) => x.code !== c.code) }); }} className={btnGhost}>Delete</button>
                    <button onClick={() => persist({ ...db, coupons: db.coupons.map((x) => (x.code === c.code ? { ...x, active: !x.active } : x)) })} className={btnGhost}>
                      {c.active ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ───────────────────────── Orders ───────────────────────── */

function OrdersTab({ db, persist }: { db: Db; persist: (d: Db) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  // ── New manual order form ──
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cWhatsapp, setCWhatsapp] = useState('');
  const [cAddress, setCAddress] = useState('');
  const [cCity, setCCity] = useState('');
  const [cPayId, setCPayId] = useState('cod');
  const [cFee, setCFee] = useState('');
  const [cItems, setCItems] = useState<{ productId: string; qty: number }[]>([]);
  const [cPick, setCPick] = useState('');
  const [cMsg, setCMsg] = useState('');

  const setStatus = (o: Order, status: Order['status']) =>
    persist({ ...db, orders: db.orders.map((x) => (x.id === o.id ? { ...x, status } : x)) });

  const del = (o: Order) => {
    if (!confirm('Delete this order?')) return;
    persist({ ...db, orders: db.orders.filter((x) => x.id !== o.id) });
  };

  const addItem = () => {
    if (!cPick) return;
    setCItems((items) => {
      const found = items.find((i) => i.productId === cPick);
      if (found) return items.map((i) => (i.productId === cPick ? { ...i, qty: i.qty + 1 } : i));
      return [...items, { productId: cPick, qty: 1 }];
    });
    setCPick('');
  };

  const cSubtotal = cItems.reduce((s, i) => {
    const p = db.products.find((x) => x.id === i.productId);
    return s + (p ? p.price * i.qty : 0);
  }, 0);
  const cDeliveryFee = cFee.trim() === '' ? 0 : Number(cFee) || 0;

  const createOrder = () => {
    if (!cName.trim() || !cPhone.trim() || !cAddress.trim()) {
      setCMsg('Fill customer name, phone and address.');
      return;
    }
    if (cItems.length === 0) {
      setCMsg('Add at least one product.');
      return;
    }
    const order: Order = {
      id: uid('ORD'),
      customer: cName.trim(),
      phone: cPhone.trim(),
      whatsapp: cWhatsapp.trim() || undefined,
      address: cAddress.trim(),
      city: cCity.trim() || undefined,
      items: cItems.map((i) => {
        const p = db.products.find((x) => x.id === i.productId);
        return { productId: i.productId, name: p?.name ?? i.productId, price: p?.price ?? 0, qty: i.qty };
      }),
      subtotal: cSubtotal,
      discount: 0,
      deliveryFee: cDeliveryFee,
      total: cSubtotal + cDeliveryFee,
      paymentMethod: db.paymentMethods.find((m) => m.id === cPayId)?.name ?? cPayId,
      giftWrapFee: 0,
      status: 'pending',
      date: new Date().toISOString(),
    };
    persist({ ...db, orders: [order, ...db.orders] });
    setCName(''); setCPhone(''); setCWhatsapp(''); setCAddress(''); setCCity('');
    setCItems([]); setCFee(''); setCPayId('cod'); setCMsg('');
    setShowNew(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button onClick={() => setShowNew(!showNew)} className={btnGold}>
          {showNew ? '✕ Close' : '＋ New Order'}
        </button>
      </div>

      {showNew && (
        <div className="rounded-lg bg-white p-5 ring-1 ring-gold/40">
          <div className="mb-4 text-sm font-bold uppercase tracking-wider text-gold">New manual order</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Customer name *">
              <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="e.g. Fathima" className={inputCls} />
            </Field>
            <Field label="Phone *">
              <input value={cPhone} onChange={(e) => setCPhone(e.target.value)} placeholder="e.g. 0771234567" className={inputCls} />
            </Field>
            <Field label="WhatsApp number">
              <input value={cWhatsapp} onChange={(e) => setCWhatsapp(e.target.value)} placeholder="e.g. 0771234567" className={inputCls} />
            </Field>
            <Field label="City">
              <input value={cCity} onChange={(e) => setCCity(e.target.value)} placeholder="e.g. Akkaraipattu" className={inputCls} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Delivery address *">
                <input value={cAddress} onChange={(e) => setCAddress(e.target.value)} placeholder="Street, house no." className={inputCls} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Products *" hint="Pick a product, tap Add, repeat for more items.">
                <div className="flex gap-2">
                  <select value={cPick} onChange={(e) => setCPick(e.target.value)} className={inputCls} aria-label="Pick product">
                    <option value="">— Select product —</option>
                    {db.products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} — {money(p.price)}</option>
                    ))}
                  </select>
                  <button onClick={addItem} className={btnGold}>Add</button>
                </div>
              </Field>
              {cItems.length > 0 && (
                <div className="mt-2 space-y-1">
                  {cItems.map((i) => {
                    const p = db.products.find((x) => x.id === i.productId);
                    return (
                      <div key={i.productId} className="flex items-center justify-between rounded bg-neutral-50 px-3 py-1.5 text-sm ring-1 ring-neutral-200">
                        <span className="text-neutral-800">{p?.name}</span>
                        <span className="flex items-center gap-2">
                          <button onClick={() => setCItems((items) => items.map((x) => (x.productId === i.productId ? { ...x, qty: Math.max(1, x.qty - 1) } : x)))} className="px-2 font-bold text-neutral-500">−</button>
                          <span className="tabular-nums">{i.qty}</span>
                          <button onClick={() => setCItems((items) => items.map((x) => (x.productId === i.productId ? { ...x, qty: x.qty + 1 } : x)))} className="px-2 font-bold text-neutral-500">+</button>
                          <button onClick={() => setCItems((items) => items.filter((x) => x.productId !== i.productId))} className="text-xs text-red-400">✕</button>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <Field label="Delivery fee (Rs.)" hint="Leave empty or 0 for free delivery.">
              <input type="number" value={cFee} onChange={(e) => setCFee(e.target.value)} placeholder="e.g. 350" className={inputCls} />
            </Field>
            <Field label="Payment method">
              <select value={cPayId} onChange={(e) => setCPayId(e.target.value)} className={inputCls} aria-label="Payment method">
                {db.paymentMethods.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-3 rounded-md bg-neutral-50 p-3 text-sm ring-1 ring-neutral-200">
            <div className="flex justify-between text-neutral-700"><span>Subtotal</span><span className="tabular-nums">{money(cSubtotal)}</span></div>
            <div className="flex justify-between text-neutral-700"><span>Delivery</span><span className="tabular-nums">{cDeliveryFee > 0 ? money(cDeliveryFee) : 'FREE'}</span></div>
            <div className="flex justify-between pt-1 text-base font-bold"><span>Total</span><span className="text-gold tabular-nums">{money(cSubtotal + cDeliveryFee)}</span></div>
          </div>
          <div className="mt-3">
            <button onClick={createOrder} className={btnGold}>Create Order</button>
          </div>
          {cMsg && <div className="mt-2 text-xs font-medium text-red-400">{cMsg}</div>}
        </div>
      )}

      {db.orders.length === 0 && !showNew && (
        <div className="rounded-lg bg-white p-8 text-center text-neutral-600 ring-1 ring-neutral-200">No orders yet.</div>
      )}
      {db.orders.map((o) => (
        <div key={o.id} className="rounded-lg bg-white p-4 ring-1 ring-neutral-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-mono text-sm text-gold">{o.id}</span>
              <span className="ml-3 text-sm text-neutral-800">{o.customer} · {o.phone}</span>
              <div className="text-xs text-neutral-500">
                {new Date(o.date).toLocaleString()} · {o.paymentMethod} ·{' '}
                <span className={o.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}>{o.status}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gold">{money(o.total)}</span>
              <button onClick={() => setOpen(open === o.id ? null : o.id)} className={btnGhost}>Details</button>
              <select
                value={o.status}
                onChange={(e) => setStatus(o, e.target.value as Order['status'])}
                className="h-8 rounded-md bg-ink-card px-2 text-xs text-neutral-100 outline-none ring-1 ring-royal/30 focus:ring-gold"
                aria-label="Order status"
              >
                <option value="pending">📝 Pending</option>
                <option value="confirmed">✅ Confirmed</option>
                <option value="shipped">🚚 Shipped</option>
                <option value="delivered">📦 Delivered</option>
                <option value="completed">🎉 Completed</option>
                <option value="cancelled">❌ Cancelled</option>
              </select>
              <button onClick={() => del(o)} className={btnGhost}>Delete</button>
            </div>
          </div>
          {open === o.id && (
            <div className="mt-3 border-t border-neutral-200 pt-3 text-sm text-neutral-700">
              <div className="mb-1">📍 {o.address}{o.city ? `, ${o.city}` : ''}</div>
              {o.whatsapp && <div className="mb-1">💬 WhatsApp: {o.whatsapp}</div>}
              {o.coupon && <div className="mb-2 text-green-400">Coupon: {o.coupon} (−{money(o.discount)})</div>}
              {(o.giftWrapFee ?? 0) > 0 && (
                <div className="mb-2 text-gold">🎁 Gift wrapped (+{money(o.giftWrapFee)}){o.giftMessage ? ` — "${o.giftMessage}"` : ''}</div>
              )}
              <ul className="space-y-1">
                {o.items.map((i, idx) => (
                  <li key={idx}>• {i.name} × {i.qty} — {money(i.price * i.qty)}</li>
                ))}
              </ul>
              <div className="mt-2 space-y-0.5 border-t border-neutral-200 pt-2">
                <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{money(o.subtotal)}</span></div>
                {(o.deliveryFee ?? 0) > 0 && <div className="flex justify-between"><span>Delivery</span><span className="tabular-nums">{money(o.deliveryFee ?? 0)}</span></div>}
                <div className="flex justify-between font-bold"><span>Total</span><span className="text-gold tabular-nums">{money(o.total)}</span></div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── Settings ───────────────────────── */

function SettingsTab({ db, persist }: { db: Db; persist: (d: Db) => void }) {
  const [announcement, setAnnouncement] = useState(db.settings.announcement);
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [msg, setMsg] = useState('');

  const saveAnnouncement = () => {
    persist({ ...db, settings: { ...db.settings, announcement } });
    setMsg('Announcement banner updated.');
  };

  const changePw = () => {
    if (pw1.length < 6) { setMsg('Password must be at least 6 characters.'); return; }
    if (pw1 !== pw2) { setMsg('Passwords do not match.'); return; }
    persist({ ...db, settings: { ...db.settings, adminPasswordHash: hashPassword(pw1) } });
    setPw1(''); setPw2('');
    setMsg('Admin password changed.');
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'onelove-backup.json';
    a.click();
  };

  const importJson = (file: File | undefined) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(String(r.result)) as Db;
        if (!data.products || !data.settings) throw new Error('bad file');
        persist(data);
        setMsg('Backup restored.');
      } catch {
        setMsg('Invalid backup file.');
      }
    };
    r.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-5 ring-1 ring-neutral-200">
        <div className="mb-3 text-sm font-bold uppercase tracking-wider text-gold">Announcement banner</div>
        <div className="flex gap-3">
          <input value={announcement} onChange={(e) => setAnnouncement(e.target.value)} placeholder="Banner text (empty = hidden)" className={inputCls} />
          <button onClick={saveAnnouncement} className={btnGold}>Save</button>
        </div>
      </div>

      <div className="rounded-lg bg-white p-5 ring-1 ring-neutral-200">
        <div className="mb-3 text-sm font-bold uppercase tracking-wider text-gold">Change admin password</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} placeholder="New password" className={inputCls} />
          <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Confirm new password" className={inputCls} />
        </div>
        <button onClick={changePw} className={`${btnGold} mt-3`}>Change password</button>
      </div>

      <div className="rounded-lg bg-white p-5 ring-1 ring-neutral-200">
        <div className="mb-3 text-sm font-bold uppercase tracking-wider text-gold">Backup / restore</div>
        <div className="flex flex-wrap gap-3">
          <button onClick={exportJson} className={btnGold}>⬇ Export all data (JSON)</button>
          <label className={`${btnGhost} cursor-pointer !py-2 !px-4`}>
            ⬆ Import backup
            <input type="file" accept=".json" onChange={(e) => importJson(e.target.files?.[0])} className="hidden" />
          </label>
          <button
            onClick={() => { if (confirm('Reset store to demo data? All products, orders and settings will be replaced.')) persist(resetDb()); }}
            className={`${btnGhost} !py-2 !px-4 hover:!text-red-400`}
          >
            Reset to demo data
          </button>
        </div>
      </div>

      {msg && <div className="text-sm text-green-400">{msg}</div>}
    </div>
  );
}
