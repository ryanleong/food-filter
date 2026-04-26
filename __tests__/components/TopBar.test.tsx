import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TopBar from '@/components/TopBar';

describe('TopBar', () => {
  it('renders the FoodFilter wordmark linking to /', () => {
    render(<TopBar />);
    const link = screen.getByRole('link', { name: /foodfilter/i });
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders the ThemeSwitcher', () => {
    render(<TopBar />);
    // ThemeSwitcher renders a button to toggle theme
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
