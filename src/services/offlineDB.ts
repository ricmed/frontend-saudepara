import { FormData } from '@/features/notificationForms/types/index2';
import { Paciente } from '@/services/PacienteService';

class OfflineDB {
  private dbName = 'saude-para-offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Notificações offline
        if (!db.objectStoreNames.contains('notificacoes')) {
          const store = db.createObjectStore('notificacoes', { 
            keyPath: 'id',
            autoIncrement: true 
          });
          store.createIndex('synced', 'synced', { unique: false });
        }

        // Pacientes offline
        if (!db.objectStoreNames.contains('pacientes')) {
          const store = db.createObjectStore('pacientes', { 
            keyPath: 'id',
            autoIncrement: true 
          });
          store.createIndex('cpf', 'cpf', { unique: false });
          store.createIndex('nome', 'nome', { unique: false });
        }

        // Cache de dropdowns
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
    });
  }

  // Salvar notificação offline
  async saveNotificacao(data: FormData): Promise<number> {
    if (!this.db) throw new Error('DB not ready');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notificacoes'], 'readwrite');
      const store = transaction.objectStore('notificacoes');

      const item = {
        ...data,
        synced: false,
        savedAt: new Date().toISOString()
      };

      const request = store.add(item);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  // Salvar paciente offline
  async savePaciente(data: Omit<Paciente, 'idpaciente'>): Promise<number> {
    if (!this.db) throw new Error('DB not ready');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pacientes'], 'readwrite');
      const store = transaction.objectStore('pacientes');

      const item = {
        ...data,
        synced: false,
        savedAt: new Date().toISOString()
      };

      const request = store.add(item);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  // Buscar pacientes offline
  async searchPacientes(query: string): Promise<any[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pacientes'], 'readonly');
      const store = transaction.objectStore('pacientes');
      const request = store.getAll();

      request.onsuccess = () => {
        const all = request.result;
        const filtered = all.filter((p: any) => 
          p.nome?.toLowerCase().includes(query.toLowerCase()) ||
          p.cpf?.includes(query)
        );
        resolve(filtered);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Verificar se CPF existe offline
  async checkCpfExists(cpf: string): Promise<boolean> {
    if (!this.db) return false;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pacientes'], 'readonly');
      const store = transaction.objectStore('pacientes');
      const index = store.index('cpf');
      const request = index.get(cpf);

      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Cache para dropdowns
  async saveToCache(key: string, data: any): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put({ key, data, savedAt: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getFromCache(key: string): Promise<any> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Obter dados não sincronizados
  async getUnsyncedData(): Promise<{ notificacoes: any[], pacientes: any[] }> {
    if (!this.db) return { notificacoes: [], pacientes: [] };

    const getUnsynced = (storeName: string) => {
      return new Promise<any[]>((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          const all = request.result;
          const unsynced = all.filter((item: any) => !item.synced);
          resolve(unsynced);
        };
        request.onerror = () => reject(request.error);
      });
    };

    const [notificacoes, pacientes] = await Promise.all([
      getUnsynced('notificacoes'),
      getUnsynced('pacientes')
    ]);

    return { notificacoes, pacientes };
  }
}

export const offlineDB = new OfflineDB();