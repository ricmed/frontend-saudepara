import type { FormSchema } from '@/services/FormService';

/** Linha de `data_json` com cabeçalho e ação (monitor operacional regional). */
export type MonitorOperRow = Record<string, any>;

export const MONITOR_OPER_REGIONAL_KEY = 'MONITOR_OPER_REGIONAL';

/** Mês numérico a partir do cabeçalho (competência YYYY-MM ou código JAN…DEZ). */
const MES_CODIGO_PARA_NUM: Record<string, number> = {
  JAN: 1,
  FEV: 2,
  MAR: 3,
  ABR: 4,
  MAI: 5,
  JUN: 6,
  JUL: 7,
  AGO: 8,
  SET: 9,
  OUT: 10,
  NOV: 11,
  DEZ: 12,
};

export function monthNumberFromCabecalho(cab: Record<string, any> | undefined): number | null {
  if (!cab || typeof cab !== 'object') return null;
  const comp = cab.competencia_mes_ano;
  if (typeof comp === 'string' && comp.trim()) {
    const m = /^(\d{4})-(\d{2})/.exec(comp.trim());
    if (m) {
      const mo = parseInt(m[2], 10);
      if (mo >= 1 && mo <= 12) return mo;
    }
  }
  const mesCode = cab.mes;
  if (typeof mesCode === 'string' && MES_CODIGO_PARA_NUM[mesCode.toUpperCase()]) {
    return MES_CODIGO_PARA_NUM[mesCode.toUpperCase()];
  }
  return null;
}

/** QDQQ no Pará / SESPA: 3 quadrimestres (jan–abr, mai–ago, set–dez). */
export function quadrimestreKeyFromMonth(m: number): 'Q1' | 'Q2' | 'Q3' {
  if (m >= 1 && m <= 4) return 'Q1';
  if (m >= 5 && m <= 8) return 'Q2';
  return 'Q3';
}

export function quadrimestreLabel(q: 'Q1' | 'Q2' | 'Q3'): string {
  if (q === 'Q1') return '1º quadrimestre (jan–abr)';
  if (q === 'Q2') return '2º quadrimestre (mai–ago)';
  return '3º quadrimestre (set–dez)';
}

/** Chave única para consolidar totais QDQQ: CRS + ano + quadrimestre. */
export function qdqqConsolidationKey(d: MonitorOperRow): string {
  const cab = d.cabecalho as Record<string, any> | undefined;
  const crs = cab?.crs_id ?? '';
  const ano = cab?.ano ?? '';
  const mo = monthNumberFromCabecalho(cab);
  const q = mo == null ? '?' : quadrimestreKeyFromMonth(mo);
  return `${crs}|${ano}|${q}`;
}

const AREA_LABELS: Record<string, string> = {
  controle_endemias: 'Controle de endemias',
  imunopreveniveis: 'Agravos imunopreveníveis e imunização',
  dep_controle_doencas_transmissiveis: 'Departamento de Controle das Doenças Transmissíveis',
  vigilancia_sanitaria: 'Vigilância sanitária',
  vigilancia_ambiental_trabalhador: 'Vigilância em saúde ambiental e do trabalhador',
  sistemas_informacao_obito: 'Sistemas de informações e vigilância do óbito',
  agravos_nao_transmissiveis: 'Vigilância de agravos não transmissíveis',
  lacen: 'LACEN',
};

export function filterMonitorOperRows(submissions: { data_json?: unknown }[]): MonitorOperRow[] {
  return submissions
    .map((s) => s.data_json)
    .filter(
      (d): d is MonitorOperRow =>
        Boolean(d) &&
        typeof d === 'object' &&
        (d as MonitorOperRow).cabecalho != null &&
        (d as MonitorOperRow).acao != null,
    );
}

/** Valores de municípios alcançados no formulário (array ou valor único), normalizados e sem vazios. */
/** Exibe nome do município quando o mapa foi carregado; senão, texto legível com o id. */
export function formatMonitorOperMunicipioAlcancadoLabel(
  id: string,
  labels: Record<string, string>,
): string {
  const t = String(id).trim();
  if (!t) return '—';
  const label = labels[t];
  if (label) return label;
  if (/^\d+$/.test(t)) return `Município (id ${t})`;
  return t;
}

export function normalizeMunicipiosAlcancados(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    const out: string[] = [];
    for (const x of raw) {
      if (x != null && String(x).trim() !== '') out.push(String(x).trim());
    }
    return out;
  }
  const s = String(raw).trim();
  return s === '' ? [] : [s];
}

export type MunicipiosPorCrsAgg = {
  crs_id: unknown;
  municipios: string[];
  quantidade: number;
};

