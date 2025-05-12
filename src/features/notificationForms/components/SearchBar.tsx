import React, { useState, useRef, useEffect } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { SearchParams } from '../types';

interface SearchBarProps {
  searchParams: SearchParams;
  fields: { value: SearchParams['field']; label: string }[];
  onSearchChange: (params: SearchParams) => void;
  onSearch: () => void;
  placeholder?: string;
  minSearchLength?: number;
  realTimeSearch?: boolean; // Nova prop para controlar busca em tempo real
  debounceTime?: number; // Tempo de debounce para busca em tempo real
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchParams,
  fields,
  onSearchChange,
  onSearch,
  placeholder = "Buscar...",
  minSearchLength = 3,
  realTimeSearch = false, // Desativado por padrão
  debounceTime = 300 // 300ms de debounce por padrão
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [localSearchText, setLocalSearchText] = useState(searchParams.term || '');
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setLocalSearchText(searchParams.term || '');
  }, [searchParams.term]);

  // Efeito para busca em tempo real com debounce
  useEffect(() => {
    if (!realTimeSearch) return;

    // Se o texto for menor que o mínimo, não faz nada
    if (localSearchText.length > 0 && localSearchText.length < minSearchLength) {
      setError(`A pesquisa deve conter pelo menos ${minSearchLength} caracteres`);
      return;
    }

    // Limpa o timer anterior se houver
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Se o texto for vazio ou atingir o mínimo, agenda a busca
    if (localSearchText.length === 0 || localSearchText.length >= minSearchLength) {
      setError(null);
      debounceTimerRef.current = setTimeout(() => {
        onSearchChange({ ...searchParams, term: localSearchText });
        // Só aciona a busca se tiver texto e cumprir o requisito mínimo
        if (localSearchText.length >= minSearchLength || localSearchText.length === 0) {
          onSearch();
        }
      }, debounceTime);
    }

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [localSearchText, realTimeSearch, minSearchLength, debounceTime]); // Dependências do efeito

  // Encontra o label atual com base no value selecionado
  const getCurrentFieldLabel = () => {
    const field = fields.find(f => f.value === searchParams.field);
    return field ? field.label : "Todos os campos";
  };

  const handleSearch = () => {
    if (localSearchText && localSearchText.length < minSearchLength) {
      setError(`A pesquisa deve conter pelo menos ${minSearchLength} caracteres`);
      return;
    }
    
    setError(null);
    onSearchChange({ ...searchParams, term: localSearchText });
    onSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setLocalSearchText(newText);
    
    // Se não for busca em tempo real, apenas atualiza o erro se necessário
    if (!realTimeSearch && newText.length > 0 && newText.length < minSearchLength) {
      setError(`A pesquisa deve conter pelo menos ${minSearchLength} caracteres`);
    } else if (!realTimeSearch) {
      setError(null);
    }
  };

  return (
    <div className="flex items-center">
      {/* Dropdown de campos - estilo igual à imagem 2 */}
      <div className="relative mr-2" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center justify-between w-[180px] px-3 py-2 border border-gray-300 rounded-md bg-white text-blue-600 hover:bg-gray-50"
        >
          <span className="text-sm truncate">{getCurrentFieldLabel()}</span>
          <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0 text-blue-600" />
        </button>

        {/* Menu dropdown - estilo igual à imagem 2 */}
        {isDropdownOpen && (
          <div className="absolute left-0 z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-[320px] overflow-auto">
            {fields.map((field) => (
              <button
                key={field.value}
                className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                  searchParams.field === field.value 
                    ? "text-blue-600" 
                    : "text-gray-700"
                }`}
                onClick={() => {
                  onSearchChange({ ...searchParams, field: field.value });
                  setIsDropdownOpen(false);
                }}
              >
                {field.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Campo de busca - agora separado do dropdown */}
      <div className="relative flex-grow max-w-md">
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          
          <input
            type="text"
            value={localSearchText}
            onChange={handleTextChange}
            placeholder={placeholder}
            className="w-full pl-9 pr-8 py-2 border border-gray-300 text-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyDown={handleKeyDown}
          />

          {/* Botão limpar (X) */}
          {localSearchText && (
            <button
              type="button"
              onClick={() => {
                setLocalSearchText('');
                // Se for busca em tempo real, também limpa a busca
                if (realTimeSearch) {
                  onSearchChange({ ...searchParams, term: '' });
                  onSearch();
                }
              }}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Indicador mínimo de caracteres */}
        {error && (
          <div className="absolute text-xs text-yellow-600 mt-1">
            {error}
          </div>
        )}
      </div>

      {/* Botão de busca - oculto se for busca em tempo real */}
      {!realTimeSearch && (
        <button
          type="button"
          onClick={handleSearch}
          className={`ml-2 p-2 rounded-md ${
            localSearchText.length > 0 && localSearchText.length < minSearchLength
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          <Search className="h-5 w-5" />
          <span className="sr-only">Buscar</span>
        </button>
      )}
    </div>
  );
};

export default SearchBar;