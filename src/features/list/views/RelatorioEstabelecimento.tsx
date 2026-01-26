import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { ListaDeEstabelecimentoService } from "@/services/ListaDeEstabelecimentoServ";
import { ArrowLeft, Plus, ChevronDown, ChevronUp, Menu, Power } from "lucide-react";
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
import GerenciarAtivacaoModal from "../components/RelatorioEstabelecimento/GerenciarAtivacaoModal";
import { SideMenu } from "@/features/home/components/SideMenu";

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
  const [isModalAtivacaoOpen, setIsModalAtivacaoOpen] = useState(false);
  // Estados para o SideMenu
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("pt-BR");

  // Estado para gerenciar estabelecimentos ativos
  const [estabelecimentosAtivos, setEstabelecimentosAtivos] = useState<number[]>([]);
  
  // Estado para todos os estabelecimentos (para o modal)
  const [todosEstabelecimentos, setTodosEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [isLoadingTodos, setIsLoadingTodos] = useState(false);

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

  // Função para buscar TODOS os estabelecimentos
  const handleOpenModalAtivacao = async () => {
    try {
      setIsLoadingTodos(true);
      // ❌ NÃO abrir o modal ainda - aguardar os dados!
      
      console.log('🔍 Buscando todos os estabelecimentos...');
      
      // Buscar TODOS os estabelecimentos (sem paginação)
      const response = await ListaDeEstabelecimentoService.getAllPaginated(
        1,
        Number.MAX_SAFE_INTEGER, // Busca todos
        { term: '', field: 'all' }, // Sem filtro
        'nome',
        'asc'
      );
      
      if (response && response.data) {
        console.log(`✅ ${response.data.length} estabelecimentos carregados`);
        
        // 🔍 DEBUG: Verificar o que vem no campo ativo
        console.log('🔍 DEBUG - Primeiros 5 estabelecimentos:');
        response.data.slice(0, 5).forEach((est, idx) => {
          console.log(`  ${idx + 1}. ID: ${est.idestabelecimento}, Nome: ${est.nome}, Ativo: "${est.ativo}" (tipo: ${typeof est.ativo})`);
        });
        
        // 🔍 DEBUG: Verificar todos os valores únicos de ativo
        const valoresAtivo = [...new Set(response.data.map(est => est.ativo))];
        console.log('🔍 Valores únicos do campo "ativo":', valoresAtivo);
        
        // Carregar os IDs dos estabelecimentos que estão com ativo = "Sim"
        // IMPORTANTE: O backend retorna "Sim" ou "Não", não "S" ou "N"
        const ativosIds = response.data
          .filter(est => {
            const isAtivo = est.ativo === "Sim";
            if (isAtivo) {
              console.log(`  ✓ Ativo encontrado: ${est.nome} (ID: ${est.idestabelecimento})`);
            }
            return isAtivo;
          })
          .map(est => est.idestabelecimento);
        
        console.log(`🟢 ${ativosIds.length} estabelecimentos ativos (ativo = "Sim")`);
        console.log(`⚫ ${response.data.length - ativosIds.length} estabelecimentos inativos (ativo = "Não")`);
        
        // ✅ ATUALIZAR OS ESTADOS PRIMEIRO
        setTodosEstabelecimentos(response.data);
        setEstabelecimentosAtivos(ativosIds);
        
        // ✅ SÓ AGORA abrir o modal (depois dos dados estarem prontos)
        setIsModalAtivacaoOpen(true);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar estabelecimentos:', error);
      setError('Erro ao carregar estabelecimentos. Tente novamente.');
      setIsModalAtivacaoOpen(false);
    } finally {
      setIsLoadingTodos(false);
    }
  };

  // Função para salvar ativação/desativação
  const handleSaveAtivacao = async (ativosIds: number[]) => {
    try {
      console.log('💾 Salvando estabelecimentos ativos:', ativosIds);
      console.log('📊 Total de estabelecimentos:', todosEstabelecimentos.length);
      console.log('🟢 Serão ativados (ativo = "Sim"):', ativosIds.length);
      console.log('⚫ Serão desativados (ativo = "Não"):', todosEstabelecimentos.length - ativosIds.length);
      
      // TODO: Implementar chamada ao backend para atualizar campo 'ativo'
      // IMPORTANTE: O backend usa "S" e "N" no banco, mas retorna "Sim" e "Não"
      // Será necessário criar um endpoint que:
      // 1. Receba a lista de IDs que devem estar ativos
      // 2. Atualize TODOS os estabelecimentos:
      //    - ativo = "S" para os IDs da lista (banco de dados usa "S")
      //    - ativo = "N" para os demais (banco de dados usa "N")
      //
      // Exemplo:
      // await ListaDeEstabelecimentoService.atualizarAtivacao(ativosIds);
      //
      // Backend deve fazer algo como:
      // UPDATE estabelecimento SET ativo = 'N' WHERE 1=1;
      // UPDATE estabelecimento SET ativo = 'S' WHERE idestabelecimento IN (ativosIds);
      
      // Simulação (remover após implementar backend)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setEstabelecimentosAtivos(ativosIds);
      
      // Recarregar a lista principal
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
      
      alert(`✅ Ativação atualizada com sucesso!\n\n🟢 ${ativosIds.length} ativado(s)\n⚫ ${todosEstabelecimentos.length - ativosIds.length} desativado(s)`);
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      throw error;
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
        {/* Painel de Gerenciamento de Ativação */}
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Power className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Gerenciar Ativação de Estabelecimentos
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  {estabelecimentosAtivos.length > 0 
                    ? `${estabelecimentosAtivos.length} estabelecimento(s) ativo(s)`
                    : 'Nenhum estabelecimento ativado'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={handleOpenModalAtivacao}
              disabled={isLoadingTodos}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Power className="h-4 w-4" />
              {isLoadingTodos ? 'Carregando...' : 'Gerenciar Ativação'}
            </button>
          </div>
        </div>

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

      {/* Modal de Gerenciamento de Ativação */}
      <GerenciarAtivacaoModal
        isOpen={isModalAtivacaoOpen}
        onClose={() => {
          setIsModalAtivacaoOpen(false);
          setTodosEstabelecimentos([]); // Limpar após fechar
        }}
        estabelecimentos={todosEstabelecimentos}
        estabelecimentosAtivos={estabelecimentosAtivos}
        onSave={handleSaveAtivacao}
        isLoadingEstabelecimentos={isLoadingTodos}
      />
    </div>
  );
}

export default RelatorioEstabelecimento;
