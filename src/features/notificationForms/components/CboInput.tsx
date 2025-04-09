import React, { useState, useRef, useEffect, useMemo } from "react";
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
  placeholder = "Pesquisar profissao",
  className = "",
  label = "Profissao/Ocupacao (CBO)",
  disabled = false
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [displayValue, setDisplayValue] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cbos, setCbos] = useState<TipoCboOption[]>([]);
  const [selectedCbo, setSelectedCbo] = useState<TipoCboOption | null>(null);
  const [isManuallyEditing, setIsManuallyEditing] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Usar um estado para posição em vez de ref para forçar re-render
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });

  // Add a cache for storing previous search results
  const cboCache = useRef<Record<string, TipoCboOption[]>>({});
  // Track if initial load happened
  const initialLoadDone = useRef<boolean>(false);
  
  // Função para normalizar as opções de CBO
  const normalizeCbos = (cboOptions: TipoCboOption[]): TipoCboOption[] => {
    return cboOptions.map(cbo => ({
      ...cbo,
      descricao: normalizeText(cbo.descricao)
    }));
  };
  
  // Buscar CBOs do backend - with caching and error handling for minimum search length
  const fetchCbos = async (searchTerm: string = "") => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      // Normalizar o termo de pesquisa
      const normalizedSearchTerm = normalizeText(searchTerm);
      
      // Exigir sempre 3+ caracteres para pesquisar - modificação principal
      if (normalizedSearchTerm.length < 3) {
        if (normalizedSearchTerm.length > 0) {
          setErrorMessage("Digite pelo menos 3 caracteres para pesquisar");
        } else {
          setErrorMessage("Digite pelo menos 3 caracteres para ver as profissões");
        }
        
        // Limpar os resultados se não tiver caracteres suficientes
        setCbos([]);
        setIsLoading(false);
        return;
      }
      
      // Check cache first
      const cacheKey = normalizedSearchTerm;
      if (cboCache.current[cacheKey]) {
        console.log(`Using cached data for "${cacheKey}"`);
        setCbos(cboCache.current[cacheKey]);
        setIsLoading(false);
        return;
      }
      
      const server = import.meta.env.VITE_API_SERVER;
      const port = import.meta.env.VITE_API_PORT;
      
      // Sempre usar o endpoint de pesquisa, pois agora só chamamos quando há termo
      const endpoint = `${server}:${port}/api/tipo-cbo/search?descricao=${encodeURIComponent(normalizedSearchTerm)}&limit=10000`;
      
      const response = await axios.get(endpoint);
      
      // Processar a resposta de acordo com a estrutura da API
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        const data = response.data.data;
        // Normalizar todos os dados recebidos
        const normalizedData = normalizeCbos(data);
        // Store in cache
        cboCache.current[cacheKey] = normalizedData;
        
        setCbos(normalizedData);
      } else {
        console.error('Formato de resposta nao reconhecido:', response.data);
        setCbos([]);
        setErrorMessage('Formato de resposta nao reconhecido');
      }
    } catch (error: any) {
      console.error('Erro ao buscar CBOs:', error);
      setCbos([]);
      
      // Handle 400 error case specifically
      if (error.response && error.response.status === 400) {
        setErrorMessage("Digite pelo menos 3 caracteres para pesquisar");
      } else if (error.message && error.message.includes("Network Error")) {
        setErrorMessage("Erro de conexao com o servidor. Verifique se o backend esta rodando.");
      } else if (error.response && error.response.status) {
        setErrorMessage(`Erro ${error.response.status}: ${error.response.statusText}`);
      } else {
        setErrorMessage('Erro ao buscar profissoes');
      }
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
        // Normalizar a descrição do CBO
        const normalizedCbo = {
          ...response.data,
          descricao: normalizeText(response.data.descricao)
        };
        setSelectedCbo(normalizedCbo);
        setDisplayValue(normalizedCbo.descricao);
      } else {
        // Se não encontrar o CBO, limpar o campo
        setSelectedCbo(null);
        setDisplayValue("");
        console.warn(`CBO com ID ${id} nao encontrado`);
      }
    } catch (error) {
      console.error('Erro ao buscar CBO por ID:', error);
      // Limpar valor em caso de erro
      setSelectedCbo(null);
      setDisplayValue("");
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar CBO inicial se houver um valor
  useEffect(() => {
    if (!isManuallyEditing) {
      if (value && value !== "") {
        fetchCboById(value);
      } else {
        setSelectedCbo(null);
        setDisplayValue("");
      }
    }
  }, [value, isManuallyEditing]);

  // Manipulador para fechar o dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen, isManuallyEditing, selectedCbo]);

  // Safely close dropdown and restore state
  const closeDropdown = () => {
    setIsDropdownOpen(false);
    
    // Quando fechar o dropdown sem selecionar, resetar para o valor anterior se necessário
    if (isManuallyEditing && selectedCbo) {
      setSearchQuery("");
      setIsManuallyEditing(false);
    } else if (isManuallyEditing && !selectedCbo) {
      setSearchQuery("");
      setIsManuallyEditing(false);
    }
  };

  // Improved positioning logic for dropdown, especially for mobile
  const updateDropdownPosition = () => {
    if (!inputRef.current || !dropdownRef.current) return;
    
    const rect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Check if we're on mobile by screen width
    const isMobile = viewportWidth <= 768;
    
    // On mobile, position relative to viewport rather than document
    if (isMobile) {
      // Calculate how much space is available below the input
      const spaceBelow = viewportHeight - rect.bottom;
      // Default maximum height for dropdown
      const maxDropdownHeight = Math.min(300, viewportHeight * 0.6); // Limitar a 60% da altura da viewport
      
      // Make sure the dropdown doesn't exceed screen width on mobile
      const leftPosition = Math.max(0, rect.left);
      const adjustedWidth = Math.min(rect.width, viewportWidth - leftPosition);
      
      // If there's not enough space below, position above if possible
      if (spaceBelow < 150 && rect.top > 150) {
        dropdownRef.current.style.setProperty('bottom', `${viewportHeight - rect.top}px`);
        dropdownRef.current.style.setProperty('top', 'auto');
        dropdownRef.current.style.setProperty('max-height', `${Math.min(rect.top - 10, maxDropdownHeight)}px`);
      } else {
        // Position below with appropriate max height
        dropdownRef.current.style.setProperty('top', `${rect.bottom}px`);
        dropdownRef.current.style.setProperty('bottom', 'auto');
        dropdownRef.current.style.setProperty('max-height', `${Math.min(spaceBelow - 10, maxDropdownHeight)}px`);
      }
      
      // Set horizontal position - ensure it's visible on screen
      dropdownRef.current.style.setProperty('left', `${leftPosition}px`);
      dropdownRef.current.style.setProperty('width', `${adjustedWidth}px`);
      
      // Use fixed positioning on mobile to avoid scroll issues
      dropdownRef.current.style.setProperty('position', 'fixed');
      
      // Make sure the z-index is high enough
      dropdownRef.current.style.setProperty('z-index', '9999');
      
      // Add some subtle animation for smoother UX
      dropdownRef.current.style.setProperty('transition', 'opacity 0.2s, transform 0.2s');
      dropdownRef.current.style.setProperty('opacity', '1');
      dropdownRef.current.style.setProperty('transform', 'translateY(0)');
    } else {
      // On desktop, use absolute positioning relative to document
      const rect = inputRef.current.getBoundingClientRect();
      dropdownRef.current.style.setProperty('position', 'absolute');
      dropdownRef.current.style.setProperty('top', `${rect.bottom + window.scrollY}px`);
      dropdownRef.current.style.setProperty('left', `${rect.left + window.scrollX}px`);
      dropdownRef.current.style.setProperty('width', `${rect.width}px`);
      dropdownRef.current.style.setProperty('max-height', '300px');
    }
  };

  // Update dropdown position when it's opened or window is resized
  useEffect(() => {
    if (isDropdownOpen) {
      updateDropdownPosition();
      
      // Não buscar dados ao abrir o dropdown, esperando 3+ caracteres
      if (searchQuery.length >= 3) {
        fetchCbos(searchQuery);
      } else {
        // Apenas mostrar mensagem sem buscar dados
        setErrorMessage("Digite pelo menos 3 caracteres para ver as profissões");
        setCbos([]);
      }
      
      // Track window resize
      window.addEventListener('resize', updateDropdownPosition);
      // Track scroll
      window.addEventListener('scroll', updateDropdownPosition);
      
      return () => {
        window.removeEventListener('resize', updateDropdownPosition);
        window.removeEventListener('scroll', updateDropdownPosition);
      };
    }
  }, [isDropdownOpen, searchQuery]);
  
  // Debounce for search - only search with 3+ characters
  useEffect(() => {
    if (isDropdownOpen && searchQuery.length >= 3) {
      const timer = setTimeout(() => {
        fetchCbos(searchQuery);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [searchQuery, isDropdownOpen]);

  const handleFocus = () => {
    if (disabled) return;
    
    // Store current scroll position
    setScrollPosition({
      x: window.scrollX,
      y: window.scrollY
    });
    
    // Clear search query when focusing
    setSearchQuery("");
    
    // Open dropdown
    setIsDropdownOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    
    // When user starts typing, enter manual editing mode
    if (!isManuallyEditing) {
      setIsManuallyEditing(true);
      // If we had a selection before and now we're typing, remove the selection
      if (selectedCbo) {
        // Inform parent component that value was cleared
        onChange("");
        setSelectedCbo(null);
      }
    }
    
    setSearchQuery(query);
    
    // Show appropriate message based on query length
    if (query.length > 0 && query.length < 3) {
      setErrorMessage("Digite pelo menos 3 caracteres para pesquisar");
      // Limpar os resultados se não tiver caracteres suficientes
      setCbos([]);
    } else if (query.length >= 3) {
      // Fetch results for 3+ characters
      setErrorMessage(null);
    } else if (query.length === 0) {
      // Mensagem quando campo está vazio
      setErrorMessage("Digite pelo menos 3 caracteres para ver as profissões");
      setCbos([]);
    }
  };

  const handleCboSelect = (cbo: TipoCboOption) => {
    setSelectedCbo(cbo);
    setDisplayValue(cbo.descricao);
    setSearchQuery("");
    setIsManuallyEditing(false); // Exit manual editing mode
    onChange(cbo.idtipo_cbo.toString());
    closeDropdown();
  };

  const handleClear = () => {
    setDisplayValue("");
    setSearchQuery("");
    setSelectedCbo(null);
    setIsManuallyEditing(false); // Exit manual editing mode
    onChange(""); // Ensure returns an empty string
  };

  // Filter results client-side - modificado para exigir 3+ caracteres sempre
  const filteredCbos = useMemo(() => {
    if (searchQuery.length < 3) {
      // Não mostrar nenhuma profissão com menos de 3 caracteres
      return [];
    } else {
      // Usar os resultados da API quando tem 3+ caracteres
      return cbos;
    }
  }, [cbos, searchQuery]);

  // Render dropdown in a portal outside the DOM hierarchy
  const renderDropdown = () => {
    if (!isDropdownOpen) return null;
    
    return createPortal(
      <div 
        ref={dropdownRef}
        className="fixed z-[9999] bg-white rounded-lg shadow-md border border-gray-200 flex flex-col"
        style={{
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          zIndex: 9999,
        }}
      >
        <div className="p-2 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="relative">
            <input
              type="text"
              placeholder="Filtrar profissoes..."
              className="w-full p-2 pr-8 text-sm border border-gray-200 rounded-md"
              value={searchQuery}
              onChange={handleInputChange}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="overflow-y-auto py-1 flex-grow">
          {isLoading ? (
            <div className="px-4 py-2 text-sm text-gray-500 text-center">
              Carregando...
            </div>
          ) : errorMessage ? (
            <div className="px-4 py-2 text-sm text-red-500">
              {errorMessage}
              {errorMessage.includes("servidor") && (
                <button 
                  onClick={() => searchQuery.length >= 3 ? fetchCbos(searchQuery) : null} 
                  className="ml-2 text-blue-500 underline"
                >
                  Tentar novamente
                </button>
              )}
            </div>
          ) : filteredCbos.length > 0 ? (
            <>
              <div className="px-4 py-1 text-xs text-gray-400">
                {filteredCbos.length} profissoes encontradas
              </div>
              {filteredCbos.map((cbo) => (
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
              ))}
            </>
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">
              {searchQuery.length >= 3 ? 'Nenhuma profissao encontrada' : 'Digite pelo menos 3 caracteres para pesquisar...'}
            </div>
          )}
        </div>
        <div className="p-2 border-t border-gray-100 sticky bottom-0 bg-white">
          <button
            className="w-full py-2 text-sm text-center bg-gray-100 hover:bg-gray-200 rounded-md"
            onClick={closeDropdown}
          >
            Fechar
          </button>
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
          value={displayValue}
          readOnly={true}
          onFocus={handleFocus}
          onClick={handleFocus}
          disabled={disabled}
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

export default CboInput;