import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { offlineDataManager } from '@/services/offlineDataManager';
import syncService from '@/services/syncService';
import indexedDBService from '@/services/indexedDB';
import PacienteService from '@/services/PacienteService';

interface OfflineStats {
  isReady: boolean;
  percentage: number;
  totalRecords: number;
  loadedSources: number;
  totalSources: number;
  missing: string[];
  hasEssentialData: boolean;
  hasErrors: boolean;
}

interface PendingData {
  notificacoes: number;
  pacientes: number;
  total: number;
}

interface OfflineSystemState {
  isOnline: boolean;
  syncing: boolean;
  stats: OfflineStats | null;
  pendingData: PendingData;
  initialized: boolean;
}

export function useOfflineSystem() {
  const [state, setState] = useState<OfflineSystemState>({
    isOnline: navigator.onLine,
    syncing: false,
    stats: null,
    pendingData: { notificacoes: 0, pacientes: 0, total: 0 },
    initialized: false
  });

  // Atualizar estatísticas offline
  const updateStats = useCallback(async () => {
    try {
      const [detailedStats, readinessCheck] = await Promise.all([
        offlineDataManager.getDetailedStats(),
        offlineDataManager.isReadyForOffline()
      ]);

      const stats: OfflineStats = {
        isReady: readinessCheck.ready,
        percentage: readinessCheck.percentage,
        totalRecords: detailedStats.overall.totalRecords,
        loadedSources: detailedStats.overall.loaded,
        totalSources: detailedStats.overall.total,
        missing: readinessCheck.missing,
        hasEssentialData: readinessCheck.ready,
        hasErrors: detailedStats.sources.some((s: any) => s.error)
      };

      setState(prev => ({ ...prev, stats }));
    } catch (error) {
      console.error('Erro ao carregar estatísticas offline:', error);
    }
  }, []);

  // Atualizar dados pendentes
  const updatePendingData = useCallback(async () => {
    try {
      const pending = await syncService.getPendingCount();
      const pendingData = {
        ...pending,
        total: pending.notificacoes + pending.pacientes
      };
      
      setState(prev => ({ ...prev, pendingData }));
    } catch (error) {
      console.error('Erro ao carregar dados pendentes:', error);
    }
  }, []);

  // Inicializar sistema offline
  const initializeOfflineSystem = useCallback(async () => {
    try {
      await indexedDBService.init();
      await Promise.all([updateStats(), updatePendingData()]);
      setState(prev => ({ ...prev, initialized: true }));
    } catch (error) {
      console.error('Erro ao inicializar sistema offline:', error);
      toast.error('Erro ao inicializar sistema offline');
    }
  }, [updateStats, updatePendingData]);

  // Eventos de conexão
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      // Auto-sync quando voltar online
      setTimeout(() => {
        syncService.forceSyncData();
      }, 1000);
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Inicialização e atualizações periódicas
  useEffect(() => {
    initializeOfflineSystem();

    // Atualizar dados a cada 30 segundos
    const interval = setInterval(() => {
      updateStats();
      updatePendingData();
    }, 30000);

    return () => clearInterval(interval);
  }, [initializeOfflineSystem, updateStats, updatePendingData]);

  // Funções para componentes
  const downloadEssentialData = useCallback(async (
    onProgress?: (progress: number, current: string) => void
  ) => {
    if (!state.isOnline) {
      toast.error('❌ Sem conexão com a internet');
      return false;
    }

    try {
      setState(prev => ({ ...prev, syncing: true }));
      
      const result = await offlineDataManager.downloadEssentialData(onProgress);
      
      await updateStats();
      
      return result.errors === 0;
    } catch (error) {
      console.error('Erro no download dos dados essenciais:', error);
      toast.error('Erro no download dos dados essenciais');
      return false;
    } finally {
      setState(prev => ({ ...prev, syncing: false }));
    }
  }, [state.isOnline, updateStats]);

  const downloadAllData = useCallback(async (
    onProgress?: (progress: number, current: string, completed: number, total: number) => void
  ) => {
    if (!state.isOnline) {
      toast.error('❌ Sem conexão com a internet');
      return false;
    }

    try {
      setState(prev => ({ ...prev, syncing: true }));
      
      const result = await offlineDataManager.downloadAllData(onProgress);
      
      await updateStats();
      
      return result.errors === 0;
    } catch (error) {
      console.error('Erro no download completo:', error);
      toast.error('Erro no download dos dados');
      return false;
    } finally {
      setState(prev => ({ ...prev, syncing: false }));
    }
  }, [state.isOnline, updateStats]);

  const clearOfflineData = useCallback(async () => {
    try {
      await offlineDataManager.clearOfflineData();
      await updateStats();
      return true;
    } catch (error) {
      console.error('Erro ao limpar dados offline:', error);
      toast.error('Erro ao limpar dados offline');
      return false;
    }
  }, [updateStats]);

  const syncPendingData = useCallback(async () => {
    if (!state.isOnline) {
      toast.error('❌ Sem conexão para sincronizar');
      return false;
    }

    if (state.pendingData.total === 0) {
      toast.info('Não há dados pendentes para sincronizar');
      return true;
    }

    try {
      setState(prev => ({ ...prev, syncing: true }));
      
      const success = await syncService.forceSyncData();
      
      if (success) {
        await updatePendingData();
        toast.success('✅ Dados sincronizados com sucesso!');
      }
      
      return success;
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast.error('Erro na sincronização');
      return false;
    } finally {
      setState(prev => ({ ...prev, syncing: false }));
    }
  }, [state.isOnline, state.pendingData.total, updatePendingData]);

  // Funções de conveniência para verificações
  const isReadyForOffline = useCallback(() => {
    return state.stats?.isReady || false;
  }, [state.stats]);

  const needsEssentialData = useCallback(() => {
    return !state.stats?.hasEssentialData;
  }, [state.stats]);

  const hasDataToSync = useCallback(() => {
    return state.pendingData.total > 0;
  }, [state.pendingData.total]);

  const getOfflineStatusMessage = useCallback(() => {
    if (!state.initialized) return 'Inicializando sistema offline...';
    if (!state.isOnline && !state.stats?.hasEssentialData) return 'Offline - Dados essenciais ausentes';
    if (!state.isOnline && state.stats?.hasEssentialData) return 'Offline - Funcionando com cache';
    if (state.isOnline && state.pendingData.total > 0) return `Online - ${state.pendingData.total} pendente(s)`;
    if (state.isOnline && state.stats?.percentage === 100) return 'Online - Sistema completo';
    if (state.isOnline && state.stats) return `Online - ${state.stats.percentage}% dos dados baixados`;
    return 'Online';
  }, [state]);

  // Funções para salvar dados (com fallback offline)
  const saveNotificationOfflineSafe = useCallback(async (data: any) => {
    try {
      return await syncService.saveNotificacao(data);
    } catch (error) {
      console.error('Erro ao salvar notificação:', error);
      throw error;
    }
  }, []);

  const savePatientOfflineSafe = useCallback(async (data: any) => {
    try {
      const result = await syncService.savePaciente(data);
      await updatePendingData(); // Atualizar contador
      return result;
    } catch (error) {
      console.error('Erro ao salvar paciente:', error);
      throw error;
    }
  }, [updatePendingData]);

  const searchPatientsOfflineSafe = useCallback(async (query: string) => {
    try {
      return await syncService.searchPacientes(query);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
      return [];
    }
  }, []);

  const checkCpfOfflineSafe = useCallback(async (cpf: string): Promise<boolean> => {
    try {
      console.log(`🔍 Verificando CPF ${cpf} - Modo: ${state.isOnline ? 'Online' : 'Offline'}`);
      
      // ✅ ESTRATÉGIA 1: SEMPRE verificar IndexedDB primeiro (mais rápido)
      try {
        const existsInCache = await indexedDBService.checkCpfExists(cpf);
        if (existsInCache) {
          console.log('✅ CPF encontrado no IndexedDB local');
          return true;
        }
      } catch (cacheError) {
        console.warn('⚠️ Erro no IndexedDB, continuando...', cacheError);
      }
      
      // ✅ ESTRATÉGIA 2: Se OFFLINE, parar aqui (não tentar rede)
      if (!state.isOnline) {
        console.log('📱 Modo offline: CPF não encontrado no cache local');
        return false;
      }
      
      // ✅ ESTRATÉGIA 3: Online - tentar syncService com TIMEOUT AGRESSIVO
      try {
        console.log('🌐 Tentando verificação online...');
        
        // ⚡ TIMEOUT SUPER AGRESSIVO (1.5s) para evitar travamento
        const syncPromise = syncService.checkCpfExists(cpf);
        const timeoutPromise = new Promise<boolean>((_, reject) => 
          setTimeout(() => reject(new Error('SYNC_TIMEOUT')), 1500)
        );
        
        const result = await Promise.race([syncPromise, timeoutPromise]);
        console.log('✅ Verificação online concluída:', result);
        return result;
        
      } catch (syncError: any) {
        console.warn('⚠️ SyncService falhou:', syncError?.message || syncError);
        
        // ✅ ESTRATÉGIA 4: ANÁLISE INTELIGENTE DO ERRO
        const isNetworkError = (
          syncError?.code === 'ERR_NETWORK' ||
          syncError?.message?.includes('Network Error') ||
          syncError?.message?.includes('Failed to fetch') ||
          syncError?.message?.includes('no-response') ||
          syncError?.message?.includes('SYNC_TIMEOUT') ||
          syncError?.name === 'AxiosError' ||
          !navigator.onLine
        );
        
        if (isNetworkError) {
          console.log('🌐 Erro de rede confirmado - assumindo CPF não existe');
          
          // ✅ NÃO mostrar toast excessivo para timeouts
          if (!syncError?.message?.includes('TIMEOUT')) {
            // Só mostrar aviso para erros de rede reais (não timeout)
            setTimeout(() => {
              toast.warning('⚠️ Problema de conexão - verificação limitada');
            }, 100);
          }
          
          return false; // Assumir que não existe para permitir cadastro
        }
        
        // ✅ ESTRATÉGIA 5: Para outros erros, assumir que não existe
        console.log('❓ Erro desconhecido - assumindo CPF não existe para continuidade');
        return false;
      }
      
    } catch (generalError: any) {
      console.error('❌ Erro geral na verificação de CPF:', generalError);
      return false; // Sempre permitir continuar
    }
  }, [state.isOnline]);

  // ✅ Função para verificar se vale a pena baixar dados de pacientes
  const shouldDownloadPatients = useCallback(async (): Promise<{
    recommend: boolean;
    reason: string;
    currentCpfs: number;
  }> => {
    try {
      // Verificar quantos CPFs estão em cache
      const allPacientes = await indexedDBService.getAll('pacientes');
      const cpfsInCache = allPacientes?.length || 0;
      
      if (cpfsInCache === 0) {
        return {
          recommend: true,
          reason: 'Nenhum paciente em cache - baixe dados para verificação offline',
          currentCpfs: 0
        };
      }
      
      if (cpfsInCache < 1000) {
        return {
          recommend: true,
          reason: `Apenas ${cpfsInCache} pacientes em cache - baixe mais dados para melhor cobertura`,
          currentCpfs: cpfsInCache
        };
      }
      
      return {
        recommend: false,
        reason: `${cpfsInCache} pacientes em cache - verificação offline funcional`,
        currentCpfs: cpfsInCache
      };
      
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return {
        recommend: true,
        reason: 'Erro ao verificar cache - recomenda-se baixar dados',
        currentCpfs: 0
      };
    }
  }, []);

  // ✅ Função para obter estatísticas simples do cache
  const getCacheStats = useCallback(async () => {
    try {
      const [pacientes, notificacoes] = await Promise.all([
        indexedDBService.getAll('pacientes'),
        indexedDBService.getAll('notificacoes')
      ]);
      
      return {
        pacientes: pacientes?.length || 0,
        notificacoes: notificacoes?.length || 0,
        total: (pacientes?.length || 0) + (notificacoes?.length || 0)
      };
    } catch (error) {
      console.error('Erro ao obter stats do cache:', error);
      return { pacientes: 0, notificacoes: 0, total: 0 };
    }
  }, []);

  return {
    // Estado atual
    isOnline: state.isOnline,
    syncing: state.syncing,
    stats: state.stats,
    pendingData: state.pendingData,
    initialized: state.initialized,

    // Funções de gestão de dados offline
    downloadEssentialData,
    downloadAllData,
    clearOfflineData,
    syncPendingData,

    // Funções de verificação
    isReadyForOffline,
    needsEssentialData,
    hasDataToSync,
    getOfflineStatusMessage,

    // Funções para salvar dados com fallback offline
    saveNotificationOfflineSafe,
    savePatientOfflineSafe,
    searchPatientsOfflineSafe,
    checkCpfOfflineSafe,

    // Funções de atualização manual
    refreshStats: updateStats,
    refreshPendingData: updatePendingData,
    reinitialize: initializeOfflineSystem,

    // ✅ NOVAS FUNÇÕES OPCIONAIS:
    shouldDownloadPatients,
    getCacheStats,
    
    // Atalhos úteis
    checkCacheHealth: useCallback(async () => {
      const stats = await getCacheStats();
      const recommendation = await shouldDownloadPatients();
      
      return {
        healthy: stats.pacientes > 500,
        stats,
        recommendation
      };
    }, [getCacheStats, shouldDownloadPatients])
  };
}