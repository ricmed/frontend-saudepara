import { describe, expect, it } from 'vitest';
import { computeEntomologiaDashboardKpis } from './entomologiaDashboardKpis';
import type { EntomologiaResumoDashRow } from './entomologiaDashboardTables';

const baseRow = (overrides: Partial<EntomologiaResumoDashRow> = {}): EntomologiaResumoDashRow => ({
  submission_id: 1,
  status: 'submitted',
  crs_id: '1',
  competencia: '2026-01',
  responsavel: 'Ana',
  municipio_id: '10',
  local_bairros: 'Centro',
  tubos_com_larvas: 2,
  imoveis_aeg: 1,
  imoveis_alb: 0,
  tb_aeg: 0,
  pe_aeg: 0,
  tb_alb: 0,
  pe_alb: 0,
  larv_aeg: 5,
  pupa_aeg: 0,
  exuv_aeg: 0,
  larv_alb: 0,
  pupa_alb: 0,
  exuv_alb: 0,
  outros_lp: 0,
  total_aeg: 5,
  total_alb: 0,
  ...overrides,
});

describe('computeEntomologiaDashboardKpis', () => {
  it('agrega totais e municípios distintos', () => {
    const rows = [
      baseRow({ municipio_id: '10', tubos_com_larvas: 2, total_aeg: 5, total_alb: 0 }),
      baseRow({ municipio_id: '20', tubos_com_larvas: 3, total_aeg: 1, total_alb: 4 }),
    ];
    const kpis = computeEntomologiaDashboardKpis([{ id: 1 }, { id: 2 }], rows);
    expect(kpis.relatorios).toBe(2);
    expect(kpis.municipios).toBe(2);
    expect(kpis.tubosComLarvas).toBe(5);
    expect(kpis.totalAeg).toBe(6);
    expect(kpis.totalAlb).toBe(4);
    expect(kpis.municipiosComAlb).toBe(1);
  });

  it('retorna zeros quando não há linhas', () => {
    const kpis = computeEntomologiaDashboardKpis([], []);
    expect(kpis.relatorios).toBe(0);
    expect(kpis.municipios).toBe(0);
    expect(kpis.tubosComLarvas).toBe(0);
  });
});
