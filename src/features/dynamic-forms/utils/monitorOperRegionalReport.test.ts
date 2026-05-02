import { describe, expect, it } from 'vitest';
import {
  buildMonitorOperRegionalReport,
  buildPerSubmissionSummaries,
  computeTotalAcumuladoMes,
  defaultMonitorOperReportFilters,
  filterMonitorOperRows,
  filterMonitorOperSubmissionsByReportFilters,
  getMonitorOperDefaultVisibleListColIds,
  impactCheckboxAppliesToArea,
  monitorOperPresetVisibleSheetKeys,
  monitorOperSubmissionsToCsv,
  parseMoney,
  sumCustos,
} from './monitorOperRegionalReport';
import type { FormSchema } from '@/services/FormService';

const impactSchema: FormSchema = {
  agravo: 'x',
  sections: [
    {
      id: 'impacto_acao',
      title: 'Impacto',
      order: 1,
      fields: [
        {
          key: 'imp_epi.coleta_processamento_envio',
          type: 'checkbox',
          label: 'Coleta (epi)',
          order: 1,
        },
        {
          key: 'imp_san.fiscalizacao_estabelecimentos',
          type: 'checkbox',
          label: 'Fiscalização (san)',
          order: 2,
        },
      ],
    },
  ],
};

function row(partial: Record<string, any>) {
  return {
    cabecalho: { crs_id: 10, ano: 2026, mes: 'JAN', ...partial.cabecalho },
    acao: {
      area: 'imunopreveniveis',
      qtd_programadas_qdqq: '1',
      qtd_realizadas_conforme_programacao: '1',
      qtd_nao_programadas_qdqq: '0',
      ...partial.acao,
    },
    ...partial,
  };
}

