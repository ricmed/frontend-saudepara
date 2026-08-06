/**
 * Flatten de submissions Entomologia → linhas por município (dashboard / tabelas).
 */

export const ENTOMOLOGIA_AEG_KEYS = [
  'a1_aeg',
  'a2_aeg',
  'b_aeg',
  'c_aeg',
  'd1_aeg',
  'd2_aeg',
  'e_aeg',
] as const;

export const ENTOMOLOGIA_ALB_KEYS = [
  'a1_alb',
  'a2_alb',
  'b_alb',
  'c_alb',
  'd1_alb',
  'd2_alb',
  'e_alb',
] as const;

export type EntomologiaSubmissionLike = {
  id: number;
  status?: string;
  data_json?: Record<string, unknown> | null;
};

export type EntomologiaResumoDashRow = {
  submission_id: number;
  status: string;
  crs_id: string;
  competencia: string;
  responsavel: string;
  municipio_id: string;
  local_bairros: string;
  tubos_com_larvas: number;
  imoveis_aeg: number;
  imoveis_alb: number;
  tb_aeg: number;
  pe_aeg: number;
  tb_alb: number;
  pe_alb: number;
  larv_aeg: number;
  pupa_aeg: number;
  exuv_aeg: number;
  larv_alb: number;
  pupa_alb: number;
  exuv_alb: number;
  outros_lp: number;
  total_aeg: number;
  total_alb: number;
};

export type EntomologiaFrequenciaDashRow = {
  submission_id: number;
  status: string;
  crs_id: string;
  competencia: string;
  responsavel: string;
  municipio_id: string;
  a1_aeg: number;
  a1_alb: number;
  a2_aeg: number;
  a2_alb: number;
  b_aeg: number;
  b_alb: number;
  c_aeg: number;
  c_alb: number;
  d1_aeg: number;
  d1_alb: number;
  d2_aeg: number;
  d2_alb: number;
  e_aeg: number;
  e_alb: number;
  total_aeg: number;
  total_alb: number;
  a1_aeg_pct: number | null;
  a1_alb_pct: number | null;
  a2_aeg_pct: number | null;
  a2_alb_pct: number | null;
  b_aeg_pct: number | null;
  b_alb_pct: number | null;
  c_aeg_pct: number | null;
  c_alb_pct: number | null;
  d1_aeg_pct: number | null;
  d1_alb_pct: number | null;
  d2_aeg_pct: number | null;
  d2_alb_pct: number | null;
  e_aeg_pct: number | null;
  e_alb_pct: number | null;
};

function asRows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((r): r is Record<string, unknown> => r != null && typeof r === 'object');
}

