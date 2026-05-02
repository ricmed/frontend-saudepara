import React, { useMemo } from 'react';
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
import { formatMonitorOperCrsDisplay, MonitorOperQdqqGroupedTotalsTable } from '../components/MonitorOperQdqqGroupedTotalsTable';
import { MonitorOperReportFiltersBar } from '../components/MonitorOperReportFiltersBar';
import {
  buildAtividadesPorArea,
  buildMunicipiosPorCrs,
  buildMunicipiosRanking,
  buildObstaculosDetalhe,
  buildProgramasAlcancadosRanking,
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

export const MonitorOperTechnicalReportView: React.FC = () => {
  const { filters, setFilters, filterOptions, crsLabels, rows, report, summaries } = useMonitorOperReport();

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

  const impactoTabelaRows = useMemo(
    () =>
      [...report.impactCounts]
        .filter((r) => r.count > 0)
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pt-BR'))
        .map((r) => ({
          key: r.key,
          impacto: r.label,
          area: groupLabel(r.group),
          quantidade: r.count,
        })),
    [report.impactCounts],
  );

  const municipiosPorRegional = useMemo(() => buildMunicipiosPorCrs(rows), [rows]);

  const municipiosPorRegionalDisplay = useMemo(
    () =>
      municipiosPorRegional
        .filter((r) => r.quantidade > 0)
        .map((r) => {
          const crs = formatMonitorOperCrsDisplay(r.crs_id, crsLabels, { omitSecondaryId: true });
          const maxList = 14;
          const shown = r.municipios.slice(0, maxList);
          const rest = r.municipios.length - shown.length;
          const lista = shown.join(', ') + (rest > 0 ? ` e mais ${rest} município(s)` : '');
          return { key: String(r.crs_id ?? ''), crsLine: crs.line1, lista, quantidade: r.quantidade };
        }),
    [municipiosPorRegional, crsLabels],
  );

  const municipiosRanking = useMemo(() => buildMunicipiosRanking(rows, 20), [rows]);
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
                      <span className="line-clamp-2">{String(s.atividade ?? '—')}</span>
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
        <section className="rounded-2xl border border-slate-200/80 bg-white shadow-lg overflow-hidden">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-teal-50/40 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Síntese QDQQ (quadrimestre)</h2>
            <p className="text-xs text-slate-500 mt-0.5">Instrumento quadrimestral — dados filtrados</p>
          </div>
          <div className="p-5 md:p-6">
            {taMixed && 'groups' in ta ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Totais por regional e período</h3>
                <MonitorOperQdqqGroupedTotalsTable groups={ta.groups} tone="report" crsLabels={crsLabels} managementView />
              </div>
            ) : taOk ? (
              <div className={`flex flex-col gap-8 items-stretch ${qdqqPieData.length > 0 ? 'lg:flex-row' : ''}`}>
                {qdqqPieData.length > 0 ? (
                  <div className="flex-1 min-w-0 flex flex-col items-center justify-center">
                    <div className="h-[220px] w-full max-w-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={qdqqPieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={58}
                            outerRadius={88}
                            paddingAngle={2}
                          >
                            {qdqqPieData.map((entry) => (
                              <Cell key={entry.name} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => [String(v), '']} />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 text-center">Distribuição no quadrimestre</p>
                  </div>
                ) : null}
                <div className={`min-w-0 space-y-5 ${qdqqPieData.length > 0 ? 'flex-[1.2]' : 'w-full'}`}>
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Referência</p>
                      <p className="text-lg font-semibold text-slate-900 leading-snug mt-0.5">
                        <span className="text-teal-700">{ta.quadrimestre_label}</span>
                        <span className="text-slate-300 mx-2">·</span>
                        <span className="tabular-nums text-slate-700">Ano {String(ta.ano ?? '—')}</span>
                      </p>
                      {ta.competencia_mes_ano != null && String(ta.competencia_mes_ano) !== '' ? (
                        <p className="text-xs text-slate-500 mt-1">
                          Mês de referência:{' '}
                          <span className="font-medium text-slate-700">{String(ta.competencia_mes_ano)}</span>
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right rounded-xl bg-gradient-to-br from-teal-600 to-blue-700 text-white px-5 py-3 shadow-md">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-teal-100">Realização</p>
                      <p className="text-2xl font-bold tabular-nums leading-none mt-1">
                        {ta.perc === undefined ? '—' : `${ta.perc.toFixed(1)}%`}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(
                      [
                        ['Programadas', ta.programadas, 'from-teal-500 to-teal-700'],
                        ['Realizadas', ta.realizadasFlag, 'from-sky-500 to-blue-700'],
                        [
                          'Não realizadas',
                          Math.max(0, ta.programadas - ta.realizadasFlag),
                          'from-amber-500 to-amber-700',
                        ],
                        ['Não programadas', ta.naoProgramadasFlag, 'from-slate-500 to-slate-700'],
                      ] as const
                    ).map(([label, val, grad]) => (
                      <div
                        key={label}
                        className={`rounded-xl bg-gradient-to-br ${grad} px-3 py-3 text-center text-white shadow-md`}
                      >
                        <div className="text-[10px] font-medium uppercase tracking-wide text-white/85">{label}</div>
                        <div className="mt-1 text-xl font-bold tabular-nums">{val}</div>
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
          {municipiosPorRegionalDisplay.length === 0 && municipiosRanking.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Nenhum município informado neste conjunto.</p>
          ) : (
            <>
              {municipiosPorRegionalDisplay.length > 0 ? (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Por regional</h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                          <th className="px-3 py-2.5 min-w-[180px]">Regional</th>
                          <th className="px-3 py-2.5 min-w-[280px]">Municípios alcançados</th>
                          <th className="px-3 py-2.5 text-right w-28">Quantidade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {municipiosPorRegionalDisplay.map((r) => (
                          <tr key={r.key || 'empty'} className="bg-white">
                            <td className="px-3 py-2.5 font-medium text-slate-800">{r.crsLine}</td>
                            <td className="px-3 py-2.5 text-slate-700 text-xs leading-relaxed">{r.lista}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-teal-800">{r.quantidade}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
              {municipiosRanking.length > 0 ? (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                    Municípios mais alcançados pelas ações
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                          <th className="px-3 py-2.5">Município</th>
                          <th className="px-3 py-2.5 text-right w-28">Linhas de ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {municipiosRanking.map((r) => (
                          <tr key={r.municipio} className="bg-white">
                            <td className="px-3 py-2 text-slate-800">{r.municipio}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-slate-700">{r.ocorrencias}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-lg overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Atividades por área</h2>
        </div>
        <div className="p-4 overflow-x-auto">
          {atividadesPorArea.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">Sem dados.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200">
                  <th className="px-3 py-2.5">Área</th>
                  <th className="px-3 py-2.5">Atividade</th>
                  <th className="px-3 py-2.5 text-right w-24">Qtd.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {atividadesPorArea.map((r, i) => (
                  <tr key={`${r.areaKey}-${r.atividade}-${i}`} className="bg-white">
                    <td className="px-3 py-2 text-slate-800">{r.areaLabel}</td>
                    <td className="px-3 py-2 text-slate-700 text-xs max-w-[320px]">{r.atividade}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-lg overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Programas alcançados</h2>
        </div>
        <div className="p-4 overflow-x-auto">
          {programasRanking.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">Nenhum programa informado.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200">
                  <th className="px-3 py-2.5">Programa</th>
                  <th className="px-3 py-2.5 text-right w-24">Linhas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {programasRanking.map((r) => (
                  <tr key={r.programa} className="bg-white">
                    <td className="px-3 py-2 text-slate-800 leading-snug">{r.programa}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-lg overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-r from-teal-600 to-cyan-700 px-5 py-3">
          <h2 className="text-sm font-semibold text-white">Impactos mais informados</h2>
          <p className="text-xs text-teal-100/90 mt-0.5">Impacto · área · quantidade (linhas filtradas)</p>
        </div>
        {report.impactCounts.length === 0 ? (
          <p className="text-sm text-slate-500 p-6 text-center">Nenhum indicador de impacto neste formulário.</p>
        ) : impactoTabelaRows.length === 0 ? (
          <p className="text-sm text-slate-500 p-6 text-center">Nenhum impacto marcado como “sim”.</p>
        ) : (
          <div className="p-4 md:p-5 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200">
                  <th className="px-3 py-2.5 min-w-[200px]">Impacto</th>
                  <th className="px-3 py-2.5 min-w-[160px]">Área</th>
                  <th className="px-3 py-2.5 text-right w-24">Quantidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {impactoTabelaRows.map((row) => (
                  <tr key={row.key} className="bg-white">
                    <td className="px-3 py-2.5 text-slate-800 leading-snug">{row.impacto}</td>
                    <td className="px-3 py-2.5 text-slate-600 text-xs">{row.area}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-teal-800">{row.quantidade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <BarChart data={custoBarData} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#64748b" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" width={56} />
              <Tooltip formatter={(v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
              <Bar dataKey="value" fill="#0284c7" radius={[6, 6, 0, 0]} name="Valor" />
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
