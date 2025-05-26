// src/features/notificationForms/hooks/useNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useDebounce } from '@/hooks/useDebounce';
import { NotificacaoService } from '@/services/NotificacaoService';
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
  // Estado para notificações
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

  // Função para buscar todos os dados para ordenação e exportação
  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let allNotificacoes: Notificacao[] = [];
      let page = 1;
      let hasMore = true;
      const LARGE_PAGE_SIZE = 500; // Usar tamanho de página grande para reduzir o número de requisições

      // Buscar todas as páginas
      while (hasMore) {
        const response = await NotificacaoService.getAll(page, LARGE_PAGE_SIZE);

        if (response && response.data && response.data.length > 0) {
          allNotificacoes = [...allNotificacoes, ...response.data];

          if (
            page >= response.meta.totalPages ||
            response.data.length < LARGE_PAGE_SIZE
          ) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      return allNotificacoes;
    } catch (error) {
      console.error("Erro ao buscar todos os dados:", error);
      setError("Erro ao buscar todas as notificações para ordenação.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar dados
  useEffect(() => {
    const fetchData = async () => {
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

        // Caso contrário, usar a API normal com paginação do backend
        let response;
        
        // Verificar se há termo de busca com no mínimo 3 caracteres
        if (
          debouncedSearchParams.term &&
          debouncedSearchParams.term.length >= 3
        ) {
          setHasSearched(true);
          console.log(`Buscando por "${debouncedSearchParams.term}" no campo "${debouncedSearchParams.field}"`);
          
          // Obter todos os dados primeiro
          response = await NotificacaoService.getAll(1, 1000);
          
          // Filtrar os dados conforme o critério de busca
          if (response && response.data) {
            let filteredData = [];
            const searchTerm = debouncedSearchParams.term.toLowerCase().trim();
            
            // Aplicar filtro conforme o campo selecionado
            if (debouncedSearchParams.field === "paciente") {
              filteredData = response.data.filter(item => 
                item.paciente && item.paciente.toLowerCase().includes(searchTerm)
              );
            }
            else if (debouncedSearchParams.field === "evento") {
              filteredData = response.data.filter(item => 
                item.tipoEvento && item.tipoEvento.toLowerCase().includes(searchTerm)
              );
            }
            else if (debouncedSearchParams.field === "atendimento") {
              filteredData = response.data.filter(item => 
                item.tipoAtendimento && item.tipoAtendimento.toLowerCase().includes(searchTerm)
              );
            }
            else if (debouncedSearchParams.field === "encerramento") {
              filteredData = response.data.filter(item => 
                item.tipoEncerramento && item.tipoEncerramento.toLowerCase().includes(searchTerm)
              );
            }
            else {
              // Buscar em todos os campos
              filteredData = response.data.filter(item => (
                (item.paciente && item.paciente.toLowerCase().includes(searchTerm)) ||
                (item.tipoEvento && item.tipoEvento.toLowerCase().includes(searchTerm)) ||
                (item.tipoAtendimento && item.tipoAtendimento.toLowerCase().includes(searchTerm)) ||
                (item.tipoEncerramento && item.tipoEncerramento.toLowerCase().includes(searchTerm)) ||
                (item.dataOcorrencia && item.dataOcorrencia.toLowerCase().includes(searchTerm))
              ));
            }
            
            // Calcular o total de páginas com base nos resultados filtrados
            const totalPages = Math.ceil(filteredData.length / itemsPerPage);
            
            // Aplicar paginação manual aos resultados filtrados
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
            
            // Garantir que não esteja além do número de páginas
            const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
            
            // Se a página mudou, atualize
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
            
            console.log(`Encontrados ${filteredData.length} resultados para a busca.`);
          }
        } else {
          console.log("Buscando todas notificações");
          response = await NotificacaoService.getAll(currentPage, itemsPerPage);
          
          // Se já houve busca anteriormente e agora o campo está vazio,
          // resetar a flag
          if (hasSearched && !debouncedSearchParams.term) {
            setHasSearched(false);
          }
        }

        if (response && response.data) {
          // Verificar se estamos em uma página válida
          if (
            response.meta &&
            response.meta.totalPages > 0 &&
            currentPage > response.meta.totalPages
          ) {
            // Se a página atual for maior que o total de páginas, volte para a página 1
            setCurrentPage(1);
            setIsLoading(false);
            return;
          }

          // Atualizar os dados
          setNotificacoes(response.data);

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
        }
      } catch (err: any) {
        console.error("Erro ao carregar notificações:", err);
        console.error("Detalhes do erro:", err.response?.data || err.message);
        setError("Erro ao carregar notificações. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentPage, itemsPerPage, debouncedSearchParams, isUsingLocalSort, sortKey, sortOrder, hasSearched, allNotificacoes]);

  // Funções para manipulação dos dados
  const handleDelete = async (id: number) => {
    if (window.confirm("Deseja realmente excluir esta notificação?")) {
      try {
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

  // Paginação
  const handlePageChange = (newPage: number) => {
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
  };

  // Ordenação
  const handleSortChange = async (key: string | keyof Notificacao) => {
    try {
      // Determinar a nova ordem
      const newSortOrder = sortKey === key && sortOrder === "asc" ? "desc" : "asc";
      
      // Se não estamos usando ordenação local ou se é a primeira vez
      if (!isUsingLocalSort || allNotificacoes.length === 0) {
        setIsLoading(true);
        
        // Buscar todos os dados
        const allData = await fetchAllData();
        
        if (allData && allData.length > 0) {
          setAllNotificacoes(allData);
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
  };
  // Funções de exportação
  const handleExport = async (
    format: 'csv' | 'excel' | 'pdf', 
    type: 'page' | 'all',
    pdfType?: PDFExportType // Novo parâmetro opcional para PDF
  ) => {
    try {
      // Mostrar loader ou feedback visual
      setIsLoading(true);

      // Buscar dados - página atual ou todos
      const dataToExport = type === "page" ? notificacoes : await fetchAllData();

      if (!dataToExport || dataToExport.length === 0) {
        toast.info("Não há dados para exportar.");
        setIsLoading(false);
        return;
      }

      // Buscar opções para conversão de IDs para descrições
      const options: ExportOptions = {
        eventoOptions: await NotificacaoService.getEventoOptions(),
        publicoOptions: await NotificacaoService.getPublicoOptions(),
        paisOptions: await NotificacaoService.getPaisOptions(),
        estadoOptions: await NotificacaoService.getEstadoOptions(),
        municipioOptions: await NotificacaoService.getMunicipioOptions(),
        bairroOptions: await NotificacaoService.getBairroOptions(),
        cboOptions: await NotificacaoService.getCboOptions(),
        generoOptions: await NotificacaoService.getGeneroOptions(),
        racaOptions: await NotificacaoService.getRacaOptions(),
        escolaridadeOptions: await NotificacaoService.getEscolaridadeOptions(),
        atendimentoOptions: await NotificacaoService.getAtendimentoOptions(),
        sintomaOptions: await NotificacaoService.getSintomaOptions(),
        hipoteseDiagOptions: await NotificacaoService.getHipoteseDiagOptions(),
        traumaOptions: await NotificacaoService.getTraumaOptions(),
        estabelecimentoOptions: await NotificacaoService.getEstabelecimentoOptions(),
        encerramentoOptions: await NotificacaoService.getEncerramentoOptions(),
      };

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
        // Usar a nova função com opções de PDF
        exportListToPDFWithOptions(formattedData, options, pdfType || 'both');
        
        // Mensagens específicas baseadas no tipo de PDF
        const pdfMessages = {
          'table': 'PDF da tabela resumida exportado com sucesso',
          'forms': 'PDF das fichas detalhadas exportado com sucesso',
          'both': 'PDF completo (tabela + fichas) exportado com sucesso'
        };
        
        toast.success(pdfMessages[pdfType || 'both']);
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

  return {
    // Estados
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