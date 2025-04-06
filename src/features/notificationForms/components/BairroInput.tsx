import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import axios from 'axios';

// Função para remover acentos e converter para maiúsculas
function normalizeText(text: string): string {
  if (!text) return "";
  // Remove acentos e converte para caixa alta
  return text.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // Remove acentos
    .toUpperCase();
}

// Interface para bairros
interface Bairro {
  idtipo_bairro: number;
  descricao: string;
}

interface BairroInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  debug?: boolean;
}

const BairroInput: React.FC<BairroInputProps> = ({
  value,
  onChange,
  label = "Bairro",
  placeholder = "Selecione o bairro...",
  disabled = false,
  debug = false
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [displayValue, setDisplayValue] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<Bairro | null>(null);
  const [options, setOptions] = useState<Bairro[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Reference for fetch abort controller
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Save current scroll position
  const scrollPositionRef = useRef({ x: 0, y: 0 });

  const debugLog = (message: string, data?: any) => {
    if (debug) {
      if (data) {
        console.log(`[BairroInput] ${message}`, data);
      } else {
        console.log(`[BairroInput] ${message}`);
      }
    }
  };

  // Fetch bairros from API
  const fetchBairros = async (query = "") => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new controller for this request
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    
    setIsLoading(true);
    debugLog(`Buscando bairros${query ? ` com filtro: ${query}` : ''}`);
    
    const server = import.meta.env.VITE_API_SERVER || "";
    const port = import.meta.env.VITE_API_PORT || "";
    const baseUrl = server && port ? `${server}:${port}/` : "/";
    
    try {
      let url = `${baseUrl}api/tipo-bairro`;
      
      if (query && query.length >= 3) {
        // Normalizar a consulta antes de enviar para a API
        const normalizedQuery = normalizeText(query);
        url += `/search?descricao=${encodeURIComponent(normalizedQuery)}&limit=100`;
      } else {
        url += `?limit=100`;
      }
      
      debugLog(`Requisição: ${url}`);
      
      const response = await axios.get(url, { signal });
      
      let bairros: Bairro[] = [];
      
      if (response.data && Array.isArray(response.data)) {
        bairros = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        bairros = response.data.data;
      }
      
      // Normalizar as descrições para caixa alta e sem acentos
      const normalizedBairros = bairros.map(bairro => ({
        ...bairro,
        descricao: normalizeText(bairro.descricao)
      }));
      
      // Ordenar por descrição
      const sortedBairros = normalizedBairros.sort((a, b) => 
        a.descricao.localeCompare(b.descricao, 'pt-BR')
      );
      
      debugLog(`Recebidos ${sortedBairros.length} bairros`);
      setOptions(sortedBairros);
    } catch (error: unknown) {
      // Ignore cancelations
      if (
        error && 
        typeof error === 'object' && 
        'name' in error && 
        (error.name === 'CanceledError' || error.name === 'AbortError')
      ) {
        debugLog(`Requisição cancelada`);
        return;
      }
      
      debugLog('Erro ao buscar bairros', error);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch specific bairro by ID
  const fetchBairroById = async (id: string) => {
    try {
      setIsLoading(true);
      const server = import.meta.env.VITE_API_SERVER || "";
      const port = import.meta.env.VITE_API_PORT || "";
      const baseUrl = server && port ? `${server}:${port}/` : "/";
      
      const url = `${baseUrl}api/tipo-bairro/${id}`;
      debugLog(`Buscando bairro por ID: ${url}`);
      
      const response = await axios.get(url);
      
      if (response.data && response.data.idtipo_bairro) {
        // Normalizar a descrição do bairro
        const bairro = {
          ...response.data,
          descricao: normalizeText(response.data.descricao)
        };
        
        debugLog(`Bairro encontrado: ${bairro.descricao}`);
        return bairro;
      }
      
      debugLog(`Bairro com ID ${id} não encontrado`);
      return null;
    } catch (error: unknown) {
      debugLog(`Erro ao buscar bairro por ID: ${id}`, error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Filter options based on search term
  const filteredOptions = options.filter(option => {
    // Se não há termo de busca, mostrar todos
    if (!searchQuery) return true;
    
    // Normalizar tanto a descrição da opção quanto o termo de pesquisa
    const normalizedDesc = option.descricao; // Já está normalizado nas opções
    const normalizedSearch = normalizeText(searchQuery);
    return normalizedDesc.includes(normalizedSearch);
  });

  // Load selected option if there's a value
  useEffect(() => {
    const loadSelectedOption = async () => {
      if (value) {
        // First try to find in current options
        const foundOption = options.find(opt => opt.idtipo_bairro.toString() === value);
        
        if (foundOption) {
          debugLog(`Opção encontrada localmente: ${foundOption.descricao}`);
          setSelectedOption(foundOption);
          setDisplayValue(foundOption.descricao);
        } else {
          // If not found locally, fetch from API
          debugLog(`Buscando bairro por ID na API: ${value}`);
          const option = await fetchBairroById(value);
          
          if (option) {
            setSelectedOption(option);
            setDisplayValue(option.descricao);
          } else {
            // If also failed on API, clear selection
            setSelectedOption(null);
            setDisplayValue("");
          }
        }
      } else if (value === "") {
        // Clear selection when value is explicitly empty
        setSelectedOption(null);
        setDisplayValue("");
      }
    };
    
    loadSelectedOption();
  }, [value, options]);

  // Handler to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Verificar se estamos em um dispositivo móvel
      const isMobile = window.innerWidth <= 768;
      
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node)
      ) {
        // Em dispositivos móveis, adicionar uma pequena pausa
        // para permitir que o teclado feche antes de processar a ação
        if (isMobile) {
          setTimeout(() => {
            setIsDropdownOpen(false);
          }, 100);
        } else {
          setIsDropdownOpen(false);
        }
      }
    };
  
    if (isDropdownOpen) {
      // Pequeno timeout para evitar que o mesmo clique que abriu o dropdown o feche imediatamente
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Update dropdown position when opened
  useEffect(() => {
    if (isDropdownOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
      
      // Load options when dropdown is opened
      fetchBairros();
    }
  }, [isDropdownOpen]);
  
  // Text search with debounce
  useEffect(() => {
    if (isDropdownOpen && searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        fetchBairros(searchQuery);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [searchQuery, isDropdownOpen]);
  
  // Restore scroll position when opening dropdown
  useEffect(() => {
    if (isDropdownOpen) {
      const timeoutId = setTimeout(() => {
        window.scrollTo(scrollPositionRef.current.x, scrollPositionRef.current.y);
      }, 10);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isDropdownOpen]);

  // Cancel pending requests when unmounting component
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleFocus = () => {
    if (disabled) return;
    
    // Detectar se estamos em um dispositivo móvel
    const isMobile = window.innerWidth <= 768;
    
    // Salvar posição atual de scroll
    scrollPositionRef.current = {
      x: window.scrollX,
      y: window.scrollY
    };
    
    // Limpar a consulta de pesquisa ao focar
    setSearchQuery("");
    
    // Abrir dropdown
    setIsDropdownOpen(true);
    
    // Em dispositivos móveis, forçar um pequeno timeout para garantir
    // que o dropdown seja posicionado corretamente após o teclado aparecer
    if (isMobile && inputRef.current) {
      setTimeout(() => {
        const rect = inputRef.current!.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX
        });
      }, 50);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  const handleOptionSelect = (option: Bairro) => {
    // Save current scroll position
    const scrollPosition = {
      x: window.scrollX,
      y: window.scrollY
    };
    
    debugLog(`Opção selecionada: ${option.descricao} (${option.idtipo_bairro})`);
    
    setSelectedOption(option);
    setDisplayValue(option.descricao);
    setSearchQuery("");
    onChange(option.idtipo_bairro.toString());
    setIsDropdownOpen(false);
    
    // Small timeout to ensure scroll is restored after closing dropdown
    setTimeout(() => {
      window.scrollTo(scrollPosition.x, scrollPosition.y);
    }, 10);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening dropdown when clearing
    debugLog('Seleção limpa');
    setDisplayValue("");
    setSearchQuery("");
    setSelectedOption(null);
    onChange(""); // Ensure returns an empty string
  };

  // Render dropdown in a portal outside DOM hierarchy
  const renderDropdown = () => {
    if (!isDropdownOpen) return null;
    
    // Detectar se estamos em um dispositivo móvel
    const isMobile = window.innerWidth <= 768;
    
    // Em dispositivos móveis, anexamos o dropdown ao elemento pai em vez de ao body
    // para manter o contexto de rolagem
    const dropdownParent = (isMobile && inputRef.current && inputRef.current.parentElement) 
      ? inputRef.current.parentElement 
      : document.body;
  
    // Calcular posição do dropdown
    let topPosition = dropdownPosition.top;
    let leftPosition = dropdownPosition.left;
    
    // Em dispositivos móveis, posicionar relativo ao elemento pai
    if (isMobile && inputRef.current) {
      const inputHeight = inputRef.current.offsetHeight;
      topPosition = inputHeight + 4; // 4px de espaço
      leftPosition = 0;
    }
    
    return createPortal(
      <div 
        ref={dropdownRef}
        style={{
          position: isMobile ? 'absolute' : 'fixed',
          top: isMobile ? `${topPosition}px` : `${dropdownPosition.top}px`,
          left: isMobile ? `${leftPosition}px` : `${dropdownPosition.left}px`,
          zIndex: 9999,
          width: isMobile ? '100%' : `${inputRef.current ? inputRef.current.offsetWidth : 290}px`,
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e5e7eb',
          maxHeight: isMobile ? '50vh' : '300px',
          display: 'flex',
          flexDirection: 'column',
          // Prevenir que o dropdown fique fora da tela em dispositivos móveis
          maxWidth: '100vw'
        }}
      >
        <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
          <input
            type="text"
            placeholder="Pesquisar bairros..."
            className="w-full p-2 text-sm border border-gray-200 rounded-md"
            value={searchQuery}
            onChange={handleInputChange}
            onClick={(e) => e.stopPropagation()}
            autoFocus={!isMobile} // Evitar autofocus em mobile que pode causar problemas
          />
        </div>
        <div 
          className="overflow-y-auto py-1 flex-grow"
          style={{
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            // Em mobile, limite a altura máxima para evitar cobrir toda a tela
            maxHeight: isMobile ? 'calc(50vh - 50px)' : undefined
          }}
        >
          {isLoading ? (
            <div className="px-4 py-2 text-sm text-gray-500 text-center">
              Carregando...
            </div>
          ) : filteredOptions.length > 0 ? (
            <>
              <div className="px-4 py-1 text-xs text-gray-400">
                {filteredOptions.length} bairros encontrados
              </div>
              {filteredOptions.map((option) => (
                <button
                  key={option.idtipo_bairro}
                  type="button"
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 ${
                    selectedOption && selectedOption.idtipo_bairro === option.idtipo_bairro ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                  onClick={() => handleOptionSelect(option)}
                >
                  {option.descricao}
                </button>
              ))}
            </>
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">
              {searchQuery.length > 0 
                ? 'Nenhum resultado encontrado' 
                : 'Nenhum bairro disponível'}
            </div>
          )}
        </div>
      </div>,
      dropdownParent
    );
  };

  return (
    <div className="w-full">
      {label && <label className="block mb-2 font-medium text-gray-700">{label}</label>}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name="bairro"
          placeholder={isLoading ? "Carregando..." : placeholder}
          className={`w-full p-3 pl-3 pr-10 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
          value={displayValue}
          readOnly={true}  // Make the main input read-only
          onFocus={handleFocus}
          onClick={handleFocus}
          disabled={disabled || isLoading}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {isLoading ? (
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          ) : displayValue ? (
            <button 
              onClick={handleClear}
              className="text-gray-400 hover:text-red-500 focus:outline-none"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <Search className="h-4 w-4 text-gray-400 pointer-events-none" />
          )}
        </div>
      </div>
      
      {/* Render dropdown using portal */}
      {renderDropdown()}
    </div>
  );
};

export default BairroInput;