/** Municípios distintos informados por regional (CRS), para painel operacional. */
export function buildMunicipiosPorCrs(rows: MonitorOperRow[]): MunicipiosPorCrsAgg[] {
  const map = new Map<string, Set<string>>();
  for (const d of rows) {
    const cid = d?.cabecalho?.crs_id;
    const key = cid == null || cid === '' ? '__empty__' : String(cid);
    const list = normalizeMunicipiosAlcancados(d?.acao?.municipios_alcancados);
    if (!map.has(key)) map.set(key, new Set());
    const set = map.get(key)!;
    for (const m of list) set.add(m);
  }
  const out: MunicipiosPorCrsAgg[] = [];
  for (const [key, set] of map) {
    const crs_id = key === '__empty__' ? '' : key;
    const municipios = [...set].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    out.push({ crs_id, municipios, quantidade: municipios.length });
  }
  return out.sort((a, b) => {
    const sa = String(a.crs_id);
    const sb = String(b.crs_id);
    return sa.localeCompare(sb, undefined, { numeric: true });
  });
}

/** Conta em quantas linhas de ação cada município aparece (uma vez por linha, mesmo se repetido no array). */
export function buildMunicipiosRanking(
  rows: MonitorOperRow[],
  /** Se omitido ou ≤ 0, retorna todos os municípios ordenados por ocorrência. */
  limit?: number,
): { municipio: string; ocorrencias: number }[] {
  const counts = new Map<string, number>();
  for (const d of rows) {
    const list = normalizeMunicipiosAlcancados(d?.acao?.municipios_alcancados);
    const uniq = new Set(list);
    for (const m of uniq) counts.set(m, (counts.get(m) ?? 0) + 1);
  }
  const sorted = [...counts.entries()]
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))
    .map(([municipio, ocorrencias]) => ({ municipio, ocorrencias }));
  if (limit != null && limit > 0) return sorted.slice(0, limit);
  return sorted;
}

/** Totais QDQQ para um único grupo (CRS + ano + quadrimestre). */
export type QdqqGroupTotal = {
  /** Chave interna `crs|ano|Q` */
  consolidationKey: string;
  crs_id: unknown;
  ano: unknown;
  mes: unknown;
  competencia_mes_ano: unknown;
  quadrimestre: 'Q1' | 'Q2' | 'Q3' | '?';
  quadrimestre_label: string;
  programadas: number;
  realizadasFlag: number;
  naoProgramadasFlag: number;
  total: number;
  perc: number | undefined;
  /** Linhas (ações) neste grupo */
  rowCount: number;
  /** Soma do custo (`custo`) das linhas desta fatia QDQQ. */
  custoTotal: number;
};

export type TotalAcumuladoMes =
  | null
  /** Vários CRS/ano/quadrimestre: totais por grupo (não bloqueia análise). */
  | { mixed: true; groups: QdqqGroupTotal[] }
  | {
      mixed: false;
      crs_id: unknown;
      ano: unknown;
      /** Código do mês de referência no cabeçalho (ex.: JUN), quando existir. */
      mes: unknown;
      competencia_mes_ano: unknown;
      /** Quadrimestre do QDQQ (instrumento operacional). */
      quadrimestre: 'Q1' | 'Q2' | 'Q3' | '?';
      quadrimestre_label: string;
      programadas: number;
      realizadasFlag: number;
      naoProgramadasFlag: number;
      total: number;
      perc: number | undefined;
    };

export function sumQdqqPath(
  arr: MonitorOperRow[],
  path: 'qtd_programadas_qdqq' | 'qtd_realizadas_conforme_programacao' | 'qtd_nao_programadas_qdqq',
) {
  return arr.reduce((acc, d) => acc + (Number(d?.acao?.[path]) || 0), 0);
}

