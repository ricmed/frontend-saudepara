// src/features/notificationForms/components/shared/SearchableCheckboxGroup.tsx
import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface Option {
  id: string | number;
  label: string;
  helpButton?: React.ReactNode;
  matchingSynonym?: string; // ← NOVO: Sinônimo que foi usado na busca
}

interface SearchableCheckboxGroupProps {
  label: string;
  options: Option[];
  selectedValues: string[];
  onChange: (value: string) => void;
  error?: string;
  maxHeight?: string;
  customSearchFunction?: (option: Option, searchTerm: string) => boolean;
  getSynonymMatch?: (option: Option, searchTerm: string) => string | null; // ← NOVO: Função para obter sinônimo
}

const SearchableCheckboxGroup: React.FC<SearchableCheckboxGroupProps> = ({
  label,
  options,
  selectedValues,
  onChange,
  error,
  maxHeight = '96',
  customSearchFunction,
  getSynonymMatch
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Função de busca padrão
  const defaultSearchFunction = (option: Option, searchTerm: string) => {
    return option.label.toLowerCase().includes(searchTerm.toLowerCase());
  };

  // Usa função personalizada se fornecida, senão usa a padrão
  const searchFunction = customSearchFunction || defaultSearchFunction;

  const filteredOptions = options.filter(
    (option) =>
      searchTerm === '' ||
      searchFunction(option, searchTerm)
  ).map(option => ({
    ...option,
    matchingSynonym: getSynonymMatch ? getSynonymMatch(option, searchTerm) : null
  }));

  // Função para obter todas as opções selecionadas com seus rótulos
  const getSelectedOptions = () => {
    return options.filter(option => selectedValues.includes(option.id.toString()));
  };

  // Função para limpar todas as seleções
  const handleClearAll = () => {
    // Como o onChange atual só lida com um item por vez, precisamos
    // chamar o onChange para cada item selecionado para desmarcá-los
    const selected = getSelectedOptions();
    if (selected.length > 0 && window.confirm(`Deseja remover todos os ${selected.length} itens selecionados?`)) {
      selected.forEach(item => {
        onChange(item.id.toString());
      });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="font-medium text-gray-700">
          {label} {error && <span className="text-red-500">*</span>}
        </label>
        <div className="relative w-64">
          <input
            type="text"
            placeholder={`Pesquisar ${label.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-8 text-sm border border-gray-200 rounded-lg hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          />
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Tags para itens selecionados */}
      {selectedValues.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-2 items-center">
            {getSelectedOptions().map((option) => (
              <div
                key={option.id}
                className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs"
              >
                <span>{option.label}</span>
                <button
                  type="button"
                  onClick={() => onChange(option.id.toString())}
                  className="text-blue-500 hover:text-blue-700 focus:outline-none"
                  aria-label={`Remover ${option.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            
            {selectedValues.length > 1 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="ml-2 text-xs text-gray-500 hover:text-red-500 focus:outline-none"
              >
                Limpar todos
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 mb-2 text-sm text-red-500">{error}</p>
      )}

      <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 max-h-${maxHeight} overflow-y-auto`}>
        {filteredOptions.map((option) => (
          <div
            key={option.id}
            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg transition-all duration-200 hover:border-blue-400 hover:bg-blue-50/50 group"
            translate="no"
          >
            <label className="flex items-center cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={selectedValues.includes(option.id.toString())}
                onChange={() => onChange(option.id.toString())}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-all duration-200 group-hover:border-blue-400"
              />
              <div className="ml-3 flex-1">
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors duration-200">
                  {option.label}
                </span>
                {option.matchingSynonym && (
                  <div className="text-xs text-blue-600 mt-1">
                    encontrado por: "{option.matchingSynonym}"
                  </div>
                )}
              </div>
            </label>
            {option.helpButton && (
              <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
                {option.helpButton}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredOptions.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          Nenhum resultado encontrado para "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default SearchableCheckboxGroup;