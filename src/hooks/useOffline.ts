import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { offlineDataManager } from '@/services/offlineDataManager';
import syncService from '@/services/syncService';
import indexedDBService from '@/services/indexedDB';

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
      // ✅ REMOVIDO: Não disparar sincronização automática aqui
      // O syncService já cuida disso de forma centralizada
      console.log('🌐 useOffline detectou conexão online');
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

  const checkCpfOfflineSafe = useCallback(async (cpf: string) => {
    try {
      return await syncService.checkCpfExists(cpf);
    } catch (error) {
      console.error('Erro ao verificar CPF:', error);
      return false;
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
    reinitialize: initializeOfflineSystem
  };
}