/** Agrupa linhas por CRS + ano + quadrimestre (QDQQ) e calcula totais em cada fatia. */
export function computeTotalAcumuladoMesByGroup(rows: MonitorOperRow[]): QdqqGroupTotal[] {
  if (!rows?.length) return [];
  const map = new Map<string, MonitorOperRow[]>();
  for (const d of rows) {
    const k = qdqqConsolidationKey(d);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(d);
  }
  const out: QdqqGroupTotal[] = [];
  for (const [consolidationKey, grp] of map) {
    const sample = grp[0]?.cabecalho ?? {};
    const mo = monthNumberFromCabecalho(sample as any);
    const q = mo == null ? ('?' as const) : quadrimestreKeyFromMonth(mo);
    const quadrimestre_label = q === '?' ? 'Período não identificado (informe competência mês/ano)' : quadrimestreLabel(q);
    const programadas = sumQdqqPath(grp, 'qtd_programadas_qdqq');
    const realizadasFlag = sumQdqqPath(grp, 'qtd_realizadas_conforme_programacao');
    const naoProgramadasFlag = sumQdqqPath(grp, 'qtd_nao_programadas_qdqq');
    const total = programadas + naoProgramadasFlag;
    const perc = programadas > 0 ? (realizadasFlag / programadas) * 100 : undefined;
    const custoTotal = sumCustos(grp).total;
    out.push({
      consolidationKey,
      crs_id: sample.crs_id,
      ano: sample.ano,
      mes: sample.mes,
      competencia_mes_ano: (sample as any).competencia_mes_ano,
      quadrimestre: q,
      quadrimestre_label,
      programadas,
      realizadasFlag,
      naoProgramadasFlag,
      total,
      perc,
      rowCount: grp.length,
      custoTotal,
    });
  }
  out.sort((a, b) =>
    `${a.crs_id}|${a.ano}|${a.quadrimestre}`.localeCompare(`${b.crs_id}|${b.ano}|${b.quadrimestre}`, undefined, {
      numeric: true,
    }),
  );
  return out;
}

export function computeTotalAcumuladoMes(rows: MonitorOperRow[]): TotalAcumuladoMes {
  if (!rows?.length) return null;

  const groups = computeTotalAcumuladoMesByGroup(rows);
  if (groups.length > 1) return { mixed: true, groups };

  const g = groups[0]!;
  return {
    mixed: false,
    crs_id: g.crs_id,
    ano: g.ano,
    mes: g.mes,
    competencia_mes_ano: g.competencia_mes_ano,
    quadrimestre: g.quadrimestre,
    quadrimestre_label: g.quadrimestre_label,
    programadas: g.programadas,
    realizadasFlag: g.realizadasFlag,
    naoProgramadasFlag: g.naoProgramadasFlag,
    total: g.total,
    perc: g.perc,
  };
}

export function monitorOperImpactKeyGroup(key: string): 'epi' | 'san' | 'amb' | null {
  if (key.startsWith('imp_epi.')) return 'epi';
  if (key.startsWith('imp_san.')) return 'san';
  if (key.startsWith('imp_amb.')) return 'amb';
  return null;
}

/** Mesma regra de visibilidade do `useFormRenderer` para impacto × área. */
export function impactCheckboxAppliesToArea(area: string | undefined, fieldKey: string): boolean {
  const ig = monitorOperImpactKeyGroup(fieldKey);
  if (!ig || !area) return false;
  if (ig === 'epi') {
    return area !== 'vigilancia_sanitaria' && area !== 'vigilancia_ambiental_trabalhador';
  }
  if (ig === 'san') return area === 'vigilancia_sanitaria';
  if (ig === 'amb') return area === 'vigilancia_ambiental_trabalhador';
  return false;
}

export function isTruthyCheckbox(v: unknown): boolean {
  return v === true || v === 1 || v === '1';
}

