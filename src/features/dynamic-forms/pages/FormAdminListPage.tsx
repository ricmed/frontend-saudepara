import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormService, { type Form } from '@/services/FormService';
import { Plus, Edit, Eye, Trash2, FileText, Copy, Settings, Power } from 'lucide-react';
import { useAuth } from '@/keycloak/AuthProvider';
import { AppPageLayout } from '@/components/layouts/AppPageLayout';

export const FormAdminListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      const data = await FormService.getAllForms();
      // Ordenar: ativos primeiro, depois inativos
      const sortedData = data.sort((a, b) => {
        if (a.is_active === b.is_active) return 0;
        return a.is_active ? -1 : 1;
      });
      setForms(sortedData);
    } catch (err) {
      console.error('Erro ao carregar formulários:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este formulário?')) return;
    
    try {
      await FormService.deleteForm(id);
      loadForms();
    } catch (err: any) {
      console.error('Erro ao excluir:', err);
      const errorMsg = err?.response?.data?.message || err?.message || 'Erro desconhecido';
      alert(`Erro ao excluir formulário: ${errorMsg}`);
    }
  };

  const handleToggleActive = async (form: Form) => {
    const action = form.is_active ? 'desativar' : 'ativar';
    const newActiveState = !form.is_active;
    if (!confirm(`Tem certeza que deseja ${action} o formulário "${form.nome}"?`)) return;
    
    try {
      await FormService.toggleActive(form.id, newActiveState);
      loadForms();
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err);
      const errorMsg = err?.response?.data?.message || err?.message || 'Erro desconhecido';
      alert(`Erro ao ${action} formulário: ${errorMsg}`);
    }
  };

  const handleDuplicate = async (form: Form) => {
    if (!confirm(`Deseja duplicar o formulário "${form.nome}"?`)) return;
    
    try {
      setDuplicating(true);
      const userId = user?.sub || user?.id;
      if (!userId) {
        alert('Usuário não autenticado');
        return;
      }

      // Buscar versão ativa do formulário original
      const originalForm = await FormService.getFormById(form.id);
      if (!originalForm.versions || originalForm.versions.length === 0) {
        alert('Formulário original não possui versões para duplicar');
        return;
      }

      const activeVersion = originalForm.versions.find(v => v.id === originalForm.active_version_id) || originalForm.versions[0];

      // Criar novo formulário com "(Cópia)" no nome
      const newForm = await FormService.createForm({
        nome: `${form.nome} (Cópia)`,
        agravo_key: `${form.agravo_key}_COPIA_${Date.now()}`.substring(0, 50),
        descricao: form.descricao || '',
        created_by: userId
      });

      // Criar versão com mesmo schema
      const newVersion = await FormService.createVersion(newForm.id, {
        schema_json: activeVersion.schema_json,
        ui_json: activeVersion.ui_json || {},
        rules_json: activeVersion.rules_json || {},
        published_by: userId
      });

      // Publicar automaticamente
      await FormService.publishVersion(newForm.id, newVersion.id, userId);

      alert('Formulário duplicado com sucesso!');
      loadForms();
      
      // Redirecionar para edição do novo formulário
      navigate(`/private/formularios-admin/editar/${newForm.id}`);
    } catch (err: any) {
      console.error('Erro ao duplicar:', err);
      const errorMsg = err?.response?.data?.message || err?.message || 'Erro desconhecido';
      alert(`Erro ao duplicar formulário: ${errorMsg}`);
    } finally {
      setDuplicating(false);
    }
  };

  if (loading || duplicating) {
    return (
      <AppPageLayout
        title="Gerenciar Formulários"
        subtitle="Criar e editar formulários de notificação"
        icon={<FileText className="h-8 w-8" />}
        variant="desktop"
        showBottomNav={false}
      >
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{duplicating ? 'Duplicando formulário...' : 'Carregando...'}</p>
          </div>
        </div>
      </AppPageLayout>
    );
  }

  return (
    <AppPageLayout
      title="Gerenciar Formulários"
      subtitle="Criar e editar formulários de notificação"
      icon={<FileText className="h-8 w-8" />}
      variant="desktop"
      showBottomNav={false}
      backPath="/"
      headerActions={
        <button
          onClick={() => navigate('/private/formularios-admin/novo')}
          className="px-3 sm:px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-1 sm:gap-2 shadow-lg font-medium text-sm sm:text-base"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">Novo</span>
          <span className="sm:hidden">+</span>
        </button>
      }
    >
      {forms.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 sm:p-12 text-center">
          <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
            Nenhum formulário criado
          </h3>
          <p className="text-sm sm:text-base text-gray-500 mb-6">
            Crie seu primeiro formulário de notificação
          </p>
          <button
            onClick={() => navigate('/private/formularios-admin/novo')}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2 text-sm sm:text-base"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            Criar Formulário
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {forms.map((form) => (
            <div
              key={form.id}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 sm:p-4">
                <h3 className="text-lg sm:text-xl font-semibold text-white">
                  {form.nome}
                </h3>
                <p className="text-blue-100 text-xs sm:text-sm mt-1">
                  {form.agravo_key}
                </p>
              </div>
              
              <div className="p-4 sm:p-6">
                {form.descricao && (
                  <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                    {form.descricao}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                  <span className="capitalize">{form.categoria || 'Notificação'}</span>
                  {form.is_active ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                      Ativo
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      Inativo
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/private/formularios-admin/editar/${form.id}`)}
                      className="flex-1 px-2 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Editar</span>
                    </button>
                    <button
                      onClick={() => handleToggleActive(form)}
                      className={`px-2 sm:px-4 py-2 rounded ${
                        form.is_active
                          ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                      title={form.is_active ? 'Desativar formulário' : 'Ativar formulário'}
                    >
                      <Power className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(form)}
                      className="px-2 sm:px-4 py-2 bg-purple-50 text-purple-600 rounded hover:bg-purple-100"
                      title="Duplicar formulário"
                    >
                      <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/private/formularios/${form.agravo_key}`)}
                      className="px-2 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      title="Visualizar notificações"
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(form.id)}
                      className="px-2 sm:px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
                      title="Excluir formulário"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                  {form.active_version_id && (
                    <button
                      onClick={() => navigate(`/private/formularios-admin/${form.id}/versoes/${form.active_version_id}/campos-fixos`)}
                      className="w-full px-3 sm:px-4 py-2 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                      title="Configurar campos fixos (Modelo Híbrido SINAN)"
                    >
                      <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                      Campos Fixos
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppPageLayout>
  );
};