describe('monitorOperRegionalReport', () => {
  it('filterMonitorOperRows ignora submissões sem cabeçalho ou ação', () => {
    expect(
      filterMonitorOperRows([
        { data_json: { acao: {} } },
        { data_json: row({}) },
      ]).length,
    ).toBe(1);
  });

  it('computeTotalAcumuladoMes retorna mixed com grupos quando CRS/ano/quadrimestre (QDQQ) divergem', () => {
    const a = row({ cabecalho: { crs_id: 1, ano: 2026, mes: 'JAN' } });
    const b = row({ cabecalho: { crs_id: 2, ano: 2026, mes: 'JAN' } });
    const r = computeTotalAcumuladoMes([a, b]);
    expect(r && 'mixed' in r && r.mixed).toBe(true);
    if (r && 'mixed' in r && r.mixed && 'groups' in r) {
      expect(r.groups).toHaveLength(2);
      expect(r.groups.map((g) => g.crs_id).sort()).toEqual([1, 2]);
    }
  });

  it('computeTotalAcumuladoMes retorna mixed com grupos quando mesmo CRS/ano mas quadrimestre diferente', () => {
    const a = row({ cabecalho: { crs_id: 1, ano: 2026, mes: 'JAN', competencia_mes_ano: '2026-01' } });
    const b = row({ cabecalho: { crs_id: 1, ano: 2026, mes: 'JUN', competencia_mes_ano: '2026-06' } });
    const r = computeTotalAcumuladoMes([a, b]);
    expect(r && 'mixed' in r && r.mixed).toBe(true);
    if (r && 'mixed' in r && r.mixed && 'groups' in r) {
      expect(r.groups).toHaveLength(2);
      expect(new Set(r.groups.map((g) => g.quadrimestre))).toEqual(new Set(['Q1', 'Q2']));
    }
  });

  it('computeTotalAcumuladoMes agrega competências diferentes no mesmo quadrimestre (QDQQ)', () => {
    const a = row({ cabecalho: { crs_id: 1, ano: 2026, mes: 'JAN', competencia_mes_ano: '2026-01' } });
    const b = row({
      cabecalho: { crs_id: 1, ano: 2026, mes: 'MAR', competencia_mes_ano: '2026-03' },
      acao: {
        area: 'imunopreveniveis',
        qtd_programadas_qdqq: '1',
        qtd_realizadas_conforme_programacao: '0',
        qtd_nao_programadas_qdqq: '0',
      },
    });
    const r = computeTotalAcumuladoMes([a, b]);
    expect(r && 'mixed' in r && !r.mixed).toBe(true);
    if (r && 'mixed' in r && !r.mixed) {
      expect(r.quadrimestre).toBe('Q1');
      expect(r.programadas).toBe(2);
      expect(r.realizadasFlag).toBe(1);
      expect(r.naoProgramadasFlag).toBe(0);
      expect(r.total).toBe(2);
      expect(r.perc).toBeCloseTo(50, 5);
    }
  });

  it('computeTotalAcumuladoMes soma QDQQ no mesmo quadrimestre (apenas mês código)', () => {
    const r = computeTotalAcumuladoMes([
      row({}),
      row({
        acao: {
          area: 'imunopreveniveis',
          qtd_programadas_qdqq: '1',
          qtd_realizadas_conforme_programacao: '0',
          qtd_nao_programadas_qdqq: '0',
        },
      }),
    ]);
    expect(r && 'mixed' in r && !r.mixed).toBe(true);
    if (r && 'mixed' in r && !r.mixed) {
      expect(r.quadrimestre).toBe('Q1');
      expect(r.programadas).toBe(2);
      expect(r.realizadasFlag).toBe(1);
      expect(r.naoProgramadasFlag).toBe(0);
      expect(r.total).toBe(2);
      expect(r.perc).toBeCloseTo(50, 5);
    }
  });

  it('impactCheckboxAppliesToArea segue área × grupo', () => {
    expect(impactCheckboxAppliesToArea('imunopreveniveis', 'imp_epi.x')).toBe(true);
    expect(impactCheckboxAppliesToArea('imunopreveniveis', 'imp_san.x')).toBe(false);
    expect(impactCheckboxAppliesToArea('vigilancia_sanitaria', 'imp_epi.x')).toBe(false);
    expect(impactCheckboxAppliesToArea('vigilancia_sanitaria', 'imp_san.x')).toBe(true);
  });

  it('buildMonitorOperRegionalReport conta impacto só quando aplicável à área', () => {
    const rows = [
      row({ imp_epi: { coleta_processamento_envio: true } }),
      row({
        acao: { area: 'vigilancia_sanitaria', qtd_programadas_qdqq: '1', qtd_realizadas_conforme_programacao: '1', qtd_nao_programadas_qdqq: '0' },
        imp_epi: { coleta_processamento_envio: true },
        imp_san: { fiscalizacao_estabelecimentos: true },
      }),
    ];
    const rep = buildMonitorOperRegionalReport(rows, impactSchema);
    const coleta = rep.impactCounts.find((i) => i.key === 'imp_epi.coleta_processamento_envio');
    const fisc = rep.impactCounts.find((i) => i.key === 'imp_san.fiscalizacao_estabelecimentos');
    expect(coleta?.count).toBe(1);
    expect(fisc?.count).toBe(1);
  });

  it('sumCustos soma por linha sem duplicar total', () => {
    const s = sumCustos([
      row({
        custo: { el_339014: '10,00', el_339030: 0, el_339033: 0, el_339036: 0, el_339039: 0, total: 0 },
      }),
      row({
        custo: { el_339014: 0, el_339030: 0, el_339033: 0, el_339036: 0, el_339039: 0, total: 25 },
      }),
    ]);
    expect(s.el_339014).toBe(10);
    expect(s.total).toBe(35);
  });

  it('parseMoney aceita vírgula brasileira', () => {
    expect(parseMoney('1.234,56')).toBe(1234.56);
  });

  it('monitorOperSubmissionsToCsv inclui BOM e cabeçalhos', () => {
    const csv = monitorOperSubmissionsToCsv(
      buildPerSubmissionSummaries([
        {
          id: 1,
          status: 'submitted',
          created_at: '2026-01-01',
          data_json: row({}) as any,
        },
      ]),
    );
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('id,status');
  });

  it('monitorOperPresetVisibleSheetKeys preserva ordem do instrumento e ignora chaves ausentes', () => {
    const available = ['acao.area', 'cabecalho.crs_id', 'acao.atividade'];
    const preset = monitorOperPresetVisibleSheetKeys(available);
    expect(preset).toEqual(['cabecalho.crs_id', 'acao.area', 'acao.atividade']);
  });

  it('getMonitorOperDefaultVisibleListColIds filtra só ids existentes', () => {
    expect(getMonitorOperDefaultVisibleListColIds(['crs', 'area', 'foo'])).toEqual(['crs', 'area']);
  });

  it('filterMonitorOperSubmissionsByReportFilters restringe por CRS e quadrimestre', () => {
    const a = row({ cabecalho: { crs_id: 1, ano: 2026, mes: 'JAN' } });
    const b = row({ cabecalho: { crs_id: 2, ano: 2026, mes: 'JUN', competencia_mes_ano: '2026-06' } });
    const subs = [
      { id: 1, status: 'x', created_at: 't', data_json: a },
      { id: 2, status: 'x', created_at: 't', data_json: b },
    ];
    const f1 = { ...defaultMonitorOperReportFilters(), crs_id: '1' };
    expect(filterMonitorOperSubmissionsByReportFilters(subs, f1)).toHaveLength(1);
    const f2 = { ...defaultMonitorOperReportFilters(), quadrimestre: 'Q2' as const };
    expect(filterMonitorOperSubmissionsByReportFilters(subs, f2)).toHaveLength(1);
  });
});
