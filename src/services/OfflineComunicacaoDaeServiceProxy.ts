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
   * Estratégia: "stale-while-revalidate" (cache primeiro, atualiza em background)
   * @param serviceFn Função original do serviço para buscar opções
   * @param cacheKey Chave para armazenar no cache
   */
  async getOptionsWithOfflineSupport<T>(
    serviceFn: () => Promise<T[]>,
    cacheKey: string
  ): Promise<T[]> {
    // ✅ ONLINE: Cache primeiro, API em background
    if (navigator.onLine) {
      try {
        // 1️⃣ BUSCAR DO CACHE PRIMEIRO (instantâneo)
        const cachedData = await indexedDBService.getOpcoes(cacheKey);
        
        if (cachedData && cachedData.length > 0) {
          console.log(`⚡ [${cacheKey}] ${cachedData.length} registros carregados do cache (instantâneo)`);
          
          // 2️⃣ ATUALIZAR DA API EM BACKGROUND (sem bloquear)
          serviceFn()
            .then(async (apiData) => {
              if (apiData && apiData.length > 0) {
                await indexedDBService.saveOpcoes(cacheKey, apiData);
                console.log(`🔄 [${cacheKey}] Cache atualizado com ${apiData.length} registros da API`);
              }
            })
            .catch((error) => {
              console.warn(`⚠️ [${cacheKey}] Falha ao atualizar em background:`, error);
            });
          
          // Retorna cache imediatamente
          return cachedData as T[];
        }
        
        // 3️⃣ SE NÃO TEM CACHE: buscar da API (primeira vez)
        console.log(`🌐 [${cacheKey}] Cache vazio, buscando da API...`);
        const apiData = await serviceFn();
        
        if (apiData && apiData.length > 0) {
          await indexedDBService.saveOpcoes(cacheKey, apiData);
          console.log(`✅ [${cacheKey}] ${apiData.length} registros carregados da API e salvos no cache`);
        } else {
          console.warn(`⚠️ [${cacheKey}] API retornou array vazio`);
        }
        
        return apiData;
      } catch (error) {
        console.warn(`⚠️ [${cacheKey}] Erro ao buscar dados:`, error);
        
        // ✅ FALLBACK: Tentar cache mesmo com erro
        try {
          const cachedData = await indexedDBService.getOpcoes(cacheKey);
          if (cachedData && cachedData.length > 0) {
            console.log(`✅ [${cacheKey}] ${cachedData.length} registros do cache (fallback após erro)`);
            return cachedData as T[];
          } else {
            console.warn(`⚠️ [${cacheKey}] Nenhum dado disponível`);
            toast.error(`Não há dados disponíveis para ${cacheKey}`);
            return [] as T[];
          }
        } catch (cacheError) {
          console.error(`❌ [${cacheKey}] Erro ao buscar do cache:`, cacheError);
          return [] as T[];
        }
      }
    } else {
      // ✅ OFFLINE: Buscar apenas do cache
      console.log(`📱 [${cacheKey}] Modo offline, buscando do cache...`);
      try {
        const cachedData = await indexedDBService.getOpcoes(cacheKey);
        if (cachedData && cachedData.length > 0) {
          console.log(`✅ [${cacheKey}] ${cachedData.length} registros do cache (offline)`);
          return cachedData as T[];
        } else {
          console.warn(`⚠️ [${cacheKey}] Sem dados no cache e offline`);
          toast.warning(`Sem dados offline para ${cacheKey}. Conecte-se e baixe no gerenciador offline.`);
          return [] as T[];
        }
      } catch (cacheError) {
        console.error(`❌ [${cacheKey}] Erro ao buscar do cache:`, cacheError);
        return [] as T[];
      }
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
