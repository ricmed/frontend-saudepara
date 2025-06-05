import React, { useState, useRef, useEffect, useMemo } from "react";
import axios from "axios";
import { Search, X, AlertCircle } from "lucide-react";
import { createPortal } from "react-dom";
import indexedDBService from '@/services/indexedDB';

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
  isForEncaminhamento?: boolean; // Para diferenciar entre unidade notificadora e encaminhamento
  specificEstablishments?: string[]; // Nova prop para filtrar estabelecimentos específicos
  hasError?: boolean; // Nova prop para indicar erro
  errorMessage?: string; // Nova prop para mensagem de erro personalizada
}

const UnidadeNotificadoraField: React.FC<UnidadeNotificadoraFieldProps> = ({
  value,
  onChange,
  label = "Unidade Notificadora",
  placeholder = "Buscar unidade notificadora...",
  className = "",
  isForEncaminhamento = false,
  specificEstablishments = [], // Inicializa como array vazio
  hasError = false, // Valor padrão
  errorMessage = isForEncaminhamento ? 
    "O local de encaminhamento é obrigatório" : 
    "O campo estabelecimento é obrigatório" // Mensagem padrão
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
  
  // Usar um estado para posição em vez de ref para forçar re-render
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  
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
    setLoadingUnidades(false);
  };
  // Função para buscar as unidades notificadoras do backend - with caching
  const fetchUnidadesNotificadoras = async (searchTerm = "") => {
    try {
      setLoadingUnidades(true);
      setErrorUnidades(null);
      
      // Exigir sempre 3+ caracteres para pesquisar - modificação principal
      if (searchTerm.length < 3) {
        if (searchTerm.length > 0) {
          setErrorUnidades("Digite pelo menos 3 caracteres para pesquisar");
        } else {
          setErrorUnidades("Digite pelo menos 3 caracteres para ver as unidades");
        }
        
        // Limpar os resultados se não tiver caracteres suficientes
        setUnidadesNotificadoras([]);
        setLoadingUnidades(false);
        return;
      }
      
      // Check cache first
      const cacheKey = searchTerm;
      if (estabelecimentosCache.current[cacheKey]) {
        console.log(`Using cached establishments for "${cacheKey}"`);
        let cachedEstabelecimentos = estabelecimentosCache.current[cacheKey];
        
        // Se temos estabelecimentos específicos, filtrá-los do cache
        if (specificEstablishments && specificEstablishments.length > 0) {
          cachedEstabelecimentos = cachedEstabelecimentos.filter(est => 
            specificEstablishments.some(name => 
              est.nome.toUpperCase().includes(name.toUpperCase())
            )
          );
          console.log(`Filtered to ${cachedEstabelecimentos.length} specific establishments`);
        }
        
        setUnidadesNotificadoras(cachedEstabelecimentos);
        setLoadingUnidades(false);
        return;
      }
      
      let estabelecimentosAtivos: Estabelecimento[] = [];

      // ✅ VERIFICAR CACHE OFFLINE PRIMEIRO
      if (!navigator.onLine) {
        console.log('📱 Modo offline: buscando estabelecimentos em cache...');
        
        const cachedEstabelecimentos = await indexedDBService.getOpcoes('estabelecimentos');
        
        if (cachedEstabelecimentos && cachedEstabelecimentos.length > 0) {
          // ✅ FILTRAR LOCALMENTE PELOS PARÂMETROS DE BUSCA
          estabelecimentosAtivos = cachedEstabelecimentos.filter((est: any) => {
            let matches = true;
            
            // Filtrar por busca de texto
            if (searchTerm) {
              const searchLower = searchTerm.toLowerCase();
              const nome = (est.nome || '').toLowerCase();
              matches = matches && nome.includes(searchLower);
            }
            
            // Filtrar por ativo
            matches = matches && est.ativo === 'S';
            
            return matches;
          });
          
          // ✅ ORDENAR LOCALMENTE
          estabelecimentosAtivos.sort((a: any, b: any) => {
            const aVal = (a.nome || '').toLowerCase();
            const bVal = (b.nome || '').toLowerCase();
            return aVal.localeCompare(bVal);
          });
          
          console.log(`✅ Estabelecimentos filtrados offline: ${estabelecimentosAtivos.length} registros`);
        } else {
          throw new Error('Nenhum estabelecimento encontrado offline. Baixe os dados primeiro.');
        }
      } else {
        // ✅ MODO ONLINE: usar API normal com fallback
        try {
          // Preparar parâmetros para a API
          const params: any = {
            limit: 11000, // Buscar todas as unidades disponíveis
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
          const apiUrl = 'https://app.hml.saude.pa.gov.br:443/api/estabelecimentos';
          
          // Fazer a requisição à API com a URL completa
          const response = await axios.get(apiUrl, { 
            params,
            headers: {
              'Accept': 'application/json'
            }
          });
          
          console.log('Resposta da API de estabelecimentos:', response);
          
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
          
          // ✅ SALVAR NO CACHE (só dados básicos, não busca específica)
          if (searchTerm.length <= 5) {
            const existingEstabelecimentos = await indexedDBService.getOpcoes('estabelecimentos') || [];
            const mergedEstabelecimentos = [...existingEstabelecimentos];
            
            estabelecimentosAtivos.forEach((newEst: any) => {
              if (!mergedEstabelecimentos.find((existing: any) => existing.idestabelecimento === newEst.idestabelecimento)) {
                mergedEstabelecimentos.push(newEst);
              }
            });
            
            await indexedDBService.saveOpcoes('estabelecimentos', mergedEstabelecimentos);
          }
          
        } catch (apiError: any) {
          console.warn('⚠️ API de estabelecimentos falhou, tentando cache...');
          
          const cachedEstabelecimentos = await indexedDBService.getOpcoes('estabelecimentos');
          if (cachedEstabelecimentos && cachedEstabelecimentos.length > 0) {
            estabelecimentosAtivos = cachedEstabelecimentos.filter((est: any) => {
              let matches = true;
              
              if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                matches = matches && (est.nome || '').toLowerCase().includes(searchLower);
              }
              
              matches = matches && est.ativo === 'S';
              return matches;
            });
            
            console.log(`✅ Usando cache offline: ${estabelecimentosAtivos.length} estabelecimentos`);
          } else {
            // Handle 400 error case specifically
            if (apiError.response && apiError.response.status === 400) {
              setErrorUnidades("Digite pelo menos 3 caracteres para pesquisar");
            } else {
              // Other error handling
              handleApiError(apiError);
            }
            return;
          }
        }
      }
      
      // Store all results in cache before filtering
      estabelecimentosCache.current[cacheKey] = estabelecimentosAtivos;
      
      // Filtrar por estabelecimentos específicos se fornecidos
      if (specificEstablishments && specificEstablishments.length > 0) {
        estabelecimentosAtivos = estabelecimentosAtivos.filter(est => 
          specificEstablishments.some(name => 
            est.nome.toUpperCase().includes(name.toUpperCase())
          )
        );
        console.log(`Filtered to ${estabelecimentosAtivos.length} specific establishments: ${specificEstablishments.join(', ')}`);
      }
      
      setUnidadesNotificadoras(estabelecimentosAtivos);
      console.log(`Encontrados ${estabelecimentosAtivos.length} estabelecimentos ativos`);
      
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
    }
  };

  // Função para buscar estabelecimento por ID
  const fetchEstabelecimentoById = async (id: string) => {
    if (!id) return;
    
    // Log the ID we're trying to fetch - this helps debug issues
    console.log(`Buscando estabelecimento ID: ${id} para ${isForEncaminhamento ? 'encaminhamento' : 'unidade notificadora'}`);
    
    try {
      setLoadingUnidades(true);
      const apiUrl = `https://app.trn.saude.pa.gov.br:443/api/estabelecimentos/${id}`;
      
      const response = await axios.get(apiUrl);
      
      if (response.data && response.data.idestabelecimento) {
        setSelectedEstabelecimento(response.data);
        setDisplayValue(response.data.nome);
        console.log(`Estabelecimento encontrado: ${response.data.nome} (ID: ${response.data.idestabelecimento})`);
      } else {
        console.log(`Estabelecimento não encontrado para ID: ${id}`);
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
  
  // Processar o valor inicial, se houver
  useEffect(() => {
    if (!isManuallyEditing && value) {
      fetchEstabelecimentoById(value);
    } else if (!isManuallyEditing && !value) {
      setSelectedEstabelecimento(null);
      setDisplayValue("");
    }
  }, [value, isManuallyEditing]);

  // Safely close dropdown and restore state
  const closeDropdown = () => {
    setIsDropdownOpen(false);
    
    // Quando fechar o dropdown sem selecionar, resetar para o valor anterior se necessário
    if (isManuallyEditing && selectedEstabelecimento) {
      setSearchQuery("");
      setIsManuallyEditing(false);
    } else if (isManuallyEditing && !selectedEstabelecimento) {
      setSearchQuery("");
      setIsManuallyEditing(false);
    }
  };

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
      // Pequeno timeout para evitar que o mesmo clique que abriu o dropdown o feche imediatamente
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);
    }
    
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen, isManuallyEditing, selectedEstabelecimento]);

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
      // Ajustar a largura para incluir o botão de pesquisa
      const totalWidth = inputRef.current.offsetWidth + 64; // Adicionar largura aproximada do botão
      const adjustedWidth = Math.min(totalWidth, viewportWidth - leftPosition);
      
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
      const totalWidth = inputRef.current.offsetWidth + 64; // Adicionar largura do botão
      
      dropdownRef.current.style.setProperty('position', 'absolute');
      dropdownRef.current.style.setProperty('top', `${rect.bottom + window.scrollY}px`);
      dropdownRef.current.style.setProperty('left', `${rect.left + window.scrollX}px`);
      dropdownRef.current.style.setProperty('width', `${totalWidth}px`);
      dropdownRef.current.style.setProperty('max-height', '300px');
    }
  };

  // Update dropdown position when it's opened or window is resized
  useEffect(() => {
    if (isDropdownOpen) {
      updateDropdownPosition();
      
      // Não buscar dados ao abrir o dropdown, apenas mostrar mensagem
      setErrorUnidades("Digite pelo menos 3 caracteres para ver as unidades");
      setUnidadesNotificadoras([]);
      
      // Track window resize
      window.addEventListener('resize', updateDropdownPosition);
      // Track scroll
      window.addEventListener('scroll', updateDropdownPosition);
      
      return () => {
        window.removeEventListener('resize', updateDropdownPosition);
        window.removeEventListener('scroll', updateDropdownPosition);
      };
    }
  }, [isDropdownOpen]);
  
  // Debounce for search - only search with 3+ characters
  useEffect(() => {
    if (isDropdownOpen && searchQuery.length >= 3) {
      const timer = setTimeout(() => {
        fetchUnidadesNotificadoras(searchQuery);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [searchQuery, isDropdownOpen]);

  const handleFocus = () => {
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
      if (selectedEstabelecimento) {
        // Inform parent component that the value was cleared
        onChange("");
        setSelectedEstabelecimento(null);
      }
    }
    
    setSearchQuery(query);
    
    // Show appropriate message based on query length
    if (query.length > 0 && query.length < 3) {
      setErrorUnidades("Digite pelo menos 3 caracteres para pesquisar");
      // Limpar a lista com menos de 3 caracteres
      setUnidadesNotificadoras([]);
    } else if (query.length >= 3 && isDropdownOpen) {
      // Only fetch new results when we have 3+ characters
      setErrorUnidades(null);
      fetchUnidadesNotificadoras(query);
    } else if (query.length === 0 && isDropdownOpen) {
      // Mensagem para campo vazio
      setErrorUnidades("Digite pelo menos 3 caracteres para ver as unidades");
      setUnidadesNotificadoras([]);
    }
  };

  const handleEstabelecimentoSelect = (estabelecimento: Estabelecimento) => {
    setSelectedEstabelecimento(estabelecimento);
    setDisplayValue(estabelecimento.nome);
    setSearchQuery("");
    setIsManuallyEditing(false); // Sair do modo de edição manual
    
    // Convert to string and log what we're sending back
    const idToSend = estabelecimento.idestabelecimento.toString();
    console.log(`Selecionado ${isForEncaminhamento ? 'encaminhamento' : 'unidade'}: ${estabelecimento.nome} (ID: ${idToSend})`);
    
    onChange(idToSend);
    closeDropdown();
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
    
    // Store current scroll position
    setScrollPosition({
      x: window.scrollX,
      y: window.scrollY
    });
    
    setIsDropdownOpen(true);
    // Não buscar dados automaticamente ao clicar no botão de pesquisa
    setErrorUnidades("Digite pelo menos 3 caracteres para ver as unidades");
    setUnidadesNotificadoras([]);
  };

  // Filter results client-side - modificado para exigir 3+ caracteres sempre
  const filteredUnidades = useMemo(() => {
    if (searchQuery.length < 3) {
      // Não mostrar nenhuma unidade com menos de 3 caracteres
      return [];
    } else {
      // Apenas mostrar resultados com 3+ caracteres
      return unidadesNotificadoras;
    }
  }, [unidadesNotificadoras, searchQuery]);
  
  // Renderiza o dropdown em um portal fora da hierarquia DOM - using filteredUnidades
  const renderDropdown = () => {
    if (!isDropdownOpen) return null;
    
    return createPortal(
      <div 
        ref={dropdownRef}
        className="fixed z-[9999] bg-white rounded-lg shadow-md border border-gray-200 flex flex-col"
        style={{
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="p-2 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="relative">
            <input
              type="text"
              placeholder="Filtrar unidades..."
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
          {loadingUnidades ? (
            <div className="px-4 py-2 text-sm text-gray-500 text-center">
              Carregando...
            </div>
          ) : errorUnidades ? (
            <div className="px-4 py-2 text-sm text-red-500">
              {errorUnidades}
              {errorUnidades.includes("servidor") && (
                <button 
                  onClick={() => searchQuery.length >= 3 ? fetchUnidadesNotificadoras(searchQuery) : null} 
                  className="ml-2 text-blue-500 underline"
                >
                  Tentar novamente
                </button>
              )}
            </div>
          ) : filteredUnidades.length > 0 ? (
            <>
              <div className="px-4 py-1 text-xs text-gray-400">
                {filteredUnidades.length} {specificEstablishments && specificEstablishments.length > 0 ? 
                  "estabelecimentos específicos" : 
                  "unidades"} encontrad{filteredUnidades.length === 1 ? "a" : "as"}
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
              {searchQuery.length >= 3 ? 'Nenhuma unidade encontrada com este termo' : 'Digite pelo menos 3 caracteres para pesquisar...'}
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

  // Definir classes de erro baseadas na prop hasError
  const errorClasses = hasError ? 
    "border-red-500 bg-red-50" : 
    "border-gray-200";

  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 font-medium text-gray-700">
          {label} {hasError && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            className={`w-full p-3 pl-9 border rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none ${errorClasses} ${className}`}
            value={displayValue}
            readOnly={true}
            onFocus={handleFocus}
            onClick={handleFocus}
            disabled={loadingUnidades && !isDropdownOpen}
            data-field-type={isForEncaminhamento ? "encaminhamento" : "unidade"}
            data-specific-filter={specificEstablishments && specificEstablishments.length > 0 ? "true" : "false"}
            data-error={hasError ? "true" : "false"} // Adicionar atributo para marcar erro para scroll
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
          className={`px-4 py-2 ${hasError ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg transition-colors flex items-center gap-2`}
          disabled={loadingUnidades && !isDropdownOpen}
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* Mensagem de erro */}
      {hasError && (
        <div className="mt-1 flex items-center text-red-500 text-sm">
          <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Renderiza o dropdown usando portal */}
      {renderDropdown()}
    </div>
  );
};

export default UnidadeNotificadoraField;