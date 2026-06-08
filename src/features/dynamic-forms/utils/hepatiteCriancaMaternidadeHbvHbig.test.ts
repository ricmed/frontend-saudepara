import { describe, expect, it } from 'vitest';
import {
  isMaternidadeNaoRealizadoQualRequired,
  maternidadeHbvHbigNaoRealizado,
  maternidadeHbvHbigRealizado,
  MATERNIDADE_NAO_REALIZADO,
} from './hepatiteCriancaMaternidadeHbvHbig';

describe('hepatiteCriancaMaternidadeHbvHbig', () => {
  it('identifica realizado (antes/após 24h)', () => {
    expect(maternidadeHbvHbigRealizado('1')).toBe(true);
    expect(maternidadeHbvHbigRealizado('2')).toBe(true);
    expect(maternidadeHbvHbigRealizado('4')).toBe(false);
  });

  it('exige motivo quando não realizado', () => {
    expect(maternidadeHbvHbigNaoRealizado(MATERNIDADE_NAO_REALIZADO)).toBe(true);
    expect(isMaternidadeNaoRealizadoQualRequired(MATERNIDADE_NAO_REALIZADO)).toBe(true);
    expect(isMaternidadeNaoRealizadoQualRequired('1')).toBe(false);
  });
});
