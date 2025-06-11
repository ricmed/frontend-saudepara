import { PacienteService } from '@/services/PacienteService';
import { TiposAtendimentoService } from '@/services/AtendimentoService';
import { TiposEncerramentoService } from '@/services/EncerramentoService';
import { EscolaridadeService } from '@/services/EscolaridadeService';
import { TiposEventoService } from '@/services/EventoService';
import { TiposPublicoService } from '@/services/PublicoService';
import indexedDBService from '@/services/indexedDB';
import { toast } from 'react-toastify';

export interface DataSource {
  key: string;
  name: string;
  fetchFn: () => Promise<any[]>;
  priority: number; // 1 = alta, 2 = média, 3 = baixa
  estimatedSize: number;
  category: 'essential' | 'geographic' | 'medical' | 'administrative';
}

// Função helper para chamadas diretas à API
const createDirectApiFetch = (endpoint: string, limit?: number) => {
  return async () => {
    const server = import.meta.env.VITE_API_SERVER;
    const port = import.meta.env.VITE_API_PORT;
    const url = limit 
      ? `${server}:${port}/api/${endpoint}?limit=${limit}`
      : `${server}:${port}/api/${endpoint}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data?.data || data || [];
  };
};

class OfflineDataManager {
  private dataSources: DataSource[] = [
    // ===== DADOS ESSENCIAIS (Prioridade 1) =====
    { 
      key: 'generos', 
      name: 'Gêneros', 
      fetchFn: createDirectApiFetch('tipo-genero', 100), 
      priority: 1, 
      estimatedSize: 15,
      category: 'essential'
    },
    { 
      key: 'racas', 
      name: 'Raças', 
      fetchFn: createDirectApiFetch('tipo-raca', 100), 
      priority: 1, 
      estimatedSize: 10,
      category: 'essential'
    },
    { 
      key: 'escolaridades', 
      name: 'Escolaridades', 
      fetchFn: createDirectApiFetch('tipo-escolaridade', 100), 
      priority: 1, 
      estimatedSize: 12,
      category: 'essential'
    },
    { 
      key: 'eventos', 
      name: 'Tipos de Evento', 
      fetchFn: createDirectApiFetch('tipo-evento', 100), 
      priority: 1, 
      estimatedSize: 50,
      category: 'essential'
    },
    { 
      key: 'publicos', 
      name: 'Tipos de Público', 
      fetchFn: createDirectApiFetch('tipo-publico', 100), 
      priority: 1, 
      estimatedSize: 10,
      category: 'essential'
    },
    { 
      key: 'atendimentos', 
      name: 'Tipos de Atendimento', 
      fetchFn: createDirectApiFetch('tipo-atendimento', 100), 
      priority: 1, 
      estimatedSize: 8,
      category: 'essential'
    },
    { 
      key: 'encerramentos', 
      name: 'Tipos de Encerramento', 
      fetchFn: createDirectApiFetch('tipo-encerramento', 100), 
      priority: 1, 
      estimatedSize: 10,
      category: 'essential'
    },

    // ===== DADOS GEOGRÁFICOS (Prioridade 2) =====
    { 
      key: 'paises', 
      name: 'Países', 
      fetchFn: createDirectApiFetch('tipo-pais', 300), // Aumentado para 300
      priority: 2, 
      estimatedSize: 250,
      category: 'geographic'
    },
    { 
      key: 'estados', 
      name: 'Estados', 
      fetchFn: createDirectApiFetch('tipo-estado', 100), 
      priority: 2, 
      estimatedSize: 30,
      category: 'geographic'
    },
    { 
      key: 'municipios', 
      name: 'Municípios', 
      fetchFn: createDirectApiFetch('tipo-municipio', 10000), // Aumentado para 10000
      priority: 3, 
      estimatedSize: 5571,
      category: 'geographic'
    },
    { 
      key: 'bairros', 
      name: 'Bairros', 
      fetchFn: createDirectApiFetch('tipo-bairro', 1000), // Aumentado para 1000
      priority: 3, 
      estimatedSize: 100,
      category: 'geographic'
    },

    // ===== DADOS MÉDICOS (Prioridade 2) =====
    { 
      key: 'sintomas', 
      name: 'Sintomas', 
      fetchFn: createDirectApiFetch('tipo-sintoma', 500), // Aumentado para 500
      priority: 2, 
      estimatedSize: 100,
      category: 'medical'
    },
    { 
      key: 'hipoteses-diagnosticas', 
      name: 'Hipóteses Diagnósticas', 
      fetchFn: createDirectApiFetch('tipo-hipotese-diag', 200), // Aumentado para 200
      priority: 2, 
      estimatedSize: 50,
      category: 'medical'
    },
    { 
      key: 'traumas', 
      name: 'Tipos de Trauma', 
      fetchFn: createDirectApiFetch('tipo-trauma', 100), 
      priority: 2, 
      estimatedSize: 40,
      category: 'medical'
    },
    { 
      key: 'lista-sindromica', 
      name: 'Lista Sindrômica', 
      fetchFn: createDirectApiFetch('lista-sindromica/all'), 
      priority: 2, 
      estimatedSize: 50,
      category: 'medical'
    },

    // ===== DADOS ADMINISTRATIVOS (Prioridade 2-3) =====
    { 
      key: 'componentes', 
      name: 'Componentes', 
      fetchFn: createDirectApiFetch('componentes', 100), 
      priority: 2, 
      estimatedSize: 50,
      category: 'administrative'
    },
    { 
      key: 'estabelecimentos-tipos', 
      name: 'Tipos de Estabelecimento', 
      fetchFn: createDirectApiFetch('tipo-estabelecimento', 100), 
      priority: 2, 
      estimatedSize: 20,
      category: 'administrative'
    },
    { 
      key: 'habilitacoes', 
      name: 'Habilitações', 
      fetchFn: createDirectApiFetch('tipo-habilitacao', 100), 
      priority: 2, 
      estimatedSize: 100,
      category: 'administrative'
    },
    { 
      key: 'naturezas', 
      name: 'Naturezas', 
      fetchFn: createDirectApiFetch('tipo-natureza', 100), 
      priority: 2, 
      estimatedSize: 15,
      category: 'administrative'
    },
    { 
      key: 'qualificacoes', 
      name: 'Qualificações', 
      fetchFn: createDirectApiFetch('tipo-qualificacao', 100), 
      priority: 2, 
      estimatedSize: 200,
      category: 'administrative'
    },
    { 
      key: 'turnos', 
      name: 'Turnos', 
      fetchFn: createDirectApiFetch('tipo-turno', 100), 
      priority: 2, 
      estimatedSize: 10,
      category: 'administrative'
    },

    // ===== DADOS GRANDES (Prioridade 3) =====
    { 
      key: 'cbos', 
      name: 'CBOs/Profissões', 
      fetchFn: createDirectApiFetch('tipo-cbo', 5000), // Aumentado para 5000
      priority: 3, 
      estimatedSize: 2700,
      category: 'administrative'
    },
    { 
      key: 'estabelecimentos', 
      name: 'Estabelecimentos', 
      fetchFn: createDirectApiFetch('estabelecimentos', 11000), // Aumentado para 11000
      priority: 3, 
      estimatedSize: 11000,
      category: 'administrative'
    }
  ];

  // Verificar quais dados estão em cache
  async checkCachedData(): Promise<Record<string, { loaded: boolean; count: number; lastUpdate?: Date }>> {
    const status: Record<string, { loaded: boolean; count: number; lastUpdate?: Date }> = {};
    
    for (const source of this.dataSources) {
      try {
        const cachedData = await indexedDBService.getOpcoes(source.key);
        const dataLength = cachedData?.length || 0;
        status[source.key] = {
          loaded: !!(cachedData && dataLength > 0),
          count: dataLength,
          lastUpdate: dataLength > 0 ? new Date() : undefined
        };
      } catch {
        status[source.key] = { loaded: false, count: 0 };
      }
    }
    
    return status;
  }

  // Baixar dados com prioridade e progresso detalhado
  async downloadDataWithPriority(
    onProgress?: (progress: number, current: string, completed: number, total: number, category: string) => void,
    priorityFilter?: number[],
    categoryFilter?: string[]
  ): Promise<{ success: number; errors: number; totalRecords: number; details: any[] }> {
    
    // Verificar conectividade
    if (!navigator.onLine) {
      toast.error('❌ Sem conexão com a internet. Não é possível baixar os dados.');
      throw new Error('Sem conexão com a internet');
    }
    
    // Filtrar e ordenar por prioridade
    const sourcesToDownload = this.dataSources
      .filter(source => 
        (!priorityFilter || priorityFilter.includes(source.priority)) &&
        (!categoryFilter || categoryFilter.includes(source.category))
      )
      .sort((a, b) => a.priority - b.priority);
    
    let completed = 0;
    let totalRecords = 0;
    let errors = 0;
    const total = sourcesToDownload.length;
    const details: any[] = [];

    for (const source of sourcesToDownload) {
      const startTime = Date.now();
      
      // Verificar conectividade durante o download
      if (!navigator.onLine) {
        toast.error('❌ Conexão perdida durante o download. Processo interrompido.');
        break;
      }
      
      try {
        console.log(`📥 Baixando: ${source.name}...`);
        onProgress?.(completed / total * 100, source.name, completed, total, source.category);
        
        const data = await source.fetchFn();
        
        if (data && Array.isArray(data) && data.length > 0) {
          await indexedDBService.saveOpcoes(source.key, data);
          totalRecords += data.length;
          
          details.push({
            key: source.key,
            name: source.name,
            category: source.category,
            recordCount: data.length,
            duration: Date.now() - startTime,
            success: true
          });
          
          console.log(`✅ ${source.name}: ${data.length} registros salvos`);
        } else {
          throw new Error('Nenhum dado retornado pela API');
        }
        
      } catch (error) {
        console.error(`❌ Erro ao baixar ${source.name}:`, error);
        errors++;
        
        details.push({
          key: source.key,
          name: source.name,
          category: source.category,
          recordCount: 0,
          duration: Date.now() - startTime,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
      
      completed++;
      onProgress?.(completed / total * 100, source.name, completed, total, source.category);
      
      // Pausa entre downloads para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return { success: completed - errors, errors, totalRecords, details };
  }

  // Métodos de conveniência
  async downloadEssentialData(onProgress?: (progress: number, current: string, completed: number, total: number) => void) {
    toast.info('⚡ Baixando dados essenciais...');
    const result = await this.downloadDataWithPriority(
      (prog, curr, comp, tot) => onProgress?.(prog, curr, comp, tot),
      [1]
    );
    
    if (result.errors === 0) {
      toast.success(`✅ Dados essenciais baixados! ${result.totalRecords.toLocaleString()} registros.`);
    } else {
      toast.warning(`⚠️ ${result.success} de ${result.success + result.errors} conjuntos baixados.`);
    }
    
    return result;
  }

  async downloadByCategory(category: string, onProgress?: (progress: number, current: string) => void) {
    toast.info(`🔄 Baixando dados: ${category}...`);
    const result = await this.downloadDataWithPriority(
      (prog, curr) => onProgress?.(prog, curr),
      undefined,
      [category]
    );
    
    if (result.errors === 0) {
      toast.success(`✅ Categoria ${category} baixada! ${result.totalRecords.toLocaleString()} registros.`);
    } else {
      toast.warning(`⚠️ ${result.success} de ${result.success + result.errors} conjuntos baixados.`);
    }
    
    return result;
  }

  async downloadAllData(onProgress?: (progress: number, current: string, completed: number, total: number) => void) {
    toast.info('🔄 Baixando todos os dados offline...');
    const result = await this.downloadDataWithPriority(
      (prog, curr, comp, tot) => onProgress?.(prog, curr, comp, tot)
    );
    
    if (result.errors === 0) {
      toast.success(`🎉 Todos os dados baixados! ${result.totalRecords.toLocaleString()} registros offline.`);
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
    toast.success('🗑️ Dados offline limpos!');
  }

  // Verificar se está pronto para uso offline
  async isReadyForOffline(): Promise<{ ready: boolean; missing: string[]; percentage: number }> {
    const essentialKeys = this.dataSources
      .filter(s => s.priority === 1)
      .map(s => s.key);
    
    const status = await this.checkCachedData();
    const missing = essentialKeys.filter(key => !status[key].loaded);
    
    const totalEssential = essentialKeys.length;
    const loadedEssential = totalEssential - missing.length;
    const percentage = Math.round((loadedEssential / totalEssential) * 100);
    
    return {
      ready: missing.length === 0,
      missing: missing.map(key => this.dataSources.find(s => s.key === key)?.name || key),
      percentage
    };
  }

  // Obter estatísticas detalhadas
  async getDetailedStats() {
    const status = await this.checkCachedData();
    const categories = [...new Set(this.dataSources.map(s => s.category))];
    
    let totalRecords = 0;
    const categoryStats: Record<string, { loaded: number; total: number; records: number }> = {};
    
    // Inicializar stats por categoria
    categories.forEach(cat => {
      categoryStats[cat] = { loaded: 0, total: 0, records: 0 };
    });
    
    // Calcular estatísticas
    for (const source of this.dataSources) {
      const sourceStatus = status[source.key];
      categoryStats[source.category].total++;
      
      if (sourceStatus.loaded) {
        categoryStats[source.category].loaded++;
        categoryStats[source.category].records += sourceStatus.count;
        totalRecords += sourceStatus.count;
      }
    }
    
    const totalLoaded = Object.values(categoryStats).reduce((sum, cat) => sum + cat.loaded, 0);
    const totalItems = this.dataSources.length;
    
    return {
      overall: {
        loaded: totalLoaded,
        total: totalItems,
        percentage: Math.round((totalLoaded / totalItems) * 100),
        totalRecords
      },
      categories: categoryStats,
      sources: this.dataSources.map(source => ({
        ...source,
        loaded: status[source.key].loaded,
        recordCount: status[source.key].count,
        lastUpdate: status[source.key].lastUpdate
      }))
    };
  }

  // Obter fontes de dados por categoria
  getSourcesByCategory() {
    const categories = [...new Set(this.dataSources.map(s => s.category))];
    const result: Record<string, DataSource[]> = {};
    
    categories.forEach(category => {
      result[category] = this.dataSources.filter(s => s.category === category);
    });
    
    return result;
  }
}

// Exportar instância singleton
export const offlineDataManager = new OfflineDataManager();