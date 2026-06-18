import { useCallback, useMemo, useState } from 'react';
import type { HepatiteActiveFilters, HepatiteCriancaSubmission } from '../types';
import { isCasoEncerrado } from '../utils/normalizeSubmission';

const EMPTY_FILTERS: HepatiteActiveFilters = {
  tipo_exposicao: null,
  municipio_notificacao_ibge: null,
  municipio_residencia_ibge: null,
  encerrado: null,
};

function matchesFilter(value: string | boolean, filterValue: string | string[] | boolean | null): boolean {
  if (filterValue === null) return true;
  if (typeof filterValue === 'boolean') return value === filterValue;
  if (Array.isArray(filterValue)) {
    return filterValue.includes(String(value));
  }
  return String(value) === String(filterValue);
}

export function useHepatiteCriancaDashboardFilters(submissions: HepatiteCriancaSubmission[]) {
  const [activeFilters, setActiveFilters] = useState<HepatiteActiveFilters>(EMPTY_FILTERS);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const clearAllFilters = useCallback(() => {
    setActiveFilters(EMPTY_FILTERS);
    setDataInicio('');
    setDataFim('');
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (activeFilters.tipo_exposicao) {
      count += Array.isArray(activeFilters.tipo_exposicao)
        ? activeFilters.tipo_exposicao.length
        : 1;
    }
    if (activeFilters.municipio_notificacao_ibge) {
      count += Array.isArray(activeFilters.municipio_notificacao_ibge)
        ? activeFilters.municipio_notificacao_ibge.length
        : 1;
    }
    if (activeFilters.municipio_residencia_ibge) {
      count += Array.isArray(activeFilters.municipio_residencia_ibge)
        ? activeFilters.municipio_residencia_ibge.length
        : 1;
    }
    if (activeFilters.encerrado !== null) count += 1;
    if (dataInicio) count += 1;
    if (dataFim) count += 1;
    return count;
  }, [activeFilters, dataInicio, dataFim]);

  const submissionsPorPeriodo = useMemo(() => {
    let filtered = [...submissions];

    if (dataInicio) {
      const [ano, mes, dia] = dataInicio.split('-').map(Number);
      const inicio = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
      filtered = filtered.filter((row) => {
        if (!row.dtNotificacao) return false;
        return new Date(row.dtNotificacao) >= inicio;
      });
    }

    if (dataFim) {
      const [ano, mes, dia] = dataFim.split('-').map(Number);
      const fim = new Date(ano, mes - 1, dia, 23, 59, 59, 999);
      filtered = filtered.filter((row) => {
        if (!row.dtNotificacao) return false;
        return new Date(row.dtNotificacao) <= fim;
      });
    }

    return filtered;
  }, [submissions, dataInicio, dataFim]);

  const dadosFiltrados = useMemo(() => {
    let filtered = [...submissionsPorPeriodo];

    if (activeFilters.tipo_exposicao) {
      filtered = filtered.filter((row) =>
        matchesFilter(row.tipoExposicao, activeFilters.tipo_exposicao),
      );
    }
    if (activeFilters.municipio_notificacao_ibge) {
      filtered = filtered.filter((row) =>
        matchesFilter(row.municipioNotificacaoIbge, activeFilters.municipio_notificacao_ibge),
      );
    }
    if (activeFilters.municipio_residencia_ibge) {
      filtered = filtered.filter((row) =>
        matchesFilter(row.municipioResidenciaIbge, activeFilters.municipio_residencia_ibge),
      );
    }
    if (activeFilters.encerrado !== null) {
      filtered = filtered.filter((row) =>
        matchesFilter(isCasoEncerrado(row), activeFilters.encerrado),
      );
    }

    return filtered;
  }, [submissionsPorPeriodo, activeFilters]);

  const isFilterActive = useCallback((value: string, filterValue: string | string[] | null): boolean => {
    if (!filterValue) return false;
    if (Array.isArray(filterValue)) return filterValue.includes(value);
    return value === filterValue;
  }, []);

  const getCellColor = useCallback(
    (itemId: string, filterValue: string | string[] | null, baseColor: string): string => {
      const hasFilter = filterValue && (Array.isArray(filterValue) ? filterValue.length > 0 : true);
      if (!hasFilter) return baseColor;
      if (isFilterActive(itemId, filterValue)) return baseColor;
      return `${baseColor}4D`;
    },
    [isFilterActive],
  );

  const toggleFilter = useCallback(
    (filterKey: keyof HepatiteActiveFilters, value: string, multiSelect = false) => {
      setActiveFilters((prev) => {
        const currentValue = prev[filterKey];
        if (filterKey === 'encerrado') return prev;

        if (multiSelect) {
          let currentArray: string[] = [];
          if (Array.isArray(currentValue)) {
            currentArray = currentValue;
          } else if (currentValue !== null) {
            currentArray = [String(currentValue)];
          }

          if (currentArray.includes(value)) {
            const newArray = currentArray.filter((item) => item !== value);
            return { ...prev, [filterKey]: newArray.length > 0 ? newArray : null };
          }
          return { ...prev, [filterKey]: [...currentArray, value] };
        }

        return {
          ...prev,
          [filterKey]: currentValue === value ? null : value,
        };
      });
    },
    [],
  );

  const applyTipoExposicaoGroup = useCallback((values: string[]) => {
    setActiveFilters((prev) => {
      const current = prev.tipo_exposicao;
      const isActive =
        Array.isArray(current) &&
        values.length === current.length &&
        values.every((v) => current.includes(v));
      return { ...prev, tipo_exposicao: isActive ? null : values };
    });
  }, []);

  const toggleEncerradoFilter = useCallback(() => {
    setActiveFilters((prev) => ({
      ...prev,
      encerrado: prev.encerrado === true ? null : true,
    }));
  }, []);

  const isEncerradoFilterActive = activeFilters.encerrado === true;

  const isTipoGroupActive = useCallback(
    (values: string[]) => {
      const current = activeFilters.tipo_exposicao;
      if (!Array.isArray(current)) return false;
      return values.length === current.length && values.every((v) => current.includes(v));
    },
    [activeFilters.tipo_exposicao],
  );

  return {
    activeFilters,
    dataInicio,
    setDataInicio,
    dataFim,
    setDataFim,
    clearAllFilters,
    activeFiltersCount,
    dadosFiltrados,
    submissionsPorPeriodo,
    toggleFilter,
    applyTipoExposicaoGroup,
    toggleEncerradoFilter,
    isEncerradoFilterActive,
    isTipoGroupActive,
    isFilterActive,
    getCellColor,
  };
}
