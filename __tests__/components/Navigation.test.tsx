import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Navigation from '@/components/Navigation';

describe('Navigation', () => {
  it('includes a history link in the main navigation', () => {
    render(<Navigation />);

    expect(screen.getByRole('link', { name: /history/i })).toHaveAttribute('href', '/history');
  });
});