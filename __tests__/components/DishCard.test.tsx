import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DishCard } from '@/components/DishCard';
import type { DishResult } from '@/lib/types';

const HIGH_DISH: DishResult = {
  name: 'Pad Thai',
  riskLevel: 'high',
  blacklistedFound: ['peanuts', 'soy sauce'],
  allIngredients: ['peanuts', 'soy sauce', 'rice noodles', 'tofu', 'egg'],
  source: 'both',
};

const MEDIUM_DISH: DishResult = {
  name: 'Green Curry',
  riskLevel: 'medium',
  blacklistedFound: ['dairy'],
  allIngredients: ['coconut milk', 'dairy', 'chicken', 'basil'],
  source: 'model',
};

const LOW_DISH: DishResult = {
  name: 'Steamed Rice',
  riskLevel: 'low',
  blacklistedFound: [],
  allIngredients: ['rice', 'water'],
  source: 'menu',
};

describe('DishCard', () => {
  it('renders the dish name', () => {
    render(<DishCard dish={HIGH_DISH} />);
    expect(screen.getByText('Pad Thai')).toBeInTheDocument();
  });

  it('renders the RiskBadge for the dish risk level', () => {
    render(<DishCard dish={HIGH_DISH} />);
    expect(screen.getByText('High Risk')).toBeInTheDocument();
  });

  it('shows "Contains:" line for a high-risk dish with blacklisted ingredients', () => {
    render(<DishCard dish={HIGH_DISH} />);
    expect(screen.getByText('Contains: peanuts, soy sauce')).toBeInTheDocument();
  });

  it('shows "Contains:" line for a medium-risk dish with blacklisted ingredients', () => {
    render(<DishCard dish={MEDIUM_DISH} />);
    expect(screen.getByText('Contains: dairy')).toBeInTheDocument();
  });

  it('does NOT show "Contains:" line for a low-risk dish', () => {
    render(<DishCard dish={LOW_DISH} />);
    expect(screen.queryByText(/Contains:/i)).not.toBeInTheDocument();
  });

  it('shows the expand toggle button with ingredient count', () => {
    render(<DishCard dish={HIGH_DISH} />);
    expect(
      screen.getByRole('button', { name: 'Show all ingredients (5)' }),
    ).toBeInTheDocument();
  });

  it('expand toggle has aria-expanded="false" by default', () => {
    render(<DishCard dish={HIGH_DISH} />);
    expect(
      screen.getByRole('button', { name: 'Show all ingredients (5)' }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('clicking expand reveals allIngredients and source note', async () => {
    render(<DishCard dish={HIGH_DISH} />);
    await userEvent.click(screen.getByRole('button', { name: 'Show all ingredients (5)' }));
    expect(
      screen.getByText('peanuts, soy sauce, rice noodles, tofu, egg'),
    ).toBeInTheDocument();
    expect(screen.getByText('Source: menu + AI knowledge')).toBeInTheDocument();
  });

  it('expand toggle label changes to "Hide ingredients" when expanded', async () => {
    render(<DishCard dish={HIGH_DISH} />);
    await userEvent.click(screen.getByRole('button', { name: 'Show all ingredients (5)' }));
    expect(screen.getByRole('button', { name: 'Hide ingredients' })).toBeInTheDocument();
  });

  it('aria-expanded is "true" when expanded', async () => {
    render(<DishCard dish={HIGH_DISH} />);
    await userEvent.click(screen.getByRole('button', { name: 'Show all ingredients (5)' }));
    expect(screen.getByRole('button', { name: 'Hide ingredients' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('clicking "Hide ingredients" collapses the section', async () => {
    render(<DishCard dish={HIGH_DISH} />);
    await userEvent.click(screen.getByRole('button', { name: 'Show all ingredients (5)' }));
    await userEvent.click(screen.getByRole('button', { name: 'Hide ingredients' }));
    expect(
      screen.queryByText('peanuts, soy sauce, rice noodles, tofu, egg'),
    ).not.toBeInTheDocument();
  });

  it('shows "Source: menu text" for source="menu"', async () => {
    render(<DishCard dish={LOW_DISH} />);
    await userEvent.click(screen.getByRole('button', { name: 'Show all ingredients (2)' }));
    expect(screen.getByText('Source: menu text')).toBeInTheDocument();
  });

  it('shows "Source: AI knowledge" for source="model"', async () => {
    render(<DishCard dish={MEDIUM_DISH} />);
    await userEvent.click(screen.getByRole('button', { name: 'Show all ingredients (4)' }));
    expect(screen.getByText('Source: AI knowledge')).toBeInTheDocument();
  });
});
