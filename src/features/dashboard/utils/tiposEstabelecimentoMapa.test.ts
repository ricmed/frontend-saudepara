import { describe, expect, it } from 'vitest';
import {
  contarEstabelecimentosPorTipo,
  tiposEstabelecimentoDoMapa,
} from './tiposEstabelecimentoMapa';

describe('tiposEstabelecimentoDoMapa', () => {
  it('lista só os tipos das unidades que já estão no mapa', () => {
    expect(tiposEstabelecimentoDoMapa([
      { tipo: 'UBS' },
      { tipo: 'Hospital' },
      { tipo: 'UBS' },
      { tipo: null },
    ])).toEqual(['Hospital', 'UBS']);
  });

  it('conta por tipo sem usar o cadastro geral', () => {
    const noMapa = [{ tipo: 'UBS' }, { tipo: 'UBS' }, { tipo: 'SAMU' }];
    expect(contarEstabelecimentosPorTipo(noMapa, 'UBS')).toBe(2);
    expect(contarEstabelecimentosPorTipo(noMapa, 'Hospital')).toBe(0);
  });
});
