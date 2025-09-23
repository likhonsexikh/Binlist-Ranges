import { GeistProvider, CssBaseline } from '@geist-ui/core';

// Correct metadata structure for App Router
export const metadata = {
  title: 'Binlist Ranges Scanner',
  description: 'Scan and enrich BIN/IIN ranges with country, bank, and prepaid details.',
  openGraph: {
    title: 'Binlist Ranges Scanner',
    type: 'website',
    url: 'https://binlist-ranges.vercel.app/',
    images: [
      {
        url: 'https://binlist-ranges.vercel.app/static/preview.png',
        width: 1200,
        height: 630,
        alt: 'Binlist Ranges Scanner Preview',
      },
    ],
    description: 'Fetches BIN ranges from multiple sources, dedupes, and enriches via Binlist API.',
    siteName: 'Binlist Ranges',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@likhonsheikh',
    title: 'Binlist Ranges Scanner',
    description: 'Enriched BIN/IIN database with live lookup support.',
    images: ['https://binlist-ranges.vercel.app/static/preview.png'],
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* The <head> tag is managed by Next.js via the metadata object.
          We can add things here that can't be in metadata, like external font links. */}
      <head>
        <link href="https://fonts.maateen.me/kalpurush/font.css" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Kalpurush', serif" }}>
        <GeistProvider>
          <CssBaseline />
          {children}
        </GeistProvider>
      </body>
    </html>
  );
}
