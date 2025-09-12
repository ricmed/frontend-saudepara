import React from 'react';
import { useHierarchicalSelection } from '../hooks/useScopeData';
import { EstadoSelect, MunicipioSelect, UnidadeSelect } from './SmartSelects';

interface HierarchicalSelectProps {
  // Valores iniciais (para edição)
  initialEstado?: number;
  initialMunicipio?: number;
  initialUnidade?: number;
  
  // Callbacks para mudanças
  onEstadoChange?: (estadoId: number | undefined) => void;
  onMunicipioChange?: (municipioId: number | undefined) => void;
  onUnidadeChange?: (unidadeId: number | undefined) => void;
  onSelectionChange?: (selection: {
    estadoId?: number;
    municipioId?: number;
    unidadeId?: number;
  }) => void;
  
  // Configurações de exibição
  showEstado?: boolean;
  showMunicipio?: boolean;
  showUnidade?: boolean;
  
  // Props de controle
  disabled?: boolean;
  className?: string;
  
  // Layout
  layout?: 'vertical' | 'horizontal' | 'grid';
}

/**
 * Componente integrado que combina Estado → Município → Unidade
 * com lógica hierárquica e escopo inteligente
 */
export const HierarchicalSelect: React.FC<HierarchicalSelectProps> = ({
  initialEstado,
  initialMunicipio,
  initialUnidade,
  onEstadoChange,
  onMunicipioChange,
  onUnidadeChange,
  onSelectionChange,
  showEstado = true,
  showMunicipio = true,
  showUnidade = true,
  disabled = false,
  className = "",
  layout = 'vertical'
}) => {
  const {
    estados,
    municipios,
    unidades,
    selectedEstado,
    selectedMunicipio,
    selectedUnidade,
    selectedEstadoData,
    selectedMunicipioData,
    selectedUnidadeData,
    handleEstadoChange,
    handleMunicipioChange,
    handleUnidadeChange,
    setValues,
    clearAll,
    loading,
    errors
  } = useHierarchicalSelection();

  // Definir valores iniciais
  React.useEffect(() => {
    if (initialEstado || initialMunicipio || initialUnidade) {
      setValues(initialEstado, initialMunicipio, initialUnidade);
    }
  }, [initialEstado, initialMunicipio, initialUnidade, setValues]);

  // Wrapper para os handlers que chama os callbacks externos
  const handleEstadoChangeWrapper = React.useCallback((estadoId: number | undefined) => {
    handleEstadoChange(estadoId);
    onEstadoChange?.(estadoId);
    onSelectionChange?.({ estadoId, municipioId: undefined, unidadeId: undefined });
  }, [handleEstadoChange, onEstadoChange, onSelectionChange]);

  const handleMunicipioChangeWrapper = React.useCallback((municipioId: number | undefined) => {
    handleMunicipioChange(municipioId);
    onMunicipioChange?.(municipioId);
    onSelectionChange?.({ estadoId: selectedEstado, municipioId, unidadeId: undefined });
  }, [handleMunicipioChange, onMunicipioChange, onSelectionChange, selectedEstado]);

  const handleUnidadeChangeWrapper = React.useCallback((unidadeId: number | undefined) => {
    handleUnidadeChange(unidadeId);
    onUnidadeChange?.(unidadeId);
    onSelectionChange?.({ estadoId: selectedEstado, municipioId: selectedMunicipio, unidadeId });
  }, [handleUnidadeChange, onUnidadeChange, onSelectionChange, selectedEstado, selectedMunicipio]);

  // Estilos baseados no layout
  const getLayoutClasses = () => {
    switch (layout) {
      case 'horizontal':
        return 'flex flex-row gap-4 items-start';
      case 'grid':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
      default:
        return 'flex flex-col gap-4';
    }
  };

  // Status da seleção para debugging
  const selectionStatus = {
    estadoSelected: !!selectedEstado,
    municipioSelected: !!selectedMunicipio,
    unidadeSelected: !!selectedUnidade,
    totalEstados: estados.data.length,
    totalMunicipios: municipios.data.length,
    totalUnidades: unidades.data.length
  };

  return (
    <div className={`hierarchical-select ${className}`}>
      {/* Header com informações do escopo */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          🎯 Seleção Hierárquica Inteligente
        </h3>
        <div className="text-xs text-blue-600 space-y-1">
          <div>• Dados filtrados automaticamente baseado no seu escopo de acesso</div>
          <div>• Seleções em cascata: Estado → Município → Unidade</div>
          {(selectedEstadoData || selectedMunicipioData || selectedUnidadeData) && (
            <div className="mt-2 pt-2 border-t border-blue-300">
              <strong>Seleção atual:</strong>
              {selectedEstadoData && (
                <div>🏛️ Estado: {selectedEstadoData.nome}</div>
              )}
              {selectedMunicipioData && (
                <div>🏙️ Município: {selectedMunicipioData.nome}</div>
              )}
              {selectedUnidadeData && (
                <div>🏥 Unidade: {selectedUnidadeData.nome}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Indicador de Loading Geral */}
      {loading && (
        <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center text-yellow-800">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
            Carregando dados hierárquicos...
          </div>
        </div>
      )}

      {/* Selects Hierárquicos */}
      <div className={getLayoutClasses()}>
        {/* Estado Select */}
        {showEstado && (
          <EstadoSelect
            value={selectedEstado}
            onChange={handleEstadoChangeWrapper}
            estados={estados.data}
            loading={estados.loading}
            error={errors.estados}
            disabled={disabled}
            className="flex-1"
          />
        )}

        {/* Município Select */}
        {showMunicipio && (
          <MunicipioSelect
            value={selectedMunicipio}
            onChange={handleMunicipioChangeWrapper}
            municipios={municipios.data}
            loading={municipios.loading}
            error={errors.municipios}
            disabled={disabled}
            estadoSelected={!!selectedEstado}
            className="flex-1"
          />
        )}

        {/* Unidade Select */}
        {showUnidade && (
          <UnidadeSelect
            value={selectedUnidade}
            onChange={handleUnidadeChangeWrapper}
            unidades={unidades.data}
            loading={unidades.loading}
            error={errors.unidades}
            disabled={disabled}
            municipioSelected={!!selectedMunicipio}
            className="flex-1"
          />
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex justify-between items-center">
        <button
          type="button"
          onClick={clearAll}
          disabled={disabled || (!selectedEstado && !selectedMunicipio && !selectedUnidade)}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          🗑️ Limpar Seleção
        </button>

        {/* Debug Info (em desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer">Debug Info</summary>
            <pre className="mt-2 text-xs">
              {JSON.stringify(selectionStatus, null, 2)}
            </pre>
          </details>
        )}
      </div>

      {/* Erros Gerais */}
      {(errors.estados || errors.municipios || errors.unidades) && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <h4 className="text-sm font-medium text-red-800 mb-2">⚠️ Erros de Carregamento:</h4>
          <div className="text-sm text-red-700 space-y-1">
            {errors.estados && <div>• Estados: {errors.estados}</div>}
            {errors.municipios && <div>• Municípios: {errors.municipios}</div>}
            {errors.unidades && <div>• Unidades: {errors.unidades}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Variação simplificada para casos de uso específicos
 */
export const SimpleHierarchicalSelect: React.FC<Omit<HierarchicalSelectProps, 'layout'>> = (props) => {
  return <HierarchicalSelect {...props} layout="vertical" className="simple-hierarchical-select" />;
};

/**
 * Hook utilitário para usar os dados de seleção hierárquica
 */
export const useHierarchicalData = () => {
  const {
    selectedEstadoData,
    selectedMunicipioData,
    selectedUnidadeData,
    selectedEstado,
    selectedMunicipio,
    selectedUnidade
  } = useHierarchicalSelection();

  return {
    // IDs selecionados
    estadoId: selectedEstado,
    municipioId: selectedMunicipio,
    unidadeId: selectedUnidade,
    
    // Objetos completos
    estado: selectedEstadoData,
    municipio: selectedMunicipioData,
    unidade: selectedUnidadeData,
    
    // Validações
    hasEstado: !!selectedEstado,
    hasMunicipio: !!selectedMunicipio,
    hasUnidade: !!selectedUnidade,
    isComplete: !!selectedEstado && !!selectedMunicipio && !!selectedUnidade
  };
};
