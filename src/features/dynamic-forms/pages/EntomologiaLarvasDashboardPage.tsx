import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import FormService, { type Form } from '@/services/FormService';
import FormSubmissionService, { type FormSubmission } from '@/services/FormSubmissionService';
import { Plus, Edit, Eye, Trash2, Calendar, User, Bug, Filter, FileSpreadsheet, FileText } from 'lucide-react';
import { AppPageLayout } from '@/components/layouts/AppPageLayout';

const AGRAVO = 'ENTOMOLOGIA_LARVAS';
const server = import.meta.env.VITE_API_SERVER;
const port = import.meta.env.VITE_API_PORT;
const API_BASE = `${server}:${port}/api`;

interface CrsOption {
  value: string;
  label: string;
}

export const EntomologiaLarvasDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [crsOptions, setCrsOptions] = useState<CrsOption[]>([]);
  const [loadingForm, setLoadingForm] = useState(true);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCrsId, setFilterCrsId] = useState<string>('');
  const [filterCompetencia, setFilterCompetencia] = useState<string>('');

  const loadForm = useCallback(async () => {
    const formData = await FormService.getFormByKey(AGRAVO);
    setForm(formData);
    return formData;
  }, []);

  const loadCrsOptions = useCallback(async () => {
    try {
      const { data } = await axios.get<unknown>(`${API_BASE}/crs/select`, { withCredentials: true });
      const list = Array.isArray(data) ? data : (data as { data?: unknown[] })?.data ?? [];
      const opts: CrsOption[] = (list as any[]).map((item: any) => ({
        value: String(item.value ?? item.id_crs ?? item.id ?? ''),
        label: String(item.label ?? item.nome ?? item.descricao ?? ''),
      }));
      setCrsOptions(opts);
    } catch {
      setCrsOptions([]);
    }
  }, []);

  const loadSubmissions = useCallback(async () => {
    if (!form?.active_version_id) return;
    setLoadingList(true);
    setError(null);
    try {
      const filters: Parameters<typeof FormSubmissionService.getSubmissions>[0] = {
        form_version_id: form.active_version_id,
        limit: 100,
      };
      if (filterCrsId) filters.crs_id = Number(filterCrsId);
      if (filterCompetencia) filters.competencia = filterCompetencia;
      const res = await FormSubmissionService.getSubmissions(filters);
      setSubmissions(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar relatórios');
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
      } catch (err: any) {
        if (!cancelled) setError(err.response?.data?.message || 'Erro ao carregar dados');
      } finally {
        if (!cancelled) setLoadingForm(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loadForm, loadCrsOptions]);

  useEffect(() => {
    if (!form?.active_version_id) {
      setLoadingList(false);
      return;
    }
    loadSubmissions();
  }, [form?.active_version_id, filterCrsId, filterCompetencia, loadSubmissions]);

  const crsLabelMap = Object.fromEntries(crsOptions.map((o) => [o.value, o.label]));

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este relatório? Esta ação não pode ser desfeita.')) return;
    try {
      await FormSubmissionService.deleteSubmission(id, 'user-id');
      loadSubmissions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao excluir');
    }
  };

  const handleExport = async (submissionId: number, format: 'xlsx' | 'pdf') => {
    try {
      const { blob, filename } = await FormSubmissionService.downloadExport(submissionId, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      let msg = 'Erro ao exportar. Verifique se o relatório é do tipo Entomologia.';
      const data = err.response?.data;
      if (data instanceof Blob) {
        try {
          const text = await data.text();
          const j = JSON.parse(text);
          msg = j.message || j.error || msg;
        } catch {
          // keep default msg
        }
      } else if (data?.message || data?.error) {
        msg = data.message || data.error;
      }
      alert(msg);
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

  const formatCompetencia = (competencia: string | undefined) => {
    if (!competencia) return '—';
    const s = String(competencia);
    if (s.length >= 7) {
      const [y, m] = [s.slice(0, 4), s.slice(5, 7)];
      const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      return `${monthNames[parseInt(m, 10) - 1]}/${y}`;
    }
    return s;
  };

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
      subtitle="Entomologia – Resumo Mensal e Frequência Relativa"
      icon={<Bug className="h-8 w-8" />}
      variant="desktop"
      showBottomNav={false}
      headerActions={
        <button
          onClick={() => navigate(`/private/formularios/${AGRAVO}/nova`)}
          className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 flex items-center gap-2 font-medium border border-blue-200"
        >
          <Plus className="h-4 w-4" />
          Nova entrada
        </button>
      }
    >
      <div className="space-y-4">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2 text-gray-700">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filtros</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">CRS</label>
            <select
              value={filterCrsId}
              onChange={(e) => setFilterCrsId(e.target.value)}
              className="block w-48 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              {crsOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Competência (mês/ano)</label>
            <input
              type="month"
              value={filterCompetencia}
              onChange={(e) => setFilterCompetencia(e.target.value)}
              className="block w-40 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {(filterCrsId || filterCompetencia) && (
            <button
              type="button"
              onClick={() => { setFilterCrsId(''); setFilterCompetencia(''); }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* Lista */}
        {loadingList ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-3 text-gray-500">Carregando relatórios...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
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
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CRS</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Competência</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsável</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criado em</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((s) => {
                  const data = (s.data_json || {}) as Record<string, unknown>;
                  const crsId = data.crs_id != null ? String(data.crs_id) : '';
                  const responsavel = (data.responsavel as string) ?? '—';
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(crsLabelMap[crsId] ?? crsId) || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatCompetencia(data.competencia as string)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4 text-gray-400" />
                          {responsavel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(s.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(s.created_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleExport(s.id, 'xlsx')}
                            className="text-emerald-600 hover:text-emerald-900"
                            title="Exportar Excel"
                          >
                            <FileSpreadsheet className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleExport(s.id, 'pdf')}
                            className="text-gray-600 hover:text-gray-900"
                            title="Exportar PDF"
                          >
                            <FileText className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => navigate(`/private/formularios/${AGRAVO}/visualizar/${s.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Visualizar"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => navigate(`/private/formularios/${AGRAVO}/editar/${s.id}`)}
                            className="text-green-600 hover:text-green-900"
                            title="Editar"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="text-red-600 hover:text-red-900"
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
        )}
      </div>
    </AppPageLayout>
  );
};
