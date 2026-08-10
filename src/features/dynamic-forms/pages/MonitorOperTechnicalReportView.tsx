import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowDownWideNarrow, ArrowUp, MapPin, PieChart as PieChartIcon, Target } from 'lucide-react';
import { getMunicipioBandeiraPathBase } from '@/utils/municipioBandeiraPa';
import { formatMonitorOperCrsDisplay, MonitorOperQdqqGroupedTotalsTable } from '../components/MonitorOperQdqqGroupedTotalsTable';
import { MonitorOperReportFiltersBar } from '../components/MonitorOperReportFiltersBar';
import {
  buildAtividadesPorArea,
  buildMunicipiosPorCrs,
  buildMunicipiosRanking,
  buildObstaculosDetalhe,
  buildProgramasAlcancadosRanking,
  formatMonitorOperAtividadeLabel,
  formatMonitorOperMunicipioAlcancadoLabel,
  quadrimestreLabel,
} from '../utils/monitorOperRegionalReport';
import { useMonitorOperReport } from './monitorOperReportContext';

function groupLabel(g: 'epi' | 'san' | 'amb'): string {
  if (g === 'epi') return 'Vigilância epidemiológica e controle de doenças';
  if (g === 'san') return 'Vigilância sanitária';
  return 'Vigilância ambiental e saúde do trabalhador';
}

function formatQdqqDisplay(q: string): string {
  if (q === 'Q1' || q === 'Q2' || q === 'Q3') return quadrimestreLabel(q);
  if (q === '?' || !q) return '—';
  return String(q);
}

/** Miniatura da bandeira municipal (PA), mesmo padrão do dashboard Comunicação DAE. */
function MunicipioBandeiraMini({ nomeMunicipio }: { nomeMunicipio: string }) {
  const base = getMunicipioBandeiraPathBase(nomeMunicipio);
  return (
    <img
      src={`${base}.jpg`}
      alt=""
      className="h-7 w-10 shrink-0 rounded object-cover shadow-sm ring-1 ring-slate-200/80"
      loading="lazy"
      onError={(e) => {
        const el = e.currentTarget;
        if (el.src.endsWith('.jpg')) {
          el.src = `${base}.png`;
        } else {
          el.style.visibility = 'hidden';
        }
      }}
    />
  );
}

type MonitorOperImpactGroup = 'epi' | 'san' | 'amb';

