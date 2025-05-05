import React, { useState, useRef, useEffect } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { SearchParams } from '../types';

interface SearchBarProps {
  searchParams: SearchParams;
  fields: { value: SearchParams['field']; label: string }[];
  onSearchChange: (params: SearchParams) => void;
  onSearch: () => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchParams,
  fields,
  onSearchChange,
  onSearch,
  placeholder = "Buscar..."
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Encontra o label atual com base no value selecionado
  const getCurrentFieldLabel = () => {
    const field = fields.find(f => f.value === searchParams.field);
    return field ? field.label : "Todos os campos";
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
            value={searchParams.term}
            onChange={(e) => onSearchChange({ ...searchParams, term: e.target.value })}
            placeholder={placeholder}
            className="w-full pl-9 pr-8 py-2 border border-gray-300 text-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchParams.term.length >= 3) {
                onSearch();
              }
            }}
          />

          {/* Botão limpar (X) */}
          {searchParams.term && (
            <button
              type="button"
              onClick={() => onSearchChange({ ...searchParams, term: "" })}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Indicador mínimo de caracteres */}
        {searchParams.term && searchParams.term.length < 3 && (
          <div className="absolute text-xs text-yellow-600 mt-1">
            Digite pelo menos 3 caracteres para buscar
          </div>
        )}
      </div>

      {/* Botão de busca */}
      <button
        type="button"
        onClick={onSearch}
        disabled={searchParams.term.length > 0 && searchParams.term.length < 3}
        className={`ml-2 p-2 rounded-md ${
          searchParams.term.length > 0 && searchParams.term.length < 3
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        <Search className="h-5 w-5" />
        <span className="sr-only">Buscar</span>
      </button>
    </div>
  );
};

export default SearchBar;