// hooks/useAdminApi.ts
import { useState, useCallback } from 'react';
import type { UseApiOptions, UseApiReturn } from '../types/admin.types';

const USE_INTERNAL_AUTH = (import.meta as any).env?.VITE_USE_INTERNAL_AUTH === 'true';
const API_BASE = USE_INTERNAL_AUTH ? '/api/auth/admin' : '/api-auth/admin';

interface ApiRequestOptions extends RequestInit {
  endpoint: string;
  params?: Record<string, any>;
}

export const useAdminApi = <T = any>(options: UseApiOptions = {}): UseApiReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (requestOptions?: ApiRequestOptions): Promise<T> => {
    if (!requestOptions?.endpoint) {
      throw new Error('Endpoint é obrigatório');
    }

    try {
      setLoading(true);
      setError(null);

      let url = `${API_BASE}${requestOptions.endpoint}`;
      
      // Adicionar parâmetros de query se fornecidos
      if (requestOptions.params) {
        const params = new URLSearchParams();
        Object.entries(requestOptions.params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }

      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...requestOptions.headers,
        },
        ...requestOptions,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP Error: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      setError(error);
      
      if (options.onError) {
        options.onError(error);
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [options]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
};

// Hooks específicos para diferentes endpoints
export const useUsers = () => {
  const api = useAdminApi();

  const listUsers = useCallback((filters?: Record<string, any>) => {
    return api.execute({
      endpoint: '/users',
      method: 'GET',
      params: filters,
    });
  }, [api]);

  const getUser = useCallback((id: string) => {
    return api.execute({
      endpoint: `/users/${id}`,
      method: 'GET',
    });
  }, [api]);

  const createUser = useCallback((userData: any) => {
    return api.execute({
      endpoint: '/users',
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }, [api]);

  const updateUser = useCallback((id: string, userData: any) => {
    return api.execute({
      endpoint: `/users/${id}`,
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }, [api]);

  const deleteUser = useCallback((id: string) => {
    return api.execute({
      endpoint: `/users/${id}`,
      method: 'DELETE',
    });
  }, [api]);

  const enableUser = useCallback((id: string, enabled: boolean) => {
    return api.execute({
      endpoint: `/users/${id}/enabled`,
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    });
  }, [api]);

  const resetPassword = useCallback((id: string, password: string, temporary = false) => {
    return api.execute({
      endpoint: `/users/${id}/reset-password`,
      method: 'PUT',
      body: JSON.stringify({ password, temporary }),
    });
  }, [api]);

  const sendVerifyEmail = useCallback((id: string) => {
    return api.execute({
      endpoint: `/users/${id}/send-verify-email`,
      method: 'PUT',
    });
  }, [api]);

  const logoutUser = useCallback((id: string) => {
    return api.execute({
      endpoint: `/users/${id}/logout`,
      method: 'DELETE',
    });
  }, [api]);

  const getUserCount = useCallback(() => {
    return api.execute({
      endpoint: '/users/count',
      method: 'GET',
    });
  }, [api]);

  return {
    ...api,
    listUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    enableUser,
    resetPassword,
    sendVerifyEmail,
    logoutUser,
    getUserCount,
  };
};

export const useRoles = () => {
  const api = useAdminApi();

  const listRoles = useCallback(() => {
    return api.execute({
      endpoint: '/roles',
      method: 'GET',
    });
  }, [api]);

  const createRole = useCallback((roleData: any) => {
    return api.execute({
      endpoint: '/roles',
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  }, [api]);

  const updateRole = useCallback((roleName: string, roleData: any) => {
    return api.execute({
      endpoint: `/roles/${roleName}`,
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
  }, [api]);

  const deleteRole = useCallback((roleName: string) => {
    return api.execute({
      endpoint: `/roles/${roleName}`,
      method: 'DELETE',
    });
  }, [api]);

  const getUserRoles = useCallback((userId: string) => {
    return api.execute({
      endpoint: `/users/${userId}/roles`,
      method: 'GET',
    });
  }, [api]);

  const addUserRoles = useCallback((userId: string, roles: any[]) => {
    return api.execute({
      endpoint: `/users/${userId}/roles`,
      method: 'POST',
      body: JSON.stringify(roles),
    });
  }, [api]);

  const removeUserRoles = useCallback((userId: string, roles: any[]) => {
    return api.execute({
      endpoint: `/users/${userId}/roles`,
      method: 'DELETE',
      body: JSON.stringify(roles),
    });
  }, [api]);

  return {
    ...api,
    listRoles,
    createRole,
    updateRole,
    deleteRole,
    getUserRoles,
    addUserRoles,
    removeUserRoles,
  };
};

export const useAdminStats = () => {
  const api = useAdminApi();

  const getStats = useCallback(() => {
    return api.execute({
      endpoint: '/stats',
      method: 'GET',
    });
  }, [api]);

  return {
    ...api,
    getStats,
  };
};

// Hook para operações em lote
export const useBulkOperations = () => {
  const api = useAdminApi();

  const bulkEnable = useCallback(async (userIds: string[]) => {
    const promises = userIds.map(id => 
      api.execute({
        endpoint: `/users/${id}/enabled`,
        method: 'PUT',
        body: JSON.stringify({ enabled: true }),
      })
    );
    return Promise.all(promises);
  }, [api]);

  const bulkDisable = useCallback(async (userIds: string[]) => {
    const promises = userIds.map(id => 
      api.execute({
        endpoint: `/users/${id}/enabled`,
        method: 'PUT',
        body: JSON.stringify({ enabled: false }),
      })
    );
    return Promise.all(promises);
  }, [api]);

  const bulkDelete = useCallback(async (userIds: string[]) => {
    const promises = userIds.map(id => 
      api.execute({
        endpoint: `/users/${id}`,
        method: 'DELETE',
      })
    );
    return Promise.all(promises);
  }, [api]);

  const bulkLogout = useCallback(async (userIds: string[]) => {
    const promises = userIds.map(id => 
      api.execute({
        endpoint: `/users/${id}/logout`,
        method: 'DELETE',
      })
    );
    return Promise.all(promises);
  }, [api]);

  const bulkSendVerifyEmail = useCallback(async (userIds: string[]) => {
    const promises = userIds.map(id => 
      api.execute({
        endpoint: `/users/${id}/send-verify-email`,
        method: 'PUT',
      })
    );
    return Promise.all(promises);
  }, [api]);

  return {
    ...api,
    bulkEnable,
    bulkDisable,
    bulkDelete,
    bulkLogout,
    bulkSendVerifyEmail,
  };
};

// Utilitário para tratamento de erros
export const handleApiError = (error: any): string => {
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'Erro desconhecido. Tente novamente.';
};