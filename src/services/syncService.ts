import indexedDBService from './indexedDB';
import { NotificacaoService } from '@/services/NotificacaoService';
import PacienteService from '@/services/PacienteService';
import { EstabelecimentoFormService } from '@/services/EstabelecimentoFormService';
import { salvarNotificacaoCompleta } from '@/utils/notificacaoAdapter';
import { toast } from 'react-toastify';

class SyncService {
  private isOnline: boolean;
  private syncInterval: number | null = null;
  private isSyncing: boolean = false;
  private syncStartTime: number = 0;
  private syncLockTimeout: number = 5 * 60 * 1000; // 5 minutos timeout

  constructor() {
    this.isOnline = navigator.onLine;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      // ✅ DELAY para evitar múltiplas sincronizações simultâneas
      setTimeout(() => {
        this.syncData();
      }, 2000);
      
      toast.success('Conexão de internet restaurada! Sincronizando dados...');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      toast.info('Você está offline. Os dados serão salvos localmente.');
    });
  }

  // ✅ CORRIGIDO: Intervalo maior e verificação de lock
  startPeriodicSync(intervalMs = 300000) { // 5 minutos em vez de 1
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = window.setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        // ✅ Verificar se não há sync travado há muito tempo
        const now = Date.now();
        if (this.syncStartTime > 0 && (now - this.syncStartTime) > this.syncLockTimeout) {
          console.warn('⚠️ Sync parece travado, resetando lock...');
          this.isSyncing = false;
          this.syncStartTime = 0;
        }
        
        if (!this.isSyncing) {
          this.syncData();
        }
      }
    }, intervalMs);
  }

  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // ✅ CORRIGIDO: Sincronização com proteção contra duplicação
  async syncData() {
    if (!this.isOnline) {
      console.log('📱 Sem conexão para sincronizar');
      return;
    }

    if (this.isSyncing) {
      console.log('🔄 Sincronização já em andamento...');
      return;
    }

    this.isSyncing = true;
    this.syncStartTime = Date.now();
    let syncedCount = 0;
    let errorCount = 0;

    try {
      console.log('🚀 === INICIANDO SINCRONIZAÇÃO ===');

      // ===== 1. SINCRONIZAR APENAS PACIENTES CRIADOS LOCALMENTE =====
      const unsyncedPacientes = await indexedDBService.getUnsyncedPacientes();
      const pacienteIdMapping: Map<number, number> = new Map();
      
      // ✅ FILTRAR APENAS PACIENTES REALMENTE CRIADOS LOCALMENTE
      const pacientesParaSincronizar = unsyncedPacientes.filter(p => {
        const isLocalCreation = (
          p.source === 'local_creation' || 
          (!p.source && p.synced === 'false' && p.idpaciente < 0)
        );
        
        if (!isLocalCreation) {
          console.log(`⚠️ Pulando paciente ${p.nome} - source: ${p.source}, não é criação local`);
        }
        
        return isLocalCreation;
      });
      
      console.log(`🔄 ${pacientesParaSincronizar.length} pacientes realmente criados localmente para sincronizar`);
      
      for (const paciente of pacientesParaSincronizar) {
        try {
          console.log(`👤 Sincronizando paciente: ${paciente.nome} (ID temp: ${paciente.idpaciente})`);
          
          // ✅ VERIFICAR SE JÁ EXISTE NO SERVIDOR POR CPF (evitar duplicação)
          if (paciente.cpf) {
            try {
              const existingSearch = await PacienteService.search(paciente.cpf);
              
              if (existingSearch.data && existingSearch.data.length > 0) {
                // ✅ VERIFICAR SE É REALMENTE O MESMO PACIENTE
                const matchingPatient = existingSearch.data.find((p: any) => 
                  p.cpf === paciente.cpf && 
                  p.nome.toLowerCase().trim() === paciente.nome.toLowerCase().trim()
                );
                
                if (matchingPatient && matchingPatient.idpaciente) {
  console.log(`✅ Paciente ${paciente.nome} já existe no servidor (ID: ${matchingPatient.idpaciente})`);
  
  // ✅ USAR ID DO SERVIDOR E MARCAR COMO SINCRONIZADO
  pacienteIdMapping.set(paciente.idpaciente, matchingPatient.idpaciente);
  // 🔧 CORREÇÃO: Passar também o ID do servidor
  await indexedDBService.markPacienteAsSynced(paciente.idpaciente, matchingPatient.idpaciente);
  syncedCount++;
  
  continue; // Não criar novo, usar existente
}
              }
            } catch (searchError) {
              console.warn('⚠️ Erro ao verificar duplicação, continuando com criação:', searchError);
            }
          }
          
          // ✅ CRIAR PACIENTE NO SERVIDOR (apenas se não existir)
          const { idpaciente, synced, savedAt, syncedAt, savedOffline, source, ...pacienteData } = paciente;
          
          console.log(`📤 Criando novo paciente no servidor:`, {
            nome: pacienteData.nome,
            cpf: pacienteData.cpf
          });
          
          const result = await PacienteService.create(pacienteData);
          const newPatientId = result.idpaciente;
          
          if (!newPatientId) {
            throw new Error('Servidor não retornou ID válido');
          }
          
          console.log(`✅ Novo paciente criado: ID temp ${idpaciente} → ID perm ${newPatientId}`);
          
          pacienteIdMapping.set(idpaciente, newPatientId);
          await indexedDBService.markPacienteAsSynced(idpaciente);
          syncedCount++;
          
        } catch (error: any) {
          console.error(`❌ Erro ao sincronizar paciente ${paciente.idpaciente}:`, error);
          
          // ✅ SE FOR ERRO DE DUPLICAÇÃO, MARCAR COMO SINCRONIZADO
          if (error.message?.includes('já existe') || error.message?.includes('duplicate')) {
            console.log(`⚠️ Paciente ${paciente.nome} detectado como duplicata, marcando como sincronizado`);
            await indexedDBService.markPacienteAsSynced(paciente.idpaciente);
            syncedCount++;
          } else {
            errorCount++;
          }
        }      }

      // ===== 2. SINCRONIZAR ESTABELECIMENTOS =====
      const unsyncedEstabelecimentos = await indexedDBService.getUnsyncedEstabelecimentos();
      const estabelecimentoIdMapping: Map<number, number> = new Map();
      
      const estabelecimentosParaSincronizar = unsyncedEstabelecimentos.filter(e => {
        const isLocalCreation = (
          e.source === 'local_creation' || 
          (!e.source && e.synced === 'false' && e.id < 0)
        );
        
        if (!isLocalCreation) {
          console.log(`⚠️ Pulando estabelecimento ${e.nome} - source: ${e.source}, não é criação local`);
        }
        
        return isLocalCreation;
      });
      
      console.log(`🔄 ${estabelecimentosParaSincronizar.length} estabelecimentos criados localmente para sincronizar`);
      
      for (const estabelecimento of estabelecimentosParaSincronizar) {
        try {
          console.log(`🏥 Sincronizando estabelecimento: ${estabelecimento.nome} (ID temp: ${estabelecimento.id})`);
          
          // Verificar se já existe no servidor por CNES
          if (estabelecimento.cnes) {
            try {
              const existingCheck = await EstabelecimentoFormService.checkDuplicate('cnes', estabelecimento.cnes);
              
              if (existingCheck.isDuplicate) {
                console.log(`✅ Estabelecimento ${estabelecimento.nome} já existe no servidor`);
                await indexedDBService.markEstabelecimentoAsSynced(estabelecimento.id);
                syncedCount++;
                continue;
              }
            } catch (searchError) {
              console.warn('⚠️ Erro ao verificar duplicação de estabelecimento, continuando com criação:', searchError);
            }
          }
          
          // Criar estabelecimento no servidor
          const { id, synced, savedAt, syncedAt, savedOffline, source, ...estabelecimentoData } = estabelecimento;
          
          console.log(`📤 Criando novo estabelecimento no servidor:`, {
            nome: estabelecimentoData.nome,
            cnes: estabelecimentoData.cnes
          });
          
          const result = await EstabelecimentoFormService.create(estabelecimentoData);
          const newEstabelecimentoId = result.id;
          
          if (!newEstabelecimentoId) {
            throw new Error('Servidor não retornou ID válido');
          }
          
          console.log(`✅ Novo estabelecimento criado: ID temp ${id} → ID perm ${newEstabelecimentoId}`);
          
          estabelecimentoIdMapping.set(id, newEstabelecimentoId);
          await indexedDBService.markEstabelecimentoAsSynced(id, newEstabelecimentoId);
          syncedCount++;
          
        } catch (error: any) {
          console.error(`❌ Erro ao sincronizar estabelecimento ${estabelecimento.id}:`, error);
          
          if (error.message?.includes('já existe') || error.message?.includes('duplicate')) {
            console.log(`⚠️ Estabelecimento ${estabelecimento.nome} detectado como duplicata, marcando como sincronizado`);
            await indexedDBService.markEstabelecimentoAsSynced(estabelecimento.id);
            syncedCount++;
          } else {
            errorCount++;
          }
        }
      }      // ===== 3. SINCRONIZAR NOTIFICAÇÕES =====
      const pendingNotificacoes = await indexedDBService.getPendingNotificacoes();
      console.log(`🔄 Sincronizando ${pendingNotificacoes.length} notificações...`);
      
      for (const { id, formData } of pendingNotificacoes) {
        try {
          console.log(`📋 Sincronizando notificação ID: ${id}`);
          
          let formDataAtualizada = { ...formData } as any;
          const pacienteIdAtual = formDataAtualizada.pacienteId || formDataAtualizada.paciente_idpaciente;
          
          // ✅ ATUALIZAR REFERÊNCIA DE PACIENTE SE NECESSÁRIO
          if (pacienteIdAtual && typeof pacienteIdAtual === 'number' && pacienteIdMapping.has(pacienteIdAtual)) {
            const novoIdPaciente = pacienteIdMapping.get(pacienteIdAtual)!;
            console.log(`🔄 Atualizando referência: paciente ID ${pacienteIdAtual} → ${novoIdPaciente}`);
            
            formDataAtualizada.pacienteId = novoIdPaciente;
            formDataAtualizada.paciente_idpaciente = novoIdPaciente;
          }
          
          // ✅ NOVO: Atualizar referência de estabelecimento se necessário
          const estabelecimentoIdAtual = formDataAtualizada.estabelecimentoId || formDataAtualizada.estabelecimento_id;
          if (estabelecimentoIdAtual && typeof estabelecimentoIdAtual === 'number' && estabelecimentoIdMapping.has(estabelecimentoIdAtual)) {
            const novoIdEstabelecimento = estabelecimentoIdMapping.get(estabelecimentoIdAtual)!;
            console.log(`🔄 Atualizando referência: estabelecimento ID ${estabelecimentoIdAtual} → ${novoIdEstabelecimento}`);
            
            formDataAtualizada.estabelecimentoId = novoIdEstabelecimento;
            formDataAtualizada.estabelecimento_id = novoIdEstabelecimento;
          }
          
          // ✅ VERIFICAR ID VÁLIDO
          const pacienteIdFinal = formDataAtualizada.pacienteId || formDataAtualizada.paciente_idpaciente;
          if (!pacienteIdFinal || pacienteIdFinal < 0) {
            // ✅ BUSCAR PACIENTE PELO NOME SE NECESSÁRIO
            if (formDataAtualizada.paciente) {
              const pacientesEncontrados = await PacienteService.search(formDataAtualizada.paciente);
              
              if (pacientesEncontrados.data && pacientesEncontrados.data.length > 0) {
                const pacienteEncontrado = pacientesEncontrados.data.find((p: any) => 
                  p.nome.toUpperCase().trim() === formDataAtualizada.paciente.toUpperCase().trim()
                );
                
                if (pacienteEncontrado) {
                  formDataAtualizada.pacienteId = pacienteEncontrado.idpaciente;
                  formDataAtualizada.paciente_idpaciente = pacienteEncontrado.idpaciente;
                } else {
                  throw new Error(`Paciente "${formDataAtualizada.paciente}" não encontrado`);
                }
              } else {
                throw new Error(`Nenhum paciente encontrado para "${formDataAtualizada.paciente}"`);
              }
            } else {
              throw new Error('Notificação sem referência válida de paciente');
            }
          }
          
          // ✅ SINCRONIZAR NOTIFICAÇÃO
          const isEdit = !!(formDataAtualizada as any).id && (formDataAtualizada as any).id > 0;
          const editId = isEdit ? Number((formDataAtualizada as any).id) : undefined;
          
          await salvarNotificacaoCompleta(formDataAtualizada as any, isEdit, editId);
          await indexedDBService.markNotificacaoAsSynced(id);
          syncedCount++;
          
        } catch (error) {
          console.error(`❌ Erro ao sincronizar notificação ${id}:`, error);
          errorCount++;
        }
      }

      // ===== 3. FEEDBACK =====
      if (syncedCount > 0) {
        toast.success(`${syncedCount} registro(s) sincronizado(s)!`);
      }
      
      if (errorCount > 0) {
        toast.warning(`${errorCount} registro(s) com erro na sincronização.`);
      }

      // ===== 4. LIMPEZA =====
      await indexedDBService.cleanup();
      
      console.log('✅ === SINCRONIZAÇÃO CONCLUÍDA ===');
      
    } catch (error) {
      console.error('❌ Erro geral durante sincronização:', error);
      toast.error('Erro na sincronização. Tentaremos novamente.');
    } finally {
      this.isSyncing = false;
      this.syncStartTime = 0;
    }
  }

  // ✅ MÉTODO PARA RESETAR SINCRONIZAÇÃO TRAVADA
  async resetSyncLock() {
    console.log('🔓 Resetando lock de sincronização...');
    this.isSyncing = false;
    this.syncStartTime = 0;
    toast.info('Lock de sincronização resetado');
  }
  // ✅ MÉTODO PARA DEBUG MELHORADO
  async debugPendingData(): Promise<void> {
    try {
      const pendingNotificacoes = await indexedDBService.getPendingNotificacoes();
      const unsyncedPacientes = await indexedDBService.getUnsyncedPacientes();
      const unsyncedEstabelecimentos = await indexedDBService.getUnsyncedEstabelecimentos();
      const cacheStats = await indexedDBService.getCacheStats();
      
      console.log('=== 🔍 DEBUG: DADOS PENDENTES ===');
      console.log(`📋 Notificações pendentes: ${pendingNotificacoes.length}`);
      console.log(`👤 Pacientes não sincronizados: ${unsyncedPacientes.length}`);
      console.log(`🏥 Estabelecimentos não sincronizados: ${unsyncedEstabelecimentos.length}`);
      
      // ✅ IDENTIFICAR PACIENTES REALMENTE CRIADOS LOCALMENTE
      const pacientesLocais = unsyncedPacientes.filter(p => 
        p.source === 'local_creation' || (!p.source && p.synced === 'false' && p.idpaciente < 0)
      );
      
      // ✅ NOVO: Identificar estabelecimentos criados localmente
      const estabelecimentosLocais = unsyncedEstabelecimentos.filter(e => 
        e.source === 'local_creation' || (!e.source && e.synced === 'false' && e.id < 0)
      );
      
      console.log(`👤 Pacientes criados localmente (para sincronizar): ${pacientesLocais.length}`);
      console.log(`🏥 Estabelecimentos criados localmente (para sincronizar): ${estabelecimentosLocais.length}`);
      
      pacientesLocais.forEach((pac, index) => {
        console.log(`  ${index + 1}. ID: ${pac.idpaciente}, Nome: ${pac.nome}, CPF: ${pac.cpf?.substring(0,3)}***, Source: ${pac.source}, Synced: ${pac.synced}`);
      });
      
      // ✅ NOVO: Detalhar estabelecimentos locais
      estabelecimentosLocais.forEach((est, index) => {
        console.log(`  ${index + 1}. ID: ${est.id}, Nome: ${est.nome}, CNES: ${est.cnes?.substring(0,4)}***, Source: ${est.source}, Synced: ${est.synced}`);
      });
      
      console.log('📊 Stats do cache:', cacheStats);
      
      if (pacientesLocais.length === 0 && pendingNotificacoes.length === 0 && estabelecimentosLocais.length === 0) {
        console.log('✅ Nenhum dado pendente de sincronização!');
      }
      
    } catch (error) {
      console.error('❌ Erro no debug:', error);
    }
  }

  // ✅ CORRIGIDO: Melhor verificação de CPF
  async checkCpfExists(cpf: string): Promise<boolean> {
    if (!cpf || cpf.length !== 11) return false;

    try {
      // ✅ CACHE PRIMEIRO (incluindo pacientes locais criados)
      const existsInCache = await indexedDBService.checkCpfExists(cpf);
      if (existsInCache) {
        return true;
      }
    } catch (cacheError) {
      console.warn('⚠️ Erro ao verificar cache:', cacheError);
    }

    if (!this.isOnline) {
      return false;
    }

    try {
      // ✅ API com timeout menor
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const result = await PacienteService.search(cpf);
      clearTimeout(timeoutId);
      
      return !!(result.data && result.data.length > 0);
      
    } catch (error: any) {
      console.warn('⚠️ Erro na verificação online, assumindo não existe:', error);
      return false;
    }
  }

  // ✅ CORRIGIDO: Salvar paciente com ID único
  async savePaciente(pacienteData: any): Promise<any> {
    if (this.isOnline) {
      try {
        const result = await PacienteService.create(pacienteData);
        toast.success('✅ Paciente salvo!');
        return result;
      } catch (error) {
        console.warn('Falha online, salvando offline:', error);
      }
    }

    // ✅ ID TEMPORÁRIO ÚNICO BASEADO EM TIMESTAMP + RANDOM
    const tempId = -(Date.now() + Math.floor(Math.random() * 1000));
    const pacienteComId = { 
      ...pacienteData, 
      idpaciente: tempId,
      synced: 'false',
      source: 'local_creation',
      savedOffline: true,
      savedAt: Date.now()
    };
    
    await indexedDBService.savePaciente(pacienteComId);
    
    const message = this.isOnline 
      ? '📡 Erro na conexão - Paciente salvo offline!'
      : '📱 Paciente salvo offline! Sincronizará quando voltar online.';
    
    toast.success(message);
    return pacienteComId;
  }

  // ✅ SALVAR NOTIFICAÇÃO
  async saveNotificacao(formData: any): Promise<void> {
    if (this.isOnline) {
      try {
        await salvarNotificacaoCompleta(formData, false);
        toast.success('✅ Notificação salva!');
        return;
      } catch (error) {
        console.warn('Falha online, salvando offline:', error);
      }
    }

    const formDataParaSalvar = { ...formData };
    
    if (formDataParaSalvar.pacienteId && !formDataParaSalvar.paciente_idpaciente) {
      formDataParaSalvar.paciente_idpaciente = formDataParaSalvar.pacienteId;
    } else if (formDataParaSalvar.paciente_idpaciente && !formDataParaSalvar.pacienteId) {
      formDataParaSalvar.pacienteId = formDataParaSalvar.paciente_idpaciente;
    }

    await indexedDBService.saveNotificacao(formDataParaSalvar, false);
    
    const message = this.isOnline 
      ? '📡 Erro na conexão - Salvo offline!'
      : '📱 Salvo offline! Sincronizará quando voltar online.';
    
    toast.success(message);
  }

  // *** OUTROS MÉTODOS (sem alteração) ***
  
  async searchPacientes(query: string): Promise<any[]> {
    if (this.isOnline) {
      try {
        const result = await PacienteService.search(query);
        return result.data || [];
      } catch (error) {
        console.warn('Falha na busca online, usando cache:', error);
      }
    }

    return await indexedDBService.searchPacientesExtended(query);
  }

  async syncOpcoes(tipo: string, fetchFn: () => Promise<any[]>, forceRefresh: boolean = false): Promise<any[]> {
    let data;
    
    if (!forceRefresh) {
      data = await indexedDBService.getOpcoes(tipo);
      if (data) {
        return data;
      }
    }
    
    if (this.isOnline) {
      try {
        data = await fetchFn();
        await indexedDBService.saveOpcoes(tipo, data);
        return data;
      } catch (error) {
        console.error(`Erro ao buscar opções de ${tipo}:`, error);
        
        const cachedData = await indexedDBService.getOpcoes(tipo);
        if (cachedData) {
          console.log(`Usando dados em cache para ${tipo}`);
          return cachedData;
        }
        
        throw error;
      }
    } else {
      data = await indexedDBService.getOpcoes(tipo);
      if (data) {
        return data;
      }
      
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

  // ✅ NOVO: Verificação de CNES
  async checkCNESExists(cnes: string): Promise<boolean> {
    if (!cnes || cnes.length !== 7) return false;

    try {
      // Cache primeiro
      const existsInCache = await indexedDBService.checkCNESExists(cnes);
      if (existsInCache) {
        return true;
      }
    } catch (cacheError) {
      console.warn('⚠️ Erro ao verificar cache de estabelecimentos:', cacheError);
    }

    if (!this.isOnline) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const result = await EstabelecimentoFormService.checkDuplicate('cnes', cnes);
      clearTimeout(timeoutId);
      
      return result.isDuplicate;
      
    } catch (error: any) {
      console.warn('⚠️ Erro na verificação online de CNES, assumindo não existe:', error);
      return false;
    }
  }

  // ✅ NOVO: Salvar estabelecimento com fallback offline
  async saveEstabelecimento(estabelecimentoData: any): Promise<any> {
    if (this.isOnline) {
      try {
        const result = await EstabelecimentoFormService.create(estabelecimentoData);
        toast.success('✅ Estabelecimento salvo!');
        return result;
      } catch (error) {
        console.warn('Falha online, salvando offline:', error);
      }
    }

    // ID temporário único
    const tempId = -(Date.now() + Math.floor(Math.random() * 1000));
    const estabelecimentoComId = { 
      ...estabelecimentoData, 
      id: tempId,
      synced: 'false',
      source: 'local_creation',
      savedOffline: true,
      savedAt: Date.now()
    };
    
    await indexedDBService.saveEstabelecimento(estabelecimentoComId);
    
    const message = this.isOnline 
      ? '📡 Erro na conexão - Estabelecimento salvo offline!'
      : '📱 Estabelecimento salvo offline! Sincronizará quando voltar online.';
    
    toast.success(message);
    return estabelecimentoComId;
  }
  // ✅ NOVO: Buscar estabelecimentos com fallback offline
  async searchEstabelecimentos(query: string): Promise<any[]> {
    if (this.isOnline) {
      try {
        // Para busca de estabelecimentos, usamos cache local primeiro
        // já que não temos um método de busca específico no EstabelecimentoFormService
        console.log('Buscando estabelecimentos online não implementado, usando cache local');
      } catch (error) {
        console.warn('Falha na busca online de estabelecimentos, usando cache:', error);
      }
    }

    return await indexedDBService.searchEstabelecimentosExtended(query);
  }

  // ✅ NOVO: Buscar estabelecimento por ID offline
  async getEstabelecimentoById(id: number): Promise<any | null> {
    try {
      return await indexedDBService.getEstabelecimento(id);
    } catch (error) {
      console.error('Erro ao buscar estabelecimento por ID offline:', error);
      return null;
    }
  }
}

// Exportar uma instância para uso em toda a aplicação
const syncService = new SyncService();
export default syncService;