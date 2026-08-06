import { describe, expect, it } from 'vitest';
import {
  flattenEntomologiaFrequenciaRows,
  flattenEntomologiaResumoRows,
  formatPctCell,
  pctValue,
  sumResumoDashColumn,
} from './entomologiaDashboardTables';

describe('flattenEntomologiaResumoRows', () => {
  it('expande municípios com totais L+P+EX', () => {
    const rows = flattenEntomologiaResumoRows([
      {
        id: 10,
        status: 'submitted',
        data_json: {
          crs_id: 1,
          competencia: '2026-08',
          responsavel: 'Lab',
          resumo_mensal: [
            {
              municipio_id: 1501402,
              tubos_com_larvas: 2,
              imoveis_aeg: 1,
              larv_aeg: 3,
              pupa_aeg: 1,
              exuv_aeg: 0,
              larv_alb: 0,
            },
          ],
        },
      },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].submission_id).toBe(10);
    expect(rows[0].municipio_id).toBe('1501402');
    expect(rows[0].total_aeg).toBe(4);
    expect(rows[0].total_alb).toBe(0);
  });
});

describe('flattenEntomologiaFrequenciaRows', () => {
  it('calcula % por espécie', () => {
    const rows = flattenEntomologiaFrequenciaRows([
      {
        id: 1,
        data_json: {
          crs_id: 4,
          competencia: '2026-01',
          frequencia_recipientes: [{ municipio_id: 1, a1_aeg: 1, a2_aeg: 1, a1_alb: 2 }],
        },
      },
    ]);
    expect(rows[0].total_aeg).toBe(2);
    expect(rows[0].a1_aeg_pct).toBe(50);
    expect(rows[0].a1_alb_pct).toBe(100);
  });
});

describe('pctValue / sumResumoDashColumn / formatPctCell', () => {
  it('pct nulo com denom zero', () => {
    expect(pctValue({}, 'a1_aeg', ['a1_aeg'])).toBeNull();
  });

  it('soma coluna numérica', () => {
    const rows = flattenEntomologiaResumoRows([
      {
        id: 1,
        data_json: {
          resumo_mensal: [
            { municipio_id: 1, tubos_com_larvas: 2 },
            { municipio_id: 2, tubos_com_larvas: 3 },
          ],
        },
      },
    ]);
    expect(sumResumoDashColumn(rows, 'tubos_com_larvas')).toBe(5);
  });

  it('formata percentual', () => {
    expect(formatPctCell(null)).toBe('—');
    expect(formatPctCell(12.5)).toBe('12.5%');
  });
});
