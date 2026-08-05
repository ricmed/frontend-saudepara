import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  LayoutDashboard,
  MapPin,
  Minus,
  Target,
  Users,
  Wallet,
} from 'lucide-react';
import { MonitorOperReportFiltersBar } from '../components/MonitorOperReportFiltersBar';
import { formatMonitorOperMunicipioAlcancadoLabel } from '../utils/monitorOperRegionalReport';
import {
  SIGPLAN_GROUP_BY_LABELS,
  type SigplanGroupBy,
} from '../utils/monitorOperGeoDimensoes';
import {
  buildSigplanCustoByMunicipio,
  summarizeSigplanCusto,
} from '../utils/monitorOperSigplanCusto';
import {
  SIGPLAN_IMPACT_GROUP_LABELS,
  buildSigplanImpactosByGroup,
  type SigplanImpactGroup,
  type SigplanImpactoItem,
} from '../utils/monitorOperSigplanImpactos';
import {
  aggregateSigplanCustoByGroup,
  aggregateSigplanPresenceByGroup,
  annotateSigplanImpactosWithGroups,
} from '../utils/monitorOperSigplanGroupBy';
import {
  SIGPLAN_ATIVIDADE_KEYS,
  SIGPLAN_ATIVIDADE_LABELS,
  buildSigplanMunicipioPresenceMatrix,
  formatSigplanAvaliacaoComoLabel,
  summarizeSigplanPresence,
  type SigplanAtividadeKey,
  type SigplanMunicipioPresenceRow,
} from '../utils/monitorOperSigplanPanel';
import { useMonitorOperReport } from './monitorOperReportContext';

/** Linhas iniciais / incremento do “mostrar mais”. */
const SIGPLAN_MATRIX_PAGE_SIZE = 10;
const SIGPLAN_CUSTO_CHART_TOP = 10;
const SIGPLAN_IMPACTO_MUN_PAGE = 10;

const SUMMARY_CARD_GRAD: Record<SigplanAtividadeKey, string> = {
  capacitacao: 'from-teal-500 to-teal-700',
  avaliacao: 'from-sky-500 to-blue-700',
  acao_complementar: 'from-emerald-600 to-teal-800',
};

const CUSTO_ELEMENT_COLS: {
  key: 'el_339014' | 'el_339030' | 'el_339033' | 'el_339036' | 'el_339039' | 'total';
  label: string;
}[] = [
  { key: 'el_339014', label: 'Diárias' },
  { key: 'el_339030', label: 'Material' },
  { key: 'el_339033', label: 'Passagens' },
  { key: 'el_339036', label: 'Serv. PF' },
  { key: 'el_339039', label: 'Serv. PJ' },
  { key: 'total', label: 'Total' },
];

function formatBrl(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function PresenceBadge({ ok }: { ok: boolean }) {
  if (ok) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm"
        title="Realizado"
      >
        <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Sim
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
      title="Não realizado"
    >
      <Minus className="h-3.5 w-3.5 shrink-0" aria-hidden />
      Não
    </span>
  );
}

function PessoasHint({ n, label }: { n: number; label: string }) {
  if (n <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium tabular-nums text-slate-700">
      <Users className="h-3.5 w-3.5 text-teal-700 shrink-0" aria-hidden />
      {n.toLocaleString('pt-BR')} {label}
    </span>
  );
}

function CapacitacaoCell({
  row,
}: {
  row: Pick<SigplanMunicipioPresenceRow, 'capacitacao' | 'capacitacaoPessoas'>;
}) {
  if (!row.capacitacao) return <PresenceBadge ok={false} />;
  return (
    <div className="flex flex-col items-start gap-1.5">
      <PresenceBadge ok />
      <PessoasHint n={row.capacitacaoPessoas} label="treinada(s)" />
    </div>
  );
}

