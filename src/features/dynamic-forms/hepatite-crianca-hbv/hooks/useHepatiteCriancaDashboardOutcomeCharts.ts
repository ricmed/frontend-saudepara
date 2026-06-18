import { useMemo } from 'react';
import {
  TIPO_EXPOSICAO_OPTIONS,
} from '@/features/dynamic-forms/utils/hepatiteCriancaExposicao';
import type {
  HepatiteAlertaResumo,
  HepatiteAlertaTipo,
  HepatiteCasoAbertoRow,
  HepatiteChartItem,
  HepatiteCriancaSubmission,
  HepatiteDesfechoAlertasCharts,
} from '../types';
import {
  EVOLUCAO_DETECTADO,
  EVOLUCAO_NAO_DETECTADO,
  EVOLUCAO_PERDA_SEGUIMENTO,
  isCasoEmAberto,
  isObitoEvolucao,
  resolveClassificacaoLabel,
  resolveEvolucaoLabel,
} from '../utils/conclusaoLabels';
import {
  ALERTA_LABELS,
  ALERTA_SEVERIDADE,
  resolveAlertasAtivos,
} from '../utils/dashboardOutcomeRules';
import { isCasoEncerrado } from '../utils/normalizeSubmission';
import { resolveMunicipioLabel, type MunicipioLabelMaps } from '../utils/municipioIbgeLabels';

type Args = {
  dadosFiltrados: HepatiteCriancaSubmission[];
  municipioMaps: MunicipioLabelMaps;
};

function countByLabel(
  rows: HepatiteCriancaSubmission[],
  pick: (row: HepatiteCriancaSubmission) => string,
): HepatiteChartItem[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = pick(row);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function resolveTipoExposicaoLabel(tipo: string): string {
  const found = TIPO_EXPOSICAO_OPTIONS.find((o) => o.value === tipo);
  return found?.label ?? 'Não informado';
}

function formatDtNotificacao(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('pt-BR');
}

const ALERTA_ORDEM: HepatiteAlertaTipo[] = [
  'hbig_pendente',
  'esquema1_pendente',
  'esquema2_pendente',
  'hcv_36_pendente',
  'hcv_18_pendente',
  'idade_acima_limite',
  'sem_evolucao',
];

export function useHepatiteCriancaDashboardOutcomeCharts({
  dadosFiltrados,
  municipioMaps,
}: Args) {
  const desfechoAlertas = useMemo((): HepatiteDesfechoAlertasCharts => {
    const emAberto = dadosFiltrados.filter((r) => isCasoEmAberto(r.dataEncerramento));
    const encerrados = dadosFiltrados.filter((r) => isCasoEncerrado(r));

    const alertaCounts = new Map<HepatiteAlertaTipo, number>();
    for (const tipo of ALERTA_ORDEM) alertaCounts.set(tipo, 0);

    const casosEmAberto: HepatiteCasoAbertoRow[] = [];

    for (const row of emAberto) {
      const alertas = resolveAlertasAtivos(row);
      for (const alerta of alertas) {
        alertaCounts.set(alerta, (alertaCounts.get(alerta) ?? 0) + 1);
      }
      casosEmAberto.push({
        id: row.id,
        numeroSinanMae: row.numeroSinanMae || '—',
        tipoExposicaoLabel: resolveTipoExposicaoLabel(row.tipoExposicao),
        idadeMeses: row.idadeMeses,
        municipioLabel: resolveMunicipioLabel(row.municipioResidenciaIbge, municipioMaps),
        dtNotificacao: formatDtNotificacao(row.dtNotificacao),
        evolucaoLabel: resolveEvolucaoLabel(row.conclusaoEvolucaoCaso),
        alertas,
      });
    }

    casosEmAberto.sort((a, b) => {
      const prio = (r: HepatiteCasoAbertoRow) =>
        r.alertas.some((t) => ALERTA_SEVERIDADE[t] === 'alta') ? 0 : 1;
      const diff = prio(a) - prio(b);
      if (diff !== 0) return diff;
      return b.alertas.length - a.alertas.length;
    });

    const alertasResumo: HepatiteAlertaResumo[] = ALERTA_ORDEM.map((tipo) => ({
      tipo,
      label: ALERTA_LABELS[tipo],
      severidade: ALERTA_SEVERIDADE[tipo],
      count: alertaCounts.get(tipo) ?? 0,
    })).filter((a) => a.count > 0);

    const comEvolucao = dadosFiltrados.filter((r) => r.conclusaoEvolucaoCaso !== '');

    return {
      kpis: {
        total: dadosFiltrados.length,
        emAberto: emAberto.length,
        encerrados: encerrados.length,
        detectados: comEvolucao.filter((r) => r.conclusaoEvolucaoCaso === EVOLUCAO_DETECTADO).length,
        naoDetectados: comEvolucao.filter((r) => r.conclusaoEvolucaoCaso === EVOLUCAO_NAO_DETECTADO)
          .length,
        perdaSeguimento: comEvolucao.filter(
          (r) => r.conclusaoEvolucaoCaso === EVOLUCAO_PERDA_SEGUIMENTO,
        ).length,
        obitos: comEvolucao.filter((r) => isObitoEvolucao(r.conclusaoEvolucaoCaso)).length,
        comAlerta: emAberto.filter((r) => resolveAlertasAtivos(r).length > 0).length,
      },
      evolucaoCaso: countByLabel(comEvolucao, (r) => resolveEvolucaoLabel(r.conclusaoEvolucaoCaso)),
      classificacaoEtiologica: countByLabel(
        dadosFiltrados.filter((r) => r.conclusaoClassificacaoEtiologica !== ''),
        (r) => resolveClassificacaoLabel(r.conclusaoClassificacaoEtiologica),
      ),
      alertasResumo,
      casosEmAberto,
    };
  }, [dadosFiltrados, municipioMaps]);

  return { desfechoAlertas };
}
