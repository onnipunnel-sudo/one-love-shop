'use client';
// HIDDEN admin panel at /admin — no public link points here.
// Password gate first (default: onelove2026), then 6 tabs:
// Products, Bulk Import, Payment Methods, Coupons/Offers, Orders, Settings.

import { useState } from 'react';
import {
  Coupon,
  Db,
  Order,
  PaymentMethod,
  Product,
  Promo,
  hashPassword,
  loadDb,
  money,
  resetDb,
  saveDb,
  uid,
} from '@/lib/store';

const TABS = ['Products', 'Promos', 'Bulk Import', 'Payments', 'Coupons', 'Orders', 'Settings'] as const;

const inputCls =
  'h-10 w-full rounded-md bg-white px-3 text-sm text-neutral-900 outline-none ring-1 ring-neutral-200 placeholder:text-neutral-500 focus:ring-gold';
const btnGold = 'rounded-md bg-gold px-4 py-2 text-sm font-bold text-black hover:bg-gold-dark';
const btnGhost = 'rounded-md px-3 py-1.5 text-xs ring-1 ring-neutral-300 hover:ring-gold hover:text-gold';
const thCls = 'px-3 py-2 text-left text-xs uppercase tracking-wider text-neutral-500';
const tdCls = 'px-3 py-2 text-sm text-neutral-700';

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
    () => typeof window !== 'undefined' && sessionStorage.getItem('onelove_admin') === '1',
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
      sessionStorage.setItem('onelove_admin', '1');
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
            sessionStorage.removeItem('onelove_admin');
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

  const onVideoFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setMsg('Video too large (max 10MB) — use a shorter clip.');
      return;
    }
    const r = new FileReader();
    r.onload = () => { set('video', String(r.result)); setMsg('Video added from gallery.'); };
    r.onerror = () => setMsg('Could not read that video.');
    r.readAsDataURL(file);
  };

  const save = () => {
    if (!form.name.trim() || !form.price || !form.image) {
      setMsg('Name, price and image are required.');
      return;
    }
    let products: Product[];
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
    persist({ ...db, products: db.products.filter((p) => p.id !== id) });
  };

  return (
    <div>
      <div className="mb-4 rounded-lg bg-white p-5 ring-1 ring-neutral-200">
        <div className="mb-4 text-sm font-bold uppercase tracking-wider text-gold">
          {editing ? 'Edit product' : 'Add product'}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Product name *" className={inputCls} />
          <input value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Category (Gifts, Electronics, Fashion, Home)" className={inputCls} />
          <input type="number" value={form.price || ''} onChange={(e) => set('price', Number(e.target.value))} placeholder="Price (Rs.) *" className={inputCls} />
          <input type="number" value={form.oldPrice || ''} onChange={(e) => set('oldPrice', Number(e.target.value) || undefined)} placeholder="Old price (Rs., optional)" className={inputCls} />
          <div className="sm:col-span-2">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Photo & video — from gallery</div>
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
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input value={form.image} onChange={(e) => set('image', e.target.value)} placeholder="…or paste image URL" className={inputCls} />
              <input value={form.video || ''} onChange={(e) => set('video', e.target.value)} placeholder="…or paste video URL (mp4)" className={inputCls} />
            </div>
          </div>
          <input type="number" value={form.stock} onChange={(e) => set('stock', Number(e.target.value))} placeholder="Stock" className={inputCls} />
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Description" rows={2} className="w-full rounded-md bg-white px-3 py-2.5 text-sm outline-none ring-1 ring-neutral-200 placeholder:text-neutral-500 focus:ring-gold sm:col-span-2" />
          <div className="flex items-center gap-6 text-sm text-neutral-700">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!form.featured} onChange={(e) => set('featured', e.target.checked)} className="accent-[#D4AF37]" /> Featured
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!form.flashSale} onChange={(e) => set('flashSale', e.target.checked)} className="accent-[#D4AF37]" /> ⚡ Flash sale
            </label>
          </div>
        </div>
        <div className="mt-3 flex gap-3">
          {form.image && <img src={form.image} alt="preview" className="h-20 w-20 rounded object-cover ring-1 ring-gold/40" />}
          {form.video && <video src={form.video} className="h-20 w-20 rounded object-cover ring-1 ring-gold/40" muted playsInline />}
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
                <td className={tdCls}><img src={p.image} alt="" className="h-10 w-10 rounded object-cover" /></td>
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

  const onVideoFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setMsg('Video too large (max 10MB) — use a shorter clip.');
      return;
    }
    const r = new FileReader();
    r.onload = () => { set('video', String(r.result)); setMsg('Video added from gallery.'); };
    r.onerror = () => setMsg('Could not read that video.');
    r.readAsDataURL(file);
  };

  const save = () => {
    if (!form.title.trim() || !form.price || !form.image) {
      setMsg('Title, price and image are required.');
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
    persist({ ...db, promos: db.promos.filter((p) => p.id !== id) });
  };

  return (
    <div>
      <div className="mb-4 rounded-lg bg-white p-5 ring-1 ring-neutral-200">
        <div className="mb-4 text-sm font-bold uppercase tracking-wider text-gold">
          {editing ? 'Edit promo' : 'New promo post'}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Promo title *" className={`${inputCls} sm:col-span-2`} />
          <input type="number" value={form.price || ''} onChange={(e) => set('price', Number(e.target.value))} placeholder="Offer price (Rs.) *" className={inputCls} />
          <input type="number" value={form.oldPrice || ''} onChange={(e) => set('oldPrice', Number(e.target.value) || undefined)} placeholder="Original price (Rs.)" className={inputCls} />
          <input value={form.offer || ''} onChange={(e) => set('offer', e.target.value)} placeholder="Offer label (e.g. Festival Special −30%)" className={`${inputCls} sm:col-span-2`} />
          <div className="sm:col-span-2">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Photo & video — from gallery</div>
            <div className="flex flex-wrap gap-2">
              <label className={`${btnGhost} cursor-pointer`}>
                📷 Photo from gallery
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { onImageFile(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
              <label className={`${btnGhost} cursor-pointer`}>
                🎥 Video from gallery
                <input type="file" accept="video/*" className="hidden" onChange={(e) => { onVideoFile(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
              {form.video && (
                <button type="button" onClick={() => set('video', '')} className={`${btnGhost} hover:!text-red-400`}>✕ Remove video</button>
              )}
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input value={form.image} onChange={(e) => set('image', e.target.value)} placeholder="…or paste image URL" className={inputCls} />
              <input value={form.video || ''} onChange={(e) => set('video', e.target.value)} placeholder="…or paste video URL (mp4)" className={inputCls} />
            </div>
          </div>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Description — sell it here" rows={3} className="w-full rounded-md bg-white px-3 py-2.5 text-sm outline-none ring-1 ring-neutral-200 placeholder:text-neutral-500 focus:ring-gold sm:col-span-2" />
        </div>
        <div className="mt-3 flex gap-3">
          {form.image && <img src={form.image} alt="preview" className="h-20 w-20 rounded object-cover ring-1 ring-gold/40" />}
          {form.video && <video src={form.video} className="h-20 w-20 rounded object-cover ring-1 ring-gold/40" muted playsInline />}
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
                <td className={tdCls}>
                  {p.video
                    ? <video src={p.video} className="h-10 w-10 rounded object-cover" muted playsInline />
                    : <img src={p.image} alt="" className="h-10 w-10 rounded object-cover" />}
                </td>
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

/* ───────────────────────── Bulk import ───────────────────────── */function parseBulk(text: string): Omit<Product, 'id' | 'rating' | 'description'>[] {
  const out: Omit<Product, 'id' | 'rating' | 'description'>[] = [];
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    // name | price | oldPrice | category | imageURL | stock | videoURL(optional)
    const [name, price, oldPrice, category, image, stock, video] = line.split('|').map((s) => s.trim());
    if (!name || !price) continue;
    out.push({
      name,
      price: Number(price) || 0,
      oldPrice: oldPrice ? Number(oldPrice) || undefined : undefined,
      category: category || 'Gifts',
      image: image || `https://picsum.photos/seed/${encodeURIComponent(name)}/600/600`,
      video: video || undefined,
      stock: stock ? Number(stock) : 10,
      featured: false,
      flashSale: false,
    });
  }
  return out;
}

function BulkTab({ db, persist }: { db: Db; persist: (d: Db) => void }) {
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');

  const doImport = () => {
    const items = parseBulk(text);
    if (items.length === 0) {
      setMsg('Nothing to import — check the format (one product per line).');
      return;
    }
    const products = [
      ...db.products,
      ...items.map((it) => ({ ...it, id: uid('p'), rating: 4.5, description: it.name })),
    ];
    persist({ ...db, products });
    setMsg(`✅ Imported ${items.length} product${items.length === 1 ? '' : 's'} in one click!`);
    setText('');
  };

  const onCsv = (file: File | undefined) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      // CSV: name,price,oldPrice,category,imageURL,stock → convert commas to pipes
      const asPipes = String(r.result)
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => l.split(',').map((s) => s.trim()).join(' | '))
        .join('\n');
      setText(asPipes);
      setMsg('CSV loaded into the box below — review, then hit "Import all".');
    };
    r.readAsText(file);
  };

  return (
    <div className="rounded-lg bg-white p-5 ring-1 ring-neutral-200">
      <div className="mb-2 text-sm font-bold uppercase tracking-wider text-gold">
        Bulk import — 50+ items in 1 click
      </div>
      <p className="mb-3 text-xs text-neutral-600">
        One product per line, fields separated by <code className="text-gold">|</code>:
        <br />
        <code className="text-neutral-700">name | price | oldPrice | category | imageURL | stock | videoURL (optional)</code>
        <br />
        oldPrice and stock are optional. Lines starting with # are ignored.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        placeholder={'Golden Rose Gift Box | 2490 | 3490 | Gifts | https://picsum.photos/seed/rose/600/600 | 25\nBluetooth Earbuds Pro | 4990 | 6990 | Electronics | https://picsum.photos/seed/buds/600/600 | 40'}
        className="w-full rounded-md bg-white p-3 font-mono text-xs text-neutral-800 outline-none ring-1 ring-neutral-200 placeholder:text-neutral-600 focus:ring-gold"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button onClick={doImport} className={btnGold}>⚡ Import all</button>
        <label className={`${btnGhost} cursor-pointer`}>
          📄 Load .csv file
          <input type="file" accept=".csv,.txt" onChange={(e) => onCsv(e.target.files?.[0])} className="hidden" />
        </label>
        <span className="text-xs text-neutral-500">{db.products.length} products in store</span>
      </div>
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
        <div className="mb-3 text-sm font-bold uppercase tracking-wider text-gold">{editing ? 'Edit' : 'Add'} coupon / offer</div>
        <div className="grid gap-3 sm:grid-cols-3">
          <input value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="CODE (e.g. DIWALI20)" className={inputCls} />
          <select value={form.kind} onChange={(e) => set('kind', e.target.value)} className={inputCls}>
            <option value="percent">% percent off</option>
            <option value="flat">Rs. flat off</option>
          </select>
          <input type="number" value={form.value} onChange={(e) => set('value', Number(e.target.value))} placeholder="Value" className={inputCls} />
          <input type="number" value={form.minOrder} onChange={(e) => set('minOrder', Number(e.target.value))} placeholder="Min order Rs. (0 = none)" className={inputCls} />
          <input type="date" value={form.expiry} onChange={(e) => set('expiry', e.target.value)} className={inputCls} />
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="accent-[#D4AF37]" /> Active
          </label>
        </div>
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

  const setStatus = (o: Order, status: Order['status']) =>
    persist({ ...db, orders: db.orders.map((x) => (x.id === o.id ? { ...x, status } : x)) });

  const del = (o: Order) => {
    if (!confirm('Delete this order?')) return;
    persist({ ...db, orders: db.orders.filter((x) => x.id !== o.id) });
  };

  if (db.orders.length === 0)
    return <div className="rounded-lg bg-white p-8 text-center text-neutral-600 ring-1 ring-neutral-200">No orders yet.</div>;

  return (
    <div className="space-y-2">
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
              {o.status === 'pending' && (
                <button onClick={() => setStatus(o, 'completed')} className={btnGhost}>✓ Complete</button>
              )}
              <button onClick={() => del(o)} className={btnGhost}>Delete</button>
            </div>
          </div>
          {open === o.id && (
            <div className="mt-3 border-t border-neutral-200 pt-3 text-sm text-neutral-700">
              <div className="mb-2">📍 {o.address}</div>
              {o.coupon && <div className="mb-2 text-green-400">Coupon: {o.coupon} (−{money(o.discount)})</div>}
              <ul className="space-y-1">
                {o.items.map((i, idx) => (
                  <li key={idx}>• {i.name} × {i.qty} — {money(i.price * i.qty)}</li>
                ))}
              </ul>
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