function AvaliacaoCell({
  row,
}: {
  row: Pick<SigplanMunicipioPresenceRow, 'avaliacao' | 'avaliacaoModalidades'>;
}) {
  if (!row.avaliacao) return <PresenceBadge ok={false} />;
  const modalidades = row.avaliacaoModalidades.map(formatSigplanAvaliacaoComoLabel);
  return (
    <div className="flex flex-col items-start gap-1.5">
      <PresenceBadge ok />
      {modalidades.length > 0 ? (
        <span className="text-xs text-slate-600 leading-snug max-w-[14rem]">{modalidades.join(' · ')}</span>
      ) : (
        <span className="text-[11px] text-slate-400">Sem nº de pessoas no instrumento</span>
      )}
    </div>
  );
}

function ComplementarCell({
  row,
}: {
  row: Pick<SigplanMunicipioPresenceRow, 'acao_complementar' | 'acaoComplementarPessoas'>;
}) {
  if (!row.acao_complementar) return <PresenceBadge ok={false} />;
  return (
    <div className="flex flex-col items-start gap-1.5">
      <PresenceBadge ok />
      <PessoasHint n={row.acaoComplementarPessoas} label="atendida(s)" />
    </div>
  );
}

function SummaryCard({
  atividadeKey,
  municipios,
}: {
  atividadeKey: SigplanAtividadeKey;
  municipios: number;
}) {
  return (
    <div
      className={`rounded-xl px-4 py-3.5 text-center text-white shadow-md bg-gradient-to-br ${SUMMARY_CARD_GRAD[atividadeKey]}`}
      data-testid={`monitor-oper-sigplan-summary-${atividadeKey}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/90 leading-tight">
        {SIGPLAN_ATIVIDADE_LABELS[atividadeKey]}
      </p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums leading-none">{municipios}</p>
      <p className="mt-1 text-[10px] text-white/85 leading-snug">município(s) com realização</p>
    </div>
  );
}

function TablePager({
  visible,
  total,
  pageSize,
  onMore,
  onCollapse,
  testIdPrefix,
}: {
  visible: number;
  total: number;
  pageSize: number;
  onMore: () => void;
  onCollapse: () => void;
  testIdPrefix: string;
}) {
  const hasMore = visible < total;
  const canCollapse = visible > pageSize;
  if (total === 0) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/70 rounded-b-2xl">
      <p className="text-xs text-slate-500 tabular-nums" data-testid={`${testIdPrefix}-count`}>
        Exibindo {Math.min(visible, total)} de {total} município(s)
      </p>
      <div className="flex flex-wrap gap-2">
        {canCollapse ? (
          <button
            type="button"
            data-testid={`${testIdPrefix}-collapse`}
            onClick={onCollapse}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <ChevronUp className="h-3.5 w-3.5" aria-hidden />
            Mostrar menos
          </button>
        ) : null}
        {hasMore ? (
          <button
            type="button"
            data-testid={`${testIdPrefix}-more`}
            onClick={onMore}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-teal-800"
          >
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            Mostrar mais {Math.min(pageSize, total - visible)}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SigplanImpactoItemCard({
  item,
  expanded,
  onToggle,
  municipioLabels,
}: {
  item: SigplanImpactoItem;
  expanded: boolean;
  onToggle: () => void;
  municipioLabels: Record<string, string>;
}) {
  const [munVisible, setMunVisible] = useState(SIGPLAN_IMPACTO_MUN_PAGE);
  const n = item.municipioIds.length;
  const shown = expanded ? item.municipioIds.slice(0, munVisible) : [];

  return (
    <li className="rounded-md border border-slate-100 bg-slate-50/80 overflow-hidden">
      <button
        type="button"
        onClick={() => {
          onToggle();
          setMunVisible(SIGPLAN_IMPACTO_MUN_PAGE);
        }}
        className="w-full flex items-start gap-2 px-2 py-1.5 text-left hover:bg-teal-50/50 transition-colors"
        aria-expanded={expanded}
        data-testid={`monitor-oper-sigplan-impacto-toggle-${item.key}`}
      >
        <span className="mt-0.5 shrink-0 text-teal-700">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-xs text-slate-700 leading-snug line-clamp-2" title={item.label}>
            {item.label}
          </span>
          <span className="mt-0.5 block text-[10px] font-medium tabular-nums text-teal-800">
            Em {n} município(s)
            {item.groupCount != null && item.groupCount > 0
              ? ` · ${item.groupCount} grupo(s)`
              : ''}
          </span>
        </span>
      </button>
      {expanded ? (
        <div className="px-2 pb-2 border-t border-slate-100/80 bg-white/70">
          <ul className="mt-1.5 space-y-0.5 max-h-40 overflow-y-auto">
            {shown.map((id) => (
              <li key={id} className="text-[11px] text-slate-600 pl-1">
                {formatMonitorOperMunicipioAlcancadoLabel(id, municipioLabels)}
              </li>
            ))}
          </ul>
          {n > SIGPLAN_IMPACTO_MUN_PAGE ? (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {munVisible < n ? (
                <button
                  type="button"
                  className="text-[10px] font-medium text-teal-800 hover:underline"
                  onClick={() => setMunVisible((v) => Math.min(v + SIGPLAN_IMPACTO_MUN_PAGE, n))}
                >
                  Mostrar mais {Math.min(SIGPLAN_IMPACTO_MUN_PAGE, n - munVisible)}
                </button>
              ) : null}
              {munVisible > SIGPLAN_IMPACTO_MUN_PAGE ? (
                <button
                  type="button"
                  className="text-[10px] font-medium text-slate-600 hover:underline"
                  onClick={() => setMunVisible(SIGPLAN_IMPACTO_MUN_PAGE)}
                >
                  Mostrar menos
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export const MonitorOperSigplanPanelView: React.FC = () => {
  const { filters, setFilters, filterOptions, crsLabels, municipioLabels, geoCatalog, rows, schema } =
    useMonitorOperReport();

  const [groupBy, setGroupBy] = useState<SigplanGroupBy>('municipio');
  const entityLabel = SIGPLAN_GROUP_BY_LABELS[groupBy];

  const matrix = useMemo(() => buildSigplanMunicipioPresenceMatrix(rows), [rows]);
  const summary = useMemo(() => summarizeSigplanPresence(matrix, rows), [matrix, rows]);
  const custoSummary = useMemo(() => summarizeSigplanCusto(rows), [rows]);
  const custoByMun = useMemo(() => buildSigplanCustoByMunicipio(rows), [rows]);
  const impactosRaw = useMemo(() => buildSigplanImpactosByGroup(rows, schema), [rows, schema]);

  const presenceRows = useMemo(
    () =>
      aggregateSigplanPresenceByGroup(matrix, groupBy, geoCatalog, municipioLabels, crsLabels),
    [matrix, groupBy, geoCatalog, municipioLabels, crsLabels],
  );
  const custoRows = useMemo(
    () =>
      aggregateSigplanCustoByGroup(custoByMun, groupBy, geoCatalog, municipioLabels, crsLabels),
    [custoByMun, groupBy, geoCatalog, municipioLabels, crsLabels],
  );
  const impactosByGroup = useMemo(
    () =>
      annotateSigplanImpactosWithGroups(
        impactosRaw,
        groupBy,
        geoCatalog,
        municipioLabels,
        crsLabels,
      ),
    [impactosRaw, groupBy, geoCatalog, municipioLabels, crsLabels],
  );

  const [visibleCount, setVisibleCount] = useState(SIGPLAN_MATRIX_PAGE_SIZE);
  const [custoVisibleCount, setCustoVisibleCount] = useState(SIGPLAN_MATRIX_PAGE_SIZE);
  const [expandedImpactKey, setExpandedImpactKey] = useState<string | null>(null);

  useEffect(() => {
    setVisibleCount(SIGPLAN_MATRIX_PAGE_SIZE);
    setCustoVisibleCount(SIGPLAN_MATRIX_PAGE_SIZE);
    setExpandedImpactKey(null);
  }, [filters, groupBy, presenceRows.length, custoRows.length, schema]);

  const visibleRows = useMemo(
    () => presenceRows.slice(0, visibleCount),
    [presenceRows, visibleCount],
  );
  const visibleCustoRows = useMemo(
    () => custoRows.slice(0, custoVisibleCount),
    [custoRows, custoVisibleCount],
  );

  const custoChartData = useMemo(
    () =>
      custoRows.slice(0, SIGPLAN_CUSTO_CHART_TOP).map((r) => {
        const label = r.groupLabel;
        return {
          name: label.length > 22 ? `${label.slice(0, 20)}…` : label,
          fullName: label,
          total: Math.round(r.total * 100) / 100,
        };
      }),
    [custoRows],
  );

  const custoChartHeightPx = useMemo(
    () => Math.min(420, Math.max(160, 56 + custoChartData.length * 36)),
    [custoChartData.length],
  );

  const custoElementosTabela = useMemo(
    () => [
      { elemento: 'Diárias', valor: custoSummary.elementos.el_339014 },
      { elemento: 'Material de consumo', valor: custoSummary.elementos.el_339030 },
      { elemento: 'Passagens e locomoção', valor: custoSummary.elementos.el_339033 },
      { elemento: 'Serviços pessoa física', valor: custoSummary.elementos.el_339036 },
      { elemento: 'Serviços pessoa jurídica', valor: custoSummary.elementos.el_339039 },
    ],
    [custoSummary.elementos],
  );

  return (
    <div className="space-y-6 pb-10" data-testid="monitor-oper-sigplan-panel">
      <div className="rounded-2xl overflow-hidden border border-cyan-200/50 bg-gradient-to-br from-cyan-700 via-teal-700 to-emerald-900 text-white shadow-xl">
        <div className="px-5 py-6 md:px-8 md:py-8 max-w-4xl mx-auto">
          <p className="text-center text-cyan-100/95 text-[11px] md:text-xs font-semibold tracking-[0.14em] uppercase">
            Painel SIGPLAN
          </p>
          <h1 className="mt-2 text-xl md:text-2xl font-bold leading-snug text-center drop-shadow-sm">
            Presença qualitativa por território
          </h1>
          <p className="mt-2 text-sm text-white/90 leading-relaxed max-w-2xl mx-auto text-center">
            Capacitação e ação complementar: realização e nº de pessoas. Avaliação e análise: realização e modalidade
            (o instrumento não registra pessoas). Filtre por macrorregião, região de saúde ou integração; agrupe as
            visualizações no eixo desejado.
          </p>
        </div>
      </div>

      <MonitorOperReportFiltersBar
        filters={filters}
        setFilters={setFilters}
        filterOptions={filterOptions}
        crsLabels={crsLabels}
        geoCatalog={geoCatalog}
      />

      <section
        className="rounded-2xl border border-slate-200/80 bg-white shadow-md overflow-hidden p-4 md:p-5"
        aria-label="Agrupar visualizações"
      >
        <label className="flex flex-col gap-1 max-w-md">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
            Agrupar por
          </span>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as SigplanGroupBy)}
            data-testid="monitor-oper-sigplan-groupby"
          >
            {(Object.keys(SIGPLAN_GROUP_BY_LABELS) as SigplanGroupBy[]).map((k) => (
              <option key={k} value={k}>
                {SIGPLAN_GROUP_BY_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section
        className="rounded-2xl border border-slate-200/80 bg-white shadow-lg overflow-hidden p-4 md:p-6"
        aria-labelledby="monitor-oper-sigplan-strip"
      >
        <h2
          id="monitor-oper-sigplan-strip"
          className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-4"
        >
          Resumo SIGPLAN
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" aria-label="Resumo de municípios com realização">
          <SummaryCard atividadeKey="capacitacao" municipios={summary.municipios.capacitacao} />
          <SummaryCard atividadeKey="avaliacao" municipios={summary.municipios.avaliacao} />
          <SummaryCard
            atividadeKey="acao_complementar"
            municipios={summary.municipios.acao_complementar}
          />
        </div>
      </section>

      <section
        className="rounded-2xl border border-teal-200/40 bg-gradient-to-b from-white via-teal-50/15 to-slate-50/80 shadow-xl ring-1 ring-slate-200/50"
        aria-label={`Presença por ${entityLabel}`}
      >
        <div className="rounded-t-2xl border-b border-teal-900/10 bg-gradient-to-r from-teal-800 via-teal-700 to-cyan-700 px-4 py-4 md:px-6 md:py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-inner ring-1 ring-white/25">
              <LayoutDashboard className="h-5 w-5 text-white" aria-hidden />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white drop-shadow-sm md:text-lg">
                Presença por {entityLabel.toLowerCase()}
              </h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-teal-50/95">
                No agrupamento, “Sim” = pelo menos um município do grupo com realização. Capacitação e complementar
                somam pessoas das linhas municipais; avaliação lista modalidades.
              </p>
            </div>
          </div>
        </div>

        {presenceRows.length === 0 ? (
          <p className="px-4 py-10 text-sm text-slate-500 text-center" data-testid="monitor-oper-sigplan-empty">
            Nenhum território com capacitação, avaliação e análise ou ação complementar realizada nos filtros
            atuais.
          </p>
        ) : (
          <>
            <div className="p-1 md:p-2">
              <table
                className="min-w-full text-sm border-separate border-spacing-0"
                data-testid="monitor-oper-sigplan-matrix"
              >
                <thead>
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-white">
                    <th className="px-4 py-2.5 sticky top-0 left-0 z-30 min-w-[160px] bg-slate-700 shadow-[inset_0_-1px_0_0_rgb(51_65_85)]">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 opacity-80" aria-hidden />
                        {entityLabel}
                      </span>
                    </th>
                    {SIGPLAN_ATIVIDADE_KEYS.map((key) => (
                      <th
                        key={key}
                        className="px-4 py-2.5 whitespace-nowrap sticky top-0 z-20 bg-slate-700 shadow-[inset_0_-1px_0_0_rgb(51_65_85)]"
                      >
                        {SIGPLAN_ATIVIDADE_LABELS[key]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row, idx) => (
                    <tr
                      key={row.groupKey}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                    >
                      <td
                        className={`px-4 py-2.5 font-medium text-slate-800 sticky left-0 z-10 whitespace-nowrap border-b border-slate-100 ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                        }`}
                      >
                        {row.groupLabel}
                        {groupBy !== 'municipio' ? (
                          <span className="ml-1 text-[10px] font-normal text-slate-500 tabular-nums">
                            ({row.municipioCount} mun.)
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-2.5 align-top border-b border-slate-100">
                        <CapacitacaoCell row={row} />
                      </td>
                      <td className="px-4 py-2.5 align-top border-b border-slate-100">
                        <AvaliacaoCell row={row} />
                      </td>
                      <td className="px-4 py-2.5 align-top border-b border-slate-100">
                        <ComplementarCell row={row} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePager
              visible={visibleCount}
              total={presenceRows.length}
              pageSize={SIGPLAN_MATRIX_PAGE_SIZE}
              onMore={() =>
                setVisibleCount((n) => Math.min(n + SIGPLAN_MATRIX_PAGE_SIZE, presenceRows.length))
              }
              onCollapse={() => setVisibleCount(SIGPLAN_MATRIX_PAGE_SIZE)}
              testIdPrefix="monitor-oper-sigplan-matrix"
            />
          </>
        )}
      </section>

      <section
        className="rounded-2xl border border-teal-200/40 bg-gradient-to-b from-white via-teal-50/15 to-slate-50/80 shadow-xl ring-1 ring-slate-200/50"
        aria-label="Custo da ação por município"
        data-testid="monitor-oper-sigplan-custo"
      >
        <div className="rounded-t-2xl border-b border-teal-900/10 bg-gradient-to-r from-teal-800 via-teal-700 to-cyan-700 px-4 py-4 md:px-6 md:py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-inner ring-1 ring-white/25">
              <Wallet className="h-5 w-5 text-white" aria-hidden />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white drop-shadow-sm md:text-lg">
                Custo da ação por município
              </h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-teal-50/95">
                Quando a ação alcança vários municípios, o custo é rateado em partes iguais. O total geral soma cada ação
                uma vez (não infla).
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          <div
            className="rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 px-4 py-3.5 text-white shadow-md max-w-sm"
            data-testid="monitor-oper-sigplan-custo-total"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-100/95">
              Custo total (ações com município)
            </p>
            <p className="mt-1.5 text-2xl font-bold tabular-nums leading-none">
              {formatBrl(custoSummary.totalGeral)}
            </p>
            <p className="mt-1 text-[10px] text-white/85">
              {custoRows.length} {entityLabel.toLowerCase()}(s) com fatia de custo
            </p>
          </div>

          {custoRows.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6" data-testid="monitor-oper-sigplan-custo-empty">
              Nenhum custo associado a território nos filtros atuais.
            </p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
              <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden flex flex-col">
                <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-teal-50/30 px-4 py-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Maiores custos por {entityLabel.toLowerCase()}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Top {SIGPLAN_CUSTO_CHART_TOP} (rateado)</p>
                </div>
                <div className="p-4 flex-1 flex items-center">
                  <div className="w-full" style={{ height: custoChartHeightPx }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={custoChartData}
                        margin={{ top: 4, right: 48, left: 4, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 10 }}
                          stroke="#94a3b8"
                          tickFormatter={(v: number) =>
                            Number(v).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                              maximumFractionDigits: 0,
                            })
                          }
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={110}
                          tick={{ fontSize: 10 }}
                          stroke="#64748b"
                        />
                        <Tooltip
                          formatter={(v: number) => [formatBrl(v), 'Custo']}
                          labelFormatter={(_, p) => (p?.[0]?.payload?.fullName as string) ?? ''}
                        />
                        <Bar dataKey="total" name="Custo" fill="#0284c7" radius={[0, 6, 6, 0]}>
                          <LabelList
                            dataKey="total"
                            position="right"
                            formatter={(v: number) => formatBrl(Number(v))}
                            style={{ fill: '#334155', fontSize: 10, fontWeight: 600 }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden flex flex-col">
                <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/30 px-4 py-3">
                  <h3 className="text-sm font-semibold text-slate-900">Elementos de despesa (total)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Soma das ações — sem rateio</p>
                </div>
                <div className="p-4 flex-1">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-slate-200/80">
                      {custoElementosTabela.map((row) => (
                        <tr key={row.elemento}>
                          <td className="py-2 pr-2 text-slate-700">{row.elemento}</td>
                          <td className="py-2 text-right tabular-nums font-medium text-slate-900">
                            {formatBrl(row.valor)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50/80">
                        <td className="py-2.5 pr-2 font-semibold text-slate-800">Total</td>
                        <td className="py-2.5 text-right tabular-nums font-bold text-teal-800">
                          {formatBrl(custoSummary.totalGeral)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {custoRows.length > 0 ? (
          <>
            <div className="px-1 md:px-2 pb-1">
              <table
                className="min-w-full text-sm border-separate border-spacing-0"
                data-testid="monitor-oper-sigplan-custo-matrix"
              >
                <thead>
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-white">
                    <th className="px-3 py-2.5 sticky top-0 left-0 z-30 min-w-[140px] bg-slate-700 shadow-[inset_0_-1px_0_0_rgb(51_65_85)]">
                      {entityLabel}
                    </th>
                    {CUSTO_ELEMENT_COLS.map((col) => (
                      <th
                        key={col.key}
                        className="px-3 py-2.5 whitespace-nowrap text-right sticky top-0 z-20 bg-slate-700 shadow-[inset_0_-1px_0_0_rgb(51_65_85)]"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleCustoRows.map((row, idx) => (
                    <tr
                      key={row.groupKey}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                    >
                      <td
                        className={`px-3 py-2 font-medium text-slate-800 sticky left-0 z-10 whitespace-nowrap border-b border-slate-100 ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                        }`}
                      >
                        {row.groupLabel}
                      </td>
                      {CUSTO_ELEMENT_COLS.map((col) => (
                        <td
                          key={col.key}
                          className={`px-3 py-2 text-right tabular-nums border-b border-slate-100 ${
                            col.key === 'total' ? 'font-semibold text-teal-800' : 'text-slate-700'
                          }`}
                        >
                          {formatBrl(row[col.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePager
              visible={custoVisibleCount}
              total={custoRows.length}
              pageSize={SIGPLAN_MATRIX_PAGE_SIZE}
              onMore={() =>
                setCustoVisibleCount((n) => Math.min(n + SIGPLAN_MATRIX_PAGE_SIZE, custoRows.length))
              }
              onCollapse={() => setCustoVisibleCount(SIGPLAN_MATRIX_PAGE_SIZE)}
              testIdPrefix="monitor-oper-sigplan-custo-matrix"
            />
          </>
        ) : null}
      </section>

      <section
        className="rounded-2xl border border-teal-200/40 bg-gradient-to-b from-white via-teal-50/15 to-slate-50/80 shadow-xl ring-1 ring-slate-200/50"
        aria-label="Impactos por área de vigilância"
        data-testid="monitor-oper-sigplan-impactos"
      >
        <div className="rounded-t-2xl border-b border-teal-900/10 bg-gradient-to-r from-teal-800 via-teal-700 to-cyan-700 px-4 py-4 md:px-6 md:py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-inner ring-1 ring-white/25">
              <Target className="h-5 w-5 text-white" aria-hidden />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white drop-shadow-sm md:text-lg">
                Impactos por área de vigilância
              </h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-teal-50/95">
                Quais impactos foram marcados e em quais municípios (presença). Expanda um item para ver a lista.
                Textos longos aparecem completos ao passar o mouse.
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 md:p-4 grid gap-3 md:grid-cols-3">
          {(['epi', 'san', 'amb'] as SigplanImpactGroup[]).map((g) => {
            const list = impactosByGroup[g];
            return (
              <div
                key={g}
                className="rounded-xl border border-slate-200/90 bg-gradient-to-b from-slate-50/90 to-white overflow-hidden flex flex-col min-h-[140px]"
                data-testid={`monitor-oper-sigplan-impactos-${g}`}
              >
                <div className="px-3 py-2 border-b border-slate-200/80 bg-white/80">
                  <h3 className="text-[11px] font-semibold text-slate-800 leading-snug">
                    {SIGPLAN_IMPACT_GROUP_LABELS[g]}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 tabular-nums">
                    {list.length} impacto(s) com município
                  </p>
                </div>
                {list.length === 0 ? (
                  <p className="flex-1 flex items-center justify-center px-3 py-6 text-xs text-slate-500 text-center">
                    Nenhum impacto marcado nesta área nos filtros atuais.
                  </p>
                ) : (
                  <ul className="flex-1 overflow-y-auto max-h-[min(360px,48vh)] px-2 py-2 space-y-1.5">
                    {list.map((item) => (
                      <SigplanImpactoItemCard
                        key={item.key}
                        item={item}
                        expanded={expandedImpactKey === item.key}
                        onToggle={() =>
                          setExpandedImpactKey((cur) => (cur === item.key ? null : item.key))
                        }
                        municipioLabels={municipioLabels}
                      />
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