export function numOrZero(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function sumKeys(row: Record<string, unknown>, keys: readonly string[]): number {
  return keys.reduce((acc, k) => acc + numOrZero(row[k]), 0);
}

export function pctValue(
  row: Record<string, unknown>,
  numKey: string,
  denKeys: readonly string[],
): number | null {
  const den = sumKeys(row, denKeys);
  if (den === 0) return null;
  return Math.round((numOrZero(row[numKey]) / den) * 1000) / 10;
}

function headerFromData(data: Record<string, unknown>): {
  crs_id: string;
  competencia: string;
  responsavel: string;
} {
  return {
    crs_id: data.crs_id != null && data.crs_id !== '' ? String(data.crs_id) : '',
    competencia: data.competencia != null ? String(data.competencia) : '',
    responsavel: data.responsavel != null ? String(data.responsavel) : '',
  };
}

function municipioIdFrom(row: Record<string, unknown>): string {
  if (row.municipio_id == null || row.municipio_id === '') return '';
  return String(row.municipio_id);
}

/** Une resumo + frequência por índice (como o editor grava). */
export function flattenEntomologiaResumoRows(
  submissions: EntomologiaSubmissionLike[],
): EntomologiaResumoDashRow[] {
  const out: EntomologiaResumoDashRow[] = [];
  for (const sub of submissions) {
    const data = (sub.data_json || {}) as Record<string, unknown>;
    const header = headerFromData(data);
    const resumo = asRows(data.resumo_mensal);
    for (const row of resumo) {
      out.push({
        submission_id: sub.id,
        status: sub.status ?? '',
        ...header,
        municipio_id: municipioIdFrom(row),
        local_bairros: row.local_bairros != null ? String(row.local_bairros) : '',
        tubos_com_larvas: numOrZero(row.tubos_com_larvas),
        imoveis_aeg: numOrZero(row.imoveis_aeg),
        imoveis_alb: numOrZero(row.imoveis_alb),
        tb_aeg: numOrZero(row.tb_aeg),
        pe_aeg: numOrZero(row.pe_aeg),
        tb_alb: numOrZero(row.tb_alb),
        pe_alb: numOrZero(row.pe_alb),
        larv_aeg: numOrZero(row.larv_aeg),
        pupa_aeg: numOrZero(row.pupa_aeg),
        exuv_aeg: numOrZero(row.exuv_aeg),
        larv_alb: numOrZero(row.larv_alb),
        pupa_alb: numOrZero(row.pupa_alb),
        exuv_alb: numOrZero(row.exuv_alb),
        outros_lp: numOrZero(row.outros_lp),
        total_aeg: sumKeys(row, ['larv_aeg', 'pupa_aeg', 'exuv_aeg']),
        total_alb: sumKeys(row, ['larv_alb', 'pupa_alb', 'exuv_alb']),
      });
    }
  }
  return out;
}

export function flattenEntomologiaFrequenciaRows(
  submissions: EntomologiaSubmissionLike[],
): EntomologiaFrequenciaDashRow[] {
  const out: EntomologiaFrequenciaDashRow[] = [];
  for (const sub of submissions) {
    const data = (sub.data_json || {}) as Record<string, unknown>;
    const header = headerFromData(data);
    const frequencia = asRows(data.frequencia_recipientes);
    for (const row of frequencia) {
      out.push({
        submission_id: sub.id,
        status: sub.status ?? '',
        ...header,
        municipio_id: municipioIdFrom(row),
        a1_aeg: numOrZero(row.a1_aeg),
        a1_alb: numOrZero(row.a1_alb),
        a2_aeg: numOrZero(row.a2_aeg),
        a2_alb: numOrZero(row.a2_alb),
        b_aeg: numOrZero(row.b_aeg),
        b_alb: numOrZero(row.b_alb),
        c_aeg: numOrZero(row.c_aeg),
        c_alb: numOrZero(row.c_alb),
        d1_aeg: numOrZero(row.d1_aeg),
        d1_alb: numOrZero(row.d1_alb),
        d2_aeg: numOrZero(row.d2_aeg),
        d2_alb: numOrZero(row.d2_alb),
        e_aeg: numOrZero(row.e_aeg),
        e_alb: numOrZero(row.e_alb),
        total_aeg: sumKeys(row, ENTOMOLOGIA_AEG_KEYS),
        total_alb: sumKeys(row, ENTOMOLOGIA_ALB_KEYS),
        a1_aeg_pct: pctValue(row, 'a1_aeg', ENTOMOLOGIA_AEG_KEYS),
        a1_alb_pct: pctValue(row, 'a1_alb', ENTOMOLOGIA_ALB_KEYS),
        a2_aeg_pct: pctValue(row, 'a2_aeg', ENTOMOLOGIA_AEG_KEYS),
        a2_alb_pct: pctValue(row, 'a2_alb', ENTOMOLOGIA_ALB_KEYS),
        b_aeg_pct: pctValue(row, 'b_aeg', ENTOMOLOGIA_AEG_KEYS),
        b_alb_pct: pctValue(row, 'b_alb', ENTOMOLOGIA_ALB_KEYS),
        c_aeg_pct: pctValue(row, 'c_aeg', ENTOMOLOGIA_AEG_KEYS),
        c_alb_pct: pctValue(row, 'c_alb', ENTOMOLOGIA_ALB_KEYS),
        d1_aeg_pct: pctValue(row, 'd1_aeg', ENTOMOLOGIA_AEG_KEYS),
        d1_alb_pct: pctValue(row, 'd1_alb', ENTOMOLOGIA_ALB_KEYS),
        d2_aeg_pct: pctValue(row, 'd2_aeg', ENTOMOLOGIA_AEG_KEYS),
        d2_alb_pct: pctValue(row, 'd2_alb', ENTOMOLOGIA_ALB_KEYS),
        e_aeg_pct: pctValue(row, 'e_aeg', ENTOMOLOGIA_AEG_KEYS),
        e_alb_pct: pctValue(row, 'e_alb', ENTOMOLOGIA_ALB_KEYS),
      });
    }
  }
  return out;
}

export function sumResumoDashColumn(
  rows: EntomologiaResumoDashRow[],
  key: keyof EntomologiaResumoDashRow,
): number {
  return rows.reduce((acc, r) => {
    const v = r[key];
    return acc + (typeof v === 'number' ? v : 0);
  }, 0);
}

export function sumFrequenciaDashColumn(
  rows: EntomologiaFrequenciaDashRow[],
  key: keyof EntomologiaFrequenciaDashRow,
): number {
  return rows.reduce((acc, r) => {
    const v = r[key];
    return acc + (typeof v === 'number' ? v : 0);
  }, 0);
}

export function formatCompetenciaCurta(competencia: string | undefined): string {
  if (!competencia) return '—';
  const s = String(competencia);
  if (s.length >= 7) {
    const [y, m] = [s.slice(0, 4), s.slice(5, 7)];
    const monthNames = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ];
    const mi = parseInt(m, 10) - 1;
    if (mi >= 0 && mi < 12) return `${monthNames[mi]}/${y}`;
  }
  return s;
}

export function formatPctCell(value: number | null): string {
  if (value == null) return '—';
  return `${value.toFixed(1)}%`;
}
