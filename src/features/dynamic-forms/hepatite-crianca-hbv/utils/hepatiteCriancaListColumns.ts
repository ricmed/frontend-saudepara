import { getValueAtPath } from '@/features/dynamic-forms/utils/formResponsesListUtils';
import { TIPO_EXPOSICAO_OPTIONS } from '@/features/dynamic-forms/utils/hepatiteCriancaExposicao';
import {
  isCasoEmAberto,
  resolveEvolucaoLabel,
} from './conclusaoLabels';
import { ALERTA_LABELS, resolveAlertasAtivos } from './dashboardOutcomeRules';
import { normalizeHepatiteSubmission } from './normalizeSubmission';
import { resolveMunicipioLabel, type MunicipioLabelMaps } from './municipioIbgeLabels';

export type HepatiteCriancaListSummary = {
  pacienteNome: string;
  nomeMae: string;
  tipoExposicao: string;
  tipoExposicaoLabel: string;
  idadeMeses: number | null;
  municipioIbge: string;
  municipioLabel: string;
  dtNotificacao: string | null;
  dtNotificacaoSort: string;
  situacaoLabel: string;
  dnv: string;
  sinanMae: string;
  cpf: string;
  cns: string;
  alertasLabels: string[];
  alertasCount: number;
};

export type HepatiteCriancaListColSpec = {
  id: string;
  label: string;
  thClassName?: string;
  tdClassName?: string;
  /** Oculta em telas &lt; lg (mantém nome, tipo e idade no mobile). */
  hiddenLg?: boolean;
  format: (row: HepatiteCriancaListSummary) => string;
  sortValue: (row: HepatiteCriancaListSummary) => string | number;
};

const LS_HEPATITE_LIST_COLS = 'dynamicForms.HEPATITE_CRIANCA_HBV.listCols';

function strField(raw: unknown): string {
  return String(raw ?? '').trim();
}

function resolveTipoExposicaoLabel(tipo: string): string {
  const found = TIPO_EXPOSICAO_OPTIONS.find((o) => o.value === tipo);
  return found?.label ?? 'Não informado';
}

function formatDatePtBr(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR');
}

function buildSituacaoLabel(dataEncerramento: string | null, evolucaoCode: string): string {
  if (isCasoEmAberto(dataEncerramento)) {
    return evolucaoCode ? `Em aberto — ${resolveEvolucaoLabel(evolucaoCode)}` : 'Em aberto';
  }
  const evol = evolucaoCode ? resolveEvolucaoLabel(evolucaoCode) : 'Encerrado';
  return `Encerrado — ${evol}`;
}

export function buildHepatiteCriancaListSummary(
  row: { id: number; data_json: Record<string, unknown> },
  municipioMaps: MunicipioLabelMaps,
): HepatiteCriancaListSummary {
  const data = row.data_json ?? {};
  const normalized = normalizeHepatiteSubmission(row.id, data);
  const municipioIbge = normalized.municipioNotificacaoIbge || normalized.municipioResidenciaIbge;
  const alertas = resolveAlertasAtivos(normalized);

  let dtNotificacaoSort = '';
  if (normalized.dtNotificacao) {
    const d = new Date(normalized.dtNotificacao);
    if (!Number.isNaN(d.getTime())) dtNotificacaoSort = d.toISOString();
  }

  return {
    pacienteNome: strField(getValueAtPath(data, 'paciente.nome')) || '—',
    nomeMae: strField(getValueAtPath(data, 'paciente.nome_mae')) || '—',
    tipoExposicao: normalized.tipoExposicao,
    tipoExposicaoLabel: resolveTipoExposicaoLabel(normalized.tipoExposicao),
    idadeMeses: normalized.idadeMeses,
    municipioIbge,
    municipioLabel: municipioIbge
      ? resolveMunicipioLabel(municipioIbge, municipioMaps)
      : 'Não informado',
    dtNotificacao: normalized.dtNotificacao,
    dtNotificacaoSort,
    situacaoLabel: buildSituacaoLabel(
      normalized.dataEncerramento,
      normalized.conclusaoEvolucaoCaso,
    ),
    dnv: strField(getValueAtPath(data, 'crianca.numero_dnv')) || '—',
    sinanMae: normalized.numeroSinanMae || '—',
    cpf: strField(getValueAtPath(data, 'paciente.cpf')) || '—',
    cns: strField(getValueAtPath(data, 'paciente.cns')) || '—',
    alertasLabels: alertas.map((a) => ALERTA_LABELS[a]),
    alertasCount: alertas.length,
  };
}

