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
      isEdit?: boolean; // ✅ Propriedade para distinguir edição
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
  };  // ✅ Store específico para cache de CPFs
  cpfs_cache: {
    key: string; // CPF como chave
    value: {
      cpf: string;
      when: number;
    };
  };
  // ✅ NOVO: Store para estabelecimentos criados localmente
  estabelecimentos: {
    key: number;
    value: any;
    indexes: { 'by-nome': string; 'by-cnes': string; 'by-synced': string; 'by-source': string };
  };
  // ✅ NOVO: Store para cache de verificação de estabelecimentos
  estabelecimentos_cache: {
    key: string; // CNES como chave
    value: {
      cnes: string;
      nome: string;
      tipo_estabelecimento?: string;
      municipio?: string;
      timestamp: number;
      source: 'download' | 'api';
    };
  };
}

const DB_VERSION = 4; // ✅ INCREMENTAR versão para nova estrutura
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
          }          // ✅ NOVO: Store específico para cache de CPFs
          if (!db.objectStoreNames.contains('cpfs_cache')) {
            console.log('🆕 Criando store: cpfs_cache');
            db.createObjectStore('cpfs_cache', {
              keyPath: 'cpf'
            });
          }

          // ✅ NOVO: Store para estabelecimentos (dados criados localmente)
          if (!db.objectStoreNames.contains('estabelecimentos')) {
            console.log('🆕 Criando store: estabelecimentos');
            const estabelecimentosStore = db.createObjectStore('estabelecimentos', {
              keyPath: 'id'
            });
            estabelecimentosStore.createIndex('by-nome', 'nome');
            estabelecimentosStore.createIndex('by-cnes', 'cnes');
            estabelecimentosStore.createIndex('by-synced', 'synced');
            estabelecimentosStore.createIndex('by-source', 'source');
          }

          // ✅ NOVO: Store para cache de verificação de estabelecimentos
          if (!db.objectStoreNames.contains('estabelecimentos_cache')) {
            console.log('🆕 Criando store: estabelecimentos_cache');
            db.createObjectStore('estabelecimentos_cache', {
              keyPath: 'cnes'
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
      // ✅ CORREÇÃO: Criar uma cópia profunda dos dados para evitar perda de propriedades
      const formDataCopy = JSON.parse(JSON.stringify(formData));
      
      let notificacao;
      
      if (isEdit && id) {
        notificacao = {
          id,
          formData: formDataCopy,
          syncStatus: 'pending' as const,
          timestamp: Date.now(),
          isEdit: true
        };
      } else {
        const tempId = await this.generateTemporaryId();
        notificacao = {
          id: tempId,
          formData: formDataCopy, 
          syncStatus: 'pending' as const,
          timestamp: Date.now(),
          isEdit: false
        };
      }

      // ✅ LOG DETALHADO PARA DEBUG DO MODO OFFLINE
      console.log(`💾 [INDEXEDDB] Salvando notificação offline:`, {
        id: notificacao.id,
        isEdit: isEdit,
        // Campos críticos para verificação
        localHospedagem: formDataCopy.localHospedagem,
        contatoLocal: formDataCopy.contatoLocal,
        uf: formDataCopy.uf,
        municipio: formDataCopy.municipio,
        bairro: formDataCopy.bairro,
        paisProcedencia: formDataCopy.paisProcedencia,
        residenteBelem: formDataCopy.residenteBelem,
        totalCampos: Object.keys(formDataCopy).length
      });

      await this.db!.put('notificacoes', notificacao);
      console.log(`✅ [INDEXEDDB] Notificação salva offline com sucesso: ID ${notificacao.id}`);
      return notificacao.id;
      
    } catch (error) {
      console.error('❌ [INDEXEDDB] Erro ao salvar notificação:', error);
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
  async getPendingCount(): Promise<{ notificacoes: number; pacientes: number; estabelecimentos: number }> {
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

      // ✅ NOVO: Estabelecimentos
      let unsyncedEstabelecimentos: any[] = [];
      try {
        const allLocalEstabelecimentos = await this.db!.getAllFromIndex('estabelecimentos', 'by-synced', 'false');
        unsyncedEstabelecimentos = allLocalEstabelecimentos.filter(e => 
          e.source === 'local_creation' || 
          (e.synced === 'false' && !e.source)
        );
      } catch (error) {
        console.warn('Erro ao usar índice estabelecimentos:', error);
        const allEstabelecimentos = await this.db!.getAll('estabelecimentos');
        unsyncedEstabelecimentos = allEstabelecimentos.filter(e => 
          (e.synced === 'false' || e.synced === false || e.synced === undefined) &&
          (e.source === 'local_creation' || !e.source)
        );
      }
      
      console.log(`📊 Pendentes: ${pendingNotificacoes.length} notificações, ${unsyncedPacientes.length} pacientes locais, ${unsyncedEstabelecimentos.length} estabelecimentos`);
      
      return {
        notificacoes: pendingNotificacoes.length,
        pacientes: unsyncedPacientes.length,
        estabelecimentos: unsyncedEstabelecimentos.length
      };
      
    } catch (error) {
      console.error('Erro ao obter contadores:', error);
      return { notificacoes: 0, pacientes: 0, estabelecimentos: 0 };
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
  async markPacienteAsSynced(idpaciente: number, serverId?: number): Promise<void> {
    await this.init();
    
    try {
      const paciente = await this.db!.get('pacientes', idpaciente);
      if (paciente) {
        // ✅ ATUALIZAR com informações de sincronização
        paciente.synced = 'true';
        paciente.syncedAt = Date.now();
        
        // ✅ SALVAR ID do servidor se fornecido (para referência)
        if (serverId) {
          paciente.serverIdpaciente = serverId;
          console.log(`📋 Mapeamento salvo: ID local ${idpaciente} → servidor ${serverId}`);
        }
        
        await this.db!.put('pacientes', paciente);
        console.log(`✅ Paciente ${idpaciente} marcado como sincronizado`);
        
      } else {
        console.warn(`⚠️ Paciente ${idpaciente} não encontrado para marcar como sincronizado`);
      }
      
    } catch (error) {
      console.error('❌ Erro ao marcar paciente como sincronizado:', error);
      throw error;
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

  // 🆕 FUNÇÃO: Obter eventos ativos com filtro de município (se necessário)
  async getEventosAtivos(municipioId?: number): Promise<any[]> {
    await this.init();
    const eventos = await this.getOpcoes('eventos') || [];
    
    // Filtrar apenas eventos ativos
    let eventosAtivos = eventos.filter((evento: any) => {
      return evento.ativo === undefined || evento.ativo === 'S' || evento.ativo === '1' || evento.ativo === true;
    });
    
    // Se foi passado um municipioId, filtrar pela abrangência
    if (municipioId) {
      eventosAtivos = eventosAtivos.filter((evento: any) => {
        if (!evento.abrangencia || !Array.isArray(evento.abrangencia)) {
          return true; // Se não tem abrangência definida, considera disponível para todos
        }
        
        return evento.abrangencia.some((abr: any) => 
          abr.municipio?.idtipo_municipio === municipioId
        );
      });
    }
    
    return eventosAtivos;
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
  }  // ✅ NOVO: Obter estatísticas do cache
  async getCacheStats(): Promise<{
    verificacao: number;
    locais: number;
    pendentes: number;
    estabelecimentos_verificacao: number;
    estabelecimentos_locais: number;
    estabelecimentos_pendentes: number;
  }> {
    await this.init();
    
    try {
      const cacheEntries = await this.db!.getAll('pacientes_cache');
      const localPatients = await this.db!.getAll('pacientes');
      const unsyncedLocal = localPatients.filter(p => 
        p.synced === 'false' && (p.source === 'local_creation' || !p.source)
      );
      
      // ✅ NOVO: Stats de estabelecimentos
      const estabelecimentosCacheEntries = await this.db!.getAll('estabelecimentos_cache');
      const localEstabelecimentos = await this.db!.getAll('estabelecimentos');
      const unsyncedEstabelecimentos = localEstabelecimentos.filter(e => 
        e.synced === 'false' && (e.source === 'local_creation' || !e.source)
      );
      
      return {
        verificacao: cacheEntries.length,
        locais: localPatients.length,
        pendentes: unsyncedLocal.length,
        estabelecimentos_verificacao: estabelecimentosCacheEntries.length,
        estabelecimentos_locais: localEstabelecimentos.length,
        estabelecimentos_pendentes: unsyncedEstabelecimentos.length
      };
      
    } catch (error) {
      console.error('Erro ao obter stats:', error);
      return { 
        verificacao: 0, 
        locais: 0, 
        pendentes: 0,
        estabelecimentos_verificacao: 0,
        estabelecimentos_locais: 0,
        estabelecimentos_pendentes: 0
      };
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

  // ===== ESTABELECIMENTOS MÉTODOS =====

  // ✅ NOVO: Salvar estabelecimentos baixados para cache (não sincronizar)
  async saveEstabelecimentosParaCache(estabelecimentos: any[]): Promise<void> {
    await this.init();
    
    try {
      const tx = this.db!.transaction(['estabelecimentos_cache'], 'readwrite');
      const store = tx.objectStore('estabelecimentos_cache');
      
      for (const estabelecimento of estabelecimentos) {
        if (estabelecimento.cnes) {
          const cacheEntry = {
            cnes: estabelecimento.cnes,
            nome: estabelecimento.nome?.toUpperCase() || '',
            tipo_estabelecimento: estabelecimento.tipo_estabelecimento,
            municipio: estabelecimento.municipio,
            timestamp: Date.now(),
            source: 'download' as const
          };
          
          await store.put(cacheEntry);
        }
      }
      
      await tx.done;
      console.log(`📥 ${estabelecimentos.length} estabelecimentos salvos no cache para verificação`);
      
    } catch (error) {
      console.error('❌ Erro ao salvar estabelecimentos no cache:', error);
      throw error;
    }
  }

  // ✅ NOVO: Salvar estabelecimento criado localmente (deve ser sincronizado)
  async saveEstabelecimento(estabelecimento: any): Promise<number> {
    await this.init();
    
    try {
      if (!estabelecimento.id) {
        estabelecimento.id = -Date.now();
      }
      
      if (estabelecimento.nome) {
        estabelecimento.nome = estabelecimento.nome.toUpperCase();
      }
      
      // ✅ IMPORTANTE: Marcar como criado localmente para sincronização
      estabelecimento.synced = 'false';
      estabelecimento.source = 'local_creation';
      estabelecimento.savedAt = Date.now();
      
      await this.db!.put('estabelecimentos', estabelecimento);
      console.log(`🏥 Estabelecimento criado localmente: ${estabelecimento.nome} (ID: ${estabelecimento.id})`);
      return estabelecimento.id;
      
    } catch (error) {
      console.error('❌ Erro ao salvar estabelecimento:', error);
      throw error;
    }
  }

  // ✅ NOVO: Verificação de CNES
  async checkCNESExists(cnes: string): Promise<boolean> {
    await this.init();
    
    if (!cnes || cnes.length !== 7) return false;
    
    try {
      // 1. Verificar no cache de verificação PRIMEIRO
      const cnesInCache = await this.db!.get('estabelecimentos_cache', cnes);
      if (cnesInCache) {
        console.log('✅ CNES encontrado no cache de verificação');
        return true;
      }
      
      // 2. Verificar nos estabelecimentos criados localmente
      const estabelecimentoLocal = await this.db!.getFromIndex('estabelecimentos', 'by-cnes', cnes);
      if (estabelecimentoLocal) {
        console.log('✅ CNES encontrado em estabelecimentos locais');
        return true;
      }
      
      // 3. Busca manual como fallback
      const allEstabelecimentos = await this.db!.getAll('estabelecimentos');
      const foundInEstabelecimentos = allEstabelecimentos.some(est => est.cnes === cnes);
      
      if (foundInEstabelecimentos) {
        console.log('✅ CNES encontrado via busca manual');
        return true;
      }
      
      console.log('ℹ️ CNES não encontrado em nenhum cache');
      return false;
      
    } catch (error) {
      console.warn('⚠️ Erro na verificação de CNES, usando busca manual:', error);
      
      try {
        const allEstabelecimentos = await this.db!.getAll('estabelecimentos');
        return allEstabelecimentos.some(est => est.cnes === cnes);
      } catch (fallbackError) {
        console.error('❌ Erro no fallback de verificação:', fallbackError);
        return false;
      }
    }
  }

  // ✅ NOVO: Busca estendida de estabelecimentos
  async searchEstabelecimentosExtended(query: string): Promise<any[]> {
    await this.init();
    
    const searchTerm = query.toLowerCase();
    const results: any[] = [];
    
    try {
      // 1. Buscar no cache de verificação
      const allCacheEntries = await this.db!.getAll('estabelecimentos_cache');
      const cacheResults = allCacheEntries.filter(entry => 
        entry.nome.toLowerCase().includes(searchTerm) ||
        entry.cnes.includes(query) ||
        (entry.municipio && entry.municipio.toLowerCase().includes(searchTerm))
      );
      
      // Converter para formato compatível
      cacheResults.forEach(entry => {
        results.push({
          id: `cache_${entry.cnes}`,
          nome: entry.nome,
          cnes: entry.cnes,
          tipo_estabelecimento: entry.tipo_estabelecimento,
          municipio: entry.municipio,
          source: 'cache'
        });
      });
      
      // 2. Buscar em estabelecimentos locais
      const allEstabelecimentos = await this.db!.getAll('estabelecimentos');
      const localResults = allEstabelecimentos.filter(estabelecimento => 
        (estabelecimento.nome && estabelecimento.nome.toLowerCase().includes(searchTerm)) ||
        (estabelecimento.cnes && estabelecimento.cnes.includes(query)) ||
        (estabelecimento.municipio && estabelecimento.municipio.toLowerCase().includes(searchTerm))
      );
      
      // Adicionar estabelecimentos locais
      localResults.forEach(estabelecimento => {
        results.push({
          ...estabelecimento,
          source: estabelecimento.source || 'local'
        });
      });
      
      console.log(`🔍 Busca '${query}': ${cacheResults.length} no cache, ${localResults.length} locais`);
      
      return results;
      
    } catch (error) {
      console.error('❌ Erro na busca estendida de estabelecimentos:', error);
      return [];
    }
  }

  // ✅ NOVO: Contar estabelecimentos pendentes
  async getUnsyncedEstabelecimentos(): Promise<any[]> {
    await this.init();
    try {
      const allLocalEstabelecimentos = await this.db!.getAllFromIndex('estabelecimentos', 'by-synced', 'false');
      
      // Filtrar apenas os criados localmente
      return allLocalEstabelecimentos.filter(e => 
        e.source === 'local_creation' || 
        (e.synced === 'false' && !e.source)
      );
      
    } catch (error) {
      console.warn('Erro ao usar índice, usando busca manual:', error);
      const allEstabelecimentos = await this.db!.getAll('estabelecimentos');
      return allEstabelecimentos.filter(e => 
        (e.synced === 'false' || e.synced === false || e.synced === undefined) &&
        (e.source === 'local_creation' || !e.source)
      );
    }
  }

  // ✅ NOVO: Marcar estabelecimento como sincronizado
  async markEstabelecimentoAsSynced(id: number, serverId?: number): Promise<void> {
    await this.init();
    
    try {
      const estabelecimento = await this.db!.get('estabelecimentos', id);
      if (estabelecimento) {
        estabelecimento.synced = 'true';
        estabelecimento.syncedAt = Date.now();
        
        if (serverId) {
          estabelecimento.serverId = serverId;
          console.log(`📋 Mapeamento salvo: ID local ${id} → servidor ${serverId}`);
        }
        
        await this.db!.put('estabelecimentos', estabelecimento);
        console.log(`✅ Estabelecimento ${id} marcado como sincronizado`);
        
      } else {
        console.warn(`⚠️ Estabelecimento ${id} não encontrado para marcar como sincronizado`);
      }
      
    } catch (error) {
      console.error('❌ Erro ao marcar estabelecimento como sincronizado:', error);
      throw error;
    }
  }

  // ✅ NOVO: Limpar cache de estabelecimentos
  async clearEstabelecimentosCache(): Promise<void> {
    await this.init();
    
    try {
      const tx = this.db!.transaction('estabelecimentos_cache', 'readwrite');
      await tx.store.clear();
      await tx.done;
      console.log('🗑️ Cache de estabelecimentos limpo com sucesso');
    } catch (error) {
      console.error('❌ Erro ao limpar cache de estabelecimentos:', error);
      throw error;
    }
  }

  // ✅ NOVO: Buscar estabelecimento por ID
  async getEstabelecimento(id: number): Promise<any | null> {
    await this.init();
    
    try {
      const estabelecimento = await this.db!.get('estabelecimentos', id);
      return estabelecimento || null;
    } catch (error) {
      console.error('Erro ao buscar estabelecimento:', error);
      return null;
    }
  }
}

const indexedDBService = new IndexedDBService();
export default indexedDBService;