import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/keycloak/AuthProvider';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { AdminHeader } from './components/AdminHeader';
import Footer from '@/features/desktop/components/Footer';
import { SideMenu } from '@/features/home/components/SideMenu';
import { 
  Users, 
  Search, 
  UserPlus, 
  Power, 
  PowerOff, 
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Edit,
  Trash2
} from 'lucide-react';
import { usuarioGestaoService, UsuarioAcesso } from '@/services/UsuarioGestaoService';

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  enabled: boolean;
  emailVerified: boolean;
  createdTimestamp: number;
}

interface UserWithAccess extends User {
  acessos?: UsuarioAcesso[];
  roles?: string[];
}

const UserListCrs: React.FC = () => {
  const navigate = useNavigate();
  const { selectedLanguage } = useLanguage();
  const { user } = useAuth();
  const userPermissions = useUserPermissions();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [users, setUsers] = useState<UserWithAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ first: 0, max: 20, total: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState<{ userId: string; userName: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (userPermissions.crsId !== undefined) {
      loadUsers();
    }
  }, [pagination.first, pagination.max, userPermissions.crsId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (search !== '') {
        loadUsers();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      if (!userPermissions.crsId) {
        console.warn('⚠️ crsId não definido');
        setUsers([]);
        return;
      }

      // ✅ Melhor: usar listagem agregada do backend (paginada + com search)
      const page = await usuarioGestaoService.getUsuariosList({
        first: pagination.first,
        max: pagination.max,
        search: search || undefined,
        scope: 'crs',
        scopeId: Number(userPermissions.crsId),
      });

      setUsers(page.items as any);
      setPagination((prev) => ({ ...prev, total: page.total || 0 }));
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!deleteConfirm) return;

    try {
      setDeleting(true);
      
      // Primeiro remover os acessos
      await usuarioGestaoService.hardDeleteAllUserAccess(userId);
      
      // Depois excluir o usuário
      await usuarioGestaoService.deleteUser(userId);
      
      setDeleteConfirm(null);
      loadUsers(); // Recarregar lista
    } catch (err) {
      console.error('Erro ao excluir usuário:', err);
      alert('Erro ao excluir usuário');
    } finally {
      setDeleting(false);
    }
  };

  const currentPage = Math.floor(pagination.first / pagination.max) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.max);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AdminHeader 
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} 
        selectedLanguage={selectedLanguage}
      />

      <main className="flex-1 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Cabeçalho */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Usuários da Regional
              </h1>
              <p className="text-gray-600">
                Gerenciar usuários notificadores da regional
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/admin/crs')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                Voltar
              </button>
              <button
                onClick={() => navigate('/admin/crs/users/new')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="h-5 w-5" />
                Novo Usuário
              </button>
            </div>
          </div>

          {/* Barra de pesquisa */}
          <div className="bg-white rounded-lg shadow mb-6 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar por nome, email ou username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tabela de usuários */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        Carregando usuários...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>Nenhum usuário encontrado</p>
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">
                              {u.firstName || u.lastName 
                                ? `${u.firstName || ''} ${u.lastName || ''}`.trim()
                                : u.username
                              }
                            </div>
                            {(u.firstName || u.lastName) && (
                              <div className="text-sm text-gray-500">@{u.username}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {u.email || '-'}
                        </td>
                        <td className="px-6 py-4">
                          {u.enabled ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Power className="h-3 w-3 mr-1" />
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <PowerOff className="h-3 w-3 mr-1" />
                              Inativo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => navigate(`/admin/crs/users/${u.id}/edit`)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ userId: u.id, userName: u.username })}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {pagination.total > pagination.max && (
              <div className="px-6 py-3 border-t bg-gray-50 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {pagination.first + 1} a {Math.min(pagination.first + pagination.max, pagination.total)} de {pagination.total} usuários
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, first: Math.max(0, prev.first - prev.max) }))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, first: prev.first + prev.max }))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de confirmação de exclusão */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirmar Exclusão
            </h3>
            <p className="text-gray-600 mb-4">
              Tem certeza que deseja excluir o usuário <strong>{deleteConfirm.userName}</strong>?
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirm.userId)}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer selectedLanguage={selectedLanguage} />
      
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </div>
  );
};

export default UserListCrs;
