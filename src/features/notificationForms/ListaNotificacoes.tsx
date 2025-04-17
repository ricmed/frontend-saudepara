import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import {
  ArrowLeft,
  Plus,
  ChevronDown,
  ChevronUp,
  Menu,
  Search,
  Download,
  Edit,
  Trash2,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight,
  ChevronFirst,
  ChevronLast,
  X,
} from "lucide-react";
import { CSVLink } from "react-csv";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import SideMenu from "@/features/apps/components/SideMenu";
import { toast } from "react-toastify";
import { NotificacaoService } from "@/services/NotificacaoService";
import {
  exportListToExcel,
  exportListToCSV,
  exportListToPDF,
  ExportOptions,
} from "@/features/notificationForms/components/exportUtilities";
import SearchBar from "@/features/notificationForms/components/SearchBar"; // Adicionar o componente de busca

// Tipos
interface Notificacao {
  // Campos formatados retornados pela API
  id: number;
  paciente: string;
  dataOcorrencia: string;
  tipoAtendimento: string;
  tipoEvento: string;
  tipoEncerramento: string;

  // Campo que contém todos os dados originais detalhados
  original?: {
    idnotificacao: number;
    data_ocorrencia: string;
    data_atendimento?: string;
    paciente: {
      idpaciente: number;
      nome: string;
    };
    tipo_evento: {
      idtipo_evento: number;
      descricao: string;
    };
    tipo_atendimento: {
      idtipo_atendimento: number;
      descricao: string;
    };
    tipo_encerramento: {
      idtipo_encerramento: number;
      descricao: string;
    };
    estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento?: {
      idestabelecimento: number;
      nome: string;
    };
  };

  [key: string]: any; // Para permitir outras propriedades
}

interface PaginationMeta {
  total: number;
  pages: number;
  currentPage: number;
  perPage: number;
}

interface SearchParams {
  term: string;
  field: "all" | "paciente" | "evento" | "atendimento" | "encerramento";
}

interface ColumnDefinition {
  key: string; // Modificado de keyof Notificacao | string para garantir que seja sempre string
  label: string;
  sortable?: boolean;
}

// Colunas disponíveis para exibição - Removida a coluna CBO
const allColumns: ColumnDefinition[] = [
  { key: "paciente", label: "Paciente", sortable: true },
  { key: "tipo_evento", label: "Evento", sortable: true },
  { key: "data_ocorrencia", label: "Data Ocorrência", sortable: true },
  { key: "data_atendimento", label: "Data Atendimento", sortable: true },
  { key: "tipo_atendimento", label: "Tipo Atendimento", sortable: false }, // Não mais ordenável
  { key: "tipo_encerramento", label: "Tipo Encerramento", sortable: false }, // Não mais ordenável
  {
    key: "unidade_notificadora",
    label: "Unidade Notificadora",
    sortable: false,
  },
];

// Campos de busca disponíveis para a dropdown
const searchFields = [
  { value: "all", label: "Todos os campos" },
  { value: "paciente", label: "Paciente" },
  { value: "evento", label: "Evento" },
  { value: "atendimento", label: "Tipo Atendimento" },
  { value: "encerramento", label: "Tipo Encerramento" },
];

