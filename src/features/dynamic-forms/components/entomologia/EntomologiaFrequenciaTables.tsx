import React, { useMemo } from 'react';
import {
  formatCompetenciaCurta,
  formatPctCell,
  sumFrequenciaDashColumn,
  type EntomologiaFrequenciaDashRow,
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
  ENTOMO_TABLE_HALF_VIEWPORT_MAX,
  frozenColWidthPx,
  frozenLeftPx,
  rowStripeClass,
} from './entomologiaDenseTableClasses';

const ID_HEADERS = ['CRS', 'Competência', 'Responsável', 'Município'] as const;

const DEPOSIT_GROUPS = ['A1', 'A2', 'B', 'C', 'D1', 'D2', 'E'] as const;

const FREQ_COUNT_KEYS: Array<keyof EntomologiaFrequenciaDashRow> = [
  'a1_aeg',
  'a1_alb',
  'a2_aeg',
  'a2_alb',
  'b_aeg',
  'b_alb',
  'c_aeg',
  'c_alb',
  'd1_aeg',
  'd1_alb',
  'd2_aeg',
  'd2_alb',
  'e_aeg',
  'e_alb',
  'total_aeg',
  'total_alb',
];

type PctKey =
  | 'a1_aeg_pct'
  | 'a1_alb_pct'
  | 'a2_aeg_pct'
  | 'a2_alb_pct'
  | 'b_aeg_pct'
  | 'b_alb_pct'
  | 'c_aeg_pct'
  | 'c_alb_pct'
  | 'd1_aeg_pct'
  | 'd1_alb_pct'
  | 'd2_aeg_pct'
  | 'd2_alb_pct'
  | 'e_aeg_pct'
  | 'e_alb_pct';

const FREQ_PCT_KEYS: PctKey[] = [
  'a1_aeg_pct',
  'a1_alb_pct',
  'a2_aeg_pct',
  'a2_alb_pct',
  'b_aeg_pct',
  'b_alb_pct',
  'c_aeg_pct',
  'c_alb_pct',
  'd1_aeg_pct',
  'd1_alb_pct',
  'd2_aeg_pct',
  'd2_alb_pct',
  'e_aeg_pct',
  'e_alb_pct',
];

function countKeyForDeposit(deposit: string, alb: boolean): keyof EntomologiaFrequenciaDashRow {
  const base = deposit.toLowerCase();
  return `${base}_${alb ? 'alb' : 'aeg'}` as keyof EntomologiaFrequenciaDashRow;
}

function pctKeyForDeposit(deposit: string, alb: boolean): PctKey {
  const base = deposit.toLowerCase();
  return `${base}_${alb ? 'alb' : 'aeg'}_pct` as PctKey;
}

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

function IdentityCells({
  row,
  stripe,
  crsLabels,
  municipioLabels,
}: {
  row: EntomologiaFrequenciaDashRow;
  stripe: 'even' | 'odd';
  crsLabels: Record<string, string>;
  municipioLabels: Record<string, string>;
}) {
  const crs = (crsLabels[row.crs_id] ?? row.crs_id) || '—';
  const mun = (municipioLabels[row.municipio_id] ?? row.municipio_id) || '—';
  return (
    <>
      <FrozenTd index={0} stripe={stripe} title={crs}>
        {crs}
      </FrozenTd>
      <FrozenTd index={1} stripe={stripe}>
        {formatCompetenciaCurta(row.competencia)}
      </FrozenTd>
      <FrozenTd index={2} stripe={stripe} title={row.responsavel}>
        {row.responsavel || '—'}
      </FrozenTd>
      <FrozenTd index={3} stripe={stripe} title={mun}>
        {mun}
      </FrozenTd>
    </>
  );
}

