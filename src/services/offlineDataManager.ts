import { NotificacaoService } from '@/services/NotificacaoService';
import indexedDBService from '@/services/indexedDB';
import { toast } from 'react-toastify';

export interface DataSource {
  key: string;
  name: string;
  fetchFn: () => Promise<any[]>;
  priority: number; // 1 = alta, 2 = média, 3 = baixa
  estimatedSize: number; // Tamanho estimado para cálculo de progresso
}

class OfflineDataManager {
  private dataSources: DataSource[] = [
    { key: 'eventos', name: 'Tipos de Evento', fetchFn: NotificacaoService.getEventoOptions, priority: 1, estimatedSize: 50 },
    { key: 'publicos', name: 'Tipos de Público', fetchFn: NotificacaoService.getPublicoOptions, priority: 1, estimatedSize: 10 },
    { key: 'generos', name: 'Gêneros', fetchFn: NotificacaoService.getGeneroOptions, priority: 1, estimatedSize: 15 },
    { key: 'racas', name: 'Raças', fetchFn: NotificacaoService.getRacaOptions, priority: 1, estimatedSize: 10 },
    { key: 'escolaridades', name: 'Escolaridades', fetchFn: NotificacaoService.getEscolaridadeOptions, priority: 1, estimatedSize: 12 },
    { key: 'atendimentos', name: 'Tipos de Atendimento', fetchFn: NotificacaoService.getAtendimentoOptions, priority: 1, estimatedSize: 8 },
    { key: 'encerramentos', name: 'Tipos de Encerramento', fetchFn: NotificacaoService.getEncerramentoOptions, priority: 1, estimatedSize: 10 },
    
    // Dados geográficos (prioridade média)
    { key: 'paises', name: 'Países', fetchFn: NotificacaoService.getPaisOptions, priority: 2, estimatedSize: 200 },
    { key: 'estados', name: 'Estados', fetchFn: NotificacaoService.getEstadoOptions, priority: 2, estimatedSize: 30 },
    
    // Dados grandes (prioridade baixa, baixar por último)
    { key: 'municipios', name: 'Municípios', fetchFn: NotificacaoService.getMunicipioOptions, priority: 3, estimatedSize: 5000 },
    { key: 'bairros', name: 'Bairros', fetchFn: NotificacaoService.getBairroOptions, priority: 3, estimatedSize: 2000 },
    { key: 'sintomas', name: 'Sintomas', fetchFn: NotificacaoService.getSintomaOptions, priority: 3, estimatedSize: 500 },
    { key: 'hipoteses', name: 'Hipóteses Diagnósticas', fetchFn: NotificacaoService.getHipoteseDiagOptions, priority: 3, estimatedSize: 300 },
    { key: 'traumas', name: 'Tipos de Trauma', fetchFn: NotificacaoService.getTraumaOptions, priority: 3, estimatedSize: 100 },
    { key: 'estabelecimentos', name: 'Estabelecimentos', fetchFn: NotificacaoService.getEstabelecimentoOptions, priority: 3, estimatedSize: 1000 },
  ];

  // Verificar quais dados estão em cache
  async checkCachedData(): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {};
    
    for (const source of this.dataSources) {
      try {
        const cachedData = await indexedDBService.getOpcoes(source.key);
        status[source.key] = !!(cachedData && cachedData.length > 0);
      } catch {
        status[source.key] = false;
      }
    }
    
    return status;
  }

  // Baixar dados com prioridade
  async downloadDataWithPriority(
    onProgress?: (progress: number, current: string, total: number) => void,
    priorityFilter?: number[]
  ): Promise<{ success: number; errors: number; totalRecords: number }> {
    
    // Filtrar e ordenar por prioridade
    const sourcesToDownload = this.dataSources
      .filter(source => !priorityFilter || priorityFilter.includes(source.priority))
      .sort((a, b) => a.priority - b.priority);
    
    let completed = 0;
    let totalRecords = 0;
    let errors = 0;
    const total = sourcesToDownload.length;

    for (const source of sourcesToDownload) {
      try {
        console.log(`📥 Baixando: ${source.name}...`);
        onProgress?.(completed / total * 100, source.name, total);
        
        const data = await source.fetchFn();
        await indexedDBService.saveOpcoes(source.key, data);
        
        totalRecords += data.length;
        console.log(`✅ ${source.name}: ${data.length} registros salvos`);
        
      } catch (error) {
        console.error(`❌ Erro ao baixar ${source.name}:`, error);
        errors++;
      }
      
      completed++;
      onProgress?.(completed / total * 100, source.name, total);
      
      // Pequena pausa para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return { success: completed - errors, errors, totalRecords };
  }

  // Baixar apenas dados essenciais (prioridade 1)
  async downloadEssentialData(onProgress?: (progress: number, current: string) => void) {
    toast.info('⚡ Baixando dados essenciais...');
    const result = await this.downloadDataWithPriority(onProgress, [1]);
    
    if (result.errors === 0) {
      toast.success(`✅ Dados essenciais baixados! ${result.totalRecords} registros.`);
    } else {
      toast.warning(`⚠️ ${result.success} de ${result.success + result.errors} conjuntos baixados.`);
    }
    
    return result;
  }

  // Baixar todos os dados
  async downloadAllData(onProgress?: (progress: number, current: string) => void) {
    toast.info('🔄 Baixando todos os dados offline...');
    const result = await this.downloadDataWithPriority(onProgress);
    
    if (result.errors === 0) {
      toast.success(`🎉 Todos os dados baixados! ${result.totalRecords} registros offline.`);
    } else {
      toast.warning(`⚠️ ${result.success} de ${result.success + result.errors} conjuntos baixados.`);
    }
    
    return result;
  }

  // Limpar dados offline
  async clearOfflineData(): Promise<void> {
    for (const source of this.dataSources) {
      try {
        await indexedDBService.saveOpcoes(source.key, []);
      } catch (error) {
        console.error(`Erro ao limpar ${source.key}:`, error);
      }
    }
  }

  // Verificar se está pronto para uso offline
  async isReadyForOffline(): Promise<{ ready: boolean; missing: string[] }> {
    const essentialKeys = this.dataSources
      .filter(s => s.priority === 1)
      .map(s => s.key);
    
    const status = await this.checkCachedData();
    const missing = essentialKeys.filter(key => !status[key]);
    
    return {
      ready: missing.length === 0,
      missing: missing.map(key => this.dataSources.find(s => s.key === key)?.name || key)
    };
  }

  // Obter estatísticas
  async getStats() {
    const status = await this.checkCachedData();
    const loaded = Object.values(status).filter(Boolean).length;
    const total = this.dataSources.length;
    
    let totalRecords = 0;
    for (const source of this.dataSources) {
      if (status[source.key]) {
        try {
          const data = await indexedDBService.getOpcoes(source.key);
          totalRecords += data?.length || 0;
        } catch {}
      }
    }
    
    return {
      loaded,
      total,
      percentage: Math.round((loaded / total) * 100),
      totalRecords,
      sources: this.dataSources.map(source => ({
        ...source,
        loaded: status[source.key] || false
      }))
    };
  }
}

// Exportar instância singleton
export const offlineDataManager = new OfflineDataManager();