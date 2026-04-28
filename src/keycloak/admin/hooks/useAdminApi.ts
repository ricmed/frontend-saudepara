// hooks/useAdminApi.ts
import { useState, useCallback, useMemo } from 'react';
import type { UseApiOptions, UseApiReturn } from '../types/admin.types';

const USE_INTERNAL_AUTH = (import.meta as any).env?.VITE_USE_INTERNAL_AUTH === 'true';
const API_BASE = USE_INTERNAL_AUTH ? '/api/auth/admin' : '/api-auth/admin';

interface ApiRequestOptions extends RequestInit {
  endpoint: string;
  params?: Record<string, any>;
}

export const useAdminApi = <T = any>(options?: UseApiOptions): UseApiReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Evita recriar callbacks a cada render quando `options` é um object literal.
  const onSuccess = options?.onSuccess;
  const onError = options?.onError;

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
        // Nem todo backend retorna JSON em erro (ou pode retornar body vazio).
        const errorText = await response.text().catch(() => '');
        let message = `HTTP Error: ${response.status}`;
        try {
          const parsed = errorText ? JSON.parse(errorText) : null;
          message = parsed?.error || parsed?.message || message;
        } catch {
          if (errorText) message = errorText;
        }
        throw new Error(message);
      }

      // Algumas rotas respondem 204 No Content (ex.: DELETE/POST idempotente).
      // `response.json()` quebraria com body vazio.
      if (response.status === 204) {
        const result = undefined as unknown as T;
        setData(result as any);
        if (onSuccess) onSuccess(result);
        return result;
      }

      const text = await response.text().catch(() => '');
      const result = (text
        ? (() => {
            try {
              return JSON.parse(text);
            } catch {
              return text;
            }
          })()
        : undefined) as T;

      setData(result as any);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      setError(error);
      
      if (onError) {
        onError(error);
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  // Mantém referência estável do objeto retornado, reduzindo re-renders/loops em hooks consumidores
  return useMemo(() => ({ data, loading, error, execute, reset }), [data, loading, error, execute, reset]);
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
  }, [api.execute]);

  const getUser = useCallback((id: string) => {
    return api.execute({
      endpoint: `/users/${id}`,
      method: 'GET',
    });
  }, [api.execute]);

  const createUser = useCallback((userData: any) => {
    return api.execute({
      endpoint: '/users',
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }, [api.execute]);

  const updateUser = useCallback((id: string, userData: any) => {
    return api.execute({
      endpoint: `/users/${id}`,
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }, [api.execute]);

  const deleteUser = useCallback((id: string) => {
    return api.execute({
      endpoint: `/users/${id}`,
      method: 'DELETE',
    });
  }, [api.execute]);

  const enableUser = useCallback((id: string, enabled: boolean) => {
    return api.execute({
      endpoint: `/users/${id}/enabled`,
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    });
  }, [api.execute]);

  const resetPassword = useCallback((id: string, password: string, temporary = false) => {
    return api.execute({
      endpoint: `/users/${id}/reset-password`,
      method: 'PUT',
      body: JSON.stringify({ password, temporary }),
    });
  }, [api.execute]);

  const sendVerifyEmail = useCallback((id: string) => {
    return api.execute({
      endpoint: `/users/${id}/send-verify-email`,
      method: 'PUT',
    });
  }, [api.execute]);

  const logoutUser = useCallback((id: string) => {
    return api.execute({
      endpoint: `/users/${id}/logout`,
      method: 'DELETE',
    });
  }, [api.execute]);

  const getUserCount = useCallback(() => {
    return api.execute({
      endpoint: '/users/count',
      method: 'GET',
    });
  }, [api.execute]);

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
  }, [api.execute]);

  const createRole = useCallback((roleData: any) => {
    return api.execute({
      endpoint: '/roles',
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  }, [api.execute]);

  const updateRole = useCallback((roleName: string, roleData: any) => {
    return api.execute({
      endpoint: `/roles/${roleName}`,
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
  }, [api.execute]);

  const deleteRole = useCallback((roleName: string) => {
    return api.execute({
      endpoint: `/roles/${roleName}`,
      method: 'DELETE',
    });
  }, [api.execute]);

  const getUserRoles = useCallback((userId: string) => {
    return api.execute({
      endpoint: `/users/${userId}/roles`,
      method: 'GET',
    });
  }, [api.execute]);

  const addUserRoles = useCallback((userId: string, roles: any[]) => {
    return api.execute({
      endpoint: `/users/${userId}/roles`,
      method: 'POST',
      body: JSON.stringify(roles),
    });
  }, [api.execute]);

  const removeUserRoles = useCallback((userId: string, roles: any[]) => {
    return api.execute({
      endpoint: `/users/${userId}/roles`,
      method: 'DELETE',
      body: JSON.stringify(roles),
    });
  }, [api.execute]);

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
  }, [api.execute]);

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
  }, [api.execute]);

  const bulkDisable = useCallback(async (userIds: string[]) => {
    const promises = userIds.map(id => 
      api.execute({
        endpoint: `/users/${id}/enabled`,
        method: 'PUT',
        body: JSON.stringify({ enabled: false }),
      })
    );
    return Promise.all(promises);
  }, [api.execute]);

  const bulkDelete = useCallback(async (userIds: string[]) => {
    const promises = userIds.map(id => 
      api.execute({
        endpoint: `/users/${id}`,
        method: 'DELETE',
      })
    );
    return Promise.all(promises);
  }, [api.execute]);

  const bulkLogout = useCallback(async (userIds: string[]) => {
    const promises = userIds.map(id => 
      api.execute({
        endpoint: `/users/${id}/logout`,
        method: 'DELETE',
      })
    );
    return Promise.all(promises);
  }, [api.execute]);

  const bulkSendVerifyEmail = useCallback(async (userIds: string[]) => {
    const promises = userIds.map(id => 
      api.execute({
        endpoint: `/users/${id}/send-verify-email`,
        method: 'PUT',
      })
    );
    return Promise.all(promises);
  }, [api.execute]);

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