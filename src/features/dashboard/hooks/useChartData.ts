import { useMemo, useCallback } from 'react';
import { useDashboard, ChartDataItem, RawDataItem } from '../context/DashboardContext';

// Mapeamento de tipos de gráfico para campos de filtro
const CHART_TYPE_TO_FILTER_MAP = {
  publico: 'publico',
  tipoAtendimento: 'tipoAtendimento', 
  sexo: 'sexo',
  racaCor: 'racaCor',
  sintomas: 'sintoma',
  trauma: 'trauma',
  hipoteses: 'hipotese',
  faixaEtaria: 'faixaEtaria',
  estabelecimentos: 'estabelecimento',
  desfecho: 'desfecho',
} as const;

// Mapeamento de tipos de gráfico para campos dos dados
const CHART_TYPE_TO_DATA_FIELD_MAP = {
  publico: 'publico_atendido',
  tipoAtendimento: 'tipo_atendimento',
  sexo: 'sexo', 
  racaCor: 'raca_cor',
  sintomas: 'sintomas',
  trauma: 'tipo_trauma',
  hipoteses: 'hipotese_diagnostica',
  faixaEtaria: 'faixa_etaria',
  estabelecimentos: 'estabelecimento',
  desfecho: 'desfecho',
} as const;

// Cores específicas por tipo de gráfico
const COLOR_SCHEMES = {
  publico: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'],
  tipoAtendimento: ['#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22'],
  sexo: ['#1f77b4', '#ff1493', '#9467bd'],
  racaCor: ['#2ca02c', '#d62728', '#ff7f0e', '#1f77b4', '#9467bd'],
  sintomas: ['#d62728', '#ff7f0e', '#2ca02c', '#1f77b4', '#9467bd'],
  trauma: ['#d32f2f', '#f57c00', '#388e3c', '#1976d2'],
  hipoteses: ['#d32f2f', '#f57c00', '#1976d2', '#388e3c', '#9c27b0'],
  faixaEtaria: ['#e3f2fd', '#90caf9', '#42a5f5', '#1e88e5', '#1565c0'],
  estabelecimentos: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'],
  desfecho: ['#4caf50', '#ff9800', '#f44336', '#9c27b0'],
} as const;

// Cores especiais para hipóteses diagnósticas
const HIPOTESES_COLORS = {
  alarmante: '#d32f2f',
  alerta: '#f57c00', 
  medio: '#1976d2',
  normal: '#388e3c',
};

// Lista de hipóteses alarmantes (exemplo - deve vir dos dados reais)
const HIPOTESES_ALARMANTES = [
  'Febre Amarela',
  'Peste',
  'Cólera', 
  'Varíola',
  'Poliomielite',
  'Sarampo',
  'Raiva',
  'Meningite',
  'Botulismo',
  'Antraz',
];

type ChartType = keyof typeof CHART_TYPE_TO_FILTER_MAP;

