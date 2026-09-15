import { describe, expect, it } from 'vitest';
import {
  addDaysIso,
  compareIsoDateOnly,
  getTodayIsoInBelem,
  parseIsoDateOnly,
} from '@/utils/timezoneUtils';

describe('date-only civil helpers (não alteram pipeline UTC do adapter)', () => {
  it('+/- 1 dia em YYYY-MM-DD sem o bug UTC midnight (UTC-3)', () => {
    // new Date('2026-09-15') em Belém virava dia 14; setDate(-1) ia para 13.
    expect(addDaysIso('2026-09-15', -1)).toBe('2026-09-14');
    expect(addDaysIso('2026-09-14', 1)).toBe('2026-09-15');
    expect(addDaysIso('2026-09-15', 1)).toBe('2026-09-16');
  });

  it('vira mês/ano sem desvio', () => {
    expect(addDaysIso('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDaysIso('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('compara datas civis', () => {
    expect(compareIsoDateOnly('2026-09-14', '2026-09-15')).toBe(-1);
    expect(compareIsoDateOnly('2026-09-15', '2026-09-15')).toBe(0);
  });

  it('hoje Belém é YYYY-MM-DD', () => {
    const today = getTodayIsoInBelem();
    expect(parseIsoDateOnly(today)).not.toBeNull();
  });
});
