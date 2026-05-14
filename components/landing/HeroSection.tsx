import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="bg-primary py-24 sm:py-32">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-primary-foreground">
          Mind Your Food
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-primary-foreground/80">
          Scan any menu. Instantly see what you can&apos;t eat.
        </p>
        <div className="mt-8">
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-card text-primary rounded-xl text-sm font-semibold hover:bg-muted transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
}
