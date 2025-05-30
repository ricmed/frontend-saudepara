import { useState, useEffect, useCallback } from 'react';
import { offlineDB } from '@/services/offlineDB';
import { NotificacaoService } from '@/services/NotificacaoService';
import { PacienteService } from '@/services/PacienteService';
import { toast } from 'react-toastify';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updatePendingCount = useCallback(async () => {
    try {
      const { notificacoes, pacientes } = await offlineDB.getUnsyncedData();
      setPendingCount(notificacoes.length + pacientes.length);
    } catch (error) {
      console.error('Erro ao contar pendentes:', error);
    }
  }, []);

  useEffect(() => {
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 10000);
    return () => clearInterval(interval);
  }, [updatePendingCount]);

  const syncPendingData = useCallback(async () => {
    if (!isOnline || syncing) return;

    setSyncing(true);
    try {
      const { notificacoes, pacientes } = await offlineDB.getUnsyncedData();
      
      // Sincronizar pacientes primeiro
      for (const paciente of pacientes) {
        try {
          await PacienteService.create(paciente);
          console.log('✅ Paciente sincronizado');
        } catch (error) {
          console.warn('❌ Erro ao sincronizar paciente:', error);
        }
      }

      // Depois notificações
      for (const notificacao of notificacoes) {
        try {
          await NotificacaoService.create(notificacao);
          console.log('✅ Notificação sincronizada');
        } catch (error) {
          console.warn('❌ Erro ao sincronizar notificação:', error);
        }
      }

      updatePendingCount();
      
      if (pacientes.length + notificacoes.length > 0) {
        toast.success(`${pacientes.length + notificacoes.length} registro(s) sincronizado(s)!`);
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
    } finally {
      setSyncing(false);
    }
  }, [isOnline, syncing, updatePendingCount]);

  const saveNotificacao = useCallback(async (data: any) => {
    try {
      if (isOnline) {
        try {
          // Tentar online primeiro
          await NotificacaoService.create(data);
          toast.success('Notificação salva com sucesso!');
          return;
        } catch (error) {
          console.warn('Falha online, salvando offline:', error);
        }
      }

      // Salvar offline
      await offlineDB.saveNotificacao(data);
      await updatePendingCount();
      
      toast.success(
        isOnline 
          ? 'Erro na conexão - Salvo offline!'
          : 'Salvo offline! Sincronizará quando voltar online.'
      );
    } catch (error) {
      toast.error('Erro ao salvar dados');
      throw error;
    }
  }, [isOnline, updatePendingCount]);

  const savePaciente = useCallback(async (data: any) => {
    try {
      if (isOnline) {
        try {
          // Tentar online primeiro
          const result = await PacienteService.create(data);
          toast.success('Paciente salvo com sucesso!');
          return result;
        } catch (error) {
          console.warn('Falha online, salvando offline:', error);
        }
      }

      // Salvar offline
      const id = await offlineDB.savePaciente(data);
      await updatePendingCount();
      
      toast.success(
        isOnline 
          ? 'Erro na conexão - Paciente salvo offline!'
          : 'Paciente salvo offline! Sincronizará quando voltar online.'
      );
      
      return { idpaciente: id, ...data };
    } catch (error) {
      toast.error('Erro ao salvar paciente');
      throw error;
    }
  }, [isOnline, updatePendingCount]);

  const searchPacientes = useCallback(async (query: string) => {
    try {
      if (isOnline) {
        try {
          const result = await PacienteService.search(query);
          return result.data;
        } catch (error) {
          console.warn('Falha na busca online, usando cache:', error);
        }
      }

      // Buscar offline
      return await offlineDB.searchPacientes(query);
    } catch (error) {
      console.error('Erro na busca:', error);
      return [];
    }
  }, [isOnline]);

  const checkCpfExists = useCallback(async (cpf: string) => {
    if (!cpf || cpf.length !== 11) return false;

    try {
      if (isOnline) {
        try {
          const available = await PacienteService.checkCpfAvailable(cpf);
          return !available; // Inverter pois retorna disponibilidade
        } catch (error) {
          console.warn('Falha na verificação online, usando cache:', error);
        }
      }

      // Verificar offline
      return await offlineDB.checkCpfExists(cpf);
    } catch (error) {
      console.error('Erro ao verificar CPF:', error);
      return false;
    }
  }, [isOnline]);

  return {
    isOnline,
    syncing,
    pendingCount,
    saveNotificacao,
    savePaciente,
    searchPacientes,
    checkCpfExists,
    syncNow: syncPendingData
  };
}