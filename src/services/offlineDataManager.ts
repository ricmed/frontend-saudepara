import { PacienteService } from '@/services/PacienteService';
import { NotificacaoService } from '@/services/NotificacaoService';
import { TiposEventoService } from '@/services/EventoService';
import { LocalidadeEventoService } from '@/services/LocalidadeEventoService';
import { listFiltersForActiveEvents } from '@/features/notificationForms/utils/listFiltersForActiveEvents';
import {
  deveRestringirEstabelecimentosAoEvento,
  eventosAtivos,
  eventosAtivosComLocalidade,
  unirEstabelecimentosDoEvento,
  type EstabelecimentoOfflineDTO,
} from '@/features/notificationForms/utils/offlineEventoScope';
import indexedDBService from '@/services/indexedDB';
import encryptionService from '@/services/encryptionService'; // ✅ NOVO: Criptografia
import { getRuntimeApiRoot } from '@/config/runtimeApiBase';
import {
  mapPendingComunicacaoDaeToListItem,
  mergeComunicacoesDaeForOfflineList,
} from '@/features/comunicacao-dae/comunicacaoDaeOfflineList';
import ComunicacaoDaeService, {
  ComunicacaoDae,
  getComunicacaoDaeApiErrorMessage,
  isComunicacaoDaeForbiddenError,
} from '@/services/ComunicacaoDaeService';
import {
  createComunicacaoDaeCacheEnvelope,
  getAuthenticatedUserIdentifier,
  isComunicacaoDaeCacheEnvelopeForOwner,
} from '@/services/comunicacaoDaeOfflineScope';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosRetry';

/**
 * Root da API só para o download offline.
 * Em Vite local usa a origem da página (`/api` via proxy) para cookies de auth.
 * Fora disso mantém `getRuntimeApiRoot()` (VITE_API_* / host oficial).
 * Não altera getApiOrigin/getApiRoot globais.
 */
