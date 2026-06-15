import { describe, expect, it } from 'vitest';
import {
  isMaternidadeNaoRealizadoQualRequired,
  isMaternidadeHbvHbigInformado,
  isMaternidadeHbvHbigRequired,
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

  it('exige campo 54 quando exposição inclui HBV', () => {
    const get = (data: Record<string, string>) => (key: string) => data[key];
    expect(isMaternidadeHbvHbigRequired(get({ 'notificacao.tipo_exposicao_hepatite': '1' }))).toBe(true);
    expect(isMaternidadeHbvHbigRequired(get({ 'notificacao.tipo_exposicao_hepatite': '3' }))).toBe(true);
    expect(isMaternidadeHbvHbigRequired(get({ 'notificacao.tipo_exposicao_hepatite': '2' }))).toBe(false);
  });

  it('aceita antes/após 24h ou não realizado', () => {
    expect(isMaternidadeHbvHbigInformado('1')).toBe(true);
    expect(isMaternidadeHbvHbigInformado('2')).toBe(true);
    expect(isMaternidadeHbvHbigInformado('4')).toBe(true);
    expect(isMaternidadeHbvHbigInformado('')).toBe(false);
  });
});
