import indexedDBService from './indexedDB';
import PacienteService from '@/services/PacienteService';
import { EstabelecimentoFormService } from '@/services/EstabelecimentoFormService';
import { salvarNotificacaoCompleta } from '@/utils/notificacaoAdapter';
import { toast } from 'react-toastify';

class SyncService {
  private isOnline: boolean;
  private isAuthenticated: boolean = false;
  private syncInterval: number | null = null;
  private isSyncing: boolean = false;
  private syncStartTime: number = 0;
  private syncLockTimeout: number = 5 * 60 * 1000; // 5 minutos timeout
  private authCheckCooldown: number = 0;
  private authCheckInterval: number = 30000; // 30 segundos
  private consecutiveAuthFailures: number = 0; // ✅ Contar falhas consecutivas
  private maxConsecutiveFailures: number = 3; // ✅ Máximo de falhas antes de parar
  
  // ✅ NOVO: Lock atômico para prevenir race conditions
  private syncLockPromise: Promise<void> | null = null;
  private syncLockId: string | null = null;

  constructor() {
    this.isOnline = navigator.onLine;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Conexão restaurada - SyncService detectou evento online');
      // ✅ DELAY para evitar múltiplas sincronizações simultâneas
      setTimeout(async () => {
        await this.checkAuthenticationStatus();
        
        // ✅ NOVO: Disparar sincronização automática apenas se autenticado
        if (this.shouldUseOnlineMode()) {
          console.log('🔄 Iniciando sincronização automática após voltar online...');
          await this.syncData();
        }
      }, 2000);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.isAuthenticated = false;
      toast.info('Você está offline. Os dados serão salvos localmente.');
    });
  }

  // ✅ NOVO: Verificar se realmente pode fazer chamadas API
  private async checkAuthenticationStatus(): Promise<boolean> {
    // ✅ PRIORIDADE: Verificar conexão de rede PRIMEIRO
    if (!navigator.onLine) {
      console.log('🔒 Sem conexão de rede - modo offline');
      this.isOnline = false;
      this.isAuthenticated = false;
      return false;
    }

    if (!this.isOnline) {
      this.isAuthenticated = false;
      return false;
    }

    // ✅ Se houve muitas falhas consecutivas, aumentar o intervalo drasticamente
    if (this.consecutiveAuthFailures >= this.maxConsecutiveFailures) {
      const extendedInterval = this.authCheckInterval * 10; // 5 minutos em vez de 30 segundos
      const now = Date.now();
      if (now - this.authCheckCooldown < extendedInterval) {
        console.log(`🔕 Muitas falhas de auth (${this.consecutiveAuthFailures}), aguardando ${extendedInterval/1000}s antes da próxima tentativa`);
        return this.isAuthenticated;
      }
    }

    // ✅ Cooldown normal para evitar muitas verificações
    const now = Date.now();
    if (now - this.authCheckCooldown < this.authCheckInterval) {
      return this.isAuthenticated;
    }

    try {
      // ✅ Usar AbortController para timeout rápido
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos
      
      // ✅ Fazer uma chamada simples para verificar autenticação
      const response = await fetch('/api/usuario-acesso/current', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      this.isAuthenticated = response.ok;
      this.authCheckCooldown = now;

      if (this.isAuthenticated) {
        // ✅ Reset contador de falhas em caso de sucesso
        this.consecutiveAuthFailures = 0;
        console.log('✅ Autenticação verificada - modo online ativo');
        // ✅ Não mostrar toast repetidamente
      } else {
        // ✅ Incrementar contador de falhas
        this.consecutiveAuthFailures++;
        console.log(`❌ Não autenticado (401) - modo offline forçado (falha ${this.consecutiveAuthFailures}/${this.maxConsecutiveFailures})`);
        // ✅ Não mostrar toast repetidamente  
      }

      return this.isAuthenticated;
    } catch (error) {
      // ✅ Incrementar contador de falhas também em caso de erro de rede
      this.consecutiveAuthFailures++;
      
      // ✅ Distinguir entre erro de rede e erro de servidor
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`⏰ Timeout na verificação de auth - modo offline (falha ${this.consecutiveAuthFailures}/${this.maxConsecutiveFailures})`);
      } else {
        console.log(`🔒 Servidor indisponível - modo offline (falha ${this.consecutiveAuthFailures}/${this.maxConsecutiveFailures}):`, error instanceof Error ? error.message : String(error));
      }
      this.isAuthenticated = false;
      this.authCheckCooldown = now;
      return false;
    }
  }

  // ✅ NOVO: Verificar se deve usar modo online com auth
  private shouldUseOnlineMode(): boolean {
    return this.isOnline && this.isAuthenticated;
  }

  // ✅ NOVO: Forçar modo offline (para usuários que querem trabalhar offline)
  public forceOfflineMode(): void {
    console.log('🔒 Modo offline forçado pelo usuário');
    this.isAuthenticated = false;
    toast.info('Modo offline ativado - dados serão salvos localmente');
  }

  // ✅ NOVO: Tentar reativar modo online  
  public async tryOnlineMode(): Promise<boolean> {
    if (!this.isOnline) {
      toast.warning('Sem conexão de internet');
      return false;
    }

    const authenticated = await this.checkAuthenticationStatus();
    if (authenticated) {
      toast.success('Modo online ativado - sincronizando dados...');
      setTimeout(() => this.syncData(), 1000);
    } else {
      toast.error('Falha na autenticação - permanecendo offline');
    }
    
    return authenticated;
  }

  // ✅ PÚBLICO: Para outros componentes verificarem se devem usar modo online
  public async canUseOnlineMode(): Promise<boolean> {
    // ✅ PRIMEIRO: Verificar conectividade básica
    if (!this.isOnline) {
      console.log('🔇 Sem conectividade - modo offline automático');
      return false;
    }
    
    // ✅ Se já foi verificado recentemente, retorna direto
    const now = Date.now();
    if (now - this.authCheckCooldown < this.authCheckInterval) {
      return this.shouldUseOnlineMode();
    }
    
    // ✅ Só verificar autenticação se há conectividade
    await this.checkAuthenticationStatus();
    return this.shouldUseOnlineMode();
  }

  // ✅ PÚBLICO: Verificação simples de conectividade (sem auth)
  public hasInternetConnection(): boolean {
    return this.isOnline;
  }

  // ✅ NOVO: Verificação rápida se o servidor está disponível
  public async isServerAvailable(): Promise<boolean> {
    // ✅ PRIMEIRO: Verificar conexão de rede
    if (!navigator.onLine) {
      return false;
    }

    if (!this.isOnline) {
      return false;
    }

    try {
      // ✅ Verificação muito rápida (500ms timeout) usando endpoint conhecido
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 500);
      
      await fetch('/api/usuario-acesso/current', {
        method: 'HEAD', // Só cabeçalho, mais rápido que GET
        credentials: 'include',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      // ✅ Se chegou até aqui, servidor respondeu (200, 401, etc)
      return true;
    } catch (error) {
      // Se der qualquer erro (timeout, rede, etc), consideramos servidor indisponível
      return false;
    }
  }

  // ✅ CORRIGIDO: Intervalo maior e verificação de lock
  startPeriodicSync(intervalMs = 300000) { // 5 minutos em vez de 1
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = window.setInterval(async () => {
      if (this.isOnline && !this.isSyncing) {
        // ✅ Verificar autenticação antes de sincronizar
        await this.checkAuthenticationStatus();
        
        if (this.shouldUseOnlineMode()) {
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
      }
    }, intervalMs);
  }

  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // ✅ NOVO: Método para adquirir lock atômico
  private async acquireSyncLock(): Promise<string | null> {
    const lockId = `sync-${Date.now()}-${Math.random()}`;
    
    // Se já existe um lock ativo, esperar ele terminar
    if (this.syncLockPromise) {
      console.log('⏳ Aguardando sincronização em andamento terminar...');
      try {
        await this.syncLockPromise;
      } catch (error) {
        console.error('Erro na sincronização anterior:', error);
      }
    }
    
    // Verificar se ainda não há sincronização (double-check após await)
    if (this.isSyncing) {
      console.log('🔒 Sincronização já está em andamento (lock ativo)');
      return null;
    }
    
    // Verificar timeout de lock travado
    const now = Date.now();
    if (this.syncStartTime > 0 && (now - this.syncStartTime) > this.syncLockTimeout) {
      console.warn('⚠️ Sync parece travado, resetando lock...');
      this.releaseSyncLock();
    }
    
    // Adquirir lock
    this.isSyncing = true;
    this.syncStartTime = Date.now();
    this.syncLockId = lockId;
    
    console.log(`🔐 Lock de sincronização adquirido: ${lockId}`);
    return lockId;
  }
  
  // ✅ NOVO: Método para liberar lock
  private releaseSyncLock(lockId?: string): void {
    // Só liberar se o lockId corresponder (ou se não foi fornecido)
    if (!lockId || this.syncLockId === lockId) {
      this.isSyncing = false;
      this.syncStartTime = 0;
      this.syncLockId = null;
      this.syncLockPromise = null;
      console.log('🔓 Lock de sincronização liberado');
    } else {
      console.warn(`⚠️ Tentativa de liberar lock incorreto: ${lockId} vs ${this.syncLockId}`);
    }
  }

  // ✅ CORRIGIDO: Sincronização com lock atômico
  async syncData() {
    // ✅ Verificar auth antes de sincronizar
    await this.checkAuthenticationStatus();
    
    if (!this.shouldUseOnlineMode()) {
      console.log('📱 Sem conexão autenticada para sincronizar');
      return;
    }

    // ✅ NOVO: Tentar adquirir lock atômico
    const lockId = await this.acquireSyncLock();
    if (!lockId) {
      console.log('🔄 Sincronização já em andamento, pulando...');
      return;
    }

    // ✅ NOVO: Criar Promise para o lock
    this.syncLockPromise = (async () => {
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
          console.log(`🔍 DEBUG - Dados originais do paciente:`, {
            gestante: paciente.gestante,
            gestante_tipo: typeof paciente.gestante,
            dadosCompletos: paciente
          });
          
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
  console.log(`🔍 DEBUG - Dados do servidor:`, {
    gestante: matchingPatient.gestante,
    nome: matchingPatient.nome
  });
  console.log(`🔍 DEBUG - Dados locais:`, {
    gestante: paciente.gestante,
    nome: paciente.nome
  });
  
  // ✅ ATUALIZAR DADOS LOCAIS COM DADOS DO SERVIDOR (para consistência)
  const updatedPaciente = {
    ...paciente,
    ...matchingPatient, // Sobrescrever com dados do servidor
    idpaciente: paciente.idpaciente, // Manter ID local para referência
    serverIdpaciente: matchingPatient.idpaciente,
    synced: 'true',
    syncedAt: Date.now()
  };
  
  // ✅ USAR savePaciente que já existe para atualizar
  await indexedDBService.savePaciente(updatedPaciente);
  
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
            cpf: pacienteData.cpf,
            gestante: pacienteData.gestante,
            allData: pacienteData // ✅ DEBUG: Log completo dos dados
          });
          
          const result = await PacienteService.create(pacienteData);
          const newPatientId = result.idpaciente;
          
          if (!newPatientId) {
            throw new Error('Servidor não retornou ID válido');
          }
          
          console.log(`✅ Novo paciente criado: ID temp ${idpaciente} → ID perm ${newPatientId}`);
          console.log(`🔍 DEBUG - Dados enviados:`, {
            gestante: pacienteData.gestante,
            nome: pacienteData.nome
          });
          console.log(`🔍 DEBUG - Resposta do servidor:`, {
            gestante: result.gestante,
            nome: result.nome,
            id: result.idpaciente
          });
          
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
      
      for (const { id, formData, offlineId, deviceId } of pendingNotificacoes) {
        try {
          console.log(`📋 Sincronizando notificação offlineId: ${offlineId} (ID temp: ${id})`);
          
          let formDataAtualizada = { ...formData } as any;
          
          // ✅ NOVO: Adicionar campos de rastreamento offline (snake_case para o backend)
          formDataAtualizada.offline_id = offlineId;
          formDataAtualizada.device_id = deviceId;
          formDataAtualizada.created_offline = true;
          formDataAtualizada.sincronizado = false; // Será setado como true pelo backend após salvar
          
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
          
          // ✅ DEBUG ESPECÍFICO: Log dos campos de trauma antes da sincronização
          console.log(`🩹 [DEBUG TRAUMA] Sincronizando notificação ID ${id}:`, {
            tipoTrauma: formDataAtualizada.tipoTrauma,
            observacaoTrauma: formDataAtualizada.observacaoTrauma,
            observacaoSintomas: formDataAtualizada.observacaoSintomas,
            observacaoHipotese: formDataAtualizada.observacaoHipotese
          });

          // ✅ LOG CAMPOS OFFLINE ANTES DE SINCRONIZAR
          console.log('📱 [OFFLINE TRACKING] Enviando ao servidor:', {
            offline_id: formDataAtualizada.offline_id,
            device_id: formDataAtualizada.device_id,
            created_offline: formDataAtualizada.created_offline,
            sincronizado: formDataAtualizada.sincronizado
          });

          // ✅ CRÍTICO: Marcar como 'syncing' ANTES de enviar ao servidor (usar offlineId)
          await indexedDBService.markNotificacaoAsSyncing(offlineId);

          // ✅ SINCRONIZAR NOTIFICAÇÃO
          const isEdit = !!(formDataAtualizada as any).id && (formDataAtualizada as any).id > 0;
          const editId = isEdit ? Number((formDataAtualizada as any).id) : undefined;
          
          await salvarNotificacaoCompleta(formDataAtualizada as any, isEdit, editId);
          
          // ✅ Marcar como sincronizada SOMENTE após sucesso (usar offlineId)
          await indexedDBService.markNotificacaoAsSynced(offlineId);
          syncedCount++;
          
        } catch (error: any) {
          console.error(`❌ Erro ao sincronizar notificação offlineId ${offlineId}:`, error);
          
          // ✅ REVERTER de 'syncing' para 'pending' ou marcar como erro
          const isServerError = error?.response?.status === 500;
          const isOrphanedNotification = id < 0;
          const isInvalidData = error?.message?.includes('validation') || error?.message?.includes('required');
          const isNetworkError = !error?.response || error?.code === 'NETWORK_ERROR';
          
          if (isOrphanedNotification) {
            // Apenas notificações órfãs devem ser removidas permanentemente
            console.log(`🗑️ Removendo notificação órfã offlineId ${offlineId} - ID negativo inválido`);
            await indexedDBService.markNotificacaoAsSynced(offlineId);
            toast.info(`Notificação órfã (offlineId: ${offlineId}) foi removida da fila de sincronização`);
          } else {
            // ✅ TODOS OS OUTROS ERROS: Marcar como erro para retry posterior
            const errorMessage = isServerError ? 'Erro interno do servidor' :
                                isInvalidData ? 'Dados inválidos na notificação' :
                                isNetworkError ? 'Erro de conexão' :
                                error?.message || 'Erro desconhecido';
            
            const errorDetails = {
              status: error?.response?.status,
              message: error?.message,
              timestamp: Date.now(),
              notificationId: id,
              offlineId: offlineId
            };
            
            await indexedDBService.markNotificacaoAsError(offlineId, errorMessage, errorDetails);
            
            toast.error(`Erro ao sincronizar notificação ${offlineId}: ${errorMessage}`, {
              autoClose: false, // Não fechar automaticamente para dar tempo do usuário ler
              toastId: `sync-error-${id}` // Evitar duplicatas
            });
            
            errorCount++;
          }
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
      // ✅ NOVO: Liberar lock no finally
      this.releaseSyncLock(lockId);
    }
    })(); // Fechar a Promise do lock
    
    // Aguardar a Promise terminar
    await this.syncLockPromise;
  }

  // ✅ MÉTODO PARA RESETAR SINCRONIZAÇÃO TRAVADA
  async resetSyncLock() {
    console.log('🔓 Resetando lock de sincronização...');
    this.releaseSyncLock();
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

  // ✅ NOVO: Método para limpar dados órfãos/corrompidos
  async clearOrphanedData(): Promise<void> {
    try {
      console.log('🧹 === INICIANDO LIMPEZA DE DADOS ÓRFÃOS ===');
      
      // 1. Verificar notificações com IDs negativos ou dados inválidos
      const pendingNotificacoes = await indexedDBService.getPendingNotificacoes();
      let clearedCount = 0;
      
      for (const notif of pendingNotificacoes) {
        let shouldClear = false;
        let reason = '';
        
        // Verificar ID negativo
        if (notif.id < 0) {
          shouldClear = true;
          reason = 'ID negativo';
        }
        
        // Verificar se tem dados mínimos necessários
        const formData = notif.formData as any;
        if (!formData || !formData.tipoEvento) {
          shouldClear = true;
          reason = reason ? `${reason}, dados incompletos` : 'dados incompletos';
        }
        
        // Verificar se paciente existe (se necessário)
        const pacienteId = (formData as any)?.pacienteId || (formData as any)?.paciente_idpaciente;
        if (pacienteId && pacienteId < 0) {
          // Verificar se o paciente ainda existe no IndexedDB
          try {
            const pacienteExists = await indexedDBService.getAll('pacientes').then(pacientes => 
              pacientes.some(p => p.idpaciente === pacienteId)
            );
            
            if (!pacienteExists) {
              shouldClear = true;
              reason = reason ? `${reason}, paciente órfão` : 'paciente órfão';
            }
          } catch (error) {
            console.warn(`⚠️ Erro ao verificar paciente ${pacienteId}:`, error);
          }
        }
        
        if (shouldClear) {
          console.log(`🗑️ Removendo notificação órfã offlineId ${notif.offlineId}: ${reason}`);
          await indexedDBService.markNotificacaoAsSynced(notif.offlineId); // ✅ Usar offlineId
          clearedCount++;
        }
      }
      
      // 2. Limpar pacientes órfãos (sem notificações associadas)
      const unsyncedPacientes = await indexedDBService.getUnsyncedPacientes();
      const allNotifications = await indexedDBService.getAll('notificacoes');
      
      for (const paciente of unsyncedPacientes) {
        const hasNotifications = allNotifications.some(notif => {
          const formData = notif.formData as any;
          const pacienteId = formData?.pacienteId || formData?.paciente_idpaciente;
          return pacienteId === paciente.idpaciente;
        });
        
        // Se não tem notificações e foi criado há mais de 24h, remover
        const isOld = Date.now() - (paciente.timestamp || 0) > 24 * 60 * 60 * 1000;
        
        if (!hasNotifications && isOld && paciente.idpaciente < 0) {
          console.log(`🗑️ Removendo paciente órfão: ${paciente.nome} (ID: ${paciente.idpaciente})`);
          await indexedDBService.markPacienteAsSynced(paciente.idpaciente);
          clearedCount++;
        }
      }
      
      if (clearedCount > 0) {
        console.log(`✅ Limpeza concluída: ${clearedCount} registro(s) órfão(s) removido(s)`);
        toast.success(`Limpeza concluída: ${clearedCount} registro(s) órfão(s) removido(s)`);
      } else {
        console.log('✅ Nenhum dado órfão encontrado');
        toast.info('Nenhum dado órfão encontrado');
      }
      
    } catch (error) {
      console.error('❌ Erro na limpeza de dados órfãos:', error);
      toast.error('Erro na limpeza de dados órfãos');
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

    await this.checkAuthenticationStatus();
    if (!this.shouldUseOnlineMode()) {
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
    await this.checkAuthenticationStatus();
    if (this.shouldUseOnlineMode()) {
      try {
        const result = await PacienteService.create(pacienteData);
        toast.success('✅ Paciente salvo!');
        return result;
      } catch (error) {
        console.warn('Falha online, salvando offline:', error);
        this.isAuthenticated = false;
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

  // ✅ SALVAR NOTIFICAÇÃO (NOVA OU EXISTENTE)
  async saveNotificacao(formData: any, isEdit: boolean = false): Promise<void> {
    // Verificar se é uma edição e existe um ID válido
    const notificacaoId = formData.id || formData.idnotificacao;
    
    // ✅ Verificar autenticação antes de tentar online
    await this.checkAuthenticationStatus();
    
    if (this.shouldUseOnlineMode() && !isEdit) {
      // Para novas notificações, tentar salvar online primeiro
      try {
        await salvarNotificacaoCompleta(formData, false);
        toast.success('✅ Notificação salva!');
        return;
      } catch (error) {
        console.warn('Falha online, salvando offline:', error);
        // ✅ Se falhar, marcar como não autenticado para próximas tentativas
        this.isAuthenticated = false;
      }
    } else if (this.shouldUseOnlineMode() && isEdit && notificacaoId) {
      // Para edições online, tentar atualizar
      try {
        await salvarNotificacaoCompleta(formData, true, notificacaoId);
        toast.success('✅ Notificação atualizada!');
        return;
      } catch (error) {
        console.warn('Falha online ao editar, salvando offline:', error);
        // ✅ Se falhar, marcar como não autenticado para próximas tentativas
        this.isAuthenticated = false;
      }
    }

    // Salvar offline (seja nova ou edição)
    const formDataParaSalvar = { ...formData };
    
    // ✅ CORREÇÃO: Garantir campos de ID consistentes
    if (formDataParaSalvar.pacienteId && !formDataParaSalvar.paciente_idpaciente) {
      formDataParaSalvar.paciente_idpaciente = formDataParaSalvar.pacienteId;
    } else if (formDataParaSalvar.paciente_idpaciente && !formDataParaSalvar.pacienteId) {
      formDataParaSalvar.pacienteId = formDataParaSalvar.paciente_idpaciente;
    }

    // ✅ LOG DETALHADO PARA DEBUG
    console.log(`💾 [SYNC SERVICE] Salvando ${isEdit ? 'edição' : 'nova notificação'} offline:`, {
      id: notificacaoId || 'novo',
      isEdit,
      // Campos críticos para verificação
      localHospedagem: formDataParaSalvar.localHospedagem,
      contatoLocal: formDataParaSalvar.contatoLocal,
      uf: formDataParaSalvar.uf,
      municipio: formDataParaSalvar.municipio,
      bairro: formDataParaSalvar.bairro,
      paisProcedencia: formDataParaSalvar.paisProcedencia,
      residenteBelem: formDataParaSalvar.residenteBelem,
    });

    await indexedDBService.saveNotificacao(formDataParaSalvar, isEdit, notificacaoId);
    
    const message = this.shouldUseOnlineMode() 
      ? '📡 Erro na conexão - Salvo offline!'
      : `📱 ${isEdit ? 'Edição salva' : 'Salvo'} offline! Sincronizará quando voltar online.`;
    
    toast.success(message);
  }

  // *** OUTROS MÉTODOS (sem alteração) ***
  
  async searchPacientes(query: string): Promise<any[]> {
    await this.checkAuthenticationStatus();
    if (this.shouldUseOnlineMode()) {
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
    
    await this.checkAuthenticationStatus();
    if (this.shouldUseOnlineMode()) {
      try {
        data = await fetchFn();
        await indexedDBService.saveOpcoes(tipo, data);
        return data;
      } catch (error) {
        console.error(`Erro ao buscar opções de ${tipo}:`, error);
        this.isAuthenticated = false;
        
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
    return this.shouldUseOnlineMode();
  }

  isSyncInProgress() {
    return this.isSyncing;
  }

  async getPendingCount() {
    return await indexedDBService.getPendingCount();
  }

  async forceSyncData() {
    await this.checkAuthenticationStatus();
    if (!this.shouldUseOnlineMode()) {
      toast.warning('Você está offline ou não autenticado. Não é possível sincronizar agora.');
      return false;
    }
    
    if (this.isSyncing) {
      toast.info('Sincronização já está em andamento.');
      return false;
    }
    
    await this.syncData();
    return true;
  }

  // ✅ ATUALIZADO: Tentar sincronizar novamente uma notificação com erro (usar offlineId)
  async retryNotificationSync(offlineId: string): Promise<boolean> {
    try {
      console.log(`🔄 Tentando sincronizar novamente a notificação offlineId: ${offlineId}`);
      
      // Resetar status para pending
      await indexedDBService.retryNotificacao(offlineId);
      
      // Obter todas notificações e buscar pelo offlineId
      const allNotificacoes = await indexedDBService.getAll('notificacoes');
      const notificacao = allNotificacoes.find((n: any) => n.offlineId === offlineId);
      
      if (!notificacao) {
        throw new Error(`Notificação ${offlineId} não encontrada`);
      }

      // Verificar autenticação
      await this.checkAuthenticationStatus();
      if (!this.shouldUseOnlineMode()) {
        throw new Error('Sem conexão autenticada');
      }

      // Tentar sincronizar
      const isEdit = !!(notificacao.formData as any).id && (notificacao.formData as any).id > 0;
      const editId = isEdit ? Number((notificacao.formData as any).id) : undefined;
      
      await salvarNotificacaoCompleta(notificacao.formData as any, isEdit, editId);
      await indexedDBService.markNotificacaoAsSynced(offlineId);
      
      toast.success(`✅ Notificação ${offlineId} sincronizada com sucesso!`);
      return true;
      
    } catch (error: any) {
      console.error(`❌ Erro ao tentar sincronizar novamente notificação ${offlineId}:`, error);
      
      // Marcar como erro novamente
      const errorMessage = error?.response?.status === 500 ? 'Erro interno do servidor' :
                          error?.message?.includes('validation') ? 'Dados inválidos' :
                          error?.message || 'Erro desconhecido';
      
      await indexedDBService.markNotificacaoAsError(offlineId, errorMessage, error);
      
      toast.error(`Falha ao sincronizar notificação ${offlineId}: ${errorMessage}`);
      return false;
    }
  }

  // ✅ NOVO: Obter notificações com erro
  async getErrorNotifications(): Promise<Array<{ id: number, formData: any, errorInfo: any }>> {
    return await indexedDBService.getErrorNotificacoes();
  }

  // ✅ ATUALIZADO: Método para forçar limpeza de notificação específica (usar offlineId)
  async forceRemovePendingNotification(offlineId: string): Promise<boolean> {
    try {
      console.log(`🗑️ Forçando remoção da notificação pendente offlineId: ${offlineId}`);
      
      await indexedDBService.markNotificacaoAsSynced(offlineId);
      
      const newCount = await this.getPendingCount();
      console.log(`✅ Notificação ${offlineId} removida. Pendentes restantes: ${newCount.notificacoes}`);
      
      toast.success(`Notificação problemática (offlineId: ${offlineId}) foi removida`);
      return true;
      
    } catch (error) {
      console.error(`❌ Erro ao remover notificação ${offlineId}:`, error);
      toast.error(`Erro ao remover notificação ${offlineId}`);
      return false;
    }
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

    await this.checkAuthenticationStatus();
    if (!this.shouldUseOnlineMode()) {
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
    await this.checkAuthenticationStatus();
    if (this.shouldUseOnlineMode()) {
      try {
        const result = await EstabelecimentoFormService.create(estabelecimentoData);
        toast.success('✅ Estabelecimento salvo!');
        return result;
      } catch (error) {
        console.warn('Falha online, salvando offline:', error);
        this.isAuthenticated = false;
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
    
    const message = this.shouldUseOnlineMode() 
      ? '📡 Erro na conexão - Estabelecimento salvo offline!'
      : '📱 Estabelecimento salvo offline! Sincronizará quando voltar online.';
    
    toast.success(message);
    return estabelecimentoComId;
  }
  // ✅ NOVO: Buscar estabelecimentos com fallback offline
  async searchEstabelecimentos(query: string): Promise<any[]> {
    await this.checkAuthenticationStatus();
    if (this.shouldUseOnlineMode()) {
      try {
        // Para busca de estabelecimentos, usamos cache local primeiro
        // já que não temos um método de busca específico no EstabelecimentoFormService
        console.log('Buscando estabelecimentos online não implementado, usando cache local');
      } catch (error) {
        console.warn('Falha na busca online de estabelecimentos, usando cache:', error);
        this.isAuthenticated = false;
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

// ✅ EXPOR GLOBALMENTE PARA DEBUG NO CONSOLE (apenas em desenvolvimento)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).syncService = syncService;
  console.log('🔧 syncService disponível globalmente para debug');
}

export default syncService;