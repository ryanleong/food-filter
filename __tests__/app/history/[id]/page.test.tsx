import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HistoryDetailPage from '@/app/history/[id]/page';
import * as storage from '@/lib/storage';
import type { ScanRecord } from '@/lib/types';

const mockPush = vi.fn();
const mockUseParams = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useParams: () => mockUseParams(),
}));

vi.mock('@/lib/storage', () => ({
  getHistory: vi.fn(),
}));

const mockGetHistory = vi.mocked(storage.getHistory);

const RECORD: ScanRecord = {
  id: 'scan-123',
  createdAt: '2026-04-26T14:32:00.000Z',
  dishes: [
    {
      name: 'Pad Thai',
      riskLevel: 'high',
      blacklistedFound: ['peanuts'],
      allIngredients: ['peanuts', 'rice noodles', 'egg'],
      source: 'both',
    },
    {
      name: 'Steamed Rice',
      riskLevel: 'low',
      blacklistedFound: [],
      allIngredients: ['rice', 'water'],
      source: 'menu',
    },
  ],
  blacklistSnapshot: ['peanuts', 'dairy'],
};

function renderPage(id = 'scan-123') {
  mockUseParams.mockReturnValue({ id });
  return render(HistoryDetailPage());
}

describe('HistoryDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetHistory.mockReturnValue([RECORD]);
    mockUseParams.mockReturnValue({ id: 'scan-123' });
  });

  it('renders the scan results for the selected history record', async () => {
    await renderPage();

    expect(await screen.findByRole('heading', { name: /scan details/i })).toBeInTheDocument();
    expect(screen.getByText('Pad Thai')).toBeInTheDocument();
    expect(screen.getByText('Steamed Rice')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to history/i })).toHaveAttribute('href', '/history');
  });

  it('shows the blacklist snapshot in a collapsible section', async () => {
    await renderPage();

    await screen.findByRole('heading', { name: /scan details/i });
    await userEvent.click(screen.getByRole('button', { name: /show saved blacklist/i }));

    expect(screen.getByText('peanuts')).toBeInTheDocument();
    expect(screen.getByText('dairy')).toBeInTheDocument();
  });

  it('redirects to /history when the record does not exist', async () => {
    await renderPage('missing-id');

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/history'));
  });
});