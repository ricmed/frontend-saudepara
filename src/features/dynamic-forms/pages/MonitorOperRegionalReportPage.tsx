import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import FormService, { type Form, type FormSchema } from '@/services/FormService';
import FormSubmissionService, { type FormSubmission } from '@/services/FormSubmissionService';
import { AppPageLayout } from '@/components/layouts/AppPageLayout';
import { ArrowLeft, BarChart3, Download } from 'lucide-react';
import {
  MONITOR_OPER_REGIONAL_KEY,
  buildMonitorOperRegionalReport,
  buildPerSubmissionSummaries,
  collectMonitorOperReportFilterOptions,
  defaultMonitorOperReportFilters,
  filterMonitorOperRows,
  filterMonitorOperSubmissionsByReportFilters,
  monitorOperSubmissionsToCsv,
} from '../utils/monitorOperRegionalReport';
import { useCrsLabelByIdMap } from '../hooks/useCrsLabelByIdMap';
import { MonitorOperReportProvider } from './monitorOperReportContext';
import { MonitorOperExecutiveReportView } from './MonitorOperExecutiveReportView';
import { MonitorOperTechnicalReportView } from './MonitorOperTechnicalReportView';

export const MonitorOperRegionalReportPage: React.FC = () => {
  const { agravo } = useParams<{ agravo: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(defaultMonitorOperReportFilters);

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

  const filterOptions = useMemo(() => collectMonitorOperReportFilterOptions(submissions), [submissions]);

  const filteredSubmissions = useMemo(
    () => filterMonitorOperSubmissionsByReportFilters(submissions, filters),
    [submissions, filters],
  );

  const rows = useMemo(() => filterMonitorOperRows(filteredSubmissions), [filteredSubmissions]);
  const report = useMemo(() => buildMonitorOperRegionalReport(rows, schema), [rows, schema]);
  const summaries = useMemo(() => {
    const base = buildPerSubmissionSummaries(filteredSubmissions);
    return base.map((s) => ({
      ...s,
      crs_label: crsLabels[String(s.crs_id ?? '')] || '',
    }));
  }, [filteredSubmissions, crsLabels]);

  const downloadCsv = useCallback(() => {
    const blob = new Blob([monitorOperSubmissionsToCsv(summaries)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monitor_oper_regional_envios_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [summaries]);

  const ctxValue = useMemo(
    () => ({
      agravo: agravo ?? '',
      form,
      schema,
      submissionsAll: submissions,
      filteredSubmissions,
      filters,
      setFilters,
      filterOptions,
      rows,
      report,
      summaries,
      crsLabels,
      downloadCsv,
    }),
    [
      agravo,
      form,
      schema,
      submissions,
      filteredSubmissions,
      filters,
      filterOptions,
      rows,
      report,
      summaries,
      crsLabels,
      downloadCsv,
    ],
  );

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
          <p className="text-sm text-slate-500">Carregando painel…</p>
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

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
      isActive
        ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
    }`;

  return (
    <AppPageLayout
      title="Monitoramento operacional"
      subtitle={form?.nome ? `${form.nome} · instrumento de gestão` : 'Consolidação por regionais'}
      icon={<BarChart3 className="h-8 w-8" />}
      variant="desktop"
      contentWidth="wide"
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
      <MonitorOperReportProvider value={ctxValue}>
        <nav
          className="flex flex-wrap gap-2 mb-6 p-1 rounded-xl bg-slate-100/80 border border-slate-200/80"
          aria-label="Seções do relatório"
        >
          <NavLink to="." end className={tabClass} data-testid="monitor-oper-tab-executive">
            Painel executivo
          </NavLink>
          <NavLink to="tecnico" className={tabClass} data-testid="monitor-oper-tab-technical">
            Detalhamento técnico
          </NavLink>
        </nav>

        <Routes>
          <Route index element={<MonitorOperExecutiveReportView />} />
          <Route path="tecnico" element={<MonitorOperTechnicalReportView />} />
        </Routes>
      </MonitorOperReportProvider>
    </AppPageLayout>
  );
};
