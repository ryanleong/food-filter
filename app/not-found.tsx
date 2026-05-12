import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-20 flex flex-col items-center gap-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Go Home
      </Link>
    </div>
  );
}
