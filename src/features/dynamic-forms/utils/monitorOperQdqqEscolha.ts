import {
  formatMonitorOperAtividadeLabel,
  monitorOperAreaLabel,
  monitorOperRowCrsIds,
  monthNumberFromCabecalho,
} from './monitorOperRegionalReport';

/** Seções que somem no relato novo enquanto a pessoa ainda não escolheu a programação. */
export const MONITOR_OPER_PICKER_SECTION_IDS = [
  'acao',
  'detalhamento',
  'custo',
  'resumo_executivo',
  'impacto_acao',
] as const;

/** Campos da programação que o relato não pede de novo. */
export const QDQQ_IDENTITY_LOCKED_KEYS = new Set([
  'cabecalho.momento',
  'cabecalho.crs_id',
  'cabecalho.competencia_mes_ano',
  'acao.area',
  'acao.atividade',
  'acao.programa_alcancado',
  'acao.municipios_alcancados',
  'acao.periodo_inicio',
  'acao.periodo_fim',
]);

type SchemaLike = {
  sections?: { id?: string; fields?: { key?: string }[] }[];
};

export function monitorOperPickerHiddenKeys(schema: SchemaLike): Set<string> {
  const keys = new Set<string>(['acao.qtd_realizadas_conforme_programacao']);
  const ids = new Set<string>(MONITOR_OPER_PICKER_SECTION_IDS);
  for (const section of schema.sections ?? []) {
    if (!section?.id || !ids.has(section.id)) continue;
    for (const field of section.fields ?? []) {
      if (field?.key) keys.add(field.key);
    }
  }
  return keys;
}

export type QdqqCrsFiltro = { todos: boolean; ids: string[] };

type SubmissionLike = {
  id: number;
  data_json?: Record<string, any> | null;
};

function isProgramacaoAberta(data: Record<string, any> | null | undefined): boolean {
  if (!data || typeof data !== 'object') return false;
  if (String(data.acao?.qdqq_escolhida ?? '') === '1') return false;
  const momento = String(data.cabecalho?.momento ?? '');
  if (momento === 'relato') return false;
  if (momento === 'programacao') return true;
  if (momento !== '') return false;
  return String(data.acao?.qtd_programadas_qdqq ?? '') === '1';
}

function matchesCompetencia(data: Record<string, any>, competencia: string | null | undefined): boolean {
  const wanted = String(competencia ?? '').trim();
  if (!/^\d{4}-\d{2}$/.test(wanted)) return true;
  const cab = data.cabecalho ?? {};
  const comp = String(cab.competencia_mes_ano ?? '').trim();
  if (/^\d{4}-\d{2}/.test(comp)) return comp.slice(0, 7) === wanted;
  const month = monthNumberFromCabecalho(cab);
  const wantedMonth = Number(wanted.slice(5, 7));
  const ano = String(cab.ano ?? '').trim();
  if (month == null) return false;
  if (ano && ano !== wanted.slice(0, 4)) return false;
  return month === wantedMonth;
}

function matchesCrs(data: Record<string, any>, filtro: QdqqCrsFiltro | null | undefined): boolean {
  if (!filtro || filtro.todos || filtro.ids.length === 0) return true;
  const row = monitorOperRowCrsIds(data.cabecalho);
  if (row.todos) return true;
  return row.ids.some((id) => filtro.ids.includes(id));
}

export function qdqqProgramacaoOptionLabel(data: Record<string, any>): string {
  const cab = data.cabecalho ?? {};
  const acao = data.acao ?? {};
  const comp = String(cab.competencia_mes_ano ?? '').trim() || 'sem competência';
  const area = monitorOperAreaLabel(String(acao.area ?? ''));
  const ativ = formatMonitorOperAtividadeLabel(acao.atividade);
  const prog = String(acao.programa_alcancado ?? '').trim();
  const parts = [comp, area, ativ === '—' ? 'atividade não informada' : ativ];
  if (prog && !/^\d+$/.test(prog)) parts.push(prog);
  return parts.join(' — ');
}

export function listQdqqProgramacoesAbertas(
  submissions: SubmissionLike[],
  filtro?: QdqqCrsFiltro | null,
  competencia?: string | null,
): { id: number; label: string }[] {
  return submissions
    .filter(
      (row) =>
        isProgramacaoAberta(row.data_json) &&
        matchesCrs(row.data_json as Record<string, any>, filtro) &&
        matchesCompetencia(row.data_json as Record<string, any>, competencia),
    )
    .map((row) => ({
      id: row.id,
      label: qdqqProgramacaoOptionLabel(row.data_json as Record<string, any>),
      comp: String(row.data_json?.cabecalho?.competencia_mes_ano ?? ''),
    }))
    .sort((a, b) => b.comp.localeCompare(a.comp) || a.label.localeCompare(b.label, 'pt'))
    .map(({ id, label }) => ({ id, label }));
}
