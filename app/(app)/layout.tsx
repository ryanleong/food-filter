import { Suspense } from 'react';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<div className="sticky top-0 z-50 w-full h-14 border-b border-border bg-card" />}>
        <TopBar />
      </Suspense>
      <main className="pt-14 pb-16 lg:pb-0">
        {children}
      </main>
      <Suspense fallback={<div className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-border bg-card" />}>
        <BottomNav />
      </Suspense>
    </>
  );
}