interface UseChartDataOptions {
  maxItems?: number;
  includeEmpty?: boolean;
  sortBy?: 'value' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export const useChartData = (
  chartType: ChartType,
  rawData: RawDataItem[],
  options: UseChartDataOptions = {}
) => {
  const {
    maxItems,
    includeEmpty = false,
    sortBy = 'value',
    sortOrder = 'desc'
  } = options;

  const { state, setFilter, clearFilter, isFilterActive } = useDashboard();
  
  const filterKey = CHART_TYPE_TO_FILTER_MAP[chartType];
  const dataField = CHART_TYPE_TO_DATA_FIELD_MAP[chartType];

  // Processar dados do gráfico
  const processedData = useMemo(() => {
    // Aplicar todos os filtros EXCETO o filtro do próprio gráfico
    let filteredData = rawData;
    
    Object.entries(state.filters).forEach(([key, value]) => {
      if (value && key !== filterKey) {
        const fieldName = CHART_TYPE_TO_DATA_FIELD_MAP[key as ChartType];
        if (fieldName) {
          filteredData = filteredData.filter(item => {
            const itemValue = item[fieldName];
            if (Array.isArray(itemValue)) {
              return itemValue.some(v => v?.toString().toLowerCase().includes(value.toLowerCase()));
            }
            return itemValue?.toString().toLowerCase().includes(value.toLowerCase());
          });
        }
      }
    });

    // Agrupar dados por campo
    const grouped = filteredData.reduce((acc, item) => {
      let values = item[dataField];
      
      // Lidar com campos que podem ser arrays (como sintomas)
      if (!Array.isArray(values)) {
        values = [values];
      }
      
      values.forEach((value: any) => {
        const key = value?.toString() || (includeEmpty ? 'Não informado' : null);
        if (key) {
          if (!acc[key]) {
            acc[key] = { count: 0, items: [] };
          }
          acc[key].count += 1;
          acc[key].items.push(item);
        }
      });
      
      return acc;
    }, {} as Record<string, { count: number; items: any[] }>);

    // Converter para formato do gráfico
    let chartData: ChartDataItem[] = Object.entries(grouped).map(([name, data]) => {
      const isAlarmante = chartType === 'hipoteses' && HIPOTESES_ALARMANTES.includes(name);
      
      return {
        name,
        value: data.count,
        fill: getColorForItem(name, chartType, isAlarmante),
        isAlarmante,
        original: data.items
      };
    });

    // Ordenar dados
    if (sortBy === 'value') {
      chartData.sort((a, b) => sortOrder === 'desc' ? b.value - a.value : a.value - b.value);
    } else {
      chartData.sort((a, b) => {
        const comparison = a.name.localeCompare(b.name);
        return sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    // Limitar número de itens se especificado
    if (maxItems && maxItems > 0) {
      chartData = chartData.slice(0, maxItems);
    }

    return chartData;
  }, [rawData, state.filters, chartType, filterKey, dataField, maxItems, includeEmpty, sortBy, sortOrder]);

  // Handler para clique no gráfico
  const handleChartClick = useCallback((itemName: string) => {
    const currentFilter = state.filters[filterKey];
    
    if (currentFilter === itemName) {
      // Se clicar no mesmo item que já está filtrado, remove o filtro
      clearFilter(filterKey);
    } else {
      // Senão, aplica o novo filtro
      setFilter(filterKey, itemName);
    }
  }, [state.filters, filterKey, setFilter, clearFilter]);

  // Função para verificar se um item está ativo
  const isItemActive = useCallback((itemName: string): boolean => {
    return isFilterActive(filterKey, itemName);
  }, [filterKey, isFilterActive]);

  // Função para obter a cor de um item
  const getColorForItem = (name: string, type: ChartType, isAlarmante = false): string => {
    if (type === 'hipoteses' && isAlarmante) {
      return HIPOTESES_COLORS.alarmante;
    }
    
    const colors = COLOR_SCHEMES[type] || COLOR_SCHEMES.publico;
    
    // Gerar hash do nome para cor consistente
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash) + name.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  return {
    data: processedData,
    activeFilter: state.filters[filterKey] || null,
    handleClick: handleChartClick,
    isItemActive,
    totalItems: processedData.length,
    totalCount: processedData.reduce((sum, item) => sum + item.value, 0),
    hasActiveFilters: Object.keys(state.filters).length > 0,
    isCurrentChartFiltered: !!state.filters[filterKey],
  };
};

// Hook para dados agregados (para cards de resumo)
export const useAggregatedData = (rawData: RawDataItem[]) => {
  const { state } = useDashboard();
  
  return useMemo(() => {
    // Aplicar todos os filtros
    let filteredData = rawData;
    
    Object.entries(state.filters).forEach(([key, value]) => {
      if (value) {
        const fieldName = CHART_TYPE_TO_DATA_FIELD_MAP[key as ChartType];
        if (fieldName) {
          filteredData = filteredData.filter(item => {
            const itemValue = item[fieldName];
            if (Array.isArray(itemValue)) {
              return itemValue.some(v => v?.toString().toLowerCase().includes(value.toLowerCase()));
            }
            return itemValue?.toString().toLowerCase().includes(value.toLowerCase());
          });
        }
      }
    });

    return {
      totalRecords: filteredData.length,
      totalOriginal: rawData.length,
      filteredPercentage: rawData.length > 0 ? (filteredData.length / rawData.length) * 100 : 0,
      activeFiltersCount: Object.keys(state.filters).length,
    };
  }, [rawData, state.filters]);
};

// Hook para limpar todos os filtros
export const useClearAllFilters = () => {
  const { clearAllFilters } = useDashboard();
  return clearAllFilters;
};

// Hook para obter resumo dos filtros ativos
export const useActiveFilters = () => {
  const { state } = useDashboard();
  
  return useMemo(() => {
    return Object.entries(state.filters)
      .filter(([_, value]) => value)
      .map(([key, value]) => ({
        category: key,
        value: value as string,
        label: formatFilterLabel(key, value as string),
      }));
  }, [state.filters]);
};

// Função auxiliar para formatar labels dos filtros
const formatFilterLabel = (category: string, value: string): string => {
  const categoryLabels: Record<string, string> = {
    publico: 'Público',
    tipoAtendimento: 'Tipo de Atendimento',
    sexo: 'Sexo',
    racaCor: 'Raça/Cor',
    sintoma: 'Sintoma',
    trauma: 'Trauma',
    hipotese: 'Hipótese',
    faixaEtaria: 'Faixa Etária',
    estabelecimento: 'Estabelecimento',
    desfecho: 'Desfecho',
  };
  
  return `${categoryLabels[category] || category}: ${value}`;
};
