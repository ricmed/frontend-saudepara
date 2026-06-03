import { describe, it, expect } from 'vitest';
import {
  calcularIdadeMesesFromBirthDate,
  formatIdadeMesesParaExibicao,
  CRIANCA_EXPOSTA_HBV_MAX_IDADE_MESES,
} from './hepatiteCriancaHbvLimits';

describe('formatIdadeMesesParaExibicao', () => {
  it('exibe meses até o limite da ficha criança exposta (24)', () => {
    expect(
      formatIdadeMesesParaExibicao(1, { sempreMesesAte: CRIANCA_EXPOSTA_HBV_MAX_IDADE_MESES }),
    ).toBe('1 mês');
    expect(
      formatIdadeMesesParaExibicao(18, { sempreMesesAte: CRIANCA_EXPOSTA_HBV_MAX_IDADE_MESES }),
    ).toBe('18 meses');
  });

  it('fora do limite RN usa anos quando >= 12 meses', () => {
    expect(formatIdadeMesesParaExibicao(12)).toBe('1 ano');
    expect(formatIdadeMesesParaExibicao(24)).toBe('2 anos');
  });
});

describe('calcularIdadeMesesFromBirthDate + exibição HBV', () => {
  it('não confunde 1 mês com 1 ano na exibição', () => {
    const meses = calcularIdadeMesesFromBirthDate('2026-05-01');
    expect(meses).toBeDefined();
    expect(meses!).toBeLessThanOrEqual(24);
    const texto = formatIdadeMesesParaExibicao(meses!, {
      sempreMesesAte: CRIANCA_EXPOSTA_HBV_MAX_IDADE_MESES,
    });
    expect(texto).toMatch(/mês|meses/);
    expect(texto).not.toMatch(/ano/);
  });
});
