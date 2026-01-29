import ComunicacaoDaeService from './ComunicacaoDaeService';
import DaeService from './DaeService';
import CrsService from './CrsService';
import NheService from './NheService';
import CievsService from './CievsService';
import indexedDBService from './indexedDB';
import syncService from './syncService';
import { toast } from 'react-toastify';

/**
 * Proxy que adiciona suporte offline ao serviço de Comunicação DAE
 * Segue o mesmo padrão do OfflineNotificacaoServiceProxy
 */
export const OfflineComunicacaoDaeServiceProxy = {
  /**
   * Método genérico para buscar opções com suporte offline
   * @param serviceFn Função original do serviço para buscar opções
   * @param cacheKey Chave para armazenar no cache
   */
  async getOptionsWithOfflineSupport<T>(
    serviceFn: () => Promise<T[]>,
    cacheKey: string
  ): Promise<T[]> {
    // Tentar buscar do cache primeiro
    try {
      const cachedData = await indexedDBService.getOpcoes(cacheKey);
      if (cachedData) {
        console.log(`✅ Usando dados em cache para ${cacheKey}`);
        return cachedData as T[];
      }
    } catch (e) {
      console.error(`❌ Erro ao buscar ${cacheKey} do cache:`, e);
    }

    // Se não tem cache e está online, busca da API
    if (syncService.isNetworkAvailable()) {
      try {
        const apiData = await serviceFn();
        
        // Salvar no cache para uso offline
        if (apiData && apiData.length > 0) {
          await indexedDBService.saveOpcoes(cacheKey, apiData);
          console.log(`💾 ${apiData.length} ${cacheKey} salvos no cache`);
        }
        
        return apiData;
      } catch (error) {
        console.error(`❌ Erro ao buscar ${cacheKey} da API:`, error);
        
        // Se falhou, tenta o cache novamente (pode ter dados mais antigos)
        const cachedData = await indexedDBService.getOpcoes(cacheKey);
        if (cachedData) {
          toast.warning(`⚠️ Usando dados em cache para ${cacheKey} devido a erro na API`);
          return cachedData as T[];
        }
        
        throw error;
      }
    } else {
      // Se está offline, busca apenas do cache
      const cachedData = await indexedDBService.getOpcoes(cacheKey);
      if (cachedData) {
        toast.info(`📦 Modo offline: usando dados em cache para ${cacheKey}`);
        return cachedData as T[];
      }
      
      // Se não tem cache e está offline, retorna array vazio
      console.warn(`⚠️ Não há dados em cache para ${cacheKey} e está offline`);
      return [] as T[];
    }
  },

  // DAE
  async getDaeOptions() {
    return this.getOptionsWithOfflineSupport(
      async () => {
        const response = await DaeService.getAll(1, 100);
        return response.data;
      },
      'daes'
    );
  },

  // CRS
  async getCrsOptions() {
    return this.getOptionsWithOfflineSupport(
      async () => {
        const response = await CrsService.getAll(1, 100);
        return response.data;
      },
      'crs'
    );
  },

  // NHE
  async getNheOptions() {
    return this.getOptionsWithOfflineSupport(
      async () => {
        const response = await NheService.getAll(1, 100);
        return response.data;
      },
      'nhes'
    );
  },

  // CIEVS
  async getCievsOptions() {
    return this.getOptionsWithOfflineSupport(
      async () => {
        const response = await CievsService.getAll(1, 100);
        return response.data;
      },
      'cievs'
    );
  }
};
