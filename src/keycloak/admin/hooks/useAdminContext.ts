import { useAuth } from '@/keycloak/AuthProvider';

export type AdminLevel = 'master' | 'unidade' | 'municipio' | 'estado' | null;

export interface AdminContext {
  level: AdminLevel;
  unidadeId?: string;
  unidadeNome?: string;
  municipioId?: string;
  municipioNome?: string;
  estadoId?: string;
  estadoNome?: string;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canViewReports: boolean;
}

/**
 * Hook para detectar o nível administrativo do usuário logado
 * e fornecer contexto hierárquico apropriado
 */
export const useAdminContext = (): AdminContext => {
  const { user } = useAuth();

  // Função para detectar o nível administrativo baseado nas roles
  const detectAdminLevel = (): AdminLevel => {
    if (!user?.roles || !Array.isArray(user.roles)) {
      return null;
    }

    const roles = user.roles;

    // Verificar roles em ordem hierárquica (mais específica primeiro)
    if (roles.includes('admin.unidade')) {
      return 'unidade';
    }
    
    if (roles.includes('admin.municipio')) {
      return 'municipio';
    }
    
    if (roles.includes('admin.estado')) {
      return 'estado';
    }
    
    if (roles.includes('admin')) {
      return 'master';
    }

    return null;
  };

  const adminLevel = detectAdminLevel();

  // Extrair informações do contexto organizacional do usuário
  const getOrganizationalContext = () => {
    const context = {
      unidadeId: user?.unidadeId || user?.estabelecimentoId || undefined,
      unidadeNome: user?.unidadeNome || user?.estabelecimentoNome || undefined,
      municipioId: user?.municipioId || undefined,
      municipioNome: user?.municipioNome || undefined,
      estadoId: user?.estadoId || undefined,
      estadoNome: user?.estadoNome || undefined,
    };

    // Fallbacks baseados no nível administrativo
    switch (adminLevel) {
      case 'unidade':
        return {
          ...context,
          unidadeId: context.unidadeId || 'UNIDADE_001',
          unidadeNome: context.unidadeNome || 'Unidade do Administrador'
        };
      
      case 'municipio':
        return {
          ...context,
          municipioId: context.municipioId || 'MUNICIPIO_001',
          municipioNome: context.municipioNome || 'Município do Administrador'
        };
      
      case 'estado':
        return {
          ...context,
          estadoId: context.estadoId || 'ESTADO_001',
          estadoNome: context.estadoNome || 'Estado do Administrador'
        };
      
      default:
        return context;
    }
  };

  // Definir permissões baseadas no nível administrativo
  const getPermissions = () => {
    switch (adminLevel) {
      case 'master':
        return {
          canManageUsers: true,
          canManageRoles: true,
          canViewReports: true
        };
      
      case 'estado':
      case 'municipio':
      case 'unidade':
        return {
          canManageUsers: true,   // Pode gerenciar usuários do seu escopo
          canManageRoles: false,  // Não pode gerenciar roles
          canViewReports: false   // Não pode acessar relatórios
        };
      
      default:
        return {
          canManageUsers: false,
          canManageRoles: false,
          canViewReports: false
        };
    }
  };

  const organizationalContext = getOrganizationalContext();
  const permissions = getPermissions();

  return {
    level: adminLevel,
    ...organizationalContext,
    ...permissions
  };
};

/**
 * Hook para verificar se o usuário tem uma role administrativa específica
 */
export const useHasAdminRole = (requiredRole: string): boolean => {
  const { user } = useAuth();
  
  if (!user?.roles || !Array.isArray(user.roles)) {
    return false;
  }

  return user.roles.includes(requiredRole);
};

/**
 * Hook para verificar se o usuário pode acessar uma funcionalidade específica
 */
export const useCanAccess = (feature: 'users' | 'roles' | 'reports'): boolean => {
  const adminContext = useAdminContext();

  switch (feature) {
    case 'users':
      return adminContext.canManageUsers;
    case 'roles':
      return adminContext.canManageRoles;
    case 'reports':
      return adminContext.canViewReports;
    default:
      return false;
  }
};

/**
 * Utilitário para gerar URLs baseadas no contexto administrativo
 */
export const useAdminUrls = () => {
  const { level } = useAdminContext();

  const getBaseUrl = (): string => {
    switch (level) {
      case 'unidade':
        return '/admin/unidade';
      case 'municipio':
        return '/admin/municipio';
      case 'estado':
        return '/admin/estado';
      case 'master':
        return '/admin/master';
      default:
        return '/admin/master'; // Fallback para admin master
    }
  };

  const getDashboardUrl = (): string => {
    return getBaseUrl();
  };

  const getUsersUrl = (): string => {
    return `${getBaseUrl()}/users`;
  };

  const getNewUserUrl = (): string => {
    return `${getBaseUrl()}/users/new`;
  };

  const getEditUserUrl = (userId: string): string => {
    return `${getBaseUrl()}/users/${userId}/edit`;
  };

  const getResetPasswordUrl = (userId: string): string => {
    return `${getBaseUrl()}/users/${userId}/reset-password`;
  };

  return {
    baseUrl: getBaseUrl(),
    dashboard: getDashboardUrl(),
    users: getUsersUrl(),
    newUser: getNewUserUrl(),
    editUser: getEditUserUrl,
    resetPassword: getResetPasswordUrl
  };
};