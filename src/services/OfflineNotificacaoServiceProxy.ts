import { NotificacaoService } from './NotificacaoService';
import indexedDBService from './indexedDB';
import syncService from './syncService';
import { toast } from 'react-toastify';

/**
 * Proxy que adiciona suporte offline aos serviços existentes
 * Este padrão permite manter os serviços originais intactos
 */
export const OfflineServiceProxy = {
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
        console.log(`Usando dados em cache para ${cacheKey}`);
        return cachedData as T[];
      }
    } catch (e) {
      console.error(`Erro ao buscar ${cacheKey} do cache:`, e);
    }

    // Se não tem cache e está online, busca da API
    if (syncService.isNetworkAvailable()) {
      try {
        const apiData = await serviceFn();
        
        // Salvar no cache para uso offline
        if (apiData && apiData.length > 0) {
          await indexedDBService.saveOpcoes(cacheKey, apiData);
        }
        
        return apiData;
      } catch (error) {
        console.error(`Erro ao buscar ${cacheKey} da API:`, error);
        
        // Se falhou, tenta o cache novamente (pode ter dados mais antigos)
        const cachedData = await indexedDBService.getOpcoes(cacheKey);
        if (cachedData) {
          toast.warning(`Usando dados em cache para ${cacheKey} devido a erro na API`);
          return cachedData as T[];
        }
        
        throw error;
      }
    } else {
      // Se está offline, busca apenas do cache
      const cachedData = await indexedDBService.getOpcoes(cacheKey);
      if (cachedData) {
        toast.info(`Modo offline: usando dados em cache para ${cacheKey}`);
        return cachedData as T[];
      }
      
      // Se não tem cache e está offline, retorna array vazio
      console.warn(`Não há dados em cache para ${cacheKey} e está offline`);
      return [] as T[];
    }
  },

  // Eventos
  async getEventoOptions() {
    return this.getOptionsWithOfflineSupport(
      NotificacaoService.getEventoOptions.bind(NotificacaoService),
      'eventos'
    );
  },

  // Público
  async getPublicoOptions() {
    return this.getOptionsWithOfflineSupport(
      NotificacaoService.getPublicoOptions.bind(NotificacaoService),
      'publicos'
    );
  },

  // País
  async getPaisOptions() {
    return this.getOptionsWithOfflineSupport(
      NotificacaoService.getPaisOptions.bind(NotificacaoService),
      'paises'
    );
  },

  // Estado
  async getEstadoOptions() {
    return this.getOptionsWithOfflineSupport(
      NotificacaoService.getEstadoOptions.bind(NotificacaoService),
      'estados'
    );
  },

  // Município
  async getMunicipioOptions(estadoId?: number) {
    if (!estadoId) {
      return [];
    }

    const cacheKey = `municipios_${estadoId}`;
    
    return this.getOptionsWithOfflineSupport(
      () => NotificacaoService.getMunicipioOptions(estadoId),
      cacheKey
    );
  },

  // Bairro
  async getBairroOptions() {
    return this.getOptionsWithOfflineSupport(
      NotificacaoService.getBairroOptions.bind(NotificacaoService),
      'bairros'
    );
  },

  // Gênero
  async getGeneroOptions() {
    return this.getOptionsWithOfflineSupport(
      NotificacaoService.getGeneroOptions.bind(NotificacaoService),
      'generos'
    );
  },

  // Raça
  async getRacaOptions() {
    return this.getOptionsWithOfflineSupport(
      NotificacaoService.getRacaOptions.bind(NotificacaoService),
      'racas'
    );
  },

  // Escolaridade
  async getEscolaridadeOptions() {
    return this.getOptionsWithOfflineSupport(
      NotificacaoService.getEscolaridadeOptions.bind(NotificacaoService),
      'escolaridades'
    );
  },

  // Atendimento
  async getAtendimentoOptions() {
    return this.getOptionsWithOfflineSupport(
      NotificacaoService.getAtendimentoOptions.bind(NotificacaoService),
      'atendimentos'
    );
  },

  // Sintoma
  async getSintomaOptions() {
    return this.getOptionsWithOfflineSupport(
      NotificacaoService.getSintomaOptions.bind(NotificacaoService),
      'sintomas'
    );
  },

  // Hipótese Diagnóstica
  async getHipoteseDiagOptions() {
    return this.getOptionsWithOfflineSupport(
      NotificacaoService.getHipoteseDiagOptions.bind(NotificacaoService),
      'hipotesesDiag'
    );
  },

  // Trauma
  async getTraumaOptions() {
    return this.getOptionsWithOfflineSupport(
      NotificacaoService.getTraumaOptions.bind(NotificacaoService),
      'traumas'
    );
  },

  // Estabelecimento
  async getEstabelecimentoOptions() {
    return this.getOptionsWithOfflineSupport(
      NotificacaoService.getEstabelecimentoOptions.bind(NotificacaoService),
      'estabelecimentos'
    );
  },

  // Encerramento
  async getEncerramentoOptions() {
    return this.getOptionsWithOfflineSupport(
      NotificacaoService.getEncerramentoOptions.bind(NotificacaoService),
      'encerramentos'
    );
  }
};