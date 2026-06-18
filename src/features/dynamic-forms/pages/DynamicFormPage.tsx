import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FormRenderer } from '../components/FormRenderer';
import { FormActionBar } from '../components/FormActionBar';
import FormService, { type FormVersion } from '@/services/FormService';
import FormSubmissionService from '@/services/FormSubmissionService';
import { useAuth } from '@/keycloak/AuthProvider';
import { AppPageLayout } from '@/components/layouts/AppPageLayout';
import { FileEdit, Eye, FileSpreadsheet, FileText, Download, Loader2, Printer } from 'lucide-react';
import { exportDynamicFormPdf } from '../utils/dynamicFormPdfExport';
import { isHepatiteCriancaHBVForm } from '../utils/hepatiteCriancaHbvLimits';
import { relayFichaPrintData } from '../utils/fichaPrintChannel';
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
  const listBackPath = agravo ? `/private/formularios/${agravo}` : '/private/formularios';
  
  const [formVersion, setFormVersion] = useState<FormVersion | null>(null);
  const [initialData, setInitialData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [liveFormData, setLiveFormData] = useState<Record<string, unknown>>({});
  const [exportingPdf, setExportingPdf] = useState(false);
  const printRelayCleanupRef = useRef<(() => void) | null>(null);
  const [monitorOperRegionalCrsScope, setMonitorOperRegionalCrsScope] =
    useState<MonitorOperRegionalScopePayload | null>(null);
  const [notificacaoEscopo, setNotificacaoEscopo] = useState<NotificacaoEscopo>('livre');
  const [formInstanceKey, setFormInstanceKey] = useState(0);

  const dynamicFormId = agravo ? `dynamic-form-${agravo}` : 'dynamic-form';

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

  useEffect(() => {
    return () => {
      printRelayCleanupRef.current?.();
    };
  }, []);

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
        setLiveFormData(submission.data_json ?? {});
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
        setLiveFormData(base);
      }
    } catch (err: any) {
      console.error('Erro ao carregar formulário:', err);
      setError(err.response?.data?.message || 'Erro ao carregar formulário');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: Record<string, any>) => {
    await handleSave(data);
  };

  const handleSave = async (data: Record<string, any>) => {
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

      let savedId = id ? Number(id) : null;

      if (id) {
        await FormSubmissionService.updateSubmission(
          Number(id),
          { data_json: data },
          userId
        );

        await FormSubmissionService.submitSubmission(Number(id), userId);
      } else {
        const submission = await FormSubmissionService.createSubmission({
          form_version_id: formVersion.id,
          data_json: data,
          created_by: userId,
          created_offline: false,
        });

        savedId = submission.id;
        await FormSubmissionService.submitSubmission(submission.id, userId);
      }

      setInitialData(data);
      setLiveFormData(data);

      if (!id && savedId != null && agravo) {
        navigate(`/private/formularios/${agravo}/editar/${savedId}`, { replace: true });
      }

      alert('Formulário salvo com sucesso!');
    } catch (err: any) {
      console.error('Erro ao salvar formulário:', err);
      const errorMsg = err?.response?.data?.message || err?.message || 'Erro desconhecido';
      alert(`Erro ao salvar formulário: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(listBackPath);
  };

  const handleClearForm = () => {
    if (!window.confirm('Tem certeza que deseja limpar todos os campos do formulário?')) return;
    setFormInstanceKey((key) => key + 1);
    setLiveFormData(initialData);
  };

  if (loading) {
    return (
      <AppPageLayout
        title={isViewMode ? 'Visualizar Notificação' : (isEditMode ? 'Editar Notificação' : 'Nova Notificação')}
        subtitle="Carregando formulário..."
        icon={isViewMode ? <Eye className="h-8 w-8" /> : <FileEdit className="h-8 w-8" />}
        variant="desktop"
        showBottomNav={false}
        backPath={listBackPath}
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
        backPath={listBackPath}
      >
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center max-w-md p-6 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-xl font-bold text-red-800 mb-2">Erro</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate(listBackPath)}
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
        backPath={listBackPath}
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

  const isHepatiteCriancaHBV =
    agravo === 'HEPATITE_CRIANCA_HBV' ||
    isHepatiteCriancaHBVForm({ schema: formVersion.schema_json, formKey: agravo });

  const handleExportFichaPdf = async () => {
    if (!formVersion) return;
    try {
      setExportingPdf(true);
      await exportDynamicFormPdf(
        formVersion.schema_json,
        liveFormData,
        {
          title: formVersion.form?.nome || formVersion.schema_json.title || 'Ficha de notificação',
          subtitle: 'Criança exposta ao HBV / HCV — SES-PA',
          submissionId: id ? Number(id) : undefined,
          statusLabel: isViewMode ? 'Visualização' : isEditMode ? 'Edição' : 'Nova notificação',
        },
      );
    } catch (err) {
      console.error('Erro ao exportar PDF da ficha:', err);
      alert(
        err instanceof Error && err.message
          ? err.message
          : 'Não foi possível gerar o PDF. Tente novamente.',
      );
    } finally {
      setExportingPdf(false);
    }
  };

  const handleOpenPrintView = () => {
    if (!agravo) return;
    printRelayCleanupRef.current?.();
    const channelId = crypto.randomUUID();
    printRelayCleanupRef.current = relayFichaPrintData(channelId, () => liveFormData);
    const formFrom = isViewMode ? 'visualizar' : isEditMode ? 'editar' : 'nova';
    const channelQuery = `channel=${encodeURIComponent(channelId)}&from=${encodeURIComponent(formFrom)}`;
    const path = id
      ? `/private/formularios/${agravo}/imprimir/${id}?${channelQuery}`
      : `/private/formularios/${agravo}/imprimir?${channelQuery}`;
    window.open(path, '_blank', 'noopener,noreferrer');
  };

  const pdfExportBusy = exportingPdf;

  const isEntomologia = agravo === 'ENTOMOLOGIA_LARVAS';

  const footerExportButtonClass =
    'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70';

  const headerHepatitePrintButtonClass =
    'inline-flex items-center gap-2 rounded-md border border-white/50 bg-white/95 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-70';

  const headerHepatitePdfButtonClass =
    'inline-flex items-center gap-2 rounded-md border border-white/40 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-70';

  const headerEntomologiaExportButtonClass =
    'inline-flex items-center gap-2 rounded-md border border-white/40 bg-white/95 px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-70';

  const renderExportActions = (placement: 'header' | 'footer') => {
    const hepatitePrintClass =
      placement === 'header' ? headerHepatitePrintButtonClass : footerExportButtonClass;
    const hepatitePdfClass =
      placement === 'header' ? headerHepatitePdfButtonClass : footerExportButtonClass;

    if (isEntomologia && isViewMode && id) {
      return (
        <>
          <button
            type="button"
            onClick={() => handleExport('xlsx')}
            className={
              placement === 'header'
                ? `${headerEntomologiaExportButtonClass} text-emerald-700`
                : footerExportButtonClass
            }
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar Excel
          </button>
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            className={
              placement === 'header'
                ? `${headerEntomologiaExportButtonClass} text-gray-700`
                : footerExportButtonClass
            }
          >
            <FileText className="h-4 w-4" />
            Exportar PDF
          </button>
        </>
      );
    }

    if (isHepatiteCriancaHBV) {
      return (
        <>
          <button
            type="button"
            onClick={handleOpenPrintView}
            disabled={pdfExportBusy || saving}
            className={hepatitePrintClass}
            title="Abre a ficha em nova aba para imprimir ou salvar como PDF pelo navegador"
          >
            <Printer className="h-4 w-4" />
            Imprimir ficha
          </button>
          <button
            type="button"
            onClick={handleExportFichaPdf}
            disabled={pdfExportBusy || saving}
            className={hepatitePdfClass}
            title="Relatório tabular com todos os campos do schema"
          >
            {exportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exportingPdf ? 'Gerando PDF…' : 'PDF resumo'}
          </button>
        </>
      );
    }

    return null;
  };

  const headerExportActions = renderExportActions('header');
  const footerExtraActions = renderExportActions('footer');

  const headerActions = (
    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
      <FormActionBar
        formId={dynamicFormId}
        saveLabel="Salvar"
        cancelLabel={isViewMode ? 'Fechar' : 'Cancelar'}
        saving={saving}
        readOnly={isViewMode}
        onCancel={handleCancel}
        onClear={isViewMode ? undefined : handleClearForm}
        placement="header"
      />
      {headerExportActions ? (
        <div className="flex flex-wrap items-center gap-2">{headerExportActions}</div>
      ) : null}
    </div>
  );

  return (
    <AppPageLayout
      title={isViewMode ? 'Visualizar Notificação' : (isEditMode ? 'Editar Notificação' : 'Nova Notificação')}
      subtitle={formVersion.form?.nome || agravo || ''}
      icon={isViewMode ? <Eye className="h-8 w-8" /> : <FileEdit className="h-8 w-8" />}
      variant="desktop"
      showBottomNav={false}
      headerActions={headerActions}
      backPath={listBackPath}
    >
        {saving && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-700">Salvando formulário...</p>
            </div>
          </div>
        )}

        <FormRenderer
          key={formInstanceKey}
          formId={dynamicFormId}
          formKey={agravo}
          schema={{
            ...formVersion.schema_json,
            title: formVersion.form?.nome || formVersion.schema_json.title,
          }}
          initialData={initialData}
          onDataChange={setLiveFormData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onClear={handleClearForm}
          submitLabel="Salvar"
          cancelLabel={isViewMode ? 'Fechar' : 'Cancelar'}
          saving={saving}
          footerExtraActions={footerExtraActions}
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
