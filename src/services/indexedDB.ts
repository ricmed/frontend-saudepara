import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { FormData } from '@/features/notificationForms/NotificationForm';

// Estrutura do banco de dados
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
          keyPath: 'id'
          // Removido autoIncrement: true pois vamos gerenciar IDs manualmente
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

  // Método para gerar ID temporário negativo para novos registros offline
  private async generateTemporaryId(): Promise<number> {
    await this.init();
    // Buscar o menor ID (mais negativo) atual
    const allNotificacoes = await this.db!.getAll('notificacoes');
    const tempIds = allNotificacoes
      .map(n => n.id as number)
      .filter(id => id < 0);
    
    // Se não houver IDs temporários, começar com -1
    // Caso contrário, usar (menor ID - 1)
    return tempIds.length > 0 ? Math.min(...tempIds) - 1 : -1;
  }

  // MÉTODOS PARA NOTIFICAÇÕES
  
  // Salvar uma notificação (nova ou atualização)
  async saveNotificacao(formData: FormData, isEdit: boolean = false, id?: number): Promise<number> {
    await this.init();
    
    let notificacao;
    
    if (isEdit && id) {
      // Para edição, manter o ID existente
      notificacao = {
        id,
        formData,
        syncStatus: 'pending' as const,
        timestamp: Date.now()
      };
    } else {
      // Para novos registros, gerar ID temporário negativo
      const tempId = await this.generateTemporaryId();
      notificacao = {
        id: tempId,
        formData, 
        syncStatus: 'pending' as const,
        timestamp: Date.now()
      };
    }

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

  // Método para atualizar o ID temporário para o ID permanente após sincronização
  async updateNotificacaoId(tempId: number, permanentId: number): Promise<void> {
    await this.init();
    
    // Obter a notificação com o ID temporário
    const notificacao = await this.db!.get('notificacoes', tempId);
    
    if (notificacao) {
      // Excluir o registro com ID temporário
      await this.db!.delete('notificacoes', tempId);
      
      // Criar novo registro com ID permanente
      notificacao.id = permanentId;
      notificacao.syncStatus = 'synced';
      
      await this.db!.put('notificacoes', notificacao);
    }
  }

  // Método para sincronizar com o servidor
  async syncNotificacoes(apiEndpoint: string): Promise<Array<{id: number, success: boolean, error?: any}>> {
    await this.init();
    const pendingNotificacoes = await this.getPendingNotificacoes();
    const results = [];
    
    for (const { id, formData } of pendingNotificacoes) {
      try {
        // Enviar dados para o servidor
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          const { id: permanentId } = await response.json();
          
          // Se o ID era temporário (negativo), atualize para o ID permanente
          if (id < 0) {
            await this.updateNotificacaoId(id, permanentId);
          } else {
            // Se já era um ID permanente, apenas marque como sincronizado
            await this.markNotificacaoAsSynced(id);
          }
          
          results.push({ id, success: true });
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
          results.push({ id, success: false, error: errorData });
        }
      } catch (error) {
        console.error(`Falha ao sincronizar notificação ${id}:`, error);
        results.push({ id, success: false, error });
      }
    }
    
    return results;
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