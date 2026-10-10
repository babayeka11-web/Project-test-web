import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { COMPANY } from '@/lib/domain/company';
import { SITE_URL } from '@/lib/site';
import { BetaNotice } from '@/components/layout/BetaNotice';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { JsonLd } from '@/components/layout/JsonLd';
import { MobileBar } from '@/components/layout/MobileBar';
import { SkipLink } from '@/components/layout/SkipLink';
import { THEME_SCRIPT } from '@/components/layout/theme';
import { Toaster } from '@/components/ui/Toast';
import './globals.css';

// Self-hosted fonts. Thai and Latin files are separate families split by unicode-range and chained in the
// --font-* stacks in globals.css. Only the Thai files are preloaded (small, used above the fold on every page).
const plexThai = localFont({
  src: [
    { path: '../fonts/ibm-plex-sans-thai-thai-400-normal.woff2', weight: '400' },
    { path: '../fonts/ibm-plex-sans-thai-thai-500-normal.woff2', weight: '500' },
    { path: '../fonts/ibm-plex-sans-thai-thai-600-normal.woff2', weight: '600' },
    { path: '../fonts/ibm-plex-sans-thai-thai-700-normal.woff2', weight: '700' },
  ],
  variable: '--font-plex-th',
  display: 'swap',
  adjustFontFallback: false,
  declarations: [{ prop: 'unicode-range', value: 'U+02D7, U+0303, U+0331, U+0E01-0E5B, U+200C-200D, U+25CC' }],
});
const plexLatin = localFont({
  src: [
    { path: '../fonts/ibm-plex-sans-thai-latin-400-normal.woff2', weight: '400' },
    { path: '../fonts/ibm-plex-sans-thai-latin-500-normal.woff2', weight: '500' },
    { path: '../fonts/ibm-plex-sans-thai-latin-600-normal.woff2', weight: '600' },
    { path: '../fonts/ibm-plex-sans-thai-latin-700-normal.woff2', weight: '700' },
  ],
  variable: '--font-plex-la',
  display: 'swap',
  preload: false,
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
  ],
});
const anuphanThai = localFont({
  src: [
    { path: '../fonts/anuphan-thai-500-normal.woff2', weight: '500' },
    { path: '../fonts/anuphan-thai-600-normal.woff2', weight: '600' },
    { path: '../fonts/anuphan-thai-700-normal.woff2', weight: '700' },
  ],
  variable: '--font-anuphan-th',
  display: 'swap',
  adjustFontFallback: false,
  declarations: [{ prop: 'unicode-range', value: 'U+02D7, U+0303, U+0331, U+0E01-0E5B, U+200C-200D, U+25CC' }],
});
const anuphanLatin = localFont({
  src: [
    { path: '../fonts/anuphan-latin-500-normal.woff2', weight: '500' },
    { path: '../fonts/anuphan-latin-600-normal.woff2', weight: '600' },
    { path: '../fonts/anuphan-latin-700-normal.woff2', weight: '700' },
  ],
  variable: '--font-anuphan-la',
  display: 'swap',
  preload: false,
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
  ],
});
const plexMono = localFont({
  src: [
    { path: '../fonts/ibm-plex-mono-latin-400-normal.woff2', weight: '400' },
    { path: '../fonts/ibm-plex-mono-latin-500-normal.woff2', weight: '500' },
    { path: '../fonts/ibm-plex-mono-latin-600-normal.woff2', weight: '600' },
  ],
  variable: '--font-plex-mono',
  display: 'swap',
  preload: false,
});

const fontVars = [plexThai, plexLatin, anuphanThai, anuphanLatin, plexMono].map((f) => f.variable).join(' ');

const DEFAULT_TITLE = 'ล้างแอร์ ติดตั้ง ซ่อมแอร์ กรุงเทพฯ และปริมณฑล · SBP AirCare';
const DESCRIPTION =
  'ล้างแอร์ ติดตั้ง ซ่อม และขายแอร์ทุกแบรนด์ในกรุงเทพฯ และปริมณฑล โดยทีมช่างของบริษัท สหบูรพากรุ๊ป ' +
  'ดูราคามาตรฐานก่อน VAT ได้ทันที จองล้างแอร์ออนไลน์ หรือขอใบเสนอราคาสำหรับบ้านและองค์กร';

const OG_ALT = 'SBP AirCare — ล้างแอร์ ติดตั้ง ซ่อม โดยทีมช่างของบริษัท สหบูรพากรุ๊ป กรุงเทพฯ และปริมณฑล';

export const metadata: Metadata = {
  metadataBase: new URL(`${SITE_URL}/`),
  title: { default: DEFAULT_TITLE, template: '%s · SBP AirCare' },
  description: DESCRIPTION,
  applicationName: COMPANY.brand,
  authors: [{ name: COMPANY.th, url: COMPANY.webUrl }],
  creator: COMPANY.th,
  publisher: COMPANY.th,
  keywords: ['ล้างแอร์', 'ติดตั้งแอร์', 'ซ่อมแอร์', 'ราคาแอร์', 'สัญญาล้างแอร์รายปี', 'กรุงเทพฯ', 'SBP AirCare', 'สหบูรพากรุ๊ป'],
  alternates: { canonical: './' },
  formatDetection: { telephone: false, email: false, address: false },
  // No title/description here: Next fills og:/twitter: title and description from each page's own metadata.
  // The share image is a plain public file with an absolute URL — the app/opengraph-image file convention prefixes
  // basePath onto a metadataBase that already ends in /Project-test-web/, which doubled the path on GitHub Pages.
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    siteName: COMPANY.brand,
    url: './',
    images: [{ url: `${SITE_URL}/og.jpg`, width: 1200, height: 630, type: 'image/jpeg', alt: OG_ALT }],
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f9fc' },
    { media: '(prefers-color-scheme: dark)', color: '#0a1220' },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={fontVars} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <SkipLink />
        <BetaNotice />
        <Header />
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <Footer />
        <MobileBar />
        <Toaster />
        <JsonLd />
      </body>
    </html>
  );
}
