'use client';
// Header "Admin" button: visible ONLY when this browser is logged in as admin
// (one-time password via /admin sets localStorage 'onelove_admin' for life).
// Tapping it opens /admin. Public visitors see nothing here.

import Link from 'next/link';
import { useEffect, useState } from 'react';

export function isAdminAuthed(): boolean {
  try {
    return localStorage.getItem('onelove_admin') === '1';
  } catch {
    return false;
  }
}

export function AdminNavButton() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const check = () => setAuthed(isAdminAuthed());
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
  }, []);

  if (!authed) return null;

  return (
    <Link
      href="/admin"
      className="shrink-0 rounded-md bg-gradient-to-r from-gold to-royal px-3 py-1.5 text-sm font-bold text-black hover:opacity-90"
      aria-label="Admin"
    >
      👑 Admin
    </Link>
  );
}
