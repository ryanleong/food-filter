import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IngredientsPage from '@/app/ingredients/page';
import { BlacklistProvider } from '@/app/providers';

const mockGetBlacklist = vi.hoisted(() => vi.fn<() => Promise<string[]>>());
const mockAddItem = vi.hoisted(() => vi.fn<() => Promise<void>>());
const mockRemoveItem = vi.hoisted(() => vi.fn<() => Promise<void>>());

vi.mock('@/lib/db/blacklist', () => ({
  getBlacklist: mockGetBlacklist,
  addItem: mockAddItem,
  removeItem: mockRemoveItem,
}));

const mockUseAuth = vi.hoisted(() => vi.fn());
vi.mock('@/lib/hooks/useAuth', () => ({ useAuth: mockUseAuth }));

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
    mockGetBlacklist.mockResolvedValue([]);
    mockAddItem.mockResolvedValue(undefined);
    mockRemoveItem.mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({ user: { id: 'test-user' }, signOut: vi.fn() });
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
    mockGetBlacklist.mockResolvedValue(['peanuts']);
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Remove peanuts' }));
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

  it('pre-populates with existing blacklist from DB', async () => {
    mockGetBlacklist.mockResolvedValue(['dairy', 'eggs']);
    renderPage();
    expect(await screen.findByText('dairy')).toBeInTheDocument();
    expect(await screen.findByText('eggs')).toBeInTheDocument();
  });
});
