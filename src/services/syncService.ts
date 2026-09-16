import indexedDBService from './indexedDB';
import PacienteService from '@/services/PacienteService';
import {
  CPF_IDENTITY_CONFLICT_MESSAGE,
  findExistingPatientByPriority,
  isCpfIdentityConflictError,
  isCpfIdentityConflictMatch,
  isReusablePatientMatch,
} from '@/features/notificationForms/utils/patientLookupHelpers';
import { EstabelecimentoFormService } from '@/services/EstabelecimentoFormService';
import { NotificacaoService } from '@/services/NotificacaoService';
import { salvarNotificacaoCompleta } from '@/utils/notificacaoAdapter';
import { toast } from 'react-toastify';
import { convertLocalDateTimeToUTC } from '@/utils/timezoneUtils';
import axios from '@/utils/axiosRetry';

const searchPatientsForSync = async (query: string): Promise<any[]> => {
  const result = await PacienteService.search(query);
  return result.data || [];
};

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
  private readonly anexoBatchSize: number = 10;

  // 🆕 MODO OFFLINE FORÇADO (tipo Spotify)
  private isOfflineModeForced: boolean = false;
  private readonly FORCE_OFFLINE_KEY = 'sp.sync.force-offline.v1';
  private readonly LEGACY_FORCE_OFFLINE_KEY = 'app_force_offline_mode';

  constructor() {
    this.isOnline = navigator.onLine;
    
    // Restaurar preferência de modo offline do localStorage.
    // Envolvido em try/catch porque Safari/Firefox em modo privado (e browsers com
    // armazenamento restrito) lançam SecurityError ao acessar localStorage —
    // o que travaria toda a aplicação antes do React montar.
    try {
      const savedOfflineMode = localStorage.getItem(this.FORCE_OFFLINE_KEY) ?? localStorage.getItem(this.LEGACY_FORCE_OFFLINE_KEY);
      
      if (savedOfflineMode === null || savedOfflineMode === undefined) {
        this.isOfflineModeForced = false;
        localStorage.setItem(this.FORCE_OFFLINE_KEY, 'false');
        localStorage.removeItem(this.LEGACY_FORCE_OFFLINE_KEY);
      } else {
        this.isOfflineModeForced = savedOfflineMode === 'true';
        localStorage.setItem(this.FORCE_OFFLINE_KEY, this.isOfflineModeForced ? 'true' : 'false');
        localStorage.removeItem(this.LEGACY_FORCE_OFFLINE_KEY);
      }
    } catch {
      this.isOfflineModeForced = false;
    }
    
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

  private getSyncTimestamp(record: any): number {
    return Number(record?.timestamp ?? record?.savedAt ?? record?.created_at ?? 0) || 0;
  }

  private isCreationRecord(record: any): boolean {
    if (!record) return true;
    if (record.createdOffline === true) return true;
    if (record.isEdit === true) return false;

    const id = record.id ?? record.idnotificacao ?? record.id_comunicacao;
    if (typeof id === 'number') return id <= 0;

    return true;
  }

  private extractServerNotificationId(payload: any): number | null {
    const candidates = [
      payload?.idnotificacao,
      payload?.id,
      payload?.data?.idnotificacao,
      payload?.data?.id,
      payload?.notificacao?.idnotificacao,
      payload?.notificacao?.id,
      payload?.data?.notificacao?.idnotificacao,
    ];
    for (const raw of candidates) {
      if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw;
      if (typeof raw === 'string' && raw.trim() !== '') {
        const parsed = Number(raw);
        if (Number.isFinite(parsed) && parsed > 0) return parsed;
      }
    }
    return null;
  }

  private async reconcileNotificationConflict(
    offlineId: string,
    localDeviceId?: string
  ): Promise<number | null> {
    const MAX_PAGES = 3;
    const PAGE_SIZE = 200;

    for (let page = 1; page <= MAX_PAGES; page++) {
      const response = await NotificacaoService.getAll(page, PAGE_SIZE);
      const items = response?.data || [];
      if (items.length === 0) break;

      const match = items.find((item: any) => {
        const original = item.original || item;
        const sameOfflineId =
          original?.offline_id === offlineId ||
          original?.offlineId === offlineId;
        const sameDevice = localDeviceId && (
          original?.device_id === localDeviceId ||
          original?.deviceId === localDeviceId
        );
        return sameOfflineId || Boolean(sameDevice && sameOfflineId);
      });

      if (match) {
        const original = match.original || match;
        return this.extractServerNotificationId(original);
      }
    }

    return null;
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
      const response = await axios.get('/api/usuario-acesso/current', {
        withCredentials: true,
        timeout: 3000,
        headers: {
          Accept: 'application/json',
        },
        validateStatus: () => true,
      });

      this.isAuthenticated = response.status >= 200 && response.status < 300;
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
    // 🆕 Se modo offline forçado, SEMPRE retornar false
    if (this.isOfflineModeForced) {
      return false;
    }
    return this.isOnline && this.isAuthenticated;
  }

  // ✅ NOVO: Forçar modo offline (para usuários que querem trabalhar offline)
  public forceOfflineMode(): void {
    console.log('🔒 Modo offline forçado pelo usuário');
    this.isOfflineModeForced = true;
    this.isAuthenticated = false;
    localStorage.setItem(this.FORCE_OFFLINE_KEY, 'true');
    toast.info('📵 Modo offline ativado - dados serão salvos localmente');
  }

  // ✅ NOVO: Tentar reativar modo online  
  public async tryOnlineMode(): Promise<boolean> {
    // 🆕 Desativar modo offline forçado
    this.isOfflineModeForced = false;
    localStorage.setItem(this.FORCE_OFFLINE_KEY, 'false');
    
    if (!this.isOnline) {
      toast.warning('Sem conexão de internet');
      return false;
    }

    const authenticated = await this.checkAuthenticationStatus();
    if (authenticated) {
      toast.success('🌐 Modo online ativado - sincronizando dados...');
      setTimeout(() => this.syncData(), 1000);
    } else {
      toast.error('Falha na autenticação - permanecendo offline');
    }
    
    return authenticated;
  }

  // 🆕 NOVOS MÉTODOS PÚBLICOS PARA CONTROLE DO MODO OFFLINE FORÇADO

  /**
   * Verifica se o modo offline está forçado pelo usuário
   */
  public isOfflineModeActive(): boolean {
    return this.isOfflineModeForced;
  }

  /**
   * Ativa o modo offline forçado
   */
  public enableOfflineMode(): void {
    if (this.isOfflineModeForced) {
      console.log('📵 Modo offline já está ativo');
      return;
    }
    
    this.isOfflineModeForced = true;
    this.isAuthenticated = false;
    localStorage.setItem(this.FORCE_OFFLINE_KEY, 'true');
    
    console.log('📵 Modo offline ATIVADO pelo usuário');
    toast.success('📵 Modo offline ativado - você pode trabalhar sem internet', {
      autoClose: 3000
    });
  }

  /**
   * Desativa o modo offline forçado e tenta reconectar
   */
  public async disableOfflineMode(): Promise<boolean> {
    if (!this.isOfflineModeForced) {
      console.log('🌐 Modo offline já está desativado');
      return this.shouldUseOnlineMode();
    }
    
    this.isOfflineModeForced = false;
    localStorage.setItem(this.FORCE_OFFLINE_KEY, 'false');
    
    console.log('🌐 Modo offline DESATIVADO pelo usuário');
    
    // Tentar reconectar se houver internet
    if (this.isOnline) {
      const authenticated = await this.checkAuthenticationStatus();
      if (authenticated) {
        this.isAuthenticated = true; // ✅ Garantir que está autenticado
        toast.success('🌐 Modo online ativado - sincronizando dados...', {
          autoClose: 3000
        });
        setTimeout(() => this.syncData(), 1000);
        return true;
      } else {
        // ✅ MESMO se autenticação falhar, permitir modo online
        // O usuário explicitamente pediu para sair do modo offline
        this.isAuthenticated = true;
        toast.success('🌐 Modo online ativado', {
          autoClose: 3000
        });
        return true;
      }
    } else {
      // ✅ Sem internet, mas permitir modo online (vai tentar quando conectar)
      this.isAuthenticated = true;
      toast.info('🌐 Modo online ativado - aguardando conexão de internet', {
        autoClose: 3000
      });
      return true;
    }
  }

  /**
   * Alterna entre modo offline e online
   */
  public async toggleOfflineMode(): Promise<boolean> {
    if (this.isOfflineModeForced) {
      return await this.disableOfflineMode();
    } else {
      this.enableOfflineMode();
      return false; // Retorna false porque está offline agora
    }
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
      let syncedNotificacoes = 0;
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
      pacientesParaSincronizar.sort((a, b) => this.getSyncTimestamp(a) - this.getSyncTimestamp(b));
      
      console.log(`🔄 ${pacientesParaSincronizar.length} pacientes realmente criados localmente para sincronizar`);
      
      for (const paciente of pacientesParaSincronizar) {
        try {
          console.log(`👤 Sincronizando paciente local ID ${paciente.idpaciente}`);
          
          // ✅ VERIFICAR SE JÁ EXISTE NO SERVIDOR (evitar duplicação)
          // Usar estratégia inteligente de múltiplos critérios
          let pacienteExistenteServidor = null;
          
          // ESTRATÉGIA 1: Buscar por CPF (se disponível)
          if (paciente.cpf) {
            try {
              console.log(`🔍 Buscando paciente no servidor por CPF: ${paciente.cpf}`);
              const existingSearch = await PacienteService.search(paciente.cpf);
              
              if (existingSearch.data && existingSearch.data.length > 0) {
                // Verificar se é realmente o mesmo paciente (CPF + Nome)
                const matchingPatient = existingSearch.data.find((p: any) => 
                  p.cpf === paciente.cpf && 
                  p.nome.toLowerCase().trim() === paciente.nome.toLowerCase().trim()
                );
                
                if (matchingPatient) {
                  pacienteExistenteServidor = matchingPatient;
                  console.log(`✅ Paciente encontrado no servidor por CPF (ID: ${matchingPatient.idpaciente})`);
                }
              }
            } catch (searchError) {
              console.warn('⚠️ Erro ao buscar por CPF, tentando outros métodos...');
            }
          }
          
          // ESTRATÉGIA 2: Buscar por Nome + Data de Nascimento (se não encontrou por CPF)
          if (!pacienteExistenteServidor && paciente.nome && paciente.data_nascimento) {
            try {
              console.log(`🔍 Buscando paciente no servidor por Nome + Data de Nascimento`);
              const existingSearch = await PacienteService.search(paciente.nome);
              
              if (existingSearch.data && existingSearch.data.length > 0) {
                // ✅ FILTRAR: Nome EXATO + Data de nascimento
                const nomeNormalizado = paciente.nome.toUpperCase().trim();
                const matchingPatient = existingSearch.data.find((p: any) => {
                  if (!p.data_nascimento) return false;
                  const nomeMatch = p.nome.toUpperCase().trim() === nomeNormalizado;
                  const dataPaciente = new Date(p.data_nascimento).toISOString().split('T')[0];
                  const dataLocal = new Date(paciente.data_nascimento).toISOString().split('T')[0];
                  const dataMatch = dataPaciente === dataLocal;
                  return nomeMatch && dataMatch;
                });
                
                if (matchingPatient) {
                  pacienteExistenteServidor = matchingPatient;
                  console.log(`✅ Paciente encontrado no servidor por Nome + Data (ID: ${matchingPatient.idpaciente})`);
                }
              }
            } catch (searchError) {
              console.warn('⚠️ Erro ao buscar por nome e data...');
            }
          }
          
          // ESTRATÉGIA 3: Buscar por Nome + Nome da Mãe (se ainda não encontrou)
          if (!pacienteExistenteServidor && paciente.nome && paciente.nome_mae && paciente.nome_mae.length > 5) {
            try {
              console.log(`🔍 Buscando paciente no servidor por Nome + Nome da Mãe`);
              const existingSearch = await PacienteService.search(paciente.nome);
              
              if (existingSearch.data && existingSearch.data.length > 0) {
                // ✅ FILTRAR: Nome EXATO + Nome da mãe EXATO
                const nomeNormalizado = paciente.nome.toUpperCase().trim();
                const nomeMaeNormalizado = paciente.nome_mae.toUpperCase().trim();
                const matchingPatient = existingSearch.data.find((p: any) => {
                  if (!p.nome_mae) return false;
                  const nomeMatch = p.nome.toUpperCase().trim() === nomeNormalizado;
                  const nomeMaeServidor = p.nome_mae.toUpperCase().trim();
                  const maeMatch = nomeMaeServidor === nomeMaeNormalizado;
                  return nomeMatch && maeMatch;
                });
                
                if (matchingPatient) {
                  pacienteExistenteServidor = matchingPatient;
                  console.log(`✅ Paciente encontrado no servidor por Nome + Mãe (ID: ${matchingPatient.idpaciente})`);
                }
              }
            } catch (searchError) {
              console.warn('⚠️ Erro ao buscar por nome e mãe...');
            }
          }
          
          // Se encontrou paciente existente no servidor, usar ele
          if (pacienteExistenteServidor) {
            console.log(`✅ Paciente ${paciente.nome} já existe no servidor (ID: ${pacienteExistenteServidor.idpaciente})`);
            console.log(`🔍 DEBUG - Dados do servidor:`, {
              gestante: pacienteExistenteServidor.gestante,
              nome: pacienteExistenteServidor.nome
            });
            console.log(`🔍 DEBUG - Dados locais:`, {
              gestante: paciente.gestante,
              nome: paciente.nome
            });
            
            // ✅ ATUALIZAR DADOS LOCAIS COM DADOS DO SERVIDOR (para consistência)
            const updatedPaciente = {
              ...paciente,
              ...pacienteExistenteServidor, // Sobrescrever com dados do servidor
              idpaciente: paciente.idpaciente, // Manter ID local para referência
              serverIdpaciente: pacienteExistenteServidor.idpaciente,
              synced: 'true',
              syncedAt: Date.now()
            };
            
            // ✅ USAR savePaciente que já existe para atualizar
            await indexedDBService.savePaciente(updatedPaciente);
            
            // ✅ USAR ID DO SERVIDOR E MARCAR COMO SINCRONIZADO
            if (pacienteExistenteServidor.idpaciente) {
              pacienteIdMapping.set(paciente.idpaciente, pacienteExistenteServidor.idpaciente);
              // 🔧 CORREÇÃO: Passar também o ID do servidor
              await indexedDBService.markPacienteAsSynced(paciente.idpaciente, pacienteExistenteServidor.idpaciente);
              syncedCount++;
            }
            
            continue; // Não criar novo, usar existente
          }

          // ✅ SEGURANÇA ANTI-DUPLICATA: sem CPF, evitar criar homônimos automaticamente
          if (!pacienteExistenteServidor && !paciente.cpf && paciente.nome) {
            try {
              const possibleMatches = await PacienteService.search(paciente.nome);
              const nomeNormalizado = paciente.nome.toUpperCase().trim();
              const homonimos = (possibleMatches.data || []).filter((p: any) =>
                p.nome?.toUpperCase?.().trim?.() === nomeNormalizado
              );

              if (homonimos.length > 0) {
                throw new Error(
                  'Possível duplicata por homônimo sem CPF. Revisar cadastro antes de sincronizar.'
                );
              }
            } catch (homonymCheckError: any) {
              if (homonymCheckError?.message?.includes('Possível duplicata por homônimo')) {
                throw homonymCheckError;
              }
              console.warn('⚠️ Falha na verificação adicional de homônimo:', homonymCheckError);
            }
          }
          
          // ✅ CRIAR PACIENTE NO SERVIDOR (apenas se não existir)
          const { idpaciente, synced, savedAt, syncedAt, savedOffline, source, ...pacienteData } = paciente;
          
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
          
          if (error.message?.includes('já existe') || error.message?.includes('duplicate')) {
            try {
              const duplicateLookup = await findExistingPatientByPriority({
                cpf: paciente.cpf,
                nomePaciente: paciente.nome,
                dataNascimento: paciente.data_nascimento,
                nomeMae: paciente.nome_mae,
                searchPatients: searchPatientsForSync,
              });

              if (isCpfIdentityConflictMatch(duplicateLookup.matchedBy)) {
                toast.warning(CPF_IDENTITY_CONFLICT_MESSAGE, {
                  autoClose: 12000,
                  toastId: `sync-cpf-paciente-${paciente.idpaciente}`,
                });
                errorCount++;
              } else if (
                duplicateLookup.pacienteExistente?.idpaciente &&
                isReusablePatientMatch(duplicateLookup.matchedBy)
              ) {
                pacienteIdMapping.set(
                  paciente.idpaciente,
                  duplicateLookup.pacienteExistente.idpaciente,
                );
                await indexedDBService.markPacienteAsSynced(
                  paciente.idpaciente,
                  duplicateLookup.pacienteExistente.idpaciente,
                );
                syncedCount++;
              } else {
                toast.warning(CPF_IDENTITY_CONFLICT_MESSAGE, {
                  autoClose: 12000,
                  toastId: `sync-cpf-paciente-${paciente.idpaciente}`,
                });
                errorCount++;
              }
            } catch {
              toast.warning(CPF_IDENTITY_CONFLICT_MESSAGE, {
                autoClose: 12000,
                toastId: `sync-cpf-paciente-${paciente.idpaciente}`,
              });
              errorCount++;
            }
          } else if (error.message?.includes('Possível duplicata por homônimo')) {
            toast.warning(`Paciente "${paciente.nome}" exige revisão manual (possível duplicata sem CPF).`, {
              autoClose: 12000,
              toastId: `sync-homonimo-${paciente.idpaciente}`
            });
            errorCount++;
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
      estabelecimentosParaSincronizar.sort((a, b) => this.getSyncTimestamp(a) - this.getSyncTimestamp(b));
      
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
      }

      // ===== 3. SINCRONIZAR COMUNICAÇÕES DAE =====
      const pendingComunicacoesDae = await indexedDBService.getPendingComunicacoesDae();
      pendingComunicacoesDae.sort((a: any, b: any) => {
        const priorityDiff = Number(!this.isCreationRecord(a)) - Number(!this.isCreationRecord(b));
        if (priorityDiff !== 0) return priorityDiff;
        return this.getSyncTimestamp(a) - this.getSyncTimestamp(b);
      });
      console.log(`🔄 Sincronizando ${pendingComunicacoesDae.length} comunicações DAE...`);
      
      const ComunicacaoDaeService = (await import('@/services/ComunicacaoDaeService')).default;
      
      for (const comunicacao of pendingComunicacoesDae) {
        try {
          console.log(`📋 Sincronizando comunicação DAE offlineId: ${comunicacao.offlineId}`);
          
          const formDataAtualizada = { ...comunicacao.formData };
          
          // Adicionar campos de rastreamento
          formDataAtualizada.offline_id = comunicacao.offlineId;
          formDataAtualizada.device_id = comunicacao.deviceId;
          formDataAtualizada.created_offline = true;
          
          // Marcar como syncing
          await indexedDBService.updateComunicacaoDaeSyncStatus(comunicacao.offlineId, 'syncing');
          
          // Sincronizar com servidor
          let comunicacaoId: number;
          if (comunicacao.isEdit && comunicacao.id) {
            await ComunicacaoDaeService.update(comunicacao.id, formDataAtualizada);
            comunicacaoId = comunicacao.id;
            console.log(`✅ Comunicação DAE atualizada: ID ${comunicacao.id}`);
          } else {
            const result = await ComunicacaoDaeService.create(formDataAtualizada);
            comunicacaoId = result.id_comunicacao;
            console.log(`✅ Nova comunicação DAE criada: ID ${result.id_comunicacao}`);
            
            // ✅ Atualizar anexos com o ID da comunicação
            await indexedDBService.updateAnexosComunicacaoId(comunicacao.offlineId, comunicacaoId);
          }
          
          // Marcar como sincronizada
          await indexedDBService.updateComunicacaoDaeSyncStatus(comunicacao.offlineId, 'synced');
          syncedCount++;
          
        } catch (error: unknown) {
          console.error(`❌ Erro ao sincronizar comunicação DAE ${comunicacao.offlineId}:`, error);

          const accessDenied = axios.isAxiosError(error) && error.response?.status === 403;
          const errorMessage = accessDenied
            ? 'Acesso negado pelo servidor. A comunicação foi preservada no dispositivo e não será reenviada automaticamente.'
            : error instanceof Error
              ? error.message
              : 'Erro desconhecido';

          await indexedDBService.updateComunicacaoDaeSyncStatus(
            comunicacao.offlineId,
            'error',
            {
              message: errorMessage,
              timestamp: Date.now(),
              lastError: error instanceof Error ? error.toString() : errorMessage,
              retryable: !accessDenied,
              statusCode: accessDenied ? 403 : undefined,
            }
          );
          errorCount++;
        }
      }

      // ===== 3.5. SINCRONIZAR ANEXOS PENDENTES =====
      const pendingAnexos = await indexedDBService.getPendingAnexosBatch(this.anexoBatchSize);
      console.log(`📎 Sincronizando ${pendingAnexos.length} anexos pendentes (lote de ${this.anexoBatchSize})...`);
      
      for (const anexo of pendingAnexos) {
        try {
          // Verificar se tem comunicacaoId (comunicação já foi sincronizada)
          if (!anexo.comunicacaoId) {
            console.log(`⏭️ Pulando anexo ${anexo.anexoId}: comunicação ainda não sincronizada`);
            continue;
          }
          
          console.log(`📎 Sincronizando anexo: ${anexo.fileName} para comunicação ID ${anexo.comunicacaoId}`);
          
          // Marcar como syncing
          await indexedDBService.updateAnexoSyncStatus(anexo.anexoId, 'syncing');
          
          // Converter Blob de volta para File
          const file = new File([anexo.file], anexo.fileName, { type: anexo.mimeType });
          
          // Fazer upload do anexo
          await ComunicacaoDaeService.addAnexo(anexo.comunicacaoId, file, anexo.tipo_anexo);
          
          console.log(`✅ Anexo sincronizado: ${anexo.fileName}`);
          
          // Marcar como sincronizado e deletar
          await indexedDBService.updateAnexoSyncStatus(anexo.anexoId, 'synced');
          await indexedDBService.deleteAnexo(anexo.anexoId);
          syncedCount++;
          
        } catch (error: any) {
          console.error(`❌ Erro ao sincronizar anexo ${anexo.anexoId}:`, error);
          
          // Marcar como erro
          await indexedDBService.updateAnexoSyncStatus(
            anexo.anexoId,
            'error',
            error.message || 'Erro desconhecido'
          );
          errorCount++;
        }
      }

      // ===== 4. SINCRONIZAR NOTIFICAÇÕES =====
      const pendingNotificacoes = await indexedDBService.getPendingNotificacoes();
      pendingNotificacoes.sort((a: any, b: any) => {
        const aPriority = Number(!this.isCreationRecord({ ...a, id: a.id, isEdit: a.isEdit }));
        const bPriority = Number(!this.isCreationRecord({ ...b, id: b.id, isEdit: b.isEdit }));
        if (aPriority !== bPriority) return aPriority - bPriority;
        return this.getSyncTimestamp(a) - this.getSyncTimestamp(b);
      });
      console.log(`🔄 Sincronizando ${pendingNotificacoes.length} notificações...`);
      
      for (const { id, formData, offlineId, deviceId, isEdit: pendingIsEdit } of pendingNotificacoes) {
        try {
          console.log(`📋 Sincronizando notificação offlineId: ${offlineId} (ID temp: ${id})`);
          
          let formDataAtualizada = { ...formData } as any;
          
          // ✅ NOVO: Adicionar campos de rastreamento offline (snake_case para o backend)
          formDataAtualizada.offline_id = offlineId;
          formDataAtualizada.device_id = deviceId;
          formDataAtualizada.created_offline = true;
          formDataAtualizada.sincronizado = false; // Será setado como true pelo backend após salvar
          
          const pacienteIdAtual = formDataAtualizada.pacienteId || formDataAtualizada.paciente_idpaciente;
          
          console.log(`📊 [DEBUG PACIENTE] Estado antes do mapeamento:`);
          console.log(`  - pacienteIdAtual: ${pacienteIdAtual} (tipo: ${typeof pacienteIdAtual})`);
          console.log(`  - pacienteIdMapping tem ${pacienteIdMapping.size} entradas`);
          console.log(`  - Mapeamento contém este ID? ${pacienteIdMapping.has(pacienteIdAtual)}`);
          
          // ✅ ATUALIZAR REFERÊNCIA DE PACIENTE SE NECESSÁRIO
          if (pacienteIdAtual && typeof pacienteIdAtual === 'number' && pacienteIdMapping.has(pacienteIdAtual)) {
            const novoIdPaciente = pacienteIdMapping.get(pacienteIdAtual)!;
            console.log(`🔄 Atualizando referência: paciente ID ${pacienteIdAtual} → ${novoIdPaciente}`);
            
            formDataAtualizada.pacienteId = novoIdPaciente;
            formDataAtualizada.paciente_idpaciente = novoIdPaciente;
          } else if (pacienteIdAtual) {
            console.log(`⚠️ ID ${pacienteIdAtual} NÃO está no mapeamento`);
            console.log(`   Entradas do mapeamento:`, Array.from(pacienteIdMapping.entries()));
          }
          
          console.log(`📊 [DEBUG PACIENTE] Estado APÓS mapeamento:`);
          console.log(`  - pacienteId: ${formDataAtualizada.pacienteId}`);
          console.log(`  - paciente_idpaciente: ${formDataAtualizada.paciente_idpaciente}`);
          
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
          
          console.log(`\n🔍 [VALIDAÇÃO ID] Verificando ID do paciente:`);
          console.log(`  - pacienteIdFinal: ${pacienteIdFinal} (tipo: ${typeof pacienteIdFinal})`);
          console.log(`  - É nulo/undefined? ${!pacienteIdFinal}`);
          console.log(`  - É negativo? ${pacienteIdFinal < 0}`);
          console.log(`  - É string cache? ${typeof pacienteIdFinal === 'string' && pacienteIdFinal.startsWith('cache_')}`);
          
          // ✅ NOVO: Verificar se é ID de cache (string) e buscar ID real
          const isInvalidId = !pacienteIdFinal || 
                              pacienteIdFinal < 0 || 
                              (typeof pacienteIdFinal === 'string' && pacienteIdFinal.startsWith('cache_'));
          
          console.log(`  - ID considerado inválido? ${isInvalidId}\n`);
          
          if (isInvalidId) {
            console.log(`⚠️ ID de paciente inválido (${pacienteIdFinal}), buscando no servidor...`);

            const identityLookup = await findExistingPatientByPriority({
              cpf: formDataAtualizada.cpf,
              nomePaciente: formDataAtualizada.paciente,
              dataNascimento: formDataAtualizada.dataNascimento,
              nomeMae: formDataAtualizada.nomeMae,
              searchPatients: searchPatientsForSync,
            });

            if (isCpfIdentityConflictMatch(identityLookup.matchedBy)) {
              throw new Error(CPF_IDENTITY_CONFLICT_MESSAGE);
            }

            if (
              identityLookup.pacienteExistente?.idpaciente &&
              isReusablePatientMatch(identityLookup.matchedBy)
            ) {
              const resolvedId = identityLookup.pacienteExistente.idpaciente;
              console.log(`✅ Paciente resolvido por identidade (ID: ${resolvedId})`);
              formDataAtualizada.pacienteId = resolvedId;
              formDataAtualizada.paciente_idpaciente = resolvedId;
            } else {
              throw new Error(
                formDataAtualizada.paciente
                  ? `Paciente "${formDataAtualizada.paciente}" não encontrado`
                  : 'Notificação sem referência válida de paciente'
              );
            }
          } else {
            if (formDataAtualizada.cpf && String(formDataAtualizada.cpf).replace(/\D/g, '').length === 11) {
              const identityGuard = await findExistingPatientByPriority({
                cpf: formDataAtualizada.cpf,
                nomePaciente: formDataAtualizada.paciente,
                dataNascimento: formDataAtualizada.dataNascimento,
                nomeMae: formDataAtualizada.nomeMae,
                searchPatients: searchPatientsForSync,
              });

              if (isCpfIdentityConflictMatch(identityGuard.matchedBy)) {
                throw new Error(CPF_IDENTITY_CONFLICT_MESSAGE);
              }
            }
            console.log(`✅ ID do paciente é válido: ${pacienteIdFinal}`);
          }
          
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
          const isEdit = pendingIsEdit === true || (!!(formDataAtualizada as any).id && (formDataAtualizada as any).id > 0);
          const editId = isEdit ? Number((formDataAtualizada as any).id) : undefined;

          if (!isEdit && !offlineId) {
            throw new Error(
              'offline_id ausente. Não é seguro criar notificação sem chave de idempotência.',
            );
          }
          
          const syncResult = await salvarNotificacaoCompleta(formDataAtualizada as any, isEdit, editId);
          const serverNotificationId = this.extractServerNotificationId(syncResult);
          if (!isEdit && !serverNotificationId) {
            // Nunca marcar como synced sem ID: some da fila e não aparece no servidor.
            throw new Error(
              'Servidor não retornou o ID da notificação. Mantendo na fila offline para nova tentativa.',
            );
          }
          
          // ✅ Marcar como sincronizada SOMENTE após sucesso com ID (criar) ou edição válida
          await indexedDBService.markNotificacaoAsSynced(offlineId, {
            serverId: serverNotificationId || editId || undefined
          });
          syncedCount++;
          syncedNotificacoes++;
          
        } catch (error: any) {
          console.error('Falha ao sincronizar notificação', {
            status: error?.response?.status,
            code: error?.code,
          });
          
          // ✅ REVERTER de 'syncing' para 'pending' ou marcar como erro
          const statusCode = error?.response?.status;
          const isServerError = error?.response?.status === 500;
          const isInvalidData =
            statusCode === 400 ||
            statusCode === 422 ||
            error?.message?.includes('validation') ||
            error?.message?.includes('required');
          const isNetworkError = !error?.response || error?.code === 'NETWORK_ERROR';
          const isConflict = statusCode === 409;
          const isCpfIdentityConflict = isCpfIdentityConflictError(error);
          
          if (isCpfIdentityConflict) {
            await indexedDBService.markNotificacaoAsError(offlineId, CPF_IDENTITY_CONFLICT_MESSAGE, {
              status: statusCode,
              message: error?.message,
              timestamp: Date.now(),
              notificationId: id,
              offlineId: offlineId
            });
            toast.warning(CPF_IDENTITY_CONFLICT_MESSAGE, {
              autoClose: 12000,
              toastId: `sync-cpf-${offlineId}`
            });
            errorCount++;
          } else if (isConflict) {
            // Backend novo: POST idempotente (201 com mesmo id). Backend antigo: 409.
            // Aceitar id no body do 409, senão reconciliar por offline_id.
            const fromConflictBody = this.extractServerNotificationId(error?.response?.data);
            const reconciledServerId =
              fromConflictBody ??
              (await this.reconcileNotificationConflict(offlineId, deviceId));
            if (reconciledServerId) {
              await indexedDBService.markNotificacaoAsSynced(offlineId, { serverId: reconciledServerId });
              toast.info(`Conflito resolvido automaticamente para notificação ${offlineId}.`);
              syncedCount++;
              syncedNotificacoes++;
            } else {
              const conflictMessage = 'Conflito de sincronização (possível duplicata já existente no servidor)';
              await indexedDBService.markNotificacaoAsError(offlineId, conflictMessage, {
                status: statusCode,
                message: error?.message,
                timestamp: Date.now(),
                notificationId: id,
                offlineId: offlineId
              });
              toast.warning(`Conflito na notificação ${offlineId}. Revisar no painel de pendências.`, {
                autoClose: 12000,
                toastId: `sync-conflict-${offlineId}`
              });
              errorCount++;
            }
          } else if (isInvalidData) {
            // ✅ VALIDAÇÃO: erro orientado ao usuário para correção manual
            const validationMessage = 'Erro de validação (422). Edite os dados e tente novamente.';
            await indexedDBService.markNotificacaoAsError(offlineId, validationMessage, {
              status: statusCode,
              message: error?.message,
              timestamp: Date.now(),
              notificationId: id,
              offlineId: offlineId
            });
            toast.warning(`Notificação ${offlineId} com dados inválidos. Abra, corrija e reenvie.`, {
              autoClose: 12000,
              toastId: `sync-validation-${offlineId}`
            });
            errorCount++;
          } else {
            // ✅ TODOS OS OUTROS ERROS: Marcar como erro para retry posterior
            const errorMessage = isServerError ? 'Erro interno do servidor' :
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
              autoClose: 10000,
              toastId: `sync-error-${id}` // Evitar duplicatas
            });
            
            errorCount++;
          }
        }
      }

      // ===== 3. FEEDBACK (só falar de ficha — paciente sincroniza em silêncio) =====
      if (syncedNotificacoes > 0) {
        toast.success(
          syncedNotificacoes === 1
            ? '1 ficha sincronizada!'
            : `${syncedNotificacoes} fichas sincronizadas!`,
        );
        
        // ✅ NOVO: Disparar evento de cache atualizado
        const cacheUpdatedEvent = new CustomEvent('cache-updated', {
          detail: { 
            syncedCount: syncedNotificacoes,
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(cacheUpdatedEvent);
        console.log('📤 Evento de cache atualizado disparado');
      } else if (syncedCount > 0) {
        toast.success('Sincronização concluída!');
      }
      
      if (errorCount > 0) {
        toast.warning(
          errorCount === 1
            ? '1 ficha com erro na sincronização.'
            : `${errorCount} fichas com erro na sincronização.`,
        );
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
          await indexedDBService.markNotificacaoAsSynced(notif.offlineId, { remove: true }); // ✅ Remoção explícita
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
  async savePaciente(
    pacienteData: any,
    options?: { silent?: boolean },
  ): Promise<any> {
    const silent = options?.silent === true;
    await this.checkAuthenticationStatus();
    if (this.shouldUseOnlineMode()) {
      try {
        const result = await PacienteService.create(pacienteData);
        if (!silent) {
          toast.success('✅ Paciente salvo!');
        }
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
    
    if (!silent) {
      const message = this.isOnline 
        ? '📡 Erro na conexão - Paciente salvo offline!'
        : '📱 Paciente salvo offline! Sincronizará quando voltar online.';
      
      toast.success(message);
    }
    return pacienteComId;
  }

  // ✅ SALVAR NOTIFICAÇÃO (NOVA OU EXISTENTE)
  async saveNotificacao(
    formData: any,
    isEdit: boolean = false,
    options?: { silent?: boolean; localPendingOnly?: boolean },
  ): Promise<void> {
    const silent = options?.silent === true;
    const localPendingOnly = options?.localPendingOnly === true;
    // Verificar se é uma edição e existe um ID válido
    const notificacaoId = formData.id || formData.idnotificacao;
    const numericNotificacaoId =
      notificacaoId != null && notificacaoId !== ''
        ? Number(notificacaoId)
        : NaN;
    const isServerEdit =
      isEdit && Number.isFinite(numericNotificacaoId) && numericNotificacaoId > 0;
    
    // ✅ Verificar autenticação antes de tentar online
    await this.checkAuthenticationStatus();
    
    // Ficha só local (ainda não sincronizada): só atualiza IndexedDB — sem POST.
    if (!localPendingOnly) {
      if (this.shouldUseOnlineMode() && !isEdit) {
        // Para novas notificações, tentar salvar online primeiro
        try {
          await salvarNotificacaoCompleta(formData, false);
          if (!silent) {
            toast.success('✅ Notificação salva!');
          }
          return;
        } catch (error) {
          console.warn('Falha online, salvando offline:', error);
          // ✅ Se falhar, marcar como não autenticado para próximas tentativas
          this.isAuthenticated = false;
        }
      } else if (this.shouldUseOnlineMode() && isServerEdit) {
        // Para edições online, tentar atualizar (só ID real do servidor)
        try {
          await salvarNotificacaoCompleta(formData, true, numericNotificacaoId);
          if (!silent) {
            toast.success('✅ Notificação atualizada!');
          }
          return;
        } catch (error) {
          console.warn('Falha online ao editar, salvando offline:', error);
          // ✅ Se falhar, marcar como não autenticado para próximas tentativas
          this.isAuthenticated = false;
        }
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

    // ✅ CORREÇÃO DUPLICATAS: Preservar offline_id se já existir (para evitar criar duplicata)
    // Se o formData original tem offline_id, manter no formDataParaSalvar
    if (formData.offline_id && !formDataParaSalvar.offline_id) {
      formDataParaSalvar.offline_id = formData.offline_id;
    }
    if (formData.offlineId && !formDataParaSalvar.offlineId) {
      formDataParaSalvar.offlineId = formData.offlineId;
    }

    console.log(`💾 [SYNC SERVICE] Salvando ${isServerEdit ? 'edição' : 'nova/pendente'} offline:`, {
      id: isServerEdit ? numericNotificacaoId : 'local',
      isServerEdit,
      localPendingOnly,
      offline_id: formDataParaSalvar.offline_id || formDataParaSalvar.offlineId || 'será gerado',
    });

    await indexedDBService.saveNotificacao(
      formDataParaSalvar,
      isServerEdit,
      isServerEdit ? numericNotificacaoId : undefined,
    );
    
    if (!silent) {
      const message = this.shouldUseOnlineMode() 
        ? '📡 Erro na conexão - Salvo offline!'
        : `📱 ${isServerEdit ? 'Edição salva' : 'Salvo'} offline! Sincronizará quando voltar online.`;
      
      toast.success(message);
    }
  }

  // ✅ SALVAR COMUNICAÇÃO DAE (NOVA OU EXISTENTE)
  async saveComunicacaoDae(formData: any, isEdit: boolean = false): Promise<{ offlineId?: string; comunicacaoId?: number }> {
    const comunicacaoId = formData.id || formData.id_comunicacao;
    
    await this.checkAuthenticationStatus();
    
    // ✅ Converter data_comunicacao de datetime-local para UTC antes de enviar
    const formDataParaEnvio = { ...formData };
    if (formDataParaEnvio.data_comunicacao) {
      // Se não tiver Z ou +/-, é datetime-local e precisa converter
      if (!formDataParaEnvio.data_comunicacao.includes('Z') && 
          !formDataParaEnvio.data_comunicacao.includes('+') &&
          formDataParaEnvio.data_comunicacao.length <= 16) {
        const dataConvertida = convertLocalDateTimeToUTC(formDataParaEnvio.data_comunicacao);
        formDataParaEnvio.data_comunicacao = dataConvertida;
      } else {
        console.log('💾 [SYNC] Data já está em UTC, não convertendo');
      }
    }
    // Tentar salvar online primeiro (se disponível)
    if (this.shouldUseOnlineMode()) {
      try {
        const ComunicacaoDaeService = (await import('@/services/ComunicacaoDaeService')).default;
        
        if (isEdit && comunicacaoId) {
          await ComunicacaoDaeService.update(comunicacaoId, formDataParaEnvio);
          toast.success('✅ Comunicação DAE atualizada!');
          return { comunicacaoId };
        } else {
          const result = await ComunicacaoDaeService.create(formDataParaEnvio);
          toast.success('✅ Comunicação DAE salva!');
          return { comunicacaoId: result.id_comunicacao };
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          throw new Error(
            'Acesso negado pelo servidor. A comunicação não foi colocada na fila de sincronização.',
          );
        }
        console.warn('Falha online, salvando comunicação DAE offline:', error);
        this.isAuthenticated = false;
      }
    }

    // Salvar offline (mantém datetime-local)
    const formDataParaSalvar = { ...formData };
    
    console.log(`💾 Salvando ${isEdit ? 'edição' : 'nova comunicação DAE'} offline:`, {
      id: comunicacaoId || 'novo',
      offline_id: formDataParaSalvar.offline_id || formDataParaSalvar.offlineId || 'será gerado',
      isEdit
    });

    const offlineId = await indexedDBService.saveComunicacaoDae(formDataParaSalvar, isEdit, comunicacaoId);
    
    const message = this.shouldUseOnlineMode() 
      ? '📡 Erro na conexão - Comunicação DAE salva offline!'
      : `📱 Comunicação DAE ${isEdit ? 'editada' : 'salva'} offline! Sincronizará quando voltar online.`;
    
    toast.success(message);
    
    return { offlineId };
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
      await indexedDBService.markNotificacaoAsSynced(offlineId, { remove: true });
      
      toast.success(`✅ Notificação ${offlineId} sincronizada com sucesso!`);
      return true;
      
    } catch (error: any) {
      console.error('Falha ao repetir sincronização de notificação', {
        status: error?.response?.status,
      });
      
      // Marcar como erro novamente
      const errorMessage = error?.response?.status === 500 ? 'Erro interno do servidor' :
                          error?.message?.includes('validation') ? 'Dados inválidos' :
                          error?.message || 'Erro desconhecido';
      
      await indexedDBService.markNotificacaoAsError(offlineId, errorMessage, {
        message: errorMessage,
        status: error?.response?.status,
      });
      
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