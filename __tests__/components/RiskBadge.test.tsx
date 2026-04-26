import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RiskBadge } from '@/components/RiskBadge';

describe('RiskBadge', () => {
  it('renders "High Risk" text for high level', () => {
    render(<RiskBadge level="high" />);
    expect(screen.getByText('High Risk')).toBeInTheDocument();
  });

  it('renders "Medium Risk" text for medium level', () => {
    render(<RiskBadge level="medium" />);
    expect(screen.getByText('Medium Risk')).toBeInTheDocument();
  });

  it('renders "Safe" text for low level', () => {
    render(<RiskBadge level="low" />);
    expect(screen.getByText('Safe')).toBeInTheDocument();
  });

  it('renders the emoji as aria-hidden for high level', () => {
    render(<RiskBadge level="high" />);
    const emoji = screen.getByText('⚠');
    expect(emoji).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders the emoji as aria-hidden for medium level', () => {
    render(<RiskBadge level="medium" />);
    const emoji = screen.getByText('⚡');
    expect(emoji).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders the emoji as aria-hidden for low level', () => {
    render(<RiskBadge level="low" />);
    const emoji = screen.getByText('✓');
    expect(emoji).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies red background class for high level', () => {
    render(<RiskBadge level="high" />);
    expect(screen.getByTestId('risk-badge')).toHaveClass('bg-red-600');
  });

  it('applies amber background class for medium level', () => {
    render(<RiskBadge level="medium" />);
    expect(screen.getByTestId('risk-badge')).toHaveClass('bg-amber-400');
  });

  it('applies green background class for low level', () => {
    render(<RiskBadge level="low" />);
    expect(screen.getByTestId('risk-badge')).toHaveClass('bg-green-600');
  });
});
