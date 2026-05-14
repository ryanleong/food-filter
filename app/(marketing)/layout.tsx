import LandingNav from '@/components/LandingNav';
import LandingFooter from '@/components/LandingFooter';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LandingNav />
      <main>{children}</main>
      <LandingFooter />
    </>
  );
}
