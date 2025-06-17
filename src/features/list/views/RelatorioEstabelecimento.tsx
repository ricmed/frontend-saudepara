import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { ListaDeEstabelecimentoService } from "@/services/ListaDeEstabelecimentoServ";
import { ArrowLeft, Plus, ChevronDown, ChevronUp, Menu } from "lucide-react";
import { CSVLink } from "react-csv";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Importando componentes
import ExportMenu from "../components/RelatorioEstabelecimento/ExportMenu";
import TableHeader from "../components/RelatorioEstabelecimento/TableHeader";
import TableBody from "../components/RelatorioEstabelecimento/TableBody";
import PaginationControls from "../components/RelatorioEstabelecimento/PaginationControls";
import SearchBar from "../components/RelatorioEstabelecimento/SearchBar";
import ColumnsMenu from "../components/RelatorioEstabelecimento/ColumnsMenu";
import SideMenu from "@/features/home/components/SideMenu";

// Importando tipos e utilitários
import {
  Estabelecimento,
  PaginationMeta,
  SearchParams,
  allColumns,
} from "../types/estabelecimento";
import { formatHabilitacoes } from "../utils/helpers";
import { Language } from "@/i18n/types";

export function RelatorioEstabelecimento() {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const [csvLinkRef, setCsvLinkRef] = useState<any>(null);
  const csvLinkAllRef = useRef<any>(null);  // Estado para controlar o SideMenu
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Estados para o SideMenu
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("pt-BR");

  const resetToFirstPage = () => {
    setCurrentPage(1);
    setTempPage("1");
  };

  // Estados
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>(
    []
  );
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    total: 0,
    totalPages: 1,
    page: 1,
    limit: 10,
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
  const [sortKey, setSortKey] = useState<keyof Estabelecimento>("cidade");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isSortingMenuOpen, setIsSortingMenuOpen] = useState(false);

  // Controle de colunas
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "nome",
    "cnes",
    "cidade",
    "ativo",
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
      const response = await ListaDeEstabelecimentoService.getAllPaginated(
        currentPage,
        itemsPerPage,
        debouncedSearchParams,
        sortKey,
        sortOrder
      );

      if (response && response.data) {
        // Verificar se estamos em uma página válida
        if (response.meta.totalPages > 0 && currentPage > response.meta.totalPages) {
          // Se a página atual for maior que o total de páginas, volte para a página 1
          setCurrentPage(1);
          setTempPage("1");
          setIsLoading(false);
          return; // Interrompe a execução para evitar atualizações desnecessárias
        }

        // Continua normalmente
        setEstabelecimentos(response.data);
        setPaginationMeta(response.meta);
        setTempPage(response.meta.page.toString());
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar estabelecimentos.");
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, [currentPage, itemsPerPage, debouncedSearchParams, sortKey, sortOrder]);

  // Função para buscar todos os dados
  const fetchAllData = async () => {
    try {
      const response = await ListaDeEstabelecimentoService.getAllPaginated(
        1,
        Number.MAX_SAFE_INTEGER,
        debouncedSearchParams,
        sortKey,
        sortOrder
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setError("Erro ao exportar dados. Tente novamente.");
      return null;
    }
  };

  // Funções de manipulação de dados
  const handleDelete = async (id: number) => {
    if (window.confirm("Deseja realmente excluir este estabelecimento?")) {
      try {
        await ListaDeEstabelecimentoService.delete(id);

        // Recarregar os dados após a exclusão
        const response = await ListaDeEstabelecimentoService.getAllPaginated(
          currentPage,
          itemsPerPage,
          debouncedSearchParams,
          sortKey,
          sortOrder
        );

        if (response && response.data) {
          setEstabelecimentos(response.data);
          setPaginationMeta(response.meta);
        }
      } catch (err) {
        console.error(err);
        setError(
          "Não foi possível excluir. Verifique dependências ou tente novamente."
        );
      }
    }
  };

  // Paginação
  const handlePageChange = (newPage: number) => {
    // Garantir que a página nunca seja maior que o total de páginas
    const safeNewPage = Math.min(newPage, paginationMeta.totalPages);

    if (safeNewPage >= 1 && safeNewPage <= paginationMeta.totalPages) {
      setCurrentPage(safeNewPage);
      setTempPage(safeNewPage.toString());
    }
  };
  // Ordenação
  const handleSortChange = (key: keyof Estabelecimento) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
    setIsSortingMenuOpen(false);
  };

  // Colunas
  const handleToggleColumn = async (colKey: string) => {
    // Verificar se estamos ativando uma coluna que precisa de dados extras
    const needsExtraData =
      (colKey === "habilitacoes" || colKey === "qualificacoes") &&
      !selectedColumns.includes(colKey);

    // Atualizar a lista de colunas selecionadas
    if (selectedColumns.includes(colKey)) {
      setSelectedColumns(selectedColumns.filter((key) => key !== colKey));
    } else {
      setSelectedColumns([...selectedColumns, colKey]);

      // Se estamos ativando habilitações ou qualificações, buscar dados adicionais
      if (needsExtraData) {
        setIsLoading(true);
        try {
          // Buscar detalhes para cada estabelecimento na lista atual
          const updatedEstabelecimentos = await Promise.all(
            estabelecimentos.map(async (estab) => {
              try {
                // Buscar detalhes completos do estabelecimento
                const detalhes = await ListaDeEstabelecimentoService.getById(
                  estab.idestabelecimento
                );
                // Retornar estabelecimento com dados adicionais
                return {
                  ...estab,
                  // @ts-ignore
                  estabelecimento_has_tipo_habilitacao:
                    detalhes?.estabelecimento_has_tipo_habilitacao || [],
                  // @ts-ignore
                  estabelecimento_has_tipo_qualificacao:
                    detalhes?.estabelecimento_has_tipo_qualificacao || [],
                };
              } catch (error) {
                console.error(
                  `Erro ao buscar detalhes do estabelecimento ${estab.idestabelecimento}:`,
                  error
                );
                return estab;
              }
            })
          );

          // Atualizar a lista de estabelecimentos com os dados adicionais
          setEstabelecimentos(updatedEstabelecimentos);
        } catch (error) {
          console.error("Erro ao buscar dados adicionais:", error);
          setError("Não foi possível carregar habilitações/qualificações");
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  // Funções de exportação
  const handleExportCSV = async (type: "page" | "all") => {
    try {
      const dataToExport =
        type === "page" ? estabelecimentos : await fetchAllData();
      if (!dataToExport) return;

      const formattedData = dataToExport.map((estab) => ({
        ...estab,
        habilitacoes_texto: formatHabilitacoes(estab),
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
        type === "page" ? estabelecimentos : await fetchAllData();
      if (!dataToExport) return;

      const formattedData = dataToExport.map((estab) => ({
        ...estab,
        habilitacoes_texto: formatHabilitacoes(estab),
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Estabelecimentos");
      XLSX.writeFile(
        workbook,
        `estabelecimentos_${type === "page" ? "pagina_atual" : "completo"}.xlsx`
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
        type === "page" ? estabelecimentos : await fetchAllData();
      if (!dataToExport) return;

      const formattedData = dataToExport.map((estab) => ({
        ...estab,
        habilitacoes_texto: formatHabilitacoes(estab),
      }));

      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Relatório de Estabelecimentos", 14, 15);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 22);
      doc.text(
        `Tipo: ${type === "page" ? "Página Atual" : "Dados Completos"}`,
        14,
        29
      );

      const tableColumn = allColumns
        .filter((col) => selectedColumns.includes(col.key))
        .map((col) => col.label);

      const tableRows = formattedData.map((estab) =>
        allColumns
          .filter((col) => selectedColumns.includes(col.key))
          .map((col) => {
            if (col.key === "habilitacoes") {
              return estab.habilitacoes_texto;
            }
            return estab[col.key]?.toString() || "";
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
          fillColor: [63, 81, 181],
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
        `estabelecimentos_${type === "page" ? "pagina_atual" : "completo"}.pdf`
      );
      setIsExportMenuOpen(false);
    } catch (error) {
      setError("Erro ao gerar PDF. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              {/* Adiciona o botão para abrir o menu lateral */}
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
              <h1 className="text-2xl font-bold">Lista de Estabelecimentos</h1>
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

                <ColumnsMenu
                  isOpen={isColumnsMenuOpen}
                  columns={allColumns}
                  selectedColumns={selectedColumns}
                  onToggleColumn={handleToggleColumn}
                />
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
                    {allColumns.map((col) => (
                      <button
                        key={col.key}
                        onClick={() => handleSortChange(col.key)}
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
                  Exportar
                  {isExportMenuOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                <ExportMenu
                  isOpen={isExportMenuOpen}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onExportPDF={handleExportPDF}
                />
              </div>

              {/* Campo de busca */}
              <SearchBar
                searchParams={searchParams}
                onSearchChange={(newParams) => {
                  // Atualiza os parâmetros de busca
                  setSearchParams(newParams);

                  // Volta para a primeira página (apenas quando o termo muda)
                  if (newParams.term !== searchParams.term) {
                    setCurrentPage(1);
                    setTempPage("1");
                  }
                }}
              />

              {/* Botão Novo */}
              <button
                onClick={() => navigate("/private/relatorio-estabelecimentos/nova")}
                className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Novo
              </button>
            </div>
          </div>
        </div>
      </header>       {/* Adicionar o componente SideMenu */}
       <SideMenu 
         isOpen={isMenuOpen} 
         onClose={() => setIsMenuOpen(false)} 
         selectedLanguage={selectedLanguage}
         onLanguageChange={setSelectedLanguage}
       />

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
                <TableHeader
                  columns={allColumns}
                  selectedColumns={selectedColumns}
                  sortKey={sortKey}
                  sortOrder={sortOrder}
                  onSortChange={handleSortChange}
                />

                <TableBody
                  estabelecimentos={estabelecimentos}
                  isLoading={isLoading}
                  searchTerm={debouncedSearchParams.term}
                  columns={allColumns}
                  selectedColumns={selectedColumns}
                  onEdit={(id) => navigate(`/private/relatorio-estabelecimentos/editar/${id}`)}
                  onDelete={handleDelete}
                />
              </table>
            </div>

            {/* Paginação */}
            <PaginationControls
              paginationMeta={paginationMeta}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              tempPage={tempPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={setItemsPerPage}
              onTempPageChange={setTempPage}
            />
          </div>
        </div>
      </main>

      {/* Links invisíveis para exportação CSV */}
      <CSVLink
        data={estabelecimentos.map((estab) => ({
          ...estab,
          habilitacoes: formatHabilitacoes(estab),
          estabelecimento_has_tipo_habilitacao: undefined,
        }))}
        filename="estabelecimentos_pagina_atual.csv"
        style={{ display: "none" }}
        ref={(ref: any) => setCsvLinkRef(ref)}
      />
      <CSVLink
        data={[]}
        filename="estabelecimentos_completo.csv"
        style={{ display: "none" }}
        ref={csvLinkAllRef}
      />
    </div>
  );
}

export default RelatorioEstabelecimento;
