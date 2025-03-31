import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import axios from 'axios';

// Interface para opções de localização (estados, municípios)
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
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<LocationOption | null>(null);
  const [localOptions, setLocalOptions] = useState<LocationOption[]>([]);
  // Novo estado para rastrear se o usuário está editando manualmente
  const [isManuallyEditing, setIsManuallyEditing] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Salvar a posição de scroll atual
  const scrollPositionRef = useRef({ x: 0, y: 0 });
  // Rastrear a última URL chamada para evitar chamadas duplicadas
  const lastApiCall = useRef("");

  const debugLog = (message: string, data?: any) => {
    if (debug) {
      if (data) {
        console.log(`[${name}] ${message}`, data);
      } else {
        console.log(`[${name}] ${message}`);
      }
    }
  };

  // Inicializar opções locais com as opções fornecidas via props
  useEffect(() => {
    if (options && options.length > 0) {
      debugLog(`Usando ${options.length} opções recebidas via props`);
      setLocalOptions(options);
    }
  }, [options]);

  // Resetar seleção quando o valor pai muda (para municípios)
  useEffect(() => {
    if (name === "municipio" && parentValue !== undefined) {
      debugLog(`Valor do estado mudou para: ${parentValue}`);
      
      // Limpar seleção atual
      if (value) {
        onChange("");
      }
      setSelectedOption(null);
      setSearchQuery("");
      setIsManuallyEditing(false);
      
      // Apenas buscar municípios se tiver um estado selecionado
      if (parentValue) {
        fetchMunicipiosByEstado(parentValue);
      } else {
        setLocalOptions([]);
      }
    }
  }, [parentValue, name]);

  // Fetch municípios por estado
  const fetchMunicipiosByEstado = async (estadoId: string) => {
    if (!apiEndpoint) return;
    
    setIsLoading(true);
    debugLog(`Buscando municípios para o estado ID: ${estadoId}`);
    
    const server = import.meta.env.VITE_API_SERVER || "";
    const port = import.meta.env.VITE_API_PORT || "";
    const baseUrl = server && port ? `${server}:${port}/` : "/";
    
    // Tentamos várias formas possíveis de parâmetro para filtrar municípios por estado
    const possibleParams = [
      `tipo_estado_idtipo_estado=${estadoId}`,  // Este parece ser o formato correto baseado no banco
      `estado=${estadoId}`,                     // Formato comum
      `estado_id=${estadoId}`,                  // Outro formato comum
      `uf_id=${estadoId}`                       // Outro possível formato
    ];
    
    let foundMunicipios: LocationOption[] = [];
    let successParam = "";
    
    // Tentar cada formato de parâmetro
    for (const param of possibleParams) {
      try {
        const url = `${baseUrl}${apiEndpoint}?${param}&limit=1000`;
        
        // Evitar chamadas duplicadas
        if (url === lastApiCall.current) {
          debugLog(`Pulando chamada duplicada: ${url}`);
          continue;
        }
        
        lastApiCall.current = url;
        debugLog(`Tentando URL: ${url}`);
        
        const response = await axios.get(url);
        let municipios: LocationOption[] = [];
        
        if (response.data && Array.isArray(response.data)) {
          municipios = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          municipios = response.data.data;
        }
        
        if (municipios.length > 0) {
          debugLog(`Sucesso! Encontrados ${municipios.length} municípios usando: ${param}`);
          foundMunicipios = municipios;
          successParam = param;
          break;
        }
      } catch (error) {
        debugLog(`Erro ao tentar com ${param}`, error);
      }
    }
    
    if (foundMunicipios.length > 0) {
      debugLog(`Parâmetro correto identificado: ${successParam}`);
      setLocalOptions(foundMunicipios);
    } else {
      debugLog('Não foi possível obter municípios com nenhum dos parâmetros testados');
      setLocalOptions([]);
    }
    
    setIsLoading(false);
  };

  // Fetch todas as opções (para países ou UFs)
  const fetchOptions = async (query = "") => {
    if (!apiEndpoint) return;
    
    setIsLoading(true);
    debugLog(`Buscando todas as opções de ${name}`);
    
    const server = import.meta.env.VITE_API_SERVER || "";
    const port = import.meta.env.VITE_API_PORT || "";
    const baseUrl = server && port ? `${server}:${port}/` : "/";
    
    try {
      // Para busca com termo ou busca geral
      let url = `${baseUrl}${apiEndpoint}`;
      
      // Usar um limite maior para países para garantir que todos sejam carregados
      const limit = name === "paisProcedencia" ? 300 : 1000;
      
      if (query) {
        url += `?descricao=${encodeURIComponent(query)}&limit=${limit}`;
      } else {
        url += `?limit=${limit}`;
      }
      
      // Evitar chamadas duplicadas
      if (url === lastApiCall.current) {
        debugLog(`Pulando chamada duplicada: ${url}`);
        setIsLoading(false);
        return;
      }
      
      lastApiCall.current = url;
      debugLog(`Fazendo requisição: ${url}`);
      
      const response = await axios.get(url);
      let options: LocationOption[] = [];
      
      // Lidar com diferentes formatos de resposta
      if (response.data && Array.isArray(response.data)) {
        options = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        options = response.data.data;
      }
      
      debugLog(`Recebidos ${options.length} resultados`);
      setLocalOptions(options);
    } catch (error) {
      debugLog('Erro ao buscar opções', error);
      setLocalOptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar item específico por ID
  const fetchById = async (id: string) => {
    if (!apiEndpoint || !id) return null;
    
    try {
      setIsLoading(true);
      const server = import.meta.env.VITE_API_SERVER || "";
      const port = import.meta.env.VITE_API_PORT || "";
      const baseUrl = server && port ? `${server}:${port}/` : "/";
      
      const url = `${baseUrl}${apiEndpoint}/${id}`;
      debugLog(`Buscando item por ID: ${url}`);
      
      const response = await axios.get(url);
      
      if (response.data && response.data[idField]) {
        debugLog(`Item encontrado: ${response.data.descricao}`);
        return response.data;
      }
      
      debugLog(`Item com ID ${id} não encontrado`);
      return null;
    } catch (error) {
      debugLog(`Erro ao buscar por ID: ${id}`, error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Filtra opções locais baseado no termo de pesquisa
  const filteredOptions = localOptions.filter(option => 
    option.descricao.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Carregar opção selecionada se houver um valor - com verificação de edição manual
  useEffect(() => {
    // Pular este efeito se o usuário estiver digitando manualmente
    if (isManuallyEditing) {
      return;
    }
    
    const loadSelectedOption = async () => {
      if (value) {
        // Primeiro tentar encontrar nas opções locais
        const foundOption = localOptions.find(opt => String(opt[idField]) === String(value));
        
        if (foundOption) {
          debugLog(`Opção encontrada localmente: ${foundOption.descricao}`);
          setSelectedOption(foundOption);
          setSearchQuery(foundOption.descricao);
        } else if (apiEndpoint) {
          // Se não encontrou localmente, buscar na API
          debugLog(`Buscando opção por ID na API: ${value}`);
          const option = await fetchById(value);
          
          if (option) {
            setSelectedOption(option);
            setSearchQuery(option.descricao);
          } else {
            // Se falhou também na API, limpar seleção
            setSelectedOption(null);
            setSearchQuery("");
          }
        }
      } else if (value === "") {
        // Limpar seleção quando o valor é explicitamente vazio
        setSelectedOption(null);
        setSearchQuery("");
      }
    };
    
    loadSelectedOption();
  }, [value, localOptions, apiEndpoint, idField, isManuallyEditing]);

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
        
        // Quando fechar o dropdown sem selecionar, resetar para o valor anterior se necessário
        if (isManuallyEditing && selectedOption) {
          setSearchQuery(selectedOption.descricao);
          setIsManuallyEditing(false);
        } else if (isManuallyEditing && !selectedOption) {
          setSearchQuery("");
          setIsManuallyEditing(false);
        }
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen, isManuallyEditing, selectedOption]);

  // Atualiza a posição do dropdown quando aberto
  useEffect(() => {
    if (isDropdownOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
      
      // Carregar opções quando o dropdown é aberto
      if (name === "municipio") {
        // Para municípios, precisamos do valor do estado
        if (parentValue && localOptions.length === 0) {
          fetchMunicipiosByEstado(parentValue);
        }
      } else {
        // Para estados e outros, buscamos todos
        if (localOptions.length === 0) {
          fetchOptions(searchQuery);
        }
      }
    }
  }, [isDropdownOpen, name, parentValue, localOptions.length]);
  
  // Pesquisa por texto com debounce
  useEffect(() => {
    if (isDropdownOpen && searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        if (name === "municipio" && parentValue) {
          // Para municípios, filtramos localmente as opções já carregadas
          // Não precisamos fazer outra chamada API
        } else {
          // Para estados, fazemos uma busca por termo
          fetchOptions(searchQuery);
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [searchQuery, isDropdownOpen, name, parentValue]);
  
  // Restaurar a posição de scroll ao abrir o dropdown
  useEffect(() => {
    if (isDropdownOpen) {
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
    
    // Quando o usuário começa a digitar, entramos no modo de edição manual
    if (!isManuallyEditing) {
      setIsManuallyEditing(true);
      // Se tínhamos uma seleção antes e agora estamos digitando, remover a seleção
      if (selectedOption) {
        // Informar ao componente pai que o valor foi limpo
        onChange("");
        setSelectedOption(null);
      }
    }
    
    setSearchQuery(query);
  };

  const handleOptionSelect = (option: LocationOption) => {
    // Salvar posição de scroll atual
    const scrollPosition = {
      x: window.scrollX,
      y: window.scrollY
    };
    
    debugLog(`Opção selecionada: ${option.descricao} (${option[idField]})`);
    
    setSelectedOption(option);
    setSearchQuery(option.descricao);
    setIsManuallyEditing(false); // Sair do modo de edição manual
    onChange(option[idField].toString());
    setIsDropdownOpen(false);
    
    // Pequeno timeout para garantir que o scroll seja restaurado após fechar o dropdown
    setTimeout(() => {
      window.scrollTo(scrollPosition.x, scrollPosition.y);
    }, 10);
  };

  const handleClear = () => {
    debugLog('Seleção limpa');
    setSearchQuery("");
    setSelectedOption(null);
    setIsManuallyEditing(false); // Sair do modo de edição manual
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
          onClick={handleFocus}
          disabled={disabled}
          readOnly={!filterEnabled} // Se a filtragem estiver desativada, o input é somente leitura
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      {selectedOption && (
        <div className="mt-2 flex items-center">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
            {selectedOption.descricao}
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

export default LocationInput;