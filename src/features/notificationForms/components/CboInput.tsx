import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import axios from 'axios';

// Interface para opções de CBO
interface TipoCboOption {
  idtipo_cbo: number;
  codigo: string;
  descricao: string;
}

interface CboInputProps {
  value: string;
  onChange: (value: string) => void;
  name: string;
  placeholder?: string;
  className?: string;
  label?: string;
  disabled?: boolean;
}

const CboInput: React.FC<CboInputProps> = ({
  value,
  onChange,
  name,
  placeholder = "Pesquisar profissão",
  className = "",
  label = "Profissão/Ocupação (CBO)",
  disabled = false
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cbos, setCbos] = useState<TipoCboOption[]>([]);
  const [selectedCbo, setSelectedCbo] = useState<TipoCboOption | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Salvar a posição de scroll atual
  const scrollPositionRef = useRef({ x: 0, y: 0 });

  // Buscar CBOs do backend
  const fetchCbos = async (searchTerm: string = "") => {
    try {
      setIsLoading(true);
      const server = import.meta.env.VITE_API_SERVER;
      const port = import.meta.env.VITE_API_PORT;
      
      // Usar o endpoint correto com base na presença do termo de busca
      const endpoint = searchTerm 
        ? `${server}:${port}/api/tipo-cbo/search?descricao=${encodeURIComponent(searchTerm)}&limit=100` 
        : `${server}:${port}/api/tipo-cbo?limit=100`;
      
      const response = await axios.get(endpoint);
      
      // Processar a resposta de acordo com a estrutura da API
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setCbos(response.data.data);
      } else {
        console.error('Formato de resposta não reconhecido:', response.data);
        setCbos([]);
      }
    } catch (error) {
      console.error('Erro ao buscar CBOs:', error);
      setCbos([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar CBO específico por ID
  const fetchCboById = async (id: string) => {
    if (!id || id === "" || isNaN(Number(id))) return;
    
    try {
      setIsLoading(true);
      const server = import.meta.env.VITE_API_SERVER;
      const port = import.meta.env.VITE_API_PORT;
      const API_URL = `${server}:${port}/api/tipo-cbo/${id}`;
      
      const response = await axios.get(API_URL);
      
      if (response.data && response.data.idtipo_cbo) {
        setSelectedCbo(response.data);
        setSearchQuery(response.data.descricao);
      } else {
        // Se não encontrar o CBO, limpar o campo
        setSelectedCbo(null);
        setSearchQuery("");
        console.warn(`CBO com ID ${id} não encontrado`);
      }
    } catch (error) {
      console.error('Erro ao buscar CBO por ID:', error);
      // Limpar valor em caso de erro
      setSelectedCbo(null);
      setSearchQuery("");
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar CBO inicial se houver um valor
  useEffect(() => {
    if (value && value !== "") {
      fetchCboById(value);
    } else {
      setSelectedCbo(null);
      setSearchQuery("");
    }
  }, [value]);

  // Manipulador para fechar o dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Atualiza a posição do dropdown quando aberto
  useEffect(() => {
    if (isDropdownOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
      
      // Buscar dados quando o dropdown é aberto
      fetchCbos(searchQuery);
    }
  }, [isDropdownOpen]);
  
  // Debounce para pesquisa
  useEffect(() => {
    if (isDropdownOpen && searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        fetchCbos(searchQuery);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [searchQuery, isDropdownOpen]);
  
  // Restaurar a posição de scroll ao abrir o dropdown
  useEffect(() => {
    if (isDropdownOpen) {
      // Pequeno timeout para garantir que o scroll seja restaurado após qualquer mudança de DOM
      const timeoutId = setTimeout(() => {
        window.scrollTo(scrollPositionRef.current.x, scrollPositionRef.current.y);
      }, 10);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isDropdownOpen]);

  const handleFocus = () => {
    if (disabled) return;
    
    // Salvar posição atual de scroll
    scrollPositionRef.current = {
      x: window.scrollX,
      y: window.scrollY
    };
    
    // Abrir dropdown
    setIsDropdownOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Se o input ficar vazio, limpar a seleção
    if (query === "") {
      setSelectedCbo(null);
      onChange("");
    }
  };

  const handleCboSelect = (cbo: TipoCboOption) => {
    // Salvar posição de scroll atual
    const scrollPosition = {
      x: window.scrollX,
      y: window.scrollY
    };
    
    setSelectedCbo(cbo);
    setSearchQuery(cbo.descricao);
    onChange(cbo.idtipo_cbo.toString());
    setIsDropdownOpen(false);
    
    // Pequeno timeout para garantir que o scroll seja restaurado após fechar o dropdown
    setTimeout(() => {
      window.scrollTo(scrollPosition.x, scrollPosition.y);
    }, 10);
  };

  const handleClear = () => {
    setSearchQuery("");
    setSelectedCbo(null);
    onChange(""); // Garante que retorna uma string vazia
  };

  // Renderiza o dropdown em um portal fora da hierarquia DOM
  const renderDropdown = () => {
    if (!isDropdownOpen) return null;
    
    return createPortal(
      <div 
        ref={dropdownRef}
        style={{
          position: 'absolute',
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          zIndex: 9999,
          width: `${inputRef.current ? inputRef.current.offsetWidth : 290}px`,
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e5e7eb',
          maxHeight: '300px', // Altura fixa para o container
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div className="p-2 border-b border-gray-100">
          <input
            type="text"
            placeholder="Filtrar profissões..."
            className="w-full p-2 text-sm border border-gray-200 rounded-md"
            value={searchQuery}
            onChange={handleInputChange}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        </div>
        <div 
          className="overflow-y-auto py-1 flex-grow"
          style={{
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {isLoading ? (
            <div className="px-4 py-2 text-sm text-gray-500 text-center">
              Carregando...
            </div>
          ) : cbos.length > 0 ? (
            cbos.map((cbo) => (
              <button
                key={cbo.idtipo_cbo}
                type="button"
                className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 ${
                  selectedCbo?.idtipo_cbo === cbo.idtipo_cbo ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
                onClick={() => handleCboSelect(cbo)}
              >
                {cbo.descricao}
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">
              {searchQuery.length > 0 ? 'Nenhuma profissão encontrada' : 'Digite para buscar profissões'}
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="w-full">
      {label && <label className="block mb-2 font-medium text-gray-700">{label}</label>}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          placeholder={placeholder}
          className={`w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none ${className} ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleFocus}
          disabled={disabled}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      {selectedCbo && (
        <div className="mt-2 flex items-center">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
            {selectedCbo.descricao}
          </span>
          {!disabled && (
            <button
              type="button"
              className="ml-2 text-xs text-red-500 hover:text-red-700"
              onClick={handleClear}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Renderiza o dropdown usando portal */}
      {renderDropdown()}
    </div>
  );
};

export default CboInput;