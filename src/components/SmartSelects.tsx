import React from 'react';
import { Estado, Municipio, Unidade } from '../hooks/useScopeData';

// Props base para todos os selects
interface BaseSelectProps {
  loading?: boolean;
  error?: string | null;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

// Props específicas para cada select
interface EstadoSelectProps extends BaseSelectProps {
  value?: number;
  onChange: (estadoId: number | undefined) => void;
  estados: Estado[];
  showEmpty?: boolean;
}

interface MunicipioSelectProps extends BaseSelectProps {
  value?: number;
  onChange: (municipioId: number | undefined) => void;
  municipios: Municipio[];
  showEmpty?: boolean;
  estadoSelected?: boolean;
}

interface UnidadeSelectProps extends BaseSelectProps {
  value?: number;
  onChange: (unidadeId: number | undefined) => void;
  unidades: Unidade[];
  showEmpty?: boolean;
  municipioSelected?: boolean;
}

/**
 * Select inteligente para Estados
 * Mostra apenas os estados que o usuário pode ver baseado no seu escopo
 */
export const EstadoSelect: React.FC<EstadoSelectProps> = ({
  value,
  onChange,
  estados,
  loading = false,
  error = null,
  disabled = false,
  placeholder = "Selecione um estado",
  className = "",
  showEmpty = true
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    onChange(selectedValue === "" ? undefined : parseInt(selectedValue));
  };

  // Se há apenas um estado disponível, pode ser pré-selecionado automaticamente
  const shouldAutoSelect = estados.length === 1 && !value && !loading;

  React.useEffect(() => {
    if (shouldAutoSelect) {
      onChange(estados[0].id);
    }
  }, [shouldAutoSelect, estados, onChange]);

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        🏛️ Estado
        {loading && <span className="ml-2 text-blue-500">Carregando...</span>}
      </label>
      
      <select
        value={value || ""}
        onChange={handleChange}
        disabled={disabled || loading}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {showEmpty && (
          <option value="" disabled>
            {loading ? "Carregando estados..." : placeholder}
          </option>
        )}
        
        {estados.map((estado) => (
          <option key={estado.id} value={estado.id}>
            {estado.sigla} - {estado.nome}
          </option>
        ))}
      </select>

      {/* Indicadores de estado */}
      <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
        <span>
          {estados.length > 0 && `${estados.length} estado(s) disponível(is)`}
          {estados.length === 1 && " (pré-selecionado)"}
        </span>
        
        {error && (
          <span className="text-red-500 font-medium">
            ⚠️ {error}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Select inteligente para Municípios
 * Mostra apenas os municípios do estado selecionado e que o usuário pode ver
 */
export const MunicipioSelect: React.FC<MunicipioSelectProps> = ({
  value,
  onChange,
  municipios,
  loading = false,
  error = null,
  disabled = false,
  placeholder = "Selecione um município",
  className = "",
  showEmpty = true,
  estadoSelected = false
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    onChange(selectedValue === "" ? undefined : parseInt(selectedValue));
  };

  // Auto-seleção para usuários com apenas um município disponível
  const shouldAutoSelect = municipios.length === 1 && !value && !loading && estadoSelected;

  React.useEffect(() => {
    if (shouldAutoSelect) {
      onChange(municipios[0].id);
    }
  }, [shouldAutoSelect, municipios, onChange]);

  const isDisabled = disabled || loading || !estadoSelected;

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        🏙️ Município
        {loading && <span className="ml-2 text-blue-500">Carregando...</span>}
      </label>
      
      <select
        value={value || ""}
        onChange={handleChange}
        disabled={isDisabled}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {showEmpty && (
          <option value="" disabled>
            {!estadoSelected 
              ? "Selecione um estado primeiro" 
              : loading 
                ? "Carregando municípios..." 
                : placeholder
            }
          </option>
        )}
        
        {municipios.map((municipio) => (
          <option key={municipio.id} value={municipio.id}>
            {municipio.nome}
          </option>
        ))}
      </select>

      <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
        <span>
          {municipios.length > 0 && `${municipios.length} município(s) disponível(is)`}
          {municipios.length === 1 && estadoSelected && " (pré-selecionado)"}
        </span>
        
        {error && (
          <span className="text-red-500 font-medium">
            ⚠️ {error}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Select inteligente para Unidades
 * Mostra apenas as unidades do município selecionado e que o usuário pode ver
 */
export const UnidadeSelect: React.FC<UnidadeSelectProps> = ({
  value,
  onChange,
  unidades,
  loading = false,
  error = null,
  disabled = false,
  placeholder = "Selecione uma unidade",
  className = "",
  showEmpty = true,
  municipioSelected = false
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    onChange(selectedValue === "" ? undefined : parseInt(selectedValue));
  };

  // Auto-seleção para usuários com apenas uma unidade disponível
  const shouldAutoSelect = unidades.length === 1 && !value && !loading && municipioSelected;

  React.useEffect(() => {
    if (shouldAutoSelect) {
      onChange(unidades[0].id);
    }
  }, [shouldAutoSelect, unidades, onChange]);

  const isDisabled = disabled || loading || !municipioSelected;

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        🏥 Unidade de Saúde
        {loading && <span className="ml-2 text-blue-500">Carregando...</span>}
      </label>
      
      <select
        value={value || ""}
        onChange={handleChange}
        disabled={isDisabled}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {showEmpty && (
          <option value="" disabled>
            {!municipioSelected 
              ? "Selecione um município primeiro" 
              : loading 
                ? "Carregando unidades..." 
                : placeholder
            }
          </option>
        )}
        
        {unidades.map((unidade) => (
          <option key={unidade.id} value={unidade.id}>
            {unidade.nome} {unidade.cnes && `(CNES: ${unidade.cnes})`}
          </option>
        ))}
      </select>

      <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
        <span>
          {unidades.length > 0 && `${unidades.length} unidade(s) disponível(is)`}
          {unidades.length === 1 && municipioSelected && " (pré-selecionada)"}
        </span>
        
        {error && (
          <span className="text-red-500 font-medium">
            ⚠️ {error}
          </span>
        )}
      </div>
    </div>
  );
};
