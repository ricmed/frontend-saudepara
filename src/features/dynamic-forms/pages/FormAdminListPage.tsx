import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormService, { type Form } from '@/services/FormService';
import { Plus, Edit, Eye, Trash2, FileText, Copy } from 'lucide-react';
import { useAuth } from '@/keycloak/AuthProvider';

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
      setForms(data);
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{duplicating ? 'Duplicando formulário...' : 'Carregando...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Gerenciar Formulários
          </h1>
          <p className="text-gray-600 mt-1">
            Criar e editar formulários de notificação
          </p>
        </div>
        <button
          onClick={() => navigate('/private/formularios-admin/novo')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg"
        >
          <Plus className="h-5 w-5" />
          Novo Formulário
        </button>
      </div>

      {forms.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Nenhum formulário criado
          </h3>
          <p className="text-gray-500 mb-6">
            Crie seu primeiro formulário de notificação
          </p>
          <button
            onClick={() => navigate('/private/formularios-admin/novo')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Criar Formulário
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <div
              key={form.id}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                <h3 className="text-xl font-semibold text-white">
                  {form.nome}
                </h3>
                <p className="text-blue-100 text-sm mt-1">
                  {form.agravo_key}
                </p>
              </div>
              
              <div className="p-6">
                {form.descricao && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {form.descricao}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
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

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/private/formularios-admin/editar/${form.id}`)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDuplicate(form)}
                    className="px-4 py-2 bg-green-50 text-green-600 rounded hover:bg-green-100"
                    title="Duplicar formulário"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/private/formularios/${form.agravo_key}`)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    title="Visualizar notificações"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(form.id)}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
                    title="Excluir formulário"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
