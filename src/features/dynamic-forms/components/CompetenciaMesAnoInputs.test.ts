import { describe, expect, it } from 'vitest';
import {
  currentCompetenciaMesAno,
  formatCompetenciaFilter,
  formatCompetenciaMesAno,
  parseCompetenciaMesAno,
  quadrimestreLabelFromCompetenciaMonth,
} from './CompetenciaMesAnoInputs';

describe('parseCompetenciaMesAno', () => {
  it('parseia YYYY-MM', () => {
    expect(parseCompetenciaMesAno('2026-08')).toEqual({ year: '2026', month: '08' });
  });

  it('parseia YYYY (ano só)', () => {
    expect(parseCompetenciaMesAno('2026')).toEqual({ year: '2026', month: '' });
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

describe('formatCompetenciaFilter', () => {
  it('emite YYYY-MM quando mês e ano', () => {
    expect(formatCompetenciaFilter('2026', '08', true)).toBe('2026-08');
  });

  it('emite YYYY com allowYearOnly', () => {
    expect(formatCompetenciaFilter('2026', '', true)).toBe('2026');
    expect(formatCompetenciaFilter('2026', '', false)).toBe('');
  });
});

describe('currentCompetenciaMesAno', () => {
  it('retorna YYYY-MM', () => {
    expect(currentCompetenciaMesAno()).toMatch(/^\d{4}-\d{2}$/);
  });
});

describe('quadrimestreLabelFromCompetenciaMonth', () => {
  it('mapeia os 3 quadrimestres SESPA', () => {
    expect(quadrimestreLabelFromCompetenciaMonth('01')).toBe('1º quadrimestre (jan–abr)');
    expect(quadrimestreLabelFromCompetenciaMonth('04')).toBe('1º quadrimestre (jan–abr)');
    expect(quadrimestreLabelFromCompetenciaMonth('05')).toBe('2º quadrimestre (mai–ago)');
    expect(quadrimestreLabelFromCompetenciaMonth('08')).toBe('2º quadrimestre (mai–ago)');
    expect(quadrimestreLabelFromCompetenciaMonth('09')).toBe('3º quadrimestre (set–dez)');
    expect(quadrimestreLabelFromCompetenciaMonth('12')).toBe('3º quadrimestre (set–dez)');
  });

  it('sem mês válido retorna vazio', () => {
    expect(quadrimestreLabelFromCompetenciaMonth('')).toBe('');
    expect(quadrimestreLabelFromCompetenciaMonth('13')).toBe('');
  });
});
