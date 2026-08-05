import { describe, expect, it } from 'vitest';
import {
  buildGeoCascadeOptions,
  municipioMatchesGeoFilters,
  resolveAllowedMunicipioIds,
  resolveSigplanGroupKey,
  type GeoDimensoesCatalog,
} from './monitorOperGeoDimensoes';
import {
  aggregateSigplanCustoByGroup,
  aggregateSigplanPresenceByGroup,
} from './monitorOperSigplanGroupBy';
import type { SigplanMunicipioPresenceRow } from './monitorOperSigplanPanel';
import type { SigplanMunicipioCustoRow } from './monitorOperSigplanCusto';

const catalog: GeoDimensoesCatalog = {
  macrorregioes: [
    { value: 1, label: 'Macrorregional I', abrv: 'Macro I' },
    { value: 2, label: 'Macrorregional II', abrv: 'Macro II' },
  ],
  regioesSaude: [
    { value: 10, label: 'Metropolitana I', macrorregiao_id: 1 },
    { value: 11, label: 'Carajás', macrorregiao_id: 2 },
  ],
  regioesIntegracao: [
    { value: 20, label: 'Metropolitana' },
    { value: 21, label: 'Carajas' },
  ],
  municipios: [
    {
      idtipo_municipio: 100,
      codigo: '150140',
      descricao: 'Belém',
      crs_id: 1,
      macrorregiao_id: 1,
      macrorregiao_nome: 'Macrorregional I',
      regiao_saude_id: 10,
      regiao_saude_nome: 'Metropolitana I',
      regiao_integracao_id: 20,
      regiao_integracao_nome: 'Metropolitana',
    },
    {
      idtipo_municipio: 101,
      codigo: '150215',
      descricao: 'Canaã dos Carajás',
      crs_id: 2,
      macrorregiao_id: 2,
      macrorregiao_nome: 'Macrorregional II',
      regiao_saude_id: 11,
      regiao_saude_nome: 'Carajás',
      regiao_integracao_id: 21,
      regiao_integracao_nome: 'Carajas',
    },
  ],
};

describe('monitorOperGeoDimensoes', () => {
  it('filtra municípios por macrorregião', () => {
    const allowed = resolveAllowedMunicipioIds(catalog, {
      macrorregiao_id: '1',
      regiao_saude_id: '',
      regiao_integracao_id: '',
      municipio_id: '',
    });
    expect(allowed).toEqual(new Set(['100']));
  });

  it('cascata restringe região de saúde pela macro', () => {
    const opts = buildGeoCascadeOptions(catalog, {
      macrorregiao_id: '1',
      regiao_saude_id: '',
      regiao_integracao_id: '',
      municipio_id: '',
    });
    expect(opts.regioesSaude.map((o) => o.label)).toEqual(['Metropolitana I']);
  });

  it('resolve grupo por região de integração', () => {
    const dim = catalog.municipios[0];
    const g = resolveSigplanGroupKey('100', 'regiao_integracao', dim, {}, {});
    expect(g.key).toBe('ri:20');
    expect(g.label).toBe('Metropolitana');
  });

  it('municipioMatchesGeoFilters rejeita integração diferente', () => {
    expect(
      municipioMatchesGeoFilters(catalog.municipios[0], {
        macrorregiao_id: '',
        regiao_saude_id: '',
        regiao_integracao_id: '21',
        municipio_id: '',
      }),
    ).toBe(false);
  });
});

describe('monitorOperSigplanGroupBy', () => {
  const presence: SigplanMunicipioPresenceRow[] = [
    {
      municipioId: '100',
      capacitacao: true,
      capacitacaoPessoas: 10,
      avaliacao: false,
      avaliacaoModalidades: [],
      acao_complementar: false,
      acaoComplementarPessoas: 0,
    },
    {
      municipioId: '101',
      capacitacao: true,
      capacitacaoPessoas: 5,
      avaliacao: true,
      avaliacaoModalidades: ['supervisao'],
      acao_complementar: false,
      acaoComplementarPessoas: 0,
    },
  ];

  it('agrega presença por macrorregião (Sim = qualquer município)', () => {
    const rows = aggregateSigplanPresenceByGroup(
      presence,
      'macrorregiao',
      catalog,
      { '100': 'Belém', '101': 'Canaã' },
      {},
    );
    expect(rows).toHaveLength(2);
    const macro1 = rows.find((r) => r.groupKey === 'macro:1');
    expect(macro1?.capacitacao).toBe(true);
    expect(macro1?.capacitacaoPessoas).toBe(10);
    expect(macro1?.avaliacao).toBe(false);
  });

  it('soma custo rateado no eixo CRS', () => {
    const custo: SigplanMunicipioCustoRow[] = [
      {
        municipioId: '100',
        el_339014: 100,
        el_339030: 0,
        el_339033: 0,
        el_339036: 0,
        el_339039: 0,
        total: 100,
      },
      {
        municipioId: '101',
        el_339014: 50,
        el_339030: 0,
        el_339033: 0,
        el_339036: 0,
        el_339039: 0,
        total: 50,
      },
    ];
    const rows = aggregateSigplanCustoByGroup(
      custo,
      'crs',
      catalog,
      {},
      { '1': '1º CRS', '2': '2º CRS' },
    );
    expect(rows.find((r) => r.groupKey === 'crs:1')?.total).toBe(100);
    expect(rows.find((r) => r.groupKey === 'crs:2')?.total).toBe(50);
  });
});