export function parseMoney(v: unknown): number {
  if (v == null || v === '') return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const s = String(v).trim().replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

export function extractImpactoAcaoFieldList(schema: FormSchema | null | undefined): { key: string; label: string }[] {
  if (!schema?.sections?.length) return [];
  const sec = schema.sections.find((s) => s.id === 'impacto_acao');
  if (!sec?.fields?.length) return [];
  return sec.fields.map((f) => ({ key: f.key, label: f.label || f.key }));
}

export interface MonitorOperCustoSums {
  el_339014: number;
  el_339030: number;
  el_339033: number;
  el_339036: number;
  el_339039: number;
  total: number;
}

export interface MonitorOperRegionalReport {
  validRowCount: number;
  totalAcumulado: TotalAcumuladoMes;
  byArea: { areaKey: string; areaLabel: string; count: number }[];
  custoSums: MonitorOperCustoSums;
  impactCounts: { key: string; label: string; count: number; group: 'epi' | 'san' | 'amb' }[];
  resumo: { objetivoSim: number; obstaculosSim: number };
}

export function sumCustos(rows: MonitorOperRow[]): MonitorOperCustoSums {
  const acc: MonitorOperCustoSums = {
    el_339014: 0,
    el_339030: 0,
    el_339033: 0,
    el_339036: 0,
    el_339039: 0,
    total: 0,
  };
  for (const d of rows) {
    const c = d?.custo;
    if (!c || typeof c !== 'object') continue;
    const e14 = parseMoney(c.el_339014);
    const e30 = parseMoney(c.el_339030);
    const e33 = parseMoney(c.el_339033);
    const e36 = parseMoney(c.el_339036);
    const e39 = parseMoney(c.el_339039);
    acc.el_339014 += e14;
    acc.el_339030 += e30;
    acc.el_339033 += e33;
    acc.el_339036 += e36;
    acc.el_339039 += e39;
    const rowTotal = parseMoney(c.total);
    acc.total += rowTotal > 0 ? rowTotal : e14 + e30 + e33 + e36 + e39;
  }
  return acc;
}

/** Rótulo amigável da área de vigilância (chave do formulário). */
export function monitorOperAreaLabel(areaKey: string): string {
  return AREA_LABELS[areaKey] ?? (areaKey === '(sem área)' || areaKey === '' ? 'Sem área informada' : areaKey);
}

/** Filtros do painel executivo / técnico (aplicados aos envios com `cabecalho` + `acao`). */
export type MonitorOperReportFilters = {
  ano: string;
  quadrimestre: '' | 'Q1' | 'Q2' | 'Q3';
  crs_id: string;
  area: string;
  /** Quem operou o registro no envio (`cabecalho.executor_nivel`, preenchido no servidor). */
  executor_nivel: '' | 'CENTRAL' | 'REGIONAL';
};

export function defaultMonitorOperReportFilters(): MonitorOperReportFilters {
  return { ano: '', quadrimestre: '', crs_id: '', area: '', executor_nivel: '' };
}

export function monitorOperRowMatchesFilters(d: MonitorOperRow, f: MonitorOperReportFilters): boolean {
  const cab = d.cabecalho as Record<string, any> | undefined;
  const ac = d.acao as Record<string, any> | undefined;
  if (!cab || !ac) return false;
  if (f.ano && String(cab.ano ?? '') !== f.ano) return false;
  if (f.quadrimestre) {
    const mo = monthNumberFromCabecalho(cab);
    const q = mo == null ? '?' : quadrimestreKeyFromMonth(mo);
    if (q !== f.quadrimestre) return false;
  }
  if (f.crs_id && String(cab.crs_id ?? '') !== f.crs_id) return false;
  if (f.area && String(ac.area ?? '') !== f.area) return false;
  if (f.executor_nivel && String(cab.executor_nivel ?? '') !== f.executor_nivel) return false;
  return true;
}

export function filterMonitorOperSubmissionsByReportFilters<T extends { data_json?: unknown }>(
  submissions: T[],
  f: MonitorOperReportFilters,
): T[] {
  return submissions.filter((sub) => {
    const d = sub.data_json;
    if (!d || typeof d !== 'object') return false;
    const row = d as MonitorOperRow;
    if (!row.cabecalho || !row.acao) return false;
    return monitorOperRowMatchesFilters(row, f);
  });
}

/** Valores distintos presentes nos envios (para preencher filtros sem “sumir” opções ao filtrar). */
export function collectMonitorOperReportFilterOptions(submissions: { data_json?: unknown }[]): {
  anos: string[];
  crsIds: string[];
  areas: { value: string; label: string }[];
  executorNiveis: { value: 'CENTRAL' | 'REGIONAL'; label: string }[];
} {
  const anos = new Set<string>();
  const crsIds = new Set<string>();
  const areas = new Set<string>();
  const executorSet = new Set<'CENTRAL' | 'REGIONAL'>();
  for (const s of submissions) {
    const d = s.data_json as MonitorOperRow | undefined;
    if (!d?.cabecalho || !d?.acao) continue;
    const cab = d.cabecalho as Record<string, any>;
    const ac = d.acao as Record<string, any>;
    const ano = cab.ano;
    if (ano != null && String(ano).trim() !== '') anos.add(String(ano));
    const crs = cab.crs_id;
    if (crs != null && String(crs).trim() !== '') crsIds.add(String(crs));
    const a = ac.area;
    if (a != null && String(a).trim() !== '') areas.add(String(a));
    const ex = cab.executor_nivel;
    if (ex === 'CENTRAL' || ex === 'REGIONAL') executorSet.add(ex);
  }
  const executorLabels: Record<'CENTRAL' | 'REGIONAL', string> = {
    CENTRAL: 'Nível Central (estadual)',
    REGIONAL: 'Nível regional (CRS)',
  };
  const executorNiveis = (['CENTRAL', 'REGIONAL'] as const)
    .filter((v) => executorSet.has(v))
    .map((value) => ({ value, label: executorLabels[value] }));
  return {
    anos: [...anos].sort((a, b) => Number(b) - Number(a) || b.localeCompare(a)),
    crsIds: [...crsIds].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    areas: [...areas]
      .sort()
      .map((value) => ({
        value,
        label: AREA_LABELS[value] ?? value,
      })),
    executorNiveis,
  };
}

/** Totais agregados por regional (CRS), independente do quadrimestre — visão gestor. */
export type MonitorOperCrsAggregate = {
  crs_id: unknown;
  linhas: number;
  programadas: number;
  realizadasFlag: number;
  naoProgramadasFlag: number;
  perc: number | undefined;
  custoTotal: number;
  municipiosDistintos: number;
};

export function buildAggregatesPorCrs(rows: MonitorOperRow[]): MonitorOperCrsAggregate[] {
  const map = new Map<string, MonitorOperRow[]>();
  for (const d of rows) {
    const k =
      d?.cabecalho?.crs_id == null || (d.cabecalho as any).crs_id === '' ? '__empty__' : String((d.cabecalho as any).crs_id);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(d);
  }
  const out: MonitorOperCrsAggregate[] = [];
  for (const [k, grp] of map) {
    const crs_id = k === '__empty__' ? '' : k;
    const programadas = sumQdqqPath(grp, 'qtd_programadas_qdqq');
    const realizadasFlag = sumQdqqPath(grp, 'qtd_realizadas_conforme_programacao');
    const naoProgramadasFlag = sumQdqqPath(grp, 'qtd_nao_programadas_qdqq');
    const perc = programadas > 0 ? (realizadasFlag / programadas) * 100 : undefined;
    const custoTotal = sumCustos(grp).total;
    const mun = new Set<string>();
    for (const r of grp) {
      for (const m of normalizeMunicipiosAlcancados(r?.acao?.municipios_alcancados)) mun.add(m);
    }
    out.push({
      crs_id,
      linhas: grp.length,
      programadas,
      realizadasFlag,
      naoProgramadasFlag,
      perc,
      custoTotal,
      municipiosDistintos: mun.size,
    });
  }
  return out.sort((a, b) => String(a.crs_id).localeCompare(String(b.crs_id), undefined, { numeric: true }));
}

export type ProgramaAlcancadoCount = { programa: string; count: number };

export function buildProgramasAlcancadosRanking(rows: MonitorOperRow[], limit = 40): ProgramaAlcancadoCount[] {
  const m = new Map<string, number>();
  for (const d of rows) {
    const p = d?.acao?.programa_alcancado;
    const key = p == null || String(p).trim() === '' ? '' : String(p).trim();
    if (!key) continue;
    m.set(key, (m.get(key) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([programa, count]) => ({ programa, count }))
    .sort((a, b) => b.count - a.count || a.programa.localeCompare(b.programa, 'pt-BR'))
    .slice(0, limit);
}

export type AtividadePorAreaRow = { areaKey: string; areaLabel: string; atividade: string; count: number };

export function buildAtividadesPorArea(rows: MonitorOperRow[]): AtividadePorAreaRow[] {
  const map = new Map<string, number>();
  for (const d of rows) {
    const ac = d?.acao as Record<string, unknown> | undefined;
    const ak = ac?.area == null || String(ac.area).trim() === '' ? '(sem área)' : String(ac.area);
    const atv =
      ac?.atividade == null || String(ac.atividade).trim() === '' ? '—' : String(ac.atividade).trim();
    const k = `${ak}\t${atv}`;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([k, count]) => {
      const tab = k.indexOf('\t');
      const areaKey = tab >= 0 ? k.slice(0, tab) : k;
      const atividade = tab >= 0 ? k.slice(tab + 1) : '—';
      return {
        areaKey,
        areaLabel: monitorOperAreaLabel(areaKey),
        atividade,
        count,
      };
    })
    .sort((a, b) => a.areaLabel.localeCompare(b.areaLabel, 'pt-BR') || b.count - a.count || a.atividade.localeCompare(b.atividade, 'pt-BR'));
}

export type ObstaculoDetalheRow = {
  crs_id: unknown;
  atividade: string;
  competencia: string;
  texto: string;
};

export function buildObstaculosDetalhe(rows: MonitorOperRow[]): ObstaculoDetalheRow[] {
  const out: ObstaculoDetalheRow[] = [];
  for (const d of rows) {
    const r = d?.resumo;
    if (!r || typeof r !== 'object') continue;
    if (!isTruthyCheckbox((r as Record<string, unknown>).houve_obstaculos)) continue;
    const cab = d.cabecalho as Record<string, any> | undefined;
    const rr = r as Record<string, unknown>;
    const textoRaw = rr.qual_obstaculo ?? rr.descricao_obstaculos ?? rr.observacoes;
    out.push({
      crs_id: cab?.crs_id,
      atividade: String(d?.acao?.atividade ?? '—'),
      competencia:
        cab?.competencia_mes_ano != null && String(cab.competencia_mes_ano) !== ''
          ? String(cab.competencia_mes_ano)
          : '—',
      texto: textoRaw != null && String(textoRaw).trim() !== '' ? String(textoRaw).trim() : '—',
    });
  }
  return out;
}

export function buildMonitorOperRegionalReport(
  rows: MonitorOperRow[],
  schema: FormSchema | null | undefined,
): MonitorOperRegionalReport {
  const totalAcumulado = computeTotalAcumuladoMes(rows);
  const areaMap = new Map<string, number>();
  for (const d of rows) {
    const a = d?.acao?.area;
    const k = a == null || a === '' ? '(sem área)' : String(a);
    areaMap.set(k, (areaMap.get(k) ?? 0) + 1);
  }
  const byArea = [...areaMap.entries()]
    .map(([areaKey, count]) => ({
      areaKey,
      areaLabel: AREA_LABELS[areaKey] ?? (areaKey === '(sem área)' ? 'Sem área informada' : areaKey),
      count,
    }))
    .sort((x, y) => y.count - x.count);

  const fieldMeta = extractImpactoAcaoFieldList(schema);
  const impactCounts = fieldMeta
    .map(({ key, label }) => {
      const group = monitorOperImpactKeyGroup(key);
      if (!group) return null;
      let count = 0;
      for (const d of rows) {
        const area = d?.acao?.area as string | undefined;
        if (!impactCheckboxAppliesToArea(area, key)) continue;
        const v = key.split('.').reduce((o, part) => (o && typeof o === 'object' ? (o as any)[part] : undefined), d);
        if (isTruthyCheckbox(v)) count += 1;
      }
      return { key, label, count, group };
    })
    .filter((x): x is { key: string; label: string; count: number; group: 'epi' | 'san' | 'amb' } => x != null);

  let objetivoSim = 0;
  let obstaculosSim = 0;
  for (const d of rows) {
    const r = d?.resumo;
    if (r && typeof r === 'object') {
      if (isTruthyCheckbox(r.objetivo_alcancado)) objetivoSim += 1;
      if (isTruthyCheckbox(r.houve_obstaculos)) obstaculosSim += 1;
    }
  }

  return {
    validRowCount: rows.length,
    totalAcumulado,
    byArea,
    custoSums: sumCustos(rows),
    impactCounts,
    resumo: { objetivoSim, obstaculosSim },
  };
}

export interface MonitorOperSubmissionSummary {
  id: number;
  status: string;
  created_at: string;
  crs_id: unknown;
  /** `CENTRAL` | `REGIONAL` — gravado no servidor em `cabecalho.executor_nivel`. */
  executorNivel?: string;
  /** Preenchido na UI a partir de `/api/crs/select` quando disponível. */
  crs_label?: string;
  ano: unknown;
  mes: unknown;
  competencia_mes_ano: unknown;
  quadrimestre: string;
  area: string;
  areaLabel: string;
  programaAlcancado: unknown;
  atividade: unknown;
  dataRealizacao: unknown;
  programada: unknown;
  realizada: unknown;
  custoTotal: number;
}

/**
 * Ordem sugerida para pré-visualização em tabela (campos do instrumento).
 * Só entram colunas que existirem no schema ativo.
 */
export const MONITOR_OPER_SHEET_PRESET_PATHS: readonly string[] = [
  'cabecalho.crs_id',
  'cabecalho.competencia_mes_ano',
  'cabecalho.ano',
  'cabecalho.mes',
  'acao.area',
  'acao.programa_alcancado',
  'acao.atividade',
  'acao.data_realizacao',
  'acao.qtd_programadas_qdqq',
  'acao.qtd_realizadas_conforme_programacao',
  'acao.qtd_nao_programadas_qdqq',
  'acao.municipios_alcancados',
  'custo.total',
];

export function monitorOperPresetVisibleSheetKeys(availableKeys: string[]): string[] {
  const set = new Set(availableKeys);
  return MONITOR_OPER_SHEET_PRESET_PATHS.filter((k) => set.has(k));
}

export function formatMonitorOperSim01(v: unknown): string {
  if (v === true || v === 1 || v === '1') return 'Sim';
  if (v === false || v === 0 || v === '0') return 'Não';
  if (v == null || v === '') return '—';
  return String(v);
}

function formatCompetenciaMesAnoPtBr(v: unknown): string {
  if (v == null || v === '') return '—';
  const raw = String(v).trim();
  if (!raw) return '—';

  // Aceita "YYYY-MM" (padrão) ou "YYYY-MM-DD" e exibe como "MM/YYYY".
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(raw);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]); // 01..12
    if (Number.isFinite(year) && month >= 1 && month <= 12) {
      const mm = String(month).padStart(2, '0');
      return `${mm}/${year}`;
    }
  }

  return raw;
}

