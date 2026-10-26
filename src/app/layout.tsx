import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://eightbornv-watchparty.vercel.app'),
  title: 'EightbornV Kick Watchparty | Çoklu Yayın Takip & İzleme Merkezi',
  description:
    'Eightborn GTA V RP için profesyonel Kick çoklu yayın izleme, ekip/çete yönetimi ve gelişmiş ses mikseri platformu.',
  keywords: [
    'Eightborn',
    'EightbornV',
    'Kick',
    'Watchparty',
    'Multi stream',
    'GTA V RP',
    'RRaenee',
    'jantoo',
    'MRPD',
  ],
  authors: [{ name: 'EightbornV Community' }],
  icons: {
    icon: '/eightborn-logo.png',
    apple: '/eightborn-logo.png',
  },
  openGraph: {
    title: 'EightbornV Kick Watchparty | Çoklu Yayın Takip & İzleme Merkezi',
    description:
      'Eightborn GTA V RP için profesyonel Kick çoklu yayın izleme, ekip/çete yönetimi ve gelişmiş ses mikseri platformu.',
    url: 'https://eightbornv-watchparty.vercel.app',
    siteName: 'EightbornV Kick Watchparty',
    locale: 'tr_TR',
    type: 'website',
    images: [
      {
        url: '/eightborn-logo.png',
        width: 120,
        height: 120,
        alt: 'EightbornV Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'EightbornV Kick Watchparty',
    description:
      'Eightborn GTA V RP Kick çoklu yayın takip, çete/ekip yönetimi ve ses mikseri platformu.',
    images: ['/eightborn-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#0E0E11',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="dark" style={{ colorScheme: 'dark' }}>
      <body>{children}</body>
    </html>
  );
}
