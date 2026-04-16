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
  Key, 
  MoreVertical,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Edit,
  Trash2
} from 'lucide-react';

// Importar service de gestão de usuários
import {
  usuarioGestaoService,
  UsuarioAcesso
} from '@/services/UsuarioGestaoService';

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

interface UserFilters {
  search: string;
  enabled?: boolean;
}

// Função para obter o nível hierárquico a partir dos roles do Keycloak
function getUserLevelFromRoles(roles: string[]): 'admin' | 'admin.estado' | 'admin.municipio' | 'admin.unidade' | 'notificador' | 'user' {
  // Prioridade hierárquica dos roles (do maior para o menor)
  const roleHierarchy = [
    'admin',
    'admin.estado', 
    'admin.municipio',
    'admin.unidade',
    'notificador'
  ];
  
  for (const role of roleHierarchy) {
    if (roles.includes(role)) {
      return role as any;
    }
  }
  
  return 'user';
}

// Função para determinar se usuário pode ser deletado baseado no tipo de admin
// (mantida para referência; atualmente não usada na tela)
// function canUserBeDeleted(targetUser: UserWithAccess, adminType: string): boolean {
//   if (!targetUser.roles) return false;
//   
//   const targetLevel = getUserLevelFromRoles(targetUser.roles);
//   
//   // Admin master pode deletar qualquer um
//   if (adminType === 'admin') return true;
//   
//   // Admin.unidade só pode deletar notificadores e usuários comuns
//   if (adminType === 'admin.unidade') {
//     return ['notificador', 'user'].includes(targetLevel);
//   }
//   
//   return false;
// }

// Função para identificar se é notificador de unidade baseado nos roles
function isNotificadorUnidade(user: UserWithAccess): boolean {
  return user.roles?.includes('notificador') || false;
}

