import { useState, useEffect, useCallback } from 'react';
import { 
  notificacoesHierarquicasService, 
  NotificacoesEstabelecimentoResponse,
  NotificacoesMunicipioResponse,
  NotificacoesEstadoResponse,
  NotificacoesParams,
  NotificacaoHierarquica,
  default as NotificacoesHierarquicasService
} from '../services/notificacoesHierarquicasService';

// Hook genérico para estado de loading e error
interface UseNotificacoesState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook para buscar notificações por estabelecimento
 */
export function useNotificacoesByEstabelecimento(
  estabelecimentoId: number | null, 
  params: NotificacoesParams = {}
): UseNotificacoesState<NotificacoesEstabelecimentoResponse> {
  const [data, setData] = useState<NotificacoesEstabelecimentoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!estabelecimentoId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await notificacoesHierarquicasService.getNotificacoesByEstabelecimento(
        estabelecimentoId, 
        params
      );
      setData(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao buscar notificações do estabelecimento:', err);
    } finally {
      setLoading(false);
    }
  }, [estabelecimentoId, JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

/**
 * Hook para buscar notificações por município
 */
export function useNotificacoesByMunicipio(
  municipioId: number | null, 
  params: NotificacoesParams = {}
): UseNotificacoesState<NotificacoesMunicipioResponse> {
  const [data, setData] = useState<NotificacoesMunicipioResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!municipioId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await notificacoesHierarquicasService.getNotificacoesByMunicipio(
        municipioId, 
        params
      );
      setData(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao buscar notificações do município:', err);
    } finally {
      setLoading(false);
    }
  }, [municipioId, JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

/**
 * Hook para buscar notificações por estado
 */
export function useNotificacoesByEstado(
  estadoId: number | null, 
  params: NotificacoesParams = {}
): UseNotificacoesState<NotificacoesEstadoResponse> {
  const [data, setData] = useState<NotificacoesEstadoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!estadoId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await notificacoesHierarquicasService.getNotificacoesByEstado(
        estadoId, 
        params
      );
      setData(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao buscar notificações do estado:', err);
    } finally {
      setLoading(false);
    }
  }, [estadoId, JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

/**
 * Hook para buscar notificações com paginação dinâmica
 */
export function useNotificacoesPaginated(
  type: 'estabelecimento' | 'municipio' | 'estado',
  id: number | null,
  initialPage: number = 1,
  initialLimit: number = 10
) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [allData, setAllData] = useState<NotificacaoHierarquica[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // Usar o hook apropriado baseado no tipo
  const estabelecimentoResult = useNotificacoesByEstabelecimento(
    type === 'estabelecimento' ? id : null,
    { page, limit }
  );
  
  const municipioResult = useNotificacoesByMunicipio(
    type === 'municipio' ? id : null,
    { page, limit }
  );
  
  const estadoResult = useNotificacoesByEstado(
    type === 'estado' ? id : null,
    { page, limit }
  );

  // Selecionar o resultado baseado no tipo
  const currentResult = 
    type === 'estabelecimento' ? estabelecimentoResult :
    type === 'municipio' ? municipioResult :
    estadoResult;

  useEffect(() => {
    if (currentResult.data?.data) {
      if (page === 1) {
        // Primeira página - substituir dados
        setAllData(currentResult.data.data);
      } else {
        // Páginas subsequentes - concatenar dados
        setAllData(prev => [...prev, ...currentResult.data!.data]);
      }

      // Verificar se há mais páginas
      const { currentPage, pages } = currentResult.data.pagination;
      setHasMore(currentPage < pages);
    }
  }, [currentResult.data, page]);

  const loadMore = useCallback(() => {
    if (!currentResult.loading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [currentResult.loading, hasMore]);

  const reset = useCallback(() => {
    setPage(1);
    setAllData([]);
    setHasMore(true);
  }, []);

  const changeLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    setAllData([]);
    setHasMore(true);
  }, []);

  return {
    data: allData,
    pagination: currentResult.data?.pagination,
    contextInfo: currentResult.data && 'estabelecimento' in currentResult.data 
      ? currentResult.data.estabelecimento
      : currentResult.data && 'municipio' in currentResult.data
      ? currentResult.data.municipio  
      : currentResult.data && 'estado' in currentResult.data
      ? currentResult.data.estado
      : null,
    loading: currentResult.loading,
    error: currentResult.error,
    hasMore,
    loadMore,
    reset,
    changeLimit,
    refetch: currentResult.refetch
  };
}

/**
 * Hook para estatísticas rápidas de notificações
 */
export function useNotificacoesStats(notifications: NotificacaoHierarquica[] | null) {
  const [stats, setStats] = useState<ReturnType<typeof NotificacoesHierarquicasService.getNotificationsSummary> | null>(null);

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const calculatedStats = NotificacoesHierarquicasService.getNotificationsSummary(notifications);
      setStats(calculatedStats);
    } else {
      setStats(null);
    }
  }, [notifications]);

  return stats;
}

/**
 * Hook combinado para buscar dados baseado no nível de acesso do usuário
 */
export function useNotificacoesByUserAccess(userPermissions: {
  nivel: 'unidade' | 'municipio' | 'estado';
  estabelecimentoId?: number;
  municipioId?: number;
  estadoId?: number;
} | null, params: NotificacoesParams = {}) {
  
  const estabelecimentoResult = useNotificacoesByEstabelecimento(
    userPermissions?.nivel === 'unidade' ? userPermissions.estabelecimentoId || null : null,
    params
  );
  
  const municipioResult = useNotificacoesByMunicipio(
    userPermissions?.nivel === 'municipio' ? userPermissions.municipioId || null : null,
    params
  );
  
  const estadoResult = useNotificacoesByEstado(
    userPermissions?.nivel === 'estado' ? userPermissions.estadoId || null : null,
    params
  );

  // Retornar o resultado baseado no nível de acesso
  if (userPermissions?.nivel === 'unidade') {
    return {
      ...estabelecimentoResult,
      nivel: 'unidade' as const
    };
  } else if (userPermissions?.nivel === 'municipio') {
    return {
      ...municipioResult,
      nivel: 'municipio' as const
    };
  } else if (userPermissions?.nivel === 'estado') {
    return {
      ...estadoResult,
      nivel: 'estado' as const
    };
  }

  return {
    data: null,
    loading: false,
    error: 'Nível de acesso não definido',
    refetch: () => {},
    nivel: null
  };
}

export default {
  useNotificacoesByEstabelecimento,
  useNotificacoesByMunicipio,
  useNotificacoesByEstado,
  useNotificacoesPaginated,
  useNotificacoesStats,
  useNotificacoesByUserAccess
};
