import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import axios from 'axios';
import indexedDBService from '@/services/indexedDB';

// Função para remover acentos e converter para maiúsculas
function normalizeText(text: string): string {
  if (!text) return "";
  // Remove acentos e converte para caixa alta
  return text.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // Remove acentos
    .toUpperCase();
}

// Interface for location options (states, municipalities)
interface LocationOption {
  [key: string]: any;
  descricao: string;
}

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  name: string;
  placeholder?: string;
  className?: string;
  label?: string;
  disabled?: boolean;
  options?: LocationOption[];
  idField?: string;
  filterEnabled?: boolean;
  apiEndpoint?: string;
  parentValue?: string;
  debug?: boolean;
  required?: boolean; // Adicionado suporte para campos obrigatórios
  error?: string; // Adicionado suporte para mensagens de erro
  excludeValues?: string[]; // IDs de valores que devem ser excluídos da lista
}

const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onChange,
  name,
  placeholder = "Selecione...",
  className = "",
  label = "",
  disabled = false,
  options = [],
  idField = "id",
  filterEnabled = true,
  apiEndpoint = "",
  parentValue = "",
  debug = false,
  required = false, // Valor padrão para campos obrigatórios
  error = "", // Valor padrão para mensagem de erro
  excludeValues = [] // IDs de valores que devem ser excluídos
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [displayValue, setDisplayValue] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<LocationOption | null>(null);
  const [localOptions, setLocalOptions] = useState<LocationOption[]>([]);
  const [isManuallyEditing, setIsManuallyEditing] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Para armazenar a posição atual de scroll
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  
  // Reference for fetch abort controller
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Reference for the last parent value (when this component is a municipality)
  const lastParentValueRef = useRef<string>("");

  const debugLog = (message: string, data?: any) => {
    if (debug) {
      if (data) {
        console.log(`[${name}] ${message}`, data);
      } else {
        console.log(`[${name}] ${message}`);
      }
    }
  };

  // Função para normalizar as opções recebidas, removendo acentos e cedilhas
  const normalizeOptions = (options: LocationOption[]): LocationOption[] => {
    return options.map(option => ({
      ...option,
      descricao: normalizeText(option.descricao)
    }));
  };

  // Initialize local options with provided props
  useEffect(() => {
    if (options && options.length > 0) {
      debugLog(`Using ${options.length} options received via props`);
      // Normalizar as opções recebidas
      const normalizedOptions = normalizeOptions(options);
      setLocalOptions(normalizedOptions);
    }
  }, [options]);

  // Reset selection when parent value changes (for municipalities)
  useEffect(() => {
    if (name === "municipio" && parentValue !== undefined) {
      debugLog(`State value changed to: ${parentValue}`);
      
      // Avoid processing if parent value hasn't changed
      if (lastParentValueRef.current === parentValue) {
        debugLog(`Ignoring update - state value hasn't changed`);
        return;
      }
      
      // Update reference to new parent value
      lastParentValueRef.current = parentValue;
      
      // Clear current selection
      if (value) {
        onChange("");
      }
      
      setSelectedOption(null);
      setSearchQuery("");
      setDisplayValue("");
      setIsManuallyEditing(false);
      
      // Clear options immediately
      setLocalOptions([]);
      
      // Only fetch municipalities if a state is selected
      if (parentValue) {
        fetchMunicipiosByEstado(parentValue);
      }
    }
  }, [parentValue, name]);

  // Função para atualizar a posição do dropdown
  const updateDropdownPosition = () => {
    if (!inputRef.current || !dropdownRef.current) return;
    
    const rect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Verificar se estamos em dispositivo móvel
    const isMobile = viewportWidth <= 768;
    
    // Em dispositivos móveis, posicionar em relação à viewport
    if (isMobile) {
      // Calcular espaço disponível abaixo do input
      const spaceBelow = viewportHeight - rect.bottom;
      // Altura máxima para o dropdown
      const maxDropdownHeight = Math.min(300, viewportHeight * 0.6);
      
      // Garantir que o dropdown não exceda a largura da tela
      const leftPosition = Math.max(0, rect.left);
      const adjustedWidth = Math.min(rect.width, viewportWidth - leftPosition);
      
      // Se não houver espaço suficiente abaixo, posicionar acima se possível
      if (spaceBelow < 150 && rect.top > 150) {
        dropdownRef.current.style.setProperty('bottom', `${viewportHeight - rect.top}px`);
        dropdownRef.current.style.setProperty('top', 'auto');
        dropdownRef.current.style.setProperty('max-height', `${Math.min(rect.top - 10, maxDropdownHeight)}px`);
      } else {
        // Posicionar abaixo com altura máxima apropriada
        dropdownRef.current.style.setProperty('top', `${rect.bottom}px`);
        dropdownRef.current.style.setProperty('bottom', 'auto');
        dropdownRef.current.style.setProperty('max-height', `${Math.min(spaceBelow - 10, maxDropdownHeight)}px`);
      }
      
      // Definir posição horizontal - garantir que esteja visível na tela
      dropdownRef.current.style.setProperty('left', `${leftPosition}px`);
      dropdownRef.current.style.setProperty('width', `${adjustedWidth}px`);
      
      // Usar posicionamento fixo em dispositivos móveis para evitar problemas com scroll
      dropdownRef.current.style.setProperty('position', 'fixed');
      
      // Garantir que o z-index seja alto o suficiente
      dropdownRef.current.style.setProperty('z-index', '9999');
      
      // Adicionar animação sutil para UX mais suave
      dropdownRef.current.style.setProperty('transition', 'opacity 0.2s, transform 0.2s');
      dropdownRef.current.style.setProperty('opacity', '1');
      dropdownRef.current.style.setProperty('transform', 'translateY(0)');
    } else {
      // Em desktop, usar posicionamento absoluto em relação ao documento
      dropdownRef.current.style.setProperty('position', 'absolute');
      dropdownRef.current.style.setProperty('top', `${rect.bottom + window.scrollY}px`);
      dropdownRef.current.style.setProperty('left', `${rect.left + window.scrollX}px`);
      dropdownRef.current.style.setProperty('width', `${rect.width}px`);
      dropdownRef.current.style.setProperty('max-height', '300px');
    }
  };
  // Improved function to fetch municipalities
  const fetchMunicipiosByEstado = async (estadoId: string) => {
    if (!apiEndpoint || !estadoId) return;
    
    // Cancel any previous request
    if (abortControllerRef.current) {
      debugLog(`Canceling previous municipality request`);
      abortControllerRef.current.abort();
    }
    
    // Create new controller for this request
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    
    setIsLoading(true);
    debugLog(`Fetching municipalities for state ID: ${estadoId}`);
    
    let municipios: LocationOption[] = [];

    try {
      // ✅ VERIFICAR CACHE OFFLINE PRIMEIRO
      if (!navigator.onLine) {
        console.log('📱 Modo offline: buscando municípios em cache...');
        
        const allMunicipios = await indexedDBService.getOpcoes('municipios');
        if (allMunicipios && allMunicipios.length > 0) {
          // Filtrar municípios do estado selecionado
          municipios = allMunicipios.filter((municipio: any) => 
            Number(municipio.tipo_estado_idtipo_estado) === Number(estadoId)
          );
          console.log(`✅ Encontrados ${municipios.length} municípios offline para estado ${estadoId}`);
        } else {
          throw new Error('Nenhum município encontrado offline. Baixe os dados primeiro.');
        }
      } else {
        // ✅ MODO ONLINE: usar API normal com fallback
        try {
          const server = import.meta.env.VITE_API_SERVER || "";
          const port = import.meta.env.VITE_API_PORT || "";
          const baseUrl = server && port ? `${server}:${port}/` : "/";
          const url = `${baseUrl}${apiEndpoint}?tipo_estado_idtipo_estado=${estadoId}&limit=1000`;
          
          debugLog(`Making request to: ${url}`);
          const response = await axios.get(url, { signal });
          
          if (response.data && Array.isArray(response.data)) {
            municipios = response.data;
          } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
            municipios = response.data.data;
          }
          
        } catch (apiError) {
          console.warn('⚠️ API de municípios falhou, tentando cache...');
          
          const allMunicipios = await indexedDBService.getOpcoes('municipios');
          if (allMunicipios && allMunicipios.length > 0) {
            municipios = allMunicipios.filter((municipio: any) => 
              Number(municipio.tipo_estado_idtipo_estado) === Number(estadoId)
            );
            console.log(`✅ Usando cache offline: ${municipios.length} municípios`);
          } else {
            throw apiError;
          }
        }
      }

      // Check if we're still processing the same state
      if (lastParentValueRef.current === estadoId) {
        const normalizedMunicipios = normalizeOptions(municipios);
        setLocalOptions(normalizedMunicipios);
      } else {
        debugLog(`State changed during request, discarding results`);
      }
      
    } catch (error: unknown) {
      // Don't show error if it was a cancellation
      if (
        error && 
        typeof error === 'object' && 
        'name' in error && 
        (error.name === 'CanceledError' || error.name === 'AbortError')
      ) {
        debugLog(`Request canceled for state ${estadoId}`);
        return;
      }
      
      debugLog(`Error fetching municipalities: ${error}`, error);
      setLocalOptions([]);
    } finally {
      // Only update state if we're still processing the same state
      if (lastParentValueRef.current === estadoId) {
        setIsLoading(false);
      }
    }
  };
  // Fetch all options (for countries or states)
  const fetchOptions = async (query = "") => {
    if (!apiEndpoint) return;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new controller for this request
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    
    setIsLoading(true);
    debugLog(`Fetching all ${name} options`);
    
    let options: LocationOption[] = [];

    try {
      // ✅ VERIFICAR CACHE OFFLINE PRIMEIRO
      if (!navigator.onLine) {
        console.log(`📱 [${name}] Modo offline: buscando em cache...`);
        
        const cacheKey = name === 'uf' ? 'estados' : 
                        name === 'paisProcedencia' ? 'paises' :
                        'municipios';
        const cachedOptions = await indexedDBService.getOpcoes(cacheKey);
        
        if (cachedOptions && cachedOptions.length > 0) {
          options = cachedOptions;
          
          // Filtrar por query se necessário
          if (query) {
            const normalizedQuery = normalizeText(query);
            options = options.filter((option: any) => 
              normalizeText(option.descricao || option.nome || '').includes(normalizedQuery)
            );
          }
          
          console.log(`✅ [${name}] ${options.length} registros encontrados em cache`);
        } else {
          throw new Error(`Nenhum dado encontrado offline para ${name}. Baixe os dados primeiro.`);
        }
      } else {
        // ✅ MODO ONLINE: usar API normal com fallback
        try {
          const server = import.meta.env.VITE_API_SERVER || "";
          const port = import.meta.env.VITE_API_PORT || "";
          const baseUrl = server && port ? `${server}:${port}/` : "/";
          
          let url = `${baseUrl}${apiEndpoint}`;
          const limit = name === "paisProcedencia" ? 300 : 1000;
          
          if (query) {
            const normalizedQuery = normalizeText(query);
            url += `?descricao=${encodeURIComponent(normalizedQuery)}&limit=${limit}`;
          } else {
            url += `?limit=${limit}`;
          }
          
          debugLog(`Making request: ${url}`);
          const response = await axios.get(url, { signal });
          
          if (response.data && Array.isArray(response.data)) {
            options = response.data;
          } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
            options = response.data.data;
          }
          
          // ✅ SALVAR NO CACHE PARA USO FUTURO
          if (!query) { // Só salva busca geral, não buscas específicas
            const cacheKey = name === 'uf' ? 'estados' : 
                            name === 'paisProcedencia' ? 'paises' :
                            'municipios';
            await indexedDBService.saveOpcoes(cacheKey, options);
          }
          
        } catch (apiError) {
          console.warn(`⚠️ [${name}] API falhou, tentando cache...`);
          
          const cacheKey = name === 'uf' ? 'estados' : 
                          name === 'paisProcedencia' ? 'paises' :
                          'municipios';
          const cachedOptions = await indexedDBService.getOpcoes(cacheKey);
          
          if (cachedOptions && cachedOptions.length > 0) {
            options = cachedOptions;
            
            // Filtrar por query se necessário
            if (query) {
              const normalizedQuery = normalizeText(query);
              options = options.filter((option: any) => 
                normalizeText(option.descricao || option.nome || '').includes(normalizedQuery)
              );
            }
            
            console.log(`✅ [${name}] Usando cache offline: ${options.length} registros`);
          } else {
            throw apiError;
          }
        }
      }

      debugLog(`Received ${options.length} results`);
      const normalizedOptions = normalizeOptions(options);
      setLocalOptions(normalizedOptions);
      
    } catch (error: unknown) {
      if (
        error && 
        typeof error === 'object' && 
        'name' in error && 
        (error.name === 'CanceledError' || error.name === 'AbortError')
      ) {
        debugLog(`Request canceled`);
        return;
      }
      
      debugLog('Error fetching options', error);
      setLocalOptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch specific item by ID
  const fetchById = async (id: string) => {
    try {
      setIsLoading(true);
      const server = import.meta.env.VITE_API_SERVER || "";
      const port = import.meta.env.VITE_API_PORT || "";
      const baseUrl = server && port ? `${server}:${port}/` : "/";
      
      const url = `${baseUrl}${apiEndpoint}/${id}`;
      debugLog(`Fetching item by ID: ${url}`);
      
      const response = await axios.get(url);
      
      if (response.data && response.data[idField]) {
        // Normalizar a descrição do item
        if (response.data.descricao) {
          response.data.descricao = normalizeText(response.data.descricao);
        }
        debugLog(`Item found: ${response.data.descricao}`);
        return response.data;
      }
      
      debugLog(`Item with ID ${id} not found`);
      return null;
    } catch (error: unknown) {
      debugLog(`Error fetching by ID: ${id}`, error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Filter local options based on search term with memo
  const filteredOptions = useMemo(() => {
    // Primeiro aplica o filtro de exclusão
    let optionsToFilter = localOptions;
    
    // ⚠️ Aplicar exclusão de valores específicos (ex: Belém quando não é residente)
    if (excludeValues && excludeValues.length > 0) {
      optionsToFilter = localOptions.filter(option => 
        !excludeValues.includes(String(option[idField]))
      );
    }
    
    // Se não há termo de busca, mostrar todas as opções (já filtradas)
    if (!searchQuery) return optionsToFilter;
    
    // Normalizar o termo de pesquisa
    const normalizedSearch = normalizeText(searchQuery);
    return optionsToFilter.filter(option => option.descricao.includes(normalizedSearch));
  }, [localOptions, searchQuery, excludeValues, idField]);

  // Load selected option if there's a value - with manual editing check
  useEffect(() => {
    // Skip this effect if user is typing manually
    if (isManuallyEditing) {
      return;
    }
    
    const loadSelectedOption = async () => {
      if (value) {
        // First try to find in local options
        const foundOption = localOptions.find(opt => String(opt[idField]) === String(value));
        
        if (foundOption) {
          debugLog(`Option found locally: ${foundOption.descricao}`);
          setSelectedOption(foundOption);
          setDisplayValue(foundOption.descricao);
        } else if (apiEndpoint) {
          // If not found locally, fetch from API
          debugLog(`Fetching option by ID from API: ${value}`);
          const option = await fetchById(value);
          
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
  }, [value, localOptions, apiEndpoint, idField, isManuallyEditing]);

  // Fechar dropdown com segurança
  const closeDropdown = () => {
    setIsDropdownOpen(false);
    
    // Quando fechar o dropdown sem selecionar, resetar para o valor anterior se necessário
    if (isManuallyEditing && selectedOption) {
      setSearchQuery("");
      setIsManuallyEditing(false);
    } else if (isManuallyEditing && !selectedOption) {
      setSearchQuery("");
      setIsManuallyEditing(false);
    }
  };

  // Handler to close dropdown when clicking outside
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
      // Pequeno timeout para evitar que o mesmo clique que abriu o dropdown o feche imediatamente
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen, isManuallyEditing, selectedOption]);

  // Update dropdown position when opened or window is resized
  useEffect(() => {
    if (isDropdownOpen) {
      updateDropdownPosition();
      
      // Load options when dropdown is opened
      if (name === "municipio") {
        // For municipalities, we need the state value
        if (parentValue && localOptions.length === 0) {
          fetchMunicipiosByEstado(parentValue);
        }
      } else {
        // For states and others, we fetch all
        if (localOptions.length === 0) {
          fetchOptions(searchQuery);
        }
      }
      
      // Monitorar redimensionamento da janela
      window.addEventListener('resize', updateDropdownPosition);
      // Monitorar scroll
      window.addEventListener('scroll', updateDropdownPosition);
      
      return () => {
        window.removeEventListener('resize', updateDropdownPosition);
        window.removeEventListener('scroll', updateDropdownPosition);
      };
    }
  }, [isDropdownOpen, name, parentValue, localOptions.length, searchQuery]);
  
  // Text search with debounce
  useEffect(() => {
    if (isDropdownOpen && searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        if (name === "municipio" && parentValue) {
          // For municipalities, we filter locally already loaded options
          // We don't need to make another API call
        } else {
          // For states, we do a term search
          fetchOptions(searchQuery);
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [searchQuery, isDropdownOpen, name, parentValue]);

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
    
    // Armazenar posição atual de scroll
    setScrollPosition({
      x: window.scrollX,
      y: window.scrollY
    });
    
    // Limpar a consulta de pesquisa ao focar
    setSearchQuery("");
    
    // Abrir dropdown
    setIsDropdownOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    
    // When user starts typing, enter manual editing mode
    if (!isManuallyEditing) {
      setIsManuallyEditing(true);
      // If we had a selection before and now we're typing, remove the selection
      if (selectedOption) {
        // Inform parent component that the value was cleared
        onChange("");
        setSelectedOption(null);
      }
    }
    
    // Aplicar normalização (remover acentos e converter para maiúsculas)
    setSearchQuery(query);
  };

  const handleOptionSelect = (option: LocationOption) => {
    debugLog(`Option selected: ${option.descricao} (${option[idField]})`);
    
    setSelectedOption(option);
    setDisplayValue(option.descricao);
    setSearchQuery("");
    setIsManuallyEditing(false); // Exit manual editing mode
    onChange(option[idField].toString());
    setIsDropdownOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening dropdown when clearing
    debugLog('Selection cleared');
    setDisplayValue("");
    setSearchQuery("");
    setSelectedOption(null);
    setIsManuallyEditing(false); // Exit manual editing mode
    onChange(""); // Ensure returns an empty string
  };

  // Render dropdown in a portal outside DOM hierarchy
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
        {filterEnabled && (
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white z-10">
            <div className="relative">
              <input
                type="text"
                placeholder="Pesquisar..."
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
        )}
        <div className="overflow-y-auto py-1 flex-grow">
          {isLoading ? (
            <div className="px-4 py-2 text-sm text-gray-500 text-center">
              Carregando...
            </div>
          ) : filteredOptions.length > 0 ? (
            <>
              <div className="px-4 py-1 text-xs text-gray-400">
                {filteredOptions.length} opções encontradas
              </div>
              {filteredOptions.map((option) => (
                <button
                  key={option[idField]}
                  type="button"
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 ${
                    selectedOption && selectedOption[idField] === option[idField] ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
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
                : name === "municipio" && !parentValue 
                  ? 'Selecione uma UF primeiro'
                  : 'Nenhuma opção disponível'}
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
      {label && (
        <label className="block mb-2 font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          placeholder={isLoading ? "Carregando..." : placeholder}
          className={`w-full p-3 pl-3 pr-10 border ${
            error ? "border-red-500 bg-red-50" : "border-gray-200"
          } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none ${className} ${
            disabled ? "opacity-60 cursor-not-allowed bg-gray-50" : ""
          }`}
          value={displayValue}
          readOnly={true}  // Make the main input read-only
          onFocus={handleFocus}
          onClick={handleFocus}
          disabled={disabled || isLoading}
          data-error={error ? "true" : "false"} // Para fins de CSS e scroll automatizado
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
      
      {/* Exibir mensagem de erro, se houver */}
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
      
      {/* Render dropdown using portal */}
      {renderDropdown()}
    </div>
  );
};

export default LocationInput;