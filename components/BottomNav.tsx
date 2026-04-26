'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, Camera, Clock, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: House, exact: true },
  { href: '/scan', label: 'Scan', icon: Camera, exact: false },
  { href: '/history', label: 'History', icon: Clock, exact: false },
  { href: '/ingredients', label: 'Ingredients', icon: ListChecks, exact: false },
] as const;

const BottomNav = () => {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-background"
    >
      <ul className="flex h-full items-stretch">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-1 text-xs min-h-[44px]',
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground'
                )}
              >
                <Icon size={20} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default BottomNav;