function formatDatePtBr(v: unknown): string {
  if (v == null || v === '') return '—';
  const raw = String(v).trim();
  if (!raw) return '—';

  // "YYYY-MM-DD" ou "YYYY-MM-DDTHH:mm:ss..."
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    if (
      Number.isFinite(year) &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      const dd = String(day).padStart(2, '0');
      const mm = String(month).padStart(2, '0');
      return `${dd}/${mm}/${year}`;
    }
  }

  return raw;
}

export function formatMonitorOperBrl(total: number): string {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(total) || 0);
  } catch {
    return String(total);
  }
}

function formatMonitorOperProgramaAlcancado(v: unknown): string {
  if (v == null || v === '') return '—';
  const raw = String(v).trim();
  if (!raw) return '—';
  const words = raw
    .split('_')
    .map((w) => w.trim())
    .filter(Boolean)
    .map((w) => {
      const lower = w.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    });
  return words.join(' ');
}

function formatSnakeOrTextToTitle(v: unknown): string {
  if (v == null || v === '') return '—';
  const raw = String(v).trim();
  if (!raw) return '—';
  const normalized = raw.replace(/\s+/g, ' ');
  const tokens = normalized.includes('_') ? normalized.split('_') : normalized.split(' ');
  const words = tokens
    .map((w) => w.trim())
    .filter(Boolean)
    .map((w) => {
      const lower = w.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    });
  return words.join(' ');
}

