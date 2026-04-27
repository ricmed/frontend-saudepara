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

/** Texto para célula “regional” a partir do id e do mapa do `/api/crs/select`. */
export function formatMonitorOperCrsDisplay(
  id: unknown,
  crsLabels: Record<string, string> | undefined,
): { line1: string; line2?: string; title?: string } {
  const sid = id == null || id === '' ? '' : String(id);
  if (!sid) return { line1: '—' as string, line2: undefined as string | undefined, title: undefined as string | undefined };
  const label = crsLabels?.[sid];
  if (label) return { line1: label, line2: `id ${sid}`, title: `CRS id ${sid}` };
  return { line1: sid, line2: undefined, title: 'Carregue a lista de CRS ou verifique o cadastro' };
}

/**
 * Quando há mais de um CRS/ano/quadrimestre (QDQQ), exibe totais por fatia em vez de bloquear a análise.
 */
export const MonitorOperQdqqGroupedTotalsTable: React.FC<{
  groups: QdqqGroupTotal[];
  tone?: Tone;
  /** id_crs (string) → nome exibido no select (cadastro CRS). */
  crsLabels?: Record<string, string>;
}> = ({ groups, tone = 'list', crsLabels }) => {
  if (groups.length === 0) return null;

  return (
    <div className="overflow-x-auto -mx-1">
      <p className={`text-sm mb-3 ${toneIntro[tone]}`}>
        Há envios de <strong>mais de um CRS, ano ou quadrimestre</strong> (QDQQ). Os totais abaixo seguem o instrumento
        quadrimestral, <strong>por cada combinação</strong> — o mesmo critério da planilha, sem perder leitura.
      </p>
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            {(
              [
                'Regional',
                'Ano',
                'Quadrimestre',
                'Competência',
                'Ações (linhas)',
                'Programadas (N)',
                'Realizadas (Σ)',
                'Não prog. (Σ)',
                'Total',
                '% realiz.',
              ] as const
            ).map((h) => (
              <th key={h} className={`px-3 py-2 ${toneTh[tone]}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => {
            const crs = formatMonitorOperCrsDisplay(g.crs_id, crsLabels);
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
              <td className={toneTd[tone]}>{String(g.ano ?? '—')}</td>
              <td className={`${toneTd[tone]} max-w-[220px]`}>
                <span className="font-medium">{g.quadrimestre_label}</span>
                <span className="opacity-60 ml-1">({g.quadrimestre})</span>
              </td>
              <td className={toneTd[tone]}>{g.competencia_mes_ano != null && String(g.competencia_mes_ano) !== '' ? String(g.competencia_mes_ano) : '—'}</td>
              <td className={toneTd[tone]}>{g.rowCount}</td>
              <td className={toneTd[tone]}>{g.programadas}</td>
              <td className={toneTd[tone]}>{g.realizadasFlag}</td>
              <td className={toneTd[tone]}>{g.naoProgramadasFlag}</td>
              <td className={toneTd[tone]}>{g.total}</td>
              <td className={toneTd[tone]}>{g.perc === undefined ? '—' : `${g.perc.toFixed(1)}%`}</td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
