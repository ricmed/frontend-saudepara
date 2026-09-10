import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PwaUpdateBanner } from './PwaUpdateBanner';
import {
  dismissPwaUpdatePrompt,
  notifyPwaNeedsRefresh,
  setPwaApplyUpdate,
} from '@/pwa/pwaUpdate';

describe('PwaUpdateBanner', () => {
  beforeEach(() => {
    dismissPwaUpdatePrompt();
    setPwaApplyUpdate(null);
  });

  it('stays hidden until a service worker update is waiting', () => {
    render(<PwaUpdateBanner />);
    expect(screen.queryByTestId('pwa-update-banner')).not.toBeInTheDocument();
  });

  it('asks the user to save and update, without applying until they click', async () => {
    const applyUpdate = vi.fn().mockResolvedValue(undefined);
    setPwaApplyUpdate(applyUpdate);
    render(<PwaUpdateBanner />);

    act(() => {
      notifyPwaNeedsRefresh();
    });

    expect(await screen.findByTestId('pwa-update-banner')).toBeInTheDocument();
    expect(screen.getByText(/Salve o que estiver preenchendo/i)).toBeInTheDocument();
    expect(applyUpdate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('pwa-update-later'));
    expect(screen.queryByTestId('pwa-update-banner')).not.toBeInTheDocument();
    expect(applyUpdate).not.toHaveBeenCalled();

    act(() => {
      notifyPwaNeedsRefresh();
    });
    fireEvent.click(await screen.findByTestId('pwa-update-now'));
    expect(applyUpdate).toHaveBeenCalledWith(true);
  });
});
