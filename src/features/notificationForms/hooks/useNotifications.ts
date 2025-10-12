// useNotifications.ts - Versão CORRIGIDA com SyncService
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { useDebounce } from '@/hooks/useDebounce';
import { useOfflineSystem } from '@/hooks/useOfflineSystem';
import { NotificacaoService } from '@/services/NotificacaoService';
import { TiposEventoService } from '@/services/EventoService';
import syncService from '@/services/syncService'; // ✅ AGORA SERÁ USADO
import indexedDBService from '@/services/indexedDB';
import { Notificacao, PaginationMeta, SearchParams } from '../types';
import { adjustDatesForExport, compareValues, getValueForSorting } from '../utils';
import { 
  exportListToExcel, 
  exportListToCSV, 
  exportListToPDFWithOptions,
  PDFExportType,
  ExportOptions
} from '@/features/notificationForms/components/exportUtilities';

export const useNotifications = () => {
  // ✅ Integrar sistema offline
  const {
    isOnline,
    isReadyForOffline,
    getOfflineStatusMessage,
    hasDataToSync,
    pendingData
  } = useOfflineSystem();

  // 🆕 REFS: Para controlar execuções e evitar loops
  const lastFetchTime = useRef<number>(0);
  const isFetching = useRef<boolean>(false);

  // 🆕 CACHE: Para eventos ativos (evitar buscar múltiplas vezes)
  const [eventosAtivosCache, setEventosAtivosCache] = useState<Set<number> | null>(null);

  // 🆕 FUNÇÃO: Carregar eventos ativos uma única vez
  const loadEventosAtivos = useCallback(async (): Promise<Set<number>> => {
    if (eventosAtivosCache) {
      console.log(`✅ Usando cache de eventos ativos: ${eventosAtivosCache.size} eventos`);
      return eventosAtivosCache;
    }

    try {
      console.log('🔄 Carregando eventos ativos do IndexedDB...');
      let eventosAtivos = await indexedDBService.getOpcoes('eventos') || [];
      
      // Se não há eventos no cache local, tentar buscar da API apenas se online/autenticado
      if (eventosAtivos.length === 0 && await syncService.canUseOnlineMode()) {
        console.log('📡 Cache de eventos vazio, buscando da API...');
        try {
          const eventosResponse = await TiposEventoService.getAllAtivos();
          eventosAtivos = eventosResponse || [];
          
          // Salvar no cache para uso offline
          if (eventosAtivos.length > 0) {
            await indexedDBService.saveOpcoes('eventos', eventosAtivos);
            console.log(`✅ ${eventosAtivos.length} eventos salvos no cache offline`);
          }
        } catch (apiError) {
          console.warn('⚠️ Erro ao buscar eventos da API:', apiError);
        }
      }
      
      const eventosAtivosFiltrados = eventosAtivos.filter((evento: any) => {
        return evento.ativo === undefined || evento.ativo === 'S' || evento.ativo === '1' || evento.ativo === true;
      });
      
      const idsEventosAtivos = new Set(eventosAtivosFiltrados.map((evento: any) => evento.idtipo_evento));
      setEventosAtivosCache(idsEventosAtivos);
      
      console.log(`✅ Cache de eventos ativos carregado: ${idsEventosAtivos.size} eventos ativos de ${eventosAtivos.length} totais`);
      return idsEventosAtivos;
    } catch (error) {
      console.warn('⚠️ Erro ao carregar eventos ativos:', error);
      return new Set(); // Retorna conjunto vazio em caso de erro
    }
  }, [eventosAtivosCache, isOnline]);

  // 🆕 FUNÇÃO OTIMIZADA: Filtrar notificações com eventos ativos apenas
  const filterNotificacoesComEventosAtivos = useCallback(async (notificacoes: Notificacao[]): Promise<Notificacao[]> => {
    try {
      // 🛠️ DEBUG: Verificar se o filtro está desabilitado globalmente
      if ((window as any).DISABLE_EVENT_FILTER) {
        console.log('🛠️ DEBUG: Filtro de eventos desabilitado globalmente');
        return notificacoes;
      }
      
      const idsEventosAtivos = await loadEventosAtivos();
      
      // 🐛 FIX: Se não há eventos ativos carregados, não filtrar (manter todas)
      if (idsEventosAtivos.size === 0) {
        console.log('⚠️ Nenhum evento ativo carregado, mantendo todas as notificações');
        return notificacoes;
      }
      
      // Filtrar notificações que tenham eventos ativos
      const notificacoesFiltradas = notificacoes.filter(notificacao => {
        const idEvento = notificacao.original?.tipo_evento?.idtipo_evento;
        const hasEvent = idEvento ? idsEventosAtivos.has(idEvento) : true;
        
        // Log detalhado para debug
        if (!hasEvent && idEvento) {
          console.log(`🔍 Notificação filtrada - ID evento: ${idEvento}, disponíveis: [${Array.from(idsEventosAtivos).join(', ')}]`);
        }
        
        return hasEvent;
      });
      
      console.log(`✅ Filtro de eventos ativos: ${notificacoes.length} → ${notificacoesFiltradas.length} notificações`);
      
      // Se muitas notificações foram filtradas, log adicional
      if (notificacoes.length > 0 && notificacoesFiltradas.length === 0) {
        console.warn('🚨 TODAS as notificações foram filtradas! Verificar eventos ativos.');
        console.log('📊 Eventos ativos disponíveis:', Array.from(idsEventosAtivos));
        console.log('📋 Eventos das notificações:', notificacoes.map(n => n.original?.tipo_evento?.idtipo_evento).filter(Boolean));
      }
      
      return notificacoesFiltradas;
    } catch (error) {
      console.warn('⚠️ Erro ao filtrar eventos ativos, mantendo todas as notificações:', error);
      return notificacoes; // Em caso de erro, retornar todas
    }
  }, [loadEventosAtivos]);

  // Estados existentes...
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [allNotificacoes, setAllNotificacoes] = useState<Notificacao[]>([]);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    total: 0,
    pages: 1,
    currentPage: 1,
    perPage: 10,
  });

  // Busca
  const [searchParams, setSearchParams] = useState<SearchParams>({
    term: "",
    field: "all",
  });
  const debouncedSearchParams = useDebounce(searchParams, 300);
  const [hasSearched, setHasSearched] = useState(false);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isUsingLocalSort, setIsUsingLocalSort] = useState(false);

  // Ordenação
  const [sortKey, setSortKey] = useState<keyof Notificacao>("data_ocorrencia");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Erro e loading
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ FUNÇÃO: Buscar notificações offline
  const fetchNotificacoesOffline = useCallback(async (page: number = 1, limit: number = 10) => {
    try {
      console.log('📱 Buscando notificações offline...');
      
      // Buscar todas as notificações do cache
      const cachedNotificacoes = await indexedDBService.getOpcoes('notificacoes-cache') || [];
      
      if (cachedNotificacoes.length === 0) {
        console.warn('⚠️ Nenhuma notificação encontrada no cache offline');
        return {
          data: [],
          meta: { total: 0, totalPages: 0, page: 1, limit }
        };
      }

      // 🆕 FILTRAR: Aplicar filtro de eventos ativos
      const notificacoesFiltradas = await filterNotificacoesComEventosAtivos(cachedNotificacoes);

      // Calcular paginação
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = notificacoesFiltradas.slice(startIndex, endIndex);
      
      console.log(`✅ Notificações offline: ${paginatedData.length}/${notificacoesFiltradas.length} (página ${page})`);
      
      return {
        data: paginatedData,
        meta: {
          total: notificacoesFiltradas.length,
          totalPages: Math.ceil(notificacoesFiltradas.length / limit),
          page,
          limit
        }
      };
    } catch (error) {
      console.error('❌ Erro ao buscar notificações offline:', error);
      return {
        data: [],
        meta: { total: 0, totalPages: 0, page: 1, limit }
      };
    }
  }, [filterNotificacoesComEventosAtivos]);

  // ✅ FUNÇÃO: Buscar todas as notificações (online/offline)
  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // ✅ VERIFICAR SE ESTÁ OFFLINE
      if (!isOnline) {
        console.log('📱 Modo offline: buscando todas as notificações do cache...');
        
        const cachedData = await indexedDBService.getOpcoes('notificacoes-cache') || [];
        
        if (cachedData.length === 0) {
          setError('Nenhuma notificação disponível offline. Conecte-se à internet e baixe os dados primeiro.');
          return null;
        }
        
        // 🆕 FILTRAR: Aplicar filtro de eventos ativos
        const dadosFiltrados = await filterNotificacoesComEventosAtivos(cachedData);
        
        console.log(`✅ ${dadosFiltrados.length} notificações carregadas do cache offline (filtradas)`);
        return dadosFiltrados;
      }

      // ✅ OTIMIZADO: Buscar dados de forma mais eficiente
      let allNotificacoes: Notificacao[] = [];
      
      // Primeiro tentar usar dados do cache se disponível
      const cachedData = await indexedDBService.getOpcoes('notificacoes-cache') || [];
      
      if (cachedData.length > 0) {
        console.log(`✅ Usando ${cachedData.length} notificações do cache`);
        allNotificacoes = cachedData;
      } else {
        // Se não há cache, buscar dados da API de forma otimizada
        let page = 1;
        let hasMore = true;
        const MODERATE_PAGE_SIZE = 100; // Reduzido de 500 para 100

        // ✅ VERIFICAR: Só buscar da API se estiver online e autenticado
        if (!await syncService.canUseOnlineMode()) {
          console.log('⚠️ Sistema offline ou não autenticado, usando apenas cache local');
          return allNotificacoes; // Retorna array vazio se não há cache
        }

        console.log('🌐 Buscando TODAS as notificações da API...');
        
        while (hasMore) { // ✅ CORRIGIDO: Buscar TODAS as páginas disponíveis
          console.log(`📄 Buscando página ${page}...`);
          const response = await NotificacaoService.getAll(page, MODERATE_PAGE_SIZE);

          if (response && response.data && response.data.length > 0) {
            allNotificacoes = [...allNotificacoes, ...response.data];
            console.log(`   ➜ ${response.data.length} notificações (Total: ${allNotificacoes.length}/${response.meta.total})`);

            if (
              page >= response.meta.totalPages ||
              response.data.length < MODERATE_PAGE_SIZE
            ) {
              hasMore = false;
              console.log(`✅ Busca completa: ${allNotificacoes.length} notificações`);
            } else {
              page++;
            }
          } else {
            hasMore = false;
          }
        }

        // ✅ SALVAR NO CACHE apenas se conseguiu buscar dados
        if (allNotificacoes.length > 0) {
          try {
            await indexedDBService.saveOpcoes('notificacoes-cache', allNotificacoes);
            console.log(`✅ ${allNotificacoes.length} notificações salvas no cache offline`);
          } catch (cacheError) {
            console.warn('⚠️ Erro ao salvar notificações no cache:', cacheError);
          }
        }
      }

      // 🆕 FILTRAR: Aplicar filtro de eventos ativos antes de retornar
      const notificacoesFiltradas = await filterNotificacoesComEventosAtivos(allNotificacoes);
      return notificacoesFiltradas;
    } catch (error) {
      console.error("Erro ao buscar todos os dados:", error);
      
      // ✅ FALLBACK: tentar usar cache em caso de erro online
      if (isOnline) {
        console.log('⚠️ Erro online, tentando usar cache como fallback...');
        
        try {
          const cachedData = await indexedDBService.getOpcoes('notificacoes-cache') || [];
          
          if (cachedData.length > 0) {
            toast.warning('Usando dados offline devido a erro de conexão');
            // 🆕 FILTRAR: Aplicar filtro de eventos ativos
            const dadosFiltrados = await filterNotificacoesComEventosAtivos(cachedData);
            return dadosFiltrados;
          }
        } catch (cacheError) {
          console.error('Erro ao usar cache como fallback:', cacheError);
        }
      }
      
      setError("Erro ao buscar todas as notificações para ordenação.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isOnline]);

  // ✅ CARREGAR DADOS (online/offline) - useEffect principal
  useEffect(() => {
    const fetchData = async () => {
      // 🆕 THROTTLING: Evitar execuções muito frequentes
      const now = Date.now();
      if (isFetching.current || (now - lastFetchTime.current < 500)) {
        console.log('⏳ Throttling: aguardando para evitar múltiplas execuções...');
        return;
      }
      
      isFetching.current = true;
      lastFetchTime.current = now;
      
      try {
        setIsLoading(true);

        // Se estamos usando ordenação local e temos todos os dados
        if (isUsingLocalSort && allNotificacoes.length > 0) {
          // Aplicar ordenação
          const sortedData = [...allNotificacoes].sort((a, b) => {
            const valueA = getValueForSorting(a, sortKey);
            const valueB = getValueForSorting(b, sortKey);
            return compareValues(valueA, valueB, sortOrder);
          });

          // Aplicar paginação manualmente
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          setNotificacoes(sortedData.slice(startIndex, endIndex));

          // Atualizar metadados de paginação
          setPaginationMeta({
            total: sortedData.length,
            pages: Math.ceil(sortedData.length / itemsPerPage),
            currentPage,
            perPage: itemsPerPage,
          });

          setIsLoading(false);
          return;
        }

        let response;
        
        // ✅ VERIFICAR SE ESTÁ OFFLINE
        if (!isOnline) {
          console.log('📱 Modo offline detectado');
          
          if (!isReadyForOffline()) {
            setError('Sistema não está pronto para uso offline. Conecte-se à internet e baixe os dados primeiro.');
            setIsLoading(false);
            return;
          }
          
          // Usar dados offline
          response = await fetchNotificacoesOffline(currentPage, itemsPerPage);
          
          if (response.data.length === 0 && !hasSearched) {
            setError('Nenhuma notificação disponível offline. Baixe os dados quando estiver online.');
          }
        } else {
          // ✅ MODO ONLINE: lógica com cache
          
          // Verificar se há termo de busca com no mínimo 3 caracteres
          if (
            debouncedSearchParams.term &&
            debouncedSearchParams.term.length >= 3
          ) {
            setHasSearched(true);
            console.log(`🔍 Buscando por "${debouncedSearchParams.term}" no campo "${debouncedSearchParams.field}"`);
            
            // ✅ OTIMIZADO: Usar cache primeiro, API apenas se necessário
            try {
              // Primeiro tentar usar dados do cache
              const cachedData = await indexedDBService.getOpcoes('notificacoes-cache') || [];
              
              if (cachedData.length > 0) {
                // Usar dados do cache para busca
                response = {
                  data: cachedData,
                  meta: {
                    total: cachedData.length,
                    totalPages: Math.ceil(cachedData.length / itemsPerPage),
                    page: 1,
                    limit: itemsPerPage
                  }
                };
              } else if (await syncService.canUseOnlineMode()) {
                // Se não há cache, buscar apenas os dados necessários da API (só se online/autenticado)
                response = await NotificacaoService.getAll(currentPage, itemsPerPage);
              } else {
                // Sistema offline/não autenticado e sem cache
                console.log('⚠️ Sistema offline/não autenticado e sem cache para busca');
                response = { data: [], meta: { total: 0, totalPages: 0, page: 1, limit: itemsPerPage } };
              }
            } catch (error) {
              // Fallback para cache se API falhar
              console.warn('API falhou na busca, usando cache...');
              const cachedData = await indexedDBService.getOpcoes('notificacoes-cache') || [];
              response = {
                data: cachedData,
                meta: {
                  total: cachedData.length,
                  totalPages: Math.ceil(cachedData.length / itemsPerPage),
                  page: 1,
                  limit: itemsPerPage
                }
              };
            }
            
            // Aplicar filtros de busca
            if (response && response.data) {
              // 🆕 FILTRAR: Primeiro filtrar eventos ativos
              const dadosComEventosAtivos = await filterNotificacoesComEventosAtivos(response.data);
              
              let filteredData = [];
              const searchTerm = debouncedSearchParams.term.toLowerCase().trim();
              
              // Aplicar filtro conforme o campo selecionado
              if (debouncedSearchParams.field === "paciente") {
                filteredData = dadosComEventosAtivos.filter(item => 
                  item.paciente && item.paciente.toLowerCase().includes(searchTerm)
                );
              }
              else if (debouncedSearchParams.field === "evento") {
                filteredData = dadosComEventosAtivos.filter(item => 
                  item.tipoEvento && item.tipoEvento.toLowerCase().includes(searchTerm)
                );
              }
              else if (debouncedSearchParams.field === "atendimento") {
                filteredData = dadosComEventosAtivos.filter(item => 
                  item.tipoAtendimento && item.tipoAtendimento.toLowerCase().includes(searchTerm)
                );
              }
              else if (debouncedSearchParams.field === "encerramento") {
                filteredData = dadosComEventosAtivos.filter(item => 
                  item.tipoEncerramento && item.tipoEncerramento.toLowerCase().includes(searchTerm)
                );
              }
              else {
                // Buscar em todos os campos
                filteredData = dadosComEventosAtivos.filter(item => (
                  (item.paciente && item.paciente.toLowerCase().includes(searchTerm)) ||
                  (item.tipoEvento && item.tipoEvento.toLowerCase().includes(searchTerm)) ||
                  (item.tipoAtendimento && item.tipoAtendimento.toLowerCase().includes(searchTerm)) ||
                  (item.tipoEncerramento && item.tipoEncerramento.toLowerCase().includes(searchTerm)) ||
                  (item.dataOcorrencia && item.dataOcorrencia.toLowerCase().includes(searchTerm))
                ));
              }
              
              // Calcular paginação
              const totalPages = Math.ceil(filteredData.length / itemsPerPage);
              const startIndex = (currentPage - 1) * itemsPerPage;
              const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
              const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
              
              if (safeCurrentPage !== currentPage) {
                setCurrentPage(safeCurrentPage);
              }
              
              // Criar resposta com dados paginados
              response = {
                data: filteredData.slice(startIndex, endIndex),
                meta: {
                  total: filteredData.length,
                  totalPages: totalPages,
                  page: safeCurrentPage,
                  limit: itemsPerPage
                }
              };
              
              console.log(`✅ Encontrados ${filteredData.length} resultados para a busca.`);
            }
          } else {
            console.log("🌐 Buscando todas notificações online");
            
            try {
              // ✅ VERIFICAR: Só buscar da API se estiver online e autenticado
              if (await syncService.canUseOnlineMode()) {
                response = await NotificacaoService.getAll(currentPage, itemsPerPage);
              } else {
                console.log('⚠️ Sistema offline/não autenticado, não é possível buscar da API');
                response = { data: [], meta: { total: 0, totalPages: 0, page: 1, limit: itemsPerPage } };
              }
              
              // ✅ OTIMIZADO: Cache inteligente apenas quando necessário
              if (response && response.data && currentPage === 1) {
                // Apenas salvar os dados já carregados no cache, sem buscar mais
                const existingCache = await indexedDBService.getOpcoes('notificacoes-cache') || [];
                
                // Se o cache está vazio ou muito antigo, buscar mais dados em background
                if (existingCache.length < 100) {
                  setTimeout(async () => {
                    try {
                      // ✅ VERIFICAR: Só buscar dados adicionais se ainda estiver online/autenticado
                      if (await syncService.canUseOnlineMode()) {
                        const moreData = await NotificacaoService.getAll(1, 200); // Reduzido de 1000 para 200
                        if (moreData && moreData.data) {
                          await indexedDBService.saveOpcoes('notificacoes-cache', moreData.data);
                          console.log('✅ Cache atualizado em background');
                        }
                      }
                    } catch (err) {
                      console.warn('⚠️ Erro ao atualizar cache em background:', err);
                    }
                  }, 2000); // Aguardar 2s antes de buscar
                }
              }
            } catch (error) {
              // Fallback para cache
              console.warn('API falhou, usando cache...');
              response = await fetchNotificacoesOffline(currentPage, itemsPerPage);
              toast.warning('Usando dados offline devido a erro de conexão');
            }
            
            // Se já houve busca anteriormente e agora o campo está vazio, resetar a flag
            if (hasSearched && !debouncedSearchParams.term) {
              setHasSearched(false);
            }
          }
        }

        // Processar resposta
        if (response && response.data) {
          // 🆕 FILTRAR: Remover notificações com eventos inativos
          const notificacoesFiltradas = await filterNotificacoesComEventosAtivos(response.data);
          
          // Verificar se estamos em uma página válida
          if (
            response.meta &&
            response.meta.totalPages > 0 &&
            currentPage > response.meta.totalPages
          ) {
            setCurrentPage(1);
            setIsLoading(false);
            return;
          }

          // Atualizar os dados
          setNotificacoes(notificacoesFiltradas);

          // Verificação de segurança para meta
          if (response.meta) {
            setPaginationMeta({
              total: response.meta.total || 0,
              pages: response.meta.totalPages || 1,
              currentPage: response.meta.page || 1,
              perPage: response.meta.limit || 10,
            });
          }
        } else {
          console.warn("Resposta não contém data:", response);
          
          if (!isOnline) {
            setError('Nenhum dado disponível offline');
          }
        }
      } catch (err: any) {
        console.error("Erro ao carregar notificações:", err);
        
        // ✅ TRATAMENTO DE ERRO MELHORADO
        if (!isOnline) {
          setError("Erro ao carregar dados offline. Verifique se os dados foram baixados.");
        } else {
          setError("Erro ao carregar notificações. Tente novamente.");
          
          // Tentar cache como último recurso
          try {
            const cachedData = await indexedDBService.getOpcoes('notificacoes-cache') || [];
            if (cachedData.length > 0) {
              // 🆕 FILTRAR: Aplicar filtro de eventos ativos
              const dadosFiltrados = await filterNotificacoesComEventosAtivos(cachedData);
              
              const startIndex = (currentPage - 1) * itemsPerPage;
              const endIndex = startIndex + itemsPerPage;
              
              setNotificacoes(dadosFiltrados.slice(startIndex, endIndex));
              setPaginationMeta({
                total: dadosFiltrados.length,
                pages: Math.ceil(dadosFiltrados.length / itemsPerPage),
                currentPage,
                perPage: itemsPerPage,
              });
              
              toast.warning('Usando dados em cache devido a erro de conexão');
              setError(null);
            }
          } catch (cacheError) {
            console.error('Erro ao usar cache como fallback:', cacheError);
          }
        }
      } finally {
        setIsLoading(false);
        isFetching.current = false; // 🆕 THROTTLING: Liberar para próxima execução
      }
    };

    fetchData();
  }, [
    currentPage, 
    itemsPerPage, 
    debouncedSearchParams.term, 
    debouncedSearchParams.field,
    isUsingLocalSort, 
    sortKey, 
    sortOrder, 
    isOnline
  ]);

  // ✅ FUNÇÃO: Exclusão (apenas online)
  const handleDelete = async (id: number) => {
    // ✅ VERIFICAR SE ESTÁ ONLINE
    if (!isOnline) {
      toast.error('Não é possível excluir notificações offline. Conecte-se à internet.');
      return;
    }

    if (window.confirm("Deseja realmente excluir esta notificação?")) {
      try {
        // ✅ VERIFICAR: Só excluir se estiver online e autenticado
        if (await syncService.canUseOnlineMode()) {          
          await NotificacaoService.delete(id);

          // Recarregar os dados após a exclusão
          const response = await NotificacaoService.getAll(
            currentPage,
            itemsPerPage
          );

          if (response && response.data) {
            setNotificacoes(response.data);
            setPaginationMeta({
              total: response.meta.total,
              pages: response.meta.totalPages,
              currentPage: response.meta.page,
              perPage: response.meta.limit,
            });

            // Se estamos usando ordenação local, atualizar allNotificacoes também
            if (isUsingLocalSort) {
              setAllNotificacoes(prev => prev.filter(n => n.id !== id));
            }

            // Atualizar cache apenas se online/autenticado
            if (await syncService.canUseOnlineMode()) {
              try {
                const allData = await NotificacaoService.getAll(1, 1000);
                if (allData && allData.data) {
                  await indexedDBService.saveOpcoes('notificacoes-cache', allData.data);
                }
              } catch (cacheError) {
                console.warn('Erro ao atualizar cache após exclusão:', cacheError);
              }
            }
          }
        } else {
          toast.error('Sistema offline ou não autenticado. Não é possível excluir.');
          return;
        }

        toast.success("Notificação excluída com sucesso");
        setError(null);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao excluir notificação");
        setError("Não foi possível excluir esta notificação.");
      }
    }
  };

  // ✅ FUNÇÃO: Exportação com fallback offline
  const handleExport = async (
    format: 'csv' | 'excel' | 'pdf', 
    type: 'page' | 'all',
    pdfType?: PDFExportType
  ) => {
    try {
      setIsLoading(true);

      // Buscar dados - página atual ou todos
      const dataToExport = type === "page" ? notificacoes : await fetchAllData();

      if (!dataToExport || dataToExport.length === 0) {
        toast.info("Não há dados para exportar.");
        setIsLoading(false);
        return;
      }

      // ✅ BUSCAR OPÇÕES COM FALLBACK OFFLINE usando SyncService
      let options: ExportOptions;
      
      try {
        if (isOnline) {
          // ✅ USAR SYNCSERVICE para buscar opções
          console.log('🌐 Buscando opções de exportação online via SyncService...');
          
          const [
            eventoOptions,
            publicoOptions,
            paisOptions,
            estadoOptions,
            municipioOptions,
            bairroOptions,
            cboOptions,
            generoOptions,
            racaOptions,
            escolaridadeOptions,
            atendimentoOptions,
            sintomaOptions,
            hipoteseDiagOptions,
            traumaOptions,
            estabelecimentoOptions,
            encerramentoOptions
          ] = await Promise.all([
            syncService.syncOpcoes('eventos', () => NotificacaoService.getEventoOptions()),
            syncService.syncOpcoes('publicos', () => NotificacaoService.getPublicoOptions()),
            syncService.syncOpcoes('paises', () => NotificacaoService.getPaisOptions()),
            syncService.syncOpcoes('estados', () => NotificacaoService.getEstadoOptions()),
            syncService.syncOpcoes('municipios', () => NotificacaoService.getMunicipioOptions()),
            syncService.syncOpcoes('bairros', () => NotificacaoService.getBairroOptions()),
            syncService.syncOpcoes('cbos', () => NotificacaoService.getCboOptions()),
            syncService.syncOpcoes('generos', () => NotificacaoService.getGeneroOptions()),
            syncService.syncOpcoes('racas', () => NotificacaoService.getRacaOptions()),
            syncService.syncOpcoes('escolaridades', () => NotificacaoService.getEscolaridadeOptions()),
            syncService.syncOpcoes('atendimentos', () => NotificacaoService.getAtendimentoOptions()),
            syncService.syncOpcoes('sintomas', () => NotificacaoService.getSintomaOptions()),
            syncService.syncOpcoes('hipoteses', () => NotificacaoService.getHipoteseDiagOptions()),
            syncService.syncOpcoes('traumas', () => NotificacaoService.getTraumaOptions()),
            syncService.syncOpcoes('estabelecimentos', () => NotificacaoService.getEstabelecimentoOptions()),
            syncService.syncOpcoes('encerramentos', () => NotificacaoService.getEncerramentoOptions())
          ]);

          options = {
            eventoOptions,
            publicoOptions,
            paisOptions,
            estadoOptions,
            municipioOptions,
            bairroOptions,
            cboOptions,
            generoOptions,
            racaOptions,
            escolaridadeOptions,
            atendimentoOptions,
            sintomaOptions,
            hipoteseDiagOptions,
            traumaOptions,
            estabelecimentoOptions,
            encerramentoOptions
          };
        } else {
          throw new Error('Modo offline, usar cache');
        }
      } catch (optionsError) {
        // ✅ FALLBACK: usar opções do cache offline
        console.log('📱 Buscando opções de exportação do cache offline...');
        
        options = {
          eventoOptions: await indexedDBService.getOpcoes('eventos') || [],
          publicoOptions: await indexedDBService.getOpcoes('publicos') || [],
          paisOptions: await indexedDBService.getOpcoes('paises') || [],
          estadoOptions: await indexedDBService.getOpcoes('estados') || [],
          municipioOptions: await indexedDBService.getOpcoes('municipios') || [],
          bairroOptions: await indexedDBService.getOpcoes('bairros') || [],
          cboOptions: await indexedDBService.getOpcoes('cbos') || [],
          generoOptions: await indexedDBService.getOpcoes('generos') || [],
          racaOptions: await indexedDBService.getOpcoes('racas') || [],
          escolaridadeOptions: await indexedDBService.getOpcoes('escolaridades') || [],
          atendimentoOptions: await indexedDBService.getOpcoes('atendimentos') || [],
          sintomaOptions: await indexedDBService.getOpcoes('sintomas') || [],
          hipoteseDiagOptions: await indexedDBService.getOpcoes('hipoteses') || [],
          traumaOptions: await indexedDBService.getOpcoes('traumas') || [],
          estabelecimentoOptions: await indexedDBService.getOpcoes('estabelecimentos') || [],
          encerramentoOptions: await indexedDBService.getOpcoes('encerramentos') || [],
        };
        
        console.log('✅ Opções de exportação carregadas do cache offline');
      }

      // Ajustar datas antes de exportar
      const formattedData = adjustDatesForExport(dataToExport);

      // Exportar com base no formato escolhido
      if (format === 'csv') {
        exportListToCSV(formattedData, options);
        toast.success(`CSV exportado com sucesso`);
      } else if (format === 'excel') {
        exportListToExcel(formattedData, options);
        toast.success(`Dados exportados com sucesso para Excel`);
      } else if (format === 'pdf') {
        exportListToPDFWithOptions(formattedData, options, pdfType || 'both');
        
        const pdfMessages = {
          'table': 'PDF da tabela resumida exportado com sucesso',
          'forms': 'PDF das fichas detalhadas exportado com sucesso',
          'both': 'PDF completo (tabela + fichas) exportado com sucesso'
        };
        
        toast.success(pdfMessages[pdfType || 'both']);
      }

      // Adicionar mensagem se foi exportado offline
      if (!isOnline) {
        toast.info('Exportação realizada com dados offline');
      }

    } catch (error) {
      console.error(`Erro ao exportar ${format}:`, error);
      setError(`Erro ao exportar ${format}. Tente novamente.`);

      if (error instanceof Error) {
        toast.error(`Erro na exportação: ${error.message}`);
      } else {
        toast.error("Erro na exportação. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FUNÇÃO: Mudança de página
  const handlePageChange = useCallback((newPage: number) => {
    // Garantir que a página nunca seja maior que o total de páginas
    const safeNewPage = Math.min(newPage, paginationMeta.pages);

    if (safeNewPage >= 1 && safeNewPage <= paginationMeta.pages) {
      setCurrentPage(safeNewPage);
      
      // Se estiver usando ordenação local, aplicar paginação manualmente
      if (isUsingLocalSort && allNotificacoes.length > 0) {
        const startIndex = (safeNewPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        // Aplicar a ordenação atual
        const sortedData = [...allNotificacoes].sort((a, b) => {
          const valueA = getValueForSorting(a, sortKey);
          const valueB = getValueForSorting(b, sortKey);
          return compareValues(valueA, valueB, sortOrder);
        });
        
        setNotificacoes(sortedData.slice(startIndex, endIndex));
      }
    }
  }, [paginationMeta.pages, isUsingLocalSort, allNotificacoes, itemsPerPage, sortKey, sortOrder]);

  // ✅ FUNÇÃO: Mudança de ordenação
  const handleSortChange = useCallback(async (key: string | keyof Notificacao) => {
    try {
      // Determinar a nova ordem
      const newSortOrder = sortKey === key && sortOrder === "asc" ? "desc" : "asc";
      
      // Se não estamos usando ordenação local ou se é a primeira vez
      if (!isUsingLocalSort || allNotificacoes.length === 0) {
        setIsLoading(true);
        
        // Buscar todos os dados
        const allData = await fetchAllData();
        
        if (allData && allData.length > 0) {
          // 🆕 FILTRAR: Aplicar filtro de eventos ativos
          const allDataFiltrado = await filterNotificacoesComEventosAtivos(allData);
          setAllNotificacoes(allDataFiltrado);
          setIsUsingLocalSort(true);
          
          // Atualizar as chaves de ordenação
          setSortKey(key as keyof Notificacao);
          setSortOrder(newSortOrder);
          
          toast.info("Ordenação ativada com sucesso");
        } else {
          // Fallback para ordenação básica se não conseguir buscar todos os dados
          setSortKey(key as keyof Notificacao);
          setSortOrder(newSortOrder);
          
          // Ordenar apenas os dados da página atual (não é ideal, mas é um fallback)
          const sortedPageData = [...notificacoes].sort((a, b) => {
            const valueA = getValueForSorting(a, key as keyof Notificacao);
            const valueB = getValueForSorting(b, key as keyof Notificacao);
            return compareValues(valueA, valueB, newSortOrder);
          });
          
          setNotificacoes(sortedPageData);
        }
      } else {
        // Simplesmente atualizar as chaves de ordenação quando já temos todos os dados
        setSortKey(key as keyof Notificacao);
        setSortOrder(newSortOrder);
      }
    } catch (error) {
      console.error("Erro ao ordenar:", error);
      setError("Erro ao ordenar dados. Tente novamente.");
    }
  }, [sortKey, sortOrder, isUsingLocalSort, allNotificacoes, notificacoes, fetchAllData]);

  // ✅ RETORNAR: Estados e funções
  return {
    // Estados existentes
    notificacoes,
    allNotificacoes,
    paginationMeta,
    searchParams,
    currentPage,
    itemsPerPage,
    isUsingLocalSort,
    sortKey,
    sortOrder,
    error,
    isLoading,
    hasSearched,
    
    // ✅ Estados offline
    isOnline,
    isReadyForOffline: isReadyForOffline(),
    offlineStatusMessage: getOfflineStatusMessage(),
    hasDataToSync: hasDataToSync(),
    pendingData,
    
    // Setters
    setSearchParams,
    setCurrentPage,
    setItemsPerPage,
    setError,
    
    // Funções
    handleDelete,
    handlePageChange,
    handleSortChange,
    handleExport,
    fetchAllData
  };
};