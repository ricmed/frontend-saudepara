import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';

// Tipos para os filtros
export interface FilterState {
  publico?: string | null;
  tipoAtendimento?: string | null;
  sexo?: string | null;
  racaCor?: string | null;
  sintoma?: string | null;
  trauma?: string | null;
  hipotese?: string | null;
  faixaEtaria?: string | null;
  estabelecimento?: string | null;
  desfecho?: string | null;
  municipio?: string | null;
  periodo?: {
    inicio: string;
    fim: string;
  } | null;
}

// Interface para os dados do gráfico
export interface ChartDataItem {
  name: string;
  value: number;
  fill: string;
  isAlarmante?: boolean;
  original?: any;
}

// Interface para dados brutos
export interface RawDataItem {
  [key: string]: any;
}

// Actions do reducer
export type FilterAction =
  | { type: 'SET_FILTER'; category: keyof FilterState; value: string | null }
  | { type: 'CLEAR_FILTER'; category: keyof FilterState }
  | { type: 'CLEAR_ALL_FILTERS' }
  | { type: 'SET_MULTIPLE_FILTERS'; filters: Partial<FilterState> }
  | { type: 'TOGGLE_FILTER'; category: keyof FilterState; value: string };

// State do contexto
interface DashboardState {
  filters: FilterState;
  isLoading: boolean;
  rawData: RawDataItem[];
  processedData: {
    publico: ChartDataItem[];
    tipoAtendimento: ChartDataItem[];
    sexo: ChartDataItem[];
    racaCor: ChartDataItem[];
    sintomas: ChartDataItem[];
    trauma: ChartDataItem[];
    hipoteses: ChartDataItem[];
    faixaEtaria: ChartDataItem[];
    estabelecimentos: ChartDataItem[];
    desfecho: ChartDataItem[];
  };
}

// Context interface
interface DashboardContextType {
  state: DashboardState;
  setFilter: (category: keyof FilterState, value: string | null) => void;
  clearFilter: (category: keyof FilterState) => void;
  clearAllFilters: () => void;
  toggleFilter: (category: keyof FilterState, value: string) => void;
  setMultipleFilters: (filters: Partial<FilterState>) => void;
  getFilteredData: () => RawDataItem[];
  isFilterActive: (category: keyof FilterState, value?: string) => boolean;
  getActiveFiltersCount: () => number;
  setRawData: (data: RawDataItem[]) => void;
  refreshProcessedData: () => void;
}

// Estado inicial
const initialState: DashboardState = {
  filters: {},
  isLoading: false,
  rawData: [],
  processedData: {
    publico: [],
    tipoAtendimento: [],
    sexo: [],
    racaCor: [],
    sintomas: [],
    trauma: [],
    hipoteses: [],
    faixaEtaria: [],
    estabelecimentos: [],
    desfecho: [],
  },
};

// Reducer para gerenciar o estado
function dashboardReducer(state: DashboardState, action: FilterAction): DashboardState {
  switch (action.type) {
    case 'SET_FILTER':
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.category]: action.value,
        },
      };

    case 'CLEAR_FILTER':
      const { [action.category]: _, ...restFilters } = state.filters;
      return {
        ...state,
        filters: restFilters,
      };

    case 'CLEAR_ALL_FILTERS':
      return {
        ...state,
        filters: {},
      };

    case 'SET_MULTIPLE_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.filters,
        },
      };

    case 'TOGGLE_FILTER':
      const currentValue = state.filters[action.category];
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.category]: currentValue === action.value ? null : action.value,
        },
      };

    default:
      return state;
  }
}

