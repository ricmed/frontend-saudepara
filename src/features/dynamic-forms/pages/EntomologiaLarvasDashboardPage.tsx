import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '@/utils/axiosRetry';
import FormService, { type Form } from '@/services/FormService';
import FormSubmissionService, { type FormSubmission } from '@/services/FormSubmissionService';
import { Plus, Edit, Eye, Trash2, Calendar, User, Bug, Filter, FileSpreadsheet, FileText } from 'lucide-react';
import { AppPageLayout } from '@/components/layouts/AppPageLayout';
import { getRuntimeApiRoot } from '@/config/runtimeApiBase';
import { useAuth } from '@/keycloak/AuthProvider';
import { CompetenciaMesAnoInputs } from '../components/CompetenciaMesAnoInputs';
import { EntomologiaDashKpiStrip } from '../components/entomologia/EntomologiaDashKpiStrip';
import { EntomologiaFrequenciaTables } from '../components/entomologia/EntomologiaFrequenciaTables';
import { EntomologiaResumoTable } from '../components/entomologia/EntomologiaResumoTable';
import { useMunicipioLabelByIdMap } from '../hooks/useMunicipioLabelByIdMap';
import {
  flattenEntomologiaFrequenciaRows,
  flattenEntomologiaResumoRows,
  formatCompetenciaCurta,
} from '../utils/entomologiaDashboardTables';
import { computeEntomologiaDashboardKpis } from '../utils/entomologiaDashboardKpis';
import { ENTOMO_TABLE_VIEWPORT_MAX } from '../components/entomologia/entomologiaDenseTableClasses';

const AGRAVO = 'ENTOMOLOGIA_LARVAS';
const API_BASE = getRuntimeApiRoot();

type DashTab = 'relatorios' | 'resumo' | 'frequencia';

interface CrsOption {
  value: string;
  label: string;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportErrorMessage(err: unknown, fallback: string): Promise<string> {
  let msg = fallback;
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const j = JSON.parse(text) as { message?: string; error?: string };
      msg = j.message || j.error || msg;
    } catch {
      // keep default
    }
  } else if (data && typeof data === 'object') {
    const o = data as { message?: string; error?: string };
    if (o.message || o.error) msg = o.message || o.error || msg;
  }
  return msg;
}

