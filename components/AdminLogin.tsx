'use client';
// Header "Login" button: opens a password modal; correct password
// unlocks the admin area (same gate as /admin) and navigates there.

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { hashPassword, loadDb } from '@/lib/store';

export function isAdminAuthed(): boolean {
  try {
    return localStorage.getItem('onelove_admin') === '1';
  } catch {
    return false;
  }
}

export function AdminLoginButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  const click = () => {
    if (isAdminAuthed()) {
      router.push('/admin');
      return;
    }
    setPw('');
    setErr('');
    setOpen(true);
  };

  const login = () => {
    try {
      const db = loadDb();
      if (hashPassword(pw) === db.settings.adminPasswordHash) {
        localStorage.setItem('onelove_admin', '1');
        setOpen(false);
        router.push('/admin');
      } else {
        setErr('Wrong password.');
      }
    } catch {
      setErr('Something went wrong. Try again.');
    }
  };

  return (
    <>
      <button
        onClick={click}
        className="shrink-0 rounded-md bg-gradient-to-r from-gold to-royal px-3 py-1.5 text-sm font-bold text-black hover:opacity-90"
        aria-label="Admin login"
      >
        🔐 Login
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-ink-card p-6 text-center ring-1 ring-gold/40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-serif text-xl text-gold">Admin Access</div>
            <p className="mt-1 text-xs text-neutral-400">This area is private.</p>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && login()}
              placeholder="Enter admin password"
              autoFocus
              className="mt-5 h-11 w-full rounded-md bg-ink-soft px-3 text-sm text-neutral-100 outline-none ring-1 ring-royal/30 placeholder:text-neutral-500 focus:ring-gold"
            />
            {err && <div className="mt-2 text-xs text-red-400">{err}</div>}
            <button
              onClick={login}
              className="mt-4 w-full rounded-md bg-gradient-to-r from-gold to-royal py-2.5 font-bold text-black hover:opacity-90"
            >
              Unlock
            </button>
            <button
              onClick={() => setOpen(false)}
              className="mt-2 text-xs text-neutral-500 underline hover:text-gold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
