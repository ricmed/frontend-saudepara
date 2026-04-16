import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/i18n/useTranslations';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminHeader } from './components/AdminHeader';
import Footer from '@/features/desktop/components/Footer';
import { SideMenu } from '@/features/home/components/SideMenu';
import { 
  Users, 
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  Shield, 
  Power, 
  PowerOff, 
  Key, 
  MoreVertical,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowLeft
} from 'lucide-react';

import type { UsuarioListItem } from '@/services/UsuarioGestaoService';

// Importar service de gestão de usuários
import {
  usuarioGestaoService
} from '@/services/UsuarioGestaoService';

type UserWithAccess = UsuarioListItem;

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
// Função para identificar se é notificador baseado nos roles
function isNotificadorUnidade(user: UserWithAccess): boolean {
  return user.roles?.includes('notificador') || false;
}

const UsersList: React.FC = () => {
  const navigate = useNavigate();
  const { selectedLanguage } = useLanguage();
  const { t } = useTranslation(selectedLanguage);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [users, setUsers] = useState<UserWithAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ first: 0, max: 20 });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const page = await usuarioGestaoService.getUsuariosList({
        first: pagination.first,
        max: pagination.max,
        search: searchTerm || undefined,
      });

      const items = (page.items || []) as unknown as UsuarioListItem[];
      setUsers(items as any);
      setTotal(page.total || 0);
    } catch (e: any) {
      setUsers([]);
      setTotal(0);
      setError(e?.message || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.first, pagination.max]);

  useEffect(() => {
    const id = setTimeout(() => {
      setPagination((p) => ({ ...p, first: 0 }));
      loadUsers();
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

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
        case 'delete':
          if (!window.confirm(t('admin.users.confirmDelete'))) return;
          await usuarioGestaoService.excluirUsuario(userId);
          break;
        case 'view-access':
          await handleViewUserAccess(userId);
          return; // Não recarregar
        default:
          return;
      }

      // Recarregar lista após ações que modificam dados
      await loadUsers();
      setActionMenuOpen(null);
    } catch (error) {
      console.error('Erro na ação:', error);
      alert(`Erro ao executar ação: ${error}`);
    }
  };

  const handleViewUserAccess = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      console.log(`🔍 Buscando acessos para usuário: ${user.username} (${userId})`);
      
      // Buscar acessos do usuário
      const acessos = await usuarioGestaoService.getUsuarioAcessos(userId);
      console.log(`✅ Acessos encontrados:`, acessos);
      
      // Verificar se acessos é um array
      if (!Array.isArray(acessos)) {
        console.error('❌ Acessos não é um array:', typeof acessos, acessos);
        alert(`Erro: Dados de acesso inválidos recebidos do servidor.`);
        return;
      }
      
      if (acessos.length === 0) {
        alert(`USUÁRIO SEM ACESSOS CONFIGURADOS\n\nUsuário: ${user.username}\nEmail: ${user.email || 'N/A'}\n\nEste usuário ainda não possui acessos configurados no sistema.`);
        return;
      }
      
      // Criar uma mensagem detalhada dos acessos
      let mensagem = `ACESSOS DO USUÁRIO: ${user.username}\n`;
      mensagem += `Email: ${user.email || 'N/A'}\n`;
      mensagem += `Total de acessos: ${acessos.length}\n\n`;
      
      acessos.forEach((acesso, index) => {
        mensagem += `${index + 1}. Nível: ${acesso.nivel_acesso.toUpperCase()}\n`;
        
        if (acesso.estabelecimento) {
          mensagem += `   Estabelecimento: ${acesso.estabelecimento.nome}\n`;
          mensagem += `   ID: ${acesso.estabelecimento.idestabelecimento}\n`;
        }
        
        if (acesso.tipo_municipio) {
          mensagem += `   Município: ${acesso.tipo_municipio.descricao}\n`;
        }
        
        if (acesso.tipo_estado) {
          mensagem += `   Estado: ${acesso.tipo_estado.descricao}\n`;
        }
        
        const permissoes = {
          4: 'Leitura',
          6: 'Leitura e Escrita', 
          7: 'Todas as Permissões'
        };
        
        mensagem += `   Permissões: ${permissoes[acesso.permissoes as keyof typeof permissoes] || `Código ${acesso.permissoes}`}\n`;
        mensagem += `   Status: ${acesso.ativo === 'S' ? 'ATIVO' : 'INATIVO'}\n`;
        mensagem += `   Criado em: ${new Date(acesso.created_at).toLocaleDateString('pt-BR')}\n\n`;
      });
      
      alert(mensagem);
      
    } catch (error) {
      console.error('Erro ao carregar acessos:', error);
      alert(`Erro ao carregar acessos do usuário: ${error}`);
    }
  };

  const handleEditUser = (user: UserWithAccess) => {
    // Navegar para a página completa de edição do usuário
    console.log('📝 Navegando para edição do usuário:', user.username);
    navigate(`/admin/master/users/${user.id}/edit`);
  };

  const handleResetPassword = (user: UserWithAccess) => {
    // Navegar para a página completa de reset de senha
    console.log('🔑 Navegando para reset de senha do usuário:', user.username);
    navigate(`/admin/master/users/${user.id}/reset-password`);
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const nextPage = () => {
    if (pagination.first + pagination.max < total) {
      setPagination(prev => ({ ...prev, first: prev.first + prev.max }));
    }
  };

  const prevPage = () => {
    if (pagination.first > 0) {
      setPagination(prev => ({ ...prev, first: Math.max(0, prev.first - prev.max) }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Cabeçalho */}
      <AdminHeader 
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} 
        selectedLanguage={selectedLanguage}
      />

      {/* Conteúdo principal */}
      <main className="flex-1 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Título e ações */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Voltar ao Painel Administrativo"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {t('admin.users.title')}
                </h1>
                <p className="text-gray-600">
                  {t('admin.users.subtitle')}
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-4 sm:mt-0">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <Filter className="h-4 w-4 mr-2" />
                {t('admin.users.filters')}
              </button>
              <button
                onClick={() => navigate('/admin/master/users/new')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {t('admin.users.createUser')}
              </button>
            </div>
          </div>

          {/* Filtros */}
          {showFilters && (
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.users.search')}
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder={t('admin.users.searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={loadUsers}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    Recarregar
                  </button>
                  <div className="text-sm text-gray-600 p-2">
                    <span className="text-gray-600">Total: {total}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabela de usuários */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.users.table.user')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.users.table.email')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.users.table.status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acessos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.users.table.created')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.users.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                        {t('admin.users.loading')}
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                        {error ? `Erro: ${error}` : t('admin.users.noUsers')}
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4">
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
                              <div className="text-sm text-gray-500">
                                @{user.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{user.email || '-'}</div>
                          {user.emailVerified ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {t('admin.users.emailVerified')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {t('admin.users.emailNotVerified')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(() => {
                            if (!user.roles) {
                              return <span className="text-sm text-gray-400">Carregando...</span>;
                            }
                            
                            const userLevel = getUserLevelFromRoles(user.roles);
                            const isNotificador = isNotificadorUnidade(user);
                            
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
                        <td className="px-6 py-4">
                          {user.enabled ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Power className="h-3 w-3 mr-1" />
                              {t('admin.users.enabled')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <PowerOff className="h-3 w-3 mr-1" />
                              {t('admin.users.disabled')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewUserAccess(user.id)}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition"
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            Ver Acessos
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(user.createdTimestamp ?? Date.now()).toLocaleDateString(selectedLanguage)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="relative">
                            <button
                              onClick={() => setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {actionMenuOpen === user.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                                <div className="py-1">
                                  <button
                                    onClick={() => handleViewUserAccess(user.id)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Eye className="h-4 w-4 mr-3" />
                                    Ver Acessos
                                  </button>
                                  <button
                                    onClick={() => handleEditUser(user)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Edit className="h-4 w-4 mr-3" />
                                    {t('admin.users.actions.edit')}
                                  </button>
                                  <div className="border-t border-gray-100"></div>
                                  <button
                                    onClick={() => handleUserAction(user.id, user.enabled ? 'disable' : 'enable')}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    {user.enabled ? (
                                      <>
                                        <PowerOff className="h-4 w-4 mr-3" />
                                        {t('admin.users.actions.disable')}
                                      </>
                                    ) : (
                                      <>
                                        <Power className="h-4 w-4 mr-3" />
                                        {t('admin.users.actions.enable')}
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleResetPassword(user)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Key className="h-4 w-4 mr-3" />
                                    Resetar Senha
                                  </button>
                                  <hr className="my-1" />
                                  <button
                                    onClick={() => handleUserAction(user.id, 'delete')}
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 mr-3" />
                                    {t('admin.users.actions.delete')}
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
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <p className="text-sm text-gray-700">
                    Mostrando {pagination.first + 1} - {Math.min(pagination.first + pagination.max, total)} de {total} usuários
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={prevPage}
                    disabled={pagination.first === 0}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={nextPage}
                    disabled={pagination.first + pagination.max >= total}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé */}
      <Footer selectedLanguage={selectedLanguage} />
      
      {/* Menu lateral */}
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </div>
  );
};

export default UsersList;