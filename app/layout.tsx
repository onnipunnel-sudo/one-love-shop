import type { Metadata } from 'next';
import { CartProvider } from '@/lib/cart';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'ONE LOVE — Luxury Gifts & Lifestyle | Akkaraipattu',
  description: 'ONE LOVE — your luxury gift & lifestyle store in Akkaraipattu, Sri Lanka. Shop gifts, electronics, fashion and home essentials.',
  icons: { icon: '/logo.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink text-neutral-100 antialiased">
        <CartProvider>
          <Header />
          <main className="mx-auto max-w-7xl px-4">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
