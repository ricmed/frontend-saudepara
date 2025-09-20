import { useState, useEffect, useMemo, useCallback } from 'react';
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
  roles?: string[];
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
// Cache global para roles e acessos
const rolesCache = new Map<string, string[]>();
const acessosCache = new Map<string, UsuarioAcesso[]>();
const cacheTimestamp = new Map<string, number>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos - cache mais longo

// Circuit breaker para prevenir rate limiting
let circuitBreakerOpen = false;
let circuitBreakerTimeout: NodeJS.Timeout | null = null;
const CIRCUIT_BREAKER_DURATION = 2 * 60 * 1000; // 2 minutos

// Contador de requisições falhas consecutivas
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 3;

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

  // Função para verificar se cache é válido
  const isCacheValid = (userId: string): boolean => {
    const timestamp = cacheTimestamp.get(userId);
    return timestamp ? (Date.now() - timestamp) < CACHE_DURATION : false;
  };

  // Função para abrir circuit breaker em caso de muitas falhas
  const openCircuitBreaker = () => {
    console.warn('🚨 Circuit breaker ATIVADO - muitas falhas de rate limiting');
    circuitBreakerOpen = true;
    consecutiveFailures = 0;
    
    if (circuitBreakerTimeout) clearTimeout(circuitBreakerTimeout);
    circuitBreakerTimeout = setTimeout(() => {
      console.log('🔄 Circuit breaker DESATIVADO - tentando novamente');
      circuitBreakerOpen = false;
    }, CIRCUIT_BREAKER_DURATION);
  };

  // Função para verificar se pode fazer requisições
  const canMakeRequests = (): boolean => {
    if (circuitBreakerOpen) {
      console.log('⏸️ Circuit breaker ativo - pulando requisições');
      return false;
    }
    return true;
  };

  // Função para lidar com falhas de rate limiting
  const handleRateLimit = (error: any) => {
    if (error.message?.includes('rate') || error.message?.includes('muitas') || error.status === 429) {
      consecutiveFailures++;
      console.warn(`⚠️ Rate limit detectado (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES})`);
      
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        openCircuitBreaker();
      }
      return true;
    }
    return false;
  };

  // Função para reset de falhas quando sucesso
  const resetFailures = () => {
    consecutiveFailures = 0;
  };

  // Função para limpar cache
  const clearCache = () => {
    rolesCache.clear();
    acessosCache.clear();
    cacheTimestamp.clear();
    console.log('🧹 Cache limpo');
  };

  // Função para buscar roles com cache e circuit breaker
  const getUserRolesWithCache = async (userId: string): Promise<string[]> => {
    // Verificar cache primeiro
    if (isCacheValid(userId) && rolesCache.has(userId)) {
      return rolesCache.get(userId)!;
    }

    // Circuit breaker - retornar array vazio se ativo
    if (!canMakeRequests()) {
      console.log(`⏸️ Circuit breaker ativo - retornando roles vazios para ${userId}`);
      return [];
    }

    try {
      const roles = await usuarioGestaoService.getUserRoles(userId);
      rolesCache.set(userId, roles);
      cacheTimestamp.set(userId, Date.now());
      resetFailures(); // Reset em caso de sucesso
      return roles;
    } catch (error: any) {
      if (handleRateLimit(error)) {
        console.warn(`🚨 Rate limit - retornando roles vazios para ${userId}`);
        return []; // Fallback seguro
      }
      console.warn(`Erro ao buscar roles para usuário ${userId}:`, error);
      return [];
    }
  };

  // Função para buscar acessos com cache e circuit breaker
  const getUserAcessosWithCache = async (userId: string): Promise<UsuarioAcesso[]> => {
    // Verificar cache primeiro
    if (isCacheValid(userId) && acessosCache.has(userId)) {
      return acessosCache.get(userId)!;
    }

    // Circuit breaker - retornar array vazio se ativo
    if (!canMakeRequests()) {
      console.log(`⏸️ Circuit breaker ativo - retornando acessos vazios para ${userId}`);
      return [];
    }

    try {
      const acessos = await usuarioGestaoService.getUsuarioAcessos(userId);
      acessosCache.set(userId, acessos);
      cacheTimestamp.set(userId, Date.now());
      resetFailures(); // Reset em caso de sucesso
      return acessos;
    } catch (error: any) {
      if (handleRateLimit(error)) {
        console.warn(`🚨 Rate limit - retornando acessos vazios para ${userId}`);
        return []; // Fallback seguro
      }
      console.warn(`Erro ao buscar acessos para usuário ${userId}:`, error);
      return [];
    }
  };

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
        // Admin de município vê:
        // 1. Usuários com acesso no município
        // 2. Usuários com acesso nas unidades do município
        return user.acessos.some(acesso => 
          (acesso.nivel_acesso === 'municipio' && acesso.tipo_municipio_id === adminPermissions.municipioId) ||
          (acesso.nivel_acesso === 'unidade' && acesso.tipo_municipio_id === adminPermissions.municipioId)
        );
        
      case 'admin.estado':
        // Admin de estado vê:
        // 1. Usuários com acesso no estado
        // 2. Usuários com acesso nos municípios do estado  
        // 3. Usuários com acesso nas unidades dos municípios do estado
        return user.acessos.some(acesso => 
          (acesso.nivel_acesso === 'estado' && acesso.tipo_estado_id === adminPermissions.estadoId) ||
          (acesso.nivel_acesso === 'municipio' && acesso.tipo_estado_id === adminPermissions.estadoId) ||
          (acesso.nivel_acesso === 'unidade' && acesso.tipo_estado_id === adminPermissions.estadoId)
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
      
      // Batch processing adaptativo: mais conservador se circuit breaker foi ativado
      const BATCH_SIZE = circuitBreakerOpen ? 1 : 3; // Muito conservador se há problemas
      const BATCH_DELAY = circuitBreakerOpen ? 1000 : 200; // Delay maior se há problemas
      
      console.log(`📦 Processando em lotes de ${BATCH_SIZE} usuários com delay de ${BATCH_DELAY}ms`);
      
      for (let i = 0; i < allUsers.length; i += BATCH_SIZE) {
        const batch = allUsers.slice(i, i + BATCH_SIZE);
        
        // Se circuit breaker está ativo, pular processamento e usar dados básicos
        if (circuitBreakerOpen) {
          console.log(`⏸️ Circuit breaker ativo - usando dados básicos para usuários ${i}-${i + batch.length}`);
          // Incluir todos os usuários sem filtro específico quando há rate limiting
          filtered.push(...batch.map(user => ({ ...user, acessos: [], roles: [] })));
          continue;
        }
        
        // Processar lote atual
        const batchPromises = batch.map(async (user) => {
          try {
            // Usar cache para buscar acessos e roles
            const [userAcessos, userRoles] = await Promise.all([
              getUserAcessosWithCache(user.id),
              getUserRolesWithCache(user.id)
            ]);
            
            // Atualizar usuário com seus acessos e roles
            const userWithAccess = { ...user, acessos: userAcessos, roles: userRoles };
            
            // Aplicar filtro baseado no nível do admin
            if (shouldIncludeUser(userWithAccess, adminLevel, userPermissions)) {
              return userWithAccess;
            }
            
            return null;
          } catch (error: any) {
            if (handleRateLimit(error)) {
              // Em caso de rate limit, retornar usuário básico
              return { ...user, acessos: [], roles: [] };
            }
            console.warn(`Erro ao buscar dados para usuário ${user.username}:`, error);
            return null;
          }
        });
        
        // Aguardar conclusão do lote
        const batchResults = await Promise.all(batchPromises);
        
        // Adicionar resultados válidos
        batchResults.forEach(result => {
          if (result) filtered.push(result);
        });
        
        // Delay entre lotes para evitar rate limiting
        if (i + BATCH_SIZE < allUsers.length) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
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

  // Para admin master, buscar roles de todos os usuários com cache e batch processing
  useEffect(() => {
    if (!loading && !shouldFilter) {
      const loadRolesForAllUsers = async () => {
        try {
          setFilterLoading(true);
          
          // Se circuit breaker está ativo, pular busca de roles
          if (circuitBreakerOpen) {
            console.log('⏸️ Circuit breaker ativo - admin master usando dados básicos');
            setFilteredUsers(allUsers.map(user => ({ ...user, roles: [] })));
            return;
          }
          
          // Batch processing conservativo para admin master
          const BATCH_SIZE = circuitBreakerOpen ? 1 : 5; // Muito conservador se há problemas
          const BATCH_DELAY = circuitBreakerOpen ? 1000 : 100; // Delay maior se há problemas
          const usersWithRoles: UserWithAccess[] = [];
          
          for (let i = 0; i < allUsers.length; i += BATCH_SIZE) {
            const batch = allUsers.slice(i, i + BATCH_SIZE);
            
            const rolesPromises = batch.map(async (user) => {
              try {
                const userRoles = await getUserRolesWithCache(user.id);
                return { ...user, roles: userRoles };
              } catch (error: any) {
                if (handleRateLimit(error)) {
                  console.warn(`🚨 Rate limit - retornando usuário sem roles: ${user.username}`);
                  return { ...user, roles: [] };
                }
                console.warn(`Erro ao buscar roles para usuário ${user.username}:`, error);
                return { ...user, roles: [] };
              }
            });
            
            const batchResults = await Promise.all(rolesPromises);
            usersWithRoles.push(...batchResults);
            
            // Delay entre lotes
            if (i + BATCH_SIZE < allUsers.length) {
              await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
            }
          }
          
          console.log(`📊 Admin master: ${usersWithRoles.length} usuários com roles carregados`);
          setFilteredUsers(usersWithRoles);
          
        } catch (error) {
          console.error('Erro ao carregar roles para admin master:', error);
          setFilteredUsers(allUsers); // Fallback para usuários sem roles
        } finally {
          setFilterLoading(false);
        }
      };
      
      loadRolesForAllUsers();
    }
  }, [allUsers, loading, shouldFilter]);

  // Função refresh que limpa cache com debounce para evitar múltiplas chamadas
  const refreshUsers = useCallback(async () => {
    // Debounce simples - evitar chamadas múltiplas em 2 segundos
    if (loading || filterLoading) {
      console.log('⏳ Refresh já em andamento, ignorando nova chamada');
      return;
    }
    
    console.log('🔄 Refreshing users com cache clear...');
    clearCache();
    await loadAllUsers();
  }, [loading, filterLoading]);

  return {
    filteredUsers,
    loading: loading || filterLoading,
    error,
    totalUsers: allUsers.length,
    shouldFilter,
    adminLevel,
    refreshUsers
  };
};