export const EntomologiaLarvasDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [crsOptions, setCrsOptions] = useState<CrsOption[]>([]);
  const [loadingForm, setLoadingForm] = useState(true);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCrsId, setFilterCrsId] = useState<string>('');
  const [filterMunicipioId, setFilterMunicipioId] = useState<string>('');
  const [filterCompetencia, setFilterCompetencia] = useState<string>('');
  const [tab, setTab] = useState<DashTab>('relatorios');
  const [exportingConsolidated, setExportingConsolidated] = useState(false);
  const [municipioOptions, setMunicipioOptions] = useState<CrsOption[]>([]);

  const municipioLabels = useMunicipioLabelByIdMap(true);

  const loadForm = useCallback(async () => {
    const formData = await FormService.getFormByKey(AGRAVO);
    setForm(formData);
    return formData;
  }, []);

  const loadCrsOptions = useCallback(async () => {
    try {
      const { data } = await axios.get<unknown>(`${API_BASE}/crs/select`, { withCredentials: true });
      const list = Array.isArray(data) ? data : (data as { data?: unknown[] })?.data ?? [];
      const opts: CrsOption[] = (list as Array<Record<string, unknown>>).map((item) => ({
        value: String(item.value ?? item.id_crs ?? item.id ?? ''),
        label: String(item.label ?? item.nome ?? item.descricao ?? ''),
      }));
      setCrsOptions(opts);
    } catch {
      setCrsOptions([]);
    }
  }, []);

  const loadMunicipioOptions = useCallback(async (crsId: string) => {
    try {
      const { data } = await axios.get<unknown>(`${API_BASE}/tipo-municipio/select`, {
        withCredentials: true,
        params: crsId ? { crs_id: Number(crsId) } : undefined,
      });
      const list = Array.isArray(data) ? data : (data as { data?: unknown[] })?.data ?? [];
      const opts: CrsOption[] = (list as Array<Record<string, unknown>>)
        .map((item) => ({
          value: String(item.value ?? item.idtipo_municipio ?? item.id ?? ''),
          label: String(item.label ?? item.descricao ?? item.nome ?? ''),
        }))
        .filter((o) => o.value !== '')
        .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
      setMunicipioOptions(opts);
    } catch {
      setMunicipioOptions([]);
    }
  }, []);

  const loadSubmissions = useCallback(async () => {
    if (!form?.active_version_id) return;
    setLoadingList(true);
    setError(null);
    try {
      const all = await FormSubmissionService.getSubmissionsAllPagesWithFormPayload(form.active_version_id, {
        crs_id: filterCrsId ? Number(filterCrsId) : undefined,
        competencia: filterCompetencia || undefined,
      });
      setSubmissions(all);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Erro ao carregar relatórios';
      setError(msg);
      setSubmissions([]);
    } finally {
      setLoadingList(false);
    }
  }, [form?.active_version_id, filterCrsId, filterCompetencia]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadForm();
        if (cancelled) return;
        await loadCrsOptions();
        if (cancelled) return;
        await loadMunicipioOptions('');
      } catch (err: unknown) {
        if (!cancelled) {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Erro ao carregar dados';
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoadingForm(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadForm, loadCrsOptions, loadMunicipioOptions]);

  useEffect(() => {
    void loadMunicipioOptions(filterCrsId);
  }, [filterCrsId, loadMunicipioOptions]);

  useEffect(() => {
    setFilterMunicipioId('');
  }, [filterCrsId]);

  useEffect(() => {
    if (!form?.active_version_id) {
      setLoadingList(false);
      return;
    }
    loadSubmissions();
  }, [form?.active_version_id, filterCrsId, filterCompetencia, loadSubmissions]);

  const crsLabelMap = useMemo(
    () => Object.fromEntries(crsOptions.map((o) => [o.value, o.label])),
    [crsOptions],
  );

  const submissionHasMunicipio = useCallback((s: FormSubmission, municipioId: string) => {
    const data = (s.data_json || {}) as Record<string, unknown>;
    const tables = [data.resumo_mensal, data.frequencia_recipientes];
    for (const table of tables) {
      if (!Array.isArray(table)) continue;
      for (const row of table) {
        if (row == null || typeof row !== 'object') continue;
        const id = (row as Record<string, unknown>).municipio_id;
        if (id != null && String(id) === municipioId) return true;
      }
    }
    return false;
  }, []);

  const filteredSubmissions = useMemo(() => {
    if (!filterMunicipioId) return submissions;
    return submissions.filter((s) => submissionHasMunicipio(s, filterMunicipioId));
  }, [submissions, filterMunicipioId, submissionHasMunicipio]);

  const resumoRows = useMemo(() => {
    const rows = flattenEntomologiaResumoRows(filteredSubmissions);
    if (!filterMunicipioId) return rows;
    return rows.filter((r) => r.municipio_id === filterMunicipioId);
  }, [filteredSubmissions, filterMunicipioId]);

  const frequenciaRows = useMemo(() => {
    const rows = flattenEntomologiaFrequenciaRows(filteredSubmissions);
    if (!filterMunicipioId) return rows;
    return rows.filter((r) => r.municipio_id === filterMunicipioId);
  }, [filteredSubmissions, filterMunicipioId]);

  const dashboardKpis = useMemo(
    () => computeEntomologiaDashboardKpis(filteredSubmissions, resumoRows),
    [filteredSubmissions, resumoRows],
  );

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este relatório? Esta ação não pode ser desfeita.')) return;
    const userId = user?.sub || (user as { id?: string } | null)?.id;
    if (!userId) {
      alert('Usuário não autenticado');
      return;
    }
    try {
      await FormSubmissionService.deleteSubmission(id, userId);
      loadSubmissions();
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Erro ao excluir',
      );
    }
  };

  const handleExport = async (submissionId: number, format: 'xlsx' | 'pdf') => {
    try {
      const { blob, filename } = await FormSubmissionService.downloadExport(submissionId, format);
      downloadBlob(blob, filename);
    } catch (err: unknown) {
      alert(await exportErrorMessage(err, 'Erro ao exportar. Verifique se o relatório é do tipo Entomologia.'));
    }
  };

  const handleConsolidatedExport = async () => {
    if (!form?.active_version_id) return;
    setExportingConsolidated(true);
    try {
      const { blob, filename } = await FormSubmissionService.downloadEntomologiaConsolidatedExport({
        form_version_id: form.active_version_id,
        crs_id: filterCrsId ? Number(filterCrsId) : undefined,
        competencia: filterCompetencia || undefined,
      });
      downloadBlob(blob, filename);
    } catch (err: unknown) {
      alert(await exportErrorMessage(err, 'Erro ao exportar consolidado.'));
    } finally {
      setExportingConsolidated(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      draft: 'bg-yellow-100 text-yellow-800',
      submitted: 'bg-green-100 text-green-800',
      synced: 'bg-blue-100 text-blue-800',
    };
    const labels: Record<string, string> = {
      draft: 'Rascunho',
      submitted: 'Enviado',
      synced: 'Sincronizado',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badges[status] ?? 'bg-gray-100 text-gray-800'}`}>
        {labels[status] ?? status}
      </span>
    );
  };

  const tabBtn = (id: DashTab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 -mb-px transition-colors ${
        tab === id
          ? 'border-blue-600 text-blue-800 bg-white'
          : 'border-transparent text-blue-100/90 hover:text-white hover:bg-blue-700/40'
      }`}
    >
      {label}
    </button>
  );

  if (loadingForm && !form) {
    return (
      <AppPageLayout
        title="Controle de Qualidade de Larvas"
        subtitle="Carregando..."
        icon={<Bug className="h-8 w-8" />}
        variant="desktop"
        showBottomNav={false}
      >
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        </div>
      </AppPageLayout>
    );
  }

  if (error && !form) {
    return (
      <AppPageLayout
        title="Erro"
        subtitle="Erro ao carregar dados"
        icon={<Bug className="h-8 w-8" />}
        variant="desktop"
        showBottomNav={false}
      >
        <div className="bg-white rounded-lg shadow p-8 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-red-600 mb-4">Erro</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/private/formularios')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Voltar
          </button>
        </div>
      </AppPageLayout>
    );
  }

  if (!form?.active_version_id) {
    return (
      <AppPageLayout
        title="Controle de Qualidade de Larvas"
        subtitle="Formulário não configurado"
        icon={<Bug className="h-8 w-8" />}
        variant="desktop"
        showBottomNav={false}
      >
        <div className="bg-white rounded-lg shadow p-8 max-w-md mx-auto text-center">
          <p className="text-gray-600 mb-4">O formulário de Entomologia (Larvas) ainda não possui versão ativa.</p>
          <button
            onClick={() => navigate('/private/formularios')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Ir para Formulários
          </button>
        </div>
      </AppPageLayout>
    );
  }

  return (
    <AppPageLayout
      title="Controle de Qualidade de Larvas"
      subtitle="Entomologia – relatórios, resumo mensal e frequência relativa por município"
      icon={<Bug className="h-8 w-8" />}
      variant="desktop"
      showBottomNav={false}
      contentWidth="wide"
      backPath={`/private/formularios/${AGRAVO}`}
      headerActions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleConsolidatedExport}
            disabled={exportingConsolidated || loadingList}
            className="px-4 py-2.5 bg-white text-emerald-700 rounded-xl hover:bg-emerald-50 flex items-center gap-2 font-medium border border-emerald-200 shadow-sm disabled:opacity-50"
            title="Exportar Excel consolidado (filtros atuais)"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {exportingConsolidated ? 'Exportando…' : 'Excel consolidado'}
          </button>
          <button
            onClick={() => navigate(`/private/formularios/${AGRAVO}/nova`)}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl hover:from-blue-700 hover:to-blue-900 flex items-center gap-2 font-medium shadow-md"
          >
            <Plus className="h-4 w-4" />
            Nova entrada
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100/80 p-4 flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2 text-blue-800">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-semibold">Filtros</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">CRS</label>
            <select
              value={filterCrsId}
              onChange={(e) => setFilterCrsId(e.target.value)}
              className="block w-48 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              data-testid="entomologia-filter-crs"
            >
              <option value="">Todos</option>
              {crsOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Município</label>
            <select
              value={filterMunicipioId}
              onChange={(e) => setFilterMunicipioId(e.target.value)}
              className="block w-56 max-w-[min(18rem,70vw)] px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              data-testid="entomologia-filter-municipio"
            >
              <option value="">Todos</option>
              {municipioOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Competência (mês/ano)</label>
            <CompetenciaMesAnoInputs
              idPrefix="filtro-competencia"
              value={filterCompetencia}
              onChange={setFilterCompetencia}
              compact
            />
          </div>
          {(filterCrsId || filterMunicipioId || filterCompetencia) && (
            <button
              type="button"
              onClick={() => {
                setFilterCrsId('');
                setFilterMunicipioId('');
                setFilterCompetencia('');
              }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {!loadingList ? (
          <div className="rounded-2xl border border-blue-100/60 bg-gradient-to-br from-blue-50/40 via-white to-sky-50/30 p-4 shadow-sm">
            <EntomologiaDashKpiStrip kpis={dashboardKpis} />
          </div>
        ) : null}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-2 flex flex-wrap gap-1">
            {tabBtn('relatorios', `Relatórios (${filteredSubmissions.length})`)}
            {tabBtn('resumo', `Resumo mensal (${resumoRows.length})`)}
            {tabBtn('frequencia', `Frequência relativa (${frequenciaRows.length})`)}
          </div>

          {loadingList ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-3 text-gray-500">Carregando dados...</p>
            </div>
          ) : tab === 'relatorios' ? (
            filteredSubmissions.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 mb-4">Nenhum relatório encontrado para os filtros selecionados.</p>
                <button
                  onClick={() => navigate(`/private/formularios/${AGRAVO}/nova`)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Nova entrada
                </button>
              </div>
            ) : (
              <div className={`overflow-auto ${ENTOMO_TABLE_VIEWPORT_MAX}`}>
                <table className="min-w-full divide-y divide-blue-100 text-sm">
                  <thead className="bg-gradient-to-r from-blue-600 to-blue-800 text-white sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                        CRS
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                        Competência
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                        Responsável
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                        Criado em
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-sky-50">
                    {filteredSubmissions.map((s, idx) => {
                      const data = (s.data_json || {}) as Record<string, unknown>;
                      const crsId = data.crs_id != null ? String(data.crs_id) : '';
                      const responsavel = (data.responsavel as string) ?? '—';
                      return (
                        <tr
                          key={s.id}
                          className={`hover:bg-sky-50/80 ${idx % 2 === 1 ? 'bg-sky-50/40' : ''}`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {(crsLabelMap[crsId] ?? crsId) || '—'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {formatCompetenciaCurta(data.competencia as string)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4 text-blue-400" />
                              {responsavel}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(s.status)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-blue-400" />
                              {formatDate(s.created_at)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleExport(s.id, 'xlsx')}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                title="Exportar Excel"
                              >
                                <FileSpreadsheet className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleExport(s.id, 'pdf')}
                                className="p-1.5 text-slate-600 hover:bg-slate-50 rounded-lg"
                                title="Exportar PDF"
                              >
                                <FileText className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => navigate(`/private/formularios/${AGRAVO}/visualizar/${s.id}`)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Visualizar"
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => navigate(`/private/formularios/${AGRAVO}/editar/${s.id}`)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                                title="Editar"
                              >
                                <Edit className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(s.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Excluir"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : tab === 'resumo' ? (
            <EntomologiaResumoTable rows={resumoRows} crsLabels={crsLabelMap} municipioLabels={municipioLabels} />
          ) : (
            <EntomologiaFrequenciaTables
              rows={frequenciaRows}
              crsLabels={crsLabelMap}
              municipioLabels={municipioLabels}
            />
          )}
        </div>
      </div>
    </AppPageLayout>
  );
};

export default EntomologiaLarvasDashboardPage;
