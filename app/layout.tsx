import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Geist } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import { BlacklistProvider } from '@/app/providers';

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

const geistSans = Geist({
  variable: '--font-geist-sans',
  display: 'swap',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TopBar />
          <BlacklistProvider>
            <main className="pb-16">
              {children}
            </main>
          </BlacklistProvider>
          <Suspense fallback={<div className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-background" />}>
            <BottomNav />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