const FrequenciaContagensTable: React.FC<{
  rows: EntomologiaFrequenciaDashRow[];
  crsLabels: Record<string, string>;
  municipioLabels: Record<string, string>;
}> = ({ rows, crsLabels, municipioLabels }) => {
  const totals = useMemo(() => {
    const o: Record<string, number> = {};
    for (const k of FREQ_COUNT_KEYS) o[k] = sumFrequenciaDashColumn(rows, k);
    return o;
  }, [rows]);

  return (
    <EntomologiaDenseTableShell title="Contagens por depósito" testId="entomologia-freq-counts-table" maxHeightClass={ENTOMO_TABLE_HALF_VIEWPORT_MAX}>
      <table className={denseTableClass()}>
        <thead>
          <tr>
            {ID_HEADERS.map((h, i) => (
              <FrozenTh key={h} index={i} label={h} rowSpan={2} />
            ))}
            {DEPOSIT_GROUPS.map((d) => (
              <th key={d} colSpan={2} className={denseThGroupClass()}>
                {d}
              </th>
            ))}
            <th colSpan={2} className={denseThGroupClass()}>
              Totais
            </th>
          </tr>
          <tr>
            {DEPOSIT_GROUPS.map((d) => (
              <React.Fragment key={`sub-${d}`}>
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
            return (
              <tr key={`c-${r.submission_id}-${r.municipio_id}-${i}`} className="hover:bg-blue-50/40">
                <IdentityCells row={r} stripe={stripe} crsLabels={crsLabels} municipioLabels={municipioLabels} />
                {DEPOSIT_GROUPS.map((d) => (
                  <React.Fragment key={`${i}-${d}`}>
                    <td className={denseNumTdClass()}>{r[countKeyForDeposit(d, false)] as number}</td>
                    <td className={denseNumTdClass(true)}>{r[countKeyForDeposit(d, true)] as number}</td>
                  </React.Fragment>
                ))}
                <td className={denseNumTdClass(false, 'font-semibold')}>{r.total_aeg}</td>
                <td className={denseNumTdClass(true, 'font-semibold')}>{r.total_alb}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className={denseTfootClass()}>
            <td colSpan={4} className={denseTdFrozenClass(0, 'even')} style={{ left: 0 }}>
              Total ({rows.length} linhas)
            </td>
            {FREQ_COUNT_KEYS.map((k) => (
              <td key={k} className={denseNumTdClass(k.endsWith('_alb'))}>
                {totals[k]}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </EntomologiaDenseTableShell>
  );
};

const FrequenciaPctTable: React.FC<{
  rows: EntomologiaFrequenciaDashRow[];
  crsLabels: Record<string, string>;
  municipioLabels: Record<string, string>;
}> = ({ rows, crsLabels, municipioLabels }) => (
  <EntomologiaDenseTableShell
    title="Frequência relativa (%)"
    testId="entomologia-freq-pct-table"
    maxHeightClass={ENTOMO_TABLE_HALF_VIEWPORT_MAX}
  >
    <table className={denseTableClass()}>
      <thead>
        <tr>
          {ID_HEADERS.map((h, i) => (
            <FrozenTh key={h} index={i} label={h} rowSpan={2} />
          ))}
          {DEPOSIT_GROUPS.map((d) => (
            <th key={d} colSpan={2} className={denseThGroupClass()}>
              {d}
            </th>
          ))}
        </tr>
        <tr>
          {DEPOSIT_GROUPS.map((d) => (
            <React.Fragment key={`pct-sub-${d}`}>
              <th className={denseThSubClass()}>aeg%</th>
              <th className={denseThSubClass(true)}>alb%</th>
            </React.Fragment>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const stripe = rowStripeClass(i);
          return (
            <tr key={`p-${r.submission_id}-${r.municipio_id}-${i}`} className="hover:bg-blue-50/40">
              <IdentityCells row={r} stripe={stripe} crsLabels={crsLabels} municipioLabels={municipioLabels} />
              {DEPOSIT_GROUPS.map((d) => (
                <React.Fragment key={`pct-${i}-${d}`}>
                  <td className={denseNumTdClass()}>{formatPctCell(r[pctKeyForDeposit(d, false)])}</td>
                  <td className={denseNumTdClass(true)}>{formatPctCell(r[pctKeyForDeposit(d, true)])}</td>
                </React.Fragment>
              ))}
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr className={denseTfootClass()}>
          <td colSpan={4} className={denseTdFrozenClass(0, 'even')} style={{ left: 0 }}>
            —
          </td>
          {FREQ_PCT_KEYS.map((k) => (
            <td key={k} className={denseNumTdClass(k.includes('_alb'))}>
              —
            </td>
          ))}
        </tr>
      </tfoot>
    </table>
  </EntomologiaDenseTableShell>
);

export const EntomologiaFrequenciaTables: React.FC<{
  rows: EntomologiaFrequenciaDashRow[];
  crsLabels: Record<string, string>;
  municipioLabels: Record<string, string>;
}> = ({ rows, crsLabels, municipioLabels }) => {
  if (rows.length === 0) {
    return <p className="p-8 text-center text-gray-500">Nenhuma linha de frequência para os filtros.</p>;
  }

  return (
    <div className="divide-y divide-slate-200">
      <FrequenciaContagensTable rows={rows} crsLabels={crsLabels} municipioLabels={municipioLabels} />
      <FrequenciaPctTable rows={rows} crsLabels={crsLabels} municipioLabels={municipioLabels} />
    </div>
  );
};
