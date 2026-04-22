import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FormService, { type Form } from '@/services/FormService';
import FormSubmissionService, { type FormSubmission } from '@/services/FormSubmissionService';
import { Plus, Edit, Eye, Trash2, Calendar, User, FileText, BarChart3 } from 'lucide-react';
import { AppPageLayout } from '@/components/layouts/AppPageLayout';
import {
  MONITOR_OPER_REGIONAL_KEY,
  computeTotalAcumuladoMes,
  filterMonitorOperRows,
} from '../utils/monitorOperRegionalReport';
import { MonitorOperQdqqGroupedTotalsTable } from '../components/MonitorOperQdqqGroupedTotalsTable';
import { useCrsLabelByIdMap } from '../hooks/useCrsLabelByIdMap';

export const FormSubmissionsListPage: React.FC = () => {
  const { agravo } = useParams<{ agravo: string }>();
  const navigate = useNavigate();
  const crsLabels = useCrsLabelByIdMap(agravo?.toUpperCase() === MONITOR_OPER_REGIONAL_KEY);

  const [form, setForm] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalAcumulado = React.useMemo(() => {
    if (agravo !== MONITOR_OPER_REGIONAL_KEY) return null;
    const rows = filterMonitorOperRows(submissions);
    if (rows.length === 0) return null;
    return computeTotalAcumuladoMes(rows);
  }, [agravo, submissions]);

  useEffect(() => {
    loadData();
  }, [agravo]);

  const loadData = async () => {
    if (!agravo) return;

    try {
      setLoading(true);
      setError(null);

      // Carregar formulário
      const formData = await FormService.getFormByKey(agravo);
      setForm(formData);
      console.log('📋 Formulário carregado:', formData);

      // Carregar submissions deste formulário
      if (formData.active_version_id) {
        console.log('🔍 Buscando submissions para version_id:', formData.active_version_id);
        if (agravo === MONITOR_OPER_REGIONAL_KEY) {
          const all = await FormSubmissionService.getSubmissionsAllPagesWithFormPayload(
            formData.active_version_id,
          );
          console.log('📊 Submissions (com data_json, todas as páginas):', all.length);
          setSubmissions(all);
        } else {
          const submissionsData = await FormSubmissionService.getSubmissions({
            form_version_id: formData.active_version_id,
            limit: 100,
          });
          console.log('📊 Submissions encontradas:', submissionsData);
          setSubmissions(submissionsData.data);
        }
      } else {
        console.warn('⚠️ Formulário sem versão ativa!');
      }
    } catch (err: any) {
      console.error('❌ Erro ao carregar dados:', err);
      setError(err.response?.data?.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta notificação?')) return;

    try {
      await FormSubmissionService.deleteSubmission(id, 'user-id'); // TODO: pegar user real
      loadData();
    } catch (err: any) {
      console.error('Erro ao excluir:', err);
      alert(err.response?.data?.message || 'Erro ao excluir notificação');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-yellow-100 text-yellow-800',
      submitted: 'bg-green-100 text-green-800',
      synced: 'bg-blue-100 text-blue-800'
    };
    const labels = {
      draft: 'Rascunho',
      submitted: 'Enviado',
      synced: 'Sincronizado'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <AppPageLayout
        title="Notificações"
        subtitle="Carregando..."
        icon={<FileText className="h-8 w-8" />}
        variant="desktop"
        showBottomNav={false}
      >
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        </div>
      </AppPageLayout>
    );
  }

  if (error) {
    return (
      <AppPageLayout
        title="Erro"
        subtitle="Erro ao carregar dados"
        icon={<FileText className="h-8 w-8" />}
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

  return (
    <AppPageLayout
      title={form?.nome || 'Notificações'}
      subtitle={`${submissions.length} notificação(ões) cadastrada(s)`}
      icon={<FileText className="h-8 w-8" />}
      variant="desktop"
      showBottomNav={false}
      headerActions={
        <div className="flex flex-wrap gap-2 justify-end">
          {agravo === MONITOR_OPER_REGIONAL_KEY && (
            <button
              type="button"
              data-testid="monitor-oper-relatorios"
              onClick={() => navigate(`/private/formularios/${agravo}/relatorio`)}
              className="px-4 py-2 bg-white text-gray-800 rounded-md hover:bg-gray-50 flex items-center gap-2 font-medium border border-gray-200"
            >
              <BarChart3 className="h-4 w-4" />
              Relatórios consolidados
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate(`/private/formularios/${agravo}/nova`)}
            className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 flex items-center gap-2 font-medium"
          >
            <Plus className="h-4 w-4" />
            Nova Notificação
          </button>
        </div>
      }
    >
        {totalAcumulado && (
          <div className="mb-4">
            {totalAcumulado.mixed ? (
              <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-800">Totais QDQQ por regional / ano / quadrimestre</h3>
                </div>
                <MonitorOperQdqqGroupedTotalsTable groups={totalAcumulado.groups} tone="list" crsLabels={crsLabels} />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">Total acumulado (QDQQ — quadrimestre)</h3>
                    <p className="text-xs text-gray-500">
                      {totalAcumulado.quadrimestre_label} · ano {String(totalAcumulado.ano ?? '—')}
                      {totalAcumulado.competencia_mes_ano != null && totalAcumulado.competencia_mes_ano !== '' ? (
                        <> · competência {String(totalAcumulado.competencia_mes_ano)}</>
                      ) : null}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    % realização: <span className="font-semibold text-gray-800">
                      {totalAcumulado.perc === undefined ? '—' : totalAcumulado.perc.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="text-xs text-gray-500">Programadas (N)</div>
                    <div className="text-lg font-semibold text-gray-900">{totalAcumulado.programadas}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="text-xs text-gray-500">Realizadas (Σ 0/1)</div>
                    <div className="text-lg font-semibold text-gray-900">{totalAcumulado.realizadasFlag}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="text-xs text-gray-500">Não programadas (Σ 0/1)</div>
                    <div className="text-lg font-semibold text-gray-900">{totalAcumulado.naoProgramadasFlag}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="text-xs text-gray-500">Total</div>
                    <div className="text-lg font-semibold text-gray-900">{totalAcumulado.total}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {submissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">Nenhuma notificação cadastrada ainda</p>
            <button
              onClick={() => navigate(`/private/formularios/${agravo}/nova`)}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Cadastrar Primeira Notificação
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Criação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criado por
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{submission.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(submission.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(submission.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {submission.created_by}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => navigate(`/private/formularios/${agravo}/visualizar/${submission.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Visualizar"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => navigate(`/private/formularios/${agravo}/editar/${submission.id}`)}
                          className="text-green-600 hover:text-green-900"
                          title="Editar"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(submission.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AppPageLayout>
    );
  };
