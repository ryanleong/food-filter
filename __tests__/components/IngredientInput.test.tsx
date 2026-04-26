import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IngredientInput } from '@/components/IngredientInput';
import { BlacklistContext } from '@/app/providers';
import type { UseBlacklistReturn } from '@/lib/hooks/useBlacklist';

// Helper: render IngredientInput with a mock context value
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
        <IngredientInput />
      </BlacklistContext.Provider>
    ),
    mockAdd: defaults.add as ReturnType<typeof vi.fn>,
  };
}

describe('IngredientInput', () => {
  it('renders an input with placeholder text', () => {
    renderWithContext();
    expect(
      screen.getByPlaceholderText('e.g. peanuts, gluten, dairy…')
    ).toBeInTheDocument();
  });

  it('renders an Add button', () => {
    renderWithContext();
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('calls add with the typed value when Add is clicked', async () => {
    const { mockAdd } = renderWithContext();
    await userEvent.type(screen.getByRole('textbox'), 'peanuts');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(mockAdd).toHaveBeenCalledWith('peanuts');
  });

  it('calls add when Enter is pressed in the input', async () => {
    const { mockAdd } = renderWithContext();
    await userEvent.type(screen.getByRole('textbox'), 'dairy{Enter}');
    expect(mockAdd).toHaveBeenCalledWith('dairy');
  });

  it('clears the input after adding via button', async () => {
    renderWithContext();
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'gluten');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(input).toHaveValue('');
  });

  it('clears the input after adding via Enter', async () => {
    renderWithContext();
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'soy{Enter}');
    expect(input).toHaveValue('');
  });

  it('does not call add when input is empty and Add is clicked', async () => {
    const { mockAdd } = renderWithContext();
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(mockAdd).not.toHaveBeenCalled();
  });
});
