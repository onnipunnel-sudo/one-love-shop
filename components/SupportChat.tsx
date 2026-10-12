'use client';

// Floating AI support agent for ONE LOVE shoppers ("Lova").
// Multilingual (Tamil / English / Sinhala / …) — the chat is answered
// server-side via /api/chat (Groq llama-3.3-70b-versatile), so no API
// key ever lives in the browser. Product context is sent with each request.

import { useEffect, useRef, useState } from 'react';
import { loadDb, money } from '@/lib/store';

interface Msg {
  role: 'user' | 'assistant';
  text: string;
}

function shopContext(): string {
  try {
    const db = loadDb();
    const lines = db.products.slice(0, 60).map(
      (p) => `- ${p.name} (${p.category}): ${money(p.price)}${p.oldPrice ? `, was ${money(p.oldPrice)}` : ''}, stock ${p.stock}. ${p.description || ''}`,
    );
    return [
      'Shop: ONE LOVE, Akkaraipattu, Sri Lanka. Luxury gifts & lifestyle store.',
      'Contact: hotline 075-1346314, WhatsApp chat on the site.',
      'Delivery: free islandwide delivery on orders over Rs. 5,000. Cash on Delivery available.',
      'Products:',
      ...lines,
    ].join('\n');
  } catch {
    return 'Shop: ONE LOVE, Akkaraipattu, Sri Lanka.';
  }
}

async function askLova(history: Msg[]): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: history.slice(-10),
      context: shopContext(),
    }),
  });
  if (res.status === 500) throw new Error('not-configured');
  if (!res.ok) throw new Error('request-failed');
  const data = await res.json();
  return data.reply || '…';
}

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    const next = [...msgs, { role: 'user' as const, text }];
    setMsgs(next);
    setBusy(true);
    try {
      const reply = await askLova(next);
      setMsgs([...next, { role: 'assistant', text: reply }]);
    } catch (e) {
      if ((e as Error).message === 'not-configured') setUnavailable(true);
      else setMsgs([...next, { role: 'assistant', text: 'Sorry, something went wrong — please try again or call 075-1346314.' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Chat with AI assistant"
        className="fixed bottom-20 left-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-black text-2xl shadow-lg shadow-black/40 ring-2 ring-gold transition-transform hover:scale-110"
      >
        {open ? '✕' : '💬'}
      </button>
      {open && (
        <div className="fixed bottom-36 left-5 z-50 flex h-[420px] w-[320px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-neutral-200">
          <div className="bg-black px-4 py-3 text-white">
            <div className="font-bold text-gold">Lova ✨</div>
            <div className="text-xs text-neutral-400">ONE LOVE AI helper — தமிழ் / English / සිංහල</div>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto bg-neutral-50 p-3">
            {unavailable ? (
              <div className="rounded-lg bg-white p-3 text-sm text-neutral-600 ring-1 ring-neutral-200">
                The AI helper isn&apos;t set up yet — please call <b>075-1346314</b> or use WhatsApp chat. 🙏
              </div>
            ) : (
              <>
                {msgs.length === 0 && (
                  <div className="rounded-lg bg-white p-3 text-sm text-neutral-600 ring-1 ring-neutral-200">
                    வணக்கம்! 🙏 How can I help you today? / මට උදව් කළ හැක්කේ කෙසේද?
                  </div>
                )}
                {msgs.map((m, i) => (
                  <div
                    key={i}
                    className={`max-w-[85%] rounded-lg p-2.5 text-sm ${
                      m.role === 'user'
                        ? 'ml-auto bg-gold text-black'
                        : 'bg-white text-neutral-800 ring-1 ring-neutral-200'
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
                {busy && <div className="text-xs text-neutral-400">Lova is typing…</div>}
              </>
            )}
            <div ref={bottomRef} />
          </div>
          {!unavailable && (
            <div className="flex gap-2 border-t border-neutral-200 p-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Type your question…"
                className="h-10 flex-1 rounded-md bg-white px-3 text-sm outline-none ring-1 ring-neutral-200 focus:ring-gold"
              />
              <button onClick={send} disabled={busy} className="rounded-md bg-gold px-4 text-sm font-bold text-black disabled:opacity-50">
                ➤
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
