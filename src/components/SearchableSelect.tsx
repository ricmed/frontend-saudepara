import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchableOption {
  id: number | string;
  label: string;
  codigo?: string;
  sublabel?: string;
}

// Função para normalizar texto: remove acentos, cedilhas e converte para lowercase
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD') // Decompõe caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remove marcas de acento
    .replace(/[çÇ]/g, 'c'); // Substitui cedilha por c
};

interface SearchableSelectProps {
  label: string;
  options: SearchableOption[];
  value: number | string | null;
  onChange: (value: number | string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  emptyMessage?: string;
  searchPlaceholder?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Selecione...',
  required = false,
  disabled = false,
  error,
  emptyMessage = 'Nenhum item encontrado',
  searchPlaceholder = 'Digite para buscar...',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SearchableOption | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Atualizar opção selecionada quando o valor mudar
  useEffect(() => {
    if (value) {
      const option = options.find(opt => opt.id === value);
      if (option) {
        setSelectedOption(option);
        if (!isSearching) {
          setSearchTerm('');
        }
      }
    } else {
      setSelectedOption(null);
      setSearchTerm('');
    }
  }, [value, options]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setIsSearching(false);
        setSearchTerm('');
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Filtrar opções baseado no termo de busca
  const filteredOptions = options.filter(option => {
    if (!searchTerm) return true; // Se não há busca, mostra todas
    
    const searchNormalized = normalizeText(searchTerm);
    const labelNormalized = normalizeText(option.label);
    const codigoNormalized = option.codigo ? normalizeText(option.codigo) : '';
    const sublabelNormalized = option.sublabel ? normalizeText(option.sublabel) : '';
    
    return labelNormalized.includes(searchNormalized) || 
           codigoNormalized.includes(searchNormalized) || 
           sublabelNormalized.includes(searchNormalized);
  });

  const handleSelect = (option: SearchableOption) => {
    setSelectedOption(option);
    onChange(option.id);
    setShowDropdown(false);
    setSearchTerm('');
    setIsSearching(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOption(null);
    onChange(null as any);
    setSearchTerm('');
    setShowDropdown(false);
    setIsSearching(false);
    // Foco no input após limpar
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleInputClick = () => {
    if (!disabled) {
      setShowDropdown(true);
      setIsSearching(true);
      // Se já tem algo selecionado, limpa o searchTerm para permitir nova busca
      if (selectedOption) {
        setSearchTerm('');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
    setIsSearching(true);
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
    setIsSearching(true);
  };

  // Valor exibido no input
  const displayValue = isSearching ? searchTerm : (selectedOption?.label || '');

  return (
    <div className="mb-4 relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {/* Campo de busca/seleção */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onClick={handleInputClick}
            onFocus={handleInputFocus}
            placeholder={selectedOption && !isSearching ? selectedOption.label : placeholder}
            disabled={disabled}
            className={`w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-text'}`}
          />
          
          {/* Ícone de busca */}
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            size={18} 
          />
          
          {/* Botão de limpar */}
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Dropdown de opções */}
        {showDropdown && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {/* Lista de opções filtradas */}
            {filteredOptions.length > 0 ? (
              <div className="py-1">{filteredOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => handleSelect(option)}
                    className={`px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors ${
                      selectedOption?.id === option.id ? 'bg-blue-100' : ''
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-900">
                      {option.label}
                    </div>
                    {option.codigo && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        Código: {option.codigo}
                      </div>
                    )}
                    {option.sublabel && (
                      <div className="text-xs text-gray-600 mt-0.5">
                        {option.sublabel}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                {emptyMessage}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Informações adicionais da opção selecionada */}
      {selectedOption && (selectedOption.codigo || selectedOption.sublabel) && !showDropdown && (
        <div className="mt-1 text-xs text-gray-600">
          {selectedOption.codigo && <span>Código: {selectedOption.codigo}</span>}
          {selectedOption.codigo && selectedOption.sublabel && <span className="mx-1">•</span>}
          {selectedOption.sublabel && <span>{selectedOption.sublabel}</span>}
        </div>
      )}

      {/* Mensagem de erro */}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};
