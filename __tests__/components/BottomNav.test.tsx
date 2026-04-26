import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import BottomNav from '@/components/BottomNav';

// Mock usePathname so we can control the active route in each test
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from 'next/navigation';

describe('BottomNav', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/');
  });

  it('renders all four nav items', () => {
    render(<BottomNav />);
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /scan/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /history/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ingredients/i })).toBeInTheDocument();
  });

  it('links point to the correct hrefs', () => {
    render(<BottomNav />);
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /scan/i })).toHaveAttribute('href', '/scan');
    expect(screen.getByRole('link', { name: /history/i })).toHaveAttribute('href', '/history');
    expect(screen.getByRole('link', { name: /ingredients/i })).toHaveAttribute('href', '/ingredients');
  });

  it('marks Home as active on the root path', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    render(<BottomNav />);
    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink).toHaveClass('text-primary');
  });

  it('marks Scan as active on /scan', () => {
    vi.mocked(usePathname).mockReturnValue('/scan');
    render(<BottomNav />);
    const scanLink = screen.getByRole('link', { name: /scan/i });
    expect(scanLink).toHaveClass('text-primary');
  });

  it('marks History as active on /history/some-id', () => {
    vi.mocked(usePathname).mockReturnValue('/history/abc-123');
    render(<BottomNav />);
    const historyLink = screen.getByRole('link', { name: /history/i });
    expect(historyLink).toHaveClass('text-primary');
  });

  it('does not mark Home as active on /scan', () => {
    vi.mocked(usePathname).mockReturnValue('/scan');
    render(<BottomNav />);
    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink).not.toHaveClass('text-primary');
  });
});
