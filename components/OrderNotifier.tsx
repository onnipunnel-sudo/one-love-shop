'use client';

// In-website new-order notifications for the admin.
// When the admin is logged in (any page open on this device), this subscribes
// to the ntfy order topic via SSE. A customer checkout publishes to that topic,
// so the admin instantly sees an on-site toast + hears a chime + (if allowed)
// gets a browser notification — even with the tab in the background.

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { loadDb } from '@/lib/store';

const DEFAULT_TOPIC = 'onelove-orders-x7k2m9q4'; // seed default customers publish to

interface Toast {
  key: number;
  title: string;
  body: string;
  at: number;
}

function isAdminLoggedIn(): boolean {
  try {
    return localStorage.getItem('onelove_admin') === '1';
  } catch {
    return false;
  }
}

// Pleasant two-tone chime via Web Audio — no asset file needed.
function chime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [523.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.18 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.55);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch {
    /* audio is best-effort */
  }
}

export function OrderNotifier() {
  const [admin, setAdmin] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seenIds = useRef<Set<string>>(new Set());
  const sources = useRef<EventSource[]>([]);
  const keyRef = useRef(0);

  const pushToast = useCallback((title: string, body: string) => {
    const key = ++keyRef.current;
    setToasts((t) => [...t.slice(-2), { key, title, body, at: Date.now() }]);
    chime();
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const n = new Notification(title, { body, icon: '/logo.png', tag: `order-${key}` });
        n.onclick = () => {
          window.focus();
          window.location.href = '/admin';
          n.close();
        };
      }
    } catch {
      /* browser notification is best-effort */
    }
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.key !== key));
    }, 12000);
  }, []);

  const closeSources = useCallback(() => {
    sources.current.forEach((s) => s.close());
    sources.current = [];
  }, []);

  const subscribe = useCallback(
    (topics: string[]) => {
      closeSources();
      const uniq = [...new Set(topics.map((t) => t.trim()).filter(Boolean))];
      uniq.forEach((topic) => {
        try {
          const es = new EventSource(`https://ntfy.sh/${encodeURIComponent(topic)}/sse`);
          es.onmessage = (ev) => {
            try {
              const msg = JSON.parse(ev.data);
              if (msg.event === 'message' && msg.id && !seenIds.current.has(msg.id)) {
                seenIds.current.add(msg.id);
                // Only treat order alerts as order notifications
                const text: string = msg.message || '';
                if (/^order\s/i.test(text) || (msg.title || '').includes('ONE LOVE Order')) {
                  pushToast(msg.title || '🔔 New ONE LOVE Order!', text);
                }
              }
            } catch {
              /* ignore malformed frames */
            }
          };
          es.onerror = () => {
            /* EventSource auto-reconnects; nothing to do */
          };
          sources.current.push(es);
        } catch {
          /* SSE unsupported — toast simply won't appear */
        }
      });
    },
    [closeSources, pushToast]
  );

  useEffect(() => {
    // Detect admin login/logout without a page reload.
    const check = () => {
      const logged = isAdminLoggedIn();
      setAdmin((prev) => {
        if (logged !== prev) {
          if (logged) {
            try {
              if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission().catch(() => {});
              }
            } catch {
              /* ignore */
            }
          } else {
            closeSources();
          }
        }
        return logged;
      });
    };
    check();
    const id = setInterval(check, 2000);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'onelove_admin') check();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      clearInterval(id);
      window.removeEventListener('storage', onStorage);
    };
  }, [closeSources]);

  useEffect(() => {
    if (!admin) {
      closeSources();
      return;
    }
    // Subscribe to the admin's configured topic AND the default seed topic
    // (customers publish to the default unless their device knows a custom one).
    let topics = [DEFAULT_TOPIC];
    try {
      const db = loadDb();
      const custom = (db.settings.ntfyTopic || '').trim();
      if (custom) topics = [custom, DEFAULT_TOPIC];
    } catch {
      /* fall back to default topic */
    }
    subscribe(topics);
    return () => closeSources();
  }, [admin, subscribe, closeSources]);

  if (!admin || toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-20 right-3 z-[90] flex w-[calc(100%-1.5rem)] max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((t) => (
        <div
          key={t.key}
          className="pointer-events-auto overflow-hidden rounded-xl bg-ink-card shadow-2xl ring-2 ring-gold/60"
        >
          <div className="h-1 bg-gradient-to-r from-gold via-gold-light to-royal" />
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm font-extrabold text-gold">{t.title}</div>
              <button
                onClick={() => setToasts((x) => x.filter((y) => y.key !== t.key))}
                className="text-neutral-500 hover:text-neutral-200"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
            <div className="mt-1 text-sm text-neutral-200">{t.body}</div>
            <Link
              href="/admin"
              className="mt-3 inline-block rounded-lg bg-gold px-4 py-1.5 text-xs font-extrabold text-black hover:bg-gold-light"
            >
              View orders →
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
