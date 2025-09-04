import React from 'react';
import { X, Filter, RotateCcw } from 'lucide-react';
import { useActiveFilters, useClearAllFilters, useAggregatedData } from '../hooks/useChartData';

interface FilterControlsProps {
  rawData: any[];
  className?: string;
}

const FilterControls: React.FC<FilterControlsProps> = ({ rawData, className = "" }) => {
  const activeFilters = useActiveFilters();
  const clearAllFilters = useClearAllFilters();
  const aggregatedData = useAggregatedData(rawData);

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-blue-600" />
          <h4 className="text-sm font-medium text-blue-900">
            Filtros Ativos ({activeFilters.length})
          </h4>
        </div>
        
        <button
          onClick={clearAllFilters}
          className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
          title="Limpar todos os filtros"
        >
          <RotateCcw className="h-3 w-3" />
          Limpar Todos
        </button>
      </div>

      {/* Lista de filtros ativos */}
      <div className="flex flex-wrap gap-2 mb-3">
        {activeFilters.map((filter) => (
          <div
            key={`${filter.category}-${filter.value}`}
            className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-blue-300 text-sm"
          >
            <span className="text-blue-800">{filter.label}</span>
            <button
              onClick={() => {
                // Aqui poderíamos implementar clearFilter individual
                // Por agora vamos deixar só o clearAll
              }}
              className="text-blue-600 hover:text-blue-800 ml-1"
              title="Remover filtro"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Resumo dos dados filtrados */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-900">
            {aggregatedData.totalRecords.toLocaleString()}
          </div>
          <div className="text-blue-600">Registros Filtrados</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-600">
            {aggregatedData.totalOriginal.toLocaleString()}
          </div>
          <div className="text-gray-500">Total Original</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">
            {aggregatedData.filteredPercentage.toFixed(1)}%
          </div>
          <div className="text-green-500">dos Dados</div>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;
