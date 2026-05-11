import Link from 'next/link';
import { Button } from '@/components/ui/button';
import HomeClient from '@/app/components/HomeClient';

export default function Dashboard() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">FoodFilter</h1>
          <p className="mt-2 text-lg text-muted-foreground">Filter menus. Eat safely.</p>
        </div>

        <div className="flex gap-3">
          <Button asChild>
            <Link href="/scan">Scan a Menu</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/ingredients">Manage Ingredients</Link>
          </Button>
        </div>

        <HomeClient />
      </div>
    </div>
  );
}
