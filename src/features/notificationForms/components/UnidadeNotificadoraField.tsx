import React, { useState, useRef, useEffect, useMemo } from "react";
import axios from "axios";
import { Search, X } from "lucide-react";
import { createPortal } from "react-dom";

interface Estabelecimento {
  idestabelecimento: number;
  nome: string;
  cidade?: string;
  bairro?: string;
  cnes?: string;
}

interface UnidadeNotificadoraFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

const UnidadeNotificadoraField: React.FC<UnidadeNotificadoraFieldProps> = ({
  value,
  onChange,
  label = "Unidade Notificadora",
  placeholder = "Buscar unidade notificadora...",
  className = ""
}) => {
  const [unidadesNotificadoras, setUnidadesNotificadoras] = useState<Estabelecimento[]>([]);
  const [loadingUnidades, setLoadingUnidades] = useState(false);
  const [errorUnidades, setErrorUnidades] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedEstabelecimento, setSelectedEstabelecimento] = useState<Estabelecimento | null>(null);
  const [isManuallyEditing, setIsManuallyEditing] = useState<boolean>(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  
  // Salvar a posição de scroll atual
  const scrollPositionRef = useRef({ x: 0, y: 0 });
  
  // Add a cache for storing previous search results
  const estabelecimentosCache = useRef<Record<string, Estabelecimento[]>>({});
  // Track if initial load happened
  const initialLoadDone = useRef<boolean>(false);
  
  // Função para lidar com erros de CORS ou conectividade
  const handleApiError = (error: any) => {
    console.error("Erro na chamada da API:", error);
    let errorMessage = "Erro ao conectar com o servidor";
    
    if (error.message && error.message.includes("Network Error")) {
      errorMessage = "Erro de conexão com o servidor. Verifique se o backend está rodando.";
    } else if (error.message && error.message.includes("CORS")) {
      errorMessage = "Erro de CORS. Verifique a configuração de CORS no servidor.";
    } else if (error.response) {
      errorMessage = `Erro ${error.response.status}: ${error.response.statusText}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
    }
    
    setErrorUnidades(errorMessage);
    setUnidadesNotificadoras([]);
    setLoadingUnidades(false);
  };

  // Função para buscar as unidades notificadoras do backend - with caching
  const fetchUnidadesNotificadoras = async (searchTerm = "") => {
    try {
      setLoadingUnidades(true);
      setErrorUnidades(null);
      
      // Check cache first
      const cacheKey = searchTerm || "_all_";
      if (estabelecimentosCache.current[cacheKey]) {
        console.log(`Using cached establishments for "${cacheKey}"`);
        setUnidadesNotificadoras(estabelecimentosCache.current[cacheKey]);
        setLoadingUnidades(false);
        return;
      }
      
      // Handle minimum search length
      if (searchTerm && searchTerm.length < 3) {
        // For 1-2 characters, use client-side filtering on the full dataset
        if (estabelecimentosCache.current["_all_"]) {
          const filtered = estabelecimentosCache.current["_all_"].filter(item => 
            item.nome.toLowerCase().includes(searchTerm.toLowerCase())
          );
          setUnidadesNotificadoras(filtered);
          setLoadingUnidades(false);
          return;
        } else if (!initialLoadDone.current) {
          // If we haven't loaded all data yet, do it now
          searchTerm = "";
        } else {
          // Otherwise show a message about minimum chars
          setErrorUnidades("Digite pelo menos 3 caracteres para pesquisar");
          setUnidadesNotificadoras([]);
          setLoadingUnidades(false);
          return;
        }
      }
      
      // Preparar parâmetros para a API
      const params: any = {
        limit: 10000, // Buscar todas as unidades disponíveis
        orderBy: 'nome',
        orderDir: 'asc',
        ativo: 'S'
      };
      
      // Se houver um termo de busca, adicionar aos parâmetros
      if (searchTerm) {
        params.search = searchTerm;
        params.searchField = 'nome';
      }
      
      console.log('Buscando estabelecimentos com params:', params);
      
      // URL completa da API - AJUSTE PARA SEU AMBIENTE
      const apiUrl = 'https://marcioreis.uk:5544/api/estabelecimentos';
      
      try {
        // Fazer a requisição à API com a URL completa
        const response = await axios.get(apiUrl, { 
          params,
          headers: {
            'Accept': 'application/json'
          }
        });
        
        console.log('Resposta da API de estabelecimentos:', response);
        
        let estabelecimentosAtivos: Estabelecimento[] = [];
        
        // A resposta do backend tem formato { data: [...], pagination: {...} }
        if (response && response.data && response.data.data) {
          // Adicional filtro no cliente para garantir apenas estabelecimentos ativos
          estabelecimentosAtivos = response.data.data.filter((est: any) => 
            est.ativo === 'S'
          );
        } else if (response && response.data && Array.isArray(response.data)) {
          // Caso a API retorne diretamente um array (sem o wrapper data)
          estabelecimentosAtivos = response.data.filter((est: any) => 
            est.ativo === 'S'
          );
        } else {
          console.warn('Formato de resposta inesperado:', response);
          estabelecimentosAtivos = [];
        }
        
        // Store in cache
        estabelecimentosCache.current[cacheKey] = estabelecimentosAtivos;
        if (!searchTerm) {
          initialLoadDone.current = true;
        }
        
        setUnidadesNotificadoras(estabelecimentosAtivos);
        console.log(`Encontrados ${estabelecimentosAtivos.length} estabelecimentos ativos`);
        
      } catch (apiError: any) {
        // Handle 400 error case specifically
        if (apiError.response && apiError.response.status === 400) {
          setErrorUnidades("Digite pelo menos 3 caracteres para pesquisar");
        } else {
          // Other error handling
          handleApiError(apiError);
        }
        return;
      }
      
      setLoadingUnidades(false);
    } catch (error: any) {
      console.error("Erro ao buscar unidades notificadoras:", error);
      if (error.response) {
        console.error("Detalhes da resposta de erro:", {
          status: error.response.status,
          data: error.response.data
        });
      }
      setErrorUnidades(error.message || "Erro ao carregar unidades");
      setLoadingUnidades(false);
      // Garantir que unidadesNotificadoras seja um array vazio em caso de erro
      setUnidadesNotificadoras([]);
    }
  };

  // Função para buscar estabelecimento por ID
  const fetchEstabelecimentoById = async (id: string) => {
    if (!id) return;
    
    try {
      setLoadingUnidades(true);
      const apiUrl = `https://marcioreis.uk:5544/api/estabelecimentos/${id}`;
      
      const response = await axios.get(apiUrl);
      
      if (response.data && response.data.idestabelecimento) {
        setSelectedEstabelecimento(response.data);
        setDisplayValue(response.data.nome);
      } else {
        setSelectedEstabelecimento(null);
        setDisplayValue("");
      }
    } catch (error) {
      console.error('Erro ao buscar estabelecimento por ID:', error);
      setSelectedEstabelecimento(null);
      setDisplayValue("");
    } finally {
      setLoadingUnidades(false);
    }
  };
  
  // Carregar unidades iniciais ao montar o componente
  useEffect(() => {
    // Não precisamos carregar unidades iniciais até o usuário interagir
    // fetchUnidadesNotificadoras("");
  }, []);

  // Processar o valor inicial, se houver
  useEffect(() => {
    if (!isManuallyEditing && value) {
      fetchEstabelecimentoById(value);
    } else if (!isManuallyEditing && !value) {
      setSelectedEstabelecimento(null);
      setDisplayValue("");
    }
  }, [value, isManuallyEditing]);

  // Atualizar a posição do dropdown quando aberto
  useEffect(() => {
    if (isDropdownOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
      
      // Buscar dados quando o dropdown é aberto
      if (unidadesNotificadoras.length === 0) {
        fetchUnidadesNotificadoras(searchQuery);
      }
    }
  }, [isDropdownOpen]);
  
  // Optimize debounce for search
  useEffect(() => {
    if (isDropdownOpen) {
      const timer = setTimeout(() => {
        fetchUnidadesNotificadoras(searchQuery);
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
        if (isManuallyEditing && selectedEstabelecimento) {
          setSearchQuery("");
          setIsManuallyEditing(false);
        } else if (isManuallyEditing && !selectedEstabelecimento) {
          setSearchQuery("");
          setIsManuallyEditing(false);
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
  }, [isDropdownOpen, isManuallyEditing, selectedEstabelecimento]);

  const handleFocus = () => {
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
  
  // Update the handle input change function to fetch immediately when clearing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    
    // When user starts typing, enter manual editing mode
    if (!isManuallyEditing) {
      setIsManuallyEditing(true);
      // If we had a selection before and now we're typing, remove the selection
      if (selectedEstabelecimento) {
        // Inform parent component that the value was cleared
        onChange("");
        setSelectedEstabelecimento(null);
      }
    }
    
    setSearchQuery(query);
    
    // When clearing the search field, immediately refresh results
    if (query === "" && isDropdownOpen) {
      fetchUnidadesNotificadoras("");
    }
  };

  const handleEstabelecimentoSelect = (estabelecimento: Estabelecimento) => {
    // Salvar posição de scroll atual
    const scrollPosition = {
      x: window.scrollX,
      y: window.scrollY
    };
    
    setSelectedEstabelecimento(estabelecimento);
    setDisplayValue(estabelecimento.nome);
    setSearchQuery("");
    setIsManuallyEditing(false); // Sair do modo de edição manual
    onChange(estabelecimento.idestabelecimento.toString());
    setIsDropdownOpen(false);
    
    // Pequeno timeout para garantir que o scroll seja restaurado após fechar o dropdown
    setTimeout(() => {
      window.scrollTo(scrollPosition.x, scrollPosition.y);
    }, 10);
  };

  const handleClear = () => {
    setDisplayValue("");
    setSearchQuery("");
    setSelectedEstabelecimento(null);
    setIsManuallyEditing(false); // Sair do modo de edição manual
    onChange(""); // Garante que retorna uma string vazia
  };
  
  const handleSearchButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar propagação
    
    // Salvar posição atual de scroll
    scrollPositionRef.current = {
      x: window.scrollX,
      y: window.scrollY
    };
    
    setIsDropdownOpen(true);
    fetchUnidadesNotificadoras("");
  };

  // Pre-filter results on the client side for better performance
  const filteredUnidades = useMemo(() => {
    if (searchQuery.length > 0 && searchQuery.length < 3) {
      return unidadesNotificadoras.filter(est => 
        est.nome.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Only apply client-side filtering for queries of less than 3 characters
    if (searchQuery.length < 3) {
      return unidadesNotificadoras;
    }
    
    // For 3+ characters, the server already filtered the results
    return unidadesNotificadoras;
  }, [unidadesNotificadoras, searchQuery]);
  
  // Renderiza o dropdown em um portal fora da hierarquia DOM - using filteredUnidades
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
          width: `${inputRef.current ? inputRef.current.offsetWidth + 64 : 354}px`, // Adicionar largura do botão
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
            placeholder="Filtrar unidades..."
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
          {loadingUnidades ? (
            <div className="px-4 py-2 text-sm text-gray-500 text-center">
              Carregando...
            </div>
          ) : errorUnidades ? (
            <div className="px-4 py-2 text-sm text-red-500">
              {errorUnidades}
              {errorUnidades !== "Digite pelo menos 3 caracteres para pesquisar" && (
                <button 
                  onClick={() => fetchUnidadesNotificadoras("")} 
                  className="ml-2 text-blue-500 underline"
                >
                  Tentar novamente
                </button>
              )}
            </div>
          ) : filteredUnidades.length > 0 ? (
            <>
              <div className="px-4 py-1 text-xs text-gray-400">
                {filteredUnidades.length} unidades encontradas
                {unidadesNotificadoras.length > filteredUnidades.length ? 
                  ` (filtradas de ${unidadesNotificadoras.length})` : ''}
              </div>
              {filteredUnidades.map((estabelecimento) => (
                <button
                  key={estabelecimento.idestabelecimento}
                  type="button"
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 ${
                    selectedEstabelecimento?.idestabelecimento === estabelecimento.idestabelecimento 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700'
                  }`}
                  onClick={() => handleEstabelecimentoSelect(estabelecimento)}
                >
                  <div className="font-medium">{estabelecimento.nome}</div>
                  {estabelecimento.cidade && (
                    <div className="text-xs text-gray-500">
                      {estabelecimento.cidade}{estabelecimento.bairro ? `, ${estabelecimento.bairro}` : ''}
                      {estabelecimento.cnes ? ` - CNES: ${estabelecimento.cnes}` : ''}
                    </div>
                  )}
                </button>
              ))}
            </>
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">
              {searchQuery.length > 0 ? 'Nenhuma unidade encontrada com este termo' : 'Nenhuma unidade disponível'}
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
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            className={`w-full p-3 pl-9 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none ${className}`}
            value={displayValue}
            readOnly={true}
            onFocus={handleFocus}
            onClick={handleFocus}
            disabled={loadingUnidades && !isDropdownOpen}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          {displayValue && (
            <button 
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 focus:outline-none"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleSearchButtonClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          disabled={loadingUnidades && !isDropdownOpen}
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* Renderiza o dropdown usando portal */}
      {renderDropdown()}
    </div>
  );
};

export default UnidadeNotificadoraField;