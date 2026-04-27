import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormService, { type Form } from '@/services/FormService';
import { ClipboardList, Shield } from 'lucide-react';
import { AppPageLayout } from '@/components/layouts/AppPageLayout';

export const FormsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      const data = await FormService.getAllForms();
      // Filtrar apenas formulários ativos
      const activeForms = data.filter(form => form.is_active);
      setForms(activeForms);
    } catch (err) {
      console.error('Erro ao carregar formulários:', err);
      setError('Erro ao carregar formulários disponíveis');
    } finally {
      setLoading(false);
    }
  };

  const handleFormClick = (formKey: string) => {
    navigate(`/private/formularios/${formKey}`);
  };

  if (loading) {
    return (
      <AppPageLayout
        title="Formulários de Notificação"
        subtitle="Selecione um agravo para preencher o formulário"
        icon={<ClipboardList className="h-8 w-8" />}
        variant="desktop"
        showBottomNav={false}
      >
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando formulários...</p>
          </div>
        </div>
      </AppPageLayout>
    );
  }

  if (error) {
    return (
      <AppPageLayout
        title="Formulários de Notificação"
        subtitle="Selecione um agravo para preencher o formulário"
        icon={<ClipboardList className="h-8 w-8" />}
        variant="desktop"
        showBottomNav={false}
      >
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </AppPageLayout>
    );
  }

  return (
    <AppPageLayout
      title="Formulários de Notificação"
      subtitle="Selecione um agravo para preencher o formulário"
      icon={<ClipboardList className="h-8 w-8" />}
      variant="desktop"
      showBottomNav={false}
    >
      {forms.length === 0 ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
          <p className="text-yellow-700">
            Nenhum formulário disponível no momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <div
              key={form.id}
              onClick={() => handleFormClick(form.form_key)}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer border border-gray-200 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                <h3 className="text-xl font-semibold text-white">
                  {form.nome}
                </h3>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                    {form.form_key}
                  </span>
                </div>
                {form.descricao && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {form.descricao}
                  </p>
                )}
                {form.my_role === 'ADMIN' && (
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/private/formularios/${form.id}/permissoes`);
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-800 rounded hover:bg-slate-100 border"
                      title="Gerenciar permissões deste formulário (SINAN)"
                    >
                      <Shield className="h-4 w-4" />
                      Permissões
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4">
                  <span>
                    {form.categoria ? (
                      <span className="capitalize">{form.categoria}</span>
                    ) : (
                      'Notificação'
                    )}
                  </span>
                  {form.is_active ? (
                    <span className="flex items-center text-green-600">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Ativo
                    </span>
                  ) : (
                    <span className="text-gray-400">Inativo</span>
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
