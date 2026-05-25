import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FormRenderer } from '../components/FormRenderer';
import FormService, { type FormVersion } from '@/services/FormService';
import FormSubmissionService from '@/services/FormSubmissionService';
import { useAuth } from '@/keycloak/AuthProvider';
import { AppPageLayout } from '@/components/layouts/AppPageLayout';
import { FileEdit, Eye, FileSpreadsheet, FileText } from 'lucide-react';
import axios from 'axios';
import { getApiRoot } from '@/config/apiOrigin';
import type { MonitorOperRegionalScopePayload } from '../types/monitorOperRegionalScope';
import { usuarioGestaoService } from '@/services/UsuarioGestaoService';
import {
  buildNotificacaoPrefillFromAccess,
  escopoFromAccess,
  schemaUsesNotificacao,
  type NotificacaoEscopo,
} from '../utils/notificacaoScopeDefaults';
import { resolveFormRendererContext } from '../utils/sinanClinicalFields';

export const DynamicFormPage: React.FC = () => {
  const { agravo, id } = useParams<{ agravo: string; id?: string }>(); // param name kept for route compatibility
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  // Detectar modo: nova, editar ou visualizar
  const isViewMode = window.location.pathname.includes('/visualizar/');
  const isEditMode = window.location.pathname.includes('/editar/');
  
  const [formVersion, setFormVersion] = useState<FormVersion | null>(null);
  const [initialData, setInitialData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [monitorOperRegionalCrsScope, setMonitorOperRegionalCrsScope] =
    useState<MonitorOperRegionalScopePayload | null>(null);
  const [notificacaoEscopo, setNotificacaoEscopo] = useState<NotificacaoEscopo>('livre');

  const getCurrentMonthCode = () => {
    const m = new Date().getMonth(); // 0..11
    const map = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    return map[m] || 'JAN';
  };

  const getCurrentCompetenciaMesAno = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`; // YYYY-MM (input type="month")
  };

  const getCurrentQuadrimestre = () => {
    const m = new Date().getMonth(); // 0..11
    if (m <= 3) return 'Q1'; // Jan-Abr
    if (m <= 7) return 'Q2'; // Mai-Ago
    return 'Q3'; // Set-Dez
  };

  useEffect(() => {
    loadForm();
  }, [agravo, id, user?.id, user?.sub, authLoading]);

  const loadForm = async () => {
    if (!agravo) return;
    if (authLoading) return;

    try {
      setLoading(true);
      setError(null);
      setMonitorOperRegionalCrsScope(null);

      // Carregar versão ativa do formulário
      const version = await FormService.getActiveVersion(agravo);
      setFormVersion(version);

      const schema = version.schema_json;
      const wantsNotificacaoScope = schemaUsesNotificacao(schema);

      let access: Record<string, any> | null = null;
      if (wantsNotificacaoScope && user) {
        try {
          access = await usuarioGestaoService.getUserAccess();
        } catch {
          access = null;
        }
      }
      const roles = user?.roles || [];
      const isAdmin = roles.includes('admin') || roles.includes('administrator');
      const escopo = wantsNotificacaoScope ? escopoFromAccess(access, isAdmin) : 'livre';
      setNotificacaoEscopo(escopo);

      let scopePayload: MonitorOperRegionalScopePayload | null = null;
      if (agravo === 'MONITOR_OPER_REGIONAL') {
        const uid = user?.sub || user?.id;
        if (!uid) {
          setError('É necessário estar autenticado para abrir este formulário.');
          return;
        }
        const { data } = await axios.get<MonitorOperRegionalScopePayload>(
          `${getApiRoot()}/crs/monitor-oper-regional-scope`,
          { withCredentials: true }
        );
        scopePayload = data;
        setMonitorOperRegionalCrsScope(data);
        if (data.ui === 'none') {
          setError(
            'Seu usuário não possui regional (CRS) ou perfil estadual vinculado. Solicite acesso ao administrador.'
          );
          return;
        }
      }

      if (id) {
        const submission = await FormSubmissionService.getSubmissionById(Number(id));
        setInitialData(submission.data_json);
      } else {
        // Nova notificação: pré-preencher data da notificação com a data atual
        const hoje = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const now = new Date();
        const base: Record<string, any> = { notificacao: { dt_notificacao: hoje } };

        const prefill =
          wantsNotificacaoScope && escopo !== 'livre'
            ? await buildNotificacaoPrefillFromAccess(access, escopo)
            : {};

        // Defaults de cabeçalho para formulários de monitoramento (editável pelo usuário)
        if (agravo === 'MONITOR_OPER_REGIONAL' || agravo === 'MONITOR_TEC_PQAVS') {
          base.cabecalho = {
            ...(base.cabecalho || {}),
            ano: now.getFullYear(),
          };
        }
        // No operacional, mês/quadrimestre aparecem após escolher competência; já deixamos valores default.
        if (agravo === 'MONITOR_OPER_REGIONAL') {
          base.cabecalho = {
            ...(base.cabecalho || {}),
            competencia_mes_ano: getCurrentCompetenciaMesAno(),
            ano: now.getFullYear(),
            mes: getCurrentMonthCode(),
          };
          if (scopePayload?.ui === 'readonly' && scopePayload.readonlyCrs) {
            base.cabecalho.crs_id = String(scopePayload.readonlyCrs.id);
          }
        }
        // No técnico, quadrimestre é sempre obrigatório; pré-selecionar o atual.
        if (agravo === 'MONITOR_TEC_PQAVS') {
          base.cabecalho = {
            ...(base.cabecalho || {}),
            quadrimestre: getCurrentQuadrimestre(),
          };
        }

        base.notificacao = { ...(base.notificacao || {}), ...prefill };
        setInitialData(base);
      }
    } catch (err: any) {
      console.error('Erro ao carregar formulário:', err);
      setError(err.response?.data?.message || 'Erro ao carregar formulário');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: Record<string, any>) => {
    await handleSave(data, true); // true = enviar/finalizar
  };

  const handleSaveDraft = async (data: Record<string, any>) => {
    await handleSave(data, false); // false = salvar rascunho apenas
  };

  const handleSave = async (data: Record<string, any>, shouldSubmit: boolean) => {
    if (!formVersion) {
      alert('Formulário não carregado');
      return;
    }

    const userId = user?.sub || user?.id;
    if (!userId) {
      alert('Usuário não autenticado');
      console.error('user object:', user);
      return;
    }

    try {
      setSaving(true);

      if (id) {
        // Atualizar submission existente
        await FormSubmissionService.updateSubmission(
          Number(id),
          { data_json: data },
          userId
        );
        
        console.log('shouldSubmit:', shouldSubmit);
        // Enviar (finalizar) apenas se shouldSubmit = true
        if (shouldSubmit) {
          console.log('Chamando submitSubmission para id:', id);
          const result = await FormSubmissionService.submitSubmission(Number(id), userId);
          console.log('Resultado submitSubmission:', result);
        }
      } else {
        // Criar nova submission
        const submission = await FormSubmissionService.createSubmission({
          form_version_id: formVersion.id,
          data_json: data,
          created_by: userId,
          created_offline: false,
        });

        console.log('Nova submission criada:', submission.id, 'shouldSubmit:', shouldSubmit);
        // Enviar (finalizar) apenas se shouldSubmit = true
        if (shouldSubmit) {
          console.log('Chamando submitSubmission para nova submission id:', submission.id);
          const result = await FormSubmissionService.submitSubmission(submission.id, userId);
          console.log('Resultado submitSubmission:', result);
        } else {
          // Se salvou como rascunho, redirecionar para edição
          navigate(`/private/formularios/${agravo}/editar/${submission.id}`, { replace: true });
        }
      }

      alert(shouldSubmit ? 'Formulário enviado com sucesso!' : 'Rascunho salvo com sucesso!');
      if (shouldSubmit || id) {
        navigate(-1);
      }
    } catch (err: any) {
      console.error('Erro ao salvar formulário:', err);
      const errorMsg = err?.response?.data?.message || err?.message || 'Erro desconhecido';
      alert(`Erro ao salvar formulário: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <AppPageLayout
        title={isViewMode ? 'Visualizar Notificação' : (isEditMode ? 'Editar Notificação' : 'Nova Notificação')}
        subtitle="Carregando formulário..."
        icon={isViewMode ? <Eye className="h-8 w-8" /> : <FileEdit className="h-8 w-8" />}
        variant="desktop"
        showBottomNav={false}
      >
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando formulário...</p>
          </div>
        </div>
      </AppPageLayout>
    );
  }

  if (error) {
    return (
      <AppPageLayout
        title="Erro"
        subtitle="Erro ao carregar formulário"
        icon={<FileEdit className="h-8 w-8" />}
        variant="desktop"
        showBottomNav={false}
      >
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center max-w-md p-6 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-xl font-bold text-red-800 mb-2">Erro</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Voltar
            </button>
          </div>
        </div>
      </AppPageLayout>
    );
  }

  if (!formVersion) {
    return (
      <AppPageLayout
        title="Formulário não encontrado"
        icon={<FileEdit className="h-8 w-8" />}
        variant="desktop"
        showBottomNav={false}
      >
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <p className="text-gray-600">Formulário não encontrado</p>
          </div>
        </div>
      </AppPageLayout>
    );
  }

  const handleExport = async (format: 'xlsx' | 'pdf') => {
    if (!id) return;
    try {
      const { blob, filename } = await FormSubmissionService.downloadExport(Number(id), format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      const data = err.response?.data;
      let msg = 'Erro ao exportar.';
      if (data instanceof Blob) {
        try {
          const j = JSON.parse(await data.text());
          msg = j.message || j.error || msg;
        } catch { /* ignore */ }
      } else if (data?.message) msg = data.message;
      alert(msg);
    }
  };

  const isEntomologia = agravo === 'ENTOMOLOGIA_LARVAS';
  const exportActions = isEntomologia && isViewMode && id ? (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => handleExport('xlsx')}
        className="px-3 py-2 bg-white text-emerald-600 rounded-md hover:bg-emerald-50 flex items-center gap-2 text-sm font-medium border border-emerald-200"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Exportar Excel
      </button>
      <button
        type="button"
        onClick={() => handleExport('pdf')}
        className="px-3 py-2 bg-white text-gray-600 rounded-md hover:bg-gray-50 flex items-center gap-2 text-sm font-medium border border-gray-200"
      >
        <FileText className="h-4 w-4" />
        Exportar PDF
      </button>
    </div>
  ) : undefined;

  return (
    <AppPageLayout
      title={isViewMode ? 'Visualizar Notificação' : (isEditMode ? 'Editar Notificação' : 'Nova Notificação')}
      subtitle={formVersion.form?.nome || agravo || ''}
      icon={isViewMode ? <Eye className="h-8 w-8" /> : <FileEdit className="h-8 w-8" />}
      variant="desktop"
      showBottomNav={false}
      headerActions={exportActions}
    >
        {saving && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-700">Enviando formulário...</p>
            </div>
          </div>
        )}

        <FormRenderer
          schema={{
            ...formVersion.schema_json,
            title: formVersion.form?.nome || formVersion.schema_json.title,
          }}
          initialData={initialData}
          onSubmit={handleSubmit}
          onSaveDraft={isViewMode ? undefined : handleSaveDraft}
          onCancel={handleCancel}
          submitLabel={isViewMode ? undefined : (isEditMode ? 'Atualizar e Enviar' : 'Enviar')}
          saveDraftLabel={isEditMode ? 'Salvar Alterações' : 'Salvar Rascunho'}
          cancelLabel={isViewMode ? "Fechar" : "Cancelar"}
          readOnly={isViewMode}
          context={resolveFormRendererContext(agravo, formVersion.schema_json)}
          monitorOperRegionalCrsScope={
            agravo === 'MONITOR_OPER_REGIONAL' ? monitorOperRegionalCrsScope : null
          }
          notificacaoEscopo={notificacaoEscopo}
        />
      </AppPageLayout>
    );
  };