export type MonitorOperListColSpec = {
  id: string;
  label: string;
  /** Classe extra no `<th>` (ex.: `text-right` para custo). */
  thClassName?: string;
  tdClassName?: string;
  format: (row: MonitorOperSubmissionSummary, crsById: Record<string, string>) => string;
};

/** Colunas da listagem web — alinhadas ao CSV `monitorOperSubmissionsToCsv` + programa alcançado. */
export function getMonitorOperListColumnSpecs(): MonitorOperListColSpec[] {
  return [
    {
      id: 'crs',
      label: 'CRS (Regional de saúde)',
      tdClassName: 'min-w-[12rem] max-w-[18rem]',
      format: (r, crsById) =>
        crsById[String(r.crs_id ?? '')] || (r.crs_id != null && r.crs_id !== '' ? String(r.crs_id) : '—'),
    },
    {
      id: 'executor',
      label: 'Executor (nível)',
      tdClassName: 'whitespace-nowrap',
      format: (r) => {
        const v = r.executorNivel;
        if (v === 'CENTRAL') return 'Nível Central';
        if (v === 'REGIONAL') return 'Regional (CRS)';
        return '—';
      },
    },
    {
      id: 'competencia',
      label: 'Competência',
      tdClassName: 'whitespace-nowrap',
      format: (r) => formatCompetenciaMesAnoPtBr(r.competencia_mes_ano),
    },
    {
      id: 'qdqq',
      label: 'Quadrimestre (QDQQ)',
      tdClassName: 'min-w-[10rem] max-w-[14rem]',
      format: (r) =>
        r.quadrimestre === '?' ? '—' : quadrimestreLabel(r.quadrimestre as 'Q1' | 'Q2' | 'Q3'),
    },
    {
      id: 'area',
      label: 'Área da vigilância',
      tdClassName: 'min-w-[11rem] max-w-[16rem] truncate',
      format: (r) => r.areaLabel || '—',
    },
    {
      id: 'programa',
      label: 'Programa alcançado',
      tdClassName: 'min-w-[11rem] max-w-[22rem] truncate',
      format: (r) => formatMonitorOperProgramaAlcancado(r.programaAlcancado),
    },
    {
      id: 'atividade',
      label: 'Atividade',
      tdClassName: 'min-w-[10rem] max-w-[20rem] truncate',
      format: (r) => formatSnakeOrTextToTitle(r.atividade),
    },
    {
      id: 'data_realizacao',
      label: 'Data da realização',
      tdClassName: 'whitespace-nowrap',
      format: (r) => formatDatePtBr(r.dataRealizacao),
    },
    {
      id: 'programada',
      label: 'Programada no QDQQ?',
      tdClassName: 'whitespace-nowrap',
      format: (r) => formatMonitorOperSim01(r.programada),
    },
    {
      id: 'realizada',
      label: 'Foi realizada?',
      tdClassName: 'whitespace-nowrap',
      format: (r) => formatMonitorOperSim01(r.realizada),
    },
    {
      id: 'custo',
      label: 'Custo total',
      thClassName: 'text-right',
      tdClassName: 'whitespace-nowrap text-right',
      format: (r) => formatMonitorOperBrl(r.custoTotal),
    },
  ];
}

