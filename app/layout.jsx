import './globals.css';
import { config } from '@/lib/config';

const description = 'تصوير فوتوغرافي للبورتريه والمناسبات والأماكن. اختار صورتك واكلمنا على واتساب.';

export const metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'http://localhost:3000'),
  title: { default: config.studio, template: `%s | ${config.studio}` },
  description,
  icons: { icon: '/favicon.png', apple: '/apple-touch-icon.png' },
  openGraph: {
    title: config.studio,
    description,
    type: 'website',
    locale: 'ar_EG',
    siteName: config.studio,
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: config.studio }],
  },
  twitter: { card: 'summary_large_image', title: config.studio, description, images: ['/og.jpg'] },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="flex min-h-screen flex-col">
        <div className="bg-orbs" aria-hidden="true"><span /><span /><span /></div>
        {children}
      </body>
    </html>
  );
}
