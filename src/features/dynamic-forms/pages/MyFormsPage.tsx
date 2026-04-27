import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppPageLayout } from '@/components/layouts/AppPageLayout';
import FormService, { type Form } from '@/services/FormService';
import { Plus, Link2, FileSpreadsheet, FileText, FileEdit, Power, Trash2, Copy, Search } from 'lucide-react';

export const MyFormsPage: React.FC = () => {
  const navigate = useNavigate();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await FormService.getMyForms();
      setForms(data);
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Erro ao carregar meus formulários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (f: Form) => {
    const action = f.is_active ? 'desativar' : 'ativar';
    if (!confirm(`Tem certeza que deseja ${action} o formulário "${f.nome}"?`)) return;
    try {
      await FormService.updateMyForm(f.id, { is_active: !f.is_active });
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || `Erro ao ${action} formulário`);
    }
  };

  const removeForm = async (f: Form) => {
    const ok = confirm(
      `Tem certeza que deseja excluir o formulário "${f.nome}"?\n\nATENÇÃO: todos os dados e respostas serão apagados. Essa ação não pode ser desfeita.`
    );
    if (!ok) return;
    try {
      await FormService.deleteMyForm(f.id);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Erro ao excluir formulário');
    }
  };

  const create = async () => {
    navigate('/private/meus-formularios/novo');
  };

  const duplicate = async (f: Form) => {
    if (!confirm(`Duplicar o formulário "${f.nome}"?`)) return;
    try {
      const created = await FormService.duplicateMyForm(f.id);
      await load();
      navigate(`/private/meus-formularios/${created.id}/editar`);
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Erro ao duplicar formulário');
    }
  };

  const normalizedQuery = q.trim().toLowerCase();
  const filteredForms = normalizedQuery
    ? forms.filter((f) => {
        const hay = `${f.nome || ''} ${f.slug || ''} ${f.visibility || ''}`.toLowerCase();
        return hay.includes(normalizedQuery);
      })
    : forms;

  return (
    <AppPageLayout
      title="Meus Formulários"
      subtitle="Crie, compartilhe e acompanhe respostas"
      icon={<FileText className="h-8 w-8" />}
      variant="desktop"
      showBottomNav={false}
      backPath="/"
    >
      <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome ou link…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={create}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center justify-center gap-2 shadow-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Novo formulário
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando…</p>
        </div>
      ) : forms.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-10 text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhum formulário ainda</h3>
          <p className="text-gray-600 mb-6">Crie um formulário e compartilhe com o público.</p>
          <button
            onClick={create}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Criar formulário
          </button>
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-10 text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhum resultado</h3>
          <p className="text-gray-600 mb-6">Tente buscar por outro nome ou apague o filtro.</p>
          <button
            onClick={() => setQ('')}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 inline-flex items-center gap-2"
          >
            Limpar busca
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredForms.map((f) => (
            <div
              key={f.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all w-full max-w-[26rem] justify-self-start"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
                <h3 className="text-white font-semibold text-lg line-clamp-2">{f.nome}</h3>
                <p className="text-blue-100 text-xs mt-1">
                  {f.visibility || 'PRIVATE'} {f.slug ? `· /f/${f.slug}` : ''}
                </p>
              </div>
              <div className="p-4 space-y-3">
                {f.descricao ? <p className="text-sm text-gray-600 line-clamp-3">{f.descricao}</p> : null}
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span
                    className={`px-2 py-1 rounded-full border ${
                      f.is_active
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    {f.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/private/meus-formularios/${f.id}/editar`)}
                    className="w-full min-h-[2.5rem] px-2 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-center leading-tight"
                  >
                    <FileEdit className="h-4 w-4 shrink-0" aria-hidden />
                    <span>Campos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/private/meus-formularios/${f.id}/compartilhar`)}
                    className="w-full min-h-[2.5rem] px-2 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-center leading-tight"
                  >
                    <Link2 className="h-4 w-4 shrink-0" aria-hidden />
                    <span>Compartilhar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/private/formularios-admin/respostas/${f.id}`)}
                    className="w-full min-h-[2.5rem] px-2 py-2 bg-emerald-50 text-emerald-800 rounded-md hover:bg-emerald-100 inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-center leading-tight"
                  >
                    <FileSpreadsheet className="h-4 w-4 shrink-0" aria-hidden />
                    <span>Respostas</span>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(f)}
                    className={`w-full min-h-[2.5rem] px-2 py-2 rounded-md inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-center leading-tight ${
                      f.is_active
                        ? 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                        : 'bg-green-50 text-green-800 hover:bg-green-100'
                    }`}
                  >
                    <Power className="h-4 w-4 shrink-0" aria-hidden />
                    <span>{f.is_active ? 'Desativar' : 'Ativar'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicate(f)}
                    className="w-full min-h-[2.5rem] px-2 py-2 rounded-md bg-purple-50 text-purple-800 hover:bg-purple-100 inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-center leading-tight"
                  >
                    <Copy className="h-4 w-4 shrink-0" aria-hidden />
                    <span>Duplicar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeForm(f)}
                    title="Remove o formulário e todas as respostas. Não pode ser desfeito."
                    className="w-full min-h-[2.5rem] px-2 py-2 rounded-md bg-red-50 text-red-800 hover:bg-red-100 inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-center leading-tight"
                  >
                    <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppPageLayout>
  );
};

