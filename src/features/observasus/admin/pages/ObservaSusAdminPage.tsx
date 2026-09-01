import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  ArrowLeft,
  FilePlus,
  Pencil,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import { AdminHeader } from '@/keycloak/admin/components/AdminHeader';
import Footer from '@/features/desktop/components/Footer';
import { SideMenu } from '@/features/home/components/SideMenu';
import { useLanguage } from '@/contexts/LanguageContext';
import { ObservaSusStatusBadge } from '../../components/ObservaSusStatusBadge';
import {
  archiveObservaSusAdminResource,
  getObservaSusAdminResources,
} from '../../services/observasusService';

export function ObservaSusAdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['observasus', 'admin', 'resources', appliedSearch],
    queryFn: () =>
      getObservaSusAdminResources({
        q: appliedSearch || undefined,
        limit: 100,
      }),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => archiveObservaSusAdminResource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observasus', 'admin', 'resources'] });
    },
  });

  const items = data?.items ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AdminHeader
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
        selectedLanguage={selectedLanguage}
      />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="flex-1 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => navigate('/admin/master')}
                className="mt-1 p-2 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                title="Voltar"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  ObservaSUS — Recursos
                </h1>
                <p className="text-gray-600 mt-1">
                  Cadastre painéis, arquivos do DataStorage e publicações. Roles de download
                  continuam em{' '}
                  <Link to="/admin/master/roles" className="text-blue-700 font-medium underline">
                    Gerenciar Roles
                  </Link>
                  .
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <Link
                to="/admin/master/observasus/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-800"
              >
                <Plus className="h-4 w-4" />
                Novo recurso
              </Link>
            </div>
          </div>

          <form
            className="bg-white border rounded-xl p-4 mb-6 shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              setAppliedSearch(search.trim());
            }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título, subtítulo ou descrição..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>

          {isError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
              Não foi possível carregar os recursos. Verifique se a migration ObservaSUS foi aplicada
              e se você tem role admin.
            </div>
          )}

          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="py-16 text-center text-gray-500">Carregando...</div>
            ) : items.length === 0 ? (
              <div className="py-16 text-center">
                <FilePlus className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">Nenhum recurso cadastrado.</p>
                <Link
                  to="/admin/master/observasus/new"
                  className="inline-flex items-center gap-2 text-blue-700 font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  Criar primeiro recurso
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Título</th>
                      <th className="px-4 py-3 font-semibold">Tipo</th>
                      <th className="px-4 py-3 font-semibold">Sistema</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Visibilidade</th>
                      <th className="px-4 py-3 font-semibold">Arquivo</th>
                      <th className="px-4 py-3 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{item.title}</div>
                          <div className="text-xs text-gray-500">{item.slug}</div>
                          {(item.requiredRoles?.length ?? 0) > 0 && (
                            <div className="mt-1 text-xs text-amber-700">
                              Roles: {item.requiredRoles!.join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">{item.type}</td>
                        <td className="px-4 py-3">{item.system}</td>
                        <td className="px-4 py-3">
                          <ObservaSusStatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-3">{item.visibility}</td>
                        <td className="px-4 py-3">
                          {item.hasFile ? (
                            <span className="text-emerald-700 font-medium">Sim</span>
                          ) : (
                            <span className="text-gray-400">Não</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/admin/master/observasus/${item.id}/edit`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-white"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Editar
                            </Link>
                            <button
                              type="button"
                              disabled={archiveMutation.isPending || item.status === 'ARCHIVED'}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Arquivar o recurso "${item.title}"? Ele deixa de aparecer no portal.`
                                  )
                                ) {
                                  archiveMutation.mutate(item.id);
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              <Archive className="h-3.5 w-3.5" />
                              Arquivar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer selectedLanguage={selectedLanguage} />
    </div>
  );
}

export default ObservaSusAdminPage;
