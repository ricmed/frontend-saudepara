import { describe, expect, it } from 'vitest';
import { somarPopulacaoUbs } from './populacaoUbs';

describe('somarPopulacaoUbs', () => {
  it('soma total, urbana, rural e o restante sem zona', () => {
    expect(somarPopulacaoUbs([
      { populacao_alvo: 100, zona: 'URBANA' },
      { populacao_alvo: 40, zona: 'RURAL' },
      { populacao_alvo: 10, zona: null },
      { populacao_alvo: 5 },
    ])).toEqual({ total: 155, urbana: 100, rural: 40, semZona: 15 });
  });

  it('trata lista vazia como zero', () => {
    expect(somarPopulacaoUbs([])).toEqual({ total: 0, urbana: 0, rural: 0, semZona: 0 });
  });
});
