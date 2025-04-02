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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Salvar a posição de scroll atual
  const scrollPositionRef = useRef({ x: 0, y: 0 });

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
      
      // Check cache first
      const cacheKey = normalizedSearchTerm || "_all_";
      if (cboCache.current[cacheKey]) {
        console.log(`Using cached data for "${cacheKey}"`);
        setCbos(cboCache.current[cacheKey]);
        setIsLoading(false);
        return;
      }
      
      const server = import.meta.env.VITE_API_SERVER;
      const port = import.meta.env.VITE_API_PORT;
      
      // Handle minimum search length to prevent 400 errors
      if (normalizedSearchTerm && normalizedSearchTerm.length < 3) {
        // For 1-2 characters, use client-side filtering on the full dataset instead
        if (cboCache.current["_all_"]) {
          const filtered = cboCache.current["_all_"].filter(item => 
            normalizeText(item.descricao).includes(normalizedSearchTerm)
          );
          setCbos(filtered);
          setIsLoading(false);
          return;
        } else if (!initialLoadDone.current) {
          // If we haven't loaded all data yet, do it now
          searchTerm = "";
        } else {
          // Otherwise show a message that more characters are needed
          setErrorMessage("Digite pelo menos 3 caracteres para pesquisar");
          setCbos([]);
          setIsLoading(false);
          return;
        }
      }
      
      // Usar o endpoint correto com base na presença do termo de busca
      const endpoint = normalizedSearchTerm 
        ? `${server}:${port}/api/tipo-cbo/search?descricao=${encodeURIComponent(normalizedSearchTerm)}&limit=10000` 
        : `${server}:${port}/api/tipo-cbo?limit=10000`;
      
      const response = await axios.get(endpoint);
      
      // Processar a resposta de acordo com a estrutura da API
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        const data = response.data.data;
        // Normalizar todos os dados recebidos
        const normalizedData = normalizeCbos(data);
        // Store in cache
        cboCache.current[cacheKey] = normalizedData;
        if (!normalizedSearchTerm) {
          initialLoadDone.current = true;
        }
        
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
        setIsDropdownOpen(false);
        
        // Quando fechar o dropdown sem selecionar, resetar para o valor anterior se necessário
        if (isManuallyEditing && selectedCbo) {
          setSearchQuery("");
          setIsManuallyEditing(false);
        } else if (isManuallyEditing && !selectedCbo) {
          setSearchQuery("");
          setIsManuallyEditing(false);
        }
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen, isManuallyEditing, selectedCbo]);

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
    if (isDropdownOpen) {
      // Use a shorter delay for better responsiveness
      const timer = setTimeout(() => {
        fetchCbos(searchQuery);
      }, searchQuery.length < 3 ? 0 : 300); // No delay for short queries
      
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
    
    // Limpar a consulta de pesquisa ao focar
    setSearchQuery("");
    
    // Abrir dropdown
    setIsDropdownOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    
    // Quando o usuário começa a digitar, entrar no modo de edição manual
    if (!isManuallyEditing) {
      setIsManuallyEditing(true);
      // Se tínhamos uma seleção antes e agora estamos digitando, remover a seleção
      if (selectedCbo) {
        // Informar o componente pai que o valor foi limpo
        onChange("");
        setSelectedCbo(null);
      }
    }
    
    setSearchQuery(query);
    
    // Quando limpar o campo de pesquisa, atualizar os resultados imediatamente
    if (query === "" && isDropdownOpen) {
      fetchCbos("");
    }
  };

  const handleCboSelect = (cbo: TipoCboOption) => {
    // Salvar posição de scroll atual
    const scrollPosition = {
      x: window.scrollX,
      y: window.scrollY
    };
    
    setSelectedCbo(cbo);
    setDisplayValue(cbo.descricao);
    setSearchQuery("");
    setIsManuallyEditing(false); // Sair do modo de edição manual
    onChange(cbo.idtipo_cbo.toString());
    setIsDropdownOpen(false);
    
    // Pequeno timeout para garantir que o scroll seja restaurado após fechar o dropdown
    setTimeout(() => {
      window.scrollTo(scrollPosition.x, scrollPosition.y);
    }, 10);
  };

  const handleClear = () => {
    setDisplayValue("");
    setSearchQuery("");
    setSelectedCbo(null);
    setIsManuallyEditing(false); // Sair do modo de edição manual
    onChange(""); // Garante que retorna uma string vazia
  };

  // Pre-filter results on the client for better performance
  const filteredCbos = useMemo(() => {
    if (searchQuery.length > 0 && searchQuery.length < 3) {
      const normalizedSearch = normalizeText(searchQuery);
      return cbos.filter(cbo => 
        normalizeText(cbo.descricao).includes(normalizedSearch)
      );
    }
    return cbos;
  }, [cbos, searchQuery]);

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
            placeholder="Filtrar profissoes..."
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
          ) : errorMessage ? (
            <div className="px-4 py-2 text-sm text-red-500">
              {errorMessage}
              {errorMessage !== "Digite pelo menos 3 caracteres para pesquisar" && (
                <button 
                  onClick={() => fetchCbos("")} 
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
              {searchQuery.length > 0 ? 'Nenhuma profissao encontrada' : 'Digite para buscar profissoes'}
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

      {/* Renderiza o dropdown usando portal */}
      {renderDropdown()}
    </div>
  );
};

export default CboInput;