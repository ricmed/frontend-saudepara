import React from 'react';
import type { QdqqGroupTotal } from '../utils/monitorOperRegionalReport';

type Tone = 'list' | 'report';

const toneIntro: Record<Tone, string> = {
  list: 'text-gray-600',
  report: 'text-slate-600',
};

const toneTh: Record<Tone, string> = {
  list: 'text-left text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-200 bg-gray-50',
  report: 'text-left text-xs font-medium text-slate-500 uppercase tracking-wide border-b border-slate-200 bg-slate-50',
};

const toneTd: Record<Tone, string> = {
  list: 'px-3 py-2.5 border-b border-gray-100 text-gray-800 tabular-nums',
  report: 'px-3 py-2.5 border-b border-slate-100 text-slate-800 tabular-nums',
};

const toneTdText: Record<Tone, string> = {
  list: 'px-3 py-2.5 border-b border-gray-100 text-gray-800 max-w-[300px]',
  report: 'px-3 py-2.5 border-b border-slate-100 text-slate-800 max-w-[300px]',
};

export type MonitorOperCrsDisplayOptions = {
  /** Visão gestão: não exibe linha secundária com identificador técnico. */
  omitSecondaryId?: boolean;
};

/** Texto para célula regional a partir do mapa CRS. */
export function formatMonitorOperCrsDisplay(
  id: unknown,
  crsLabels: Record<string, string> | undefined,
  opts?: MonitorOperCrsDisplayOptions,
): { line1: string; line2?: string; title?: string } {
  const sid = id == null || id === '' ? '' : String(id);
  if (!sid) return { line1: '—' as string, line2: undefined as string | undefined, title: undefined as string | undefined };
  const label = crsLabels?.[sid];
  if (label) {
    if (opts?.omitSecondaryId) return { line1: label, title: label };
    return { line1: label, line2: `id ${sid}`, title: `CRS id ${sid}` };
  }
  return { line1: sid, line2: undefined, title: 'Carregue a lista de CRS ou verifique o cadastro' };
}

function naoRealizadasProgramadas(g: QdqqGroupTotal): number {
  return Math.max(0, g.programadas - g.realizadasFlag);
}

function periodoQdqqCell(g: QdqqGroupTotal, managementView: boolean): React.ReactNode {
  return (
    <span className="leading-snug">
      <span className="font-medium">{g.quadrimestre_label}</span>
      {g.ano != null && String(g.ano).trim() !== '' ? (
        <span className="text-slate-600"> · {String(g.ano)}</span>
      ) : null}
      {!managementView && g.quadrimestre !== '?' ? (
        <span className="opacity-60 ml-1">({g.quadrimestre})</span>
      ) : null}
    </span>
  );
}

/**
 * Quando há mais de um CRS/ano/quadrimestre (QDQQ), exibe totais por fatia em vez de bloquear a análise.
 */
export const MonitorOperQdqqGroupedTotalsTable: React.FC<{
  groups: QdqqGroupTotal[];
  tone?: Tone;
  /** id_crs (string) → nome exibido no select (cadastro CRS). */
  crsLabels?: Record<string, string>;
  /** Textos e colunas mais enxutos (painel de gestão). */
  managementView?: boolean;
}> = ({ groups, tone = 'list', crsLabels, managementView = false }) => {
  if (groups.length === 0) return null;

  const headers = managementView
    ? ([
        'Regional',
        'Período QDQQ',
        'Mês referência',
        'Ações programadas',
        'Realizadas',
        'Não realizadas',
        'Não programadas',
        '% execução',
        'Custo',
      ] as const)
    : ([
        'Regional',
        'Período QDQQ',
        'Mês referência',
        'Ações programadas',
        'Realizadas',
        'Não realizadas',
        'Não programadas',
        '% execução',
        'Custo',
      ] as const);

  return (
    <div className="overflow-x-auto -mx-1">
      <p className={`text-sm mb-3 ${toneIntro[tone]}`}>
        {managementView ? (
          <>
            Há envios em <strong>mais de um período ou regional</strong>. Os totais abaixo estão separados por combinação
            (instrumento quadrimestral).
          </>
        ) : (
          <>
            Há envios de <strong>mais de um CRS, ano ou quadrimestre</strong> (QDQQ). Os totais abaixo seguem o instrumento
            quadrimestral, <strong>por cada combinação</strong>, para manter a leitura clara.
          </>
        )}
      </p>
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className={`px-3 py-2 ${toneTh[tone]}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => {
            const crs = formatMonitorOperCrsDisplay(g.crs_id, crsLabels, { omitSecondaryId: managementView });
            const brl = g.custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            return (
              <tr key={g.consolidationKey}>
                <td className={toneTdText[tone]} title={crs.title}>
                  <div className="min-w-0">
                    <div className="font-medium leading-snug line-clamp-2">{crs.line1}</div>
                    {crs.line2 ? (
                      <div className="text-[11px] opacity-70 tabular-nums mt-0.5">{crs.line2}</div>
                    ) : null}
                  </div>
                </td>
                <td className={`${toneTd[tone]} max-w-[260px]`}>{periodoQdqqCell(g, managementView)}</td>
                <td className={toneTd[tone]}>
                  {g.competencia_mes_ano != null && String(g.competencia_mes_ano) !== '' ? String(g.competencia_mes_ano) : '—'}
                </td>
                <td className={toneTd[tone]}>{g.programadas}</td>
                <td className={toneTd[tone]}>{g.realizadasFlag}</td>
                <td className={toneTd[tone]}>{naoRealizadasProgramadas(g)}</td>
                <td className={toneTd[tone]}>{g.naoProgramadasFlag}</td>
                <td className={toneTd[tone]}>{g.perc === undefined ? '—' : `${g.perc.toFixed(1)}%`}</td>
                <td className={toneTd[tone]}>{brl}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
