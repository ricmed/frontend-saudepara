import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  FormData,
  LocalidadeEventoDTO,
} from '@/features/notificationForms/types/index2';
import { deviceIdService } from './deviceIdService'; // ✅ NOVO: Import do serviço de Device ID
import { getAuthenticatedUserIdentifier } from './comunicacaoDaeOfflineScope';

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
      serverId?: number; // ✅ NOVO: ID definitivo no servidor (quando disponível)
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
      data: any;
      timestamp: number;
    };
  };
  localidades_evento: {
    key: number;
    value: {
      eventoId: number;
      data: LocalidadeEventoDTO[];
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
  // ✅ NOVO: Store para comunicações DAE criadas/editadas offline
  comunicacoes_dae: {
    key: string; // offlineId como chave
    value: {
      id?: number; // ID do servidor (se já foi sincronizado)
      offlineId: string; // ID único offline
      deviceId: string; // ID do dispositivo
      ownerId?: string;
      formData: any; // Dados do formulário
      syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
      timestamp: number;
      createdOffline: boolean;
      sincronizado: boolean;
      syncedAt?: number;
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
      'by-device-id': string;
      'by-offline-id': string;
      'by-sincronizado': string;
    };
  };
  // ✅ NOVO: Store para anexos pendentes de upload
  anexos_pendentes: {
    key: string; // anexoId único
    value: {
      anexoId: string; // ID único do anexo
      comunicacaoOfflineId?: string; // ID offline da comunicação (se criada offline)
      comunicacaoId?: number; // ID da comunicação no servidor (se já sincronizada)
      file: Blob; // Arquivo em formato Blob
      fileName: string; // Nome original do arquivo
      fileSize: number; // Tamanho em bytes
      mimeType: string; // Tipo MIME
      tipo_anexo: string; // Tipo do anexo
      syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
      timestamp: number;
      syncedAt?: number;
      errorInfo?: {
        message: string;
        timestamp: number;
        retryCount?: number;
      };
    };
    indexes: {
      'by-comunicacao-offline': string;
      'by-comunicacao-id': number;
      'by-sync-status': string;
    };
  };
}

const DB_VERSION = 8; // V8: catálogo de localidades indexado por evento
const DB_NAME = 'NotificacaoOfflineDB';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias
const INIT_MAX_RETRIES = 3;
const INIT_RETRY_BASE_MS = 400;
const BLOCKED_UPGRADE_TIMEOUT_MS = 8000;

type ConnectionStatus = 'idle' | 'recovering' | 'blocked' | 'ready' | 'error';

interface ConnectionState {
  status: ConnectionStatus;
  retryCount: number;
  lastBlockedAt: number | null;
  lastError: string | null;
}

interface DisplayNotificationsOptions {
  offset?: number;
  limit?: number;
}

export class IndexedDBService {
  private db: IDBPDatabase<NotificacaoDatabase> | null = null;
  private blockedUpgradeTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionState: ConnectionState = {
    status: 'idle',
    retryCount: 0,
    lastBlockedAt: null,
    lastError: null,
  };

  private clearBlockedUpgradeTimer(): void {
    if (this.blockedUpgradeTimer) {
      clearTimeout(this.blockedUpgradeTimer);
      this.blockedUpgradeTimer = null;
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateConnectionState(status: ConnectionStatus, patch: Partial<ConnectionState> = {}): void {
    this.connectionState = {
      ...this.connectionState,
      ...patch,
      status,
    };
  }

  private emitConnectionEvent(eventName: string, detail: Record<string, unknown>): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker?.controller?.postMessage({
        type: eventName,
        detail,
      });
    }
  }

  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Verifica a versão atual para telemetria e troubleshooting.
   * Não executa limpeza automática para preservar dados offline do usuário.
   */
  private async checkExistingVersion(): Promise<void> {
    try {
      // Tentar abrir o banco sem especificar versão para ver qual versão existe
      const request = indexedDB.open(DB_NAME);
      
      return new Promise((resolve) => {
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const currentVersion = db.version;
          db.close();
          
          console.log(`📊 Versão atual do IndexedDB: ${currentVersion}`);
          
          if (currentVersion < DB_VERSION) {
            console.warn(
              `⚠️ Versão antiga detectada (v${currentVersion} -> v${DB_VERSION}). ` +
              'Mantendo dados locais e deixando a migração no fluxo de upgrade.'
            );
          } else {
            console.log('✅ Versão do banco está atualizada');
          }

          resolve();
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

    console.log(`🔧 Inicializando IndexedDB: ${DB_NAME} v${DB_VERSION}`);
    await this.checkExistingVersion();

    let lastError: unknown;
    for (let attempt = 1; attempt <= INIT_MAX_RETRIES; attempt++) {
      this.updateConnectionState('recovering', { retryCount: attempt - 1 });

      let rejectOnBlockedTimeout: ((reason?: unknown) => void) | null = null;
      const blockedTimeoutPromise = new Promise<IDBPDatabase<NotificacaoDatabase>>((_, reject) => {
        rejectOnBlockedTimeout = reject;
      });

      try {
        const openPromise = openDB<NotificacaoDatabase>(DB_NAME, DB_VERSION, {
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
            }

            if (
              oldVersion < 8 &&
              !db.objectStoreNames.contains('localidades_evento')
            ) {
              console.log('🆕 Criando store: localidades_evento');
              db.createObjectStore('localidades_evento', {
                keyPath: 'eventoId',
              });
            }

            // Store para pacientes (dados criados localmente)
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

            // ✅ NOVO V6: Store para comunicações DAE offline
            if (!db.objectStoreNames.contains('comunicacoes_dae')) {
              console.log('🆕 Criando store: comunicacoes_dae');
              const comunicacoesDaeStore = db.createObjectStore('comunicacoes_dae', {
                keyPath: 'offlineId'
              });
              comunicacoesDaeStore.createIndex('by-sync-status', 'syncStatus');
              comunicacoesDaeStore.createIndex('by-device-id', 'deviceId');
              comunicacoesDaeStore.createIndex('by-offline-id', 'offlineId');
              comunicacoesDaeStore.createIndex('by-sincronizado', 'sincronizado');
            }

            // ✅ VERSÃO 7: Criar store para anexos pendentes
            if (oldVersion < 7 && !db.objectStoreNames.contains('anexos_pendentes')) {
              console.log('📦 Criando store: anexos_pendentes');
              const anexosStore = db.createObjectStore('anexos_pendentes', {
                keyPath: 'anexoId'
              });
              anexosStore.createIndex('by-comunicacao-offline', 'comunicacaoOfflineId');
              anexosStore.createIndex('by-comunicacao-id', 'comunicacaoId');
              anexosStore.createIndex('by-sync-status', 'syncStatus');
            }
          },
          
          blocked: () => {
            const blockedAt = Date.now();
            this.updateConnectionState('blocked', {
              lastBlockedAt: blockedAt,
              lastError: `Upgrade bloqueado por mais de ${BLOCKED_UPGRADE_TIMEOUT_MS}ms`,
            });
            this.emitConnectionEvent('indexeddb-upgrade-blocked', {
              dbName: DB_NAME,
              version: DB_VERSION,
              attempt,
              blockedAt,
            });
            console.warn('⚠️ IndexedDB bloqueado por outra aba/processo');

            this.clearBlockedUpgradeTimer();
            this.blockedUpgradeTimer = setTimeout(() => {
              const timeoutError = new Error(
                `IndexedDB upgrade bloqueado por ${BLOCKED_UPGRADE_TIMEOUT_MS}ms (tentativa ${attempt}/${INIT_MAX_RETRIES})`
              );
              this.updateConnectionState('error', {
                retryCount: attempt,
                lastError: timeoutError.message,
              });
              this.emitConnectionEvent('indexeddb-upgrade-timeout', {
                dbName: DB_NAME,
                version: DB_VERSION,
                attempt,
                timeoutMs: BLOCKED_UPGRADE_TIMEOUT_MS,
              });
              rejectOnBlockedTimeout?.(timeoutError);
            }, BLOCKED_UPGRADE_TIMEOUT_MS);
          },
          
          blocking: () => {
            console.warn('⚠️ IndexedDB bloqueando para upgrade');
            this.updateConnectionState('recovering', {
              retryCount: attempt,
              lastError: null,
            });
            this.emitConnectionEvent('indexeddb-blocking-upgrade', {
              dbName: DB_NAME,
              version: DB_VERSION,
              attempt,
            });
            if (this.db) {
              this.db.close();
              this.db = null;
            }
          },
          
          terminated: () => {
            console.error('❌ IndexedDB conexão terminada');
            this.clearBlockedUpgradeTimer();
            this.updateConnectionState('error', {
              lastError: 'Conexão IndexedDB terminada inesperadamente',
            });
            this.emitConnectionEvent('indexeddb-connection-terminated', {
              dbName: DB_NAME,
              version: DB_VERSION,
              attempt,
            });
            this.db = null;
          }
        });

        this.db = await Promise.race([openPromise, blockedTimeoutPromise]);
        this.clearBlockedUpgradeTimer();
        this.updateConnectionState('ready', {
          retryCount: attempt - 1,
          lastError: null,
        });
        this.emitConnectionEvent('indexeddb-ready', {
          dbName: DB_NAME,
          version: DB_VERSION,
          attempt,
        });
        console.log('✅ IndexedDB inicializado com sucesso!');
        return;
      } catch (error) {
        lastError = error;
        this.clearBlockedUpgradeTimer();
        console.error(`❌ Erro ao inicializar IndexedDB (tentativa ${attempt}/${INIT_MAX_RETRIES}):`, error);

        if (error instanceof Error && error.name === 'VersionError') {
          console.log('🔄 VersionError detectado, tentando resetar banco...');
          await this.resetDatabase();
          return;
        }

        if (attempt < INIT_MAX_RETRIES) {
          const retryDelayMs = INIT_RETRY_BASE_MS * 2 ** (attempt - 1);
          this.updateConnectionState('recovering', {
            retryCount: attempt,
            lastError: error instanceof Error ? error.message : String(error),
          });
          this.emitConnectionEvent('indexeddb-retry-scheduled', {
            dbName: DB_NAME,
            version: DB_VERSION,
            attempt,
            retryDelayMs,
          });
          await this.wait(retryDelayMs);
          continue;
        }
      }
    }

    this.updateConnectionState('error', {
      retryCount: INIT_MAX_RETRIES,
      lastError: lastError instanceof Error ? lastError.message : String(lastError),
    });
    throw lastError instanceof Error ? lastError : new Error('Falha ao inicializar IndexedDB');
  }

  async resetDatabase(): Promise<void> {
    try {
      console.log('🗑️ Resetando banco de dados...');
      this.clearBlockedUpgradeTimer();
      this.updateConnectionState('recovering', {
        lastError: null,
      });
      
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
      this.updateConnectionState('error', {
        lastError: error instanceof Error ? error.message : String(error),
      });
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

      console.log(`💾 [INDEXEDDB] Salvando notificação offline:`, {
        id: notificacao.id,
        isEdit: isEdit,
        sincronizado: notificacao.sincronizado,
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

  // ===== COMUNICAÇÕES DAE =====
  async saveComunicacaoDae(formData: any, isEdit: boolean = false, id?: number): Promise<string> {
    await this.init();
    
    try {
      const formDataCopy = JSON.parse(JSON.stringify(formData));
      const deviceId = await deviceIdService.getDeviceId();
      const ownerId = getAuthenticatedUserIdentifier();
      if (!ownerId) {
        throw new Error('Usuário autenticado não identificado para salvar a comunicação DAE offline.');
      }
      
      let offlineId: string;
      let existingComunicacao: any = null;
      
      if ((formDataCopy as any).offline_id || (formDataCopy as any).offlineId) {
        offlineId = (formDataCopy as any).offline_id || (formDataCopy as any).offlineId;
        existingComunicacao = await this.db!.get('comunicacoes_dae', offlineId);
        
        if (existingComunicacao) {
          if (existingComunicacao.ownerId !== ownerId) {
            throw new Error('Esta comunicação offline pertence a outro usuário.');
          }
          if (!isEdit) {
            console.warn(`⚠️ Comunicação DAE com offlineId ${offlineId} já existe! Atualizando.`);
          }
        }
      } else {
        offlineId = await deviceIdService.generateOfflineId();
        (formDataCopy as any).offline_id = offlineId;
      }
      
      let comunicacao;
      
      if (isEdit && id) {
        if (existingComunicacao) {
          comunicacao = {
            ...existingComunicacao,
            ownerId,
            formData: formDataCopy,
            timestamp: Date.now(),
            syncStatus: 'pending' as const,
            sincronizado: false
          };
        } else {
          comunicacao = {
            id,
            offlineId,
            deviceId,
            ownerId,
            formData: formDataCopy,
            syncStatus: 'pending' as const,
            timestamp: Date.now(),
            createdOffline: false,
            sincronizado: false,
            isEdit: true
          };
        }
        
        console.log(`✏️ Editando comunicação DAE offline: ${offlineId}`);
      } else {
        comunicacao = {
          offlineId,
          deviceId,
          ownerId,
          formData: formDataCopy,
          syncStatus: 'pending' as const,
          timestamp: Date.now(),
          createdOffline: true,
          sincronizado: false,
          isEdit: false
        };
        
        console.log(`💾 Salvando nova comunicação DAE offline: ${offlineId}`);
      }
      
      await this.db!.put('comunicacoes_dae', comunicacao);
      console.log(`✅ Comunicação DAE salva offline: ${offlineId}`);
      
      return offlineId;
    } catch (error) {
      console.error('❌ Erro ao salvar comunicação DAE:', error);
      throw error;
    }
  }

  async getPendingComunicacoesDae(): Promise<any[]> {
    await this.init();
    try {
      const ownerId = getAuthenticatedUserIdentifier();
      if (!ownerId) return [];
      const pending = await this.db!.getAllFromIndex('comunicacoes_dae', 'by-sync-status', 'pending');
      return pending.filter((item) => item.ownerId === ownerId);
    } catch (error) {
      console.error('Erro ao buscar comunicações DAE pendentes:', error);
      return [];
    }
  }

  async getErrorComunicacoesDae(): Promise<any[]> {
    await this.init();
    try {
      const ownerId = getAuthenticatedUserIdentifier();
      if (!ownerId) return [];
      const failed = await this.db!.getAllFromIndex('comunicacoes_dae', 'by-sync-status', 'error');
      return failed.filter((item) => item.ownerId === ownerId);
    } catch (error) {
      console.error('Erro ao buscar comunicações DAE com erro:', error);
      return [];
    }
  }

  async updateComunicacaoDaeSyncStatus(offlineId: string, status: 'pending' | 'syncing' | 'synced' | 'error', errorInfo?: any): Promise<void> {
    await this.init();
    try {
      const comunicacao = await this.db!.get('comunicacoes_dae', offlineId);
      if (comunicacao) {
        comunicacao.syncStatus = status;
        if (status === 'synced') {
          comunicacao.sincronizado = true;
          comunicacao.syncedAt = Date.now();
        }
        if (status === 'error' && errorInfo) {
          comunicacao.errorInfo = errorInfo;
        }
        await this.db!.put('comunicacoes_dae', comunicacao);
      }
    } catch (error) {
      console.error('Erro ao atualizar status de sincronização:', error);
    }
  }

  async deleteComunicacaoDae(offlineId: string): Promise<void> {
    await this.init();
    try {
      await this.db!.delete('comunicacoes_dae', offlineId);
      console.log(`🗑️ Comunicação DAE removida: ${offlineId}`);
    } catch (error) {
      console.error('Erro ao deletar comunicação DAE:', error);
    }
  }

  async retryComunicacaoDae(offlineId: string): Promise<void> {
    await this.init();
    try {
      const comunicacao = await this.db!.get('comunicacoes_dae', offlineId);
      if (comunicacao) {
        comunicacao.syncStatus = 'pending';
        if (comunicacao.errorInfo) {
          comunicacao.errorInfo.retryCount = (comunicacao.errorInfo.retryCount || 0) + 1;
        }
        await this.db!.put('comunicacoes_dae', comunicacao);
        console.log(`🔄 Comunicação DAE marcada para retry: ${offlineId}`);
      }
    } catch (error) {
      console.error('Erro ao marcar comunicação DAE para retry:', error);
    }
  }

  // ===== ANEXOS PENDENTES =====

  /**
   * Salvar anexo para upload posterior
   */
  async saveAnexoPendente(
    file: File,
    tipo_anexo: string,
    comunicacaoOfflineId?: string,
    comunicacaoId?: number
  ): Promise<string> {
    await this.init();
    
    try {
      const anexoId = `anexo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const anexo = {
        anexoId,
        comunicacaoOfflineId,
        comunicacaoId,
        file: file as Blob, // Armazenar como Blob
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        tipo_anexo,
        syncStatus: 'pending' as const,
        timestamp: Date.now()
      };
      
      await this.db!.put('anexos_pendentes', anexo);
      
      console.log(`💾 Anexo salvo para sincronização posterior: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      
      return anexoId;
    } catch (error) {
      console.error('❌ Erro ao salvar anexo pendente:', error);
      throw error;
    }
  }

  /**
   * Obter anexos pendentes de uma comunicação
   */
  async getAnexosPendentesByComunicacao(comunicacaoOfflineId?: string, comunicacaoId?: number): Promise<any[]> {
    await this.init();
    
    try {
      if (comunicacaoOfflineId) {
        return await this.db!.getAllFromIndex('anexos_pendentes', 'by-comunicacao-offline', comunicacaoOfflineId);
      } else if (comunicacaoId) {
        return await this.db!.getAllFromIndex('anexos_pendentes', 'by-comunicacao-id', comunicacaoId);
      }
      return [];
    } catch (error) {
      console.error('❌ Erro ao buscar anexos pendentes:', error);
      return [];
    }
  }

  /**
   * Obter todos os anexos pendentes de sincronização
   */
  async getAllAnexosPendentes(): Promise<any[]> {
    await this.init();
    
    try {
      return await this.db!.getAllFromIndex('anexos_pendentes', 'by-sync-status', 'pending');
    } catch (error) {
      console.error('❌ Erro ao buscar anexos pendentes:', error);
      return [];
    }
  }

  /**
   * Obter lote de anexos pendentes sem carregar tudo em memória.
   */
  async getPendingAnexosBatch(limit: number = 20): Promise<any[]> {
    await this.init();

    try {
      const safeLimit = Math.max(1, limit);
      const tx = this.db!.transaction('anexos_pendentes', 'readonly');
      const index = tx.store.index('by-sync-status');
      const batch: any[] = [];

      let cursor = await index.openCursor('pending');
      while (cursor && batch.length < safeLimit) {
        batch.push(cursor.value);
        cursor = await cursor.continue();
      }

      await tx.done;
      return batch;
    } catch (error) {
      console.error('❌ Erro ao buscar lote de anexos pendentes:', error);
      return [];
    }
  }

  /**
   * Atualizar status de sincronização do anexo
   */
  async updateAnexoSyncStatus(
    anexoId: string,
    status: 'pending' | 'syncing' | 'synced' | 'error',
    errorMessage?: string
  ): Promise<void> {
    await this.init();
    
    try {
      const anexo = await this.db!.get('anexos_pendentes', anexoId);
      if (anexo) {
        anexo.syncStatus = status;
        
        if (status === 'synced') {
          anexo.syncedAt = Date.now();
        }
        
        if (status === 'error' && errorMessage) {
          anexo.errorInfo = {
            message: errorMessage,
            timestamp: Date.now(),
            retryCount: (anexo.errorInfo?.retryCount || 0) + 1
          };
        }
        
        await this.db!.put('anexos_pendentes', anexo);
        console.log(`✅ Status do anexo atualizado: ${anexoId} -> ${status}`);
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar status do anexo:', error);
    }
  }

  /**
   * Deletar anexo após sincronização bem-sucedida
   */
  async deleteAnexo(anexoId: string): Promise<void> {
    await this.init();
    
    try {
      await this.db!.delete('anexos_pendentes', anexoId);
      console.log(`🗑️ Anexo removido: ${anexoId}`);
    } catch (error) {
      console.error('❌ Erro ao deletar anexo:', error);
    }
  }

  /**
   * Atualizar comunicacaoId dos anexos quando a comunicação for sincronizada
   */
  async updateAnexosComunicacaoId(comunicacaoOfflineId: string, comunicacaoId: number): Promise<void> {
    await this.init();
    
    try {
      const anexos = await this.getAnexosPendentesByComunicacao(comunicacaoOfflineId);
      
      for (const anexo of anexos) {
        anexo.comunicacaoId = comunicacaoId;
        // Remover referência offline após ter o ID do servidor
        delete anexo.comunicacaoOfflineId;
        await this.db!.put('anexos_pendentes', anexo);
      }
      
      console.log(`✅ ${anexos.length} anexos atualizados com comunicacaoId: ${comunicacaoId}`);
    } catch (error) {
      console.error('❌ Erro ao atualizar anexos com comunicacaoId:', error);
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
  async getPendingCount(): Promise<{ notificacoes: number; pacientes: number; estabelecimentos: number; comunicacoes_dae: number; anexos: number; errors: number }> {
    await this.init();
    
    try {
      const pendingNotificacoes = await this.getPendingNotificacoes();
      const errorNotificacoes = await this.getErrorNotificacoes();
      const heldByError = await this.getPacienteIdsHeldByErrorNotificacoes();
      
      // ✅ IMPORTANTE: Apenas pacientes com source = 'local_creation'
      let unsyncedPacientes: any[] = [];
      try {
        const allLocalPatients = await this.db!.getAllFromIndex('pacientes', 'by-synced', 'false');
        
        // ✅ Filtrar apenas os criados localmente
        unsyncedPacientes = allLocalPatients.filter(p => 
          (p.source === 'local_creation' || 
          (p.synced === 'false' && !p.source)) &&
          !heldByError.has(p.idpaciente)
        );
        
      } catch (error) {
        console.warn('Erro ao usar índice, usando busca manual:', error);
        const allPacientes = await this.db!.getAll('pacientes');
        unsyncedPacientes = allPacientes.filter(p => 
          (p.synced === 'false' || p.synced === false || p.synced === undefined) &&
          (p.source === 'local_creation' || !p.source) &&
          !heldByError.has(p.idpaciente)
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
      
      // ✅ NOVO V6: Comunicações DAE
      let unsyncedComunicacoesDae: any[] = [];
      try {
        const allPendingComunicacoes = await this.db!.getAllFromIndex('comunicacoes_dae', 'by-sync-status', 'pending');
        unsyncedComunicacoesDae = allPendingComunicacoes;
      } catch (error) {
        console.warn('Erro ao buscar comunicações DAE pendentes:', error);
      }

      // ✅ NOVO V7: Anexos pendentes
      let unsyncedAnexos: any[] = [];
      try {
        unsyncedAnexos = await this.getAllAnexosPendentes();
      } catch (error) {
        console.warn('Erro ao buscar anexos pendentes:', error);
      }

      if (import.meta.env.DEV) {
        console.log(`📊 Pendentes: ${pendingNotificacoes.length} notificações, ${errorNotificacoes.length} com erro, ${unsyncedPacientes.length} pacientes locais, ${unsyncedEstabelecimentos.length} estabelecimentos, ${unsyncedComunicacoesDae.length} comunicações DAE, ${unsyncedAnexos.length} anexos`);
      }
      
      return {
        notificacoes: pendingNotificacoes.length,
        pacientes: unsyncedPacientes.length,
        estabelecimentos: unsyncedEstabelecimentos.length,
        comunicacoes_dae: unsyncedComunicacoesDae.length,
        anexos: unsyncedAnexos.length,
        errors: errorNotificacoes.length
      };
      
    } catch (error) {
      console.error('Erro ao obter contadores:', error);
      return { notificacoes: 0, pacientes: 0, estabelecimentos: 0, comunicacoes_dae: 0, anexos: 0, errors: 0 };
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

  async getNotificacaoRecordByOfflineId(offlineId: string): Promise<any | null> {
    await this.init();
    return (await this.db!.get('notificacoes', offlineId)) || null;
  }

  /**
   * Pendente de sync = ainda não está no servidor de forma confiável.
   * Aceita `sincronizado` boolean ou string (legado) e recupera falsos
   * "synced" sem `serverId` (bug que fazia a ficha sumir da fila/lista).
   */
  private isNotificacaoPendingForSync(item: {
    sincronizado?: boolean | string;
    syncStatus?: string;
    serverId?: number;
    isEdit?: boolean;
    id?: number;
  }): boolean {
    const hasServerId =
      typeof item.serverId === 'number' &&
      Number.isFinite(item.serverId) &&
      item.serverId > 0;
    const editAlreadyOnServer =
      item.isEdit === true &&
      typeof item.id === 'number' &&
      item.id > 0;

    // Falso positivo: marcado synced sem prova no servidor → volta à fila
    if (
      (item.syncStatus === 'synced' ||
        item.sincronizado === true ||
        item.sincronizado === 'true') &&
      !hasServerId &&
      !editAlreadyOnServer
    ) {
      return true;
    }

    if (hasServerId || (item.syncStatus === 'synced' && editAlreadyOnServer)) {
      return false;
    }

    const sincronizado = item.sincronizado;
    if (sincronizado === true || sincronizado === 'true') {
      return false;
    }

    // Erro fica no aparelho; não entra de novo na fila automática
    if (item.syncStatus === 'error') {
      return false;
    }

    // false | 'false' | undefined | pending | syncing
    return true;
  }

  private collectPacienteIdsFromNotificacoes(
    items: Array<{ formData?: { pacienteId?: unknown; paciente_idpaciente?: unknown } }>,
  ): Set<number> {
    const ids = new Set<number>();
    for (const item of items) {
      const raw = item.formData?.pacienteId ?? item.formData?.paciente_idpaciente;
      const n = Number(raw);
      if (Number.isFinite(n) && n !== 0) {
        ids.add(n);
      }
    }
    return ids;
  }

  async getPacienteIdsHeldByErrorNotificacoes(): Promise<Set<number>> {
    const errors = await this.getErrorNotificacoes();
    const pending = await this.getPendingNotificacoes();
    const errorIds = this.collectPacienteIdsFromNotificacoes(errors);
    const pendingIds = this.collectPacienteIdsFromNotificacoes(pending);
    const held = new Set<number>();
    errorIds.forEach((id) => {
      if (!pendingIds.has(id)) held.add(id);
    });
    return held;
  }

  async getOfflineQueueNotificacoes(): Promise<Array<{
    id: number;
    formData: FormData;
    offlineId: string;
    deviceId?: string;
    timestamp?: number;
    isEdit?: boolean;
    syncStatus?: string;
    errorInfo?: any;
  }>> {
    const pending = await this.getPendingNotificacoes();
    const errors = await this.getErrorNotificacoes();
    const byOfflineId = new Map<string, any>();
    for (const item of pending) {
      byOfflineId.set(item.offlineId, item);
    }
    for (const item of errors) {
      byOfflineId.set(item.offlineId, {
        ...item,
        syncStatus: 'error',
      });
    }
    return Array.from(byOfflineId.values()).sort(
      (a, b) => (b.timestamp || 0) - (a.timestamp || 0),
    );
  }

  async getPendingNotificacoes(): Promise<Array<{ id: number; formData: FormData; offlineId: string; deviceId: string; timestamp?: number; isEdit?: boolean }>> {
    await this.init();

    // Sempre varre o store: o índice `by-sincronizado` com chave string 'false'
    // não encontra registros gravados com boolean `false` (IndexedDB é tipado).
    const allNotificacoes = await this.db!.getAll('notificacoes');
    const pending = allNotificacoes.filter((item) =>
      this.isNotificacaoPendingForSync(item as any),
    );

    // Autocorreção: reabrir falsos "synced" sem serverId
    for (const item of pending) {
      const syncStatus = (item as any).syncStatus;
      const sincronizado = (item as any).sincronizado;
      const looksFalselySynced =
        syncStatus === 'synced' ||
        sincronizado === true ||
        sincronizado === 'true';
      if (!looksFalselySynced) continue;

      try {
        (item as any).syncStatus = 'pending';
        (item as any).sincronizado = false;
        delete (item as any).syncedAt;
        await this.db!.put('notificacoes', item);
        console.warn(
          `♻️ Notificação ${(item as any).offlineId} reaberta na fila (estava "synced" sem ID do servidor)`,
        );
      } catch (repairError) {
        console.warn('Falha ao reabrir notificação falsa-synced:', repairError);
      }
    }

    pending.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return pending.map(item => ({
      id: item.id as number, 
      formData: item.formData,
      offlineId: item.offlineId,
      deviceId: item.deviceId,
      timestamp: item.timestamp,
      isEdit: item.isEdit,
      syncStatus: (item as any).syncStatus || 'pending',
      errorInfo: (item as any).errorInfo,
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
  // ✅ COMPORTAMENTO SEGURO: marca como sincronizada; remove só quando explicitamente solicitado.
  async markNotificacaoAsSynced(
    offlineId: string,
    options?: { remove?: boolean; serverId?: number }
  ): Promise<void> {
    await this.init();
    const notificacao = await this.db!.get('notificacoes', offlineId);
    if (notificacao) {
      if (options?.remove) {
        await this.db!.delete('notificacoes', offlineId);
        console.log(`✅ Notificação ${offlineId} removida do store (remoção explícita)`);
        return;
      }

      notificacao.syncStatus = 'synced';
      notificacao.sincronizado = true;
      notificacao.syncedAt = Date.now();
      notificacao.timestamp = Date.now();
      if (typeof options?.serverId === 'number' && Number.isFinite(options.serverId)) {
        notificacao.serverId = options.serverId;
      }
      await this.db!.put('notificacoes', notificacao);
      console.log(`✅ Notificação ${offlineId} marcada como sincronizada`);
    } else {
      console.warn(`⚠️ Notificação ${offlineId} não encontrada para sincronização`);
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
      const safeLastError =
        typeof errorDetails === 'string'
          ? errorDetails.slice(0, 300)
          : typeof errorDetails?.message === 'string'
            ? errorDetails.message.slice(0, 300)
            : undefined;
      
      notificacao.syncStatus = 'error';
      notificacao.sincronizado = false; // ✅ NOVO: Manter como não sincronizado
      notificacao.errorInfo = {
        message: errorMessage,
        timestamp: Date.now(),
        retryCount: currentRetryCount + 1,
        lastError: safeLastError
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
  async getErrorNotificacoes(): Promise<Array<{ id: number, formData: FormData, errorInfo: any, offlineId: string }>> {
    await this.init();
    const allNotificacoes = await this.db!.getAll('notificacoes');
    const errorNotificacoes = allNotificacoes.filter((item) => item.syncStatus === 'error');
    return errorNotificacoes.map(item => ({ 
      id: item.id as number, 
      formData: item.formData,
      errorInfo: item.errorInfo,
      offlineId: item.offlineId,
      deviceId: item.deviceId,
      timestamp: item.timestamp,
      isEdit: item.isEdit,
      syncStatus: 'error' as const,
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

  async saveOpcoes(tipo: string, data: unknown): Promise<void> {
    await this.init();
    await this.db!.put('opcoes', { tipo, data, timestamp: Date.now() });
  }

  async getOpcoes<T = any[]>(tipo: string): Promise<T | null> {
    await this.init();
    const opcoes = await this.db!.get('opcoes', tipo);
    
    if (opcoes && (Date.now() - opcoes.timestamp) < CACHE_DURATION) {
      return opcoes.data as T;
    }
    
    return null;
  }

  async saveLocalidadesEvento(
    eventoId: number,
    data: LocalidadeEventoDTO[],
  ): Promise<void> {
    await this.init();
    await this.db!.put('localidades_evento', {
      eventoId,
      data,
      timestamp: Date.now(),
    });
  }

  async getLocalidadesEvento(
    eventoId: number,
  ): Promise<LocalidadeEventoDTO[] | null> {
    await this.init();
    const catalog = await this.db!.get('localidades_evento', eventoId);

    if (catalog && Date.now() - catalog.timestamp < CACHE_DURATION) {
      return catalog.data;
    }

    return null;
  }

  async getLocalidadesEventoCacheStats(): Promise<{
    catalogs: number;
    records: number;
  }> {
    await this.init();
    const catalogs = await this.db!.getAll('localidades_evento');
    const validCatalogs = catalogs.filter(
      catalog => Date.now() - catalog.timestamp < CACHE_DURATION,
    );

    return {
      catalogs: validCatalogs.length,
      records: validCatalogs.reduce(
        (total, catalog) => total + catalog.data.length,
        0,
      ),
    };
  }

  async clearLocalidadesEventoCache(): Promise<void> {
    await this.init();
    const tx = this.db!.transaction('localidades_evento', 'readwrite');
    await tx.store.clear();
    await tx.done;
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

  /**
   * Limpa só stores re-fetcháveis (catálogos / cache de API local).
   * NÃO mexe em notificações, comunicações DAE, anexos pendentes, pacientes/estabelecimentos em fila offline.
   * Usar após nova versão do app (PWA) para evitar dados de formulário antigos em opções em cache.
   */
  async clearRefetchableCachesOnly(): Promise<void> {
    const storeNames = [
      'opcoes',
      'pacientes_cache',
      'cpfs_cache',
      'estabelecimentos_cache',
      'localidades_evento',
    ] as const;

    try {
      await this.init();
    } catch {
      console.warn('[IndexedDB] init falhou; skip clearRefetchableCachesOnly');
      return;
    }

    for (const name of storeNames) {
      try {
        if (!this.db!.objectStoreNames.contains(name)) continue;
        const tx = this.db!.transaction(name, 'readwrite');
        await tx.store.clear();
        await tx.done;
        console.log(`🗑️ [app-update] Store "${name}" limpo (cache refetchável)`);
      } catch (err) {
        console.warn(`[app-update] Falha ao limpar store "${name}":`, err);
      }
    }
  }

  // ✅ NOVO: Limpar notificações pendentes duplicadas (manter apenas a mais recente de cada grupo)
  async cleanDuplicatePendingNotifications(): Promise<{ removed: number; kept: number }> {
    await this.init();
    
    try {
      console.log('🧹 Iniciando limpeza de notificações duplicadas...');
      
      // Buscar todas as notificações pendentes
      const allNotificacoes = await this.db!.getAll('notificacoes');
      const pending = allNotificacoes.filter((n) =>
        this.isNotificacaoPendingForSync(n as any),
      );
      
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
  async getAllNotificacoesForDisplay(options: DisplayNotificationsOptions = {}): Promise<any[]> {
    await this.init();
    if (!this.db) return [];

    const safeOffset = Math.max(0, options.offset ?? 0);
    const safeLimit = options.limit && options.limit > 0 ? options.limit : undefined;
    
    try {
      console.log('📋 Buscando notificações para visualização (pendentes + cache)...');

      // 1. Buscar notificações sincronizadas (cache)
      const cachedWrapper: any = await this.getOpcoes('notificacoes-cache');
      let cached: any[] = [];

      if (Array.isArray(cachedWrapper)) {
        cached = cachedWrapper;
      } else if (cachedWrapper && typeof cachedWrapper === 'object' && 'encrypted' in cachedWrapper) {
        if (cachedWrapper.encrypted === true && typeof cachedWrapper.data === 'string') {
          console.log('   🔓 Cache criptografado detectado, descriptografando...');
          const offlineDataManager = (await import('@/services/offlineDataManager')).offlineDataManager;
          cached = await offlineDataManager.getNotificacoesFromCache();
        } else if (cachedWrapper.encrypted === false && Array.isArray(cachedWrapper.data)) {
          cached = cachedWrapper.data;
        }
      }
      
      if (!cachedWrapper) {
        console.log('   📭 Nenhuma notificação no cache');
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
      
      // 3. Converter pendentes para formato display (lista usa `id`, não só idnotificacao)
      const pendingFormatted = pendingFiltered.map(p => {
        const fd = (p.formData || {}) as any;
        const tempId = p.id;
        return {
          ...fd,
          id: tempId,
          idnotificacao: tempId,
          paciente: fd.paciente || 'Paciente não informado',
          tipoEvento: fd.tipoEvento || fd.eventoNome || fd.evento || '—',
          dataOcorrencia:
            fd.dataOcorrencia ||
            fd.dataAtendimento ||
            fd.dataInicioSintomas ||
            '—',
          tipoAtendimento: fd.tipoAtendimento || '—',
          tipoEncerramento: fd.tipoEncerramento || '—',
          _isPending: true,
          _offlineId: p.offlineId,
          _deviceId: p.deviceId,
          _syncStatus: 'pending',
          _badge: '🟡 Aguardando sincronização',
          created_at: fd.created_at || new Date(p.timestamp || Date.now()).toISOString(),
          updated_at: fd.updated_at || new Date(p.timestamp || Date.now()).toISOString(),
          offline_id: p.offlineId,
          original: {
            ...fd,
            idnotificacao: tempId,
            offline_id: p.offlineId,
            _isPending: true,
          },
        };
      });
      
      // 4. Mesclar (pendentes primeiro para aparecer no topo)
      const all = [...pendingFormatted, ...cached];
      
      // 5. Remover duplicatas com custo linear O(n), priorizando pendentes.
      const uniqueMap = new Map<string, any>();
      const offlineIdIndex = new Map<string, string>();
      const numericIdIndex = new Map<number, string>();
      const requiredItems = safeLimit ? safeOffset + safeLimit : Number.POSITIVE_INFINITY;

      const getNumericId = (notification: any): number | null => {
        const raw = notification.idnotificacao ?? notification.id;
        if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
        if (typeof raw === 'string' && raw.trim() !== '') {
          const parsed = Number(raw);
          return Number.isFinite(parsed) ? parsed : null;
        }
        return null;
      };

      for (let idx = 0; idx < all.length; idx++) {
        const notification = all[idx];
        const offlineId = notification._offlineId || notification.offline_id || null;
        const numericId = getNumericId(notification);

        let existingKey: string | undefined;
        if (offlineId && offlineIdIndex.has(offlineId)) {
          existingKey = offlineIdIndex.get(offlineId);
        } else if (numericId !== null && numericId > 0 && numericIdIndex.has(numericId)) {
          existingKey = numericIdIndex.get(numericId);
        }

        if (!existingKey) {
          const newKey = offlineId || (numericId !== null && numericId > 0 ? `id_${numericId}` : `tmp_${idx}`);
          uniqueMap.set(newKey, notification);
          if (offlineId) offlineIdIndex.set(offlineId, newKey);
          if (numericId !== null && numericId > 0) numericIdIndex.set(numericId, newKey);
          if (uniqueMap.size >= requiredItems) {
            break;
          }
          if (idx > 0 && idx % 400 === 0) {
            await this.wait(0);
          }
          continue;
        }

        const existing = uniqueMap.get(existingKey);
        const shouldReplace = notification._isPending && !existing?._isPending;
        if (shouldReplace) {
          uniqueMap.set(existingKey, notification);
        }

        if (offlineId) offlineIdIndex.set(offlineId, existingKey);
        if (numericId !== null && numericId > 0) numericIdIndex.set(numericId, existingKey);
        if (idx > 0 && idx % 400 === 0) {
          await this.wait(0);
        }
      }

      const result = Array.from(uniqueMap.values());
      const duplicatesRemoved = all.length - result.length;
      console.log(`   📊 Total: ${result.length} notificações únicas (${pendingFiltered.length} pendentes + ${cached.length} cache - ${duplicatesRemoved} duplicatas removidas)`);

      if (safeLimit) {
        return result.slice(safeOffset, safeOffset + safeLimit);
      }
      
      return safeOffset > 0 ? result.slice(safeOffset) : result;
    } catch (error) {
      console.error('❌ Erro ao buscar notificações para display:', error);
      const pending = await this.getPendingNotificacoes().catch(() => []);
      console.warn(`⚠️ Fallback: retornando apenas ${pending.length} notificações pendentes`);
      const fallbackResult = pending.map(p => ({
        ...p.formData,
        idnotificacao: p.id,
        _isPending: true,
        _offlineId: p.offlineId,
        _badge: '🟡 Aguardando sincronização'
      }));
      if (safeLimit) {
        return fallbackResult.slice(safeOffset, safeOffset + safeLimit);
      }
      return safeOffset > 0 ? fallbackResult.slice(safeOffset) : fallbackResult;
    }
  }

  async getNotificacoesForDisplayPage(
    page: number = 1,
    limit: number = 100
  ): Promise<{ data: any[]; page: number; limit: number; hasMore: boolean }> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);
    const offset = (safePage - 1) * safeLimit;

    const batch = await this.getAllNotificacoesForDisplay({
      offset,
      limit: safeLimit + 1,
    });

    const hasMore = batch.length > safeLimit;
    const data = hasMore ? batch.slice(0, safeLimit) : batch;

    return {
      data,
      page: safePage,
      limit: safeLimit,
      hasMore,
    };
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