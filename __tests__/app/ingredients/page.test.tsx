import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IngredientsPage from '@/app/ingredients/page';
import { BlacklistProvider } from '@/app/providers';
import * as storage from '@/lib/storage';

// Mock storage so tests start with a clean slate
vi.mock('@/lib/storage', () => ({
  getBlacklist: vi.fn(),
  saveBlacklist: vi.fn(),
}));

const mockGetBlacklist = vi.mocked(storage.getBlacklist);

// Render the page inside the real BlacklistProvider backed by mocked storage
function renderPage() {
  return render(
    <BlacklistProvider>
      <IngredientsPage />
    </BlacklistProvider>
  );
}

describe('IngredientsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBlacklist.mockReturnValue([]);
  });

  it('renders the page heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /my ingredients/i })).toBeInTheDocument();
  });

  it('shows empty state on first visit', () => {
    renderPage();
    expect(screen.getByText(/no ingredients yet/i)).toBeInTheDocument();
  });

  it('adds an ingredient via the Add button', async () => {
    renderPage();
    await userEvent.type(screen.getByRole('textbox'), 'peanuts');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(screen.getByText('peanuts')).toBeInTheDocument();
  });

  it('adds an ingredient via the Enter key', async () => {
    renderPage();
    await userEvent.type(screen.getByRole('textbox'), 'dairy{Enter}');
    expect(screen.getByText('dairy')).toBeInTheDocument();
  });

  it('clears the input after adding', async () => {
    renderPage();
    await userEvent.type(screen.getByRole('textbox'), 'gluten{Enter}');
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('removes an ingredient when × is clicked', async () => {
    mockGetBlacklist.mockReturnValue(['peanuts']);
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Remove peanuts' }));
    expect(screen.queryByText('peanuts')).not.toBeInTheDocument();
    expect(screen.getByText(/no ingredients yet/i)).toBeInTheDocument();
  });

  it('shows correct count after adding items', async () => {
    renderPage();
    await userEvent.type(screen.getByRole('textbox'), 'nuts{Enter}');
    await userEvent.type(screen.getByRole('textbox'), 'soy{Enter}');
    expect(screen.getByText('2 ingredients')).toBeInTheDocument();
  });

  it('does not add a duplicate ingredient', async () => {
    renderPage();
    await userEvent.type(screen.getByRole('textbox'), 'nuts{Enter}');
    await userEvent.type(screen.getByRole('textbox'), 'nuts{Enter}');
    expect(screen.getByText('1 ingredient')).toBeInTheDocument();
  });

  it('pre-populates with existing blacklist from storage', async () => {
    mockGetBlacklist.mockReturnValue(['dairy', 'eggs']);
    renderPage();
    expect(await screen.findByText('dairy')).toBeInTheDocument();
    expect(await screen.findByText('eggs')).toBeInTheDocument();
  });
});
