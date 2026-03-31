import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDashboardDateRangeFilter } from './useDashboardTimeFilter';

const STORAGE_KEY = 'dashboard_date_range_filter';

describe('useDashboardDateRangeFilter', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('uses default config with filter disabled when nothing stored', () => {
    vi.useFakeTimers();
    // Fixed timestamp so "today" is deterministic regardless of machine TZ.
    vi.setSystemTime(new Date('2026-03-31T12:00:00.000Z'));

    const { result } = renderHook(() => useDashboardDateRangeFilter());

    expect(result.current.dateRangeConfig.enabled).toBe(false);
    // When disabled, the period is intentionally wide.
    // Avoid exact ISO assertions here because historical timezone offsets can vary by runtime/ICU.
    expect(result.current.periodStart.getUTCFullYear()).toBe(1900);
    expect(result.current.periodEnd.getUTCFullYear()).toBeGreaterThanOrEqual(2100);
  });

  it('loads config from localStorage and filters by period', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        startDate: '2026-03-10',
        startHour: 8,
        startMinute: 0,
        endDate: '2026-03-10',
        endHour: 9,
        endMinute: 0,
        enabled: true,
        selectedPublicos: [],
        selectedEstabelecimentos: [],
      }),
    );

    const { result } = renderHook(() => useDashboardDateRangeFilter());

    // 08:00 to 09:00 in Belem (UTC-3) == 11:00 to 12:00 UTC
    expect(result.current.periodStart.toISOString()).toBe('2026-03-10T11:00:00.000Z');
    expect(result.current.periodEnd.toISOString()).toBe('2026-03-10T12:00:59.999Z');

    const notifications = [
      { created_at: '2026-03-10T10:59:59.999Z', id: 1 }, // before
      { created_at: '2026-03-10T11:00:00.000Z', id: 2 }, // inside
      { created_at: '2026-03-10T12:00:59.999Z', id: 3 }, // inside
      { created_at: '2026-03-10T12:01:00.000Z', id: 4 }, // after
    ];

    const filtered = result.current.filterNotificationsByDateRange(notifications);
    expect(filtered.map((n) => n.id)).toEqual([2, 3]);
  });

  it('applies publico + estabelecimento filters when configured', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        startDate: '2026-03-10',
        startHour: 8,
        startMinute: 0,
        endDate: '2026-03-10',
        endHour: 9,
        endMinute: 0,
        enabled: true,
        selectedPublicos: [10],
        selectedEstabelecimentos: [99],
      }),
    );

    const { result } = renderHook(() => useDashboardDateRangeFilter());

    const inside = '2026-03-10T11:30:00.000Z';
    const notifications = [
      {
        id: 1,
        created_at: inside,
        original: { tipo_publico_idtipo_publico: 10, estabelecimento_idestabelecimento: 99 },
      },
      {
        id: 2,
        created_at: inside,
        original: { tipo_publico_idtipo_publico: 11, estabelecimento_idestabelecimento: 99 },
      },
      {
        id: 3,
        created_at: inside,
        original: { tipo_publico_idtipo_publico: 10, estabelecimento_idestabelecimento: 100 },
      },
      { id: 4, created_at: inside, original: { tipo_publico_idtipo_publico: 10 } }, // missing estabelecimento
      { id: 5, created_at: inside, original: { estabelecimento_idestabelecimento: 99 } }, // missing publico
    ];

    const filtered = result.current.filterNotificationsByDateRange(notifications);
    expect(filtered.map((n) => n.id)).toEqual([1]);
  });

  it('resetToDefault clears localStorage and disables filter', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        startDate: '2026-03-10',
        startHour: 8,
        startMinute: 0,
        endDate: '2026-03-10',
        endHour: 9,
        endMinute: 0,
        enabled: true,
        selectedPublicos: [1],
        selectedEstabelecimentos: [2],
      }),
    );

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-31T12:00:00.000Z'));

    const { result } = renderHook(() => useDashboardDateRangeFilter());
    expect(result.current.dateRangeConfig.enabled).toBe(true);

    act(() => {
      result.current.resetToDefault();
    });

    // resetToDefault removes then immediately persists the default config via useEffect.
    const saved = localStorage.getItem(STORAGE_KEY);
    expect(saved).not.toBeNull();
    expect(JSON.parse(saved as string).enabled).toBe(false);
    expect(result.current.dateRangeConfig.enabled).toBe(false);
    expect(result.current.isGlobalFilterActive()).toBe(false);
  });
});

