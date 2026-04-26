import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScanPage from '@/app/scan/page';
import { BlacklistProvider } from '@/app/providers';
import * as storage from '@/lib/storage';

vi.mock('@/lib/storage', () => ({
  getBlacklist: vi.fn(),
  saveBlacklist: vi.fn(),
}));

vi.mock('@/lib/hooks/useAnalyze', () => ({
  useAnalyze: () => ({
    status: 'idle',
    error: null,
    analyze: vi.fn(),
    reset: vi.fn(),
  }),
}));

const mockGetBlacklist = vi.mocked(storage.getBlacklist);

function renderPage() {
  return render(
    <BlacklistProvider>
      <ScanPage />
    </BlacklistProvider>
  );
}

function setOnlineState(isOnline: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value: isOnline,
  });
}

describe('ScanPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBlacklist.mockReturnValue(['peanuts']);
    setOnlineState(true);

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:menu-preview'),
      revokeObjectURL: vi.fn(),
    });
  });

  it('renders the page heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /scan a menu/i })).toBeInTheDocument();
  });

  it('shows an inline warning when the blacklist is empty', () => {
    mockGetBlacklist.mockReturnValue([]);
    renderPage();

    expect(screen.getByText(/your ingredient list is empty/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to my ingredients/i })).toHaveAttribute(
      'href',
      '/ingredients'
    );
  });

  it('shows a preview after uploading an image', async () => {
    renderPage();

    const uploadInput = document.getElementById('upload-image-input') as HTMLInputElement | null;
    const file = new File(['menu'], 'menu.jpg', { type: 'image/jpeg' });

    expect(uploadInput).not.toBeNull();
    await userEvent.upload(uploadInput as HTMLInputElement, file);

    expect(screen.getByRole('img', { name: /selected menu preview/i })).toHaveAttribute(
      'src',
      'blob:menu-preview'
    );
    expect(screen.getByText('menu.jpg')).toBeInTheDocument();
  });

  it('clears the selected image', async () => {
    renderPage();

    const uploadInput = document.getElementById('upload-image-input') as HTMLInputElement | null;
    const file = new File(['menu'], 'menu.jpg', { type: 'image/jpeg' });

    await userEvent.upload(uploadInput as HTMLInputElement, file);
    await userEvent.click(screen.getByRole('button', { name: /clear/i }));

    expect(screen.queryByRole('img', { name: /selected menu preview/i })).not.toBeInTheDocument();
    expect(screen.getByText(/no image selected/i)).toBeInTheDocument();
  });

  it('disables the Analyze Menu button when no image is selected', () => {
    renderPage();

    expect(screen.getByRole('button', { name: /analyze menu/i })).toBeDisabled();
  });

  it('shows a dismissible offline alert instead of proceeding when offline', async () => {
    renderPage();

    const uploadInput = document.getElementById('upload-image-input') as HTMLInputElement | null;
    const file = new File(['menu'], 'menu.jpg', { type: 'image/jpeg' });

    await userEvent.upload(uploadInput as HTMLInputElement, file);
    setOnlineState(false);
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(await screen.findByText(/no internet connection/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /dismiss offline alert/i }));
    expect(screen.queryByText(/no internet connection/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /analyze menu/i }));
    expect(await screen.findByText(/no internet connection/i)).toBeInTheDocument();
  });
});