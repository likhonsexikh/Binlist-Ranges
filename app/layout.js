import { GeistProvider, CssBaseline } from '@geist-ui/core';
import Head from 'next/head';

export const metadata = {
  title: 'Binlist Ranges Scanner',
  description: 'Scan and enrich BIN/IIN ranges with country, bank, and prepaid details.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Head>
        {/* The Kalpurush font import */}
        <link href="https://fonts.maateen.me/kalpurush/font.css" rel="stylesheet" />

        {/* Open Graph & Twitter meta tags can be managed here or in page.js metadata */}
        <meta property="og:title" content="Binlist Ranges Scanner" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://binlist-ranges.vercel.app/" />
        <meta property="og:image" content="https://binlist-ranges.vercel.app/static/preview.png" />
        <meta property="og:description" content="Fetches BIN ranges from multiple sources, dedupes, and enriches via Binlist API." />
        <meta property="og:site_name" content="Binlist Ranges" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:creator" content="@likhonsheikh" />
        <meta name="twitter:title" content="Binlist Ranges Scanner" />
        <meta name="twitter:description" content="Enriched BIN/IIN database with live lookup support." />
        <meta name="twitter:image" content="https://binlist-ranges.vercel.app/static/preview.png" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body style={{ fontFamily: "'Kalpurush', serif" }}>
        <GeistProvider>
          <CssBaseline />
          {children}
        </GeistProvider>
      </body>
    </html>
  );
}
