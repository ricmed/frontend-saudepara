import { describe, expect, it } from 'vitest';
import { buildSigplanCustoByMunicipio, summarizeSigplanCusto } from './monitorOperSigplanCusto';

describe('monitorOperSigplanCusto', () => {
  it('atribui custo cheio quando há um único município', () => {
    const rows = [
      {
        acao: { municipios_alcancados: ['1500800'] },
        custo: {
          el_339014: 100,
          el_339030: 50,
          el_339033: 0,
          el_339036: 0,
          el_339039: 0,
          total: 150,
        },
      },
    ];
    expect(buildSigplanCustoByMunicipio(rows)).toEqual([
      {
        municipioId: '1500800',
        el_339014: 100,
        el_339030: 50,
        el_339033: 0,
        el_339036: 0,
        el_339039: 0,
        total: 150,
      },
    ]);
    expect(summarizeSigplanCusto(rows).totalGeral).toBe(150);
  });

  it('rateia igualmente entre N municípios e total geral não infla', () => {
    const rows = [
      {
        acao: { municipios_alcancados: ['A', 'B'] },
        custo: {
          el_339014: 100,
          el_339030: 0,
          el_339033: 0,
          el_339036: 0,
          el_339039: 0,
          total: 200,
        },
      },
    ];
    const byMun = buildSigplanCustoByMunicipio(rows);
    expect(byMun).toHaveLength(2);
    expect(byMun.find((r) => r.municipioId === 'A')).toMatchObject({
      el_339014: 50,
      total: 100,
    });
    expect(byMun.find((r) => r.municipioId === 'B')).toMatchObject({
      el_339014: 50,
      total: 100,
    });
    const sum = summarizeSigplanCusto(rows);
    expect(sum.totalGeral).toBe(200);
    expect(sum.byMunicipio.reduce((s, r) => s + r.total, 0)).toBeCloseTo(200);
  });

  it('ignora linhas sem município na fatia municipal', () => {
    const rows = [
      {
        acao: { municipios_alcancados: [] },
        custo: { el_339014: 999, total: 999 },
      },
      {
        acao: { municipios_alcancados: ['X'] },
        custo: { el_339014: 10, el_339030: 0, el_339033: 0, el_339036: 0, el_339039: 0, total: 10 },
      },
    ];
    expect(buildSigplanCustoByMunicipio(rows)).toEqual([
      {
        municipioId: 'X',
        el_339014: 10,
        el_339030: 0,
        el_339033: 0,
        el_339036: 0,
        el_339039: 0,
        total: 10,
      },
    ]);
    expect(summarizeSigplanCusto(rows).totalGeral).toBe(10);
  });
});
