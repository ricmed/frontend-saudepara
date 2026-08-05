import {
  formatMonitorOperSim01,
  normalizeMunicipiosAlcancados,
  type MonitorOperRow,
} from './monitorOperRegionalReport';

/** Atividades do QDQQ relevantes ao painel SIGPLAN (parte 1). */
export const SIGPLAN_ATIVIDADE_KEYS = ['capacitacao', 'avaliacao', 'acao_complementar'] as const;

export type SigplanAtividadeKey = (typeof SIGPLAN_ATIVIDADE_KEYS)[number];

export const SIGPLAN_ATIVIDADE_LABELS: Record<SigplanAtividadeKey, string> = {
  capacitacao: 'Capacitação',
  avaliacao: 'Avaliação e análise',
  acao_complementar: 'Ação complementar',
};

/** Labels de `detalhamento.avaliacao_como` (instrumento não tem nº de pessoas). */
export const SIGPLAN_AVALIACAO_COMO_LABELS: Record<string, string> = {
  supervisao: 'Supervisão',
  reuniao_tecnica: 'Reunião Técnica',
  seminario: 'Seminário',
  webnario: 'Webnário',
  outra: 'Outra',
};

export type SigplanMunicipioPresenceRow = {
  municipioId: string;
  capacitacao: boolean;
  /** Soma de `detalhamento.capacitacao_n_pessoas` nas linhas realizadas que incluem o município. */
  capacitacaoPessoas: number;
  avaliacao: boolean;
  /** Modalidades distintas de `detalhamento.avaliacao_como` (avaliação não tem nº de pessoas). */
  avaliacaoModalidades: string[];
  acao_complementar: boolean;
  /** Soma de `detalhamento.complementar_pop_coberta` nas linhas realizadas que incluem o município. */
  acaoComplementarPessoas: number;
};

export type SigplanPresenceSummary = {
  municipios: Record<SigplanAtividadeKey, number>;
  /** Pessoas somadas uma vez por linha de ação (não por município). */
  capacitacaoPessoas: number;
  acaoComplementarPessoas: number;
};

function isRealizadaSim(v: unknown): boolean {
  return formatMonitorOperSim01(v) === 'Sim';
}

function normalizeAtividadeKey(raw: unknown): SigplanAtividadeKey | null {
  const t = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (t === 'capacitacao') return 'capacitacao';
  if (t === 'avaliacao') return 'avaliacao';
  if (t === 'acao_complementar') return 'acao_complementar';
  return null;
}

function parseNonNegNumber(raw: unknown): number {
  if (raw == null || raw === '') return 0;
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

export function formatSigplanAvaliacaoComoLabel(value: string): string {
  const key = value.trim().toLowerCase();
  return SIGPLAN_AVALIACAO_COMO_LABELS[key] ?? value.trim();
}

/**
 * Matriz município × atividade SIGPLAN.
 * Presença = atividade canônica + realizada Sim + município em `municipios_alcancados`.
 * Capacitação / ação complementar: soma pessoas das linhas que incluem o município.
 * Avaliação: sem campo de pessoas — coleta modalidades (`avaliacao_como`).
 */
export function buildSigplanMunicipioPresenceMatrix(rows: MonitorOperRow[]): SigplanMunicipioPresenceRow[] {
  const byMun = new Map<
    string,
    {
      capacitacao: boolean;
      capacitacaoPessoas: number;
      avaliacao: boolean;
      avaliacaoModalidades: Set<string>;
      acao_complementar: boolean;
      acaoComplementarPessoas: number;
    }
  >();

  const ensure = (id: string) => {
    let row = byMun.get(id);
    if (!row) {
      row = {
        capacitacao: false,
        capacitacaoPessoas: 0,
        avaliacao: false,
        avaliacaoModalidades: new Set(),
        acao_complementar: false,
        acaoComplementarPessoas: 0,
      };
      byMun.set(id, row);
    }
    return row;
  };

  for (const d of rows) {
    const atividade = normalizeAtividadeKey(d?.acao?.atividade);
    if (!atividade) continue;
    if (!isRealizadaSim(d?.acao?.qtd_realizadas_conforme_programacao)) continue;

    const municipios = [...new Set(normalizeMunicipiosAlcancados(d?.acao?.municipios_alcancados))];
    if (municipios.length === 0) continue;

    const det = d?.detalhamento;

    for (const munId of municipios) {
      const row = ensure(munId);
      if (atividade === 'capacitacao') {
        row.capacitacao = true;
        row.capacitacaoPessoas += parseNonNegNumber(det?.capacitacao_n_pessoas);
      } else if (atividade === 'avaliacao') {
        row.avaliacao = true;
        const como = String(det?.avaliacao_como ?? '').trim();
        if (como) row.avaliacaoModalidades.add(como);
      } else {
        row.acao_complementar = true;
        row.acaoComplementarPessoas += parseNonNegNumber(det?.complementar_pop_coberta);
      }
    }
  }

  return [...byMun.entries()]
    .map(([municipioId, flags]) => ({
      municipioId,
      capacitacao: flags.capacitacao,
      capacitacaoPessoas: flags.capacitacaoPessoas,
      avaliacao: flags.avaliacao,
      avaliacaoModalidades: [...flags.avaliacaoModalidades].sort((a, b) => a.localeCompare(b, 'pt-BR')),
      acao_complementar: flags.acao_complementar,
      acaoComplementarPessoas: flags.acaoComplementarPessoas,
    }))
    .sort((a, b) => a.municipioId.localeCompare(b.municipioId, undefined, { numeric: true }));
}

/**
 * Resumo: municípios com Sim por atividade + totais de pessoas por linha de ação
 * (evita multiplicar pessoas quando a mesma linha lista vários municípios).
 */
export function summarizeSigplanPresence(
  matrix: SigplanMunicipioPresenceRow[],
  rows: MonitorOperRow[] = [],
): SigplanPresenceSummary {
  const municipios: Record<SigplanAtividadeKey, number> = {
    capacitacao: 0,
    avaliacao: 0,
    acao_complementar: 0,
  };
  for (const r of matrix) {
    if (r.capacitacao) municipios.capacitacao += 1;
    if (r.avaliacao) municipios.avaliacao += 1;
    if (r.acao_complementar) municipios.acao_complementar += 1;
  }

  let capacitacaoPessoas = 0;
  let acaoComplementarPessoas = 0;
  for (const d of rows) {
    const atividade = normalizeAtividadeKey(d?.acao?.atividade);
    if (!atividade) continue;
    if (!isRealizadaSim(d?.acao?.qtd_realizadas_conforme_programacao)) continue;
    if (normalizeMunicipiosAlcancados(d?.acao?.municipios_alcancados).length === 0) continue;
    if (atividade === 'capacitacao') {
      capacitacaoPessoas += parseNonNegNumber(d?.detalhamento?.capacitacao_n_pessoas);
    } else if (atividade === 'acao_complementar') {
      acaoComplementarPessoas += parseNonNegNumber(d?.detalhamento?.complementar_pop_coberta);
    }
  }

  return { municipios, capacitacaoPessoas, acaoComplementarPessoas };
}
