import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HistoryPage from '@/app/history/page';
import * as storage from '@/lib/storage';
import type { ScanRecord } from '@/lib/types';

vi.mock('@/lib/storage', () => ({
  getHistory: vi.fn(),
  deleteScanRecord: vi.fn(),
  clearHistory: vi.fn(),
}));

const mockGetHistory = vi.mocked(storage.getHistory);
const mockDeleteScanRecord = vi.mocked(storage.deleteScanRecord);
const mockClearHistory = vi.mocked(storage.clearHistory);

const HISTORY: ScanRecord[] = [
  {
    id: 'scan-2',
    createdAt: '2026-04-26T14:32:00.000Z',
    dishes: [
      {
        name: 'Pad Thai',
        riskLevel: 'high',
        blacklistedFound: ['peanuts'],
        allIngredients: ['peanuts', 'rice noodles'],
        source: 'both',
      },
      {
        name: 'Rice',
        riskLevel: 'low',
        blacklistedFound: [],
        allIngredients: ['rice'],
        source: 'menu',
      },
    ],
    blacklistSnapshot: ['peanuts'],
  },
  {
    id: 'scan-1',
    createdAt: '2026-04-25T10:00:00.000Z',
    dishes: [
      {
        name: 'Curry',
        riskLevel: 'medium',
        blacklistedFound: ['dairy'],
        allIngredients: ['dairy', 'curry paste'],
        source: 'model',
      },
    ],
    blacklistSnapshot: ['dairy'],
  },
];

function renderPage() {
  return render(<HistoryPage />);
}

describe('HistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetHistory.mockReturnValue([]);
  });

  it('renders the page heading', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: /scan history/i })).toBeInTheDocument();
  });

  it('shows the empty state when no scans are saved', async () => {
    renderPage();
    expect(await screen.findByText(/no scans yet\. scan a menu to get started\./i)).toBeInTheDocument();
  });

  it('renders newest-first history entries with summaries and view links', async () => {
    mockGetHistory.mockReturnValue(HISTORY);
    renderPage();

    expect(await screen.findByText(/2 dishes · 1 high risk · 0 medium risk/i)).toBeInTheDocument();
    expect(screen.getByText(/1 dish · 0 high risk · 1 medium risk/i)).toBeInTheDocument();

    const viewLinks = screen.getAllByRole('link', { name: /view/i });
    expect(viewLinks[0]).toHaveAttribute('href', '/history/scan-2');
    expect(viewLinks[1]).toHaveAttribute('href', '/history/scan-1');
  });

  it('shows inline confirm controls before deleting one entry', async () => {
    mockGetHistory.mockReturnValue(HISTORY);
    renderPage();

    await screen.findByText(/2 dishes · 1 high risk · 0 medium risk/i);
    await userEvent.click(screen.getByRole('button', { name: /delete scan from apr 26, 2026/i }));

    expect(screen.getByText(/are you sure\?/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /confirm delete/i }));

    expect(mockDeleteScanRecord).toHaveBeenCalledWith('scan-2');
    await waitFor(() => {
      expect(screen.queryByText(/2 dishes · 1 high risk · 0 medium risk/i)).not.toBeInTheDocument();
    });
  });

  it('clears all history after confirming in the dialog', async () => {
    mockGetHistory.mockReturnValue(HISTORY);
    renderPage();

    await screen.findByText(/2 dishes · 1 high risk · 0 medium risk/i);
    await userEvent.click(screen.getByRole('button', { name: /clear all history/i }));
    await userEvent.click(screen.getByRole('button', { name: /confirm clear history/i }));

    expect(mockClearHistory).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(screen.getByText(/no scans yet\. scan a menu to get started\./i)).toBeInTheDocument();
    });
  });
});