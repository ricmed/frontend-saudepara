import { AxiosRequestConfig } from 'axios';
import useUserPermissions from '@/hooks/useUserPermissions';

export interface FilteredRequestConfig extends AxiosRequestConfig {
  params?: any;
}

/**
 * Hook para filtrar requisições baseado no nível de acesso do usuário
 */
export const useFilteredRequests = () => {
  const permissions = useUserPermissions();

  /**
   * Adiciona filtros de estabelecimento às requisições quando o usuário é de estabelecimento
   */
  const applyEstabelecimentoFilter = (config: FilteredRequestConfig): FilteredRequestConfig => {
    if (permissions.isEstabelecimento && permissions.estabelecimentoId) {
      return {
        ...config,
        params: {
          ...config.params,
          estabelecimento_id: permissions.estabelecimentoId,
        },
      };
    }
    return config;
  };

  /**
   * Adiciona filtros de município às requisições quando o usuário é de município
   */
  const applyMunicipioFilter = (config: FilteredRequestConfig): FilteredRequestConfig => {
    if (permissions.isMunicipio && permissions.municipioId) {
      return {
        ...config,
        params: {
          ...config.params,
          municipio_id: permissions.municipioId,
        },
      };
    }
    return config;
  };

  /**
   * Adiciona filtros de estado às requisições quando o usuário é de estado
   */
  const applyEstadoFilter = (config: FilteredRequestConfig): FilteredRequestConfig => {
    if (permissions.isEstado && permissions.estadoId) {
      return {
        ...config,
        params: {
          ...config.params,
          estado_id: permissions.estadoId,
        },
      };
    }
    return config;
  };

  /**
   * Aplica todos os filtros de nível hierárquico
   */
  const applyHierarchicalFilters = (config: FilteredRequestConfig): FilteredRequestConfig => {
    let filteredConfig = config;
    
    // Aplicar filtros em ordem hierárquica (mais específico primeiro)
    if (permissions.isEstabelecimento) {
      filteredConfig = applyEstabelecimentoFilter(filteredConfig);
    } else if (permissions.isMunicipio) {
      filteredConfig = applyMunicipioFilter(filteredConfig);
    } else if (permissions.isEstado) {
      filteredConfig = applyEstadoFilter(filteredConfig);
    }
    
    return filteredConfig;
  };

  return {
    permissions,
    applyEstabelecimentoFilter,
    applyMunicipioFilter,
    applyEstadoFilter,
    applyHierarchicalFilters,
  };
};

export default useFilteredRequests;
