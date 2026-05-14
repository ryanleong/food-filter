import Link from 'next/link';

const LandingNav = () => {
  return (
    <header className="sticky top-0 z-50 w-full h-14 border-b border-border bg-card flex items-center justify-between px-4">
      {/* Logo */}
      <Link href="/" className="font-display text-xl font-semibold text-primary tracking-tight">
        Mind Your Food
      </Link>

      {/* Sign In */}
      <Link
        href="/login"
        className="px-4 py-2 border border-border bg-card text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors"
      >
        Sign In
      </Link>
    </header>
  );
};

export default LandingNav;
