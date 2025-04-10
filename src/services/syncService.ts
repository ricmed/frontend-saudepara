import indexedDBService from './indexedDB';
import { NotificacaoService } from '@/services/NotificacaoService';
import { salvarNotificacaoCompleta } from '@/utils/notificacaoAdapter';
import { toast } from 'react-toastify';

class SyncService {
  private isOnline: boolean;
  private syncInterval: number | null = null;
  private isSyncing: boolean = false;

  constructor() {
    this.isOnline = navigator.onLine;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncData();
      
      // Notificar o usuário
      toast.success('Conexão de internet restaurada! Sincronizando dados...');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      
      // Notificar o usuário
      toast.info('Você está offline. Os dados serão salvos localmente.');
    });
  }

  // Iniciar verificação periódica
  startPeriodicSync(intervalMs = 60000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = window.setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncData();
      }
    }, intervalMs);
  }

  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Sincronizar dados pendentes
  async syncData() {
    if (!this.isOnline || this.isSyncing) return;

    this.isSyncing = true;
    let syncedCount = 0;
    let errorCount = 0;

    try {
      // Obter notificações pendentes
      const pendingNotificacoes = await indexedDBService.getPendingNotificacoes();
      
      if (pendingNotificacoes.length === 0) {
        this.isSyncing = false;
        return;
      }

      // Log para depuração
      console.log(`Sincronizando ${pendingNotificacoes.length} notificações pendentes`);

      // Sincronizar cada notificação pendente
      for (const { id, formData } of pendingNotificacoes) {
        try {
          // Verificar se é uma edição (baseado no ID da formData se disponível)
          const isEdit = !!formData.id;
          
          // Usar a função existente para salvar a notificação
          await salvarNotificacaoCompleta(
            formData, 
            isEdit, 
            isEdit ? Number(formData.id) : undefined
          );

          // Marcar como sincronizada
          await indexedDBService.markNotificacaoAsSynced(id);
          syncedCount++;
        } catch (error) {
          console.error(`Erro ao sincronizar notificação ${id}:`, error);
          errorCount++;
        }
      }

      // Notificar sobre sincronização concluída
      if (syncedCount > 0) {
        toast.success(`${syncedCount} notificações sincronizadas com sucesso!`);
      }
      
      if (errorCount > 0) {
        toast.warning(`Não foi possível sincronizar ${errorCount} notificações. Tentaremos novamente mais tarde.`);
      }

      // Limpar dados antigos
      await indexedDBService.cleanup();
      
    } catch (error) {
      console.error('Erro durante a sincronização:', error);
      toast.error('Erro ao sincronizar dados. Tentaremos novamente mais tarde.');
    } finally {
      this.isSyncing = false;
    }
  }

  // Método para sincronizar opções de dropdown
  async syncOpcoes(
    tipo: string, 
    fetchFn: () => Promise<any[]>, 
    forceRefresh: boolean = false
  ): Promise<any[]> {
    let data;
    
    // Primeiro, tenta obter dados do cache se não forçar atualização
    if (!forceRefresh) {
      data = await indexedDBService.getOpcoes(tipo);
      if (data) {
        return data;
      }
    }
    
    // Se estiver online, busca novos dados
    if (this.isOnline) {
      try {
        data = await fetchFn();
        
        // Salvar no cache
        await indexedDBService.saveOpcoes(tipo, data);
        return data;
      } catch (error) {
        console.error(`Erro ao buscar opções de ${tipo}:`, error);
        
        // Se falhar e tiver cache, usa o cache
        const cachedData = await indexedDBService.getOpcoes(tipo);
        if (cachedData) {
          console.log(`Usando dados em cache para ${tipo}`);
          return cachedData;
        }
        
        // Se não tiver cache, propaga o erro
        throw error;
      }
    } else {
      // Se offline, tenta usar o cache
      data = await indexedDBService.getOpcoes(tipo);
      if (data) {
        return data;
      }
      
      // Se não tiver cache, lança erro
      throw new Error(`Você está offline e não há dados em cache para ${tipo}`);
    }
  }

  isNetworkAvailable() {
    return this.isOnline;
  }

  // Método para forçar sincronização
  async forceSyncData() {
    if (!this.isOnline) {
      toast.warning('Você está offline. Não é possível sincronizar agora.');
      return false;
    }
    
    if (this.isSyncing) {
      toast.info('Sincronização já está em andamento.');
      return false;
    }
    
    await this.syncData();
    return true;
  }
}

// Exportar uma instância para uso em toda a aplicação
const syncService = new SyncService();
export default syncService;