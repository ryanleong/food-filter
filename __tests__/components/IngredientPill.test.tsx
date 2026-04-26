import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IngredientPill } from '@/components/IngredientPill';

describe('IngredientPill', () => {
  it('renders the ingredient name', () => {
    render(<IngredientPill name="peanuts" onRemove={vi.fn()} />);
    expect(screen.getByText('peanuts')).toBeInTheDocument();
  });

  it('renders a remove button with accessible label', () => {
    render(<IngredientPill name="dairy" onRemove={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Remove dairy' })).toBeInTheDocument();
  });

  it('calls onRemove with the ingredient name when × is clicked', async () => {
    const onRemove = vi.fn();
    render(<IngredientPill name="gluten" onRemove={onRemove} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove gluten' }));
    expect(onRemove).toHaveBeenCalledOnce();
    expect(onRemove).toHaveBeenCalledWith('gluten');
  });
});
