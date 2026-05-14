import Link from 'next/link';

const YEAR = 2026;

const LandingFooter = () => {

  return (
    <footer className="bg-card border-t border-border px-4 py-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Brand */}
        <div>
          <p className="font-display font-semibold text-primary">Mind Your Food</p>
          <p className="text-sm text-muted-foreground mt-0.5">Know before you eat.</p>
        </div>

        {/* Links */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>&copy; {YEAR} Mind Your Food</span>
          <Link
            href="/login"
            className="text-foreground font-medium hover:text-primary transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
