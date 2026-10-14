'use client';
// Customer reviews: shows approved reviews for a product + form to submit one.
// New reviews need admin approval (Admin > Reviews) before they appear.

import { useEffect, useState } from 'react';
import { Review, loadDb, saveDb, uid } from '@/lib/store';

function StarsInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-2xl transition ${n <= value ? 'text-gold' : 'text-neutral-600 hover:text-gold/60'}`}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function StarsView({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="text-sm text-gold" aria-label={`${rating} stars`}>
      {'★'.repeat(full)}
      <span className="text-neutral-600">{'★'.repeat(5 - full)}</span>
    </span>
  );
}

export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    try {
      const db = loadDb();
      setReviews((db.reviews || []).filter((r) => r.productId === productId && r.approved));
    } catch {
      /* ignore */
    }
  }, [productId]);

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const submit = () => {
    if (!name.trim() || !text.trim()) {
      setMsg('Please add your name and review.');
      return;
    }
    try {
      const db = loadDb();
      const review: Review = {
        id: uid('rev'),
        productId,
        name: name.trim(),
        rating,
        text: text.trim(),
        date: new Date().toISOString(),
        approved: false,
      };
      saveDb({ ...db, reviews: [review, ...(db.reviews || [])] });
      setMsg('Thank you! Your review will appear after approval. 🙏');
      setName('');
      setText('');
      setRating(5);
      setShowForm(false);
    } catch {
      setMsg('Could not save your review. Please try again.');
    }
  };

  const inputCls =
    'h-10 w-full rounded-md bg-ink-card px-3 text-sm text-neutral-100 outline-none ring-1 ring-royal/30 placeholder:text-neutral-500 focus:ring-gold';

  return (
    <section className="mt-10 border-t border-royal/20 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gold">
          ⭐ Customer Reviews{' '}
          {avg && (
            <span className="text-sm font-normal text-neutral-400">
              {avg}/5 · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </span>
          )}
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md bg-gradient-to-r from-gold to-royal px-4 py-2 text-sm font-bold text-black hover:opacity-90"
          >
            ✍️ Write a Review
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg bg-ink-card p-5 ring-1 ring-royal/20">
          <div className="mb-3 text-sm font-bold uppercase tracking-wider text-gold">Your review</div>
          <div className="grid gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name *"
              className={inputCls}
              maxLength={40}
            />
            <div>
              <div className="mb-1 text-xs text-neutral-400">Rating</div>
              <StarsInput value={rating} onChange={setRating} />
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What did you think of this product? *"
              rows={3}
              maxLength={500}
              className="w-full rounded-md bg-ink-card px-3 py-2.5 text-sm text-neutral-100 outline-none ring-1 ring-royal/30 placeholder:text-neutral-500 focus:ring-gold"
            />
            <div className="flex gap-2">
              <button
                onClick={submit}
                className="rounded-md bg-gradient-to-r from-gold to-royal px-4 py-2 text-sm font-bold text-black hover:opacity-90"
              >
                Submit Review
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-md px-3 py-2 text-sm text-neutral-400 ring-1 ring-royal/30 hover:text-gold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {msg && <div className="mb-4 text-sm text-gold">{msg}</div>}

      {reviews.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No reviews yet — be the first to share your experience! 💛
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-lg bg-ink-card p-4 ring-1 ring-royal/20">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-neutral-100">{r.name}</div>
                <div className="text-xs text-neutral-500">
                  {new Date(r.date).toLocaleDateString()}
                </div>
              </div>
              <div className="mt-1">
                <StarsView rating={r.rating} />
              </div>
              <p className="mt-2 text-sm text-neutral-300">{r.text}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
