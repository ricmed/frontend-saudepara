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
  Trash2,
  Shield
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
  roles?: string[]; // Roles do Keycloak
  userLevel?: 'admin.municipio' | 'admin.unidade' | 'user' | 'admin.estado' | 'notificador';
  canBeDeleted?: boolean; // Se o usuário atual pode excluir este usuário
}

interface UserFilters {
  search: string;
  enabled?: boolean;
}

// Determinar o nível de um usuário baseado em suas ROLES do Keycloak (não níveis de acesso)
const getUserLevelFromRoles = (roles: string[]): 'admin.municipio' | 'admin.unidade' | 'notificador' | 'user' | 'admin.estado' => {
  console.log(`🎭 Analisando roles (${roles.length}):`, roles);
  
  // PRIORIDADE HIERÁRQUICA: Admin roles sempre têm prioridade sobre outras roles
  // Ordem: admin > admin.estado > admin.municipio > admin.unidade > notificador > user
  
  // 1. Admin master (maior prioridade)
  if (roles.includes('admin')) {
    console.log(`🏆 Admin master detectado (prioridade máxima) - ignora outras roles: ${roles.filter(r => r !== 'admin').join(', ')}`);
    return 'admin.estado'; // Admin master = admin.estado para fins de UI
  }
  
  // 2. Admin estado
  if (roles.includes('admin.estado')) {
    console.log(`🏅 Admin estado detectado (prioridade alta) - ignora outras roles: ${roles.filter(r => r !== 'admin.estado').join(', ')}`);
    return 'admin.estado';
  }
  
  // 3. Admin município
  if (roles.includes('admin.municipio')) {
    console.log(`🥇 Admin município detectado (prioridade média-alta) - ignora outras roles: ${roles.filter(r => r !== 'admin.municipio').join(', ')}`);
    return 'admin.municipio';
  }
  
  // 4. Admin unidade
  if (roles.includes('admin.unidade')) {
    console.log(`🥈 Admin unidade detectado (prioridade média) - ignora outras roles: ${roles.filter(r => r !== 'admin.unidade').join(', ')}`);
    return 'admin.unidade';
  }
  
  // 5. Notificador (prioridade baixa)
  if (roles.includes('notificador')) {
    console.log(`🥉 Notificador detectado (prioridade baixa)`);
    return 'notificador';
  }
  
  // 6. Usuário comum (menor prioridade)
  console.log(`� Usuário comum (roles não reconhecidas: ${roles.join(', ')})`);
  return 'user';
};

// Determinar o nível de um usuário baseado em seus acessos (FUNÇÃO LEGACY - manter por compatibilidade)
const getUserLevel = (user: UserWithAccess): 'admin.municipio' | 'admin.unidade' | 'user' | 'admin.estado' | 'notificador' => {
  // Se tem roles do Keycloak, usar essa informação (mais confiável)
  if (user.roles && user.roles.length > 0) {
    return getUserLevelFromRoles(user.roles);
  }
  
  // Fallback para análise baseada em acessos (caso não tenha roles carregadas)
  if (!user.acessos || user.acessos.length === 0) return 'user';
  
  // Verificar se tem acesso de estado
  if (user.acessos.some(acesso => acesso.nivel_acesso === 'estado')) {
    return 'admin.estado';
  }
  
  // Verificar se tem acesso de município
  if (user.acessos.some(acesso => acesso.nivel_acesso === 'municipio')) {
    return 'admin.municipio';
  }
  
  // Para usuários com acesso de unidade, ser mais conservador
  if (user.acessos.some(acesso => acesso.nivel_acesso === 'unidade')) {
    const unidadeAcessos = user.acessos.filter(acesso => acesso.nivel_acesso === 'unidade');
    
    // CRITÉRIO 1: Múltiplas unidades = definitivamente admin.unidade
    if (unidadeAcessos.length > 1) {
      return 'admin.unidade';
    }
    
    // CRITÉRIO 2: Para usuários com apenas 1 unidade, verificar permissões muito altas
    // Valores comuns: 1=leitura, 2=escrita, 3=admin básico, 6=notificador, 7=admin completo, 15=super admin
    // Sendo mais seletivo: só considera admin.unidade se permissões >= 10
    const hasAdminPermissions = unidadeAcessos.some(acesso => acesso.permissoes >= 10);
    
    if (hasAdminPermissions) {
      return 'admin.unidade';
    }
    
    // CRITÉRIO 3: Se tem outros acessos além de unidade, pode ser admin
    const hasOtherAccess = user.acessos.some(acesso => acesso.nivel_acesso !== 'unidade');
    
    if (hasOtherAccess) {
      return 'admin.unidade';
    }
    
    // Se chegou até aqui: 1 unidade + permissões baixas + sem outros acessos = notificador
    return 'notificador';
  }
  
  return 'user';
};

