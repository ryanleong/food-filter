import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Fraunces, Outfit } from 'next/font/google';
import './globals.css';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import { AuthProvider, BlacklistProvider } from '@/app/providers';

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'FoodFilter',
  description: 'Avoid unwanted ingredients when dining out',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FoodFilter',
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
            <Suspense fallback={<div className="sticky top-0 z-50 w-full h-14 border-b border-border bg-card" />}>
              <TopBar />
            </Suspense>
            <main className="pb-16 lg:pb-0">
              {children}
            </main>
            <Suspense fallback={<div className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-border bg-card" />}>
              <BottomNav />
            </Suspense>
          </BlacklistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
