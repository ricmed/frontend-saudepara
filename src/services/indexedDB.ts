import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { FormData } from '@/features/notificationForms/types/index2';
import { deviceIdService } from './deviceIdService'; // ✅ NOVO: Import do serviço de Device ID

// ✅ CORRIGIDO: Interface melhorada para distinguir dados
interface NotificacaoDatabase extends DBSchema {
  notificacoes: {
    key: string; // ✅ MUDANÇA: Agora usa offlineId como chave (string)
    value: {
      id: number;
      offlineId: string; // ✅ NOVO: ID único da notificação offline
      deviceId: string; // ✅ NOVO: ID do dispositivo
      formData: FormData;
      syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
      timestamp: number;
      createdOffline: boolean; // ✅ NOVO: Flag se foi criada offline
      sincronizado: boolean; // ✅ NOVO: Flag de controle de sincronização
      syncedAt?: number; // ✅ NOVO: Timestamp da sincronização
      isEdit?: boolean;
      syncStartedAt?: number;
      errorInfo?: {
        message: string;
        timestamp: number;
        retryCount?: number;
        lastError?: string;
      };
    };
    indexes: { 
      'by-sync-status': string;
      'by-device-id': string; // ✅ NOVO
      'by-offline-id': string; // ✅ NOVO
      'by-sincronizado': string; // ✅ CORRIGIDO: string ao invés de boolean
    };
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
      idpaciente: number; // ✅ ID do servidor
      nome: string;
      nome_mae?: string; // ✅ Adicionar nome da mãe
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

const DB_VERSION = 5; // ✅ VERSÃO 5: Nova estrutura com offlineId, deviceId, sincronizado
const DB_NAME = 'NotificacaoOfflineDB';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias

export class IndexedDBService {
  private db: IDBPDatabase<NotificacaoDatabase> | null = null;

  /**
   * 🆕 Verifica e limpa versões antigas do IndexedDB
   * Se detectar versão < 5, deleta o banco inteiro para garantir estrutura limpa
   */
  private async checkAndCleanOldVersions(): Promise<void> {
    try {
      // Tentar abrir o banco sem especificar versão para ver qual versão existe
      const request = indexedDB.open(DB_NAME);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const currentVersion = db.version;
          db.close();
          
          console.log(`📊 Versão atual do IndexedDB: ${currentVersion}`);
          
          // Se versão antiga detectada, deletar banco
          if (currentVersion < DB_VERSION) {
            console.warn(`⚠️ Versão antiga detectada (v${currentVersion}). Limpando banco para v${DB_VERSION}...`);
            
            const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
            
            deleteRequest.onsuccess = () => {
              console.log('✅ Banco de dados antigo deletado com sucesso!');
              console.log('🔄 Nova versão será criada na próxima inicialização...');
              resolve();
            };
            
            deleteRequest.onerror = (err) => {
              console.error('❌ Erro ao deletar banco antigo:', err);
              reject(err);
            };
            
            deleteRequest.onblocked = () => {
              console.warn('⚠️ Deleção bloqueada. Feche todas as abas e tente novamente.');
              // Continua mesmo bloqueado - upgrade tentará migrar
              resolve();
            };
          } else {
            console.log('✅ Versão do banco está atualizada');
            resolve();
          }
        };
        
        request.onerror = () => {
          console.log('ℹ️ Banco não existe ainda, será criado na v5');
          resolve(); // Não é erro, apenas não existe
        };
      });
    } catch (error) {
      console.error('❌ Erro ao verificar versão do banco:', error);
      // Não bloqueia inicialização
    }
  }

  async init(): Promise<void> {
    if (this.db) return;

    try {
      console.log(`🔧 Inicializando IndexedDB: ${DB_NAME} v${DB_VERSION}`);
      
      // 🆕 VERIFICAR E LIMPAR VERSÕES ANTIGAS
      await this.checkAndCleanOldVersions();
      
      this.db = await openDB<NotificacaoDatabase>(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion) {
          console.log(`📈 Upgrade DB: v${oldVersion} → v${newVersion}`);
          
          // Store para notificações
          if (!db.objectStoreNames.contains('notificacoes')) {
            console.log('🆕 Criando store: notificacoes');
            const notificacoesStore = db.createObjectStore('notificacoes', {
              keyPath: 'offlineId' // ✅ NOVO: Usar offlineId como chave
            });
            notificacoesStore.createIndex('by-sync-status', 'syncStatus');
            notificacoesStore.createIndex('by-device-id', 'deviceId'); // ✅ NOVO
            notificacoesStore.createIndex('by-offline-id', 'offlineId'); // ✅ NOVO
            notificacoesStore.createIndex('by-sincronizado', 'sincronizado'); // ✅ NOVO
          } else if (oldVersion < 5) {
            // ✅ Migração para versão 5: adicionar novos índices e migrar dados
            console.log('🔄 Migrando notificações para v5 com offlineId...');
            const tx = (db as any).transaction.objectStore('notificacoes');
            
            // Criar novos índices se não existirem
            if (!tx.indexNames.contains('by-device-id')) {
              tx.createIndex('by-device-id', 'deviceId');
            }
            if (!tx.indexNames.contains('by-offline-id')) {
              tx.createIndex('by-offline-id', 'offlineId');
            }
            if (!tx.indexNames.contains('by-sincronizado')) {
              tx.createIndex('by-sincronizado', 'sincronizado');
            }
            
            console.log('✅ Índices v5 criados. ATENÇÃO: Dados antigos podem precisar migração manual.');
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
      
      // ✅ NOVO: Gerar deviceId uma única vez
      const deviceId = await deviceIdService.getDeviceId();
      
      // ✅ CORREÇÃO DUPLICATAS: Verificar se já existe um offlineId no formData (para evitar criar duplicata)
      let offlineId: string;
      let existingNotificacao: any = null;
      
      // Se o formData já tem offlineId (retry ou múltiplas chamadas), REUSAR
      if ((formDataCopy as any).offline_id || (formDataCopy as any).offlineId) {
        offlineId = (formDataCopy as any).offline_id || (formDataCopy as any).offlineId;
        
        // Verificar se essa notificação já existe no banco
        existingNotificacao = await this.db!.get('notificacoes', offlineId);
        
        if (existingNotificacao && !isEdit) {
          console.warn(`⚠️ [DUPLICATA DETECTADA] Notificação com offlineId ${offlineId} já existe! Atualizando ao invés de criar nova.`);
        }
      } else {
        // Gerar novo offlineId apenas se não existir
        offlineId = await deviceIdService.generateOfflineId();
        
        // Salvar offlineId no formData para futuras referências
        (formDataCopy as any).offline_id = offlineId;
      }
      
      let notificacao;
      
      if (isEdit && id) {
        // ✅ EDIÇÃO: Buscar notificação existente pelo ID ou offlineId
        if (existingNotificacao) {
          // Atualizar notificação existente
          notificacao = {
            ...existingNotificacao,
            formData: formDataCopy,
            timestamp: Date.now(),
            syncStatus: 'pending' as const,
            sincronizado: false
          };
        } else {
          // Criar nova entrada de edição
          notificacao = {
            id,
            offlineId,
            deviceId,
            formData: formDataCopy,
            syncStatus: 'pending' as const,
            timestamp: Date.now(),
            createdOffline: true,
            sincronizado: false,
            isEdit: true
          };
        }
      } else {
        // ✅ CRIAÇÃO: Se já existe, ATUALIZAR ao invés de criar duplicata
        if (existingNotificacao) {
          console.log(`🔄 [ANTI-DUPLICATA] Atualizando notificação existente offlineId ${offlineId}`);
          notificacao = {
            ...existingNotificacao,
            formData: formDataCopy,
            timestamp: Date.now(),
            syncStatus: 'pending' as const,
            sincronizado: false
          };
        } else {
          // Criar nova notificação
          const tempId = await this.generateTemporaryId();
          notificacao = {
            id: tempId,
            offlineId,
            deviceId,
            formData: formDataCopy, 
            syncStatus: 'pending' as const,
            timestamp: Date.now(),
            createdOffline: true,
            sincronizado: false,
            isEdit: false
          };
        }
      }

      // ✅ LOG DETALHADO PARA DEBUG DO MODO OFFLINE
      console.log(`💾 [INDEXEDDB] Salvando notificação offline:`, {
        id: notificacao.id,
        offlineId: notificacao.offlineId, // ✅ NOVO LOG
        deviceId: notificacao.deviceId, // ✅ NOVO LOG
        isEdit: isEdit,
        sincronizado: notificacao.sincronizado, // ✅ NOVO LOG
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

      // ✅ DEBUG ESPECÍFICO: Log dos campos de trauma no IndexedDB
      console.log('🩹 [DEBUG TRAUMA] Campos de trauma salvos no IndexedDB:', {
        tipoTrauma: formDataCopy.tipoTrauma,
        observacaoTrauma: formDataCopy.observacaoTrauma,
        observacaoSintomas: formDataCopy.observacaoSintomas,
        observacaoHipotese: formDataCopy.observacaoHipotese,
        observacaoIncidente: formDataCopy.observacaoIncidente
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
            idpaciente: paciente.idpaciente, // ✅ SALVAR ID DO SERVIDOR
            nome: paciente.nome?.toUpperCase() || '',
            nome_mae: paciente.nome_mae?.toUpperCase() || '', // ✅ ADICIONAR NOME DA MÃE
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
  async getPendingCount(): Promise<{ notificacoes: number; pacientes: number; estabelecimentos: number; errors: number }> {
    await this.init();
    
    try {
      const pendingNotificacoes = await this.getPendingNotificacoes();
      const errorNotificacoes = await this.getErrorNotificacoes();
      
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
      
      console.log(`📊 Pendentes: ${pendingNotificacoes.length} notificações, ${errorNotificacoes.length} com erro, ${unsyncedPacientes.length} pacientes locais, ${unsyncedEstabelecimentos.length} estabelecimentos`);
      
      return {
        notificacoes: pendingNotificacoes.length,
        pacientes: unsyncedPacientes.length,
        estabelecimentos: unsyncedEstabelecimentos.length,
        errors: errorNotificacoes.length
      };
      
    } catch (error) {
      console.error('Erro ao obter contadores:', error);
      return { notificacoes: 0, pacientes: 0, estabelecimentos: 0, errors: 0 };
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
    
    const searchTerm = query.toLowerCase().trim();
    const exactMatches: any[] = [];
    const partialMatches: any[] = [];
    
    console.log(`\n🔍 ===== BUSCA DE PACIENTE =====`);
    console.log(`Query original: "${query}"`);
    console.log(`Search term normalizado: "${searchTerm}"`);
    
    try {
      // ✅ 1. Buscar no cache de verificação
      const allCacheEntries = await this.db!.getAll('pacientes_cache');
      console.log(`📦 Total pacientes no cache: ${allCacheEntries.length}`);
      
      allCacheEntries.forEach(entry => {
        const nomeNormalizado = entry.nome.toLowerCase().trim();
        const cpfLimpo = entry.cpf.replace(/\D/g, '');
        const queryLimpo = query.replace(/\D/g, '');
        
        // Match EXATO por CPF (prioridade máxima)
        if (cpfLimpo && queryLimpo && cpfLimpo === queryLimpo) {
          console.log(`✅ MATCH EXATO CPF: ${entry.nome} (ID: ${entry.idpaciente})`);
          exactMatches.push({
            idpaciente: entry.idpaciente || `cache_${entry.cpf}`,
            nome: entry.nome,
            cpf: entry.cpf,
            data_nascimento: entry.data_nascimento,
            nome_mae: entry.nome_mae,
            source: 'cache',
            matchType: 'cpf_exact'
          });
        }
        // Match EXATO por nome (prioridade alta)
        else if (nomeNormalizado === searchTerm) {
          console.log(`✅ MATCH EXATO NOME: ${entry.nome} (ID: ${entry.idpaciente})`);
          exactMatches.push({
            idpaciente: entry.idpaciente || `cache_${entry.cpf}`,
            nome: entry.nome,
            cpf: entry.cpf,
            data_nascimento: entry.data_nascimento,
            nome_mae: entry.nome_mae,
            source: 'cache',
            matchType: 'nome_exact'
          });
        }
        // Match PARCIAL (apenas se termo tem 3+ caracteres)
        else if (searchTerm.length >= 3 && nomeNormalizado.includes(searchTerm)) {
          console.log(`⚠️ MATCH PARCIAL: ${entry.nome} (ID: ${entry.idpaciente}) - contém "${searchTerm}"`);
          partialMatches.push({
            idpaciente: entry.idpaciente || `cache_${entry.cpf}`,
            nome: entry.nome,
            cpf: entry.cpf,
            data_nascimento: entry.data_nascimento,
            nome_mae: entry.nome_mae,
            source: 'cache',
            matchType: 'nome_partial'
          });
        }
      });
      
      // ✅ 2. Buscar em pacientes locais
      const allPacientes = await this.db!.getAll('pacientes');
      console.log(`📦 Total pacientes locais: ${allPacientes.length}`);
      
      allPacientes.forEach(paciente => {
        const nomeNormalizado = paciente.nome?.toLowerCase().trim() || '';
        const cpfLimpo = paciente.cpf?.replace(/\D/g, '') || '';
        const queryLimpo = query.replace(/\D/g, '');
        
        // Match EXATO por CPF
        if (cpfLimpo && queryLimpo && cpfLimpo === queryLimpo) {
          console.log(`✅ MATCH EXATO CPF (LOCAL): ${paciente.nome} (ID: ${paciente.idpaciente})`);
          exactMatches.push({
            ...paciente,
            source: paciente.source || 'local',
            matchType: 'cpf_exact'
          });
        }
        // Match EXATO por nome
        else if (nomeNormalizado === searchTerm) {
          console.log(`✅ MATCH EXATO NOME (LOCAL): ${paciente.nome} (ID: ${paciente.idpaciente})`);
          exactMatches.push({
            ...paciente,
            source: paciente.source || 'local',
            matchType: 'nome_exact'
          });
        }
        // Match PARCIAL
        else if (searchTerm.length >= 3 && nomeNormalizado.includes(searchTerm)) {
          console.log(`⚠️ MATCH PARCIAL (LOCAL): ${paciente.nome} (ID: ${paciente.idpaciente})`);
          partialMatches.push({
            ...paciente,
            source: paciente.source || 'local',
            matchType: 'nome_partial'
          });
        }
      });
      
      // ✅ PRIORIZAR: Exatos primeiro, parciais depois
      const finalResults = [...exactMatches, ...partialMatches];
      
      console.log(`\n� RESULTADO DA BUSCA:`);
      console.log(`  - Matches exatos: ${exactMatches.length}`);
      console.log(`  - Matches parciais: ${partialMatches.length}`);
      console.log(`  - Total retornado: ${finalResults.length}`);
      
      if (finalResults.length > 0) {
        console.log(`\n📋 Pacientes encontrados (em ordem):`);
        finalResults.forEach((p, idx) => {
          console.log(`  ${idx + 1}. ${p.nome} (ID: ${p.idpaciente}) - ${p.matchType} - ${p.source}`);
        });
      }
      
      console.log(`===== FIM BUSCA =====\n`);
      
      return finalResults;
      
    } catch (error) {
      console.error('❌ Erro na busca estendida:', error);
      return [];
    }
  }

  // ===== MÉTODOS EXISTENTES =====
  
  // ✅ OBSOLETO: Manter por compatibilidade, mas buscar por todas e filtrar
  async getNotificacao(id: number): Promise<FormData | null> {
    await this.init();
    // Buscar todas notificações e encontrar pelo ID antigo
    const allNotificacoes = await this.db!.getAll('notificacoes');
    const notificacao = allNotificacoes.find(n => n.id === id);
    return notificacao ? notificacao.formData : null;
  }
  
  // ✅ NOVO: Buscar notificação por offlineId
  async getNotificacaoByOfflineId(offlineId: string): Promise<FormData | null> {
    await this.init();
    const notificacao = await this.db!.get('notificacoes', offlineId);
    return notificacao ? notificacao.formData : null;
  }

  async getPendingNotificacoes(): Promise<Array<{ id: number; formData: FormData; offlineId: string; deviceId: string }>> {
    await this.init();
    
    // ✅ NOVO: Buscar por sincronizado = false
    const allNotificacoes = await this.db!.getAll('notificacoes');
    const pending = allNotificacoes.filter(item => item.sincronizado === false);
    
    console.log(`📋 [INDEXEDDB] Notificações pendentes de sincronização: ${pending.length}`);
    
    // ✅ DEBUG ESPECÍFICO: Log dos campos de trauma nas notificações pendentes
    pending.forEach(item => {
      console.log(`🩹 [DEBUG TRAUMA] Notificação pendente offlineId ${item.offlineId}:`, {
        id: item.id,
        deviceId: item.deviceId,
        tipoTrauma: item.formData.tipoTrauma,
        observacaoTrauma: item.formData.observacaoTrauma,
        observacaoSintomas: item.formData.observacaoSintomas,
        observacaoHipotese: item.formData.observacaoHipotese
      });
    });
    
    return pending.map(item => ({ 
      id: item.id as number, 
      formData: item.formData,
      offlineId: item.offlineId,
      deviceId: item.deviceId
    }));
  }

  // ✅ NOVO: Obter notificações pendentes incluindo as com erro (para retry)
  async getAllPendingNotificacoes(): Promise<Array<{ id: number, formData: FormData, status: 'pending' | 'error', errorInfo?: any }>> {
    await this.init();
    const pending = await this.db!.getAllFromIndex('notificacoes', 'by-sync-status', 'pending');
    const errors = await this.db!.getAllFromIndex('notificacoes', 'by-sync-status', 'error');
    
    const allPending = [
      ...pending.map(item => ({ 
        id: item.id as number, 
        formData: item.formData, 
        status: 'pending' as const 
      })),
      ...errors.map(item => ({ 
        id: item.id as number, 
        formData: item.formData, 
        status: 'error' as const,
        errorInfo: item.errorInfo
      }))
    ];
    
    return allPending.sort((a, b) => a.id - b.id);
  }

  // ✅ ATUALIZADO: Aceita offlineId (string) ao invés de id (number)
  // ✅ CORRIGIDO: Remove notificação do store após sincronização para evitar duplicatas
  async markNotificacaoAsSynced(offlineId: string): Promise<void> {
    await this.init();
    const notificacao = await this.db!.get('notificacoes', offlineId);
    if (notificacao) {
      // ✅ CORREÇÃO: REMOVER a notificação ao invés de apenas marcar como 'synced'
      // Pois ela já estará disponível no cache após a próxima sincronização/download
      await this.db!.delete('notificacoes', offlineId);
      console.log(`✅ Notificação ${offlineId} REMOVIDA do store após sincronização (evitando duplicatas)`);
    } else {
      console.warn(`⚠️ Notificação ${offlineId} não encontrada para remoção`);
    }
  }

  // ✅ ATUALIZADO: Aceita offlineId (string) ao invés de id (number)
  async markNotificacaoAsSyncing(offlineId: string): Promise<void> {
    await this.init();
    const notificacao = await this.db!.get('notificacoes', offlineId);
    if (notificacao) {
      notificacao.syncStatus = 'syncing';
      notificacao.syncStartedAt = Date.now();
      await this.db!.put('notificacoes', notificacao);
      console.log(`🔄 Notificação ${offlineId} marcada como 'syncing' - iniciando envio ao servidor`);
    }
  }

  // ✅ ATUALIZADO: Reverter notificação de "syncing" para "pending" em caso de falha
  async revertNotificacaoToPending(offlineId: string): Promise<void> {
    await this.init();
    const notificacao = await this.db!.get('notificacoes', offlineId);
    if (notificacao && notificacao.syncStatus === 'syncing') {
      notificacao.syncStatus = 'pending';
      notificacao.sincronizado = false; // ✅ NOVO
      delete notificacao.syncStartedAt;
      await this.db!.put('notificacoes', notificacao);
      console.log(`⚠️ Notificação ${offlineId} revertida de 'syncing' para 'pending'`);
    }
  }

  // ✅ NOVO: Marcar notificação como erro
  // ✅ ATUALIZADO: Aceita offlineId (string) ao invés de id (number)
  async markNotificacaoAsError(offlineId: string, errorMessage: string, errorDetails?: any): Promise<void> {
    await this.init();
    const notificacao = await this.db!.get('notificacoes', offlineId);
    if (notificacao) {
      const currentRetryCount = notificacao.errorInfo?.retryCount || 0;
      
      notificacao.syncStatus = 'error';
      notificacao.sincronizado = false; // ✅ NOVO: Manter como não sincronizado
      notificacao.errorInfo = {
        message: errorMessage,
        timestamp: Date.now(),
        retryCount: currentRetryCount + 1,
        lastError: errorDetails ? JSON.stringify(errorDetails) : undefined
      };
      
      await this.db!.put('notificacoes', notificacao);
      console.log(`❌ Notificação ${offlineId} marcada como erro: ${errorMessage} (tentativa ${currentRetryCount + 1})`);
    }
  }

  // ✅ ATUALIZADO: Aceita offlineId (string) ao invés de id (number)
  async retryNotificacao(offlineId: string): Promise<void> {
    await this.init();
    const notificacao = await this.db!.get('notificacoes', offlineId);
    if (notificacao && notificacao.syncStatus === 'error') {
      notificacao.syncStatus = 'pending';
      notificacao.sincronizado = false; // ✅ Continua não sincronizado
      // Manter errorInfo para histórico, mas limpar o status
      await this.db!.put('notificacoes', notificacao);
      console.log(`🔄 Notificação ${offlineId} marcada para nova tentativa de sincronização`);
    }
  }

  // ✅ NOVO: Obter notificações com erro
  async getErrorNotificacoes(): Promise<Array<{ id: number, formData: FormData, errorInfo: any }>> {
    await this.init();
    const errorNotificacoes = await this.db!.getAllFromIndex('notificacoes', 'by-sync-status', 'error');
    return errorNotificacoes.map(item => ({ 
      id: item.id as number, 
      formData: item.formData,
      errorInfo: item.errorInfo
    }));
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
      if (n.offlineId) await tx.store.delete(n.offlineId); // ✅ ATUALIZADO: Usar offlineId
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

  // ✅ NOVO: Limpar notificações pendentes duplicadas (manter apenas a mais recente de cada grupo)
  async cleanDuplicatePendingNotifications(): Promise<{ removed: number; kept: number }> {
    await this.init();
    
    try {
      console.log('🧹 Iniciando limpeza de notificações duplicadas...');
      
      // Buscar todas as notificações pendentes
      const allNotificacoes = await this.db!.getAll('notificacoes');
      const pending = allNotificacoes.filter(n => n.sincronizado === false);
      
      console.log(`📊 Total: ${allNotificacoes.length} notificações, ${pending.length} pendentes`);
      
      if (pending.length === 0) {
        console.log('✅ Nenhuma notificação pendente para limpar');
        return { removed: 0, kept: 0 };
      }
      
      // Agrupar por deviceId + campos únicos (paciente, data)
      const grupos = new Map<string, typeof pending>();
      
      pending.forEach(notif => {
        // Criar chave única baseada em campos principais
        const paciente = notif.formData.paciente || '';
        const dataAtendimento = notif.formData.dataAtendimento || '';
        const tipoAtendimento = notif.formData.tipoAtendimento || '';
        
        const chave = `${notif.deviceId}_${paciente}_${dataAtendimento}_${tipoAtendimento}`;
        
        if (!grupos.has(chave)) {
          grupos.set(chave, []);
        }
        grupos.get(chave)!.push(notif);
      });
      
      console.log(`📋 ${grupos.size} grupos de notificações encontrados`);
      
      let removed = 0;
      let kept = 0;
      
      // Para cada grupo, manter apenas a PRIMEIRA CRIADA (mais antiga)
      for (const grupo of grupos.values()) {
        if (grupo.length > 1) {
          console.log(`🔍 Grupo com ${grupo.length} duplicatas encontrado`);
          
          // ✅ CORREÇÃO: Ordenar por timestamp (mais ANTIGA primeiro)
          grupo.sort((a, b) => a.timestamp - b.timestamp);
          
          // Manter a primeira (original), remover as outras (duplicatas posteriores)
          const [original, ...duplicatas] = grupo;
          
          console.log(`   ✅ Mantendo ORIGINAL: ${original.offlineId} (timestamp: ${new Date(original.timestamp).toLocaleString()})`);
          kept++;
          
          // Remover duplicatas posteriores
          for (const duplicata of duplicatas) {
            await this.db!.delete('notificacoes', duplicata.offlineId);
            console.log(`   🗑️ Removendo duplicata posterior: ${duplicata.offlineId} (timestamp: ${new Date(duplicata.timestamp).toLocaleString()})`);
            removed++;
          }
        } else {
          kept++;
        }
      }
      
      console.log(`✅ Limpeza concluída: ${removed} duplicatas removidas, ${kept} mantidas`);
      
      return { removed, kept };
      
    } catch (error) {
      console.error('❌ Erro ao limpar duplicatas:', error);
      throw error;
    }
  }

  // ✅ NOVO: Buscar todas as notificações para visualização (pendentes + sincronizadas)
  async getAllNotificacoesForDisplay(): Promise<any[]> {
    await this.init();
    if (!this.db) return [];
    
    try {
      console.log('📋 Buscando notificações para visualização (pendentes + cache)...');
      
      // 1. Buscar notificações sincronizadas (cache) - USAR MÉTODO QUE DESCRIPTOGRAFA
      const cachedWrapper: any = await this.getOpcoes('notificacoes-cache');
      let cached: any[] = [];
      
      // Verificar formato do cache
      if (!cachedWrapper) {
        // Cache vazio/não existe
        console.log('   📭 Nenhuma notificação no cache');
        cached = [];
      } else if (typeof cachedWrapper === 'object' && !Array.isArray(cachedWrapper) && 'encrypted' in cachedWrapper) {
        // Formato novo com wrapper { encrypted, data }
        if (cachedWrapper.encrypted === true && typeof cachedWrapper.data === 'string') {
          // Dados criptografados - usar offlineDataManager para descriptografar
          console.log('   🔓 Cache criptografado detectado, descriptografando...');
          const offlineDataManager = (await import('@/services/offlineDataManager')).offlineDataManager;
          cached = await offlineDataManager.getNotificacoesFromCache();
        } else if (cachedWrapper.encrypted === false && Array.isArray(cachedWrapper.data)) {
          // Dados não criptografados
          cached = cachedWrapper.data;
        } else {
          cached = [];
        }
      } else if (Array.isArray(cachedWrapper)) {
        // Formato antigo (array direto)
        cached = cachedWrapper;
      }
      
      console.log(`   ✅ ${cached.length} notificações do cache`);
      
      // 2. Buscar notificações pendentes
      const pending = await this.getPendingNotificacoes();
      
      // ✅ NOVO: Filtrar notificações que já foram sincronizadas (medida de segurança)
      const pendingFiltered = pending.filter(p => {
        // Verificar se tem flag _isPending ou syncStatus diferente de 'synced'
        const formDataAny = p.formData as any;
        const isSynced = formDataAny?.sincronizado === true || formDataAny?.synced === true;
        return !isSynced;
      });
      
      if (pendingFiltered.length < pending.length) {
        console.warn(`   ⚠️ ${pending.length - pendingFiltered.length} notificações já sincronizadas foram filtradas`);
      }
      
      console.log(`   ⏳ ${pendingFiltered.length} notificações pendentes`);
      
      // 3. Converter pendentes para formato display
      const pendingFormatted = pendingFiltered.map(p => ({
        ...p.formData,
        idnotificacao: p.id,
        _isPending: true,
        _offlineId: p.offlineId,
        _deviceId: p.deviceId,
        _syncStatus: 'pending',
        _badge: '🟡 Aguardando sincronização',
        // Garantir campos essenciais
        created_at: p.formData.created_at || new Date(Date.now()).toISOString(),
        updated_at: p.formData.updated_at || new Date(Date.now()).toISOString()
      }));
      
      // 4. Mesclar (pendentes primeiro para aparecer no topo)
      const all = [...pendingFormatted, ...cached];
      
      // 5. Remover duplicatas por offlineId (priorizar pendentes)
      // ✅ MELHORADO: Deduplicação mais robusta com múltiplas chaves
      const uniqueMap = new Map();
      const offlineIdIndex = new Map(); // Índice adicional por offline_id
      
      all.forEach(n => {
        // ✅ CORREÇÃO: Criar múltiplas chaves possíveis para detectar duplicatas
        const offlineId = n._offlineId || n.offline_id || null;
        const numericId = n.idnotificacao || n.id || null;
        
        // Criar chave primária (preferir offlineId se disponível)
        const primaryKey = offlineId || `id_${numericId}`;
        
        // Verificar duplicatas por offlineId
        let isDuplicate = false;
        if (offlineId) {
          if (offlineIdIndex.has(offlineId)) {
            isDuplicate = true;
            const existingKey = offlineIdIndex.get(offlineId);
            const existing = uniqueMap.get(existingKey);
            
            // Priorizar pendentes sobre sincronizadas
            if (n._isPending && !existing._isPending) {
              uniqueMap.delete(existingKey);
              isDuplicate = false; // Vai adicionar a versão pendente
            }
          } else {
            offlineIdIndex.set(offlineId, primaryKey);
          }
        }
        
        // Verificar duplicatas por ID numérico (se não for temporário)
        if (!isDuplicate && numericId && numericId > 0) {
          for (const [existingKey, existingNotif] of uniqueMap.entries()) {
            const existingNumericId = existingNotif.idnotificacao || existingNotif.id;
            if (existingNumericId === numericId) {
              // Se já existe com mesmo ID, priorizar pendentes
              if (n._isPending && !existingNotif._isPending) {
                uniqueMap.delete(existingKey);
                if (existingNotif.offline_id || existingNotif._offlineId) {
                  offlineIdIndex.delete(existingNotif.offline_id || existingNotif._offlineId);
                }
              } else {
                isDuplicate = true;
              }
              break;
            }
          }
        }
        
        // Adicionar se não for duplicata
        if (!isDuplicate) {
          uniqueMap.set(primaryKey, n);
        }
      });
      
      const result = Array.from(uniqueMap.values());
      const duplicatesRemoved = all.length - result.length;
      console.log(`   📊 Total: ${result.length} notificações únicas (${pendingFiltered.length} pendentes + ${cached.length} cache - ${duplicatesRemoved} duplicatas removidas)`);
      
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar notificações para display:', error);
      // Fallback: tentar retornar apenas pendentes
      try {
        const pending = await this.getPendingNotificacoes();
        console.warn(`⚠️ Fallback: retornando apenas ${pending.length} notificações pendentes`);
        const pendingFormatted = pending.map(p => ({
          ...p.formData,
          idnotificacao: p.id,
          _isPending: true,
          _offlineId: p.offlineId,
          _badge: '🟡 Aguardando sincronização'
        }));
        return pendingFormatted;
      } catch (fallbackError) {
        console.error('❌ Erro no fallback:', fallbackError);
        return [];
      }
    }
  }

  // ✅ NOVO: Obter estatísticas do cache
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

// ✅ EXPOR FUNÇÃO GLOBAL para limpar duplicatas (útil para debugging e manutenção)
if (typeof window !== 'undefined') {
  (window as any).cleanDuplicateNotifications = async () => {
    console.log('🧹 Iniciando limpeza de notificações duplicadas...');
    try {
      const result = await indexedDBService.cleanDuplicatePendingNotifications();
      console.log(`✅ Limpeza concluída: ${result.removed} duplicatas removidas, ${result.kept} notificações mantidas`);
      
      // Disparar evento para atualizar lista
      window.dispatchEvent(new CustomEvent('cache-updated'));
      
      return result;
    } catch (error) {
      console.error('❌ Erro ao limpar duplicatas:', error);
      throw error;
    }
  };
  
  console.log('💡 Use window.cleanDuplicateNotifications() no console para limpar notificações duplicadas');
}

export default indexedDBService;