export function buildHepatiteCriancaSummaryById(
  rows: { id: number; data_json: Record<string, unknown> }[],
  municipioMaps: MunicipioLabelMaps,
): Map<number, HepatiteCriancaListSummary> {
  const map = new Map<number, HepatiteCriancaListSummary>();
  for (const row of rows) {
    map.set(row.id, buildHepatiteCriancaListSummary(row, municipioMaps));
  }
  return map;
}

export function getHepatiteCriancaListColumnSpecs(): HepatiteCriancaListColSpec[] {
  return [
    {
      id: 'nome_crianca',
      label: 'Nome da criança',
      tdClassName: 'min-w-[10rem] max-w-[16rem] truncate font-medium',
      format: (r) => r.pacienteNome,
      sortValue: (r) => r.pacienteNome,
    },
    {
      id: 'tipo_exposicao',
      label: 'Exposição',
      tdClassName: 'whitespace-nowrap',
      format: (r) => r.tipoExposicaoLabel,
      sortValue: (r) => r.tipoExposicaoLabel,
    },
    {
      id: 'idade_meses',
      label: 'Idade',
      tdClassName: 'whitespace-nowrap',
      format: (r) => (r.idadeMeses !== null ? `${r.idadeMeses} m` : '—'),
      sortValue: (r) => (r.idadeMeses !== null ? r.idadeMeses : -1),
    },
    {
      id: 'municipio',
      label: 'Município',
      hiddenLg: true,
      tdClassName: 'min-w-[9rem] max-w-[14rem] truncate',
      format: (r) => r.municipioLabel,
      sortValue: (r) => r.municipioLabel,
    },
    {
      id: 'dt_notificacao',
      label: 'Notificação',
      hiddenLg: true,
      tdClassName: 'whitespace-nowrap',
      format: (r) => formatDatePtBr(r.dtNotificacao),
      sortValue: (r) => r.dtNotificacaoSort,
    },
    {
      id: 'situacao',
      label: 'Situação',
      hiddenLg: true,
      tdClassName: 'min-w-[9rem] max-w-[14rem] truncate',
      format: (r) => r.situacaoLabel,
      sortValue: (r) => r.situacaoLabel,
    },
    {
      id: 'nome_mae',
      label: 'Nome da mãe',
      tdClassName: 'min-w-[10rem] max-w-[16rem] truncate',
      format: (r) => r.nomeMae,
      sortValue: (r) => r.nomeMae,
    },
    {
      id: 'dnv',
      label: 'DNV',
      tdClassName: 'whitespace-nowrap font-mono text-xs',
      format: (r) => r.dnv,
      sortValue: (r) => r.dnv,
    },
    {
      id: 'sinan_mae',
      label: 'SINAN mãe',
      tdClassName: 'whitespace-nowrap',
      format: (r) => r.sinanMae,
      sortValue: (r) => r.sinanMae,
    },
    {
      id: 'cpf',
      label: 'CPF',
      tdClassName: 'whitespace-nowrap',
      format: (r) => r.cpf,
      sortValue: (r) => r.cpf,
    },
    {
      id: 'cns',
      label: 'Cartão SUS',
      tdClassName: 'whitespace-nowrap',
      format: (r) => r.cns,
      sortValue: (r) => r.cns,
    },
    {
      id: 'alertas',
      label: 'Alertas',
      tdClassName: 'min-w-[8rem] max-w-[18rem] truncate text-xs',
      format: (r) => {
        if (r.alertasCount === 0) return '—';
        if (r.alertasCount <= 2) return r.alertasLabels.join('; ');
        return `${r.alertasLabels.slice(0, 2).join('; ')} (+${r.alertasCount - 2})`;
      },
      sortValue: (r) => r.alertasCount,
    },
  ];
}

export const HEPATITE_LIST_DEFAULT_VISIBLE_COL_IDS: readonly string[] = [
  'nome_crianca',
  'tipo_exposicao',
  'idade_meses',
  'municipio',
  'dt_notificacao',
  'situacao',
];

export function getHepatiteDefaultVisibleListColIds(allowedIds: string[]): string[] {
  const allowed = new Set(allowedIds);
  return HEPATITE_LIST_DEFAULT_VISIBLE_COL_IDS.filter((id) => allowed.has(id));
}

export function readHepatiteListColSelection(): string[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LS_HEPATITE_LIST_COLS);
    if (!raw) return null;
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr) || !arr.every((x) => typeof x === 'string')) return null;
    return arr as string[];
  } catch {
    return null;
  }
}

export function writeHepatiteListColSelection(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_HEPATITE_LIST_COLS, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}
