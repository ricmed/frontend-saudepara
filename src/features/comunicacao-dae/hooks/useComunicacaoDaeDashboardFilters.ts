import { useCallback, useMemo, useState } from 'react';
import { ComunicacaoDae } from '@/services/ComunicacaoDaeService';
import { applyDashboardCrossFilters } from '@/features/comunicacao-dae/utils/comunicacaoDaeDashboardFilterUtils';

export interface ActiveFilters {
  origem_tipo: string | string[] | null;
  origem_id: number | number[] | null;
  dae_id: number | number[] | null;
  municipio_id: number | number[] | null;
  municipio_residencia_id: number | number[] | null;
  semana_epidemiologica: string | string[] | null;
}

export const useComunicacaoDaeDashboardFilters = (
  comunicacoes: ComunicacaoDae[]
) => {
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    origem_tipo: null,
    origem_id: null,
    dae_id: null,
    municipio_id: null,
    municipio_residencia_id: null,
    semana_epidemiologica: null,
  });
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [horaInicio, setHoraInicio] = useState<string>('');
  const [horaFim, setHoraFim] = useState<string>('');

  const clearAllFilters = useCallback(() => {
    setActiveFilters({
      origem_tipo: null,
      origem_id: null,
      dae_id: null,
      municipio_id: null,
      municipio_residencia_id: null,
      semana_epidemiologica: null,
    });
    setDataInicio('');
    setDataFim('');
    setHoraInicio('');
    setHoraFim('');
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    Object.values(activeFilters).forEach((value) => {
      if (value !== null) {
        if (Array.isArray(value)) {
          count += value.length;
        } else {
          count += 1;
        }
      }
    });
    return count;
  }, [activeFilters]);

  const comunicacoesFiltradas = useMemo(() => {
    let filtered = [...comunicacoes];

    if (dataInicio) {
      const [ano, mes, dia] = dataInicio.split('-').map(Number);
      const dataInicioObj = new Date(ano, mes - 1, dia, 0, 0, 0, 0);

      filtered = filtered.filter((c) => {
        const dataCom = new Date(c.data_comunicacao);
        return dataCom >= dataInicioObj;
      });
    }

    if (dataFim) {
      const [ano, mes, dia] = dataFim.split('-').map(Number);
      const dataFimObj = new Date(ano, mes - 1, dia, 23, 59, 59, 999);

      filtered = filtered.filter((c) => {
        const dataCom = new Date(c.data_comunicacao);
        return dataCom <= dataFimObj;
      });
    }

    if (horaInicio || horaFim) {
      filtered = filtered.filter((c) => {
        const dataCom = new Date(c.data_comunicacao);
        const horaAtual = dataCom.getHours() * 60 + dataCom.getMinutes();

        let passaHoraInicio = true;
        let passaHoraFim = true;

        if (horaInicio) {
          const [h, m] = horaInicio.split(':').map(Number);
          passaHoraInicio = horaAtual >= h * 60 + m;
        }

        if (horaFim) {
          const [h, m] = horaFim.split(':').map(Number);
          passaHoraFim = horaAtual <= h * 60 + m;
        }

        return passaHoraInicio && passaHoraFim;
      });
    }

    return filtered;
  }, [comunicacoes, dataInicio, dataFim, horaInicio, horaFim]);

  const matchesFilter = (value: any, filterValue: any): boolean => {
    if (!filterValue) return true;
    if (Array.isArray(filterValue)) {
      return filterValue.includes(value);
    }
    return value === filterValue;
  };

  const isFilterActive = (value: any, filterValue: any): boolean => {
    if (!filterValue) return false;
    if (Array.isArray(filterValue)) {
      return filterValue.includes(value);
    }
    return value === filterValue;
  };

  const getCellColor = (itemId: any, filterValue: any, baseColor: string): string => {
    const hasFilter = filterValue && (Array.isArray(filterValue) ? filterValue.length > 0 : true);
    if (!hasFilter) return baseColor;
    if (isFilterActive(itemId, filterValue)) return baseColor;
    return baseColor + '4D';
  };

  const dadosFiltrados = useMemo(
    () => applyDashboardCrossFilters(comunicacoesFiltradas, activeFilters),
    [comunicacoesFiltradas, activeFilters],
  );

  const toggleFilter = useCallback(
    (filterKey: keyof ActiveFilters, value: any, multiSelect = false) => {
      setActiveFilters((prev) => {
        const currentValue = prev[filterKey];

        if (multiSelect) {
          let currentArray: any[] = [];
          if (Array.isArray(currentValue)) {
            currentArray = currentValue;
          } else if (currentValue !== null) {
            currentArray = [currentValue];
          }

          if (currentArray.includes(value)) {
            const newArray = currentArray.filter((item) => item !== value);
            return {
              ...prev,
              [filterKey]: newArray.length > 0 ? newArray : null,
            };
          }

          return {
            ...prev,
            [filterKey]: [...currentArray, value],
          };
        }

        return {
          ...prev,
          [filterKey]: currentValue === value ? null : value,
        };
      });
    },
    []
  );

  return {
    activeFilters,
    setActiveFilters,
    dataInicio,
    setDataInicio,
    dataFim,
    setDataFim,
    horaInicio,
    setHoraInicio,
    horaFim,
    setHoraFim,
    clearAllFilters,
    activeFiltersCount,
    comunicacoesFiltradas,
    dadosFiltrados,
    matchesFilter,
    isFilterActive,
    getCellColor,
    toggleFilter,
  };
};