const UserListUnidade: React.FC = () => {
  const navigate = useNavigate();
  const { selectedLanguage } = useLanguage();
  const { user } = useAuth();
  const userPermissions = useUserPermissions();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [users, setUsers] = useState<UserWithAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<UserFilters>({ search: '' });
  const [pagination, setPagination] = useState({ first: 0, max: 20, total: 0 });
  const [showFilters, setShowFilters] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ userId: string; userName: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (userPermissions.loading) return;
    const isAdminUnidade = user?.roles?.includes('admin.unidade');
    const isAdminMaster = user?.roles?.includes('admin');
    if (isAdminUnidade && !isAdminMaster) {
      const id = userPermissions.estabelecimentoId;
      if (id == null || Number(id) <= 0) {
        setLoading(false);
        setUsers([]);
        setPagination((p) => ({ ...p, total: 0 }));
        return;
      }
    }
    loadUsers();
  }, [pagination.first, pagination.max, userPermissions.estabelecimentoId, userPermissions.loading, user?.roles]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filters.search !== '') {
        loadUsers();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters.search]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando usuários da unidade...');
      
      // Verificar se o usuário atual é admin.unidade
      const isAdminUnidade = user?.roles?.includes('admin.unidade');
      const isAdminMaster = user?.roles?.includes('admin');
      
      console.log('👤 Admin atual - Roles:', user?.roles);
      console.log('🏥 É admin.unidade?', isAdminUnidade);
      console.log('👑 É admin master?', isAdminMaster);
      
      if (!isAdminUnidade && !isAdminMaster) {
        console.error('❌ Usuário não tem permissão para acessar lista de usuários da unidade');
        alert('Você não tem permissão para acessar esta funcionalidade.');
        setUsers([]);
        return;
      }

      if (userPermissions.loading) {
        setLoading(false);
        return;
      }
      if (isAdminUnidade && !isAdminMaster) {
        const id = userPermissions.estabelecimentoId;
        if (id == null || Number(id) <= 0) {
          setUsers([]);
          return;
        }
      }

      const estabelecimentoIdNum = Number(userPermissions.estabelecimentoId);
      const hasUnidadeScope = isAdminUnidade && Number.isFinite(estabelecimentoIdNum) && estabelecimentoIdNum > 0;
      
      console.log('🔑 Permissões do admin carregadas:', userPermissions);
      
      // 1. Buscar lista agregada paginada (server-side)
      const page = await usuarioGestaoService.getUsuariosList({
        first: pagination.first,
        max: pagination.max,
        search: filters.search || undefined,
        scope: hasUnidadeScope ? 'unidade' : undefined,
        scopeId: hasUnidadeScope ? estabelecimentoIdNum : undefined,
      });
      const usersData = page.items as any[];
      console.log('📝 Dados recebidos da API:', usersData);
      
      if (!Array.isArray(usersData)) {
        console.error('❌ Dados inválidos recebidos da API:', usersData);
        throw new Error('Dados inválidos recebidos da API de usuários');
      }

      // Para admin.unidade (não master): o backend já devolve filtrado com total correto
      if (isAdminUnidade && !isAdminMaster) {
        setUsers(usersData as any);
        setPagination(prev => ({ ...prev, total: page.total || 0 }));
        return;
      }
      
      // 2. Para admin master, mostrar todos. Para admin.unidade, filtrar pela unidade
      const usersWithAccess: UserWithAccess[] = [];
      
      for (const userData of usersData) {
        try {
          // Para admin master, incluir todos os usuários
          if (isAdminMaster) {
            usersWithAccess.push({
              id: userData.id || `user-${usersWithAccess.length}`,
              username: userData.username || `user-${usersWithAccess.length}`,
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              email: userData.email || '',
              enabled: userData.enabled !== false,
              emailVerified: true,
              createdTimestamp: userData.createdTimestamp || Date.now(),
              acessos: []
            });
            continue;
          }
          
          // Para admin.unidade, buscar acessos e filtrar
          if (isAdminUnidade) {
            const userAcessos = await usuarioGestaoService.getUsuarioAcessos(userData.id);
            
            // Verificar se o usuário tem acesso à unidade do admin
            // Usar userPermissions.estabelecimentoId em vez de adminContext.unidadeId
            const adminEstabelecimentoId = userPermissions.estabelecimentoId;
            
            const hasUnidadeAccess = userAcessos.some(acesso => 
              acesso.nivel_acesso === 'unidade' && 
              acesso.estabelecimento_id === adminEstabelecimentoId
            );
            
            console.log(`🔍 Verificando usuário ${userData.username}:`, {
              userAcessos,
              adminEstabelecimentoId,
              hasUnidadeAccess
            });
            
            if (hasUnidadeAccess) {
              // Buscar roles do usuário
              const userRoles = await usuarioGestaoService.getUserRoles(userData.id);
              
              usersWithAccess.push({
                id: userData.id || `user-${usersWithAccess.length}`,
                username: userData.username || `user-${usersWithAccess.length}`,
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                email: userData.email || '',
                enabled: userData.enabled !== false,
                emailVerified: true,
                createdTimestamp: userData.createdTimestamp || Date.now(),
                acessos: userAcessos,
                roles: userRoles
              });
            }
          }
        } catch (error) {
          console.warn(`⚠️ Erro ao buscar acessos do usuário ${userData.username}:`, error);
          // Em caso de erro para admin master, incluir mesmo assim
          if (isAdminMaster) {
            usersWithAccess.push({
              id: userData.id || `user-${usersWithAccess.length}`,
              username: userData.username || `user-${usersWithAccess.length}`,
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              email: userData.email || '',
              enabled: userData.enabled !== false,
              emailVerified: true,
              createdTimestamp: userData.createdTimestamp || Date.now(),
              acessos: []
            });
          }
        }
      }

      console.log(`✅ ${usersWithAccess.length} usuários processados para ${isAdminMaster ? 'admin master' : 'admin.unidade'}`);
      setUsers(usersWithAccess);
      // total vem do server; mas após filtrar por unidade no frontend, o "total" real muda.
      // TODO: mover filtro por unidade pro backend para total correto.
      setPagination(prev => ({ ...prev, total: usersWithAccess.length }));
      
    } catch (error: any) {
      console.error('💥 Erro ao carregar usuários:', error);
      
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          'Erro desconhecido ao carregar usuários';
      
      alert(`❌ Erro ao carregar usuários: ${errorMessage}`);
      
      setUsers([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      switch (action) {
        case 'enable':
          await usuarioGestaoService.toggleUsuarioStatus(userId, true);
          break;
        case 'disable':
          await usuarioGestaoService.toggleUsuarioStatus(userId, false);
          break;
        case 'reset-password':
          navigate(`/admin/unidade/users/${userId}/reset-password`);
          return;
        default:
          return;
      }

      await loadUsers();
      setActionMenuOpen(null);
    } catch (error) {
      console.error('Erro na ação:', error);
      alert(`Erro ao executar ação: ${error}`);
    }
  };

  const handleEditUser = (userId: string) => {
    setActionMenuOpen(null);
    navigate(`/admin/unidade/users/${userId}/edit`);
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirm) return;
    
    setDeleting(true);
    try {
      await usuarioGestaoService.excluirUsuario(deleteConfirm.userId);
      await loadUsers();
      setDeleteConfirm(null);
      alert('Usuário deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      alert(`Erro ao deletar usuário: ${error}`);
    } finally {
      setDeleting(false);
    }
  };

  const confirmDeleteUser = (userId: string, userName: string) => {
    setActionMenuOpen(null);
    setDeleteConfirm({ userId, userName });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !filters.search || 
      user.username.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(filters.search.toLowerCase());

    const matchesEnabled = filters.enabled === undefined || user.enabled === filters.enabled;

    return matchesSearch && matchesEnabled;
  });

  const paginatedUsers = filteredUsers.slice(pagination.first, pagination.first + pagination.max);

  const totalPages = Math.ceil(filteredUsers.length / pagination.max);
  const currentPage = Math.floor(pagination.first / pagination.max) + 1;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AdminHeader 
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} 
        selectedLanguage={selectedLanguage}
      />

      <main className="flex-1 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Cabeçalho */}
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate('/admin/unidade')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                Usuários da Unidade
              </h1>
              <p className="text-gray-600">
                Gerencie os usuários notificadores da sua unidade
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/unidade/users/new')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <UserPlus className="h-4 w-4" />
              Criar Usuário
            </button>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, email ou username..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <Filter className="h-4 w-4" />
                Filtros
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={filters.enabled === undefined ? '' : filters.enabled.toString()}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        enabled: e.target.value === '' ? undefined : e.target.value === 'true'
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todos os Status</option>
                      <option value="true">Habilitado</option>
                      <option value="false">Desabilitado</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tabela de usuários */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                        <p className="mt-2">Carregando usuários...</p>
                      </td>
                    </tr>
                  ) : paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium">Nenhum usuário encontrado</p>
                        <p className="text-sm">Tente ajustar os filtros ou criar um novo usuário.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName && user.lastName 
                                  ? `${user.firstName} ${user.lastName}`
                                  : user.username
                                }
                              </div>
                              <div className="text-sm text-gray-500">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(() => {
                            if (!user.roles) {
                              return <span className="text-sm text-gray-400">Carregando...</span>;
                            }
                            
                            const userLevel = getUserLevelFromRoles(user.roles);
                            const isNotificador = isNotificadorUnidade(user);
                            // const canBeDeleted = canUserBeDeleted(user, user?.roles?.includes('admin') ? 'admin' : 'admin.unidade');
                            
                            const getBadgeConfig = (level: string) => {
                              switch (level) {
                                case 'admin':
                                  return { color: 'bg-purple-100 text-purple-800', text: 'Admin Master' };
                                case 'admin.estado':
                                  return { color: 'bg-blue-100 text-blue-800', text: 'Admin Estado' };
                                case 'admin.municipio':
                                  return { color: 'bg-green-100 text-green-800', text: 'Admin Município' };
                                case 'admin.unidade':
                                  return { color: 'bg-yellow-100 text-yellow-800', text: 'Admin Unidade' };
                                case 'notificador':
                                  return { color: 'bg-orange-100 text-orange-800', text: 'Notificador' };
                                default:
                                  return { color: 'bg-gray-100 text-gray-800', text: 'Usuário' };
                              }
                            };
                            
                            const badgeConfig = getBadgeConfig(userLevel);
                            
                            return (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeConfig.color}`}>
                                {badgeConfig.text}
                                {isNotificador && userLevel !== 'notificador' && (
                                  <span className="ml-1 text-orange-600">•</span>
                                )}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.enabled 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.enabled ? 'Habilitado' : 'Desabilitado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative">
                            <button
                              onClick={() => setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)}
                              className="text-gray-400 hover:text-gray-600 p-1"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            
                            {actionMenuOpen === user.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                                <div className="py-1">
                                  <button
                                    onClick={() => handleEditUser(user.id)}
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => confirmDeleteUser(user.id, 
                                      user.firstName && user.lastName 
                                        ? `${user.firstName} ${user.lastName}`
                                        : user.username
                                    )}
                                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Deletar
                                  </button>
                                  <div className="border-t border-gray-100"></div>
                                  <button
                                    onClick={() => handleUserAction(user.id, user.enabled ? 'disable' : 'enable')}
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                                  >
                                    {user.enabled ? (
                                      <>
                                        <PowerOff className="h-4 w-4 mr-2" />
                                        Desabilitar
                                      </>
                                    ) : (
                                      <>
                                        <Power className="h-4 w-4 mr-2" />
                                        Habilitar
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleUserAction(user.id, 'reset-password')}
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                                  >
                                    <Key className="h-4 w-4 mr-2" />
                                    Redefinir Senha
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {!loading && filteredUsers.length > 0 && (
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, first: Math.max(0, prev.first - prev.max) }))}
                    disabled={pagination.first === 0}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, first: prev.first + prev.max }))}
                    disabled={pagination.first + pagination.max >= filteredUsers.length}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Próxima
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando{' '}
                      <span className="font-medium">{pagination.first + 1}</span>
                      {' '}a{' '}
                      <span className="font-medium">
                        {Math.min(pagination.first + pagination.max, filteredUsers.length)}
                      </span>
                      {' '}de{' '}
                      <span className="font-medium">{filteredUsers.length}</span>
                      {' '}resultados
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, first: Math.max(0, prev.first - prev.max) }))}
                        disabled={pagination.first === 0}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        {currentPage} de {totalPages}
                      </span>
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, first: prev.first + prev.max }))}
                        disabled={pagination.first + pagination.max >= filteredUsers.length}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer selectedLanguage={selectedLanguage} />
      
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      {/* Modal de confirmação de delete */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirmar Exclusão
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Tem certeza que deseja deletar o usuário <strong>{deleteConfirm.userName}</strong>? 
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deletando...' : 'Deletar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserListUnidade;