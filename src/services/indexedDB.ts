import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { FormData } from '@/features/notificationForms/types/index2';

// ✅ CORRIGIDO: Interface melhorada para distinguir dados
interface NotificacaoDatabase extends DBSchema {
  notificacoes: {
    key: number;
    value: {
      id: number;
      formData: FormData;
      syncStatus: 'pending' | 'synced';
      timestamp: number;
    };
    indexes: { 'by-sync-status': string };
  };
  opcoes: {
    key: string;
    value: {
      tipo: string;
      data: any[];
      timestamp: number;
    };
  };
  pacientes: {
    key: number;
    value: any;
    indexes: { 'by-nome': string; 'by-cpf': string; 'by-synced': string; 'by-source': string };
  };  // ✅ NOVO: Store separado para dados de verificação (apenas leitura)
  pacientes_cache: {
    key: string; // CPF como chave
    value: {
      cpf: string;
      nome: string;
      data_nascimento?: string;
      timestamp: number;
      source: 'download' | 'api'; // Origem dos dados
    };
  };
  // ✅ Store específico para cache de CPFs
  cpfs_cache: {
    key: string; // CPF como chave
    value: {
      cpf: string;
      when: number;
    };
  };
}

const DB_VERSION = 3; // ✅ INCREMENTAR versão para nova estrutura
const DB_NAME = 'NotificacaoOfflineDB';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias

