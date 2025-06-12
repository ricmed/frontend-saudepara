import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { FormData } from '@/features/notificationForms/types/index2';

// ✅ CORRIGIDO: Interface com tipos de índices consistentes
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
    // ✅ CORRIGIDO: Todos os índices como string (mais compatível)
    indexes: { 'by-nome': string; 'by-cpf': string; 'by-synced': string };
  };
}

const DB_VERSION = 2;
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
          }

          // Store para pacientes
          if (!db.objectStoreNames.contains('pacientes')) {
            console.log('🆕 Criando store: pacientes');
            const pacientesStore = db.createObjectStore('pacientes', {
              keyPath: 'idpaciente'
            });
            pacientesStore.createIndex('by-nome', 'nome');
            pacientesStore.createIndex('by-cpf', 'cpf');
            pacientesStore.createIndex('by-synced', 'synced');
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

  async savePaciente(paciente: any): Promise<number> {
    await this.init();
    
    try {
      if (!paciente.idpaciente) {
        paciente.idpaciente = -Date.now();
      }
      
      if (paciente.nome) {
        paciente.nome = paciente.nome.toUpperCase();
      }
      
      // ✅ CORRIGIDO: Usar string para compatibilidade com índice
      paciente.synced = 'false'; // string 'false'
      paciente.savedAt = Date.now();
      
      await this.db!.put('pacientes', paciente);
      console.log(`👤 Paciente salvo offline: ${paciente.nome} (ID: ${paciente.idpaciente})`);
      return paciente.idpaciente;
      
    } catch (error) {
      console.error('❌ Erro ao salvar paciente:', error);
      throw error;
    }
  }

  async checkCpfExists(cpf: string): Promise<boolean> {
    await this.init();
    
    if (!cpf || cpf.length !== 11) return false;
    
    try {
      const pacienteComCpf = await this.db!.getFromIndex('pacientes', 'by-cpf', cpf);
      if (pacienteComCpf) return true;
      
      const allPacientes = await this.db!.getAll('pacientes');
      return allPacientes.some(paciente => paciente.cpf === cpf);
      
    } catch (error) {
      console.warn('Erro na verificação de CPF, usando busca manual:', error);
      const allPacientes = await this.db!.getAll('pacientes');
      return allPacientes.some(paciente => paciente.cpf === cpf);
    }
  }

  async getPendingCount(): Promise<{ notificacoes: number; pacientes: number }> {
    await this.init();
    
    try {
      const pendingNotificacoes = await this.getPendingNotificacoes();
      
      let unsyncedPacientes: any[] = [];
      try {
        // ✅ CORRIGIDO: Buscar por string 'false'
        unsyncedPacientes = await this.db!.getAllFromIndex('pacientes', 'by-synced', 'false');
      } catch (error) {
        const allPacientes = await this.db!.getAll('pacientes');
        unsyncedPacientes = allPacientes.filter(p => 
          p.synced === 'false' || p.synced === false || p.synced === undefined
        );
      }
      
      return {
        notificacoes: pendingNotificacoes.length,
        pacientes: unsyncedPacientes.length
      };
      
    } catch (error) {
      console.error('Erro ao obter contadores:', error);
      return { notificacoes: 0, pacientes: 0 };
    }
  }

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
      // ✅ CORRIGIDO: Usar string 'true'
      paciente.synced = 'true';
      paciente.syncedAt = Date.now();
      await this.db!.put('pacientes', paciente);
    }
  }

  async getUnsyncedPacientes(): Promise<any[]> {
    await this.init();
    try {
      // ✅ CORRIGIDO: Buscar por string 'false'
      return await this.db!.getAllFromIndex('pacientes', 'by-synced', 'false');
    } catch (error) {
      const allPacientes = await this.db!.getAll('pacientes');
      return allPacientes.filter(p => 
        p.synced === 'false' || p.synced === false || p.synced === undefined
      );
    }
  }

  async searchPacientesExtended(query: string): Promise<any[]> {
    await this.init();
    
    const searchTerm = query.toLowerCase();
    const allPacientes = await this.db!.getAll('pacientes');
    
    return allPacientes.filter(paciente => 
      (paciente.nome && paciente.nome.toLowerCase().includes(searchTerm)) ||
      (paciente.cpf && paciente.cpf.includes(query)) ||
      (paciente.nome_mae && paciente.nome_mae.toLowerCase().includes(searchTerm))
    );
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

  async clear(storeName: 'notificacoes' | 'opcoes' | 'pacientes'): Promise<void> {
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
}

const indexedDBService = new IndexedDBService();
export default indexedDBService;