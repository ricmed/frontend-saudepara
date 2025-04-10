import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { FormData } from '@/features/notificationForms/NotificationForm';

// Estrutura do banco de dados
interface NotificacaoDatabase extends DBSchema {
  notificacoes: {
    key: number;
    value: {
      id?: number;
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
    value: any; // Usando "any" para compatibilidade com o tipo Paciente existente
    indexes: { 'by-nome': string };
  };
}

const DB_VERSION = 1;
const DB_NAME = 'notificacao-offline-db';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias em milissegundos

export class IndexedDBService {
  private db: IDBPDatabase<NotificacaoDatabase> | null = null;

  // Inicializar o banco de dados
  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<NotificacaoDatabase>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Store para notificações
        const notificacoesStore = db.createObjectStore('notificacoes', {
          keyPath: 'id',
          autoIncrement: true
        });
        notificacoesStore.createIndex('by-sync-status', 'syncStatus');

        // Store para opções (dropdowns, etc)
        db.createObjectStore('opcoes', {
          keyPath: 'tipo'
        });

        // Store para pacientes
        const pacientesStore = db.createObjectStore('pacientes', {
          keyPath: 'idpaciente'
        });
        pacientesStore.createIndex('by-nome', 'nome');
      }
    });
  }

  // MÉTODOS PARA NOTIFICAÇÕES
  
  // Salvar uma notificação (nova ou atualização)
  async saveNotificacao(formData: FormData, isEdit: boolean = false, id?: number): Promise<number> {
    await this.init();
    
    const notificacao = {
      id: isEdit && id ? id : undefined,
      formData,
      syncStatus: 'pending' as const,
      timestamp: Date.now()
    };

    const savedId = await this.db!.put('notificacoes', notificacao);
    return savedId;
  }

  // Obter uma notificação pelo ID
  async getNotificacao(id: number): Promise<FormData | null> {
    await this.init();
    const notificacao = await this.db!.get('notificacoes', id);
    return notificacao ? notificacao.formData : null;
  }

  // Obter todas as notificações pendentes de sincronização
  async getPendingNotificacoes(): Promise<Array<{ id: number; formData: FormData }>> {
    await this.init();
    const pending = await this.db!.getAllFromIndex('notificacoes', 'by-sync-status', 'pending');
    return pending.map(item => ({ id: item.id as number, formData: item.formData }));
  }
  
  // Marcar notificação como sincronizada
  async markNotificacaoAsSynced(id: number): Promise<void> {
    await this.init();
    const notificacao = await this.db!.get('notificacoes', id);
    if (notificacao) {
      notificacao.syncStatus = 'synced';
      await this.db!.put('notificacoes', notificacao);
    }
  }

  // MÉTODOS PARA OPÇÕES (DROPDOWNS, ETC)
  
  // Armazenar opções de dropdown
  async saveOpcoes(tipo: string, data: any[]): Promise<void> {
    await this.init();
    await this.db!.put('opcoes', {
      tipo,
      data,
      timestamp: Date.now()
    });
  }

  // Obter opções de dropdown
  async getOpcoes(tipo: string): Promise<any[] | null> {
    await this.init();
    const opcoes = await this.db!.get('opcoes', tipo);
    
    // Verificar se as opções existem e não estão expiradas
    if (opcoes && (Date.now() - opcoes.timestamp) < CACHE_DURATION) {
      return opcoes.data;
    }
    
    return null;
  }

  // MÉTODOS PARA PACIENTES
  
  // Salvar um paciente
  async savePaciente(paciente: any): Promise<number> {
    await this.init();
    
    // Garantir que o nome esteja em caixa alta para consistência na busca
    if (paciente.nome) {
      paciente.nome = paciente.nome.toUpperCase();
    }
    
    await this.db!.put('pacientes', paciente);
    return paciente.idpaciente;
  }

  // Obter um paciente pelo ID
  async getPaciente(id: number): Promise<any | null> {
    await this.init();
    return await this.db!.get('pacientes', id);
  }

  // Buscar pacientes pelo nome
  async searchPacientes(nome: string): Promise<any[]> {
    await this.init();
    
    // Normalizar a busca para caixa alta
    const searchTerm = nome.toUpperCase();
    
    // Obter todos os pacientes e filtrar no código
    // Não é o mais eficiente, mas funciona para casos offline
    const allPacientes = await this.db!.getAll('pacientes');
    
    return allPacientes.filter(paciente => 
      paciente.nome && paciente.nome.includes(searchTerm)
    );
  }

  // Método para limpar dados antigos e manter o banco de dados enxuto
  async cleanup(): Promise<void> {
    await this.init();
    
    // Limpar notificações sincronizadas com mais de 30 dias
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const allNotificacoes = await this.db!.getAll('notificacoes');
    const oldSyncedNotificacoes = allNotificacoes.filter(n => 
      n.syncStatus === 'synced' && n.timestamp < thirtyDaysAgo
    );
    
    // Excluir notificações antigas
    const tx = this.db!.transaction('notificacoes', 'readwrite');
    for (const n of oldSyncedNotificacoes) {
      if (n.id) await tx.store.delete(n.id);
    }
    await tx.done;
  }
}

// Exportar uma instância para uso em toda a aplicação
const indexedDBService = new IndexedDBService();
export default indexedDBService;