export class IndexedDBService {
  private db: IDBPDatabase<NotificacaoDatabase> | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    try {
      console.log(`🔧 Inicializando IndexedDB: ${DB_NAME} v${DB_VERSION}`);
      
      this.db = await openDB<NotificacaoDatabase>(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion) {
          console.log(`📈 Upgrade DB: v${oldVersion} → v${newVersion}`);
          
          // Store para notificações
          if (!db.objectStoreNames.contains('notificacoes')) {
            console.log('🆕 Criando store: notificacoes');
            const notificacoesStore = db.createObjectStore('notificacoes', {
              keyPath: 'id'
            });
            notificacoesStore.createIndex('by-sync-status', 'syncStatus');
          }

          // Store para opções
          if (!db.objectStoreNames.contains('opcoes')) {
            console.log('🆕 Criando store: opcoes');
            db.createObjectStore('opcoes', {
              keyPath: 'tipo'
            });
          }          // Store para pacientes (dados criados localmente)
          if (!db.objectStoreNames.contains('pacientes')) {
            console.log('🆕 Criando store: pacientes');
            const pacientesStore = db.createObjectStore('pacientes', {
              keyPath: 'idpaciente'
            });
            pacientesStore.createIndex('by-nome', 'nome');
            pacientesStore.createIndex('by-cpf', 'cpf');
            pacientesStore.createIndex('by-synced', 'synced');
            pacientesStore.createIndex('by-source', 'source');
          }          // ✅ NOVO: Store para cache de verificação
          if (!db.objectStoreNames.contains('pacientes_cache')) {
            console.log('🆕 Criando store: pacientes_cache');
            db.createObjectStore('pacientes_cache', {
              keyPath: 'cpf'
            });
          }

          // ✅ NOVO: Store específico para cache de CPFs
          if (!db.objectStoreNames.contains('cpfs_cache')) {
            console.log('🆕 Criando store: cpfs_cache');
            db.createObjectStore('cpfs_cache', {
              keyPath: 'cpf'
            });
          }
        },
        
        blocked() {
          console.warn('⚠️ IndexedDB bloqueado por outra aba/processo');
        },
        
        blocking: () => {
          console.warn('⚠️ IndexedDB bloqueando para upgrade');
          if (this.db) {
            this.db.close();
            this.db = null;
          }
        },
        
        terminated: () => {
          console.error('❌ IndexedDB conexão terminada');
          this.db = null;
        }
      });

      console.log('✅ IndexedDB inicializado com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao inicializar IndexedDB:', error);
      
      if (error instanceof Error && error.name === 'VersionError') {
        console.log('🔄 VersionError detectado, tentando resetar banco...');
        await this.resetDatabase();
        return;
      }
      
      throw error;
    }
  }

  async resetDatabase(): Promise<void> {
    try {
      console.log('🗑️ Resetando banco de dados...');
      
      if (this.db) {
        this.db.close();
        this.db = null;
      }

      await new Promise<void>((resolve, reject) => {
        const deleteReq = indexedDB.deleteDatabase(DB_NAME);
        deleteReq.onsuccess = () => {
          console.log('✅ Banco deletado com sucesso');
          resolve();
        };
        deleteReq.onerror = () => reject(deleteReq.error);
        deleteReq.onblocked = () => {
          console.warn('⚠️ Delete bloqueado - outras abas podem estar abertas');
          setTimeout(() => resolve(), 1000);
        };
      });

      await this.init();
      
    } catch (error) {
      console.error('❌ Erro ao resetar banco:', error);
      throw error;
    }
  }

  private async generateTemporaryId(): Promise<number> {
    await this.init();
    
    try {
      const allNotificacoes = await this.db!.getAll('notificacoes');
      const tempIds = allNotificacoes
        .map(n => n.id as number)
        .filter(id => id < 0);
      
      return tempIds.length > 0 ? Math.min(...tempIds) - 1 : -1;
    } catch (error) {
      console.warn('Erro ao gerar ID temporário, usando timestamp:', error);
      return -Date.now();
    }
  }

  // ===== NOTIFICAÇÕES (não mexer) =====
  async saveNotificacao(formData: FormData, isEdit: boolean = false, id?: number): Promise<number> {
    await this.init();
    
    try {
      let notificacao;
      
      if (isEdit && id) {
        notificacao = {
          id,
          formData,
          syncStatus: 'pending' as const,
          timestamp: Date.now()
        };
      } else {
        const tempId = await this.generateTemporaryId();
        notificacao = {
          id: tempId,
          formData, 
          syncStatus: 'pending' as const,
          timestamp: Date.now()
        };
      }

      await this.db!.put('notificacoes', notificacao);
      console.log(`💾 Notificação salva offline: ID ${notificacao.id}`);
      return notificacao.id;
      
    } catch (error) {
      console.error('❌ Erro ao salvar notificação:', error);
      throw error;
    }
  }

  // ===== PACIENTES MELHORADO =====

  // ✅ NOVO: Salvar pacientes baixados apenas para cache (não sincronizar)
  async savePacientesParaCache(pacientes: any[]): Promise<void> {
    await this.init();
    
    try {
      const tx = this.db!.transaction(['pacientes_cache'], 'readwrite');
      const store = tx.objectStore('pacientes_cache');
      
      for (const paciente of pacientes) {
        if (paciente.cpf) {
          const cacheEntry = {
            cpf: paciente.cpf.replace(/\D/g, ''), // Limpar formatação
            nome: paciente.nome?.toUpperCase() || '',
            data_nascimento: paciente.data_nascimento,
            timestamp: Date.now(),
            source: 'download' as const
          };
          
          await store.put(cacheEntry);
        }
      }
      
      await tx.done;
      console.log(`📥 ${pacientes.length} pacientes salvos no cache para verificação`);
      
    } catch (error) {
      console.error('❌ Erro ao salvar pacientes no cache:', error);
      throw error;
    }
  }

  // ✅ CORRIGIDO: Salvar paciente criado localmente (deve ser sincronizado)
  async savePaciente(paciente: any): Promise<number> {
    await this.init();
    
    try {
      if (!paciente.idpaciente) {
        paciente.idpaciente = -Date.now();
      }
      
      if (paciente.nome) {
        paciente.nome = paciente.nome.toUpperCase();
      }
      
      // ✅ IMPORTANTE: Marcar como criado localmente para sincronização
      paciente.synced = 'false';
      paciente.source = 'local_creation'; // ✅ NOVO: Indicar origem
      paciente.savedAt = Date.now();
      
      await this.db!.put('pacientes', paciente);
      console.log(`👤 Paciente criado localmente: ${paciente.nome} (ID: ${paciente.idpaciente})`);
      return paciente.idpaciente;
      
    } catch (error) {
      console.error('❌ Erro ao salvar paciente:', error);
      throw error;
    }
  }

  // ✅ CORRIGIDO: Verificação de CPF melhorada
  async checkCpfExists(cpf: string): Promise<boolean> {
    await this.init();
    
    if (!cpf || cpf.length !== 11) return false;
    
    try {
      // ✅ 1. Verificar no cache de verificação PRIMEIRO (mais rápido)
      const cpfInCache = await this.db!.get('pacientes_cache', cpf);
      if (cpfInCache) {
        console.log('✅ CPF encontrado no cache de verificação');
        return true;
      }
      
      // ✅ 2. Verificar nos pacientes criados localmente
      const pacienteLocal = await this.db!.getFromIndex('pacientes', 'by-cpf', cpf);
      if (pacienteLocal) {
        console.log('✅ CPF encontrado em pacientes locais');
        return true;
      }
      
      // ✅ 3. Busca manual como fallback
      const allPacientes = await this.db!.getAll('pacientes');
      const foundInPatients = allPacientes.some(paciente => paciente.cpf === cpf);
      
      if (foundInPatients) {
        console.log('✅ CPF encontrado via busca manual');
        return true;
      }
      
      console.log('ℹ️ CPF não encontrado em nenhum cache');
      return false;
      
    } catch (error) {
      console.warn('⚠️ Erro na verificação de CPF, usando busca manual:', error);
      
      try {
        const allPacientes = await this.db!.getAll('pacientes');
        return allPacientes.some(paciente => paciente.cpf === cpf);
      } catch (fallbackError) {
        console.error('❌ Erro no fallback de verificação:', fallbackError);
        return false;
      }
    }
  }

  // ✅ CORRIGIDO: Contar apenas pacientes criados localmente
  async getPendingCount(): Promise<{ notificacoes: number; pacientes: number }> {
    await this.init();
    
    try {
      const pendingNotificacoes = await this.getPendingNotificacoes();
      
      // ✅ IMPORTANTE: Apenas pacientes com source = 'local_creation'
      let unsyncedPacientes: any[] = [];
      try {
        const allLocalPatients = await this.db!.getAllFromIndex('pacientes', 'by-synced', 'false');
        
        // ✅ Filtrar apenas os criados localmente
        unsyncedPacientes = allLocalPatients.filter(p => 
          p.source === 'local_creation' || 
          (p.synced === 'false' && !p.source) // Compatibilidade com dados antigos
        );
        
      } catch (error) {
        console.warn('Erro ao usar índice, usando busca manual:', error);
        const allPacientes = await this.db!.getAll('pacientes');
        unsyncedPacientes = allPacientes.filter(p => 
          (p.synced === 'false' || p.synced === false || p.synced === undefined) &&
          (p.source === 'local_creation' || !p.source) // Apenas criados localmente
        );
      }
      
      console.log(`📊 Pendentes: ${pendingNotificacoes.length} notificações, ${unsyncedPacientes.length} pacientes locais`);
      
      return {
        notificacoes: pendingNotificacoes.length,
        pacientes: unsyncedPacientes.length
      };
      
    } catch (error) {
      console.error('Erro ao obter contadores:', error);
      return { notificacoes: 0, pacientes: 0 };
    }
  }

  // ✅ CORRIGIDO: Apenas pacientes criados localmente
  async getUnsyncedPacientes(): Promise<any[]> {
    await this.init();
    try {
      const allLocalPatients = await this.db!.getAllFromIndex('pacientes', 'by-synced', 'false');
      
      // ✅ FILTRAR apenas os criados localmente
      return allLocalPatients.filter(p => 
        p.source === 'local_creation' || 
        (p.synced === 'false' && !p.source) // Compatibilidade
      );
      
    } catch (error) {
      console.warn('Erro ao usar índice, usando busca manual:', error);
      const allPacientes = await this.db!.getAll('pacientes');
      return allPacientes.filter(p => 
        (p.synced === 'false' || p.synced === false || p.synced === undefined) &&
        (p.source === 'local_creation' || !p.source)
      );
    }
  }

  // ✅ NOVO: Busca melhorada incluindo cache
  async searchPacientesExtended(query: string): Promise<any[]> {
    await this.init();
    
    const searchTerm = query.toLowerCase();
    const results: any[] = [];
    
    try {
      // ✅ 1. Buscar no cache de verificação
      const allCacheEntries = await this.db!.getAll('pacientes_cache');
      const cacheResults = allCacheEntries.filter(entry => 
        entry.nome.toLowerCase().includes(searchTerm) ||
        entry.cpf.includes(query)
      );
      
      // Converter para formato compatível
      cacheResults.forEach(entry => {
        results.push({
          idpaciente: `cache_${entry.cpf}`, // ID único para cache
          nome: entry.nome,
          cpf: entry.cpf,
          data_nascimento: entry.data_nascimento,
          source: 'cache' // Indicar origem
        });
      });
      
      // ✅ 2. Buscar em pacientes locais
      const allPacientes = await this.db!.getAll('pacientes');
      const localResults = allPacientes.filter(paciente => 
        (paciente.nome && paciente.nome.toLowerCase().includes(searchTerm)) ||
        (paciente.cpf && paciente.cpf.includes(query)) ||
        (paciente.nome_mae && paciente.nome_mae.toLowerCase().includes(searchTerm))
      );
      
      // Adicionar pacientes locais
      localResults.forEach(paciente => {
        results.push({
          ...paciente,
          source: paciente.source || 'local'
        });
      });
      
      console.log(`🔍 Busca '${query}': ${cacheResults.length} no cache, ${localResults.length} locais`);
      
      return results;
      
    } catch (error) {
      console.error('❌ Erro na busca estendida:', error);
      return [];
    }
  }

  // ===== MÉTODOS EXISTENTES (não mexer) =====
  
  async getNotificacao(id: number): Promise<FormData | null> {
    await this.init();
    const notificacao = await this.db!.get('notificacoes', id);
    return notificacao ? notificacao.formData : null;
  }

  async getPendingNotificacoes(): Promise<Array<{ id: number; formData: FormData }>> {
    await this.init();
    const pending = await this.db!.getAllFromIndex('notificacoes', 'by-sync-status', 'pending');
    return pending.map(item => ({ id: item.id as number, formData: item.formData }));
  }

  async markNotificacaoAsSynced(id: number): Promise<void> {
    await this.init();
    const notificacao = await this.db!.get('notificacoes', id);
    if (notificacao) {
      notificacao.syncStatus = 'synced';
      await this.db!.put('notificacoes', notificacao);
    }
  }

  async markPacienteAsSynced(idpaciente: number): Promise<void> {
    await this.init();
    const paciente = await this.db!.get('pacientes', idpaciente);
    if (paciente) {
      paciente.synced = 'true';
      paciente.syncedAt = Date.now();
      await this.db!.put('pacientes', paciente);
    }
  }

  async saveOpcoes(tipo: string, data: any[]): Promise<void> {
    await this.init();
    await this.db!.put('opcoes', { tipo, data, timestamp: Date.now() });
  }

  async getOpcoes(tipo: string): Promise<any[] | null> {
    await this.init();
    const opcoes = await this.db!.get('opcoes', tipo);
    
    if (opcoes && (Date.now() - opcoes.timestamp) < CACHE_DURATION) {
      return opcoes.data;
    }
    
    return null;
  }

  async cleanup(): Promise<void> {
    await this.init();
    
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const allNotificacoes = await this.db!.getAll('notificacoes');
    const oldSyncedNotificacoes = allNotificacoes.filter(n => 
      n.syncStatus === 'synced' && n.timestamp < thirtyDaysAgo
    );
    
    const tx = this.db!.transaction('notificacoes', 'readwrite');
    for (const n of oldSyncedNotificacoes) {
      if (n.id) await tx.store.delete(n.id);
    }
    await tx.done;
  }

  async getAll(storeName: 'notificacoes' | 'opcoes' | 'pacientes'): Promise<any[]> {
    await this.init();
    
    try {
      return await this.db!.getAll(storeName);
    } catch (error) {
      console.error(`❌ Erro ao obter dados de ${storeName}:`, error);
      return [];
    }
  }

  async clear(storeName: 'notificacoes' | 'opcoes' | 'pacientes' | 'pacientes_cache'): Promise<void> {
    await this.init();
    
    try {
      const tx = this.db!.transaction(storeName, 'readwrite');
      await tx.store.clear();
      await tx.done;
      console.log(`🗑️ Store ${storeName} limpo com sucesso`);
    } catch (error) {
      console.error(`❌ Erro ao limpar store ${storeName}:`, error);
      throw error;
    }
  }

  // ✅ NOVO: Limpar apenas cache de verificação
  async clearPacientesCache(): Promise<void> {
    await this.clear('pacientes_cache');
    console.log('🗑️ Cache de pacientes limpo');
  }
  // ✅ NOVO: Obter estatísticas do cache
  async getCacheStats(): Promise<{
    verificacao: number;
    locais: number;
    pendentes: number;
  }> {
    await this.init();
    
    try {
      const cacheEntries = await this.db!.getAll('pacientes_cache');
      const localPatients = await this.db!.getAll('pacientes');
      const unsyncedLocal = localPatients.filter(p => 
        p.synced === 'false' && (p.source === 'local_creation' || !p.source)
      );
      
      return {
        verificacao: cacheEntries.length,
        locais: localPatients.length,
        pendentes: unsyncedLocal.length
      };
      
    } catch (error) {
      console.error('Erro ao obter stats:', error);
      return { verificacao: 0, locais: 0, pendentes: 0 };
    }
  }
  // ✅ HELPERS para CPF Cache (conforme solicitado) 
  async checkCpfExistsInCache(cpf: string): Promise<boolean> {
    await this.init();
    
    if (!cpf || cpf.length !== 11) return false;
    
    try {
      const rec = await this.db!.get('cpfs_cache', cpf);
      return !!rec;
    } catch (error) {
      console.error('❌ Erro ao verificar CPF no cache:', error);
      return false;
    }
  }

  async saveCpfCache(cpf: string): Promise<void> {
    await this.init();
    
    if (!cpf || cpf.length !== 11) return;
    
    try {
      await this.db!.put('cpfs_cache', { 
        cpf, 
        when: Date.now() 
      });
      console.log(`✅ CPF ${cpf} salvo no cache`);
    } catch (error) {
      console.error('❌ Erro ao salvar CPF no cache:', error);
      throw error;
    }
  }

  // ✅ NOVO: Salvar múltiplos CPFs em lote
  async saveCpfsCacheBatch(cpfs: string[]): Promise<void> {
    await this.init();
    
    try {
      const tx = this.db!.transaction(['cpfs_cache'], 'readwrite');
      const store = tx.objectStore('cpfs_cache');
      
      for (const cpf of cpfs) {
        if (cpf && cpf.length === 11) {
          await store.put({ 
            cpf, 
            when: Date.now() 
          });
        }
      }
      
      await tx.done;
      console.log(`✅ ${cpfs.length} CPFs salvos no cache em lote`);
      
    } catch (error) {
      console.error('❌ Erro ao salvar CPFs em lote:', error);
      throw error;
    }
  }

  // ✅ NOVO: Limpar cache de CPFs
  async clearCpfsCache(): Promise<void> {
    await this.init();
    
    try {
      const tx = this.db!.transaction('cpfs_cache', 'readwrite');
      await tx.store.clear();
      await tx.done;
      console.log('🗑️ Cache de CPFs limpo com sucesso');
    } catch (error) {
      console.error('❌ Erro ao limpar cache de CPFs:', error);
      throw error;
    }
  }

  // ✅ NOVO: Obter todos os CPFs do cache
  async getAllCpfsFromCache(): Promise<string[]> {
    await this.init();
    
    try {
      const allCpfs = await this.db!.getAll('cpfs_cache');
      return allCpfs.map(item => item.cpf);
    } catch (error) {
      console.error('❌ Erro ao obter CPFs do cache:', error);
      return [];
    }
  }

  // ✅ NOVO: Contar CPFs no cache
  async getCpfsCacheCount(): Promise<number> {
    await this.init();
    
    try {
      const count = await this.db!.count('cpfs_cache');
      return count;
    } catch (error) {
      console.error('❌ Erro ao contar CPFs no cache:', error);
      return 0;
    }
  }
}

const indexedDBService = new IndexedDBService();
export default indexedDBService;