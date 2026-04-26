import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IngredientList } from '@/components/IngredientList';
import { BlacklistContext } from '@/app/providers';
import type { UseBlacklistReturn } from '@/lib/hooks/useBlacklist';

function renderWithContext(contextValue: Partial<UseBlacklistReturn> = {}) {
  const defaults: UseBlacklistReturn = {
    items: [],
    add: vi.fn(),
    remove: vi.fn(),
    ...contextValue,
  };
  return {
    ...render(
      <BlacklistContext.Provider value={defaults}>
        <IngredientList />
      </BlacklistContext.Provider>
    ),
    mockRemove: defaults.remove as ReturnType<typeof vi.fn>,
  };
}

describe('IngredientList', () => {
  it('shows empty-state message when there are no ingredients', () => {
    renderWithContext({ items: [] });
    expect(
      screen.getByText(/no ingredients yet/i)
    ).toBeInTheDocument();
  });

  it('does not show empty-state when items are present', () => {
    renderWithContext({ items: ['peanuts'] });
    expect(screen.queryByText(/no ingredients yet/i)).not.toBeInTheDocument();
  });

  it('renders a pill for each ingredient', () => {
    renderWithContext({ items: ['peanuts', 'dairy', 'gluten'] });
    expect(screen.getByText('peanuts')).toBeInTheDocument();
    expect(screen.getByText('dairy')).toBeInTheDocument();
    expect(screen.getByText('gluten')).toBeInTheDocument();
  });

  it('displays the correct count for one item', () => {
    renderWithContext({ items: ['peanuts'] });
    expect(screen.getByText('1 ingredient')).toBeInTheDocument();
  });

  it('displays the correct count for multiple items', () => {
    renderWithContext({ items: ['peanuts', 'dairy'] });
    expect(screen.getByText('2 ingredients')).toBeInTheDocument();
  });

  it('renders items in alphabetical order', () => {
    renderWithContext({ items: ['soy', 'dairy', 'almonds'] });
    const pills = screen.getAllByRole('button', { name: /^Remove/ });
    // aria-labels are "Remove almonds", "Remove dairy", "Remove soy"
    expect(pills[0]).toHaveAccessibleName('Remove almonds');
    expect(pills[1]).toHaveAccessibleName('Remove dairy');
    expect(pills[2]).toHaveAccessibleName('Remove soy');
  });

  it('calls remove with the ingredient name when × is clicked', async () => {
    const { mockRemove } = renderWithContext({ items: ['peanuts'] });
    await userEvent.click(screen.getByRole('button', { name: 'Remove peanuts' }));
    expect(mockRemove).toHaveBeenCalledWith('peanuts');
  });
});
