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
  estabelecimentos: number;
  comunicacoes_dae: number;
  anexos: number;
  total: number;
}

interface PatientsCache {
  verificacao: number;
  locais: number;
  pendentes: number;
}

interface EstabelecimentosCache {
  verificacao: number;
  locais: number;
  pendentes: number;
}

interface OfflineSystemState {
  isOnline: boolean;
  syncing: boolean;
  stats: OfflineStats | null;
  pendingData: PendingData;
  patientsCache: PatientsCache;
  estabelecimentosCache: EstabelecimentosCache;
  initialized: boolean;
}

export function useOfflineSystem() {  const [state, setState] = useState<OfflineSystemState>({
    isOnline: navigator.onLine,
    syncing: false,
    stats: null,
    pendingData: { notificacoes: 0, pacientes: 0, estabelecimentos: 0, comunicacoes_dae: 0, anexos: 0, total: 0 },
    patientsCache: { verificacao: 0, locais: 0, pendentes: 0 },
    estabelecimentosCache: { verificacao: 0, locais: 0, pendentes: 0 },
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
  // ✅ NOVO: Atualizar cache de pacientes
  const updatePatientsCache = useCallback(async () => {
    try {
      const cacheStats = await indexedDBService.getCacheStats();
      setState(prev => ({ 
        ...prev, 
        patientsCache: {
          verificacao: cacheStats.verificacao,
          locais: cacheStats.locais,
          pendentes: cacheStats.pendentes
        }
      }));
    } catch (error) {
      console.error('Erro ao carregar cache de pacientes:', error);
    }
  }, []);

  // ✅ NOVO: Atualizar cache de estabelecimentos
  const updateEstabelecimentosCache = useCallback(async () => {
    try {
      const cacheStats = await indexedDBService.getCacheStats();
      setState(prev => ({ 
        ...prev, 
        estabelecimentosCache: {
          verificacao: cacheStats.estabelecimentos_verificacao,
          locais: cacheStats.estabelecimentos_locais,
          pendentes: cacheStats.estabelecimentos_pendentes
        }
      }));
    } catch (error) {
      console.error('Erro ao carregar cache de estabelecimentos:', error);
    }
  }, []);
  // Atualizar dados pendentes
  const updatePendingData = useCallback(async () => {
    try {
      const pending = await syncService.getPendingCount();
      const pendingData = {
        ...pending,
        comunicacoes_dae: pending.comunicacoes_dae || 0,
        anexos: pending.anexos || 0,
        total: pending.notificacoes + pending.pacientes + pending.estabelecimentos + (pending.comunicacoes_dae || 0) + (pending.anexos || 0)
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
      await Promise.all([
        updateStats(), 
        updatePendingData(),
        updatePatientsCache(),
        updateEstabelecimentosCache()
      ]);
      setState(prev => ({ ...prev, initialized: true }));
    } catch (error) {
      console.error('Erro ao inicializar sistema offline:', error);
      toast.error('Erro ao inicializar sistema offline');
    }
  }, [updateStats, updatePendingData, updatePatientsCache, updateEstabelecimentosCache]);

  // Eventos de conexão
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      // ✅ REMOVIDO: Não disparar sincronização automática aqui
      // O syncService já cuida disso de forma centralizada
      console.log('🌐 useOfflineSystem detectou conexão online');
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
      updatePatientsCache();
      updateEstabelecimentosCache();
    }, 30000);

    return () => clearInterval(interval);
  }, [initializeOfflineSystem, updateStats, updatePendingData, updatePatientsCache, updateEstabelecimentosCache]);

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

  // ✅ NOVO: Download específico para verificação de pacientes
  const downloadPatientsVerification = useCallback(async (
    onProgress?: (progress: number, current: string) => void
  ) => {
    if (!state.isOnline) {
      toast.error('❌ Sem conexão com a internet');
      return false;
    }

    try {
      setState(prev => ({ ...prev, syncing: true }));
      
      const result = await offlineDataManager.downloadPatientsForVerification(onProgress);
      
      await updatePatientsCache();
      
      if (result.success) {
        toast.success(`✅ ${result.count} pacientes baixados para verificação!`);
        return true;
      } else {
        toast.error(`❌ Erro: ${result.error}`);
        return false;
      }
      
    } catch (error) {
      console.error('Erro no download de pacientes:', error);
      toast.error('Erro no download de pacientes');
      return false;
    } finally {
      setState(prev => ({ ...prev, syncing: false }));
    }
  }, [state.isOnline, updatePatientsCache]);

  // ✅ NOVO: Download específico para verificação de estabelecimentos
  const downloadEstabelecimentosVerification = useCallback(async (
    onProgress?: (progress: number, current: string) => void
  ) => {
    if (!state.isOnline) {
      toast.error('❌ Sem conexão com a internet');
      return false;
    }

    try {
      setState(prev => ({ ...prev, syncing: true }));
      
      const result = await offlineDataManager.downloadEstabelecimentosForVerification(onProgress);
      
      await updateEstabelecimentosCache();
      
      if (result.success) {
        toast.success(`✅ ${result.count} estabelecimentos baixados para verificação!`);
        return true;
      } else {
        toast.error(`❌ Erro: ${result.error}`);
        return false;
      }
      
    } catch (error) {
      console.error('Erro no download de estabelecimentos:', error);
      toast.error('Erro no download de estabelecimentos');
      return false;
    } finally {
      setState(prev => ({ ...prev, syncing: false }));
    }
  }, [state.isOnline, updateEstabelecimentosCache]);
  const clearOfflineData = useCallback(async () => {
    try {
      await offlineDataManager.clearOfflineData();
      await Promise.all([updateStats(), updatePatientsCache(), updateEstabelecimentosCache()]);
      return true;
    } catch (error) {
      console.error('Erro ao limpar dados offline:', error);
      toast.error('Erro ao limpar dados offline');
      return false;
    }
  }, [updateStats, updatePatientsCache, updateEstabelecimentosCache]);
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
        await Promise.all([updatePendingData(), updatePatientsCache(), updateEstabelecimentosCache()]);
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
  }, [state.isOnline, state.pendingData.total, updatePendingData, updatePatientsCache, updateEstabelecimentosCache]);

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

  // ✅ CORRIGIDO: Funções para salvar dados
  const saveNotificationOfflineSafe = useCallback(async (data: any, isEdit: boolean = false, notificacaoId?: string) => {
    try {
      // Se é edição e tem ID, garantir que está no formData
      if (isEdit && notificacaoId) {
        data.id = notificacaoId;
        data.idnotificacao = notificacaoId;
      }
      await syncService.saveNotificacao(data, isEdit);
      await updatePendingData(); // Atualizar contador
    } catch (error) {
      console.error('Erro ao salvar notificação:', error);
      throw error;
    }
  }, [updatePendingData]);

  const savePatientOfflineSafe = useCallback(async (data: any) => {
    try {
      const result = await syncService.savePaciente(data);
      await Promise.all([updatePendingData(), updatePatientsCache()]);
      return result;
    } catch (error) {
      console.error('Erro ao salvar paciente:', error);
      throw error;
    }
  }, [updatePendingData, updatePatientsCache]);

  // ✅ NOVO: Funções para salvar dados de estabelecimentos
  const saveEstabelecimentoOfflineSafe = useCallback(async (data: any) => {
    try {
      const result = await syncService.saveEstabelecimento(data);
      await Promise.all([updatePendingData(), updateEstabelecimentosCache()]);
      return result;
    } catch (error) {
      console.error('Erro ao salvar estabelecimento:', error);
      throw error;
    }
  }, [updatePendingData, updateEstabelecimentosCache]);

  const searchPatientsOfflineSafe = useCallback(async (query: string) => {
    try {
      return await syncService.searchPacientes(query);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
      return [];
    }
  }, []);

  // ✅ NOVO: Função para buscar estabelecimentos
  const searchEstabelecimentosOfflineSafe = useCallback(async (query: string) => {
    try {
      return await syncService.searchEstabelecimentos(query);
    } catch (error) {
      console.error('Erro ao buscar estabelecimentos:', error);
      return [];
    }
  }, []);

  // ✅ CORRIGIDO: Verificação de CPF usando sistema melhorado
  const checkCpfOfflineSafe = useCallback(async (cpf: string): Promise<boolean> => {
    try {
      console.log(`🔍 Verificando CPF ${cpf} - Modo: ${state.isOnline ? 'Online' : 'Offline'}`);
      
      // ✅ Usar o método corrigido do syncService
      const exists = await syncService.checkCpfExists(cpf);
      
      console.log(`✅ Verificação concluída: ${exists ? 'CPF existe' : 'CPF não encontrado'}`);
      return exists;
      
    } catch (error: any) {
      console.error('❌ Erro geral na verificação de CPF:', error);
      return false; // Sempre permitir continuar
    }
  }, [state.isOnline]);

  // ✅ NOVO: Verificação de CNES
  const checkCNESOfflineSafe = useCallback(async (cnes: string): Promise<boolean> => {
    try {
      console.log(`🔍 Verificando CNES ${cnes} - Modo: ${state.isOnline ? 'Online' : 'Offline'}`);
      
      const exists = await syncService.checkCNESExists(cnes);
      
      console.log(`✅ Verificação concluída: ${exists ? 'CNES existe' : 'CNES não encontrado'}`);
      return exists;
      
    } catch (error: any) {
      console.error('❌ Erro geral na verificação de CNES:', error);
      return false;
    }
  }, [state.isOnline]);

  // ✅ MELHORADO: Função para verificar se vale a pena baixar dados de pacientes
  const shouldDownloadPatients = useCallback(async (): Promise<{
    recommend: boolean;
    reason: string;
    currentCpfs: number;
    hasVerificationCache: boolean;
  }> => {
    try {
      const cacheStats = await indexedDBService.getCacheStats();
      
      if (cacheStats.verificacao === 0) {
        return {
          recommend: true,
          reason: 'Nenhum paciente em cache - baixe dados para verificação offline',
          currentCpfs: 0,
          hasVerificationCache: false
        };
      }
      
      if (cacheStats.verificacao < 1000) {
        return {
          recommend: true,
          reason: `Apenas ${cacheStats.verificacao} pacientes em cache - baixe mais dados para melhor cobertura`,
          currentCpfs: cacheStats.verificacao,
          hasVerificationCache: true
        };
      }
      
      return {
        recommend: false,
        reason: `${cacheStats.verificacao} pacientes em cache - verificação offline funcional`,
        currentCpfs: cacheStats.verificacao,
        hasVerificationCache: true
      };
      
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return {
        recommend: true,
        reason: 'Erro ao verificar cache - recomenda-se baixar dados',
        currentCpfs: 0,
        hasVerificationCache: false
      };
    }
  }, []);

  // ✅ NOVO: Função para obter estatísticas completas
  const getCompleteStats = useCallback(async () => {
    try {
      const [cacheStats, recommendation] = await Promise.all([
        indexedDBService.getCacheStats(),
        shouldDownloadPatients()
      ]);
      
      return {
        cache: cacheStats,
        recommendation,
        ready: state.stats?.isReady || false,
        online: state.isOnline,
        pending: state.pendingData
      };
    } catch (error) {
      console.error('Erro ao obter stats completas:', error);
      return null;
    }
  }, [state, shouldDownloadPatients]);

  return {
    // Estado atual
    isOnline: state.isOnline,
    syncing: state.syncing,
    stats: state.stats,
    pendingData: state.pendingData,    patientsCache: state.patientsCache,
    estabelecimentosCache: state.estabelecimentosCache,
    initialized: state.initialized,

    // Funções de gestão de dados offline
    downloadEssentialData,
    downloadAllData,
    downloadPatientsVerification, // ✅ NOVO
    downloadEstabelecimentosVerification, // ✅ NOVO
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
    saveEstabelecimentoOfflineSafe, // ✅ NOVO
    searchPatientsOfflineSafe,
    searchEstabelecimentosOfflineSafe, // ✅ NOVO
    checkCpfOfflineSafe,
    checkCNESOfflineSafe, // ✅ NOVO

    // Funções de atualização manual
    refreshStats: updateStats,
    refreshPendingData: updatePendingData,    refreshPatientsCache: updatePatientsCache, // ✅ NOVO
    refreshEstabelecimentosCache: updateEstabelecimentosCache, // ✅ NOVO
    reinitialize: initializeOfflineSystem,

    // ✅ FUNÇÕES MELHORADAS:
    shouldDownloadPatients,
    getCompleteStats, // ✅ NOVO
      // Atalhos úteis
    checkCacheHealth: useCallback(async () => {
      const stats = await getCompleteStats();
      if (!stats) return { healthy: false };
      
      return {
        healthy: stats.cache.verificacao > 500 && stats.cache.estabelecimentos_verificacao > 100,
        stats: stats.cache,
        recommendation: stats.recommendation,
        readyOffline: stats.ready
      };
    }, [getCompleteStats])
  };
}