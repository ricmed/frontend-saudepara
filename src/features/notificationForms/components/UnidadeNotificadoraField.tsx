import React, { useState, useRef, useEffect, useMemo } from "react";
import axios from "axios";
import { Search, X, AlertCircle } from "lucide-react";
import { createPortal } from "react-dom";
import indexedDBService from '@/services/indexedDB';

// Configuração da API usando variáveis de ambiente
const server = import.meta.env.VITE_API_SERVER;
const port = import.meta.env.VITE_API_PORT;
const API_BASE_URL = `${server}:${port}/api`;

console.log('🔧 UnidadeNotificadoraField - Configuração API:', {
  server,
  port,
  API_BASE_URL
});

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
  /** IDs permitidos (municipal/unidade). Se informado + restrictToAllowed=true, só estes podem ser selecionados */
  allowedEstablishmentIds?: number[];
  /** Caso você já tenha a lista completa permitida, passe-a e o componente NÃO chamará a API */
  allowedOptions?: Array<{ idestabelecimento: number; nome: string; cidade?: string; bairro?: string; cnes?: string }>;
  /** Se true, bloqueia escolha fora dos permitidos (default: false) */
  restrictToAllowed?: boolean;
  /** Mensagem de erro quando tentar escolher unidade fora do permitido */
  denyOutsideMessage?: string;
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
    "O campo estabelecimento é obrigatório", // Mensagem padrão
  allowedEstablishmentIds,
  allowedOptions,
  restrictToAllowed = false,
  denyOutsideMessage = "Unidade não permitida para o seu perfil",
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
  
  // � Limpar cache em memória quando for para encaminhamento (para evitar uso de cache hierárquico)
  useEffect(() => {
    if (isForEncaminhamento) {
      console.log('🗑️ Limpando cache em memória para campo de encaminhamento');
      estabelecimentosCache.current = {};
    }
  }, [isForEncaminhamento]);
  
  // �🔤 Normalizador para busca acento/case-insensitive
  const norm = (s?: string) =>
    (s || "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  
  // 🔒 Helper para saber se uma unidade é permitida
  const isAllowed = (id: number) => {
    if (!restrictToAllowed) return true;
    // allowedOptions tem precedência (caso você mande a lista completa)
    if (allowedOptions?.length) {
      return allowedOptions.some(o => o.idestabelecimento === id);
    }
    if (allowedEstablishmentIds?.length) {
      return allowedEstablishmentIds.includes(id);
    }
    return true; // se nada foi passado, não restringe
  };
  
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
      
      // Sempre exigir 3+ chars pra abrir resultados
      if (searchTerm.length < 3) {
        setUnidadesNotificadoras([]);
        setLoadingUnidades(false);
        setErrorUnidades(searchTerm.length > 0
          ? "Digite pelo menos 3 caracteres para pesquisar"
          : "Digite pelo menos 3 caracteres para ver as unidades");
        return;
      }

      // 👉 Se vieram opções permitidas completas, filtra localmente e sai
      if (allowedOptions && allowedOptions.length) {
        const q = norm(searchTerm);
        const onlyDigits = searchTerm.replace(/\D/g, "");
        const filtradas = allowedOptions.filter(est => {
          const byName = norm(est.nome).includes(q);
          const byCnes = onlyDigits ? (est.cnes || "").includes(onlyDigits) : false;
          return q ? (byName || byCnes) : true;
        });
        setUnidadesNotificadoras(filtradas);
        setLoadingUnidades(false);
        return;
      }
      
      // Check cache first - MAS NÃO PARA ENCAMINHAMENTO (precisa buscar todos)
      const cacheKey = searchTerm;
      if (!isForEncaminhamento && estabelecimentosCache.current[cacheKey]) {
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
      } else if (isForEncaminhamento && estabelecimentosCache.current[cacheKey]) {
        console.log(`🔄 Ignorando cache em memória para encaminhamento - buscando todos estabelecimentos`);
      }
      
      let estabelecimentosAtivos: Estabelecimento[] = [];

      // ✅ VERIFICAR CACHE OFFLINE PRIMEIRO
      if (!navigator.onLine) {
        console.log('📱 Modo offline: buscando estabelecimentos em cache...');
        
        let cachedEstabelecimentos = null;
        
        // 🔑 IMPORTANTE: Se for para encaminhamento, buscar cache geral ao invés do hierárquico
        if (!isForEncaminhamento) {
          // ✅ PRIMEIRO: Tentar buscar da chave 'estabelecimentos-permitidos' (filtrados no download)
          cachedEstabelecimentos = await indexedDBService.getOpcoes('estabelecimentos-permitidos');
          
          if (!cachedEstabelecimentos || cachedEstabelecimentos.length === 0) {
            console.warn('⚠️ Cache "estabelecimentos-permitidos" vazio, tentando cache geral...');
            // Fallback para cache geral (menos seguro, mas melhor que nada)
            cachedEstabelecimentos = await indexedDBService.getOpcoes('estabelecimentos');
          }
        } else {
          console.log('🔄 Campo de encaminhamento offline: usando cache geral ao invés do hierárquico');
          // Para encaminhamento, buscar diretamente do cache geral
          cachedEstabelecimentos = await indexedDBService.getOpcoes('estabelecimentos');
        }
        
        if (cachedEstabelecimentos && cachedEstabelecimentos.length > 0) {
          console.log(`📦 Cache offline carregado: ${cachedEstabelecimentos.length} estabelecimentos`);
          
          // ✅ IMPORTANTE: Se temos lista de permitidos (allowedOptions ou allowedEstablishmentIds),
          // filtrar APENAS pelos estabelecimentos permitidos no cache
          let estabelecimentosParaFiltrar = cachedEstabelecimentos;
          
          if (restrictToAllowed) {
            if (allowedOptions && allowedOptions.length > 0) {
              const allowedIds = allowedOptions.map(o => o.idestabelecimento);
              estabelecimentosParaFiltrar = cachedEstabelecimentos.filter((est: any) => 
                allowedIds.includes(est.idestabelecimento)
              );
              console.log(`🔒 Filtro hierárquico offline (allowedOptions): ${estabelecimentosParaFiltrar.length} de ${cachedEstabelecimentos.length} estabelecimentos permitidos`);
            } else if (allowedEstablishmentIds && allowedEstablishmentIds.length > 0) {
              estabelecimentosParaFiltrar = cachedEstabelecimentos.filter((est: any) => 
                allowedEstablishmentIds.includes(est.idestabelecimento)
              );
              console.log(`🔒 Filtro por IDs offline: ${estabelecimentosParaFiltrar.length} de ${cachedEstabelecimentos.length} estabelecimentos permitidos`);
            } else {
              // Se restrictToAllowed está ativado mas não tem lista, significa que o cache já está filtrado
              console.log(`✅ Cache já filtrado hierarquicamente: ${estabelecimentosParaFiltrar.length} estabelecimentos`);
            }
          }
          
          // ✅ FILTRAR LOCALMENTE PELOS PARÂMETROS DE BUSCA
          estabelecimentosAtivos = estabelecimentosParaFiltrar.filter((est: any) => {
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
        // ✅ MODO ONLINE: PRIORIZAR CACHE FILTRADO para respeitar hierarquia
        try {
          // 🔑 IMPORTANTE: Se for para encaminhamento, NÃO usar cache hierárquico
          let cachedEstabelecimentos = null;
          
          if (!isForEncaminhamento) {
            // 🔑 PRIMEIRO: Tentar buscar do cache 'estabelecimentos-permitidos' (filtrados hierarquicamente)
            console.log('🌐 Modo online: verificando cache filtrado primeiro...');
            cachedEstabelecimentos = await indexedDBService.getOpcoes('estabelecimentos-permitidos');
          } else {
            console.log('🔄 Campo de encaminhamento: pulando cache hierárquico para buscar todos os estabelecimentos');
          }
          
          if (cachedEstabelecimentos && cachedEstabelecimentos.length > 0) {
            console.log(`✅ Cache filtrado encontrado: ${cachedEstabelecimentos.length} estabelecimentos permitidos`);
            
            // ✅ FILTRAR LOCALMENTE pelos parâmetros de busca
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
            
            console.log(`✅ Estabelecimentos do cache filtrados pela busca: ${estabelecimentosAtivos.length} registros`);
          } else {
            // 🔄 FALLBACK: Se cache não existe, usar API (comportamento anterior)
            console.warn('⚠️ Cache filtrado não encontrado, usando API direta (sem filtro hierárquico)');
            
            // Preparar parâmetros para a API
            const params: any = {
              limit: 11000,
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
            
            // URL da API usando variáveis de ambiente
            const apiUrl = `${API_BASE_URL}/estabelecimentos`;
            console.log('🌐 URL da API para busca de estabelecimentos:', apiUrl);
          
            // Fazer a requisição à API com a URL correta
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
      
      // Store all results in cache before filtering - MAS NÃO PARA ENCAMINHAMENTO
      if (!isForEncaminhamento) {
        estabelecimentosCache.current[cacheKey] = estabelecimentosAtivos;
      } else {
        console.log(`🔄 Não salvando em cache (encaminhamento) - total: ${estabelecimentosAtivos.length} estabelecimentos`);
      }
      
      // Filtrar por estabelecimentos específicos se fornecidos
      if (specificEstablishments && specificEstablishments.length > 0) {
        estabelecimentosAtivos = estabelecimentosAtivos.filter(est => 
          specificEstablishments.some(name => 
            est.nome.toUpperCase().includes(name.toUpperCase())
          )
        );
        console.log(`Filtered to ${estabelecimentosAtivos.length} specific establishments: ${specificEstablishments.join(', ')}`);
      }
      
      // 🔒 Se for pra restringir, filtre pelos IDs permitidos
      if (restrictToAllowed && (allowedEstablishmentIds?.length || allowedOptions?.length)) {
        const allowedIds = new Set(
          allowedOptions?.map(o => o.idestabelecimento) ??
          allowedEstablishmentIds!
        );
        estabelecimentosAtivos = estabelecimentosAtivos.filter(est =>
          allowedIds.has(est.idestabelecimento)
        );
        console.log(`Restricted to ${estabelecimentosAtivos.length} allowed establishments`);
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
    // Primeiro tenta do IndexedDB
    try {
      const cached: any[] = (await indexedDBService.getOpcoes("estabelecimentos")) || [];
      const found = cached.find(item => String(item.idestabelecimento) === id);
      if (found) {
        // 1.7. Garanta o valor inicial permitido
        if (restrictToAllowed && !isAllowed(found.idestabelecimento)) {
          console.warn(`Estabelecimento ${found.nome} (ID: ${id}) não está na lista permitida.`);
          return;
        }
        setSelectedEstabelecimento(found);
        setDisplayValue(found.nome);
        return;
      }
    } catch (e) {
      console.warn("Erro ao ler estabelecimento do cache:", e);
    }
    // 2) Se não encontrou no cache, chama a API
    try {
      setLoadingUnidades(true);
      const apiUrl = `${API_BASE_URL}/estabelecimentos/${id}`;
      console.log('🌐 URL da API para busca por ID:', apiUrl);
      
      const response = await axios.get(apiUrl);
      
      if (response.data && response.data.idestabelecimento) {
        // 1.7. Garanta o valor inicial permitido
        if (restrictToAllowed && !isAllowed(response.data.idestabelecimento)) {
          console.warn(`Estabelecimento ${response.data.nome} (ID: ${id}) não está na lista permitida.`);
          setSelectedEstabelecimento(null);
          setDisplayValue("");
          return;
        }
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
      return;
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

  // 🎯 AUTO-SELEÇÃO: Para usuários de nível "unidade" com apenas 1 estabelecimento permitido
  useEffect(() => {
    const autoSelectSingleEstablishment = async () => {
      console.log('🔍 useEffect auto-seleção executado:', {
        value,
        selectedEstabelecimento: selectedEstabelecimento?.nome,
        allowedOptionsLength: allowedOptions?.length,
        allowedIdsLength: allowedEstablishmentIds?.length,
      });

      // Só executar se campo ainda não tem valor
      if (value || selectedEstabelecimento) {
        console.log('⏭️ Campo já tem valor, pulando auto-seleção');
        return;
      }

      let singleEstablishment: Estabelecimento | null = null;

      // Cenário 1: allowedOptions com exatamente 1 item (modo online com permissões)
      if (allowedOptions && allowedOptions.length === 1) {
        singleEstablishment = allowedOptions[0];
        console.log('🎯 Auto-seleção (online): 1 estabelecimento em allowedOptions:', singleEstablishment.nome);
      }
      // Cenário 2: allowedEstablishmentIds com exatamente 1 ID - buscar do cache
      else if (allowedEstablishmentIds && allowedEstablishmentIds.length === 1) {
        const singleId = allowedEstablishmentIds[0];
        console.log('🎯 Auto-seleção (online): buscando estabelecimento ID', singleId, 'do cache...');
        
        // Tentar buscar do cache filtrado primeiro
        try {
          const cachedEstabelecimentos = await indexedDBService.getOpcoes('estabelecimentos-permitidos');
          if (cachedEstabelecimentos && cachedEstabelecimentos.length > 0) {
            singleEstablishment = cachedEstabelecimentos.find((est: any) => 
              est.idestabelecimento === singleId
            ) || null;
            
            if (singleEstablishment) {
              console.log('✅ Estabelecimento encontrado no cache filtrado:', singleEstablishment.nome);
            }
          }
        } catch (error) {
          console.warn('⚠️ Erro ao buscar do cache para auto-seleção:', error);
        }
      }
      // Cenário 3: MODO OFFLINE - props vazias, buscar direto do cache 'estabelecimentos-permitidos'
      else if ((!allowedOptions || allowedOptions.length === 0) && (!allowedEstablishmentIds || allowedEstablishmentIds.length === 0)) {
        console.log('🎯 Auto-seleção (offline): verificando cache estabelecimentos-permitidos...');
        try {
          const cachedEstabelecimentos = await indexedDBService.getOpcoes('estabelecimentos-permitidos');
          
          if (cachedEstabelecimentos && cachedEstabelecimentos.length === 1) {
            singleEstablishment = cachedEstabelecimentos[0] as Estabelecimento;
            console.log('✅ Cache offline tem exatamente 1 estabelecimento:', singleEstablishment.nome);
          } else if (cachedEstabelecimentos && cachedEstabelecimentos.length > 1) {
            console.log(`⚠️ Cache offline tem ${cachedEstabelecimentos.length} estabelecimentos - não auto-selecionar`);
          } else {
            console.log('⚠️ Cache offline vazio ou não encontrado');
          }
        } catch (error) {
          console.warn('⚠️ Erro ao buscar cache offline para auto-seleção:', error);
        }
      } else {
        console.log('⏭️ Nenhum cenário de auto-seleção aplicável');
      }

      // Se encontramos um único estabelecimento, selecionar automaticamente
      if (singleEstablishment) {
        console.log('✅ AUTO-SELECIONANDO estabelecimento único:', singleEstablishment.nome);
        setDisplayValue(singleEstablishment.nome);
        setSelectedEstabelecimento(singleEstablishment);
        onChange(singleEstablishment.idestabelecimento.toString());
      }
    };

    autoSelectSingleEstablishment();
  }, [allowedOptions, allowedEstablishmentIds, value, selectedEstabelecimento, onChange]); // Executar quando props mudarem

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
    // 1.6. Bloqueie seleção fora do permitido
    if (restrictToAllowed && !isAllowed(estabelecimento.idestabelecimento)) {
      alert(denyOutsideMessage);
      return;
    }
    
    // Definir valor local e notificar imediatamente
    setDisplayValue(estabelecimento.nome);
    onChange(estabelecimento.idestabelecimento.toString());
    setSelectedEstabelecimento(estabelecimento);
    setSearchQuery("");
    setIsManuallyEditing(false); // Sair do modo de edição manual
    
    // Convert to string and log what we're sending back
    const idToSend = estabelecimento.idestabelecimento.toString();
    console.log(`Selecionado ${isForEncaminhamento ? 'encaminhamento' : 'unidade'}: ${estabelecimento.nome} (ID: ${idToSend})`);
    
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