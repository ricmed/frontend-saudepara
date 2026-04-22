import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FormService, { type Form, type FormSchema } from '@/services/FormService';
import FormSubmissionService, { type FormSubmission } from '@/services/FormSubmissionService';
import { AppPageLayout } from '@/components/layouts/AppPageLayout';
import { ArrowLeft, BarChart3, Download, FileSpreadsheet, PieChart } from 'lucide-react';
import {
  MONITOR_OPER_REGIONAL_KEY,
  buildMonitorOperRegionalReport,
  buildPerSubmissionSummaries,
  filterMonitorOperRows,
  monitorOperSubmissionsToCsv,
} from '../utils/monitorOperRegionalReport';
import { formatMonitorOperCrsDisplay, MonitorOperQdqqGroupedTotalsTable } from '../components/MonitorOperQdqqGroupedTotalsTable';
import { useCrsLabelByIdMap } from '../hooks/useCrsLabelByIdMap';

function groupLabel(g: 'epi' | 'san' | 'amb'): string {
  if (g === 'epi') return 'Vigilância epidemiológica e controle de doenças';
  if (g === 'san') return 'Vigilância sanitária';
  return 'Vigilância ambiental e saúde do trabalhador';
}

export const MonitorOperRegionalReportPage: React.FC = () => {
  const { agravo } = useParams<{ agravo: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMonitorOper = agravo?.toUpperCase() === MONITOR_OPER_REGIONAL_KEY;
  const crsLabels = useCrsLabelByIdMap(isMonitorOper);

  useEffect(() => {
    if (!agravo || !isMonitorOper) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const formData = await FormService.getFormByKey(agravo);
        setForm(formData);
        const version = await FormService.getActiveVersion(agravo);
        setSchema(version?.schema_json ?? null);
        if (formData.active_version_id) {
          const all = await FormSubmissionService.getSubmissionsAllPagesWithFormPayload(
            formData.active_version_id,
          );
          setSubmissions(all);
        } else {
          setSubmissions([]);
        }
      } catch (e: any) {
        console.error(e);
        setError(e?.response?.data?.message || e?.message || 'Erro ao carregar relatório');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [agravo, isMonitorOper]);

  const rows = useMemo(() => filterMonitorOperRows(submissions), [submissions]);
  const report = useMemo(() => buildMonitorOperRegionalReport(rows, schema), [rows, schema]);
  const summaries = useMemo(() => {
    const base = buildPerSubmissionSummaries(submissions);
    return base.map((s) => ({
      ...s,
      crs_label: crsLabels[String(s.crs_id ?? '')] || '',
    }));
  }, [submissions, crsLabels]);

  const impactsByGroup = useMemo(() => {
    const epi = report.impactCounts.filter((i) => i.group === 'epi');
    const san = report.impactCounts.filter((i) => i.group === 'san');
    const amb = report.impactCounts.filter((i) => i.group === 'amb');
    return { epi, san, amb };
  }, [report.impactCounts]);

  const downloadCsv = () => {
    const blob = new Blob([monitorOperSubmissionsToCsv(summaries)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monitor_oper_regional_envios_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!agravo) {
    return null;
  }

  if (!isMonitorOper) {
    return (
      <AppPageLayout
        title="Relatório não disponível"
        subtitle="O consolidado desta tela é específico do monitoramento operacional regional."
        icon={<BarChart3 className="h-8 w-8" />}
        variant="desktop"
        showBottomNav={false}
      >
        <div className="max-w-lg mx-auto bg-white rounded-xl shadow-sm border border-slate-200/80 p-6">
          <p className="text-slate-600 mb-4">Use o formulário correto ou volte para a lista de notificações.</p>
          <button
            type="button"
            onClick={() => navigate(`/private/formularios/${agravo}`)}
            className="px-4 py-2.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 inline-flex items-center gap-2 text-sm font-medium shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </div>
      </AppPageLayout>
    );
  }

  if (loading) {
    return (
      <AppPageLayout
        title="Consolidação"
        subtitle="Carregando dados…"
        icon={<BarChart3 className="h-8 w-8" />}
        variant="desktop"
        showBottomNav={false}
      >
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <div className="h-12 w-12 rounded-full border-2 border-emerald-600/30 border-t-emerald-600 animate-spin" />
          <p className="text-sm text-slate-500">Montando painel a partir dos envios com payload completo…</p>
        </div>
      </AppPageLayout>
    );
  }

  if (error) {
    return (
      <AppPageLayout
        title="Erro"
        subtitle={error}
        icon={<BarChart3 className="h-8 w-8" />}
        variant="desktop"
        showBottomNav={false}
      >
        <button
          type="button"
          onClick={() => navigate(`/private/formularios/${agravo}`)}
          className="px-4 py-2.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 text-sm font-medium"
        >
          Voltar à lista
        </button>
      </AppPageLayout>
    );
  }

  const ta = report.totalAcumulado;
  const taMixed = ta != null && 'mixed' in ta && ta.mixed === true;
  const taOk = ta != null && 'mixed' in ta && ta.mixed === false;

  return (
    <AppPageLayout
      title="Consolidação operacional"
      subtitle={form?.nome ?? 'Monitoramento operacional — regionais'}
      icon={<BarChart3 className="h-8 w-8" />}
      variant="desktop"
      showBottomNav={false}
      headerActions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            data-testid="monitor-oper-report-back"
            onClick={() => navigate(`/private/formularios/${agravo}`)}
            className="px-4 py-2 rounded-lg bg-white/95 text-slate-800 hover:bg-white flex items-center gap-2 text-sm font-medium border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Lista de envios
          </button>
          <button
            type="button"
            data-testid="monitor-oper-report-csv"
            onClick={downloadCsv}
            disabled={summaries.length === 0}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2 text-sm font-medium shadow-sm disabled:opacity-45 disabled:pointer-events-none"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>
      }
    >
      <div className="space-y-8 pb-10" data-testid="monitor-oper-report-root">
        {/* Faixa institucional — alinhada à proposta DVS / planilha operacional */}
        <div className="rounded-2xl overflow-hidden shadow-md border border-slate-200/90 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white">
          <div className="px-5 py-6 md:px-8 md:py-8 max-w-5xl">
            <p className="text-emerald-300/95 text-[11px] md:text-xs font-semibold tracking-[0.12em] uppercase">
              SESPA · DVS · Instrumento operacional regional
            </p>
            <h1 className="mt-2 text-xl md:text-2xl font-bold leading-snug">
              Monitoramento das ações realizadas pelas regionais (consolidado no sistema)
            </h1>
            <p className="mt-3 text-sm text-slate-200/95 leading-relaxed max-w-3xl">
              Visão alinhada ao modelo em planilha (<span className="text-white font-medium">MONITORAMENTO OPERACIONAL AJUSTADO</span>)
              e à proposta <span className="text-white font-medium">Monitoramento técnico e operacional — regionais 2026</span>
              (QDQQ por <strong>quadrimestre</strong>, custos 3390-xx, resumo e impacto por área). O total QDQQ consolida por{' '}
              <strong>CRS + ano + quadrimestre</strong> (competência mês/ano ou mês de referência); se a lista misturar referências,
              os totais aparecem <strong>por fatia</strong>, na mesma lógica da planilha.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-200/90">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 border border-white/10">
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-300" />
                {submissions.length} envio(s) carregado(s)
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 border border-white/10">
                <PieChart className="h-3.5 w-3.5 text-emerald-300" />
                {report.validRowCount} linha(s) com cabeçalho + ação
              </span>
            </div>
          </div>
        </div>

        {/* Total acumulado — estilo “linha de totais” da planilha */}
        {ta && (
          <section className="rounded-2xl border border-emerald-900/20 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 border-b border-emerald-900/10 bg-emerald-50/80 px-4 py-3">
              <div className="h-8 w-1 rounded-full bg-emerald-600" />
              <div>
                <h2 className="text-sm font-semibold text-emerald-950">Total acumulado (QDQQ — quadrimestre)</h2>
                <p className="text-[11px] text-emerald-900/70">Instrumento quadrimestral; mesmo critério da planilha operacional</p>
              </div>
            </div>
            <div className="p-4 md:p-5">
              {taMixed && 'groups' in ta ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                    Totais QDQQ por CRS / ano / quadrimestre
                  </h3>
                  <MonitorOperQdqqGroupedTotalsTable groups={ta.groups} tone="report" crsLabels={crsLabels} />
                </div>
              ) : taOk ? (
                <>
                  <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">QDQQ — quadrimestre de referência</p>
                      <p className="text-lg font-semibold text-slate-900 leading-snug">
                        <span className="text-emerald-800">{ta.quadrimestre_label}</span>
                        <span className="text-slate-400 mx-2">·</span>
                        <span className="tabular-nums">ano {String(ta.ano ?? '—')}</span>
                      </p>
                      {ta.competencia_mes_ano != null && String(ta.competencia_mes_ano) !== '' ? (
                        <p className="text-xs text-slate-500 mt-1">
                          Competência (mês/ano): <span className="font-medium text-slate-700">{String(ta.competencia_mes_ano)}</span>
                          {ta.mes != null && String(ta.mes) !== '' ? (
                            <span className="text-slate-400"> · mês código {String(ta.mes)}</span>
                          ) : null}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">% realização</p>
                      <p className="text-2xl font-bold text-emerald-700 tabular-nums leading-none">
                        {ta.perc === undefined ? '—' : `${ta.perc.toFixed(1)}%`}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(
                      [
                        ['Programadas (N)', ta.programadas],
                        ['Realizadas (Σ 0/1)', ta.realizadasFlag],
                        ['Não programadas (Σ 0/1)', ta.naoProgramadasFlag],
                        ['Total', ta.total],
                      ] as const
                    ).map(([label, val]) => (
                      <div
                        key={label}
                        className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                      >
                        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</div>
                        <div className="mt-1 text-xl font-bold text-slate-900 tabular-nums">{val}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/90 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">Ações por área da vigilância</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Distribuição conforme coluna “QUAL A ÁREA DA VIGILÂNCIA?”</p>
            </div>
            <div className="p-4">
              {report.byArea.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">Nenhuma área registrada nas linhas válidas.</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                  {report.byArea.map((a) => (
                    <li key={a.areaKey} className="flex justify-between items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50/80 transition-colors">
                      <span className="text-sm text-slate-700 leading-snug">{a.areaLabel}</span>
                      <span className="shrink-0 rounded-lg bg-emerald-600/10 text-emerald-800 font-semibold tabular-nums text-sm px-2.5 py-0.5">
                        {a.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/90 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">Custo da ação (soma R$)</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Elementos de despesa 3390-xx, como na planilha</p>
            </div>
            <div className="p-4 space-y-0.5">
              {(
                [
                  ['3390-14 — Diárias', report.custoSums.el_339014],
                  ['3390-30 — Material de consumo', report.custoSums.el_339030],
                  ['3390-33 — Passagens e locomoção', report.custoSums.el_339033],
                  ['3390-36 — Outros serviços PF', report.custoSums.el_339036],
                  ['3390-39 — Outros serviços PJ', report.custoSums.el_339039],
                ] as const
              ).map(([label, val]) => (
                <div
                  key={label}
                  className="flex justify-between items-center text-sm py-2.5 px-1 border-b border-slate-50 last:border-0"
                >
                  <span className="text-slate-600 pr-2">{label}</span>
                  <span className="font-semibold text-slate-900 tabular-nums shrink-0">
                    {val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-4 mt-1 border-t-2 border-emerald-700/20 text-sm font-bold text-emerald-950 px-1">
                <span>Total estimado</span>
                <span className="tabular-nums">
                  {report.custoSums.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/90 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Resumo executivo da ação</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Contagem de envios com campos marcados (valores 1 / verdadeiro)</p>
          </div>
          <div className="p-4 md:p-5 flex flex-wrap gap-4">
            <div className="flex-1 min-w-[140px] rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-4 py-3">
              <p className="text-[11px] font-medium uppercase text-slate-500">Objetivo alcançado</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{report.resumo.objetivoSim}</p>
            </div>
            <div className="flex-1 min-w-[140px] rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-4 py-3">
              <p className="text-[11px] font-medium uppercase text-slate-500">Com obstáculos</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{report.resumo.obstaculosSim}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/90 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Impacto causado pela ação</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Três blocos como na planilha; contagem = quantos envios marcaram cada item (respeitando a área da linha).
            </p>
          </div>
          {report.impactCounts.length === 0 ? (
            <p className="text-sm text-slate-500 p-6">Sem campos de impacto no schema publicado.</p>
          ) : (
            <div className="p-4 md:p-5 grid gap-6 lg:grid-cols-3">
              {(['epi', 'san', 'amb'] as const).map((g) => (
                <div key={g} className="rounded-xl border border-slate-100 bg-slate-50/40 overflow-hidden">
                  <div className="px-3 py-2 bg-slate-800 text-white text-xs font-semibold leading-tight">{groupLabel(g)}</div>
                  <ul className="max-h-72 overflow-y-auto divide-y divide-slate-100/80">
                    {(g === 'epi' ? impactsByGroup.epi : g === 'san' ? impactsByGroup.san : impactsByGroup.amb).map(
                      (row) => (
                        <li key={row.key} className="flex gap-2 px-3 py-2.5 text-xs text-slate-700 leading-snug bg-white/90">
                          <span className="flex-1">{row.label}</span>
                          <span className="shrink-0 font-bold text-emerald-800 tabular-nums">{row.count}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/90 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Envios (resumo por linha)</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Identificação rápida; detalhe completo no CSV ou na edição do envio.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-100/90 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  <th className="px-4 py-3 border-b border-slate-200/80">#</th>
                  <th className="px-4 py-3 border-b border-slate-200/80 min-w-[200px]">Regional</th>
                  <th className="px-4 py-3 border-b border-slate-200/80">QDQQ</th>
                  <th className="px-4 py-3 border-b border-slate-200/80">Área</th>
                  <th className="px-4 py-3 border-b border-slate-200/80">Atividade</th>
                  <th className="px-4 py-3 border-b border-slate-200/80">Data</th>
                  <th className="px-4 py-3 border-b border-slate-200/80 text-right">Custo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summaries.map((s, idx) => {
                  const crs = formatMonitorOperCrsDisplay(s.crs_id, crsLabels);
                  return (
                  <tr
                    key={s.id}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                  >
                    <td className="px-4 py-2.5 font-medium text-slate-800 tabular-nums">{s.id}</td>
                    <td className="px-4 py-2.5 text-slate-700 max-w-[260px]" title={crs.title}>
                      <div className="font-medium text-sm leading-snug line-clamp-2">{crs.line1}</div>
                      {crs.line2 ? <div className="text-[11px] text-slate-500 tabular-nums mt-0.5">{crs.line2}</div> : null}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap text-xs font-medium" title={s.competencia_mes_ano != null ? String(s.competencia_mes_ano) : ''}>
                      {s.quadrimestre}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700 max-w-[220px]" title={s.areaLabel}>
                      <span className="line-clamp-2">{s.areaLabel}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 max-w-[200px]">
                      <span className="line-clamp-2">{String(s.atividade ?? '—')}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap tabular-nums">
                      {String(s.dataRealizacao ?? '—')}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-900 tabular-nums whitespace-nowrap">
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
    </AppPageLayout>
  );
};
