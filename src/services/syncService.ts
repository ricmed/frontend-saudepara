import indexedDBService from './indexedDB';
import { NotificacaoService } from '@/services/NotificacaoService';
import { PacienteService } from '@/services/PacienteService';
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
  }  async syncData() {
    if (!this.isOnline || this.isSyncing) return;

    this.isSyncing = true;
    let syncedCount = 0;
    let errorCount = 0;

    try {
      // ===== 1. SINCRONIZAR PACIENTES PRIMEIRO =====
      const unsyncedPacientes = await indexedDBService.getUnsyncedPacientes();
      const pacienteIdMapping: Map<number, number> = new Map(); // ID temporário → ID permanente
      
      console.log(`🔄 Sincronizando ${unsyncedPacientes.length} pacientes...`);
        for (const paciente of unsyncedPacientes) {
        try {
          console.log(`👤 Sincronizando paciente: ${paciente.nome} (ID temp: ${paciente.idpaciente})`);
          
          // ✅ REMOVER CAMPOS QUE NÃO DEVEM SER ENVIADOS
          const { idpaciente, synced, savedAt, syncedAt, savedOffline, ...pacienteData } = paciente;
          
          // ✅ VERIFICAR SE idpaciente EXISTE ANTES DE USAR
          if (!idpaciente) {
            console.error(`❌ Paciente ${paciente.nome} não tem ID válido, pulando...`);
            errorCount++;
            continue;
          }
          
          // Criar paciente no servidor
          const result = await PacienteService.create(pacienteData);
          const newPatientId = result.idpaciente;
          
          // ✅ VERIFICAR SE newPatientId EXISTE
          if (!newPatientId) {
            console.error(`❌ Servidor não retornou ID para paciente ${paciente.nome}`);
            errorCount++;
            continue;
          }
          
          console.log(`✅ Paciente criado: ID temp ${idpaciente} → ID perm ${newPatientId}`);
          
          // ✅ AGORA É SEGURO USAR NO MAPEAMENTO (ambos são number garantido)
          pacienteIdMapping.set(idpaciente, newPatientId);
          
          // Marcar como sincronizado
          await indexedDBService.markPacienteAsSynced(idpaciente);
          syncedCount++;
          
          console.log(`✅ Paciente ${paciente.nome} sincronizado`);
          
        } catch (error) {
          console.error(`❌ Erro ao sincronizar paciente ${paciente.idpaciente}:`, error);
          errorCount++;
        }
      }

      // ===== 2. SINCRONIZAR NOTIFICAÇÕES (com IDs atualizados) =====
      const pendingNotificacoes = await indexedDBService.getPendingNotificacoes();
      console.log(`🔄 Sincronizando ${pendingNotificacoes.length} notificações...`);
      
      for (const { id, formData } of pendingNotificacoes) {
        try {
          console.log(`📋 Sincronizando notificação ID: ${id}`);
          
          // ✅ CRIAR CÓPIA DOS DADOS PARA MODIFICAR
          let formDataAtualizada = { ...formData } as any;
            // ✅ ATUALIZAR ID DO PACIENTE SE NECESSÁRIO
          const pacienteIdAtual = formDataAtualizada.pacienteId || formDataAtualizada.paciente_idpaciente;
          
          // ✅ VERIFICAR SE É UM NÚMERO VÁLIDO ANTES DE USAR NO MAPEAMENTO
          if (pacienteIdAtual && typeof pacienteIdAtual === 'number' && pacienteIdMapping.has(pacienteIdAtual)) {
            const novoIdPaciente = pacienteIdMapping.get(pacienteIdAtual)!;
            
            console.log(`🔄 Atualizando referência: paciente ID ${pacienteIdAtual} → ${novoIdPaciente}`);
            
            // Atualizar ambos os campos possíveis
            formDataAtualizada.pacienteId = novoIdPaciente;
            formDataAtualizada.paciente_idpaciente = novoIdPaciente;
            
            // ✅ SALVAR A NOTIFICAÇÃO ATUALIZADA NO INDEXEDDB
            await indexedDBService.saveNotificacao(formDataAtualizada, true, id);
          }
          
          // ✅ VERIFICAR SE TEM ID VÁLIDO DE PACIENTE ANTES DE SINCRONIZAR
          const pacienteIdFinal = formDataAtualizada.pacienteId || formDataAtualizada.paciente_idpaciente;
          
          if (!pacienteIdFinal || pacienteIdFinal < 0) {
            console.error(`❌ Notificação ${id} não tem ID válido de paciente:`, formDataAtualizada);
            
            // ✅ TENTAR ENCONTRAR PACIENTE PELO NOME
            if (formDataAtualizada.paciente) {
              console.log(`🔍 Tentando encontrar paciente pelo nome: ${formDataAtualizada.paciente}`);
              
              try {
                const pacientesEncontrados = await PacienteService.search(formDataAtualizada.paciente);
                
                if (pacientesEncontrados.data && pacientesEncontrados.data.length > 0) {
                  const pacienteEncontrado = pacientesEncontrados.data.find((p: any) => 
                    p.nome.toUpperCase().trim() === formDataAtualizada.paciente.toUpperCase().trim()
                  );
                  
                  if (pacienteEncontrado) {
                    console.log(`👤 Paciente encontrado: ${pacienteEncontrado.nome} (ID: ${pacienteEncontrado.idpaciente})`);
                    
                    formDataAtualizada.pacienteId = pacienteEncontrado.idpaciente;
                    formDataAtualizada.paciente_idpaciente = pacienteEncontrado.idpaciente;
                    
                    // Salvar atualização
                    await indexedDBService.saveNotificacao(formDataAtualizada, true, id);
                  } else {
                    throw new Error(`Paciente "${formDataAtualizada.paciente}" não encontrado`);
                  }
                } else {
                  throw new Error(`Nenhum paciente encontrado para "${formDataAtualizada.paciente}"`);
                }
              } catch (searchError) {
                console.error(`❌ Erro ao buscar paciente: ${searchError}`);
                errorCount++;
                continue; // Pular para próxima notificação
              }
            } else {
              console.error(`❌ Notificação ${id} não tem nome de paciente`);
              errorCount++;
              continue;
            }
          }
          
          // ✅ SINCRONIZAR NOTIFICAÇÃO
          const isEdit = !!(formDataAtualizada as any).id && (formDataAtualizada as any).id > 0;
          const editId = isEdit ? Number((formDataAtualizada as any).id) : undefined;
          
          await salvarNotificacaoCompleta(
            formDataAtualizada as any, 
            isEdit, 
            editId
          );

          await indexedDBService.markNotificacaoAsSynced(id);
          syncedCount++;
          console.log(`✅ Notificação ${id} sincronizada`);
          
        } catch (error) {
          console.error(`❌ Erro ao sincronizar notificação ${id}:`, error);
          errorCount++;
        }
      }

      // ===== 3. FEEDBACK PARA O USUÁRIO =====
      if (syncedCount > 0) {
        toast.success(`${syncedCount} registro(s) sincronizado(s)!`);
      }
      
      if (errorCount > 0) {
        toast.warning(`${errorCount} registro(s) com erro. Tentaremos novamente.`);
      }

      // ===== 4. LIMPEZA =====
      await indexedDBService.cleanup();
      
    } catch (error) {
      console.error('Erro durante sincronização:', error);
      toast.error('Erro na sincronização. Tentaremos novamente.');
    } finally {
      this.isSyncing = false;
    }
  }

  // ===== MÉTODO AUXILIAR PARA DEBUG =====
  async debugPendingData(): Promise<void> {
    try {
      const pendingNotificacoes = await indexedDBService.getPendingNotificacoes();
      const unsyncedPacientes = await indexedDBService.getUnsyncedPacientes();
      
      console.log('=== 🔍 DEBUG: DADOS PENDENTES ===');
      console.log(`📋 Notificações pendentes: ${pendingNotificacoes.length}`);
      
      pendingNotificacoes.forEach((notif, index) => {
        const pacienteId = (notif.formData as any).pacienteId || (notif.formData as any).paciente_idpaciente;
        console.log(`  ${index + 1}. ID: ${notif.id}`);
        console.log(`     Paciente: ${(notif.formData as any).paciente}`);
        console.log(`     PacienteID: ${pacienteId || 'VAZIO'}`);
        console.log(`     Tipo: ${pacienteId && pacienteId < 0 ? 'Temporário' : 'Permanente'}`);
      });
      
      console.log(`👤 Pacientes não sincronizados: ${unsyncedPacientes.length}`);
      unsyncedPacientes.forEach((pac, index) => {
        console.log(`  ${index + 1}. ID: ${pac.idpaciente}, Nome: ${pac.nome}, Synced: ${pac.synced}`);
      });
      
      if (pendingNotificacoes.length === 0 && unsyncedPacientes.length === 0) {
        console.log('✅ Nenhum dado pendente de sincronização!');
      }
      
    } catch (error) {
      console.error('❌ Erro no debug:', error);
    }
  }

  // *** ADICIONAR MÉTODOS PARA USAR NOS FORMULÁRIOS ***
    // Salvar notificação (online ou offline)
  async saveNotificacao(formData: any): Promise<void> {
    if (this.isOnline) {
      try {
        // Tentar salvar online primeiro
        await salvarNotificacaoCompleta(formData, false);
        toast.success('✅ Notificação salva!');
        return;
      } catch (error) {
        console.warn('Falha online, salvando offline:', error);
      }
    }

    // ✅ GARANTIR QUE O ID DO PACIENTE ESTÁ CORRETO
    const formDataParaSalvar = { ...formData };
    
    // Garantir consistência entre pacienteId e paciente_idpaciente
    if (formDataParaSalvar.pacienteId && !formDataParaSalvar.paciente_idpaciente) {
      formDataParaSalvar.paciente_idpaciente = formDataParaSalvar.pacienteId;
    } else if (formDataParaSalvar.paciente_idpaciente && !formDataParaSalvar.pacienteId) {
      formDataParaSalvar.pacienteId = formDataParaSalvar.paciente_idpaciente;
    }

    // Salvar offline usando IndexedDBService
    await indexedDBService.saveNotificacao(formDataParaSalvar, false);
    
    const message = this.isOnline 
      ? '📡 Erro na conexão - Salvo offline!'
      : '📱 Salvo offline! Sincronizará quando voltar online.';
    
    toast.success(message);
  }
  // Salvar paciente (online ou offline)
  async savePaciente(pacienteData: any): Promise<any> {
    if (this.isOnline) {
      try {
        // Tentar salvar online primeiro
        const result = await PacienteService.create(pacienteData);
        toast.success('✅ Paciente salvo!');
        return result;
      } catch (error) {
        console.warn('Falha online, salvando offline:', error);
      }
    }

    // ✅ GERAR ID TEMPORÁRIO NEGATIVO MAIS ROBUSTO
    const tempId = -Math.abs(Date.now()); // Garantir que seja negativo
    const pacienteComId = { 
      ...pacienteData, 
      idpaciente: tempId,
      synced: 'false', // String para consistência com IndexedDB
      savedOffline: true 
    };
    
    await indexedDBService.savePaciente(pacienteComId);
    
    const message = this.isOnline 
      ? '📡 Erro na conexão - Paciente salvo offline!'
      : '📱 Paciente salvo offline! Sincronizará quando voltar online.';
    
    toast.success(message);
    return pacienteComId;
  }

  // Buscar pacientes (online ou offline)
  async searchPacientes(query: string): Promise<any[]> {
    if (this.isOnline) {
      try {
        const result = await PacienteService.search(query);
        return result.data || [];
      } catch (error) {
        console.warn('Falha na busca online, usando cache:', error);
      }
    }

    // Buscar offline usando seu IndexedDBService
    return await indexedDBService.searchPacientesExtended(query);
  }

  // Verificar CPF (online ou offline)
  async checkCpfExists(cpf: string): Promise<boolean> {
    if (!cpf || cpf.length !== 11) return false;

    if (this.isOnline) {
      try {
        const available = await PacienteService.checkCpfAvailable(cpf);
        return !available; // Inverter pois retorna disponibilidade
      } catch (error) {
        console.warn('Falha na verificação online, usando cache:', error);
      }
    }

    // Verificar offline usando seu IndexedDBService
    return await indexedDBService.checkCpfExists(cpf);
  }

  // *** SEU MÉTODO syncOpcoes EXISTENTE (não mexer) ***
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

  isSyncInProgress() {
    return this.isSyncing;
  }

  async getPendingCount() {
    return await indexedDBService.getPendingCount();
  }

  // *** SEU MÉTODO forceSyncData EXISTENTE (não mexer) ***
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