export const MonitorOperTechnicalReportView: React.FC = () => {
  const { filters, setFilters, filterOptions, crsLabels, municipioLabels, geoCatalog, rows, report, summaries } =
    useMonitorOperReport();

  /** Ordenação da lista de impactos: independente por área (padrão: maior → menor). */
  const [impactSortDescByGroup, setImpactSortDescByGroup] = useState<Record<MonitorOperImpactGroup, boolean>>({
    epi: true,
    san: true,
    amb: true,
  });

  const ta = report.totalAcumulado;
  const taMixed = ta != null && 'mixed' in ta && ta.mixed === true;
  const taOk = ta != null && 'mixed' in ta && ta.mixed === false;

  const qdqqPieData = useMemo(() => {
    if (!taOk || !ta || taMixed || !('programadas' in ta)) return [];
    const t = ta as { programadas: number; realizadasFlag: number; naoProgramadasFlag: number };
    return [
      { name: 'Programadas', value: t.programadas, fill: '#0d9488' },
      { name: 'Realizadas', value: t.realizadasFlag, fill: '#0284c7' },
      { name: 'Não programadas', value: t.naoProgramadasFlag, fill: '#64748b' },
    ].filter((d) => d.value > 0);
  }, [ta, taOk, taMixed]);

  const custoBarData = useMemo(
    () => [
      { name: 'Diárias', value: report.custoSums.el_339014 },
      { name: 'Material', value: report.custoSums.el_339030 },
      { name: 'Passagens', value: report.custoSums.el_339033 },
      { name: 'Serv. PF', value: report.custoSums.el_339036 },
      { name: 'Serv. PJ', value: report.custoSums.el_339039 },
    ],
    [report.custoSums],
  );

  const custoTabelaRows = useMemo(
    () => [
      { elemento: 'Diárias', valor: report.custoSums.el_339014 },
      { elemento: 'Material de consumo', valor: report.custoSums.el_339030 },
      { elemento: 'Passagens e locomoção', valor: report.custoSums.el_339033 },
      { elemento: 'Serviços pessoa física', valor: report.custoSums.el_339036 },
      { elemento: 'Serviços pessoa jurídica', valor: report.custoSums.el_339039 },
    ],
    [report.custoSums],
  );

  const impactsByGroup = useMemo(() => {
    const sortGroup = (g: MonitorOperImpactGroup) => {
      const desc = impactSortDescByGroup[g];
      const cmp = (a: { count: number; label: string }, b: { count: number; label: string }) =>
        desc
          ? b.count - a.count || a.label.localeCompare(b.label, 'pt-BR')
          : a.count - b.count || a.label.localeCompare(b.label, 'pt-BR');
      return report.impactCounts.filter((x) => x.group === g && x.count > 0).sort(cmp);
    };
    return { epi: sortGroup('epi'), san: sortGroup('san'), amb: sortGroup('amb') };
  }, [report.impactCounts, impactSortDescByGroup]);

  const municipiosPorRegional = useMemo(() => buildMunicipiosPorCrs(rows), [rows]);

  const municipiosPorRegionalDisplay = useMemo(
    () =>
      municipiosPorRegional
        .filter((r) => r.quantidade > 0)
        .map((r) => {
          const crs = formatMonitorOperCrsDisplay(r.crs_id, crsLabels, { omitSecondaryId: true });
          const maxChips = 16;
          const ids = r.municipios;
          const shownIds = ids.slice(0, maxChips);
          const hiddenCount = ids.length - shownIds.length;
          const chips = shownIds.map((id) => ({
            id,
            label: formatMonitorOperMunicipioAlcancadoLabel(id, municipioLabels),
          }));
          return {
            key: String(r.crs_id ?? ''),
            crsLine: crs.line1,
            chips,
            hiddenCount,
            quantidade: r.quantidade,
          };
        }),
    [municipiosPorRegional, crsLabels, municipioLabels],
  );

  const municipiosRanking = useMemo(() => buildMunicipiosRanking(rows), [rows]);
  const municipiosRankingDisplay = useMemo(
    () =>
      municipiosRanking.map((r) => ({
        ...r,
        label: formatMonitorOperMunicipioAlcancadoLabel(r.municipio, municipioLabels),
      })),
    [municipiosRanking, municipioLabels],
  );

  const municipiosTop10ChartData = useMemo(
    () =>
      municipiosRankingDisplay.slice(0, 10).map((r) => ({
        name: r.label.length > 24 ? `${r.label.slice(0, 22)}…` : r.label,
        fullName: r.label,
        linhas: r.ocorrencias,
      })),
    [municipiosRankingDisplay],
  );

  const barColorsTop10 = ['#0d9488', '#0ea5e9', '#0284c7', '#047857', '#0369a1', '#14b8a6', '#0891b2', '#0f766e', '#155e75', '#115e59'];
  const atividadesPorArea = useMemo(() => buildAtividadesPorArea(rows), [rows]);
  const programasRanking = useMemo(() => buildProgramasAlcancadosRanking(rows, 40), [rows]);
  const obstaculosDetalhe = useMemo(() => buildObstaculosDetalhe(rows), [rows]);

  return (
    <div className="space-y-6 pb-10" data-testid="monitor-oper-report-technical">
      <div className="rounded-2xl overflow-hidden border border-slate-200/80 bg-gradient-to-br from-slate-700 via-slate-800 to-teal-900 text-white shadow-xl">
        <div className="px-5 py-6 md:px-8 md:py-8 max-w-4xl mx-auto">
          <p className="text-center text-slate-200/95 text-[11px] md:text-xs font-semibold tracking-[0.14em] uppercase">
            Detalhamento técnico
          </p>
          <h1 className="mt-2 text-xl md:text-2xl font-bold leading-snug text-center">
            Análise por QDQQ, municípios, impactos e custos
          </h1>
          <p className="mt-2 text-sm text-slate-200/90 leading-relaxed max-w-2xl mx-auto text-center">
            Mesmos filtros do painel executivo. Refinamentos do formulário (Sim/Não explícito, datas início/fim) podem ser
            aplicados na versão do instrumento no cadastro do formulário.
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

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-lg overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Lista detalhada dos envios</h2>
          <p className="text-xs text-slate-500 mt-0.5">Colunas adicionais para cruzamento técnico</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-700 text-left text-[11px] font-semibold uppercase tracking-wide text-white">
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5 min-w-[180px]">Regional</th>
                <th className="px-3 py-2.5 whitespace-nowrap">Mês ref.</th>
                <th className="px-3 py-2.5 min-w-[140px]">QDQQ</th>
                <th className="px-3 py-2.5 min-w-[160px]">Área</th>
                <th className="px-3 py-2.5 min-w-[120px]">Atividade</th>
                <th className="px-3 py-2.5 min-w-[140px]">Programa</th>
                <th className="px-3 py-2.5 whitespace-nowrap">Data</th>
                <th className="px-3 py-2.5 text-right whitespace-nowrap">Custo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summaries.map((s, idx) => {
                const crs = formatMonitorOperCrsDisplay(s.crs_id, crsLabels, { omitSecondaryId: true });
                return (
                  <tr key={s.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-3 py-2 text-slate-500 tabular-nums">{idx + 1}</td>
                    <td className="px-3 py-2 font-medium text-slate-800" title={crs.title}>
                      {crs.line1}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">
                      {s.competencia_mes_ano != null && String(s.competencia_mes_ano) !== ''
                        ? String(s.competencia_mes_ano)
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">{formatQdqqDisplay(String(s.quadrimestre ?? ''))}</td>
                    <td className="px-3 py-2 text-xs text-slate-700 max-w-[200px]">
                      <span className="line-clamp-2">{s.areaLabel}</span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600 max-w-[180px]">
                      <span className="line-clamp-2">{formatMonitorOperAtividadeLabel(s.atividade)}</span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600 max-w-[200px]">
                      <span className="line-clamp-2">
                        {s.programaAlcancado != null && String(s.programaAlcancado) !== ''
                          ? String(s.programaAlcancado)
                          : '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">{String(s.dataRealizacao ?? '—')}</td>
                    <td className="px-3 py-2 text-right text-xs font-medium tabular-nums">
                      {s.custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {ta && (
        <section className="overflow-hidden rounded-2xl border border-teal-200/40 bg-gradient-to-b from-white via-teal-50/15 to-slate-50/80 shadow-xl ring-1 ring-slate-200/50">
          <div className="border-b border-teal-900/10 bg-gradient-to-r from-teal-800 via-teal-700 to-cyan-700 px-4 py-4 md:px-6 md:py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-inner ring-1 ring-white/25">
                  <PieChartIcon className="h-5 w-5 text-white" aria-hidden />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight text-white drop-shadow-sm md:text-lg">
                    Análise por QDQQ
                  </h2>
                  <p className="mt-1 max-w-2xl text-xs leading-relaxed text-teal-50/95">
                    Quadrimestre consolidado com os filtros atuais. Visual alinhado às boas práticas do painel da{' '}
                    <span className="font-semibold text-white">Comunicação DAE</span> (cartões, hierarquia clara e
                    destaque para o essencial).
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 rounded-xl bg-black/10 px-3 py-2 text-[11px] font-medium text-teal-50 ring-1 ring-white/15">
                <Target className="h-4 w-4 shrink-0 text-teal-100" aria-hidden />
                Instrumento operacional regional
              </div>
            </div>
          </div>
          <div className="p-4 md:p-6">
            {taMixed && 'groups' in ta ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-md">
                <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-teal-50/30 px-4 py-3">
                  <h3 className="text-sm font-semibold text-slate-800">Totais por regional e período</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Vários quadrimestres ou CRS no filtro — leia por linha</p>
                </div>
                <div className="p-3 md:p-4">
                  <MonitorOperQdqqGroupedTotalsTable groups={ta.groups} tone="report" crsLabels={crsLabels} managementView />
                </div>
              </div>
            ) : taOk ? (
              <div className={`flex flex-col gap-6 items-stretch lg:gap-8 ${qdqqPieData.length > 0 ? 'lg:flex-row' : ''}`}>
                {qdqqPieData.length > 0 ? (
                  <div className="flex flex-1 min-w-0 flex-col items-center justify-center">
                    <div className="w-full max-w-[300px] rounded-2xl border border-slate-100 bg-white p-4 shadow-lg ring-1 ring-slate-100/80">
                      <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Distribuição no quadrimestre
                      </p>
                      <div className="h-[248px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={qdqqPieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={62}
                              outerRadius={92}
                              paddingAngle={2}
                              stroke="#fff"
                              strokeWidth={1}
                            >
                              {qdqqPieData.map((entry) => (
                                <Cell key={entry.name} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(v: number) => [String(v), 'Quantidade']}
                              contentStyle={{
                                borderRadius: 12,
                                border: '1px solid #e2e8f0',
                                fontSize: 12,
                              }}
                            />
                            <Legend
                              verticalAlign="bottom"
                              wrapperStyle={{ fontSize: '12px', paddingTop: 8 }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className={`min-w-0 flex-1 space-y-5 ${qdqqPieData.length > 0 ? 'lg:max-w-xl' : 'w-full'}`}>
                  <div className="flex flex-wrap items-stretch justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Referência</p>
                      <p className="mt-1 text-lg font-bold leading-snug text-slate-900">
                        <span className="text-teal-700">{ta.quadrimestre_label}</span>
                        <span className="mx-2 text-slate-300">·</span>
                        <span className="tabular-nums text-slate-700">Ano {String(ta.ano ?? '—')}</span>
                      </p>
                      {ta.competencia_mes_ano != null && String(ta.competencia_mes_ano) !== '' ? (
                        <p className="mt-2 text-xs text-slate-500">
                          Mês de referência:{' '}
                          <span className="font-semibold text-slate-700">{String(ta.competencia_mes_ano)}</span>
                        </p>
                      ) : null}
                    </div>
                    <div className="flex min-w-[9rem] flex-col justify-center rounded-xl bg-gradient-to-br from-teal-600 to-blue-800 px-5 py-3 text-center text-white shadow-md ring-1 ring-teal-900/10">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-100/95">% realização</p>
                      <p className="mt-1 text-3xl font-bold tabular-nums leading-none tracking-tight">
                        {ta.perc === undefined ? '—' : `${ta.perc.toFixed(1)}%`}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                    {(
                      [
                        ['Programadas', ta.programadas, 'from-teal-500 to-teal-700', 'border-teal-200/80'],
                        ['Realizadas', ta.realizadasFlag, 'from-sky-500 to-blue-700', 'border-sky-200/80'],
                        [
                          'Não realizadas',
                          Math.max(0, ta.programadas - ta.realizadasFlag),
                          'from-amber-500 to-amber-600',
                          'border-amber-200/80',
                        ],
                        ['Não programadas', ta.naoProgramadasFlag, 'from-slate-500 to-slate-700', 'border-slate-200/80'],
                      ] as const
                    ).map(([label, val, grad, border]) => (
                      <div
                        key={label}
                        className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${grad} ${border} px-3 py-3 text-center text-white shadow-md ring-1 ring-black/5`}
                      >
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                        <div className="relative text-[10px] font-semibold uppercase tracking-wide text-white/90">
                          {label}
                        </div>
                        <div className="relative mt-1.5 text-xl font-bold tabular-nums">{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-lg overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50/60 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Municípios alcançados</h2>
          <p className="text-xs text-slate-500 mt-0.5">Por regional e ranking (filtros aplicados)</p>
        </div>
        <div className="p-4 md:p-5 space-y-6">
          {municipiosPorRegionalDisplay.length === 0 && municipiosRankingDisplay.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Nenhum município informado neste conjunto.</p>
          ) : (
            <>
              {municipiosPorRegionalDisplay.length > 0 ? (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Por regional</h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full table-fixed text-sm">
                      <colgroup>
                        <col className="w-[28%]" />
                        <col className="w-[57%]" />
                        <col className="w-[15%]" />
                      </colgroup>
                      <thead>
                        <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                          <th className="px-3 py-2 align-top">Regional</th>
                          <th className="px-3 py-2 align-top">Municípios alcançados</th>
                          <th className="px-3 py-2 text-right align-top">Qtd.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {municipiosPorRegionalDisplay.map((r) => (
                          <tr key={r.key || 'empty'} className="bg-white align-top">
                            <td className="px-3 py-2 font-medium text-slate-800 break-words">{r.crsLine}</td>
                            <td className="px-3 py-2 text-slate-700">
                              <div className="flex flex-wrap gap-1.5">
                                {r.chips.map((c) => (
                                  <span
                                    key={c.id}
                                    title={c.label}
                                    className="inline-flex max-w-full rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-800 border border-slate-200/80"
                                  >
                                    <span className="truncate">{c.label}</span>
                                  </span>
                                ))}
                                {r.hiddenCount > 0 ? (
                                  <span className="inline-flex items-center rounded-md bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-900 border border-teal-100">
                                    +{r.hiddenCount} município(s)
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums font-semibold text-teal-800 whitespace-nowrap align-top">
                              {r.quantidade}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
              {municipiosRankingDisplay.length > 0 ? (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-teal-600" aria-hidden />
                    Ranking geográfico
                  </h3>
                  <p className="text-xs text-slate-500 mb-5 md:mb-6">
                    Gráfico com os <strong>10 primeiros</strong> por linhas de ação; à direita,{' '}
                    <strong>lista completa</strong> com bandeira municipal (mesmo padrão do painel Comunicação DAE).
                  </p>
                  <div className="grid gap-4 lg:grid-cols-5 lg:items-stretch rounded-2xl border border-teal-100/80 bg-gradient-to-br from-white via-teal-50/20 to-slate-50/90 p-3 md:p-4 shadow-inner">
                    <div className="lg:col-span-3 flex min-h-[240px] flex-col rounded-xl border border-white/80 bg-white px-2 pb-2 pt-4 md:pt-5 shadow-sm lg:h-full lg:min-h-[260px]">
                      {municipiosTop10ChartData.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
                          Sem dados para o gráfico.
                        </div>
                      ) : (
                        <div className="relative min-h-[220px] w-full flex-1 lg:min-h-0">
                          <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={municipiosTop10ChartData}
                            margin={{ top: 28, right: 12, left: 8, bottom: 72 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                              dataKey="name"
                              angle={-40}
                              textAnchor="end"
                              height={88}
                              tick={{ fontSize: 10, fill: '#64748b' }}
                              interval={0}
                            />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} width={36} allowDecimals={false} />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const p = payload[0]?.payload as { fullName?: string; name?: string; linhas?: number };
                                const title = p?.fullName ?? p?.name ?? '';
                                return (
                                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md text-xs">
                                    <p className="font-semibold text-slate-800 leading-snug">{title}</p>
                                    <p className="text-teal-700 mt-1 tabular-nums font-medium">
                                      {p?.linhas ?? '—'} linha(s) de ação
                                    </p>
                                  </div>
                                );
                              }}
                            />
                            <Bar dataKey="linhas" radius={[5, 5, 0, 0]} name="Linhas">
                              {municipiosTop10ChartData.map((_, i) => (
                                <Cell key={i} fill={barColorsTop10[i % barColorsTop10.length]} />
                              ))}
                              <LabelList
                                dataKey="linhas"
                                position="top"
                                style={{ fontSize: 11, fontWeight: 700, fill: '#334155' }}
                              />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                    <div className="lg:col-span-2 flex min-h-[260px] max-h-[min(70vh,640px)] flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
                      <div className="sticky top-0 z-[1] flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-teal-50/40 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                          Ranking completo
                        </p>
                        <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-900 tabular-nums">
                          {municipiosRankingDisplay.length}
                        </span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2.5">
                        <div className="space-y-2">
                          {municipiosRankingDisplay.map((r, idx) => {
                            const rankColors = ['#b45309', '#64748b', '#a16207'];
                            const dotColor = idx < 3 ? rankColors[idx] : '#0d9488';
                            return (
                              <div
                                key={r.municipio}
                                className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-2.5 py-2 transition-colors hover:border-teal-200/80 hover:bg-teal-50/30"
                              >
                                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[11px] font-bold tabular-nums text-slate-600 shadow-sm ring-1 ring-slate-200/80">
                                    {idx + 1}
                                  </span>
                                  <MunicipioBandeiraMini nomeMunicipio={r.label} />
                                  <div className="flex min-w-0 flex-1 items-center gap-2">
                                    <span
                                      className="h-2 w-2 shrink-0 rounded-full"
                                      style={{ backgroundColor: dotColor }}
                                      aria-hidden
                                    />
                                    <span className="truncate text-xs font-medium leading-snug text-slate-800" title={r.label}>
                                      {r.label}
                                    </span>
                                  </div>
                                </div>
                                <span className="shrink-0 rounded-md bg-white px-2 py-0.5 text-xs font-bold tabular-nums text-teal-800 shadow-sm ring-1 ring-teal-100">
                                  {r.ocorrencias}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-lg overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 md:px-5">
          <h2 className="text-sm font-semibold text-slate-900">Atividades e programas</h2>
          <p className="text-xs text-slate-500 mt-0.5">Duas colunas em telas largas; rolagem interna em listas longas</p>
        </div>
        <div className="p-3 md:p-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-100 overflow-hidden flex flex-col min-h-0">
            <div className="bg-slate-50/90 px-3 py-2 border-b border-slate-100">
              <h3 className="text-xs font-semibold text-slate-800">Atividades por área</h3>
            </div>
            <div className="overflow-auto max-h-[min(320px,42vh)]">
              {atividadesPorArea.length === 0 ? (
                <p className="text-xs text-slate-500 p-3 text-center">Sem dados.</p>
              ) : (
                <table className="w-full table-fixed text-xs">
                  <colgroup>
                    <col className="w-[34%]" />
                    <col className="w-[50%]" />
                    <col className="w-[16%]" />
                  </colgroup>
                  <thead className="sticky top-0 z-[1] bg-slate-50 shadow-sm">
                    <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                      <th className="px-2 py-1.5">Área</th>
                      <th className="px-2 py-1.5">Atividade</th>
                      <th className="px-2 py-1.5 text-right">Qtd.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {atividadesPorArea.map((r, i) => (
                      <tr key={`${r.areaKey}-${r.atividade}-${i}`} className="bg-white">
                        <td className="px-2 py-1 text-slate-800 align-top break-words">{r.areaLabel}</td>
                        <td className="px-2 py-1 text-slate-600 align-top break-words leading-snug">{r.atividade}</td>
                        <td className="px-2 py-1 text-right tabular-nums font-semibold text-slate-800 align-top">
                          {r.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 overflow-hidden flex flex-col min-h-0">
            <div className="bg-slate-50/90 px-3 py-2 border-b border-slate-100">
              <h3 className="text-xs font-semibold text-slate-800">Programas alcançados</h3>
            </div>
            <div className="overflow-auto max-h-[min(320px,42vh)]">
              {programasRanking.length === 0 ? (
                <p className="text-xs text-slate-500 p-3 text-center">Nenhum programa informado.</p>
              ) : (
                <table className="w-full table-fixed text-xs">
                  <colgroup>
                    <col className="w-[82%]" />
                    <col className="w-[18%]" />
                  </colgroup>
                  <thead className="sticky top-0 z-[1] bg-slate-50 shadow-sm">
                    <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                      <th className="px-2 py-1.5">Programa</th>
                      <th className="px-2 py-1.5 text-right">Linhas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {programasRanking.map((r) => (
                      <tr key={r.programa} className="bg-white">
                        <td className="px-2 py-1 text-slate-800 leading-snug break-words">{r.programa}</td>
                        <td className="px-2 py-1 text-right tabular-nums font-semibold text-slate-800">{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-lg overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-r from-teal-600 to-cyan-700 px-4 py-3 md:px-5">
          <h2 className="text-sm font-semibold text-white">Impactos mais informados</h2>
          <p className="text-xs text-teal-100/90 mt-0.5">
            Por área de vigilância (linhas filtradas com impacto = sim). Use ordenar em cada área abaixo.
          </p>
        </div>
        {report.impactCounts.length === 0 ? (
          <p className="text-sm text-slate-500 p-6 text-center">Nenhum indicador de impacto neste formulário.</p>
        ) : impactsByGroup.epi.length === 0 &&
          impactsByGroup.san.length === 0 &&
          impactsByGroup.amb.length === 0 ? (
          <p className="text-sm text-slate-500 p-6 text-center">Nenhum impacto marcado como “sim”.</p>
        ) : (
          <div className="p-3 md:p-4 grid gap-3 md:grid-cols-3">
            {(['epi', 'san', 'amb'] as const).map((g) => {
              const list = impactsByGroup[g];
              const total = list.reduce((s, x) => s + x.count, 0);
              const desc = impactSortDescByGroup[g];
              return (
                <div
                  key={g}
                  className="rounded-xl border border-slate-200/90 bg-gradient-to-b from-slate-50/90 to-white overflow-hidden flex flex-col min-h-[140px]"
                >
                  <div className="px-3 py-2 border-b border-slate-200/80 bg-white/80 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[11px] font-semibold text-slate-800 leading-snug">{groupLabel(g)}</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5 tabular-nums">
                        {list.length} indicador(es) · {total} marcação(ões)
                      </p>
                    </div>
                    {list.length > 0 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setImpactSortDescByGroup((prev) => ({
                            ...prev,
                            [g]: !prev[g],
                          }))
                        }
                        className="shrink-0 inline-flex items-center gap-1 rounded-md border border-teal-200/90 bg-teal-50/90 px-2 py-1 text-[10px] font-medium text-teal-900 hover:bg-teal-100/90 transition-colors"
                        title={desc ? 'Ordenar do menor para o maior' : 'Ordenar do maior para o menor'}
                      >
                        {desc ? (
                          <ArrowDownWideNarrow className="h-3 w-3 shrink-0" aria-hidden />
                        ) : (
                          <ArrowUp className="h-3 w-3 shrink-0" aria-hidden />
                        )}
                        <span className="hidden min-[380px]:inline">
                          {desc ? 'Maior → menor' : 'Menor → maior'}
                        </span>
                      </button>
                    ) : null}
                  </div>
                  <ul className="flex-1 overflow-y-auto max-h-[min(280px,38vh)] px-2 py-2 space-y-1.5 text-xs">
                    {list.map((item) => (
                      <li
                        key={item.key}
                        className="flex items-start justify-between gap-2 rounded-md bg-slate-50/80 px-2 py-1.5 border border-slate-100"
                      >
                        <span className="text-slate-700 leading-snug min-w-0 flex-1">{item.label}</span>
                        <span className="shrink-0 font-bold tabular-nums text-teal-800">{item.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-lg overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50/80 to-slate-50 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Resumo objetivo / obstáculos (contagens)</h2>
        </div>
        <div className="p-5 grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white px-5 py-5 shadow-md">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-100">Objetivo alcançado (sim)</p>
            <p className="text-3xl font-bold tabular-nums mt-2">{report.resumo.objetivoSim}</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-teal-500 to-teal-800 text-white px-5 py-5 shadow-md">
            <p className="text-xs font-medium uppercase tracking-wide text-teal-100">Houve obstáculo (sim)</p>
            <p className="text-3xl font-bold tabular-nums mt-2">{report.resumo.obstaculosSim}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-lg overflow-hidden">
        <div className="border-b border-slate-100 bg-amber-50/80 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Obstáculos informados (texto)</h2>
          <p className="text-xs text-slate-600 mt-0.5">Somente linhas com “houve obstáculo” = sim</p>
        </div>
        <div className="p-4 overflow-x-auto">
          {obstaculosDetalhe.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">Nenhum obstáculo registrado com descrição neste filtro.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200">
                  <th className="px-3 py-2.5 min-w-[160px]">Regional</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Mês ref.</th>
                  <th className="px-3 py-2.5 min-w-[140px]">Atividade</th>
                  <th className="px-3 py-2.5 min-w-[240px]">Descrição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {obstaculosDetalhe.map((o, i) => {
                  const crs = formatMonitorOperCrsDisplay(o.crs_id, crsLabels, { omitSecondaryId: true });
                  return (
                    <tr key={`${String(o.crs_id)}-${i}`} className="bg-white">
                      <td className="px-3 py-2 font-medium text-slate-800">{crs.line1}</td>
                      <td className="px-3 py-2 text-xs whitespace-nowrap">{o.competencia}</td>
                      <td className="px-3 py-2 text-xs text-slate-700">{o.atividade}</td>
                      <td className="px-3 py-2 text-xs text-slate-700 leading-relaxed">{o.texto}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-lg overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-teal-50/30 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Custos detalhados por natureza de despesa</h2>
        </div>
        <div className="p-4 min-h-[200px] h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={custoBarData} margin={{ top: 26, right: 12, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#64748b" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" width={56} />
              <Tooltip formatter={(v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
              <Bar dataKey="value" fill="#0284c7" radius={[6, 6, 0, 0]} name="Valor">
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(v: number) =>
                    Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  }
                  style={{ fontSize: 10, fontWeight: 700, fill: '#334155' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/40">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-200/80">
              {custoTabelaRows.map((row) => (
                <tr key={row.elemento}>
                  <td className="py-2 pr-2 text-slate-700">{row.elemento}</td>
                  <td className="py-2 text-right tabular-nums font-medium text-slate-900">
                    {row.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="py-2.5 pr-2 font-semibold text-slate-800">Total</td>
                <td className="py-2.5 text-right tabular-nums font-bold text-teal-800">
                  {report.custoSums.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
