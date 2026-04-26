import Link from 'next/link';
import { ThemeSwitcher } from '@/components/theme-switcher';

const TopBar = () => {
  return (
    <header className="sticky top-0 z-50 w-full h-14 border-b bg-background flex items-center px-4 justify-between">
      <Link href="/" className="font-bold text-lg tracking-tight">
        FoodFilter
      </Link>
      <ThemeSwitcher />
    </header>
  );
};

export default TopBar;
