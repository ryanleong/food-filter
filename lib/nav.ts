import { House, Camera, Clock, ListChecks } from 'lucide-react';

export const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: House, exact: true },
  { href: '/scan', label: 'Scan', icon: Camera, exact: false },
  { href: '/history', label: 'History', icon: Clock, exact: false },
  { href: '/ingredients', label: 'Ingredients', icon: ListChecks, exact: false },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];
