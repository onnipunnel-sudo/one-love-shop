'use client';
// Live countdown timer used by the Flash Sale section.

import { useEffect, useState } from 'react';

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export function Countdown({ endISO }: { endISO: string }) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const end = new Date(endISO).getTime();
  const diff = Math.max(0, end - now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600e3) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  if (diff <= 0) return <span className="text-sm text-neutral-400">Sale ended</span>;

  const cell = 'rounded bg-black/60 px-2 py-1 text-lg font-bold text-gold tabular-nums';
  return (
    <div className="flex items-center gap-1.5">
      <span className={cell}>{pad(h)}</span>
      <span className="text-gold">:</span>
      <span className={cell}>{pad(m)}</span>
      <span className="text-gold">:</span>
      <span className={cell}>{pad(s)}</span>
    </div>
  );
}
