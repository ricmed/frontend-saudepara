import { useState, useEffect } from 'react';
import axios from 'axios';

// Configuração da API para admin
const adminApi = axios.create({
  baseURL: '/admin-scoped', // Usar proxy do Vite
  withCredentials: true, // Para enviar cookies automaticamente
});

export interface AccessScope {
  tipo: 'estado' | 'municipio' | 'unidade';
  tipo_estado_id?: number | null;
  tipo_municipio_id?: number | null;
  estabelecimento_id?: number | null;
}

export interface UserAccessInfo {
  user_id: string;
  isMaster: boolean;
  scope: AccessScope | null;
}

export interface UseAccessScopeReturn {
  userInfo: UserAccessInfo | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para obter informações de escopo de acesso do usuário atual
 * 
 * Faz uma requisição para GET /admin-scoped/me e retorna:
 * - isMaster: se o usuário é master (acesso total)
 * - scope: objeto com tipo e IDs do escopo (estado/município/estabelecimento)
 * 
 * @returns {UseAccessScopeReturn} Dados do usuário, loading e error states
 */
export function useAccessScope(): UseAccessScopeReturn {
  const [userInfo, setUserInfo] = useState<UserAccessInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Buscando informações de escopo do usuário...');
      
      const response = await adminApi.get('/me');
      
      if (response.data.success) {
        const userData = response.data.data;
        
        console.log('✅ Informações de escopo obtidas:', userData);
        
        setUserInfo({
          user_id: userData.user_id,
          isMaster: userData.isMaster,
          scope: userData.scope
        });
      } else {
        throw new Error('Resposta da API inválida');
      }
    } catch (err: any) {
      console.error('❌ Erro ao buscar informações de escopo:', err);
      setError(err.response?.data?.error || err.message || 'Erro ao buscar informações do usuário');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  return {
    userInfo,
    isLoading,
    error,
    refetch: fetchUserInfo
  };
}

/**
 * Hook simplificado que retorna apenas se o usuário é master
 */
export function useIsMaster(): { isMaster: boolean; isLoading: boolean } {
  const { userInfo, isLoading } = useAccessScope();
  
  return {
    isMaster: userInfo?.isMaster ?? false,
    isLoading
  };
}

/**
 * Hook que retorna apenas o escopo do usuário
 */
export function useUserScope(): { scope: AccessScope | null; isLoading: boolean } {
  const { userInfo, isLoading } = useAccessScope();
  
  return {
    scope: userInfo?.scope ?? null,
    isLoading
  };
}
