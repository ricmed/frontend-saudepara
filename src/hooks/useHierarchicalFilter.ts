import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/keycloak/AuthProvider';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { usuarioGestaoService, UsuarioAcesso } from '@/services/UsuarioGestaoService';

export interface UserWithAccess {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  enabled: boolean;
  emailVerified: boolean;
  createdTimestamp: number;
  acessos?: UsuarioAcesso[];
}

export interface HierarchicalFilterResult {
  filteredUsers: UserWithAccess[];
  loading: boolean;
  error: string | null;
  totalUsers: number;
  shouldFilter: boolean;
  adminLevel: 'admin' | 'admin.unidade' | 'admin.municipio' | 'admin.estado' | null;
  refreshUsers: () => Promise<void>;
}

/**
 * Hook para filtrar usuários hierarquicamente baseado no nível de acesso do admin
 */
export const useHierarchicalFilter = (): HierarchicalFilterResult => {
  const { user } = useAuth();
  const userPermissions = useUserPermissions();
  const [allUsers, setAllUsers] = useState<UserWithAccess[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterLoading, setFilterLoading] = useState(false);

  // Determinar o nível de admin atual
  const adminLevel = useMemo(() => {
    if (!user?.roles) return null;
    
    if (user.roles.includes('admin')) return 'admin';
    if (user.roles.includes('admin.unidade')) return 'admin.unidade';
    if (user.roles.includes('admin.municipio')) return 'admin.municipio';
    if (user.roles.includes('admin.estado')) return 'admin.estado';
    
    return null;
  }, [user?.roles]);

  const shouldFilter = adminLevel !== 'admin' && adminLevel !== null;

  // Carregar todos os usuários do Keycloak
  const loadAllUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Carregando todos os usuários do Keycloak...');
      
      const usersData = await usuarioGestaoService.getUsuarios();
      
      if (!Array.isArray(usersData)) {
        throw new Error('Dados inválidos recebidos da API de usuários');
      }
      
      // Converter formato do Keycloak para o formato esperado
      const convertedUsers: UserWithAccess[] = usersData.map((user, index) => ({
        id: user.id || `user-${index}`,
        username: user.username || `user-${index}`,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        enabled: user.enabled !== false,
        emailVerified: true,
        createdTimestamp: user.createdTimestamp || Date.now(),
        acessos: []
      }));

      console.log(`✅ ${convertedUsers.length} usuários carregados do Keycloak`);
      setAllUsers(convertedUsers);
      
    } catch (err: any) {
      console.error('💥 Erro ao carregar usuários:', err);
      setError(err.message || 'Erro ao carregar usuários');
      setAllUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Verificar se um usuário deve ser incluído baseado no nível do admin
  const shouldIncludeUser = (
    user: UserWithAccess, 
    adminLevel: string, 
    adminPermissions: any
  ): boolean => {
    if (!user.acessos || user.acessos.length === 0) {
      // Usuários sem acessos são incluídos apenas para admin master
      return false;
    }

    switch (adminLevel) {
      case 'admin.unidade':
        // Admin de unidade só vê usuários da mesma unidade
        return user.acessos.some(acesso => 
          acesso.nivel_acesso === 'unidade' && 
          acesso.estabelecimento_id === adminPermissions.estabelecimentoId
        );
        
      case 'admin.municipio':
        // Admin de município vê usuários do mesmo município
        return user.acessos.some(acesso => 
          acesso.nivel_acesso === 'municipio' && 
          acesso.tipo_municipio_id === adminPermissions.municipioId
        );
        
      case 'admin.estado':
        // Admin de estado vê usuários do mesmo estado
        return user.acessos.some(acesso => 
          acesso.nivel_acesso === 'estado' && 
          acesso.tipo_estado_id === adminPermissions.estadoId
        );
        
      default:
        return false;
    }
  };

  // Aplicar filtros quando usuários ou permissões mudarem
  const applyFilters = async () => {
    if (!adminLevel || adminLevel === 'admin') {
      // Admin master vê todos os usuários
      console.log('👑 Admin master - mostrando todos os usuários');
      setFilteredUsers(allUsers);
      return;
    }

    if (userPermissions.loading) {
      console.log('⏳ Aguardando carregamento das permissões...');
      return;
    }

    console.log(`🔍 Filtrando usuários para ${adminLevel}...`);
    setFilterLoading(true);
    
    try {
      const filtered: UserWithAccess[] = [];
      
      for (const user of allUsers) {
        try {
          // Buscar acessos do usuário
          const userAcessos = await usuarioGestaoService.getUsuarioAcessos(user.id);
          
          // Atualizar usuário com seus acessos
          const userWithAccess = { ...user, acessos: userAcessos };
          
          // Aplicar filtro baseado no nível do admin
          if (shouldIncludeUser(userWithAccess, adminLevel, userPermissions)) {
            filtered.push(userWithAccess);
          }
          
        } catch (error) {
          console.warn(`Erro ao buscar acessos para usuário ${user.username}:`, error);
          // Em caso de erro, não incluir usuário
        }
      }

      console.log(`📊 Filtro aplicado: ${filtered.length}/${allUsers.length} usuários`);
      setFilteredUsers(filtered);
      
    } catch (err: any) {
      console.error('Erro ao aplicar filtros:', err);
      setError(err.message || 'Erro ao filtrar usuários');
      setFilteredUsers([]);
    } finally {
      setFilterLoading(false);
    }
  };

  // Carregar usuários na inicialização
  useEffect(() => {
    loadAllUsers();
  }, []);

  // Aplicar filtros quando dados mudarem
  useEffect(() => {
    if (!loading && allUsers.length > 0) {
      applyFilters();
    }
  }, [allUsers, adminLevel, userPermissions.loading, userPermissions.estabelecimentoId]);

  // Para admin master, definir filteredUsers = allUsers
  useEffect(() => {
    if (!loading && !shouldFilter) {
      setFilteredUsers(allUsers);
    }
  }, [allUsers, loading, shouldFilter]);

  return {
    filteredUsers,
    loading: loading || filterLoading,
    error,
    totalUsers: allUsers.length,
    shouldFilter,
    adminLevel,
    refreshUsers: loadAllUsers
  };
};