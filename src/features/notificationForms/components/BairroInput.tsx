import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import axios from 'axios';
import indexedDBService from '@/services/indexedDB'; // Import do IndexedDB

// Função para remover acentos e converter para maiúsculas
function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reference para AbortController das requisições API
  const abortControllerRef = useRef<AbortController | null>(null);

  // Armazena posição de scroll para posicionar dropdown corretamente
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });

  const debugLog = (message: string, data?: any) => {
    if (debug) {
      if (data) {
        console.log(`[BairroInput] ${message}`, data);
      } else {
        console.log(`[BairroInput] ${message}`);
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // 1. Função para carregar bairros → usa IndexedDB quando offline
  // ─────────────────────────────────────────────────────────────────
  const fetchBairros = async (query = "") => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setIsLoading(true);
    debugLog(`Buscando bairros${query ? ` com filtro: "${query}"` : ''}`);

    const estaOffline = !navigator.onLine;

    if (estaOffline) {
      debugLog("Modo offline: buscando bairros no cache...");
      const todosBairros: Bairro[] = (await indexedDBService.getOpcoes('bairros')) || [];
      let filtrados = todosBairros;
      if (query && query.length >= 3) {
        const normalizedSearch = normalizeText(query);
        filtrados = todosBairros.filter(bairro =>
          bairro.descricao.includes(normalizedSearch)
        );
      }
      setOptions(sortAndNormalize(filtrados));
      setIsLoading(false);
      return;
    }

    try {
      const server = import.meta.env.VITE_API_SERVER || "";
      const port = import.meta.env.VITE_API_PORT || "";
      const baseUrl = server && port ? `${server}:${port}/` : "/";

      let url = `${baseUrl}api/tipo-bairro?limit=100`;
      if (query && query.length >= 3) {
        const normalizedQuery = normalizeText(query);
        url = `${baseUrl}api/tipo-bairro/search?descricao=${encodeURIComponent(normalizedQuery)}&limit=100`;
      }

      debugLog(`Requisição à API: ${url}`);
      const response = await axios.get(url, { signal });

      let bairrosAPI: Bairro[] = [];
      if (response.data && Array.isArray(response.data)) {
        bairrosAPI = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        bairrosAPI = response.data.data;
      }

      const normalizedBairros = sortAndNormalize(bairrosAPI);
      await indexedDBService.saveOpcoes('bairros', normalizedBairros);

      debugLog(`Recebidos ${normalizedBairros.length} bairros da API, salvos no cache`);
      setOptions(normalizedBairros);
    } catch (error: any) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        debugLog("Requisição cancelada");
        return;
      }
      debugLog("Erro na API, tentando fallback no cache", error);
      const todosBairros: Bairro[] = (await indexedDBService.getOpcoes('bairros')) || [];
      setOptions(sortAndNormalize(todosBairros));
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // 2. Função auxiliar para ordenação e normalização de texto
  // ─────────────────────────────────────────────────────────────────
  function sortAndNormalize(arr: Bairro[]): Bairro[] {
    const normalized = arr.map(bairro => ({
      ...bairro,
      descricao: normalizeText(bairro.descricao)
    }));
    return normalized.sort((a, b) =>
      a.descricao.localeCompare(b.descricao, 'pt-BR')
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // 3. Busca de um único bairro por ID → tenta cache primeiro, depois API
  // ─────────────────────────────────────────────────────────────────
  const fetchBairroById = async (id: string): Promise<Bairro | null> => {
    setIsLoading(true);
    debugLog(`Buscando bairro por ID: ${id} (cache primeiro)`);

    const todosBairros: Bairro[] = (await indexedDBService.getOpcoes('bairros')) || [];
    const encontradoCache = todosBairros.find(b => b.idtipo_bairro.toString() === id);
    if (encontradoCache) {
      debugLog(`Encontrado no cache: ${encontradoCache.descricao}`);
      setIsLoading(false);
      return encontradoCache;
    }

    if (!navigator.onLine) {
      setIsLoading(false);
      return null;
    }

    try {
      const server = import.meta.env.VITE_API_SERVER || "";
      const port = import.meta.env.VITE_API_PORT || "";
      const baseUrl = server && port ? `${server}:${port}/` : "/";
      const url = `${baseUrl}api/tipo-bairro/${id}`;

      debugLog(`Requisição API por ID: ${url}`);
      const response = await axios.get(url);

      if (response.data?.idtipo_bairro) {
        const normalizado: Bairro = {
          ...response.data,
          descricao: normalizeText(response.data.descricao)
        };
        const jaTemCache = (await indexedDBService.getOpcoes('bairros')) || [];
        await indexedDBService.saveOpcoes(
          'bairros',
          [...jaTemCache, normalizado].sort((a, b) =>
            a.descricao.localeCompare(b.descricao, 'pt-BR')
          )
        );
        setIsLoading(false);
        return normalizado;
      }
      setIsLoading(false);
      return null;
    } catch (error) {
      debugLog(`Erro API ao buscar bairro por ID: ${id}`, error);
      setIsLoading(false);
      return null;
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // 4. Popula `options` e seleciona valor existente (on mount / value change)
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadSelectedOption = async () => {
      if (value) {
        const foundOption = options.find(opt => opt.idtipo_bairro.toString() === value);
        if (foundOption) {
          debugLog(`Opção encontrada localmente (options): ${foundOption.descricao}`);
          setSelectedOption(foundOption);
          setDisplayValue(foundOption.descricao);
          return;
        }
        debugLog(`Buscando bairro por ID porque não estava em options: ${value}`);
        const option = await fetchBairroById(value);
        if (option) {
          setSelectedOption(option);
          setDisplayValue(option.descricao);
        } else {
          setSelectedOption(null);
          setDisplayValue("");
        }
      } else if (value === "") {
        setSelectedOption(null);
        setDisplayValue("");
      }
    };
    loadSelectedOption();
  }, [value, options]);

  // ─────────────────────────────────────────────────────────────────
  // 5. Fecha dropdown quando clica fora
  // ─────────────────────────────────────────────────────────────────
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
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const closeDropdown = () => {
    setIsDropdownOpen(false);
    setSearchQuery("");
  };

  // ─────────────────────────────────────────────────────────────────
  // 6. Quando abre o dropdown, inicia carregamento (Offline → API)
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isDropdownOpen) {
      updateDropdownPosition();
      fetchBairros("");

      window.addEventListener('resize', updateDropdownPosition);
      window.addEventListener('scroll', updateDropdownPosition);
      return () => {
        window.removeEventListener('resize', updateDropdownPosition);
        window.removeEventListener('scroll', updateDropdownPosition);
      };
    }
  }, [isDropdownOpen]);

  // ─────────────────────────────────────────────────────────────────
  // 7. Debounce para pesquisa: só pesquisa quando ≥ 3 caracteres
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isDropdownOpen && searchQuery.length >= 3) {
      const timer = setTimeout(() => {
        fetchBairros(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, isDropdownOpen]);

  // ─────────────────────────────────────────────────────────────────
  // 8. Cancela requisição pendente ao desmontar componente
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // 9. Manipuladores de UI
  // ─────────────────────────────────────────────────────────────────
  const handleFocus = () => {
    if (disabled) return;
    setScrollPosition({
      x: window.scrollX,
      y: window.scrollY
    });
    setSearchQuery("");
    setIsDropdownOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleOptionSelect = (option: Bairro) => {
    debugLog(`Opção selecionada: ${option.descricao} (${option.idtipo_bairro})`);
    setSelectedOption(option);
    setDisplayValue(option.descricao);
    setSearchQuery("");
    onChange(option.idtipo_bairro.toString());
    setIsDropdownOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    debugLog('Seleção limpa');
    setDisplayValue("");
    setSearchQuery("");
    setSelectedOption(null);
    onChange("");
  };

  // ─────────────────────────────────────────────────────────────────
  // 10. Posiciona o dropdown (considerando mobile/desktop)
  // ─────────────────────────────────────────────────────────────────
  const updateDropdownPosition = () => {
    if (!inputRef.current || !dropdownRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const isMobile = viewportWidth <= 768;

    if (isMobile) {
      const spaceBelow = viewportHeight - rect.bottom;
      const maxDropdownHeight = Math.min(300, viewportHeight * 0.6);
      const leftPosition = Math.max(0, rect.left);
      const adjustedWidth = Math.min(rect.width, viewportWidth - leftPosition);

      if (spaceBelow < 150 && rect.top > 150) {
        dropdownRef.current.style.setProperty('bottom', `${viewportHeight - rect.top}px`);
        dropdownRef.current.style.setProperty('top', 'auto');
        dropdownRef.current.style.setProperty('max-height', `${Math.min(rect.top - 10, maxDropdownHeight)}px`);
      } else {
        dropdownRef.current.style.setProperty('top', `${rect.bottom}px`);
        dropdownRef.current.style.setProperty('bottom', 'auto');
        dropdownRef.current.style.setProperty('max-height', `${Math.min(spaceBelow - 10, maxDropdownHeight)}px`);
      }

      dropdownRef.current.style.setProperty('left', `${leftPosition}px`);
      dropdownRef.current.style.setProperty('width', `${adjustedWidth}px`);
      dropdownRef.current.style.setProperty('position', 'fixed');
      dropdownRef.current.style.setProperty('z-index', '9999');
      dropdownRef.current.style.setProperty('transition', 'opacity 0.2s, transform 0.2s');
      dropdownRef.current.style.setProperty('opacity', '1');
      dropdownRef.current.style.setProperty('transform', 'translateY(0)');
    } else {
      dropdownRef.current.style.setProperty('position', 'absolute');
      dropdownRef.current.style.setProperty('top', `${rect.bottom + window.scrollY}px`);
      dropdownRef.current.style.setProperty('left', `${rect.left + window.scrollX}px`);
      dropdownRef.current.style.setProperty('width', `${rect.width}px`);
      dropdownRef.current.style.setProperty('max-height', '300px');
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // 11. Filtra opções em memória (já normalizadas) conforme o termo
  // ─────────────────────────────────────────────────────────────────
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    const normalizedSearch = normalizeText(searchQuery);
    return options.filter(option => option.descricao.includes(normalizedSearch));
  }, [options, searchQuery]);

  // ─────────────────────────────────────────────────────────────────
  // 12. Renderiza o dropdown em portal
  // ─────────────────────────────────────────────────────────────────
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
              placeholder="Filtrar bairros..."
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
                type="button"
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
                    selectedOption?.idtipo_bairro === option.idtipo_bairro 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700'
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
        <div className="p-2 border-t border-gray-100 sticky bottom-0 bg-white">
          <button
            className="w-full py-2 text-sm text-center bg-gray-100 hover:bg-gray-200 rounded-md"
            onClick={closeDropdown}
            type="button"
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
          name="bairro"
          placeholder={isLoading ? "Carregando..." : placeholder}
          className={`
            w-full p-3 pl-3 pr-10 border border-gray-200 rounded-lg text-sm
            bg-white transition-colors hover:border-blue-400 focus:border-blue-500
            focus:ring-2 focus:ring-blue-200 outline-none
            ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}
          `}
          value={displayValue}
          readOnly={true}
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
      
      {/* Render dropdown usando portal */}
      {renderDropdown()}
    </div>
  );
};

export default BairroInput;
