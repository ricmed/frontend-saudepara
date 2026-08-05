import { describe, it, expect } from 'vitest';
import {
  TIPO_EXPOSICAO_HBV,
  TIPO_EXPOSICAO_HCV,
  TIPO_EXPOSICAO_AMBOS,
  agravoCidPorTipoExposicao,
  agravoDoencaPorTipoExposicao,
  tipoExposicaoMostraHbv,
  tipoExposicaoMostraHcv,
} from './hepatiteCriancaExposicao';

describe('hepatiteCriancaExposicao', () => {
  it('define agravo e CID por tipo de exposição', () => {
    expect(agravoDoencaPorTipoExposicao('')).toBe('');
    expect(agravoCidPorTipoExposicao('')).toBe('');
    expect(agravoDoencaPorTipoExposicao(TIPO_EXPOSICAO_HBV)).toBe('CRIANÇA EXPOSTA AO HBV');
    expect(agravoCidPorTipoExposicao(TIPO_EXPOSICAO_HBV)).toBe('Z20.5');
    expect(agravoDoencaPorTipoExposicao(TIPO_EXPOSICAO_HCV)).toBe('CRIANÇA EXPOSTA AO HCV');
    expect(agravoCidPorTipoExposicao(TIPO_EXPOSICAO_HCV)).toBe('');
    expect(agravoDoencaPorTipoExposicao(TIPO_EXPOSICAO_AMBOS)).toBe('CRIANÇA EXPOSTA AO HBV / HCV');
    expect(agravoCidPorTipoExposicao(TIPO_EXPOSICAO_AMBOS)).toBe('Z20.5CO');
  });

  it('controla visibilidade de blocos HBV e HCV', () => {
    expect(tipoExposicaoMostraHbv(TIPO_EXPOSICAO_HBV)).toBe(true);
    expect(tipoExposicaoMostraHcv(TIPO_EXPOSICAO_HBV)).toBe(false);
    expect(tipoExposicaoMostraHbv(TIPO_EXPOSICAO_HCV)).toBe(false);
    expect(tipoExposicaoMostraHcv(TIPO_EXPOSICAO_HCV)).toBe(true);
    expect(tipoExposicaoMostraHbv(TIPO_EXPOSICAO_AMBOS)).toBe(true);
    expect(tipoExposicaoMostraHcv(TIPO_EXPOSICAO_AMBOS)).toBe(true);
  });
});
