// Hook para gerenciar o período personalizado do dashboard
// Permite definir data/hora de início e data/hora de fim para filtrar notificações

import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'dashboard_date_range_filter';
const BELEM_TIMEZONE = 'America/Belem'; // UTC-3

interface DateRangeConfig {
  startDate: string; // YYYY-MM-DD
  startHour: number;
  startMinute: number;
  endDate: string; // YYYY-MM-DD
  endHour: number;
  endMinute: number;
  enabled: boolean;
  selectedPublicos?: number[];
  selectedEstabelecimentos?: number[];
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
  // Função para obter a data de hoje no formato YYYY-MM-DD no timezone de Belém
  const getTodayString = () => {
    const today = new Date();
    // Converter para o timezone de Belém (UTC-3)
    const belemTime = new Date(today.toLocaleString('en-US', { timeZone: BELEM_TIMEZONE }));
    return belemTime.toISOString().split('T')[0];
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
      selectedEstabelecimentos: [],
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
      selectedEstabelecimentos: [],
    });
    
    console.log('✅ Configuração resetada - filtro desabilitado');
  }, []);

  // Calcular o período atual (data/hora de início e fim) no timezone de Belém
  const { periodStart, periodEnd } = useMemo(() => {
    // Se o filtro estiver desabilitado, retornar um período muito amplo (toda a base de dados)
    if (!dateRangeConfig.enabled) {
      const start = new Date('1900-01-01T00:00:00');
      const end = new Date('2100-12-31T23:59:59');
      
      return { periodStart: start, periodEnd: end };
    }

    // Criar data de início no timezone de Belém (UTC-3)
    // Exemplo: Se usuário selecionou 06/11/2024 16:00, deve ser 06/11/2024 16:00 em Belém
    const startDateString = `${dateRangeConfig.startDate}T${dateRangeConfig.startHour.toString().padStart(2, '0')}:${dateRangeConfig.startMinute.toString().padStart(2, '0')}:00.000-03:00`;
    const start = new Date(startDateString);
    
    // Criar data de fim no timezone de Belém (UTC-3)
    const endDateString = `${dateRangeConfig.endDate}T${dateRangeConfig.endHour.toString().padStart(2, '0')}:${dateRangeConfig.endMinute.toString().padStart(2, '0')}:59.999-03:00`;
    const end = new Date(endDateString);

    console.log(`🕐 Período calculado no timezone de Belém (UTC-3):`);
    console.log(`📅 Início: ${start.toISOString()} (${start.toLocaleString('pt-BR', { timeZone: BELEM_TIMEZONE })})`);
    console.log(`📅 Fim: ${end.toISOString()} (${end.toLocaleString('pt-BR', { timeZone: BELEM_TIMEZONE })})`);
    
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

    console.log(`🕐 FILTRO GLOBAL ATIVO - Filtrando ${notifications.length} notificações`);
    console.log(`📅 Período: ${periodStart.toISOString()} até ${periodEnd.toISOString()}`);
    console.log(`📅 Período (horário Belém): ${periodStart.toLocaleString('pt-BR', { timeZone: BELEM_TIMEZONE })} até ${periodEnd.toLocaleString('pt-BR', { timeZone: BELEM_TIMEZONE })}`);

    // Filtrar notificações dentro do período personalizado e tipo de público
    const filteredNotifications = notifications.filter((notification, index) => {
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
        
        // Log detalhado para debug das primeiras 5 notificações
        if (index < 5) {
          console.log(`🔍 Notificação ${index + 1}:`, {
            data: notificationDate.toISOString(),
            dataBelemTime: notificationDate.toLocaleString('pt-BR', { timeZone: BELEM_TIMEZONE }),
            periodStart: periodStart.toISOString(),
            periodEnd: periodEnd.toISOString(),
            isInPeriod,
            evento: notification.tipoEvento || notification.original?.tipo_evento?.descricao
          });
        }
        
        if (!isInPeriod) {
          return false;
        }
        
        // Filtro de tipo de público (se configurado)
        if (dateRangeConfig.selectedPublicos && dateRangeConfig.selectedPublicos.length > 0) {
          const publicoId = notification?.original?.tipo_publico_idtipo_publico;
          if (publicoId !== undefined && publicoId !== null) {
            const passesPublicoFilter = dateRangeConfig.selectedPublicos.includes(Number(publicoId));
            if (!passesPublicoFilter) {
              return false;
            }
          } else {
            // Se não tem tipo de público definido, não passa no filtro
            return false;
          }
        }
        
        // Filtro de unidade notificadora/estabelecimento (se configurado)
        if (dateRangeConfig.selectedEstabelecimentos && dateRangeConfig.selectedEstabelecimentos.length > 0) {
          const estabelecimentoId = notification?.original?.estabelecimento_idestabelecimento;
          if (estabelecimentoId !== undefined && estabelecimentoId !== null) {
            const passesEstabelecimentoFilter = dateRangeConfig.selectedEstabelecimentos.includes(Number(estabelecimentoId));
            if (!passesEstabelecimentoFilter) {
              return false;
            }
          } else {
            // Se não tem estabelecimento definido, não passa no filtro
            return false;
          }
        }
        
        return true;
      } catch (error) {
        console.warn('Erro ao processar data da notificação:', error, dateField);
        return false;
      }
    });

    console.log(`✅ Filtro global aplicado: ${notifications.length} → ${filteredNotifications.length} notificações`);
    
    // Log das primeiras 3 notificações filtradas
    if (filteredNotifications.length > 0) {
      console.log(`🔍 Primeiras notificações filtradas:`);
      filteredNotifications.slice(0, 3).forEach((n: any, i: number) => {
        const dataNotif = new Date(n.created_at || n.original?.created_at);
        console.log(`   ${i+1}. ${dataNotif.toLocaleString('pt-BR', { timeZone: BELEM_TIMEZONE })} - ${n.tipoEvento || n.original?.tipo_evento?.descricao}`);
      });
    }
    
    return filteredNotifications;
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