const LS_MONITOR_OPER_LIST_COLS = 'dynamicForms.MONITOR_OPER_REGIONAL.listCols';

/** Colunas visíveis ao abrir a lista (demais em “Colunas”). */
export const MONITOR_OPER_LIST_DEFAULT_VISIBLE_COL_IDS: readonly string[] = [
  'crs',
  'competencia',
  'area',
  'atividade',
  'data_realizacao',
];

export function getMonitorOperDefaultVisibleListColIds(allowedIds: string[]): string[] {
  const allowed = new Set(allowedIds);
  return MONITOR_OPER_LIST_DEFAULT_VISIBLE_COL_IDS.filter((id) => allowed.has(id));
}

export function readMonitorOperListColSelection(): string[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LS_MONITOR_OPER_LIST_COLS);
    if (!raw) return null;
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr) || !arr.every((x) => typeof x === 'string')) return null;
    return arr as string[];
  } catch {
    return null;
  }
}

export function writeMonitorOperListColSelection(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_MONITOR_OPER_LIST_COLS, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export function buildMonitorOperSummaryById(
  rows: { id: number; status: string; created_at: string; data_json: Record<string, any> }[],
): Map<number, MonitorOperSubmissionSummary> {
  const list = buildPerSubmissionSummaries(rows);
  return new Map(list.map((s) => [s.id, s]));
}

export function buildPerSubmissionSummaries(
  submissions: { id: number; status: string; created_at: string; data_json: Record<string, any> }[],
): MonitorOperSubmissionSummary[] {
  return submissions.map((s) => {
    const d = s.data_json;
    const area = d?.acao?.area == null ? '' : String(d.acao.area);
    const cab = d?.cabecalho as Record<string, any> | undefined;
    const mo = monthNumberFromCabecalho(cab);
    const qdqqQ = mo == null ? '?' : quadrimestreKeyFromMonth(mo);
    const c = d?.custo;
    let custoTotal = 0;
    if (c && typeof c === 'object') {
      custoTotal = parseMoney(c.total);
      if (custoTotal <= 0) {
        custoTotal =
          parseMoney(c.el_339014) +
          parseMoney(c.el_339030) +
          parseMoney(c.el_339033) +
          parseMoney(c.el_339036) +
          parseMoney(c.el_339039);
      }
    }
    const ex = cab?.executor_nivel;
    const executorNivel = ex === 'CENTRAL' || ex === 'REGIONAL' ? ex : undefined;
    return {
      id: s.id,
      status: s.status,
      created_at: s.created_at,
      crs_id: d?.cabecalho?.crs_id,
      executorNivel,
      ano: d?.cabecalho?.ano,
      mes: d?.cabecalho?.mes,
      competencia_mes_ano: cab?.competencia_mes_ano,
      quadrimestre: qdqqQ,
      area,
      areaLabel: AREA_LABELS[area] || area || '—',
      programaAlcancado: d?.acao?.programa_alcancado,
      atividade: d?.acao?.atividade,
      dataRealizacao: d?.acao?.data_realizacao,
      programada: d?.acao?.qtd_programadas_qdqq,
      realizada: d?.acao?.qtd_realizadas_conforme_programacao,
      custoTotal,
    };
  });
}

/** CSV (UTF-8 com BOM) para Excel — uma linha por envio. */
export function monitorOperSubmissionsToCsv(rows: MonitorOperSubmissionSummary[]): string {
  const headers = [
    'id',
    'status',
    'created_at',
    'crs_id',
    'crs_label',
    'executor_nivel',
    'ano',
    'mes',
    'competencia_mes_ano',
    'quadrimestre_qdqq',
    'area',
    'area_label',
    'atividade',
    'data_realizacao',
    'programada_qdqq',
    'realizada',
    'custo_total',
  ];
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.status,
        r.created_at,
        r.crs_id,
        r.crs_label ?? '',
        r.executorNivel ?? '',
        r.ano,
        r.mes,
        r.competencia_mes_ano,
        r.quadrimestre,
        r.area,
        r.areaLabel,
        r.atividade,
        r.dataRealizacao,
        r.programada,
        r.realizada,
        r.custoTotal.toFixed(2).replace('.', ','),
      ]
        .map(esc)
        .join(','),
    );
  }
  return '\uFEFF' + lines.join('\n');
}
