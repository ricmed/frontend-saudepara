import React, { useMemo } from 'react';
import {
  formatCompetenciaCurta,
  sumResumoDashColumn,
  type EntomologiaResumoDashRow,
} from '../../utils/entomologiaDashboardTables';
import { EntomologiaDenseTableShell } from './EntomologiaDenseTableShell';
import {
  denseNumTdClass,
  denseTableClass,
  denseTdFrozenClass,
  denseTdScrollClass,
  denseThFrozenClass,
  denseThGroupClass,
  denseThScrollClass,
  denseThSubClass,
  denseTfootClass,
  frozenColWidthPx,
  frozenLeftPx,
  rowStripeClass,
} from './entomologiaDenseTableClasses';

const ID_HEADERS = ['CRS', 'Competência', 'Responsável', 'Município'] as const;

type PairGroup = { label: string; aegKey: keyof EntomologiaResumoDashRow; albKey: keyof EntomologiaResumoDashRow };

const PAIR_GROUPS: PairGroup[] = [
  { label: 'Imóveis', aegKey: 'imoveis_aeg', albKey: 'imoveis_alb' },
  { label: 'TB', aegKey: 'tb_aeg', albKey: 'tb_alb' },
  { label: 'PE', aegKey: 'pe_aeg', albKey: 'pe_alb' },
  { label: 'Larvas', aegKey: 'larv_aeg', albKey: 'larv_alb' },
  { label: 'Pupas', aegKey: 'pupa_aeg', albKey: 'pupa_alb' },
  { label: 'Exúvias', aegKey: 'exuv_aeg', albKey: 'exuv_alb' },
];

function FrozenTh({ index, label, rowSpan }: { index: number; label: string; rowSpan?: number }) {
  return (
    <th
      rowSpan={rowSpan}
      className={denseThFrozenClass(index, 'text-left')}
      style={{ left: frozenLeftPx(index), minWidth: frozenColWidthPx(index) }}
    >
      {label}
    </th>
  );
}

function FrozenTd({
  index,
  stripe,
  children,
  title,
}: {
  index: number;
  stripe: 'even' | 'odd';
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <td
      className={denseTdFrozenClass(index, stripe)}
      style={{ left: frozenLeftPx(index), minWidth: frozenColWidthPx(index) }}
      title={title}
    >
      {children}
    </td>
  );
}

