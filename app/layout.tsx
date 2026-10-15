import type { Metadata } from 'next';
import { CartProvider } from '@/lib/cart';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BottomNav } from '@/components/BottomNav';
import { WhatsAppFloat } from '@/components/WhatsAppFloat';
import { SupportChat } from '@/components/SupportChat';
import { OrderNotifier } from '@/components/OrderNotifier';
import './globals.css';

const SITE_URL = 'https://one-love-shop.vercel.app';
const SITE_NAME = 'ONE LOVE';
const DEFAULT_TITLE = 'ONE LOVE — Luxury Gifts & Lifestyle | Sri Lanka';
const DEFAULT_DESC =
  'ONE LOVE — Sri Lanka\'s luxury gift & lifestyle store. Shop gifts, electronics, fashion, home essentials and kids\' wear with islandwide delivery.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: '%s | ONE LOVE',
  },
  description: DEFAULT_DESC,
  keywords: [
    'One Love Shop',
    'One Love Sri Lanka',
    'online shopping Sri Lanka',
    'gifts Sri Lanka',
    'luxury gifts Akkaraipattu',
    'electronics Sri Lanka',
    'fashion Sri Lanka',
  ],
  authors: [{ name: 'ONE LOVE' }],
  creator: 'ONE LOVE',
  publisher: 'ONE LOVE',
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: SITE_URL + '/' },
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESC,
    url: SITE_URL + '/',
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_LK',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'ONE LOVE logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESC,
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: { icon: '/logo.png' },
  verification: { google: 'JF18x-6SjXWAHZAQ_h2nU4APsS5iDsJyLpxBXJ7wTxE' },
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ONE LOVE',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: DEFAULT_DESC,
  email: 'rusaikahamed86@gmail.com',
  telephone: '+94-75-134-6314',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Akkaraipattu',
    addressCountry: 'LK',
  },
  sameAs: [],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-ink text-neutral-100 antialiased">
        <CartProvider>
          <Header />
          <main className="mx-auto max-w-7xl px-4 pb-24">{children}</main>
          <Footer />
          <BottomNav />
          <WhatsAppFloat />
          <SupportChat />
          <OrderNotifier />
        </CartProvider>
      </body>
    </html>
  );
}
