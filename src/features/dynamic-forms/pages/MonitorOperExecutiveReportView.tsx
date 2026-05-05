import React, { useMemo } from 'react';
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
import { formatMonitorOperCrsDisplay } from '../components/MonitorOperQdqqGroupedTotalsTable';
import { MonitorOperReportFiltersBar } from '../components/MonitorOperReportFiltersBar';
import { buildAggregatesPorCrs, quadrimestreLabel } from '../utils/monitorOperRegionalReport';
import { useMonitorOperReport } from './monitorOperReportContext';

export const MonitorOperExecutiveReportView: React.FC = () => {
  const {
    filters,
    setFilters,
    filterOptions,
    crsLabels,
    filteredSubmissions,
    rows,
    report,
    summaries,
  } = useMonitorOperReport();

  const areaBarData = useMemo(
    () =>
      report.byArea.map((a) => ({
        name: a.areaLabel.length > 44 ? `${a.areaLabel.slice(0, 42)}…` : a.areaLabel,
        fullName: a.areaLabel,
        count: a.count,
      })),
    [report.byArea],
  );

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

  /** Altura em px (não flex-1 no Recharts): evita área vazia enorme sob as barras. */
  const areaVigilanciaChartHeightPx = useMemo(
    () => Math.min(480, Math.max(160, 72 + areaBarData.length * 36)),
    [areaBarData.length],
  );

  const custosBarChartHeightPx = useMemo(
    () => Math.min(300, Math.max(200, 56 + custoBarData.length * 36)),
    [custoBarData.length],
  );

  const ta = report.totalAcumulado;

  const executiveStrip = useMemo(() => {
    const totalEnvios = filteredSubmissions.length;
    const linhasValidas = report.validRowCount;
    const custoTotal = report.custoSums.total;
    const taMixed = ta != null && 'mixed' in ta && ta.mixed === true;

    let programadas = 0;
    let realizadas = 0;
    let naoProgramadas = 0;
    let perc: number | undefined;
    if (ta && !taMixed && 'programadas' in ta) {
      programadas = ta.programadas;
      realizadas = ta.realizadasFlag;
      naoProgramadas = ta.naoProgramadasFlag;
      perc = ta.perc;
    } else if (ta && taMixed && 'groups' in ta) {
      programadas = ta.groups.reduce((s, g) => s + g.programadas, 0);
      realizadas = ta.groups.reduce((s, g) => s + g.realizadasFlag, 0);
      naoProgramadas = ta.groups.reduce((s, g) => s + g.naoProgramadasFlag, 0);
      perc = programadas > 0 ? (realizadas / programadas) * 100 : undefined;
    }

    return {
      totalEnvios,
      linhasValidas,
      programadas,
      realizadas,
      naoProgramadas,
      perc,
      custoTotal,
    };
  }, [filteredSubmissions.length, report, ta]);

  const porRegional = useMemo(() => {
    const agg = buildAggregatesPorCrs(rows);
    return agg
      .map((g) => {
        const crs = formatMonitorOperCrsDisplay(g.crs_id, crsLabels, { omitSecondaryId: true });
        return { ...g, crsLine: crs.line1, crsTitle: crs.title };
      })
      .sort((a, b) => a.crsLine.localeCompare(b.crsLine, 'pt-BR'));
  }, [rows, crsLabels]);

  return (
    <div className="space-y-6 pb-10" data-testid="monitor-oper-report-root">
      <div className="rounded-2xl overflow-hidden border border-blue-200/60 bg-gradient-to-br from-blue-600 via-teal-600 to-emerald-800 text-white shadow-xl">
        <div className="px-5 py-6 md:px-8 md:py-8 max-w-4xl mx-auto">
          <p className="text-center text-blue-100/95 text-[11px] md:text-xs font-semibold tracking-[0.14em] uppercase">
            Painel executivo regional
          </p>
          <h1 className="mt-2 text-xl md:text-2xl font-bold leading-snug text-center drop-shadow-sm">
            Monitoramento operacional
          </h1>
          <p className="mt-2 text-sm text-white/90 leading-relaxed max-w-2xl mx-auto text-center">
            Execução e custo por regional; use a aba <strong className="font-semibold">Detalhamento técnico</strong> para
            QDQQ, municípios, impactos e listagem completa.
          </p>
        </div>
      </div>

      <MonitorOperReportFiltersBar
        filters={filters}
        setFilters={setFilters}
        filterOptions={filterOptions}
        crsLabels={crsLabels}
      />

      <section
        className="rounded-2xl border border-slate-200/80 bg-white shadow-lg overflow-hidden p-4 md:p-6"
        aria-labelledby="monitor-oper-exec-strip"
      >
        <h2 id="monitor-oper-exec-strip" className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-4">
          Indicadores principais
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-xl border border-slate-200/80 bg-gradient-to-b from-slate-50 to-white px-3 py-3 text-center shadow-md">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 leading-tight">Envios</div>
            <div className="mt-1.5 text-xl font-bold tabular-nums text-slate-900 leading-none">{executiveStrip.totalEnvios}</div>
            {executiveStrip.linhasValidas !== executiveStrip.totalEnvios ? (
              <p className="mt-1 text-[10px] text-slate-500 leading-snug text-center">
                {executiveStrip.linhasValidas} linha(s) no filtro
              </p>
            ) : null}
          </div>

          {(
            [
              ['Programadas', executiveStrip.programadas, 'from-teal-500 to-teal-700'],
              ['Realizadas', executiveStrip.realizadas, 'from-sky-500 to-blue-700'],
              ['Não programadas', executiveStrip.naoProgramadas, 'from-slate-500 to-slate-700'],
            ] as const
          ).map(([label, val, grad]) => (
            <div
              key={label}
              className={`rounded-xl px-3 py-3 text-center shadow-md ${
                ta
                  ? `bg-gradient-to-br ${grad} text-white`
                  : 'border border-slate-200 bg-slate-100 text-slate-500'
              }`}
            >
              <div
                className={`text-[10px] font-semibold uppercase tracking-wide leading-tight ${
                  ta ? 'text-white/90' : 'text-slate-500'
                }`}
              >
                {label}
              </div>
              <div className="mt-1.5 text-xl font-bold tabular-nums leading-none">{ta ? val : '—'}</div>
            </div>
          ))}

          <div
            className={`rounded-xl px-3 py-3 text-center shadow-md ${
              ta && executiveStrip.perc !== undefined
                ? 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white'
                : 'border border-slate-200 bg-slate-100 text-slate-500'
            }`}
          >
            <div
              className={`text-[10px] font-semibold uppercase tracking-wide leading-tight ${
                ta && executiveStrip.perc !== undefined ? 'text-indigo-100' : 'text-slate-500'
              }`}
            >
              % realização
            </div>
            <div className="mt-1.5 text-xl font-bold tabular-nums leading-none">
              {ta && executiveStrip.perc !== undefined ? `${executiveStrip.perc.toFixed(1)}%` : '—'}
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 px-3 py-3 text-center text-white shadow-md">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-100/95">Custo total</div>
            <div className="mt-1.5 text-lg sm:text-xl font-bold tabular-nums leading-none break-words">
              {executiveStrip.custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-lg overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-teal-50/40 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Consolidado por regional</h2>
          <p className="text-xs text-slate-500 mt-0.5">Totais QDQQ e custo somados por CRS (com os filtros atuais)</p>
        </div>
        <div className="p-4 overflow-x-auto">
          {porRegional.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">Nenhuma linha válida com os filtros selecionados.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200">
                  <th className="px-3 py-2.5 min-w-[160px]">Regional</th>
                  <th
                    className="px-3 py-2.5 text-right"
                    title="Quantidade de envios válidos desta regional nos filtros atuais (um registro por envio com cabeçalho e ação). Difere dos totais QDQQ, que somam as quantidades informadas no instrumento."
                  >
                    Envios
                  </th>
                  <th className="px-3 py-2.5 text-right">Programadas</th>
                  <th className="px-3 py-2.5 text-right">Realizadas</th>
                  <th className="px-3 py-2.5 text-right">Não realiz.</th>
                  <th className="px-3 py-2.5 text-right">Não prog.</th>
                  <th className="px-3 py-2.5 text-right">% exec.</th>
                  <th className="px-3 py-2.5 text-right">Custo</th>
                  <th className="px-3 py-2.5 text-right">Munic.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {porRegional.map((g) => (
                  <tr key={String(g.crs_id ?? 'empty')} className="bg-white">
                    <td className="px-3 py-2.5 font-medium text-slate-800" title={g.crsTitle}>
                      {g.crsLine}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">{g.linhas}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{g.programadas}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{g.realizadasFlag}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {Math.max(0, g.programadas - g.realizadasFlag)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{g.naoProgramadasFlag}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {g.perc === undefined ? '—' : `${g.perc.toFixed(1)}%`}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-medium text-slate-900">
                      {g.custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-teal-800 font-medium">{g.municipiosDistintos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg lg:h-full">
          <div className="shrink-0 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/30 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Ações por área de vigilância</h2>
            <p className="text-xs text-slate-500 mt-0.5">Volume de registros por área (filtrado)</p>
          </div>
          <div className="flex min-h-0 flex-1 flex-col p-4">
            {areaBarData.length === 0 ? (
              <p className="flex flex-1 items-center justify-center py-8 text-center text-sm text-slate-500">
                Sem dados de área neste conjunto.
              </p>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col justify-center">
                <div className="w-full shrink-0" style={{ height: areaVigilanciaChartHeightPx }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={areaBarData} margin={{ top: 4, right: 8, left: 4, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 9 }} stroke="#64748b" />
                      <Tooltip
                        formatter={(v: number) => [v, 'Registros']}
                        labelFormatter={(_, p) => (p?.[0]?.payload?.fullName as string) ?? ''}
                      />
                      <Bar dataKey="count" name="Registros" fill="#0d9488" radius={[0, 6, 6, 0]}>
                        <LabelList
                          dataKey="count"
                          position="right"
                          style={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg lg:h-full">
          <div className="shrink-0 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-teal-50/30 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Custos estimados (R$)</h2>
            <p className="text-xs text-slate-500 mt-0.5">Natureza 3390 — filtrado</p>
          </div>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col justify-center p-4">
              <div className="w-full shrink-0" style={{ height: custosBarChartHeightPx }}>
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
            </div>
            <div className="shrink-0 border-t border-slate-100 bg-slate-50/40 px-4 pb-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 pt-3 pb-2">
                Elemento de despesa
              </p>
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
                  <tr className="bg-white">
                    <td className="py-2.5 pr-2 font-semibold text-slate-800">Total</td>
                    <td className="py-2.5 text-right tabular-nums font-bold text-teal-800">
                      {report.custoSums.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-lg overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Envios recentes</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Resumo filtrado — no topo você pode exportar CSV ou PDF (aba atual).
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-blue-600 text-left text-[11px] font-semibold uppercase tracking-wide text-white">
                <th className="px-4 py-3">Ordem</th>
                <th className="px-4 py-3 min-w-[200px]">Regional</th>
                <th className="px-4 py-3 min-w-[200px]">Período QDQQ</th>
                <th className="px-4 py-3">Área</th>
                <th className="px-4 py-3">Atividade</th>
                <th className="px-4 py-3">Realização</th>
                <th className="px-4 py-3 text-right">Custo (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summaries.map((s, idx) => {
                const crs = formatMonitorOperCrsDisplay(s.crs_id, crsLabels, { omitSecondaryId: true });
                const qdqq =
                  s.quadrimestre === 'Q1' || s.quadrimestre === 'Q2' || s.quadrimestre === 'Q3'
                    ? `${quadrimestreLabel(s.quadrimestre as 'Q1' | 'Q2' | 'Q3')} · ${String(s.ano ?? '—')}`
                    : '—';
                return (
                  <tr key={s.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                    <td className="px-4 py-2.5 text-slate-600 tabular-nums">{idx + 1}</td>
                    <td className="px-4 py-2.5 text-slate-800 max-w-[260px]" title={crs.title}>
                      <div className="font-medium text-sm leading-snug line-clamp-2">{crs.line1}</div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-700 text-xs whitespace-nowrap">{qdqq}</td>
                    <td className="px-4 py-2.5 text-slate-700 max-w-[220px]" title={s.areaLabel}>
                      <span className="line-clamp-2">{s.areaLabel}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 max-w-[200px]">
                      <span className="line-clamp-2">{String(s.atividade ?? '—')}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap tabular-nums text-xs">
                      {String(s.dataRealizacao ?? '—')}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-900 tabular-nums whitespace-nowrap text-xs">
                      {s.custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