export const EntomologiaResumoTable: React.FC<{
  rows: EntomologiaResumoDashRow[];
  crsLabels: Record<string, string>;
  municipioLabels: Record<string, string>;
}> = ({ rows, crsLabels, municipioLabels }) => {
  const totals = useMemo(
    () => ({
      tubos: sumResumoDashColumn(rows, 'tubos_com_larvas'),
      imoveis_aeg: sumResumoDashColumn(rows, 'imoveis_aeg'),
      imoveis_alb: sumResumoDashColumn(rows, 'imoveis_alb'),
      tb_aeg: sumResumoDashColumn(rows, 'tb_aeg'),
      pe_aeg: sumResumoDashColumn(rows, 'pe_aeg'),
      tb_alb: sumResumoDashColumn(rows, 'tb_alb'),
      pe_alb: sumResumoDashColumn(rows, 'pe_alb'),
      larv_aeg: sumResumoDashColumn(rows, 'larv_aeg'),
      pupa_aeg: sumResumoDashColumn(rows, 'pupa_aeg'),
      exuv_aeg: sumResumoDashColumn(rows, 'exuv_aeg'),
      larv_alb: sumResumoDashColumn(rows, 'larv_alb'),
      pupa_alb: sumResumoDashColumn(rows, 'pupa_alb'),
      exuv_alb: sumResumoDashColumn(rows, 'exuv_alb'),
      outros_lp: sumResumoDashColumn(rows, 'outros_lp'),
      total_aeg: sumResumoDashColumn(rows, 'total_aeg'),
      total_alb: sumResumoDashColumn(rows, 'total_alb'),
    }),
    [rows],
  );

  if (rows.length === 0) {
    return <p className="p-8 text-center text-gray-500">Nenhuma linha de resumo para os filtros.</p>;
  }

  return (
    <EntomologiaDenseTableShell testId="entomologia-resumo-table">
      <table className={denseTableClass()}>
        <thead>
          <tr>
            {ID_HEADERS.map((h, i) => (
              <FrozenTh key={h} index={i} label={h} rowSpan={2} />
            ))}
            <th rowSpan={2} className={denseThScrollClass('text-left min-w-[9rem]')}>
              Local
            </th>
            <th rowSpan={2} className={denseThScrollClass('text-center min-w-[3.25rem]')}>
              Tubos
            </th>
            {PAIR_GROUPS.map((g) => (
              <th key={g.label} colSpan={2} className={denseThGroupClass()}>
                {g.label}
              </th>
            ))}
            <th rowSpan={2} className={denseThScrollClass('text-center min-w-[3.25rem]')}>
              Outros
            </th>
            <th colSpan={2} className={denseThGroupClass()}>
              Totais
            </th>
          </tr>
          <tr>
            {PAIR_GROUPS.map((g) => (
              <React.Fragment key={`sub-${g.label}`}>
                <th className={denseThSubClass()}>aeg</th>
                <th className={denseThSubClass(true)}>alb</th>
              </React.Fragment>
            ))}
            <th className={denseThSubClass()}>aeg</th>
            <th className={denseThSubClass(true)}>alb</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const stripe = rowStripeClass(i);
            const crs = (crsLabels[r.crs_id] ?? r.crs_id) || '—';
            const mun = (municipioLabels[r.municipio_id] ?? r.municipio_id) || '—';
            return (
              <tr key={`${r.submission_id}-${r.municipio_id}-${i}`} className="hover:bg-blue-50/40">
                <FrozenTd index={0} stripe={stripe} title={crs}>
                  {crs}
                </FrozenTd>
                <FrozenTd index={1} stripe={stripe}>
                  {formatCompetenciaCurta(r.competencia)}
                </FrozenTd>
                <FrozenTd index={2} stripe={stripe} title={r.responsavel}>
                  {r.responsavel || '—'}
                </FrozenTd>
                <FrozenTd index={3} stripe={stripe} title={mun}>
                  {mun}
                </FrozenTd>
                <td className={denseTdScrollClass('text-left max-w-[8rem] truncate')} title={r.local_bairros}>
                  {r.local_bairros || '—'}
                </td>
                <td className={denseNumTdClass()}>{r.tubos_com_larvas}</td>
                {PAIR_GROUPS.map((g) => (
                  <React.Fragment key={`${i}-${g.label}`}>
                    <td className={denseNumTdClass()}>{r[g.aegKey] as number}</td>
                    <td className={denseNumTdClass(true)}>{r[g.albKey] as number}</td>
                  </React.Fragment>
                ))}
                <td className={denseNumTdClass()}>{r.outros_lp}</td>
                <td className={denseNumTdClass(false, 'font-semibold')}>{r.total_aeg}</td>
                <td className={denseNumTdClass(true, 'font-semibold')}>{r.total_alb}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className={denseTfootClass()}>
            <td colSpan={4} className={denseTdFrozenClass(0, 'even', 'font-semibold')} style={{ left: 0 }}>
              Total ({rows.length} linhas)
            </td>
            <td className={denseTdScrollClass()}>—</td>
            <td className={denseNumTdClass()}>{totals.tubos}</td>
            <td className={denseNumTdClass()}>{totals.imoveis_aeg}</td>
            <td className={denseNumTdClass(true)}>{totals.imoveis_alb}</td>
            <td className={denseNumTdClass()}>{totals.tb_aeg}</td>
            <td className={denseNumTdClass(true)}>{totals.tb_alb}</td>
            <td className={denseNumTdClass()}>{totals.pe_aeg}</td>
            <td className={denseNumTdClass(true)}>{totals.pe_alb}</td>
            <td className={denseNumTdClass()}>{totals.larv_aeg}</td>
            <td className={denseNumTdClass(true)}>{totals.larv_alb}</td>
            <td className={denseNumTdClass()}>{totals.pupa_aeg}</td>
            <td className={denseNumTdClass(true)}>{totals.pupa_alb}</td>
            <td className={denseNumTdClass()}>{totals.exuv_aeg}</td>
            <td className={denseNumTdClass(true)}>{totals.exuv_alb}</td>
            <td className={denseNumTdClass()}>{totals.outros_lp}</td>
            <td className={denseNumTdClass(false, 'font-semibold')}>{totals.total_aeg}</td>
            <td className={denseNumTdClass(true, 'font-semibold')}>{totals.total_alb}</td>
          </tr>
        </tfoot>
      </table>
    </EntomologiaDenseTableShell>
  );
};
