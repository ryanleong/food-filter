import Link from 'next/link';
import HomeClient from '@/app/components/HomeClient';

export default function Dashboard() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div className="flex flex-col gap-8">
        {/* Hero */}
        <div>
          <h1 className="font-display text-5xl font-bold tracking-tight text-primary leading-tight">
            Mind Your Food
          </h1>
          <p className="mt-2 text-lg text-muted-foreground font-sans">
            Scan menus. Eat safely.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/scan"
            className="flex-1 text-center bg-primary text-primary-foreground font-sans font-semibold rounded-xl px-6 py-3 text-base transition-opacity hover:opacity-90 active:opacity-80"
          >
            Scan a Menu
          </Link>
          <Link
            href="/ingredients"
            className="flex-1 text-center border border-border text-foreground font-sans font-semibold rounded-xl px-6 py-3 text-base bg-card transition-colors hover:bg-muted active:bg-muted"
          >
            Manage Ingredients
          </Link>
        </div>

        <HomeClient />
      </div>
    </div>
  );
}
