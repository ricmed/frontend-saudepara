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
  debug = false
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [displayValue, setDisplayValue] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<LocationOption | null>(null);
  const [localOptions, setLocalOptions] = useState<LocationOption[]>([]);
  const [isManuallyEditing, setIsManuallyEditing] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Reference for fetch abort controller
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Reference for the last parent value (when this component is a municipality)
  const lastParentValueRef = useRef<string>("");
  
  // Save current scroll position
  const scrollPositionRef = useRef({ x: 0, y: 0 });

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
    
    const server = import.meta.env.VITE_API_SERVER || "";
    const port = import.meta.env.VITE_API_PORT || "";
    const baseUrl = server && port ? `${server}:${port}/` : "/";
    
    // Use only the primary parameter format most likely to work
    const url = `${baseUrl}${apiEndpoint}?tipo_estado_idtipo_estado=${estadoId}&limit=1000`;
    
    try {
      debugLog(`Making request to: ${url}`);
      const response = await axios.get(url, { signal });
      
      let municipios: LocationOption[] = [];
      
      if (response.data && Array.isArray(response.data)) {
        municipios = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        municipios = response.data.data;
      }
      
      debugLog(`Success! Found ${municipios.length} municipalities`);
      
      // Check if we're still processing the same state
      if (lastParentValueRef.current === estadoId) {
        // Normalizar os municípios recebidos
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
      
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? error.message as string
        : 'Unknown error';
      debugLog(`Error fetching municipalities: ${errorMessage}`, error);
      
      // Try with alternative parameter format only in case of failure
      try {
        const fallbackUrl = `${baseUrl}${apiEndpoint}?estado_id=${estadoId}&limit=1000`;
        debugLog(`Trying alternative format: ${fallbackUrl}`);
        
        const fallbackResponse = await axios.get(fallbackUrl, { signal });
        let fallbackMunicipios: LocationOption[] = [];
        
        if (fallbackResponse.data && Array.isArray(fallbackResponse.data)) {
          fallbackMunicipios = fallbackResponse.data;
        } else if (fallbackResponse.data?.data && Array.isArray(fallbackResponse.data.data)) {
          fallbackMunicipios = fallbackResponse.data.data;
        }
        
        if (fallbackMunicipios.length > 0) {
          debugLog(`Fallback successful! Found ${fallbackMunicipios.length} municipalities`);
          // Normalizar os municípios recebidos pelo fallback
          const normalizedMunicipios = normalizeOptions(fallbackMunicipios);
          setLocalOptions(normalizedMunicipios);
        } else {
          debugLog(`Fallback failed - no municipalities found`);
          setLocalOptions([]);
        }
      } catch (fallbackError: unknown) {
        const errorMessage = fallbackError && typeof fallbackError === 'object' && 'message' in fallbackError 
          ? fallbackError.message as string
          : 'Unknown error';
        debugLog(`Fallback error: ${errorMessage}`);
        setLocalOptions([]);
      }
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
    
    const server = import.meta.env.VITE_API_SERVER || "";
    const port = import.meta.env.VITE_API_PORT || "";
    const baseUrl = server && port ? `${server}:${port}/` : "/";
    
    try {
      // For search with term or general search
      let url = `${baseUrl}${apiEndpoint}`;
      
      // Use a larger limit for countries to ensure all are loaded
      const limit = name === "paisProcedencia" ? 300 : 1000;
      
      if (query) {
        // Normalizar a consulta antes de enviar para a API
        const normalizedQuery = normalizeText(query);
        url += `?descricao=${encodeURIComponent(normalizedQuery)}&limit=${limit}`;
      } else {
        url += `?limit=${limit}`;
      }
      
      debugLog(`Making request: ${url}`);
      
      const response = await axios.get(url, { signal });
      
      let options: LocationOption[] = [];
      
      if (response.data && Array.isArray(response.data)) {
        options = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        options = response.data.data;
      }
      
      debugLog(`Received ${options.length} results`);
      // Normalizar as opções recebidas
      const normalizedOptions = normalizeOptions(options);
      setLocalOptions(normalizedOptions);
    } catch (error: unknown) {
      // Don't show error if it was a cancellation
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

  // Filter local options based on search term
  const filteredOptions = localOptions.filter(option => {
    // Normalizar tanto a descrição da opção quanto o termo de pesquisa
    const normalizedDesc = normalizeText(option.descricao);
    const normalizedSearch = normalizeText(searchQuery);
    return normalizedDesc.includes(normalizedSearch);
  });

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

  // Handler to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        
        // When closing dropdown without selecting, reset to previous value if needed
        if (isManuallyEditing && selectedOption) {
          setSearchQuery("");
          setDisplayValue(selectedOption.descricao);
          setIsManuallyEditing(false);
        } else if (isManuallyEditing && !selectedOption) {
          setSearchQuery("");
          setDisplayValue("");
          setIsManuallyEditing(false);
        }
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen, isManuallyEditing, selectedOption]);

  // Update dropdown position when opened
  useEffect(() => {
    if (isDropdownOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
      
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
    }
  }, [isDropdownOpen, name, parentValue, localOptions.length]);
  
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
    
    // Save current scroll position
    scrollPositionRef.current = {
      x: window.scrollX,
      y: window.scrollY
    };
    
    // In search mode, clear the input value but keep the display value
    if (filterEnabled) {
      setSearchQuery("");
    }
    
    // Open dropdown
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
    // Save current scroll position
    const scrollPosition = {
      x: window.scrollX,
      y: window.scrollY
    };
    
    debugLog(`Option selected: ${option.descricao} (${option[idField]})`);
    
    setSelectedOption(option);
    setDisplayValue(option.descricao);
    setSearchQuery("");
    setIsManuallyEditing(false); // Exit manual editing mode
    onChange(option[idField].toString());
    setIsDropdownOpen(false);
    
    // Small timeout to ensure scroll is restored after closing dropdown
    setTimeout(() => {
      window.scrollTo(scrollPosition.x, scrollPosition.y);
    }, 10);
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
          maxHeight: '300px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {filterEnabled && (
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              placeholder="Pesquisar..."
              className="w-full p-2 text-sm border border-gray-200 rounded-md"
              value={searchQuery}
              onChange={handleInputChange}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
        )}
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
          ) : filteredOptions.length > 0 ? (
            <>
              <div className="px-4 py-1 text-xs text-gray-400">
                {filteredOptions.length} opcoes encontradas
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
                  : 'Nenhuma opcao disponivel'}
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
          placeholder={isLoading ? "Carregando..." : placeholder}
          className={`w-full p-3 pl-3 pr-10 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none ${className} ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
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

export default LocationInput;