const ListaNotificacoes = () => {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const [csvLinkRef, setCsvLinkRef] = useState<any>(null);
  const csvLinkAllRef = useRef<any>(null);

  // Estado para controlar o SideMenu
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Estados principais
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [allNotificacoes, setAllNotificacoes] = useState<Notificacao[]>([]); // Para ordenação local
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
  const [tempPage, setTempPage] = useState("1");
  const [isUsingLocalSort, setIsUsingLocalSort] = useState(false);

  // Ordenação
  const [sortKey, setSortKey] = useState<keyof Notificacao>("data_ocorrencia");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isSortingMenuOpen, setIsSortingMenuOpen] = useState(false);

  // Controle de colunas
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "paciente",
    "tipo_evento",
    "data_ocorrencia",
    "tipo_atendimento",
    "tipo_encerramento",
  ]);
  const [isColumnsMenuOpen, setIsColumnsMenuOpen] = useState(false);

  // Controle de exportação
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Erro e loading
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsColumnsMenuOpen(false);
        setIsSortingMenuOpen(false);
        setIsExportMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Função para buscar todos os dados para ordenação e exportação
  const fetchAllData = async () => {
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
  };

  // Carregar dados
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Se estamos usando ordenação local e temos todos os dados
        if (isUsingLocalSort && allNotificacoes.length > 0) {
          // Aplicar ordenação
          const sortedData = [...allNotificacoes].sort((a, b) => {
            // Função de comparação para diferentes tipos de dados
            const compareValues = (valA: any, valB: any) => {
              // Para datas, converter para objetos Date
              if (typeof valA === 'string' && valA.includes('/') && 
                  typeof valB === 'string' && valB.includes('/')) {
                // Formato data brasileira DD/MM/YYYY
                const partsA = valA.split('/');
                const partsB = valB.split('/');
                
                if (partsA.length === 3 && partsB.length === 3) {
                  const dateA = new Date(+partsA[2], +partsA[1] - 1, +partsA[0]);
                  const dateB = new Date(+partsB[2], +partsB[1] - 1, +partsB[0]);
                  
                  return sortOrder === "asc" 
                    ? dateA.getTime() - dateB.getTime() 
                    : dateB.getTime() - dateA.getTime();
                }
              }
              
              // Para strings
              if (typeof valA === "string" && typeof valB === "string") {
                return sortOrder === "asc"
                  ? valA.localeCompare(valB, "pt-BR")
                  : valB.localeCompare(valA, "pt-BR");
              } else {
                // Para outros tipos
                if (valA < valB) return sortOrder === "asc" ? -1 : 1;
                if (valA > valB) return sortOrder === "asc" ? 1 : -1;
                return 0;
              }
            };

            // Obter os valores para comparação com base na chave de ordenação
            let valueA, valueB;

            // Lógica para acessar diferentes propriedades conforme a chave
            if (sortKey === "paciente") {
              valueA = a.paciente || "";
              valueB = b.paciente || "";
            } else if (sortKey === "tipo_evento") {
              valueA = a.tipoEvento || "";
              valueB = b.tipoEvento || "";
            } else if (sortKey === "data_ocorrencia") {
              valueA = a.dataOcorrencia || "";
              valueB = b.dataOcorrencia || "";
            } else if (sortKey === "data_atendimento") {
              valueA = a.original?.data_atendimento || "";
              valueB = b.original?.data_atendimento || "";
            } else if (sortKey === "tipo_atendimento") {
              valueA = a.tipoAtendimento || "";
              valueB = b.tipoAtendimento || "";
            } else if (sortKey === "tipo_encerramento") {
              valueA = a.tipoEncerramento || "";
              valueB = b.tipoEncerramento || "";
            } else {
              valueA = a[sortKey] || "";
              valueB = b[sortKey] || "";
            }

            return compareValues(valueA, valueB);
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
              setTempPage(safeCurrentPage.toString());
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
            setTempPage("1");
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
            setTempPage((response.meta.page || 1).toString());
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
  }, [currentPage, itemsPerPage, debouncedSearchParams, isUsingLocalSort, sortKey, sortOrder, hasSearched]);

  // Funções de manipulação de dados
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
      setTempPage(safeNewPage.toString());
      
      // Se estiver usando ordenação local, aplicar paginação manualmente
      if (isUsingLocalSort && allNotificacoes.length > 0) {
        const startIndex = (safeNewPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        // Aplicar a ordenação atual
        const sortedData = [...allNotificacoes].sort((a, b) => {
          // Lógica de ordenação aqui (simplificada)
          const valueA = a[sortKey] || "";
          const valueB = b[sortKey] || "";
          return sortOrder === "asc" 
            ? String(valueA).localeCompare(String(valueB)) 
            : String(valueB).localeCompare(String(valueA));
        });
        
        setNotificacoes(sortedData.slice(startIndex, endIndex));
      }
    }
  };

  // Ordenação
  const handleSortChange = async (key: string | keyof Notificacao) => {
    try {
      // Se a coluna não é ordenável, não fazer nada
      const colDef = allColumns.find(col => col.key === key);
      if (colDef && colDef.sortable === false) {
        return;
      }
      
      // Determinar a nova ordem
      const newSortOrder = sortKey === key && sortOrder === "asc" ? "desc" : "asc";
      
      // Se não estamos usando ordenação local ou se é a primeira vez
      if (!isUsingLocalSort || allNotificacoes.length === 0) {
        setIsLoading(true);
        
        // Confirmação para buscar todos os dados (muitos registros podem demorar)
        // No ambiente de produção, você pode decidir se quer mostrar esta confirmação
        // ou fazer a ordenação local automaticamente
        
        // Buscar todos os dados - a função fetchAllData usa getAll com um limite grande
        // para obter todos os registros
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
            const valueA = (a[key as keyof Notificacao] || '').toString().toLowerCase();
            const valueB = (b[key as keyof Notificacao] || '').toString().toLowerCase();
            
            return newSortOrder === "asc" 
              ? valueA.localeCompare(valueB, 'pt-BR')
              : valueB.localeCompare(valueA, 'pt-BR');
          });
          
          setNotificacoes(sortedPageData);
        }
      } else {
        // Simplesmente atualizar as chaves de ordenação quando já temos todos os dados
        setSortKey(key as keyof Notificacao);
        setSortOrder(newSortOrder);
      }
      
      setIsSortingMenuOpen(false);
    } catch (error) {
      console.error("Erro ao ordenar:", error);
      setError("Erro ao ordenar dados. Tente novamente.");
    }
  };

  // Colunas
  const handleToggleColumn = (colKey: string) => {
    if (selectedColumns.includes(colKey)) {
      // Não permitir que remova todas as colunas
      if (selectedColumns.length > 1) {
        setSelectedColumns(selectedColumns.filter((key) => key !== colKey));
      } else {
        toast.warning("É necessário manter pelo menos uma coluna visível");
      }
    } else {
      setSelectedColumns([...selectedColumns, colKey]);
    }
  };

  // Formatar data para exibição
  const formatDate = (dateString: string | null | undefined): string => {
    try {
      if (!dateString) return "";
      
      // Extrair apenas a parte da data (YYYY-MM-DD)
      const datePart = dateString.split('T')[0];
      
      // Dividir em componentes
      const [year, month, day] = datePart.split('-');
      
      // Retornar no formato brasileiro
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return "Data inválida";
    }
  };

  // Função utilitária para ajustar datas para timezone local e formato ISO (YYYY-MM-DD)
  const adjustDatesForExport = (data: any[]) => {
    return data.map(item => {
      const formattedItem = { ...item };
      // Lista de campos de data a ajustar
      const dateFields = [
        'data_ocorrencia',
        'data_atendimento',
        'data_encerramento',
        'data_inicio_sintomas',
        'data_nascimento',
      ];
      dateFields.forEach(field => {
        if (formattedItem[field]) {
          const date = new Date(formattedItem[field]);
          const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
          formattedItem[field] = localDate.toISOString().split('T')[0];
        }
      });
      return formattedItem;
    });
  };

  // Funções de exportação
  const handleExportCSV = async (type: "page" | "all") => {
    try {
      // Mostrar loader ou feedback visual
      setIsLoading(true);

      // Buscar dados - página atual ou todos
      const dataToExport =
        type === "page" ? notificacoes : await fetchAllData();

      if (!dataToExport || dataToExport.length === 0) {
        toast.info("Não há dados para exportar.");
        setIsLoading(false);
        setIsExportMenuOpen(false);
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
        estabelecimentoOptions:
          await NotificacaoService.getEstabelecimentoOptions(),
        encerramentoOptions: await NotificacaoService.getEncerramentoOptions(),
      };

      // Ajustar datas antes de exportar
      const formattedData = adjustDatesForExport(dataToExport);

      // Usar a função de exportação da sua biblioteca
      exportListToCSV(formattedData, options);

      // Feedback para o usuário
      toast.success(`CSV exportado com sucesso`);

      setIsExportMenuOpen(false);
      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao exportar CSV:", error);
      setError("Erro ao exportar CSV. Tente novamente.");
      setIsLoading(false);

      if (error instanceof Error) {
        toast.error(`Erro na exportação: ${error.message}`);
      } else {
        toast.error("Erro na exportação. Tente novamente.");
      }
    }
  };

  // Funções adicionais de exportação permanecem as mesmas...

  // Componente para exibir menu de colunas
  const ColumnsMenu = ({ 
    isOpen, 
    columns, 
    selectedColumns, 
    onToggleColumn 
  }: { 
    isOpen: boolean;
    columns?: ColumnDefinition[];
    selectedColumns?: string[];
    onToggleColumn?: (colKey: string) => void;
  }) => {
    if (!isOpen) return null;

    // Use the passed props if available, otherwise fallback to the parent component state
    const columnsToRender = columns || allColumns;
    const selectedCols = selectedColumns || [];
    const toggleColumn = onToggleColumn || handleToggleColumn;

    return (
      <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2">
        {columnsToRender.map((col) => (
          <div
            key={col.key}
            className="flex items-center p-2 hover:bg-gray-50 rounded"
          >
            <input
              type="checkbox"
              id={`col-${col.key}`}
              checked={selectedCols.includes(col.key)}
              onChange={() => toggleColumn(col.key)}
              className="mr-2"
            />
            <label
              htmlFor={`col-${col.key}`}
              className="text-sm text-gray-700 cursor-pointer"
            >
              {col.label}
            </label>
          </div>
        ))}
      </div>
    );
  };

  // Função de exportação Excel
  const handleExportExcel = async (type: "page" | "all") => {
    try {
      // Mostrar loader ou feedback visual
      setIsLoading(true);

      // Buscar dados - página atual ou todos
      const dataToExport =
        type === "page" ? notificacoes : await fetchAllData();

      if (!dataToExport || dataToExport.length === 0) {
        toast.info("Não há dados para exportar.");
        setIsLoading(false);
        setIsExportMenuOpen(false);
        return;
      }

      // Buscar todas as opções para converter IDs em descrições
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
        estabelecimentoOptions:
          await NotificacaoService.getEstabelecimentoOptions(),
        encerramentoOptions: await NotificacaoService.getEncerramentoOptions(),
      };

      // Ajustar datas antes de exportar
      const formattedData = adjustDatesForExport(dataToExport);

      // Usar a função de exportação da sua biblioteca
      exportListToExcel(formattedData, options);

      // Feedback para o usuário
      toast.success(`Dados exportados com sucesso para Excel`);

      setIsExportMenuOpen(false);
      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      setError("Erro ao exportar Excel. Tente novamente.");
      setIsLoading(false);

      // Feedback específico para o usuário
      if (error instanceof Error) {
        toast.error(`Erro na exportação: ${error.message}`);
      } else {
        toast.error("Erro na exportação. Tente novamente.");
      }
    }
  };

  // Função de exportação PDF
  const handleExportPDF = async (type: "page" | "all") => {
    try {
      // Mostrar loader ou feedback visual
      setIsLoading(true);

      // Buscar dados - página atual ou todos
      const dataToExport =
        type === "page" ? notificacoes : await fetchAllData();

      if (!dataToExport || dataToExport.length === 0) {
        toast.info("Não há dados para exportar.");
        setIsLoading(false);
        setIsExportMenuOpen(false);
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
        estabelecimentoOptions:
          await NotificacaoService.getEstabelecimentoOptions(),
        encerramentoOptions: await NotificacaoService.getEncerramentoOptions(),
      };

      // Ajustar datas antes de exportar
      const formattedData = adjustDatesForExport(dataToExport);

      // Usar a função de exportação da sua biblioteca
      exportListToPDF(formattedData, options);

      // Feedback para o usuário
      toast.success(`PDF exportado com sucesso`);

      setIsExportMenuOpen(false);
      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      setError("Erro ao exportar PDF. Tente novamente.");
      setIsLoading(false);

      if (error instanceof Error) {
        toast.error(`Erro na exportação: ${error.message}`);
      } else {
        toast.error("Erro na exportação. Tente novamente.");
      }
    }
  };

  // Componente para exibir menu de exportação
  const ExportMenu = ({ isOpen }: { isOpen: boolean }) => {
    if (!isOpen) return null;

    return (
      <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2">
        <div className="border-b pb-2 mb-2">
          <h3 className="text-sm font-medium text-gray-700 px-2">
            Página Atual
          </h3>
          <button
            onClick={() => handleExportCSV("page")}
            className="w-full text-left px-2 py-1.5 text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            CSV (página atual)
          </button>
          <button
            onClick={() => handleExportExcel("page")}
            className="w-full text-left px-2 py-1.5 text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Excel (página atual)
          </button>
          <button
            onClick={() => handleExportPDF("page")}
            className="w-full text-left px-2 py-1.5 text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            PDF (página atual)
          </button>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-700 px-2">
            Todos os Dados
          </h3>
          <button
            onClick={() => handleExportCSV("all")}
            className="w-full text-left px-2 py-1.5 text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            CSV (todos os dados)
          </button>
          <button
            onClick={() => handleExportExcel("all")}
            className="w-full text-left px-2 py-1.5 text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Excel (todos os dados)
          </button>
          <button
            onClick={() => handleExportPDF("all")}
            className="w-full text-left px-2 py-1.5 text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            PDF (todos os dados)
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 hover:bg-blue-700 rounded-full transition-colors"
                aria-label="Abrir menu"
              >
                <Menu className="h-6 w-6" />
              </button>
              <button
                onClick={() => navigate("/modulo-pacientes-ficha")}
                className="p-2 hover:bg-blue-700 rounded-full transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h1 className="text-2xl font-bold">
                Lista de Formulários de Comunicação de Caso Cadastrados
              </h1>
            </div>

            {/* Grupo de botões à direita */}
            <div ref={menuRef} className="flex items-center gap-2 ml-auto">
              {/* Botão Colunas */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsColumnsMenuOpen(!isColumnsMenuOpen);
                    setIsSortingMenuOpen(false);
                    setIsExportMenuOpen(false);
                  }}
                  className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  Colunas
                  {isColumnsMenuOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {isColumnsMenuOpen && (
                  <ColumnsMenu 
                    isOpen={isColumnsMenuOpen} 
                    columns={allColumns}
                    selectedColumns={selectedColumns}
                    onToggleColumn={handleToggleColumn}
                  />
                )}
              </div>

              {/* Botão Ordenação */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsSortingMenuOpen(!isSortingMenuOpen);
                    setIsColumnsMenuOpen(false);
                    setIsExportMenuOpen(false);
                  }}
                  className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  Ordenação
                  {isSortingMenuOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {isSortingMenuOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2">
                    {allColumns
                      .filter((col) => col.sortable !== false)
                      .map((col) => (
                        <button
                          key={col.key}
                          onClick={() =>
                            handleSortChange(col.key as keyof Notificacao)
                          }
                          className={`block w-full text-left text-sm ${
                            sortKey === col.key 
                              ? 'text-blue-600 font-medium'
                              : 'text-gray-700' 
                          } hover:bg-gray-50 px-2 py-1 rounded flex items-center justify-between`}
                        >
                          <span>{col.label}</span>
                          {sortKey === col.key && (
                            <span>{sortOrder === "asc" ? "▲" : "▼"}</span>
                          )}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Botão Exportar */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsExportMenuOpen(!isExportMenuOpen);
                    setIsSortingMenuOpen(false);
                    setIsColumnsMenuOpen(false);
                  }}
                  className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                  {isExportMenuOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {isExportMenuOpen && (
                  <ExportMenu isOpen={isExportMenuOpen} />
                )}
              </div>

              {/* Campo de busca */}
              <SearchBar 
                searchParams={searchParams}
                fields={searchFields}
                onSearchChange={(newParams) => {
                  setSearchParams(newParams as SearchParams);
                  
                  // Se o termo for limpo, voltar para a primeira página
                  if (!newParams.term && searchParams.term) {
                    setCurrentPage(1);
                    setTempPage("1");
                  }
                }}
                onSearch={() => {
                  if (searchParams.term.length >= 3) {
                    setCurrentPage(1);
                    setTempPage("1");
                    // Aqui poderíamos acionar manualmente uma busca se necessário
                  } else if (searchParams.term.length > 0) {
                    toast.warning("Digite pelo menos 3 caracteres para buscar");
                  }
                }}
                placeholder="Buscar por paciente, evento ou atendimento..."
              />

              {/* Botão Nova Notificação */}
              <button
                onClick={() => navigate("/formulario-comunicacao/nova")}
                className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Nova Notificação
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* SideMenu */}
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* Conteúdo principal */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="overflow-x-auto">
          <div className="bg-white rounded-xl shadow-md overflow-x-auto">
            {error && (
              <div className="bg-red-50 text-red-700 p-4 mb-4 flex justify-between items-center">
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-red-700 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    {allColumns
                      .filter((col) => selectedColumns.includes(col.key))
                      .map((col) => (
                        <th
                          key={col.key}
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                        >
                          <div className="flex items-center">
                            {col.label}
                            {col.sortable !== false && (
                              <button
                                onClick={() =>
                                  handleSortChange(col.key as keyof Notificacao)
                                }
                                className="ml-1 focus:outline-none text-white"
                                aria-label={sortOrder === "asc" ? "Ordenar decrescente" : "Ordenar crescente"}
                                title={sortOrder === "asc" ? "Ordenar decrescente" : "Ordenar crescente"}
                              >
                                {sortKey === col.key ? (
                                  sortOrder === "asc" ? (
                                    <span>▲</span>
                                  ) : (
                                    <span>▼</span>
                                  )
                                ) : (
                                  <span className="text-blue-200">▼</span>
                                )}
                              </button>
                            )}
                          </div>
                        </th>
                      ))}
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr key="loading-row">
                      <td
                        colSpan={selectedColumns.length + 1}
                        className="px-6 py-4 text-center"
                      >
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        </div>
                      </td>
                    </tr>
                  ) : notificacoes.length === 0 ? (
                    <tr key="empty-message">
                      <td
                        colSpan={selectedColumns.length + 1}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        {searchParams.term
                          ? `Nenhuma notificação encontrada para "${searchParams.term}"`
                          : "Nenhuma notificação cadastrada"}
                      </td>
                    </tr>
                  ) : (
                    notificacoes.map((notificacao) => (
                      <tr
                        key={notificacao.id} // Usando o ID correto
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() =>
                          navigate(
                            `/formulario-comunicacao/editar/${notificacao.id}`
                          )
                        }
                      >
                        {allColumns
                          .filter((col) => selectedColumns.includes(col.key))
                          .map((col) => {
                            const key = col.key;

                            if (key === "paciente") {
                              return (
                                <td
                                  key={key}
                                  className="px-6 py-4 whitespace-nowrap"
                                >
                                  <div className="font-medium text-gray-900">
                                    {notificacao.paciente}
                                  </div>
                                </td>
                              );
                            }

                            if (key === "tipo_evento") {
                              return (
                                <td
                                  key={key}
                                  className="px-6 py-4 whitespace-nowrap"
                                >
                                  {notificacao.tipoEvento}
                                </td>
                              );
                            }

                            if (key === "data_ocorrencia") {
                              return (
                                <td
                                  key={key}
                                  className="px-6 py-4 whitespace-nowrap"
                                >
                                  {notificacao.dataOcorrencia}
                                </td>
                              );
                            }

                            if (key === "tipo_atendimento") {
                              return (
                                <td
                                  key={key}
                                  className="px-6 py-4 whitespace-nowrap"
                                >
                                  {notificacao.tipoAtendimento}
                                </td>
                              );
                            }

                            if (key === "tipo_encerramento") {
                              return (
                                <td
                                  key={key}
                                  className="px-6 py-4 whitespace-nowrap"
                                >
                                  {notificacao.tipoEncerramento}
                                </td>
                              );
                            }

                            if (key === "unidade_notificadora") {
                              return (
                                <td
                                  key={key}
                                  className="px-6 py-4 whitespace-nowrap"
                                >
                                  {notificacao.original
                                    ?.estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento
                                    ?.nome || ""}
                                </td>
                              );
                            }

                            return (
                              <td
                                key={key}
                                className="px-6 py-4 whitespace-nowrap"
                              >
                                {String(notificacao[key] || "")}
                              </td>
                            );
                          })}
                        {/* Botões de ação */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div
                            className="flex items-center justify-end space-x-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(
                                  `/formulario-comunicacao/editar/${notificacao.id}`
                                );
                              }}
                              className="text-blue-600 hover:text-blue-900 flex items-center"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(notificacao.id);
                              }}
                              className="text-red-600 hover:text-red-900 flex items-center"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="px-6 py-4 border-t flex flex-wrap items-center justify-between">
              <div className="text-sm text-gray-500">
                Mostrando{" "}
                {notificacoes.length > 0
                  ? (currentPage - 1) * itemsPerPage + 1
                  : 0}{" "}
                a {Math.min(currentPage * itemsPerPage, paginationMeta.total)}{" "}
                de {paginationMeta.total} notificações
              </div>

              <div className="flex items-center mt-2 sm:mt-0">
                <span className="text-sm text-gray-700 mr-2">
                  Itens por página:
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                    setTempPage("1");
                  }}
                  className="mr-4 border border-gray-300 rounded-md text-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className={`rounded-md p-1 ${
                      currentPage === 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="sr-only">Primeira página</span>
                    <ChevronFirst className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`rounded-md p-1 ${
                      currentPage === 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="sr-only">Página anterior</span>
                    <ArrowLeftIcon className="h-5 w-5" />
                  </button>

                  <div className="flex items-center">
                    <span className="text-sm text-gray-700 mr-1">Página</span>
                    <input
                      type="text"
                      value={tempPage}
                      onChange={(e) =>
                        setTempPage(e.target.value.replace(/\D/g, ""))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && tempPage) {
                          handlePageChange(Number(tempPage));
                        }
                      }}
                      onBlur={() => {
                        if (tempPage) {
                          handlePageChange(Number(tempPage));
                        } else {
                          setTempPage(currentPage.toString());
                        }
                      }}
                      className="w-12 text-center border border-gray-300 rounded-md text-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                    />
                    <span className="text-sm text-gray-700 ml-1">
                      de {paginationMeta.pages}
                    </span>
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= paginationMeta.pages}
                    className={`rounded-md p-1 ${
                      currentPage >= paginationMeta.pages
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="sr-only">Próxima página</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handlePageChange(paginationMeta.pages)}
                    disabled={currentPage >= paginationMeta.pages}
                    className={`rounded-md p-1 ${
                      currentPage >= paginationMeta.pages
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="sr-only">Última página</span>
                    <ChevronLast className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Links invisíveis para exportação CSV */}
      <CSVLink
        data={notificacoes.map((notificacao) => ({
          paciente: notificacao.paciente || "",
          evento: notificacao.tipo_evento?.descricao || "",
          data_ocorrencia: formatDate(notificacao.data_ocorrencia),
          data_atendimento: formatDate(notificacao.data_atendimento),
          tipo_atendimento: notificacao.tipo_atendimento?.descricao || "",
          tipo_encerramento: notificacao.tipo_encerramento?.descricao || "",
          unidade_notificadora:
            notificacao
              .estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento
              ?.nome || "",
        }))}
        filename="notificacoes_pagina_atual.csv"
        style={{ display: "none" }}
        ref={(ref: any) => setCsvLinkRef(ref)}
      />
      <CSVLink
        data={[]}
        filename="notificacoes_completo.csv"
        style={{ display: "none" }}
        ref={csvLinkAllRef}
      />
    </div>
  );
};

export default ListaNotificacoes;