// Determinar se um usuário pode ser excluído pelo admin atual
const canUserBeDeleted = (targetUser: UserWithAccess, currentAdminLevel: string): boolean => {
  const targetUserLevel = getUserLevel(targetUser);
  
  switch (currentAdminLevel) {
    case 'admin':
      // Admin master pode excluir qualquer um
      return true;
      
    case 'admin.estado':
      // Admin estado pode excluir admin.municipio, admin.unidade, notificadores e users
      return ['admin.municipio', 'admin.unidade', 'notificador', 'user'].includes(targetUserLevel);
      
    case 'admin.municipio':
      // Admin município pode excluir APENAS admin.unidade, notificadores e users, NÃO outros admin.municipio
      return ['admin.unidade', 'notificador', 'user'].includes(targetUserLevel);
      
    case 'admin.unidade':
      // Admin unidade pode excluir apenas notificadores e users
      return ['notificador', 'user'].includes(targetUserLevel);
      
    default:
      return false;
  }
};

// Verificar se um usuário é notificador de unidade
const isNotificadorUnidade = (user: UserWithAccess): boolean => {
  const userLevel = getUserLevel(user);
  
  // Usuário é notificador se tem role específica de notificador
  return userLevel === 'notificador';
};

const UserListMunicipio: React.FC = () => {
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
    // Aguardar que userPermissions seja carregado antes de carregar usuários
    if (userPermissions.municipioId !== undefined) {
      loadUsers();
    }
  }, [pagination.first, pagination.max, userPermissions.municipioId]);

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
      console.log('🔄 Carregando usuários do município...');
      
      // Verificar se o usuário atual é admin.municipio ou admin master
      const isAdminMunicipio = user?.roles?.includes('admin.municipio');
      const isAdminMaster = user?.roles?.includes('admin');
      
      console.log('👤 Admin atual - Roles:', user?.roles);
      console.log('🏘️ É admin.municipio?', isAdminMunicipio);
      console.log('👑 É admin master?', isAdminMaster);
      
      if (!isAdminMunicipio && !isAdminMaster) {
        console.error('❌ Usuário não tem permissão para acessar lista de usuários do município');
        alert('Você não tem permissão para acessar esta funcionalidade.');
        setUsers([]);
        return;
      }

      // Para admin.municipio, garantir que as permissões estejam carregadas
      if (isAdminMunicipio && userPermissions.municipioId === undefined) {
        console.log('⏳ Aguardando carregamento das permissões do usuário...');
        setLoading(false);
        return;
      }
      
      console.log('🔑 Permissões do admin carregadas:', userPermissions);
      
      // 1. Buscar lista agregada paginada (server-side)
      const page = await usuarioGestaoService.getUsuariosList({
        first: pagination.first,
        max: pagination.max,
        search: filters.search || undefined,
        scope: isAdminMunicipio ? 'municipio' : undefined,
        scopeId: isAdminMunicipio ? userPermissions.municipioId : undefined,
      });
      const usersData = page.items as any[];
      console.log('📝 Dados recebidos da API:', usersData);
      
      if (!Array.isArray(usersData)) {
        console.error('❌ Dados inválidos recebidos da API:', usersData);
        throw new Error('Dados inválidos recebidos da API de usuários');
      }

      // Para admin.municipio (não master): o backend já devolve filtrado com total correto
      if (isAdminMunicipio && !isAdminMaster) {
        setUsers(usersData as any);
        setPagination(prev => ({ ...prev, total: page.total || 0 }));
        return;
      }
      
      // 2. Para admin master, mostrar todos. Para admin.municipio, filtrar pelo município
      const usersWithAccess: UserWithAccess[] = [];
      
      for (const userData of usersData) {
        try {
          // Para admin master, incluir todos os usuários
          if (isAdminMaster) {
            // Buscar roles do usuário
            const userRoles = await usuarioGestaoService.getUserRoles(userData.id);
            
            const userWithBasicInfo = {
              id: userData.id || `user-${usersWithAccess.length}`,
              username: userData.username || `user-${usersWithAccess.length}`,
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              email: userData.email || '',
              enabled: userData.enabled !== false,
              emailVerified: true,
              createdTimestamp: userData.createdTimestamp || Date.now(),
              acessos: [],
              roles: userRoles
            };
            
            // Adicionar informações de nível e permissão
            const userLevel = getUserLevel(userWithBasicInfo);
            const canBeDeleted = canUserBeDeleted(userWithBasicInfo, 'admin');
            
            usersWithAccess.push({
              ...userWithBasicInfo,
              userLevel,
              canBeDeleted
            });
            continue;
          }
          
          // Para admin.municipio, buscar acessos e filtrar
          if (isAdminMunicipio) {
            const userAcessos = await usuarioGestaoService.getUsuarioAcessos(userData.id);
            
            // Verificar se o usuário tem acesso ao município do admin
            // Admin.municipio deve ver:
            // 1. Usuários com acesso de município no mesmo município (outros admin.municipio)
            // 2. TODOS os usuários com acesso de unidade (admin.unidade + usuários das unidades)
            const adminMunicipioId = userPermissions.municipioId;
            
            const hasMunicipioAccess = userAcessos.some(acesso => {
              // Incluir admin.municipio do mesmo município
              if (acesso.nivel_acesso === 'municipio' && 
                  acesso.tipo_municipio_id === adminMunicipioId) {
                return true;
              }
              
              // Incluir TODOS os usuários de unidade (simplificado - todas as unidades por enquanto)
              // TODO: Filtrar apenas unidades do município específico quando tivermos a relação estabelecimento->município
              if (acesso.nivel_acesso === 'unidade') {
                return true;
              }
              
              return false;
            });
            
            console.log(`🔍 Verificando usuário ${userData.username}:`, {
              userAcessos,
              adminMunicipioId,
              hasMunicipioAccess
            });
            
            if (hasMunicipioAccess) {
              // Buscar roles do usuário
              const userRoles = await usuarioGestaoService.getUserRoles(userData.id);
              
              const userWithAccess = {
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
              };
              
              // Adicionar informações de nível e permissão de exclusão
              const userLevel = getUserLevel(userWithAccess);
              const canBeDeleted = canUserBeDeleted(userWithAccess, 'admin.municipio');
              const isNotificador = isNotificadorUnidade(userWithAccess);
              
              console.log(`✅ Incluindo usuário ${userData.username}:`, {
                userLevel,
                isNotificador,
                canBeDeleted,
                roles: userRoles,
                totalAcessos: userAcessos.length,
                unidadeAcessos: userAcessos.filter(a => a.nivel_acesso === 'unidade').length,
                acessosDetalhados: userAcessos.map(a => ({
                  nivel: a.nivel_acesso,
                  permissoes: a.permissoes,
                  estabelecimento_id: a.estabelecimento_id,
                  municipio_id: a.tipo_municipio_id
                }))
              });
              
              usersWithAccess.push({
                ...userWithAccess,
                userLevel,
                canBeDeleted
              });
            }
          }
        } catch (error) {
          console.warn(`⚠️ Erro ao buscar acessos do usuário ${userData.username}:`, error);
          // Em caso de erro para admin master, incluir mesmo assim
          if (isAdminMaster) {
            // Tentar buscar roles mesmo se acessos falharam
            let userRoles: string[] = [];
            try {
              userRoles = await usuarioGestaoService.getUserRoles(userData.id);
            } catch (roleError) {
              console.warn(`⚠️ Erro ao buscar roles do usuário ${userData.username}:`, roleError);
            }
            
            const userWithBasicInfo = {
              id: userData.id || `user-${usersWithAccess.length}`,
              username: userData.username || `user-${usersWithAccess.length}`,
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              email: userData.email || '',
              enabled: userData.enabled !== false,
              emailVerified: true,
              createdTimestamp: userData.createdTimestamp || Date.now(),
              acessos: [],
              roles: userRoles
            };
            
            // Adicionar informações de nível e permissão
            const userLevel = getUserLevel(userWithBasicInfo);
            const canBeDeleted = canUserBeDeleted(userWithBasicInfo, 'admin');
            
            usersWithAccess.push({
              ...userWithBasicInfo,
              userLevel,
              canBeDeleted
            });
          }
        }
      }

      console.log(`✅ ${usersWithAccess.length} usuários processados para ${isAdminMaster ? 'admin master' : 'admin.municipio'}`);
      setUsers(usersWithAccess);
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
          navigate(`/admin/municipio/users/${userId}/reset-password`);
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
    navigate(`/admin/municipio/users/${userId}/edit`);
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
              onClick={() => navigate('/admin/municipio')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                Usuários do Município
              </h1>
              <p className="text-gray-600">
                Gerencie os usuários notificadores do seu município
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/municipio/users/new')}
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

          {/* Tabela de usuários - igual ao UserListUnidade */}
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
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                        <p className="mt-2">Carregando usuários...</p>
                      </td>
                    </tr>
                  ) : paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
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
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                user.userLevel === 'admin.municipio' ? 'bg-yellow-100' :
                                user.userLevel === 'admin.unidade' ? 'bg-purple-100' :
                                user.userLevel === 'admin.estado' ? 'bg-red-100' :
                                user.userLevel === 'notificador' ? 'bg-green-100' :
                                'bg-blue-100'
                              }`}>
                                {user.userLevel === 'admin.municipio' || user.userLevel === 'admin.unidade' || user.userLevel === 'admin.estado' ? (
                                  <Shield className={`h-5 w-5 ${
                                    user.userLevel === 'admin.municipio' ? 'text-yellow-600' :
                                    user.userLevel === 'admin.unidade' ? 'text-purple-600' :
                                    'text-red-600'
                                  }`} />
                                ) : (
                                  <Users className={`h-5 w-5 ${
                                    user.userLevel === 'notificador' ? 'text-green-600' : 'text-blue-600'
                                  }`} />
                                )}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 flex items-center">
                                {user.firstName && user.lastName 
                                  ? `${user.firstName} ${user.lastName}`
                                  : user.username
                                }
                                {user.userLevel === 'admin.municipio' && (
                                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Admin Município
                                  </span>
                                )}
                                {user.userLevel === 'admin.unidade' && (
                                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    Admin Unidade
                                  </span>
                                )}
                                {user.userLevel === 'admin.estado' && (
                                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Admin Estado
                                  </span>
                                )}
                                {user.userLevel === 'notificador' && (
                                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Notificador
                                  </span>
                                )}
                                {isNotificadorUnidade(user) && user.userLevel !== 'notificador' && (
                                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Notificador (legacy)
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                @{user.username}
                                {!user.canBeDeleted && (
                                  <span className="ml-2 text-xs text-red-500 font-medium">
                                    (não pode ser excluído)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email || 'N/A'}</div>
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
                                  {user.canBeDeleted ? (
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
                                  ) : (
                                    <div className="px-4 py-2 text-sm text-gray-400 italic">
                                      Não é possível excluir este usuário
                                    </div>
                                  )}
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

            {/* Paginação - igual ao UserListUnidade */}
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

export default UserListMunicipio;