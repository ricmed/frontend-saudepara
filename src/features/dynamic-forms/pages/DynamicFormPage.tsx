import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FormRenderer } from '../components/FormRenderer';
import FormService, { type FormVersion } from '@/services/FormService';
import FormSubmissionService from '@/services/FormSubmissionService';
import { useAuth } from '@/keycloak/AuthProvider';
import { AppPageLayout } from '@/components/layouts/AppPageLayout';
import { FileEdit, Eye } from 'lucide-react';

export const DynamicFormPage: React.FC = () => {
  const { agravo, id } = useParams<{ agravo: string; id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Detectar modo: nova, editar ou visualizar
  const isViewMode = window.location.pathname.includes('/visualizar/');
  const isEditMode = window.location.pathname.includes('/editar/');
  
  const [formVersion, setFormVersion] = useState<FormVersion | null>(null);
  const [initialData, setInitialData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadForm();
  }, [agravo, id]);

  const loadForm = async () => {
    if (!agravo) return;

    try {
      setLoading(true);
      setError(null);

      // Carregar versão ativa do formulário
      const version = await FormService.getActiveVersion(agravo);
      setFormVersion(version);

      // Se tiver ID, carregar dados existentes
      if (id) {
        const submission = await FormSubmissionService.getSubmissionById(Number(id));
        setInitialData(submission.data_json);
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
        
        // Enviar (finalizar) apenas se shouldSubmit = true
        if (shouldSubmit) {
          await FormSubmissionService.submitSubmission(Number(id), userId);
        }
      } else {
        // Criar nova submission
        const submission = await FormSubmissionService.createSubmission({
          form_version_id: formVersion.id,
          data_json: data,
          created_by: userId,
          created_offline: false,
        });

        // Enviar (finalizar) apenas se shouldSubmit = true
        if (shouldSubmit) {
          await FormSubmissionService.submitSubmission(submission.id, userId);
        } else {
          // Se salvou como rascunho, redirecionar para edição
          navigate(`/private/formularios-dinamicos/editar/${submission.id}`, { replace: true });
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

  return (
    <AppPageLayout
      title={isViewMode ? 'Visualizar Notificação' : (isEditMode ? 'Editar Notificação' : 'Nova Notificação')}
      subtitle={formVersion.form?.nome || agravo || ''}
      icon={isViewMode ? <Eye className="h-8 w-8" /> : <FileEdit className="h-8 w-8" />}
      variant="desktop"
      showBottomNav={false}
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
          schema={formVersion.schema_json}
          initialData={initialData}
          onSubmit={handleSubmit}
          onSaveDraft={isViewMode ? undefined : handleSaveDraft}
          onCancel={handleCancel}
          submitLabel={isViewMode ? undefined : (isEditMode ? 'Atualizar e Enviar' : 'Enviar')}
          saveDraftLabel={isEditMode ? 'Salvar Alterações' : 'Salvar Rascunho'}
          cancelLabel={isViewMode ? "Fechar" : "Cancelar"}
          readOnly={isViewMode}
        />
      </AppPageLayout>
    );
  };
