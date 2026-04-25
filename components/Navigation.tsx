import Link from "next/link";

const Navigation = () => {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
      <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
        <Link href="/" className="font-bold text-base">
          FoodFilter
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;
