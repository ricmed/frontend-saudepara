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
} from "lucide-react";
import { CSVLink } from "react-csv";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import SideMenu from "@/features/apps/components/SideMenu";
import { toast } from "react-toastify";
import { NotificacaoService } from "@/services/NotificacaoService";

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
  field: "all" | "paciente" | "evento" | "atendimento";
}

interface ColumnDefinition {
  key: string; // Modificado de keyof Notificacao | string para garantir que seja sempre string
  label: string;
  sortable?: boolean;
}

// Colunas disponíveis para exibição
const allColumns: ColumnDefinition[] = [
  { key: "paciente", label: "Paciente", sortable: true },
  { key: "tipo_evento", label: "Evento", sortable: true },
  { key: "data_ocorrencia", label: "Data Ocorrência", sortable: true },
  { key: "data_atendimento", label: "Data Atendimento", sortable: true },
  { key: "tipo_atendimento", label: "Tipo Atendimento", sortable: true },
  { key: "tipo_encerramento", label: "Tipo Encerramento", sortable: true },
  {
    key: "unidade_notificadora",
    label: "Unidade Notificadora",
    sortable: false,
  },
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

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [tempPage, setTempPage] = useState("1");

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

  // Carregar dados
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log("Buscando notificações...");

        // Buscar dados com base nos parâmetros atuais
        let response;
        if (
          debouncedSearchParams.term &&
          debouncedSearchParams.term.length >= 3
        ) {
          // Se implementado, usar a busca específica
          console.log("Buscando com termo:", debouncedSearchParams.term);
          response = await NotificacaoService.getAll(currentPage, itemsPerPage);
        } else {
          console.log("Buscando todas notificações");
          response = await NotificacaoService.getAll(currentPage, itemsPerPage);
        }

        // Adicione AQUI, após a chamada à API
        console.log("Resposta da API:", response);

        // ADICIONE ESTE LOG para verificar a estrutura exata da resposta
        console.log(
          "Estrutura da resposta completa:",
          JSON.stringify(response, null, 2)
        );

        if (response && response.data) {
          console.log(
            "Quantidade de notificações encontradas:",
            response.data.length
          );
          if (response.data.length > 0) {
            console.log("Primeira notificação:", response.data[0]);
          }

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
  }, [currentPage, itemsPerPage, debouncedSearchParams]);

  // Função para buscar todos os dados para exportação
  const fetchAllData = async () => {
    try {
      setIsLoading(true);

      let allNotificacoes: Notificacao[] = [];
      let page = 1;
      let hasMore = true;

      // Buscar todas as páginas
      while (hasMore) {
        const response = await NotificacaoService.getAll(page, 100);

        if (response && response.data && response.data.length > 0) {
          allNotificacoes = [...allNotificacoes, ...response.data];

          if (page >= response.meta.totalPages) {
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
      setError("Erro ao exportar dados. Tente novamente.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

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
    }
  };

  // Ordenação
  const handleSortChange = (key: string | keyof Notificacao) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key as keyof Notificacao);
      setSortOrder("asc");
    }
    setIsSortingMenuOpen(false);
  };

  // Colunas
  const handleToggleColumn = (colKey: string) => {
    if (selectedColumns.includes(colKey)) {
      setSelectedColumns(selectedColumns.filter((key) => key !== colKey));
    } else {
      setSelectedColumns([...selectedColumns, colKey]);
    }
  };

  // Formatar data para exibição
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  // Funções de exportação
  const handleExportCSV = async (type: "page" | "all") => {
    try {
      const dataToExport =
        type === "page" ? notificacoes : await fetchAllData();
      if (!dataToExport) return;

      // Formatar os dados para CSV
      const formattedData = dataToExport.map((notificacao) => ({
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
      }));

      if (type === "page" && csvLinkRef) {
        csvLinkRef.link.click();
      } else if (csvLinkAllRef.current) {
        csvLinkAllRef.current.data = formattedData;
        csvLinkAllRef.current.link.click();
      }
      setIsExportMenuOpen(false);
    } catch (error) {
      setError("Erro ao exportar CSV. Tente novamente.");
    }
  };

  // Função de exportação Excel
  const handleExportExcel = async (type: "page" | "all") => {
    try {
      const dataToExport =
        type === "page" ? notificacoes : await fetchAllData();
      if (!dataToExport) return;

      // Formatar os dados para Excel
      const formattedData = dataToExport.map((notificacao) => ({
        Paciente: notificacao.paciente || "",
        Evento: notificacao.tipo_evento?.descricao || "",
        "Data Ocorrência": formatDate(notificacao.data_ocorrencia),
        "Data Atendimento": formatDate(notificacao.data_atendimento),
        "Tipo Atendimento": notificacao.tipo_atendimento?.descricao || "",
        "Tipo Encerramento": notificacao.tipo_encerramento?.descricao || "",
        "Unidade Notificadora":
          notificacao
            .estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento
            ?.nome || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Notificações");
      XLSX.writeFile(
        workbook,
        `notificacoes_${type === "page" ? "pagina_atual" : "completo"}.xlsx`
      );
      setIsExportMenuOpen(false);
    } catch (error) {
      setError("Erro ao exportar Excel. Tente novamente.");
    }
  };

  // Função de exportação PDF
  const handleExportPDF = async (type: "page" | "all") => {
    try {
      const dataToExport =
        type === "page" ? notificacoes : await fetchAllData();
      if (!dataToExport) return;

      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Relatório de Notificações", 14, 15);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 22);
      doc.text(
        `Tipo: ${type === "page" ? "Página Atual" : "Dados Completos"}`,
        14,
        29
      );

      const tableColumn = allColumns
        .filter((col) => selectedColumns.includes(col.key as string))
        .map((col) => col.label);

      const tableRows = dataToExport.map((notificacao) =>
        allColumns
          .filter((col) => selectedColumns.includes(col.key))
          .map((col) => {
            const key = String(col.key);

            if (key === "data_ocorrencia" || key === "data_atendimento") {
              return formatDate(notificacao[key] as string);
            }

            if (key === "paciente") {
              return notificacao.paciente || "";
            }

            if (key === "tipo_evento") {
              return notificacao.tipo_evento?.descricao || "";
            }

            if (key === "tipo_atendimento") {
              return notificacao.tipo_atendimento?.descricao || "";
            }

            if (key === "tipo_encerramento") {
              return notificacao.tipo_encerramento?.descricao || "";
            }

            if (key === "unidade_notificadora") {
              return (
                notificacao
                  .estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento
                  ?.nome || ""
              );
            }

            const value = notificacao[key];
            return value !== undefined && value !== null ? String(value) : "";
          })
      );

      // Gera a tabela
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [63, 81, 181], // Cor azul como na imagem fornecida
          textColor: 255,
          fontSize: 8,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      });

      // Rodapé com total
      const finalY = (doc as any).lastAutoTable.finalY || 35;
      doc.text(`Total de registros: ${dataToExport.length}`, 14, finalY + 10);
      doc.save(
        `notificacoes_${type === "page" ? "pagina_atual" : "completo"}.pdf`
      );
      setIsExportMenuOpen(false);
    } catch (error) {
      setError("Erro ao gerar PDF. Tente novamente.");
    }
  };

  // Componente para exibir menu de colunas
  const ColumnsMenu = ({ isOpen }: { isOpen: boolean }) => {
    if (!isOpen) return null;

    return (
      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2">
        {allColumns.map((col) => (
          <div
            key={col.key}
            className="flex items-center p-2 hover:bg-gray-50 rounded"
          >
            <input
              type="checkbox"
              id={`col-${col.key}`}
              checked={selectedColumns.includes(col.key)}
              onChange={() => handleToggleColumn(col.key)}
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

  // Componente para exibir menu de exportação
  const ExportMenu = ({ isOpen }: { isOpen: boolean }) => {
    if (!isOpen) return null;

    return (
      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2">
        <div className="border-b pb-2 mb-2">
          <h3 className="text-sm font-medium text-gray-700 px-2">
            Página Atual
          </h3>
          <button
            onClick={() => handleExportCSV("page")}
            className="w-full text-left text-sm text-gray-700 hover:bg-gray-50 px-2 py-1 rounded"
          >
            CSV
          </button>
          <button
            onClick={() => handleExportExcel("page")}
            className="w-full text-left text-sm text-gray-700 hover:bg-gray-50 px-2 py-1 rounded"
          >
            Excel
          </button>
          <button
            onClick={() => handleExportPDF("page")}
            className="w-full text-left text-sm text-gray-700 hover:bg-gray-50 px-2 py-1 rounded"
          >
            PDF
          </button>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-700 px-2">
            Todos os Dados
          </h3>
          <button
            onClick={() => handleExportCSV("all")}
            className="w-full text-left text-sm text-gray-700 hover:bg-gray-50 px-2 py-1 rounded"
          >
            CSV
          </button>
          <button
            onClick={() => handleExportExcel("all")}
            className="w-full text-left text-sm text-gray-700 hover:bg-gray-50 px-2 py-1 rounded"
          >
            Excel
          </button>
          <button
            onClick={() => handleExportPDF("all")}
            className="w-full text-left text-sm text-gray-700 hover:bg-gray-50 px-2 py-1 rounded"
          >
            PDF
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
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-blue-700 rounded-full transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h1 className="text-2xl font-bold">Lista de Formulários de Comunicação de Caso Cadastrados</h1>
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

                <ColumnsMenu isOpen={isColumnsMenuOpen} />
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
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2">
                    {allColumns
                      .filter((col) => col.sortable !== false)
                      .map((col) => (
                        <button
                          key={col.key}
                          onClick={() =>
                            handleSortChange(col.key as keyof Notificacao)
                          }
                          className="block w-full text-left text-sm text-gray-700 hover:bg-gray-50 px-2 py-1 rounded"
                        >
                          {col.label}
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

                <ExportMenu isOpen={isExportMenuOpen} />
              </div>

              {/* Campo de busca */}
              <div className="relative">
                <div className="flex items-center">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar notificação..."
                      value={searchParams.term}
                      onChange={(e) => {
                        setSearchParams({
                          ...searchParams,
                          term: e.target.value,
                        });
                        if (e.target.value.length === 0) {
                          setCurrentPage(1);
                          setTempPage("1");
                        }
                      }}
                      className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 text-gray-800"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

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
