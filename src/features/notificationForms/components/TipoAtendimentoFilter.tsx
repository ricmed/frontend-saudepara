// src/features/notificationForms/components/TipoAtendimentoFilter.tsx
import React from 'react';

export type TipoAtendimentoType = 'clinico' | 'trauma' | 'multiplas' | 'qbrn' | null;

interface TipoAtendimentoFilterProps {
  selectedTipo: TipoAtendimentoType;
  onTipoChange: (tipo: TipoAtendimentoType) => void;
}

const tiposAtendimento = [
  {
    id: 'clinico' as const,
    label: 'Clínico',
    color: 'bg-green-500',
    hoverColor: 'hover:bg-green-600',
    borderColor: 'border-green-500',
    selectedBg: 'bg-green-100',
  },
  {
    id: 'trauma' as const,
    label: 'Trauma',
    color: 'bg-red-500',
    hoverColor: 'hover:bg-red-600',
    borderColor: 'border-red-500',
    selectedBg: 'bg-red-100',
  },
  {
    id: 'multiplas' as const,
    label: 'Múltiplas Vítimas',
    color: 'bg-purple-500',
    hoverColor: 'hover:bg-purple-600',
    borderColor: 'border-purple-500',
    selectedBg: 'bg-purple-100',
  },
  {
    id: 'qbrn' as const,
    label: 'QBRN',
    color: 'bg-orange-500',
    hoverColor: 'hover:bg-orange-600',
    borderColor: 'border-orange-500',
    selectedBg: 'bg-orange-100',
  },
];

const TipoAtendimentoFilter: React.FC<TipoAtendimentoFilterProps> = ({
  selectedTipo,
  onTipoChange,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">Filtrar por Tipo de Atendimento:</h3>
      <div className="flex flex-wrap gap-3 justify-center">
        {/* Botão "Todos" */}
        <button
          onClick={() => onTipoChange(null)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
            selectedTipo === null
              ? 'bg-blue-100 border-2 border-blue-500 shadow-sm'
              : 'bg-gray-100 border-2 border-transparent hover:bg-gray-200'
          }`}
        >
          <div className={`w-3 h-3 rounded-full ${
            selectedTipo === null ? 'bg-blue-500' : 'bg-gray-400'
          }`} />
          <span className="text-sm font-medium text-gray-700">Todos</span>
        </button>

        {/* Botões de filtro para cada tipo */}
        {tiposAtendimento.map((tipo) => (
          <button
            key={tipo.id}
            onClick={() => onTipoChange(tipo.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              selectedTipo === tipo.id
                ? `${tipo.selectedBg} border-2 ${tipo.borderColor} shadow-sm`
                : 'bg-gray-100 border-2 border-transparent hover:bg-gray-200'
            }`}
          >
            <div className={`w-3 h-3 rounded-full ${tipo.color}`} />
            <span className="text-sm font-medium text-gray-700">{tipo.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TipoAtendimentoFilter;

