import { describe, expect, it } from 'vitest';
import {
  currentCompetenciaMesAno,
  formatCompetenciaMesAno,
  parseCompetenciaMesAno,
} from './CompetenciaMesAnoInputs';

describe('parseCompetenciaMesAno', () => {
  it('parseia YYYY-MM', () => {
    expect(parseCompetenciaMesAno('2026-08')).toEqual({ year: '2026', month: '08' });
  });

  it('rejeita inválido', () => {
    expect(parseCompetenciaMesAno('08/2026')).toEqual({ year: '', month: '' });
    expect(parseCompetenciaMesAno('')).toEqual({ year: '', month: '' });
  });
});

describe('formatCompetenciaMesAno', () => {
  it('só formata com mês e ano', () => {
    expect(formatCompetenciaMesAno('2026', '08')).toBe('2026-08');
    expect(formatCompetenciaMesAno('2026', '')).toBeUndefined();
  });
});

describe('currentCompetenciaMesAno', () => {
  it('retorna YYYY-MM', () => {
    expect(currentCompetenciaMesAno()).toMatch(/^\d{4}-\d{2}$/);
  });
});