function getOfflineDownloadApiRoot(): string {
  if (typeof window !== 'undefined') {
    const h = window.location.hostname.toLowerCase();
    if (h === 'localhost' || h === '127.0.0.1') {
      const basePath =
        (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api';
      return `${window.location.origin}${
        basePath.startsWith('/') ? basePath : `/${basePath}`
      }`;
    }
  }
  return getRuntimeApiRoot();
}

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

// Função helper para chamadas diretas à API (usa origem correta em HML/prod)
const createDirectApiFetch = (endpoint: string, limit?: number) => {
  return async () => {
    const base = getOfflineDownloadApiRoot();
    const url = limit
      ? `${base}/${endpoint}?page=1&limit=${limit}`
      : `${base}/${endpoint}`;

    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data?.data || data || [];
  };
};

class OfflineDataManager {
  private estabelecimentosOfflinePackPromise: Promise<{
    restringe: boolean;
    unidades: EstabelecimentoOfflineDTO[];
  }> | null = null;

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
      key: 'localidades-evento',
      name: 'Localidades por Evento',
      fetchFn: () => this.downloadLocalidadesEventoCatalogs(),
      priority: 1,
      estimatedSize: 500,
      category: 'essential',
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
      priority: 1, 
      estimatedSize: 250,
      category: 'geographic'
    },
    { 
      key: 'estados', 
      name: 'Estados', 
      fetchFn: createDirectApiFetch('tipo-estado', 100), 
      priority: 1, 
      estimatedSize: 30,
      category: 'geographic'
    },
    { 
      key: 'municipios', 
      name: 'Municípios', 
      fetchFn: createDirectApiFetch('tipo-municipio', 10000), // Aumentado para 10000
      priority: 2, 
      estimatedSize: 5571,
      category: 'geographic'
    },
    { 
      key: 'bairros', 
      name: 'Bairros', 
      fetchFn: createDirectApiFetch('tipo-bairro', 1000), // Aumentado para 1000
      priority: 2, 
      estimatedSize: 100,
      category: 'geographic'
    },

    // ===== DADOS MÉDICOS (Prioridade 1 — ficha de comunicação) =====
    { 
      key: 'sintomas', 
      name: 'Sintomas', 
      fetchFn: createDirectApiFetch('tipo-sintoma', 500), // Aumentado para 500
      priority: 1, 
      estimatedSize: 100,
      category: 'medical'
    },
    { 
      // Chave alinhada ao formulário/IndexedDB (`hipoteses`), não `hipoteses-diagnosticas`.
      key: 'hipoteses', 
      name: 'Hipóteses Diagnósticas', 
      fetchFn: createDirectApiFetch('tipo-hipotese-diag', 200), // Aumentado para 200
      priority: 1, 
      estimatedSize: 50,
      category: 'medical'
    },
    { 
      key: 'traumas', 
      name: 'Tipos de Trauma', 
      fetchFn: createDirectApiFetch('tipo-trauma', 100), 
      priority: 1, 
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

    // ===== DADOS DO FORMULÁRIO DAE (Prioridade 1 — necessários para criar comunicação offline) =====
    { 
      key: 'daes', 
      name: 'DAE - Doenças, Agravos e Eventos', 
      fetchFn: createDirectApiFetch('dae', 500), 
      priority: 1, 
      estimatedSize: 50,
      category: 'administrative'
    },
    { 
      key: 'crs', 
      name: 'CRS - Centros Regionais de Saúde', 
      fetchFn: createDirectApiFetch('crs', 500), 
      priority: 1, 
      estimatedSize: 30,
      category: 'administrative'
    },
    { 
      key: 'nhes', 
      name: 'NHE - Núcleos Hospitalares de Epidemiologia', 
      fetchFn: createDirectApiFetch('nhe', 500), 
      priority: 1, 
      estimatedSize: 80,
      category: 'administrative'
    },
    { 
      key: 'cievs', 
      name: 'CIEVS - Centros de Informação em Vigilância', 
      fetchFn: createDirectApiFetch('cievs', 500), 
      priority: 1, 
      estimatedSize: 20,
      category: 'administrative'
    },

    // ===== DADOS GRANDES (Prioridade 1 — CBO obrigatório na ficha) =====
    { 
      key: 'cbos', 
      name: 'CBOs/Profissões', 
      fetchFn: createDirectApiFetch('tipo-cbo', 5000), // Aumentado para 5000
      priority: 1, 
      estimatedSize: 2700,
      category: 'administrative'
    },
    { 
      key: 'estabelecimentos', 
      name: 'Estabelecimentos (evento ativo)', 
      fetchFn: async () => {
        const pack = await this.resolveEstabelecimentosOfflinePack();
        await indexedDBService.saveOpcoes('estabelecimentos-permitidos', pack.unidades);
        return pack.unidades;
      },
      priority: 1, 
      estimatedSize: 80,
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
    },
    // ✅ NOVO: DADOS DE ESTABELECIMENTOS PARA VERIFICAÇÃO (não sincronizar)
    {
      key: 'estabelecimentos-verificacao',
      name: 'Lista de Estabelecimentos (Verificação CNES)',
      fetchFn: async () => {
        const pack = await this.resolveEstabelecimentosOfflinePack();
        await indexedDBService.saveEstabelecimentosParaCache(pack.unidades);
        console.log(`✅ ${pack.unidades.length} estabelecimentos no cache de verificação (escopo do evento ativo)`);
        return [{ info: `${pack.unidades.length} estabelecimentos para verificação` }];
      },
      priority: 2,
      estimatedSize: 0,
      category: 'essential'
    }
  ];

  async downloadLocalidadesEventoCatalogs(): Promise<any[]> {
    const eventos = await NotificacaoService.getEventoOptions();
    await indexedDBService.saveOpcoes('eventos', eventos);

    const eventosComLocalidade = eventosAtivosComLocalidade(eventos);
    const flattenedCatalogs: any[] = [];

    for (const evento of eventosComLocalidade) {
      const catalog = await LocalidadeEventoService.getByEventoId(
        evento.idtipo_evento,
      );
      await indexedDBService.saveLocalidadesEvento(
        evento.idtipo_evento,
        catalog,
      );
      flattenedCatalogs.push(
        ...catalog.map(localidade => ({
          ...localidade,
          eventoId: evento.idtipo_evento,
        })),
      );
    }

    return flattenedCatalogs;
  }

  private resolveEstabelecimentosOfflinePack() {
    if (!this.estabelecimentosOfflinePackPromise) {
      this.estabelecimentosOfflinePackPromise = this.computeEstabelecimentosOfflinePack();
    }
    return this.estabelecimentosOfflinePackPromise;
  }

  private async computeEstabelecimentosOfflinePack(): Promise<{
    restringe: boolean;
    unidades: EstabelecimentoOfflineDTO[];
  }> {
    const eventos = await NotificacaoService.getEventoOptions();
    await indexedDBService.saveOpcoes('eventos', eventos);
    const ativos = eventosAtivos(eventos);

    const vinculos = [];
    for (const evento of ativos) {
      const result = await TiposEventoService.getEstabelecimentosVinculados(
        evento.idtipo_evento,
      );
      await indexedDBService.saveOpcoes(
        `estabelecimentos-evento-${evento.idtipo_evento}`,
        result,
      );
      vinculos.push(result);
    }

    const restringe = deveRestringirEstabelecimentosAoEvento(vinculos);
    if (restringe) {
      const unidades = unirEstabelecimentosDoEvento(vinculos);
      console.log(`✅ Offline: ${unidades.length} estabelecimentos dos eventos ativos (sem cadastro geral)`);
      return { restringe: true, unidades };
    }

    if (ativos.length === 0) {
      console.warn('⚠️ Offline: nenhum evento ativo — não baixa o cadastro geral de estabelecimentos');
      return { restringe: true, unidades: [] };
    }

    const unidades = await this.fetchEstabelecimentosHierarquicos();
    return { restringe: false, unidades };
  }

  private async fetchEstabelecimentosHierarquicos(): Promise<EstabelecimentoOfflineDTO[]> {
    const response = await axios.get(
      `${getOfflineDownloadApiRoot()}/usuario-acesso/current/estabelecimentos`,
      {
        withCredentials: true,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      },
    );
    const estabelecimentos = response?.data?.data || response?.data || [];
    return Array.isArray(estabelecimentos) ? estabelecimentos : [];
  }

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
        } else if (source.key === 'estabelecimentos-verificacao') {
          // ✅ NOVO: Para verificação de estabelecimentos, verificar cache específico
          const cacheStats = await indexedDBService.getCacheStats();
          status[source.key] = {
            loaded: cacheStats.estabelecimentos_verificacao > 0,
            count: cacheStats.estabelecimentos_verificacao,
            lastUpdate: cacheStats.estabelecimentos_verificacao > 0 ? new Date() : undefined
          };
        } else if (source.key === 'localidades-evento') {
          const eventos =
            (await indexedDBService.getOpcoes<any[]>('eventos')) || [];
          const eventosComLocalidade = eventos.filter(
            evento =>
              (evento.modo_localidade_evento ?? 'NAO_USA') !== 'NAO_USA',
          );
          const catalogs = await Promise.all(
            eventosComLocalidade.map(evento =>
              indexedDBService.getLocalidadesEvento(evento.idtipo_evento),
            ),
          );
          const allCatalogsLoaded =
            eventos.length > 0 &&
            catalogs.every(catalog => catalog !== null);
          status[source.key] = {
            loaded: allCatalogsLoaded,
            count: catalogs.reduce(
              (total, catalog) => total + (catalog?.length || 0),
              0,
            ),
            lastUpdate: allCatalogsLoaded ? new Date() : undefined,
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

    this.estabelecimentosOfflinePackPromise = null;
    
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
        const acceptsEmptyCatalog =
          source.key === 'localidades-evento' && Array.isArray(data);
        if (
          data &&
          Array.isArray(data) &&
          (data.length > 0 || acceptsEmptyCatalog)
        ) {
          if (source.key === 'pacientes-verificacao') {
            // Para dados de verificação, o salvamento já foi feito na fetchFn
            // Não salvar novamente em opcoes
            console.log(`✅ ${source.name}: Dados salvos no cache de verificação`);
            totalRecords += 1; // Contagem simbólica
          } else if (source.key === 'estabelecimentos-verificacao') {
            // ✅ NOVO: Para verificação de estabelecimentos, o salvamento já foi feito na fetchFn
            console.log(`✅ ${source.name}: Dados salvos no cache de verificação`);
            totalRecords += 1; // Contagem simbólica
          } else if (source.key === 'localidades-evento') {
            totalRecords += data.length;
          } else {
            // Para outros dados, salvar normalmente
            await indexedDBService.saveOpcoes(source.key, data);
            // Alias legado: ListaSindromicaService ainda lê `hipoteses-diagnosticas`.
            if (source.key === 'hipoteses') {
              await indexedDBService.saveOpcoes('hipoteses-diagnosticas', data);
            }
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
    // ✅ LIMPAR CACHE DE ESTABELECIMENTOS ANTES DE BAIXAR (para evitar mistura de dados antigos)
    console.log('🧹 Limpando cache de estabelecimentos antigo antes do download...');
    try {
      await indexedDBService.saveOpcoes('estabelecimentos', []);
      console.log('✅ Cache de estabelecimentos limpo');
    } catch (error) {
      console.warn('⚠️ Erro ao limpar cache de estabelecimentos:', error);
    }
    
    toast.info('🔄 Baixando todos os dados offline...');
    
    // 1. Baixar todas as fontes de dados normais (95% do progresso)
    const result = await this.downloadDataWithPriority(
      (prog, curr, comp, tot) => {
        // Escalar progresso para 0-95%
        const scaledProg = (prog * 0.95);
        onProgress?.(scaledProg, curr, comp, tot);
      }
    );
    
    // 2. Baixar notificações (últimos 5% do progresso)
    try {
      console.log('📥 Baixando notificações para visualização offline...');
      onProgress?.(95, 'Baixando notificações...', result.success, result.success + 1);
      
      const notifResult = await this.downloadNotificacoesForOfflineViewing({
        limit: 200, // Baixar 200 mais recentes
        encrypt: true,
        onProgress: (subProg, subCurr) => {
          // Mapear progresso de 95% a 97%
          const scaledProg = 95 + (subProg * 0.02);
          onProgress?.(scaledProg, `Notificações: ${subCurr}`, result.success + 1, result.success + 1);
        }
      });
      
      if (notifResult.success) {
        console.log(`✅ ${notifResult.count} notificações incluídas no download completo`);
      }
    } catch (error) {
      console.error('❌ Erro ao baixar notificações no download completo:', error);
    }

    // 3. Baixar comunicações DAE para visualização offline
    try {
      console.log('📥 Baixando comunicações DAE para visualização offline...');
      onProgress?.(97, 'Baixando comunicações DAE...', result.success, result.success + 1);

      const daeListResult = await this.downloadComunicacoesDaeForOfflineViewing({
        limit: 500,
        encrypt: true,
        onProgress: (subProg, subCurr) => {
          const scaledProg = 97 + (subProg * 0.03);
          onProgress?.(scaledProg, `Comunicações DAE: ${subCurr}`, result.success + 1, result.success + 1);
        },
      });

      if (daeListResult.success) {
        console.log(`✅ ${daeListResult.count} comunicações DAE incluídas no download completo`);
      } else {
        toast.error(`Comunicações DAE não foram baixadas: ${daeListResult.error}`);
      }
    } catch (error) {
      console.error('❌ Erro ao baixar comunicações DAE no download completo:', error);
    }
    
    onProgress?.(100, 'Concluído!', result.success + 1, result.success + 1);
    
    if (result.errors === 0) {
      toast.success(`🎉 Todos os dados baixados! ${result.totalRecords.toLocaleString()} registros offline + notificações.`);
    } else {
      toast.warning(`⚠️ ${result.success} de ${result.success + result.errors} conjuntos baixados + notificações.`);
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
  // ✅ NOVO: Download específico para verificação de CNES
  async downloadEstabelecimentosForVerification(
    onProgress?: (progress: number, current: string) => void
  ): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      onProgress?.(10, 'Analisando estratégia...');
      
      onProgress?.(30, 'Baixando estabelecimentos do evento ativo...');

      this.estabelecimentosOfflinePackPromise = null;
      const pack = await this.resolveEstabelecimentosOfflinePack();
      const estabelecimentos = pack.unidades;

      onProgress?.(80, 'Salvando no cache...');

      await indexedDBService.saveOpcoes('estabelecimentos-permitidos', estabelecimentos);
      await indexedDBService.saveEstabelecimentosParaCache(estabelecimentos);
      
      onProgress?.(100, `${estabelecimentos.length} estabelecimentos salvos`);
      
      return {
        success: true,
        count: estabelecimentos.length
      };
      
    } catch (error) {
      console.error('Erro no download de verificação de estabelecimentos:', error);
      return {
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // ✅ NOVO: Download de notificações para visualização offline (COM CRIPTOGRAFIA)
  async downloadNotificacoesForOfflineViewing(
    options: {
      limit?: number;           // Quantas notificações baixar (padrão: 200)
      encrypt?: boolean;        // Se deve criptografar (padrão: true)
      onProgress?: (progress: number, current: string) => void;
    } = {}
  ): Promise<{ success: boolean; count: number; encrypted: boolean; error?: string }> {
    const { limit = 200, encrypt = true, onProgress } = options;
    
    try {
      onProgress?.(10, 'Iniciando download de notificações...');
      
      console.log('📥 Baixando notificações para visualização offline...');
      console.log(`   Limite: ${limit} notificações`);
      console.log(`   Criptografia: ${encrypt ? 'ATIVADA' : 'DESATIVADA'}`);

      onProgress?.(20, 'Resolvendo eventos ativos...');
      const eventos = await NotificacaoService.getEventoOptions();
      await indexedDBService.saveOpcoes('eventos', eventos);
      const filtrosLista = listFiltersForActiveEvents(
        eventosAtivos(eventos).map((evento) => evento.idtipo_evento),
      );

      if (!filtrosLista) {
        console.warn('⚠️ Nenhum evento ativo - cancelando download de notificações');
        return {
          success: false,
          count: 0,
          encrypted: false,
          error: 'Nenhum evento ativo. Ative pelo menos um evento para baixar notificações.',
        };
      }

      onProgress?.(30, `Baixando ${limit} notificações do evento ativo...`);

      let allNotificacoes: any[] = [];
      let page = 1;
      const pageSize = 100;
      const maxPages = Math.ceil(limit / pageSize);

      for (let i = 0; i < maxPages; i++) {
        const response = await NotificacaoService.getAll(page, pageSize, filtrosLista);

        if (response && response.data && response.data.length > 0) {
          allNotificacoes = [...allNotificacoes, ...response.data];

          const progressPct = 30 + (i / maxPages) * 40;
          onProgress?.(progressPct, `${allNotificacoes.length}/${limit} notificações...`);

          if (allNotificacoes.length >= limit) {
            allNotificacoes = allNotificacoes.slice(0, limit);
            break;
          }

          page++;
        } else {
          break;
        }
      }

      console.log(`✅ ${allNotificacoes.length} notificações do evento ativo baixadas da API`);

      if (allNotificacoes.length === 0) {
        console.warn('⚠️ Nenhuma notificação do evento ativo para o cache offline');
        return {
          success: false,
          count: 0,
          encrypted: false,
          error: 'Nenhuma notificação encontrada para os eventos ativos.',
        };
      }
      
      // 3. Criptografar se necessário
      let dataToSave: any = allNotificacoes;
      let isEncrypted = false;
      
      if (encrypt && allNotificacoes.length > 0) {
        onProgress?.(80, 'Criptografando dados sensíveis...');
        
        console.log('🔐 Criptografando notificações...');
        
        // Criptografar todo o array e marcar como criptografado
        const encryptedString = await encryptionService.encrypt(allNotificacoes);
        
        // Salvar como objeto com flag de criptografia
        dataToSave = {
          encrypted: true,
          data: encryptedString
        };
        isEncrypted = true;
        
        console.log('✅ Dados criptografados com sucesso');
      } else {
        // Salvar normal sem criptografia
        dataToSave = {
          encrypted: false,
          data: allNotificacoes
        };
      }
      
      // 4. Salvar no cache
      onProgress?.(90, 'Salvando no cache local...');
      
      await indexedDBService.saveOpcoes('notificacoes-cache', dataToSave);
      
      console.log(`✅ ${allNotificacoes.length} notificações salvas no cache ${encrypt ? 'criptografado' : 'normal'}`);
      
      onProgress?.(100, 'Download concluído!');
      
      return {
        success: true,
        count: allNotificacoes.length,
        encrypted: isEncrypted
      };
      
    } catch (error) {
      console.error('❌ Erro no download de notificações:', error);
      return {
        success: false,
        count: 0,
        encrypted: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // ✅ NOVO: Obter notificações do cache (com descriptografia automática)
  async getNotificacoesFromCache(): Promise<any[]> {
    try {
      const cachedWrapper: any = await indexedDBService.getOpcoes('notificacoes-cache');
      
      if (!cachedWrapper) {
        console.log('📭 Nenhuma notificação no cache');
        return [];
      }
      
      // Verificar se é o formato novo (com wrapper)
      if (typeof cachedWrapper === 'object' && !Array.isArray(cachedWrapper) && 'encrypted' in cachedWrapper) {
        if (cachedWrapper.encrypted === true && typeof cachedWrapper.data === 'string') {
          // Descriptografar
          console.log('🔓 Descriptografando notificações...');
          const decrypted = await encryptionService.decrypt(cachedWrapper.data);
          console.log(`✅ ${decrypted.length} notificações descriptografadas`);
          return decrypted;
        } else if (cachedWrapper.encrypted === false) {
          // Não criptografado (formato novo)
          return Array.isArray(cachedWrapper.data) ? cachedWrapper.data : [];
        }
      }
      
      // Fallback: formato antigo (array direto)
      return Array.isArray(cachedWrapper) ? cachedWrapper : [];
      
    } catch (error) {
      console.error('❌ Erro ao obter notificações do cache:', error);
      return [];
    }
  }

  // ✅ Limpar cache de notificações
  async clearNotificacoesCache(): Promise<void> {
    try {
      const emptyCache: any = { encrypted: false, data: [] };
      await indexedDBService.saveOpcoes('notificacoes-cache', emptyCache);
      console.log('🗑️ Cache de notificações limpo');
    } catch (error) {
      console.error('Erro ao limpar cache de notificações:', error);
    }
  }

  // ===== COMUNICAÇÃO DAE OFFLINE =====

  async downloadComunicacoesDaeForOfflineViewing(
    options: {
      limit?: number;
      encrypt?: boolean;
      onProgress?: (progress: number, current: string) => void;
    } = {},
  ): Promise<{ success: boolean; count: number; encrypted: boolean; error?: string }> {
    const { limit = 200, encrypt = true, onProgress } = options;
    const ownerId = getAuthenticatedUserIdentifier();

    if (!ownerId) {
      return {
        success: false,
        count: 0,
        encrypted: false,
        error: 'Não foi possível identificar o usuário autenticado para proteger o cache DAE.',
      };
    }

    try {
      onProgress?.(10, 'Iniciando download de comunicações DAE...');

      let allComunicacoes: ComunicacaoDae[] = [];
      let page = 1;
      const pageSize = 100;
      const maxPages = Math.ceil(limit / pageSize);

      for (let i = 0; i < maxPages; i++) {
        const response = await ComunicacaoDaeService.getAll(page, pageSize);
        if (response?.data?.length) {
          allComunicacoes = [...allComunicacoes, ...response.data];
          const progressPct = 10 + ((i + 1) / maxPages) * 60;
          onProgress?.(progressPct, `${allComunicacoes.length}/${limit} comunicações...`);

          if (allComunicacoes.length >= limit) {
            allComunicacoes = allComunicacoes.slice(0, limit);
            break;
          }
          page++;
        } else {
          break;
        }
      }

      onProgress?.(75, 'Salvando no cache local...');

      let cachedData: unknown = allComunicacoes;
      let isEncrypted = false;

      if (encrypt && allComunicacoes.length > 0) {
        cachedData = await encryptionService.encrypt(allComunicacoes);
        isEncrypted = true;
      }

      if (getAuthenticatedUserIdentifier() !== ownerId) {
        throw new Error('O usuário autenticado mudou durante o download. O cache DAE não foi salvo.');
      }

      await indexedDBService.saveOpcoes(
        'comunicacoes-dae-cache',
        createComunicacaoDaeCacheEnvelope(ownerId, cachedData, isEncrypted),
      );

      onProgress?.(100, 'Download concluído!');

      return {
        success: true,
        count: allComunicacoes.length,
        encrypted: isEncrypted,
      };
    } catch (error) {
      console.error('❌ Erro no download de comunicações DAE:', error);
      return {
        success: false,
        count: 0,
        encrypted: false,
        error: isComunicacaoDaeForbiddenError(error)
          ? getComunicacaoDaeApiErrorMessage(
              error,
              'Acesso negado ao download offline das comunicações DAE.',
            )
          : getComunicacaoDaeApiErrorMessage(
              error,
              'Erro ao baixar comunicações DAE para uso offline.',
            ),
      };
    }
  }

  async getComunicacoesDaeFromCache(): Promise<ComunicacaoDae[]> {
    const ownerId = getAuthenticatedUserIdentifier();
    if (!ownerId) {
      return [];
    }

    try {
      const cachedWrapper = await indexedDBService.getOpcoes<unknown>('comunicacoes-dae-cache');

      if (!cachedWrapper) {
        return [];
      }

      if (!isComunicacaoDaeCacheEnvelopeForOwner(cachedWrapper, ownerId)) {
        await indexedDBService.saveOpcoes(
          'comunicacoes-dae-cache',
          createComunicacaoDaeCacheEnvelope(ownerId, [], false),
        );
        return [];
      }

      const data =
        cachedWrapper.encrypted && typeof cachedWrapper.data === 'string'
          ? await encryptionService.decrypt(cachedWrapper.data)
          : cachedWrapper.data;

      return Array.isArray(data) ? (data as ComunicacaoDae[]) : [];
    } catch (error) {
      console.error('❌ Erro ao obter comunicações DAE do cache:', error);
      return [];
    }
  }

  async getComunicacoesDaeForOfflineList(): Promise<any[]> {
    const cached = await this.getComunicacoesDaeFromCache();
    const pendingRows = await indexedDBService.getPendingComunicacoesDae();
    const daesCache = (await indexedDBService.getOpcoes('daes')) || [];

    const pending = pendingRows.map((row) => mapPendingComunicacaoDaeToListItem(row, daesCache));
    return mergeComunicacoesDaeForOfflineList(cached, pending);
  }

  async getComunicacoesDaeOfflineStats(): Promise<{
    cached: number;
    pending: number;
    total: number;
    formOptions: { daes: number; nhes: number; cievs: number; crs: number };
  }> {
    const cached = await this.getComunicacoesDaeFromCache();
    const pending = await indexedDBService.getPendingComunicacoesDae();
    const [daes, nhes, cievs, crs] = await Promise.all([
      indexedDBService.getOpcoes('daes'),
      indexedDBService.getOpcoes('nhes'),
      indexedDBService.getOpcoes('cievs'),
      indexedDBService.getOpcoes('crs'),
    ]);

    return {
      cached: cached.length,
      pending: pending.length,
      total: cached.length + pending.length,
      formOptions: {
        daes: daes?.length ?? 0,
        nhes: nhes?.length ?? 0,
        cievs: cievs?.length ?? 0,
        crs: crs?.length ?? 0,
      },
    };
  }

  async downloadDaeFormOptions(
    onProgress?: (progress: number, current: string) => void,
  ): Promise<{ success: boolean; totalRecords: number; error?: string }> {
    const keys = ['daes', 'nhes', 'cievs', 'crs'] as const;
    let totalRecords = 0;

    try {
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const source = this.dataSources.find((s) => s.key === key);
        if (!source) continue;

        onProgress?.(((i + 1) / keys.length) * 100, source.name);
        const data = await source.fetchFn();
        if (data?.length) {
          await indexedDBService.saveOpcoes(key, data);
          totalRecords += data.length;
        }
      }

      return { success: true, totalRecords };
    } catch (error) {
      return {
        success: false,
        totalRecords,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  async clearComunicacoesDaeCache(): Promise<void> {
    try {
      const ownerId = getAuthenticatedUserIdentifier();
      await indexedDBService.saveOpcoes(
        'comunicacoes-dae-cache',
        createComunicacaoDaeCacheEnvelope(ownerId ?? '', [], false),
      );
      console.log('🗑️ Cache de comunicações DAE limpo');
    } catch (error) {
      console.error('Erro ao limpar cache de comunicações DAE:', error);
    }
  }

  // Limpar dados offline
  async clearOfflineData(): Promise<void> {
    for (const source of this.dataSources) {
      try {
        if (source.key === 'pacientes-verificacao') {
          await indexedDBService.clearPacientesCache();
        } else if (source.key === 'estabelecimentos-verificacao') {
          await indexedDBService.clearEstabelecimentosCache();
        } else if (source.key === 'localidades-evento') {
          await indexedDBService.clearLocalidadesEventoCache();
        } else {
          await indexedDBService.saveOpcoes(source.key, []);
        }
      } catch (error) {
        console.error(`Erro ao limpar ${source.key}:`, error);
      }
    }
    await this.clearNotificacoesCache();
    await this.clearComunicacoesDaeCache();
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
      
      if (
        data &&
        Array.isArray(data) &&
        (data.length > 0 || source.key === 'localidades-evento')
      ) {
        if (source.key === 'pacientes-verificacao') {
          // Para verificação, o salvamento já foi feito
          onProgress?.(100, `Cache de pacientes atualizado`);
          return { success: true, recordCount: data.length };
        } else if (source.key === 'localidades-evento') {
          onProgress?.(100, `${data.length} localidades salvas`);
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