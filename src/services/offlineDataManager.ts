import { PacienteService } from '@/services/PacienteService';
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

export interface PatientsDataSource extends DataSource {
  patientsType: 'cpfs-only' | 'recent' | 'full';
  estimatedPatients?: number;
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
    },    // ✅ CORRIGIDO: DADOS DE PACIENTES PARA VERIFICAÇÃO (não sincronizar)
    { 
      key: 'pacientes-verificacao', 
      name: 'Lista de Pacientes (Verificação CPF)', 
      fetchFn: async () => {
        console.log('📥 Baixando pacientes para verificação de CPF...');
        const pacientes = await PacienteService.getAllPatientsForOffline();
        
        // ✅ IMPORTANTE: Salvar no cache de verificação, não como pacientes para sincronizar
        await indexedDBService.savePacientesParaCache(pacientes);
        
        console.log(`✅ ${pacientes.length} pacientes salvos no cache de verificação`);
        return [{ info: `${pacientes.length} pacientes para verificação` }]; // Retorno informativo apenas
      }, 
      priority: 2, 
      estimatedSize: 0, // Será calculado dinamicamente
      category: 'essential' // Verificação de CPF é essencial
    }
  ];
  // Verificar quais dados estão em cache
  async checkCachedData(): Promise<Record<string, { loaded: boolean; count: number; lastUpdate?: Date }>> {
    const status: Record<string, { loaded: boolean; count: number; lastUpdate?: Date }> = {};
    
    for (const source of this.dataSources) {
      try {
        if (source.key === 'pacientes-verificacao') {
          // ✅ Para verificação de pacientes, verificar cache específico
          const cacheStats = await indexedDBService.getCacheStats();
          status[source.key] = {
            loaded: cacheStats.verificacao > 0,
            count: cacheStats.verificacao,
            lastUpdate: cacheStats.verificacao > 0 ? new Date() : undefined
          };
        } else {
          // Para outros dados, usar método normal
          const cachedData = await indexedDBService.getOpcoes(source.key);
          const dataLength = cachedData?.length || 0;
          status[source.key] = {
            loaded: !!(cachedData && dataLength > 0),
            count: dataLength,
            lastUpdate: dataLength > 0 ? new Date() : undefined
          };
        }
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
          // ✅ VERIFICAR se é dados de verificação de pacientes
          if (source.key === 'pacientes-verificacao') {
            // Para dados de verificação, o salvamento já foi feito na fetchFn
            // Não salvar novamente em opcoes
            console.log(`✅ ${source.name}: Dados salvos no cache de verificação`);
            totalRecords += 1; // Contagem simbólica
          } else {
            // Para outros dados, salvar normalmente
            await indexedDBService.saveOpcoes(source.key, data);
            totalRecords += data.length;
            console.log(`✅ ${source.name}: ${data.length} registros salvos`);
          }
          
          details.push({
            key: source.key,
            name: source.name,
            category: source.category,
            recordCount: source.key === 'pacientes-verificacao' ? 'Cache atualizado' : data.length,
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

  // ✅ NOVO: Download específico para verificação de CPF
  async downloadPatientsForVerification(
    onProgress?: (progress: number, current: string) => void
  ): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      onProgress?.(10, 'Analisando estratégia...');
      
      const recommendation = await PacienteService.getDownloadRecommendation();
      
      onProgress?.(30, 'Baixando pacientes para verificação...');
      
      let pacientes: any[] = [];
      
      if (recommendation.totalPatients > 50000) {
        // Para bases muito grandes, baixar apenas CPFs
        const cpfs = await PacienteService.getAllCPFs();
        pacientes = cpfs.map(cpf => ({ cpf, nome: 'CPF_ONLY' }));
        
      } else if (recommendation.totalPatients > 15000) {
        // Para bases grandes, baixar pacientes recentes
        pacientes = await PacienteService.getRecentPatientsForOffline(12);
        
      } else {
        // Para bases pequenas, baixar todos
        pacientes = await PacienteService.getAllPatientsForOffline();
      }
      
      onProgress?.(80, 'Salvando no cache...');
      
      // ✅ Salvar no cache de verificação
      await indexedDBService.savePacientesParaCache(pacientes);
      
      onProgress?.(100, `${pacientes.length} pacientes salvos`);
      
      return {
        success: true,
        count: pacientes.length
      };
      
    } catch (error) {
      console.error('Erro no download de verificação:', error);
      return {
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
  // Limpar dados offline
  async clearOfflineData(): Promise<void> {
    for (const source of this.dataSources) {
      try {
        if (source.key === 'pacientes-verificacao') {
          await indexedDBService.clearPacientesCache();
        } else {
          await indexedDBService.saveOpcoes(source.key, []);
        }
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
      // Adicionar estatísticas específicas de pacientes
    const patientsStatus = await this.getPatientsStatus();
    
    return {
      overall: {
        loaded: totalLoaded,
        total: totalItems,
        percentage: Math.round((totalLoaded / totalItems) * 100),
        totalRecords
      },
      categories: categoryStats,
      patients: patientsStatus, // Novo: estatísticas de pacientes
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

  // Analisar estratégia recomendada para pacientes
  async analyzePatientsStrategy(): Promise<{
    totalPatients: number;
    estimatedSizeMB: number;
    recommendation: 'cpfs-only' | 'recent' | 'full';
    reason: string;
  }> {
    try {
      const recommendation = await PacienteService.getDownloadRecommendation();
      
      // Atualizar estimativas dos data sources dinamicamente
      const cpfsSource = this.dataSources.find(s => s.key === 'pacientes-cpfs');
      const recentSource = this.dataSources.find(s => s.key === 'pacientes-recentes');
      const fullSource = this.dataSources.find(s => s.key === 'pacientes-completos');
      
      if (cpfsSource) cpfsSource.estimatedSize = Math.round((recommendation.totalPatients * 50) / 1024); // KB
      if (recentSource) recentSource.estimatedSize = Math.round((recommendation.totalPatients * 0.3 * 1024) / 1024); // KB (30% dos pacientes)
      if (fullSource) fullSource.estimatedSize = Math.round(recommendation.estimatedSizeMB * 1024); // KB
      
      return recommendation;
    } catch (error) {
      console.error('Erro ao analisar estratégia de pacientes:', error);
      return {
        totalPatients: 0,
        estimatedSizeMB: 0,
        recommendation: 'cpfs-only',
        reason: 'Erro ao analisar base de dados'
      };
    }
  }
  // Download inteligente de pacientes
  async downloadPatientsIntelligent(
    onProgress?: (progress: number, current: string, phase: string) => void
  ): Promise<{ success: boolean; strategy: string; count: number; error?: string }> {
    try {
      onProgress?.(10, 'Analisando base de dados...', 'analysis');
      
      const strategy = await this.analyzePatientsStrategy();
      if (!strategy) throw new Error('Falha na análise da base');

      onProgress?.(20, `Estratégia: ${strategy.recommendation}`, 'strategy');
      
      let sourceKey: string;
      
      switch (strategy.recommendation) {
        case 'cpfs-only':
          sourceKey = 'pacientes-cpfs';
          break;
        case 'recent':
          sourceKey = 'pacientes-recentes';
          break;
        case 'full':
          sourceKey = 'pacientes-completos';
          break;
        default:
          sourceKey = 'pacientes-cpfs';
      }
      
      const result = await this.downloadSpecificSource(
        sourceKey,
        (progress, current) => onProgress?.(20 + (progress * 0.8), current, 'download')
      );
      
      return {
        success: result.success,
        strategy: strategy.recommendation,
        count: result.recordCount || 0,
        error: result.error
      };
      
    } catch (error) {
      console.error('Erro no download inteligente de pacientes:', error);
      return {
        success: false,
        strategy: 'failed',
        count: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
  // Download de fonte específica
  async downloadSpecificSource(
    sourceKey: string,
    onProgress?: (progress: number, current: string) => void
  ): Promise<{ success: boolean; recordCount?: number; error?: string }> {
    const source = this.dataSources.find(s => s.key === sourceKey);
    if (!source) {
      throw new Error(`Fonte ${sourceKey} não encontrada`);
    }

    try {
      onProgress?.(20, `Iniciando download: ${source.name}`);
      
      const data = await source.fetchFn();
      
      onProgress?.(85, 'Salvando no cache...');
      
      if (data && Array.isArray(data) && data.length > 0) {
        if (source.key === 'pacientes-verificacao') {
          // Para verificação, o salvamento já foi feito
          onProgress?.(100, `Cache de pacientes atualizado`);
          return { success: true, recordCount: data.length };
        } else {
          await indexedDBService.saveOpcoes(sourceKey, data);
          onProgress?.(100, `${data.length} registros salvos`);
          return { success: true, recordCount: data.length };
        }
      } else {
        throw new Error('Nenhum dado retornado');
      }
      
    } catch (error) {
      console.error(`Erro ao baixar ${source.name}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
  // ✅ CORRIGIDO: Status dos dados de pacientes
  async getPatientsStatus(): Promise<{
    verification: { loaded: boolean; count: number };
    localPatients: { loaded: boolean; count: number };
    pendingSync: { loaded: boolean; count: number };
    recommendation: string;
    confidence: 'high' | 'medium' | 'low';
  }> {
    const cacheStats = await indexedDBService.getCacheStats();
    
    const verification = {
      loaded: cacheStats.verificacao > 0,
      count: cacheStats.verificacao
    };
    
    const localPatients = {
      loaded: cacheStats.locais > 0,
      count: cacheStats.locais
    };
    
    const pendingSync = {
      loaded: cacheStats.pendentes > 0,
      count: cacheStats.pendentes
    };
    
    // Determinar recomendação e confiança
    let recommendation = 'Baixar dados de pacientes para verificação';
    let confidence: 'high' | 'medium' | 'low' = 'low';
    
    if (verification.count > 10000) {
      recommendation = 'Cache de verificação completo';
      confidence = 'high';
    } else if (verification.count > 5000) {
      recommendation = 'Cache de verificação parcial';
      confidence = 'medium';
    } else if (verification.count > 1000) {
      recommendation = 'Cache de verificação limitado';
      confidence = 'medium';
    }
    
    return {
      verification,
      localPatients,
      pendingSync,
      recommendation,
      confidence
    };
  }
  // ✅ CORRIGIDO: Verificação otimizada de CPF
  async checkCpfExistsOptimized(cpf: string): Promise<{
    exists: boolean;
    source: 'verification-cache' | 'local-patients' | 'not-found';
    confidence: 'high' | 'medium' | 'low';
  }> {
    if (!cpf || cpf.length !== 11) {
      return { exists: false, source: 'not-found', confidence: 'high' };
    }

    try {
      // ✅ A verificação agora usa o cache separado corretamente
      const exists = await indexedDBService.checkCpfExists(cpf);
      
      if (exists) {
        // Determinar a fonte (seria necessário modificar checkCpfExists para retornar a fonte)
        return { exists: true, source: 'verification-cache', confidence: 'high' };
      }

      // Determinar confiança baseado no cache
      const stats = await this.getPatientsStatus();
      
      return { 
        exists: false, 
        source: 'not-found', 
        confidence: stats.confidence 
      };
      
    } catch (error) {
      console.error('Erro na verificação otimizada de CPF:', error);
      return { exists: false, source: 'not-found', confidence: 'low' };
    }
  }
  // Limpar dados de pacientes
  async clearPatientsData(): Promise<void> {
    try {
      await indexedDBService.clearPacientesCache();
      console.log('✅ Cache de verificação de pacientes limpo');
    } catch (error) {
      console.error('Erro ao limpar cache de pacientes:', error);
    }
  }  // Download de categoria específica incluindo pacientes
  async downloadPatientsCategory(
    strategy: 'cpfs-only' | 'recent' | 'full',
    onProgress?: (progress: number, current: string) => void
  ) {
    // Esta funcionalidade agora é direcionada para o downloadPatientsForVerification
    toast.info(`🔄 Baixando dados de verificação de CPF (${strategy})...`);
    
    const result = await this.downloadPatientsForVerification(onProgress);
    
    if (result.success) {
      toast.success(`✅ Cache de verificação atualizado! ${result.count.toLocaleString()} registros.`);
    } else {
      toast.error(`❌ Erro no download: ${result.error}`);
    }
    
    return {
      success: result.success,
      recordCount: result.count,
      error: result.error
    };
  }
}

// Exportar instância singleton
export const offlineDataManager = new OfflineDataManager();