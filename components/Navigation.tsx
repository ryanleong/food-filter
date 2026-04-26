import Link from "next/link";

const links = [
  { href: '/scan', label: 'Scan' },
  { href: '/history', label: 'History' },
  { href: '/ingredients', label: 'Ingredients' },
];

const Navigation = () => {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
      <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
        <Link href="/" className="font-bold text-base">
          FoodFilter
        </Link>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
