import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppPageLayout } from '@/components/layouts/AppPageLayout';
import FormService, { type Form } from '@/services/FormService';
import { Plus, Link2, FileSpreadsheet, FileText, FileEdit, Trash2, Copy, Search } from 'lucide-react';
import { useAuth } from '@/keycloak/AuthProvider';

const VISIBILITY_LABEL: Record<string, string> = {
  PRIVATE: 'Privado',
  UNLISTED: 'Compartilhável',
  PUBLIC: 'Público',
};

type FormRole = 'ADMIN' | 'EDITOR' | 'VIEWER';

export const MyFormsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const getRole = (form: Form): FormRole | null => {
    const role = form.my_role;
    if (role === 'ADMIN' || role === 'EDITOR' || role === 'VIEWER') return role;
    const currentUserId = ((user as any)?.sub || (user as any)?.id || '') as string;
    if (currentUserId && String(form.owner_user_id || '') === String(currentUserId)) return 'ADMIN';
    const aclRole = ((form as any)?.acl?.[0]?.role ?? null) as string | null;
    if (aclRole === 'ADMIN' || aclRole === 'EDITOR' || aclRole === 'VIEWER') return aclRole;
    return null;
  };

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
          {filteredForms.map((f) => {
            const role = getRole(f);
            const canEditFields = role === 'ADMIN' || role === 'EDITOR';
            const canShare = role === 'ADMIN' || role === 'EDITOR';
            const canViewResponses = role === 'ADMIN' || role === 'EDITOR' || role === 'VIEWER';
            const canManageForm = role === 'ADMIN';
            return (
            <div
              key={f.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all w-full max-w-[26rem] justify-self-start"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
                <h3 className="text-white font-semibold text-lg line-clamp-2">{f.nome}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    f.is_active
                      ? 'bg-emerald-400/30 text-emerald-100'
                      : 'bg-white/20 text-white/70'
                  }`}>
                    {f.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                  <span className="text-blue-200 text-xs">
                    {VISIBILITY_LABEL[f.visibility || 'PRIVATE']}
                    {f.slug ? ` · /f/${f.slug}` : ''}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-4">
                {f.descricao && (
                  <p className="text-sm text-gray-500 line-clamp-2">{f.descricao}</p>
                )}

                {/* Ações principais */}
                <div className="grid grid-cols-3 gap-2">
                  {canEditFields ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/private/meus-formularios/${f.id}/editar`)}
                      className="flex flex-col items-center gap-1 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium"
                    >
                      <FileEdit className="h-4 w-4" aria-hidden />
                      Campos
                    </button>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50" />
                  )}
                  {canShare ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/private/meus-formularios/${f.id}/compartilhar`)}
                      className="flex flex-col items-center gap-1 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium"
                    >
                      <Link2 className="h-4 w-4" aria-hidden />
                      Compartilhar
                    </button>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50" />
                  )}
                  {canViewResponses ? (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/private/meus-formularios/${f.id}/respostas`, {
                          state: { responsesBackTo: '/private/meus-formularios' },
                        })
                      }
                      className="flex flex-col items-center gap-1 py-3 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-xs font-medium"
                    >
                      <FileSpreadsheet className="h-4 w-4" aria-hidden />
                      Respostas
                    </button>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50" />
                  )}
                </div>

                {/* Ações secundárias */}
                {canManageForm && (
                  <div className="flex items-center justify-end gap-4 pt-1 border-t">
                    <button
                      type="button"
                      onClick={() => toggleActive(f)}
                      className={`text-xs hover:underline ${
                        f.is_active ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {f.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicate(f)}
                      className="text-xs text-gray-500 hover:underline flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" aria-hidden />
                      Duplicar
                    </button>
                    <button
                      type="button"
                      onClick={() => removeForm(f)}
                      className="text-xs text-red-500 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" aria-hidden />
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </AppPageLayout>
  );
};

