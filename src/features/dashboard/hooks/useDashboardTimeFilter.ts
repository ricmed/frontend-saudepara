// Hook para gerenciar o período personalizado do dashboard
// Permite definir data/hora de início e data/hora de fim para filtrar notificações

import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'dashboard_date_range_filter';

interface DateRangeConfig {
  startDate: string; // YYYY-MM-DD
  startHour: number;
  startMinute: number;
  endDate: string; // YYYY-MM-DD
  endHour: number;
  endMinute: number;
  enabled: boolean;
  selectedPublicos?: number[];
}

interface UseDateRangeFilterReturn {
  dateRangeConfig: DateRangeConfig;
  setDateRangeConfig: (config: DateRangeConfig) => void;
  filterNotificationsByDateRange: (notifications: any[]) => any[];
  periodStart: Date;
  periodEnd: Date;
  resetToDefault: () => void;
  isGlobalFilterActive: () => boolean;
}

/**
 * Hook para gerenciar o filtro de período personalizado do dashboard
 * 
 * @returns {UseDateRangeFilterReturn} Objeto com configuração e funções para filtrar notificações
 * 
 * @example
 * const { dateRangeConfig, setDateRangeConfig, filterNotificationsByDateRange } = useDashboardDateRangeFilter();
 * 
 * // Definir período de 01/11/2024 08:00 até 05/11/2024 18:00
 * setDateRangeConfig({ 
 *   startDate: '2024-11-01', startHour: 8, startMinute: 0,
 *   endDate: '2024-11-05', endHour: 18, endMinute: 0,
 *   enabled: true 
 * });
 * 
 * // Filtrar notificações
 * const filteredNotifications = filterNotificationsByDateRange(allNotifications);
 */
export const useDashboardDateRangeFilter = (): UseDateRangeFilterReturn => {
  // Função para obter a data de hoje no formato YYYY-MM-DD
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Estado para armazenar a configuração do período
  const [dateRangeConfig, setDateRangeConfigState] = useState<DateRangeConfig>(() => {
    // Tentar carregar do localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('📦 Configuração carregada do localStorage:', parsed);
        return parsed;
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar configuração de período:', error);
    }
    
    // Valor padrão: hoje 00:00 até hoje 23:59 com filtro desabilitado
    const todayStr = getTodayString();
    console.log('🆕 Usando configuração padrão');
    return {
      startDate: todayStr,
      startHour: 0,
      startMinute: 0,
      endDate: todayStr,
      endHour: 23,
      endMinute: 59,
      enabled: false, // Por padrão, o filtro está desabilitado
      selectedPublicos: [],
    };
  });

  // Salvar no localStorage sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dateRangeConfig));
      console.log('💾 Configuração salva no localStorage:', dateRangeConfig);
    } catch (error) {
      console.warn('⚠️ Erro ao salvar configuração de período:', error);
    }
  }, [dateRangeConfig]);

  // Função para atualizar a configuração
  const setDateRangeConfig = useCallback((config: DateRangeConfig) => {
    setDateRangeConfigState(config);
  }, []);

  // Função para resetar para o padrão (hoje, desabilitado)
  const resetToDefault = useCallback(() => {
    const todayStr = getTodayString();
    
    console.log('🔄 Resetando configuração de período para padrão');
    console.log('🗑️ Limpando localStorage');
    
    // Limpar localStorage explicitamente
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('⚠️ Erro ao limpar localStorage:', error);
    }
    
    setDateRangeConfigState({
      startDate: todayStr,
      startHour: 0,
      startMinute: 0,
      endDate: todayStr,
      endHour: 23,
      endMinute: 59,
      enabled: false,
      selectedPublicos: [],
    });
    
    console.log('✅ Configuração resetada - filtro desabilitado');
  }, []);

  // Calcular o período atual (data/hora de início e fim)
  const { periodStart, periodEnd } = useMemo(() => {
    // Se o filtro estiver desabilitado, retornar um período muito amplo (toda a base de dados)
    if (!dateRangeConfig.enabled) {
      const start = new Date('1900-01-01T00:00:00');
      const end = new Date('2100-12-31T23:59:59');
      
      return { periodStart: start, periodEnd: end };
    }

    // Criar data de início
    const start = new Date(dateRangeConfig.startDate + 'T00:00:00');
    start.setHours(dateRangeConfig.startHour, dateRangeConfig.startMinute, 0, 0);
    
    // Criar data de fim
    const end = new Date(dateRangeConfig.endDate + 'T00:00:00');
    end.setHours(dateRangeConfig.endHour, dateRangeConfig.endMinute, 59, 999);
    
    return { periodStart: start, periodEnd: end };
  }, [dateRangeConfig]);

  /**
   * Filtra as notificações baseado no período configurado e tipo de público
   * 
   * @param notifications Array de notificações a serem filtradas
   * @returns Array de notificações dentro do período definido e tipo de público selecionado
   */
  const filterNotificationsByDateRange = useCallback((notifications: any[]): any[] => {
    // Se o filtro estiver desabilitado, retornar TODAS as notificações
    if (!dateRangeConfig.enabled) {
      console.log(`🔓 Filtro de período desabilitado - retornando todas as ${notifications.length} notificações`);
      return notifications;
    }

    // Filtrar notificações dentro do período personalizado e tipo de público
    return notifications.filter(notification => {
      // Filtro de data/hora
      const dateField = 
        notification.created_at ||
        notification.original?.created_at ||
        notification.data_notificacao || 
        notification.original?.data_notificacao ||
        notification.data_atendimento ||
        notification.original?.data_atendimento ||
        notification.createdAt ||
        notification.original?.createdAt;
      
      if (!dateField) {
        console.warn('Notificação sem campo de data:', notification);
        return false;
      }
      
      try {
        const notificationDate = new Date(dateField);
        
        // Verificar se a data é válida
        if (isNaN(notificationDate.getTime())) {
          console.warn('Data inválida na notificação:', dateField);
          return false;
        }
        
        // A notificação está dentro do período se estiver entre o início e o fim
        const isInPeriod = notificationDate >= periodStart && notificationDate <= periodEnd;
        
        if (!isInPeriod) {
          return false;
        }
        
        // Filtro de tipo de público (se configurado)
        if (dateRangeConfig.selectedPublicos && dateRangeConfig.selectedPublicos.length > 0) {
          const publicoId = notification?.original?.tipo_publico_idtipo_publico;
          if (publicoId !== undefined && publicoId !== null) {
            return dateRangeConfig.selectedPublicos.includes(Number(publicoId));
          }
          // Se não tem tipo de público definido, não passa no filtro
          return false;
        }
        
        return true;
      } catch (error) {
        console.warn('Erro ao processar data da notificação:', error, dateField);
        return false;
      }
    });
  }, [dateRangeConfig, periodStart, periodEnd]);

  // Função para verificar se o filtro global está ativo
  const isGlobalFilterActive = useCallback(() => {
    return dateRangeConfig.enabled;
  }, [dateRangeConfig.enabled]);

  return {
    dateRangeConfig,
    setDateRangeConfig,
    filterNotificationsByDateRange,
    periodStart,
    periodEnd,
    resetToDefault,
    isGlobalFilterActive,
  };
};

export default useDashboardDateRangeFilter;