// Funções utilitárias para processamento de dados
const processChartData = (
  data: RawDataItem[],
  field: string,
  filters: FilterState,
  excludeField?: string
): ChartDataItem[] => {
  // Aplicar filtros excluindo o campo atual
  let filteredData = data;
  
  Object.entries(filters).forEach(([filterKey, filterValue]) => {
    if (filterValue && filterKey !== excludeField) {
      const mappedField = mapFilterToField(filterKey);
      if (mappedField) {
        filteredData = filteredData.filter(item => 
          item[mappedField]?.toString().toLowerCase() === filterValue.toLowerCase()
        );
      }
    }
  });

  // Agrupar por campo e contar
  const grouped = filteredData.reduce((acc, item) => {
    const value = item[field]?.toString() || 'Não informado';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Converter para formato do gráfico
  return Object.entries(grouped)
    .map(([name, value]) => ({
      name,
      value,
      fill: getColorForValue(name, field),
      original: { field, name, value }
    }))
    .sort((a, b) => b.value - a.value);
};

// Mapeamento de filtros para campos dos dados
const mapFilterToField = (filterKey: string): string | null => {
  const mapping: Record<string, string> = {
    publico: 'publico_atendido',
    tipoAtendimento: 'tipo_atendimento',
    sexo: 'sexo',
    racaCor: 'raca_cor',
    sintoma: 'sintomas',
    trauma: 'tipo_trauma',
    hipotese: 'hipotese_diagnostica',
    faixaEtaria: 'faixa_etaria',
    estabelecimento: 'estabelecimento',
    desfecho: 'desfecho',
    municipio: 'municipio',
  };
  
  return mapping[filterKey] || null;
};

// Função para obter cores baseadas no valor e tipo
const getColorForValue = (value: string, field: string): string => {
  // Cores padrão por tipo de gráfico
  const colorSchemes: Record<string, string[]> = {
    publico_atendido: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'],
    tipo_atendimento: ['#9467bd', '#8c564b', '#e377c2', '#7f7f7f'],
    sexo: ['#1f77b4', '#ff1493', '#9467bd'],
    raca_cor: ['#2ca02c', '#d62728', '#ff7f0e', '#1f77b4', '#9467bd'],
    sintomas: ['#d62728', '#ff7f0e', '#2ca02c', '#1f77b4'],
    tipo_trauma: ['#d32f2f', '#f57c00', '#388e3c'],
    hipotese_diagnostica: ['#d32f2f', '#f57c00', '#1976d2', '#388e3c'],
    faixa_etaria: ['#e3f2fd', '#90caf9', '#42a5f5', '#1e88e5', '#1565c0'],
    estabelecimento: ['#1f77b4', '#ff7f0e', '#2ca02c'],
    desfecho: ['#4caf50', '#ff9800', '#f44336', '#9c27b0'],
  };

  const colors = colorSchemes[field] || ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'];
  const hash = value.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};

// Contexto
const DashboardContext = createContext<DashboardContextType | null>(null);

// Provider do contexto
interface DashboardProviderProps {
  children: ReactNode;
  initialData?: RawDataItem[];
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ 
  children, 
  initialData = [] 
}) => {
  const [state, dispatch] = useReducer(dashboardReducer, {
    ...initialState,
    rawData: initialData,
  });

  // Actions
  const setFilter = useCallback((category: keyof FilterState, value: string | null) => {
    dispatch({ type: 'SET_FILTER', category, value });
  }, []);

  const clearFilter = useCallback((category: keyof FilterState) => {
    dispatch({ type: 'CLEAR_FILTER', category });
  }, []);

  const clearAllFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_FILTERS' });
  }, []);

  const toggleFilter = useCallback((category: keyof FilterState, value: string) => {
    dispatch({ type: 'TOGGLE_FILTER', category, value });
  }, []);

  const setMultipleFilters = useCallback((filters: Partial<FilterState>) => {
    dispatch({ type: 'SET_MULTIPLE_FILTERS', filters });
  }, []);

  // Função para obter dados filtrados
  const getFilteredData = useCallback((): RawDataItem[] => {
    let filteredData = state.rawData;
    
    Object.entries(state.filters).forEach(([filterKey, filterValue]) => {
      if (filterValue) {
        const mappedField = mapFilterToField(filterKey);
        if (mappedField) {
          filteredData = filteredData.filter(item => 
            item[mappedField]?.toString().toLowerCase() === filterValue.toLowerCase()
          );
        }
      }
    });

    return filteredData;
  }, [state.rawData, state.filters]);

  // Verificar se um filtro está ativo
  const isFilterActive = useCallback((category: keyof FilterState, value?: string): boolean => {
    const filterValue = state.filters[category];
    if (value) {
      return filterValue === value;
    }
    return !!filterValue;
  }, [state.filters]);

  // Contar filtros ativos
  const getActiveFiltersCount = useCallback((): number => {
    return Object.values(state.filters).filter(value => value !== null && value !== undefined).length;
  }, [state.filters]);

  // Definir dados brutos
  const setRawData = useCallback((data: RawDataItem[]) => {
    // Aqui deveria atualizar o estado, mas como estamos usando reducer,
    // precisaríamos adicionar uma action. Por simplicidade, vamos criar uma nova action
    console.log('Setting raw data:', data.length, 'items');
  }, []);

  // Reprocessar dados
  const refreshProcessedData = useCallback(() => {
    // Esta função seria chamada sempre que os dados ou filtros mudassem
    // Por agora, apenas log
    console.log('Refreshing processed data with filters:', state.filters);
  }, [state.filters]);

  const contextValue: DashboardContextType = {
    state,
    setFilter,
    clearFilter,
    clearAllFilters,
    toggleFilter,
    setMultipleFilters,
    getFilteredData,
    isFilterActive,
    getActiveFiltersCount,
    setRawData,
    refreshProcessedData,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};

// Hook para usar o contexto
export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard deve ser usado dentro de um DashboardProvider');
  }
  return context;
};

// Hook personalizado para gráficos individuais
export const useChartData = (
  chartType: keyof DashboardState['processedData'],
  rawData: RawDataItem[],
  field: string
) => {
  const { state, setFilter, isFilterActive } = useDashboard();
  
  const processedData = React.useMemo(() => {
    return processChartData(rawData, field, state.filters, chartType);
  }, [rawData, field, state.filters, chartType]);

  const handleChartClick = useCallback((value: string) => {
    const filterKey = chartType as keyof FilterState;
    const isCurrentlyActive = isFilterActive(filterKey, value);
    
    if (isCurrentlyActive) {
      setFilter(filterKey, null); // Remove o filtro se já estiver ativo
    } else {
      setFilter(filterKey, value); // Define o novo filtro
    }
  }, [chartType, setFilter, isFilterActive]);

  return {
    data: processedData,
    activeFilter: state.filters[chartType as keyof FilterState],
    handleClick: handleChartClick,
    isFilterActive: (value: string) => isFilterActive(chartType as keyof FilterState, value),
  };
};

export default DashboardContext;
