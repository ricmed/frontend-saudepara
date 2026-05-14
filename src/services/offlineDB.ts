import { FormData } from '@/features/notificationForms/types/index2';
import { Paciente } from '@/services/PacienteService';
import indexedDBService from '@/services/indexedDB';

class OfflineDB {
  async init(): Promise<void> {
    await indexedDBService.init();
  }

  // Salvar notificação offline
  async saveNotificacao(data: FormData): Promise<number> {
    await this.init();
    return indexedDBService.saveNotificacao(data, false);
  }

  // Salvar paciente offline
  async savePaciente(data: Omit<Paciente, 'idpaciente'>): Promise<number> {
    await this.init();
    return indexedDBService.savePaciente(data);
  }

  // Buscar pacientes offline
  async searchPacientes(query: string): Promise<any[]> {
    await this.init();
    return indexedDBService.searchPacientesExtended(query);
  }

  // Verificar se CPF existe offline
  async checkCpfExists(cpf: string): Promise<boolean> {
    await this.init();
    return indexedDBService.checkCpfExists(cpf);
  }

  // Cache para dropdowns
  async saveToCache(key: string, data: any): Promise<void> {
    await this.init();
    await indexedDBService.saveOpcoes(key, data);
  }

  async getFromCache(key: string): Promise<any> {
    await this.init();
    return indexedDBService.getOpcoes(key);
  }

  // Obter dados não sincronizados
  async getUnsyncedData(): Promise<{ notificacoes: any[], pacientes: any[] }> {
    await this.init();
    const [notificacoes, pacientes] = await Promise.all([
      indexedDBService.getPendingNotificacoes(),
      indexedDBService.getUnsyncedPacientes(),
    ]);
    return { notificacoes, pacientes };
  }
}

export const offlineDB = new OfflineDB();