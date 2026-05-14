import type { Metadata } from 'next';
import { Fraunces, Outfit } from 'next/font/google';
import './globals.css';
import { AuthProvider, BlacklistProvider } from '@/app/providers';

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Mind Your Food',
  description: 'Know before you eat.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mind Your Food',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
};

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  display: 'swap',
  axes: ['opsz'],
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${outfit.variable} font-sans antialiased`}>
        <AuthProvider>
          <BlacklistProvider>
            {children}
          </BlacklistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
