import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { PacienteService, Paciente } from "@/services/PacienteService";
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
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
// Atualizando a importação do SideMenu
import { SideMenu } from "@/features/home/components/SideMenu";
// import ModalBuscaPaciente from "@/features/paginaPacientesComu/components/ModalBuscaPaciente";
// import { useLanguage } from "@/contexts/LanguageContext";

// Tipos
interface PaginationMeta {
  total: number;
  pages: number;
  currentPage: number;
  perPage: number;
}

interface SearchParams {
  term: string;
  field: "all" | "nome" | "cpf" | "nome_mae";
}

interface ColumnDefinition {
  key: keyof Paciente | string;
  label: string;
  sortable?: boolean;
}

// Adicione esta função ao seu componente
const formatPhoneNumber = (phone: string | null | undefined) => {
  if (!phone) return "";

  // Remove todos os caracteres não numéricos
  const cleaned = phone.replace(/\D/g, "");

  // DDIs mais comuns
  const ddiPatterns = [
    { ddi: "55", country: "BR", lengths: [10, 11] }, // Brasil
    { ddi: "1", country: "US", lengths: [10] }, // EUA/Canadá
    { ddi: "351", country: "PT", lengths: [9] }, // Portugal
    { ddi: "34", country: "ES", lengths: [9] }, // Espanha
    { ddi: "44", country: "GB", lengths: [10] }, // Reino Unido
    { ddi: "49", country: "DE", lengths: [10, 11] }, // Alemanha
    { ddi: "33", country: "FR", lengths: [9] }, // França
    { ddi: "39", country: "IT", lengths: [9, 10] }, // Itália
    { ddi: "81", country: "JP", lengths: [10] }, // Japão
    { ddi: "86", country: "CN", lengths: [11] }, // China
    { ddi: "91", country: "IN", lengths: [10] }, // Índia
    // Você pode adicionar mais países conforme necessário
  ];

  // Ordenamos do DDI mais longo para o mais curto para evitar detecções parciais erradas
  ddiPatterns.sort((a, b) => b.ddi.length - a.ddi.length);

  // Tenta identificar o DDI
  let foundPattern = null;
  let nationalNumber = cleaned;

  for (const pattern of ddiPatterns) {
    if (cleaned.startsWith(pattern.ddi)) {
      const possibleNationalNumber = cleaned.substring(pattern.ddi.length);
      if (pattern.lengths.includes(possibleNationalNumber.length)) {
        foundPattern = pattern;
        nationalNumber = possibleNationalNumber;
        break;
      }
    }
  }

  // Se encontrou um DDI válido
  if (foundPattern) {
    // Formatação específica para o Brasil
    if (foundPattern.country === "BR") {
      if (nationalNumber.length === 11) {
        // Celular
        return `+${foundPattern.ddi} (${nationalNumber.slice(0, 2)}) ${nationalNumber.slice(2, 7)}-${nationalNumber.slice(7)}`;
      } else if (nationalNumber.length === 10) {
        // Fixo
        return `+${foundPattern.ddi} (${nationalNumber.slice(0, 2)}) ${nationalNumber.slice(2, 6)}-${nationalNumber.slice(6)}`;
      }
    }
    // EUA/Canadá
    else if (foundPattern.country === "US") {
      return `+${foundPattern.ddi} (${nationalNumber.slice(0, 3)}) ${nationalNumber.slice(3, 6)}-${nationalNumber.slice(6)}`;
    }
    // Reino Unido
    else if (foundPattern.country === "GB") {
      return `+${foundPattern.ddi} ${nationalNumber.slice(0, 4)} ${nationalNumber.slice(4)}`;
    }

    // Formato genérico para outros países
    return `+${foundPattern.ddi} ${nationalNumber}`;
  }

  // Se não tiver DDI, assume formato brasileiro
  if (cleaned.length === 11) {
    // Celular brasileiro com DDD
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    // Fixo brasileiro com DDD
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 9 && cleaned.startsWith("9")) {
    // Celular sem DDD
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  } else if (cleaned.length === 8) {
    // Fixo sem DDD
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }

  // Retorna como está se não encaixar em nenhum padrão
  return phone;
};

// Colunas disponíveis para exibição
const allColumns: ColumnDefinition[] = [
  { key: "nome", label: "Nome", sortable: true },
  { key: "nome_mae", label: "Nome da Mãe", sortable: false },
  { key: "data_nascimento", label: "Data Nascimento", sortable: false },
  { key: "cpf", label: "CPF", sortable: false },
  { key: "tipo_genero", label: "Gênero", sortable: false },
  { key: "tipo_raca", label: "Raça/Cor", sortable: false },
  { key: "tipo_escolaridade", label: "Escolaridade", sortable: false },
  { key: "contato", label: "Contato", sortable: false },
];

const ListaPacientes = () => {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  // Adicionando contexto de idioma
  // Não utilizado no momento mas mantido para compatibilidade futura

  // Estado para controlar o SideMenu
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Estado para controlar o Modal de busca avançada (temporariamente removido)
  // const [isBuscaModalOpen, setIsBuscaModalOpen] = useState(false);

  // Estados principais
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [allPacientes, setAllPacientes] = useState<Paciente[]>([]);
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
  const [isUsingLocalSort, setIsUsingLocalSort] = useState(false);
  // Ordenação
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  // Removendo o menu de ordenação
  const [isColumnsMenuOpen, setIsColumnsMenuOpen] = useState(false);

  // Controle de colunas - removendo CPF e adicionando nome_mae
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "nome",
    "nome_mae",
    "data_nascimento",
    "contato",
  ]);

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
        setIsExportMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Função para buscar todos os dados
  const fetchAllData = async (): Promise<Paciente[]> => {
    try {
      setError(null);

      let allPacientes: Paciente[] = [];
      let page = 1;
      let hasMore = true;
      const LARGE_PAGE_SIZE = 500; // Usar um tamanho de página grande para reduzir o número de requisições

      // Buscar todas as páginas
      while (hasMore) {
        const response = await PacienteService.getAll(page, LARGE_PAGE_SIZE);

        if (response && response.data && response.data.length > 0) {
          allPacientes = [...allPacientes, ...response.data];

          if (
            page >= response.pagination.pages ||
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

      return allPacientes;
    } catch (error) {
      console.error("Erro ao buscar todos os dados:", error);
      setError("Erro ao buscar todos os pacientes para ordenação.");
      return [];
    }
  };

  // Carregar dados
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Se estamos usando ordenação local e temos todos os dados
        if (isUsingLocalSort && allPacientes.length > 0) {
          // Aplicar paginação manualmente
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          setPacientes(allPacientes.slice(startIndex, endIndex));

          // Já temos a paginação calculada, então não precisamos fazer mais nada
          setIsLoading(false);
          return;
        }

        // Caso contrário, usar a API normal com paginação do backend
        let response;
        if (
          debouncedSearchParams.term &&
          debouncedSearchParams.term.length >= 3
        ) {
          response = await PacienteService.search(
            debouncedSearchParams.term,
            currentPage,
            itemsPerPage
          );
        } else {
          response = await PacienteService.getAll(currentPage, itemsPerPage);
        }

        if (response && response.data) {
          // Verificar se estamos em uma página válida
          if (
            response.pagination.pages > 0 &&
            currentPage > response.pagination.pages
          ) {
            setCurrentPage(1);
            setTempPage("1");
            setIsLoading(false);
            return;
          }

          // Ordenar os dados da página atual
          const sortedData = [...response.data].sort((a, b) => {
            const valueA = (a.nome || "").toLowerCase();
            const valueB = (b.nome || "").toLowerCase();

            if (sortOrder === "asc") {
              return valueA.localeCompare(valueB, "pt-BR");
            } else {
              return valueB.localeCompare(valueA, "pt-BR");
            }
          });

          setPacientes(sortedData);
          setPaginationMeta({
            total: response.pagination.total,
            pages: response.pagination.pages,
            currentPage: response.pagination.currentPage,
            perPage: response.pagination.perPage,
          });
          setTempPage(response.pagination.currentPage.toString());
        }
      } catch (err) {
        console.error("Erro ao carregar pacientes:", err);
        setError("Erro ao carregar pacientes. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentPage, itemsPerPage, debouncedSearchParams, isUsingLocalSort]);

  // Atualizar paginação quando mudar a página ou itens por página
  useEffect(() => {
    if (allPacientes.length > 0) {
      // Verificar se a página atual é válida
      const totalPages = Math.ceil(allPacientes.length / itemsPerPage);

      let newPage = currentPage;
      if (totalPages > 0 && currentPage > totalPages) {
        newPage = 1;
        setCurrentPage(1);
        setTempPage("1");
      }

      // Aplicar paginação
      const startIndex = (newPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setPacientes(allPacientes.slice(startIndex, endIndex));

      // Atualizar metadados de paginação
      setPaginationMeta({
        total: allPacientes.length,
        pages: totalPages,
        currentPage: newPage,
        perPage: itemsPerPage,
      });
    }
  }, [currentPage, itemsPerPage, allPacientes]);

  // Funções de manipulação de dados
  const handleDelete = async (id: number) => {
    if (window.confirm("Deseja realmente excluir este paciente?")) {
      try {
        await PacienteService.delete(id);

        // Recarregar os dados após a exclusão
        const response = await PacienteService.getAll(
          currentPage,
          itemsPerPage
        );

        if (response && response.data) {
          setPacientes(response.data);
          setPaginationMeta({
            total: response.pagination.total,
            pages: response.pagination.pages,
            currentPage: response.pagination.currentPage,
            perPage: response.pagination.perPage,
          });
        }

        // Exibir mensagem de sucesso temporária
        setError(null);
      } catch (err) {
        console.error(err);
        setError(
          "Não foi possível excluir. Verifique se há notificações vinculadas a este paciente."
        );
      }
    }
  };

  // Paginação
  const handlePageChange = (newPage: number) => {
    // Garantir que a página nunca seja maior que o total de páginas
    const safeNewPage = Math.min(newPage, paginationMeta.pages);

    if (safeNewPage >= 1 && safeNewPage <= paginationMeta.pages) {
      // Se estiver usando ordenação local e tivermos todos os dados
      if (isUsingLocalSort && allPacientes.length > 0) {
        setCurrentPage(safeNewPage);
        setTempPage(safeNewPage.toString());

        // Aplicar paginação manualmente
        const startIndex = (safeNewPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setPacientes(allPacientes.slice(startIndex, endIndex));
      }
      // Caso contrário, apenas atualiza a página e deixa o useEffect cuidar do resto
      else {
        setCurrentPage(safeNewPage);
        setTempPage(safeNewPage.toString());
      }
    }
  };

  // Função para ordenar os pacientes
  const handleSortChange = async () => {
    try {
      setIsLoading(true);

      // Alternar a ordem de classificação
      const newSortOrder = sortOrder === "asc" ? "desc" : "asc";
      setSortOrder(newSortOrder);

      // Se ainda não estamos usando ordenação local, carregue todos os pacientes automaticamente
      if (!isUsingLocalSort && allPacientes.length === 0) {
        // Buscar todos os pacientes sem pedir confirmação
        const fetchedPacientes = await fetchAllData();

        if (fetchedPacientes.length > 0) {
          // Ordenar todos os pacientes
          const sortedData = [...fetchedPacientes].sort((a, b) => {
            const valueA = (a.nome || "").toLowerCase();
            const valueB = (b.nome || "").toLowerCase();

            if (newSortOrder === "asc") {
              return valueA.localeCompare(valueB, "pt-BR");
            } else {
              return valueB.localeCompare(valueA, "pt-BR");
            }
          });

          // Atualizar o estado com todos os pacientes ordenados
          setAllPacientes(sortedData);

          // Aplicar paginação manualmente
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          setPacientes(sortedData.slice(startIndex, endIndex));

          // Atualizar metadados de paginação
          setPaginationMeta({
            total: sortedData.length,
            pages: Math.ceil(sortedData.length / itemsPerPage),
            currentPage: currentPage,
            perPage: itemsPerPage,
          });

          // Ativar modo de ordenação local
          setIsUsingLocalSort(true);
        }
      }
      // Se já temos todos os pacientes e estamos no modo de ordenação local
      else if (isUsingLocalSort && allPacientes.length > 0) {
        // Ordenar todos os pacientes
        const sortedData = [...allPacientes].sort((a, b) => {
          const valueA = (a.nome || "").toLowerCase();
          const valueB = (b.nome || "").toLowerCase();

          if (newSortOrder === "asc") {
            return valueA.localeCompare(valueB, "pt-BR");
          } else {
            return valueB.localeCompare(valueA, "pt-BR");
          }
        });

        // Atualizar o estado com todos os pacientes ordenados
        setAllPacientes(sortedData);

        // Aplicar paginação manualmente
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setPacientes(sortedData.slice(startIndex, endIndex));
      }
      // Ordenação apenas da página atual (fallback)
      else {
        const sortedPageData = [...pacientes].sort((a, b) => {
          const valueA = (a.nome || "").toLowerCase();
          const valueB = (b.nome || "").toLowerCase();

          if (newSortOrder === "asc") {
            return valueA.localeCompare(valueB, "pt-BR");
          } else {
            return valueB.localeCompare(valueA, "pt-BR");
          }
        });

        setPacientes(sortedPageData);
      }
    } catch (error) {
      console.error("Erro ao ordenar pacientes:", error);
      setError("Erro ao ordenar pacientes. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };
  // Colunas
  const handleToggleColumn = (colKey: string) => {
    if (selectedColumns.includes(colKey)) {
      setSelectedColumns(selectedColumns.filter((key) => key !== colKey));
    } else {
      setSelectedColumns([...selectedColumns, colKey]);
    }
  };  // Funções de exportação
  const handleExportCSV = async (type: "page" | "all") => {
    try {
      let dataToExport = pacientes;
      
      if (type === "all") {
        if (allPacientes.length === 0) {
          const allData = await fetchAllData();
          dataToExport = allData;
        } else {
          dataToExport = allPacientes;
        }
      }
      
      if (!dataToExport.length) return;

      // Incluir campos disponíveis do paciente
      const formattedData = dataToExport.map((paciente) => ({
        "ID": paciente.idpaciente || "",
        "Nome": paciente.nome || "",
        "Nome da Mãe": paciente.nome_mae || "",
        "Data de Nascimento": formatDate(paciente.data_nascimento),
        "Idade": calculateAge(paciente.data_nascimento),
        "CPF": formatCPF(paciente.cpf),
        "Identidade de Gênero": paciente.tipo_genero?.descricao || "",
        "Raça/Cor": paciente.tipo_raca?.descricao || "",
        "Escolaridade": paciente.tipo_escolaridade?.descricao || "",
        "Contato Telefônico": formatPhoneNumber(paciente.contato)
      }));

      // Criar CSV
      const csvHeader = Object.keys(formattedData[0]).join(",") + "\n";
      const csvContent = formattedData.map(row => 
        Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")
      ).join("\n");
      
      const fullCsv = "\uFEFF" + csvHeader + csvContent;
      
      // Download
      const blob = new Blob([fullCsv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pacientes_completo_${type === "page" ? "pagina_atual" : "todos"}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setIsExportMenuOpen(false);
    } catch (error) {
      setError("Erro ao exportar CSV. Tente novamente.");
    }
  };  // Função de exportação Excel
  const handleExportExcel = async (type: "page" | "all") => {
    try {
      let dataToExport = pacientes;
      
      if (type === "all") {
        if (allPacientes.length === 0) {
          const allData = await fetchAllData();
          dataToExport = allData;
        } else {
          dataToExport = allPacientes;
        }
      }
      
      if (!dataToExport.length) return;

      // Incluir campos disponíveis do paciente
      const formattedData = dataToExport.map((paciente) => ({
        "ID": paciente.idpaciente || "",
        "Nome": paciente.nome || "",
        "Nome da Mãe": paciente.nome_mae || "",
        "Data de Nascimento": formatDate(paciente.data_nascimento),
        "Idade": calculateAge(paciente.data_nascimento),
        "CPF": formatCPF(paciente.cpf),
        "Identidade de Gênero": paciente.tipo_genero?.descricao || "",
        "Raça/Cor": paciente.tipo_raca?.descricao || "",
        "Escolaridade": paciente.tipo_escolaridade?.descricao || "",
        "Contato Telefônico": formatPhoneNumber(paciente.contato)
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      
      // Ajustar largura das colunas
      const columnWidths = [
        { wch: 8 },  // ID
        { wch: 30 }, // Nome
        { wch: 30 }, // Nome da Mãe
        { wch: 15 }, // Data Nascimento
        { wch: 8 },  // Idade
        { wch: 15 }, // CPF
        { wch: 20 }, // Gênero
        { wch: 15 }, // Raça
        { wch: 25 }, // Escolaridade
        { wch: 18 }  // Contato
      ];
      
      worksheet["!cols"] = columnWidths;
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Pacientes");
      XLSX.writeFile(
        workbook,
        `pacientes_completo_${type === "page" ? "pagina_atual" : "todos"}.xlsx`
      );
      setIsExportMenuOpen(false);
    } catch (error) {
      setError("Erro ao exportar Excel. Tente novamente.");
    }
  };  // Função de exportação PDF
  const handleExportPDF = async (type: "page" | "all") => {
    try {
      let dataToExport = pacientes;
      
      if (type === "all") {
        if (allPacientes.length === 0) {
          const allData = await fetchAllData();
          dataToExport = allData;
        } else {
          dataToExport = allPacientes;
        }
      }
      
      if (!dataToExport.length) return;

      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Relatório Completo de Pacientes", 14, 15);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 22);
      doc.text(`Tipo: ${type === "page" ? "Página Atual" : "Dados Completos"}`, 14, 29);

      // Dados organizados em seções para melhor legibilidade no PDF
      dataToExport.forEach((paciente, index) => {
        if (index > 0) {
          doc.addPage();
        }

        let yPos = 40;
        
        // Cabeçalho do paciente
        doc.setFontSize(14);
        doc.setTextColor(63, 81, 181);
        doc.text(`Paciente #${index + 1}: ${paciente.nome || 'Sem nome'}`, 14, yPos);
        yPos += 10;

        // Seção 1: Dados Pessoais
        doc.setFillColor(230, 230, 250);
        doc.rect(14, yPos, 182, 8, "F");
        doc.setFontSize(12);
        doc.setTextColor(63, 81, 181);
        doc.text("DADOS PESSOAIS", 16, yPos + 5.5);
        yPos += 12;

        const dadosPessoais = [
          ["ID", paciente.idpaciente || ""],
          ["Nome", paciente.nome || ""],
          ["Nome da Mãe", paciente.nome_mae || ""],
          ["Data de Nascimento", formatDate(paciente.data_nascimento)],
          ["Idade", calculateAge(paciente.data_nascimento)],
          ["CPF", formatCPF(paciente.cpf)],
          ["Identidade de Gênero", paciente.tipo_genero?.descricao || ""],
          ["Raça/Cor", paciente.tipo_raca?.descricao || ""],
          ["Escolaridade", paciente.tipo_escolaridade?.descricao || ""]
        ];

        autoTable(doc, {
          startY: yPos,
          body: dadosPessoais.filter(([, value]) => value),
          theme: "grid",
          styles: { fontSize: 9, cellPadding: 3 },
          columnStyles: {
            0: { fontStyle: "bold", cellWidth: 50 },
            1: { cellWidth: "auto" }
          },
          margin: { left: 14, right: 14 }
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;

        // Seção 2: Contato
        if (paciente.contato) {
          doc.setFillColor(230, 230, 250);
          doc.rect(14, yPos, 182, 8, "F");
          doc.setTextColor(63, 81, 181);
          doc.text("CONTATO", 16, yPos + 5.5);
          yPos += 12;

          const dadosContato = [
            ["Contato Telefônico", formatPhoneNumber(paciente.contato)]
          ];

          autoTable(doc, {
            startY: yPos,
            body: dadosContato.filter(([, value]) => value),
            theme: "grid",
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
              0: { fontStyle: "bold", cellWidth: 50 },
              1: { cellWidth: "auto" }
            },
            margin: { left: 14, right: 14 }
          });
        }

        // Rodapé
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Paciente ${index + 1} de ${dataToExport.length}`,
          doc.internal.pageSize.getWidth() - 14,
          doc.internal.pageSize.getHeight() - 10,
          { align: "right" }
        );
      });

      doc.save(`pacientes_completo_${type === "page" ? "pagina_atual" : "todos"}.pdf`);
      setIsExportMenuOpen(false);
    } catch (error) {
      setError("Erro ao gerar PDF. Tente novamente.");
    }
  };

  // Formatar data para exibição
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    
    try {
      // Extrair apenas a parte da data (YYYY-MM-DD) sem conversão de timezone
      const dateOnly = dateString.split("T")[0];
      const [year, month, day] = dateOnly.split("-");
      
      // Retornar formatado como DD/MM/YYYY
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "";
    }
  };

  // Calcular idade a partir da data de nascimento
  const calculateAge = (birthdate: string | null | undefined) => {
    if (!birthdate) return "";

    try {
      // Extrair apenas a parte da data (YYYY-MM-DD) sem conversão de timezone
      const dateOnly = birthdate.split("T")[0];
      const [year, month, day] = dateOnly.split("-").map(Number);
      
      const today = new Date();
      let age = today.getFullYear() - year;
      const monthDifference = today.getMonth() + 1 - month; // +1 porque getMonth() retorna 0-11

      if (
        monthDifference < 0 ||
        (monthDifference === 0 && today.getDate() < day)
      ) {
        age--;
      }

      return age;
    } catch (error) {
      console.error("Erro ao calcular idade:", error);
      return "";
    }
  };

  // Formatar CPF
  const formatCPF = (cpf: string | null | undefined) => {
    if (!cpf) return "";
    if (cpf.length !== 11) return cpf;
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  // Selecionar um paciente da busca avançada (temporariamente comentado)
  // const handleSelectPaciente = (paciente: Paciente) => {
  //   navigate(`/private/pacientes/editar/${paciente.idpaciente}`);
  // };

  // Componente para exibir menu de colunas
  const ColumnsMenu = ({ isOpen }: { isOpen: boolean }) => {
    if (!isOpen) return null;

    return (
      <div className="absolute left-0 md:left-0 right-0 md:right-auto mt-2 w-full md:w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2">
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
      <div className="absolute left-0 md:left-0 right-0 md:right-auto mt-2 w-full md:w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-3">
        <div className="flex items-center mb-3">
          <Download className="h-4 w-4 text-blue-600 mr-2" />
          <h3 className="text-sm font-medium text-gray-700">Exportar Dados</h3>
        </div>

        {/* Excel */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2 flex items-center justify-center">
              <span className="text-white text-xs font-bold">E</span>
            </div>
            <span className="text-sm text-gray-700">Excel</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handleExportExcel("page")}
              className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
            >
              Página
            </button>
            <button
              onClick={() => handleExportExcel("all")}
              className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
            >
              Todos
            </button>
          </div>
        </div>

        {/* CSV */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-2 flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="text-sm text-gray-700">CSV</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handleExportCSV("page")}
              className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Página
            </button>
            <button
              onClick={() => handleExportCSV("all")}
              className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Todos
            </button>
          </div>
        </div>

        {/* PDF */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2 flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="text-sm text-gray-700">PDF</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handleExportPDF("page")}
              className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
            >
              Página
            </button>
            <button
              onClick={() => handleExportPDF("all")}
              className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
            >
              Todos
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          {/* Mobile Layout */}
          <div className="block md:hidden">
            {/* Primeira linha: Navegação e título */}
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 hover:bg-blue-700 rounded-full transition-colors"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate("/private/pagina-paciente-ficha")}
                className="p-2 hover:bg-blue-700 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-lg font-bold flex-1">
                Lista de Pacientes
              </h1>
            </div>

            {/* Segunda linha: Botões de ação - apenas ícones */}
            <div className="flex gap-2 overflow-x-auto mb-3">
              {/* Botão Colunas - apenas ícone */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsColumnsMenuOpen(!isColumnsMenuOpen);
                    setIsExportMenuOpen(false);
                  }}
                  className="p-3 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                  title="Colunas"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <ColumnsMenu isOpen={isColumnsMenuOpen} />
              </div>

              {/* Botão Exportar - apenas ícone */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsExportMenuOpen(!isExportMenuOpen);
                    setIsColumnsMenuOpen(false);
                  }}
                  className="p-3 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                  title="Exportar"
                >
                  <Download className="h-5 w-5" />
                </button>
                <ExportMenu isOpen={isExportMenuOpen} />
              </div>

              {/* Botão Nova Paciente - apenas ícone */}
              <button
                onClick={() => navigate("/private/pacientes/nova")}
                className="p-3 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors ml-auto touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Novo Paciente"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            {/* Terceira linha: Busca */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchParams.term}
                  onChange={(e) => {
                    setSearchParams((prev) => ({
                      ...prev,
                      term: e.target.value,
                    }));
                    setCurrentPage(1);
                    setTempPage("1");
                  }}
                  placeholder="Buscar pacientes..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 text-sm"
                />
                {searchParams.term && searchParams.term.length < 3 && (
                  <div className="absolute -bottom-6 left-0 text-xs text-yellow-200">
                    Digite pelo menos 3 caracteres para buscar
                  </div>
                )}
              </div>
              <button
                onClick={() => {/* setIsBuscaModalOpen(true) */}}
                className="p-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors"
                title="Busca avançada"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 hover:bg-blue-700 rounded-full transition-colors"
                aria-label="Abrir menu"
              >
                <Menu className="h-6 w-6" />
              </button>
              <button
                onClick={() => navigate("/private/pagina-paciente-ficha")}
                className="p-2 hover:bg-blue-700 rounded-full transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h1 className="text-2xl font-bold">Lista de Pacientes</h1>
            </div>

            {/* Grupo de botões à direita */}
            <div ref={menuRef} className="flex items-center gap-2 ml-auto">
              {/* Botão Colunas */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsColumnsMenuOpen(!isColumnsMenuOpen);
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

              {/* Botão Exportar */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsExportMenuOpen(!isExportMenuOpen);
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
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchParams.term}
                    onChange={(e) => {
                      setSearchParams((prev) => ({
                        ...prev,
                        term: e.target.value,
                      }));
                      setCurrentPage(1);
                      setTempPage("1");
                    }}
                    placeholder="Buscar pacientes..."
                    className="w-64 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                  />
                  {searchParams.term && searchParams.term.length < 3 && (
                    <div className="absolute -bottom-6 left-0 text-xs text-yellow-600">
                      Digite pelo menos 3 caracteres para buscar
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {/* setIsBuscaModalOpen(true) */}}
                  className="ml-2 p-2 bg-white text-blue-600 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                  title="Busca avançada"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>

              {/* Botão Novo */}
              <button
                onClick={() => navigate("/private/pacientes/nova")}
                className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Novo Paciente
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* SideMenu atualizado */}
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      {/* Conteúdo principal */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
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

          {/* Mobile: Cards Layout */}
          <div className="block md:hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-500">Carregando...</p>
              </div>
            ) : pacientes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>
                  {searchParams.term
                    ? `Nenhum paciente encontrado para "${searchParams.term}"`
                    : "Nenhum paciente cadastrado"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {pacientes.map((paciente) => (
                  <div
                    key={paciente.idpaciente}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() =>
                      navigate(`/private/pacientes/editar/${paciente.idpaciente}`)
                    }
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {paciente.nome || 'Nome não informado'}
                        </h3>
                        <div className="mt-1 text-sm text-gray-600 space-y-1">
                          {paciente.cpf && (
                            <div className="flex items-center">
                              <span className="font-medium mr-2">CPF:</span>
                              <span>{formatCPF(paciente.cpf)}</span>
                            </div>
                          )}
                          {paciente.data_nascimento && (
                            <div className="flex items-center">
                              <span className="font-medium mr-2">Nascimento:</span>
                              <span>{formatDate(paciente.data_nascimento)}</span>
                            </div>
                          )}
                          {paciente.tipo_genero?.descricao && (
                            <div className="flex items-center">
                              <span className="font-medium mr-2">Gênero:</span>
                              <span>{paciente.tipo_genero.descricao}</span>
                            </div>
                          )}
                          {paciente.contato && (
                            <div className="flex items-center">
                              <span className="font-medium mr-2">Contato:</span>
                              <span>{formatPhoneNumber(paciente.contato)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/private/pacientes/editar/${paciente.idpaciente}`);
                          }}
                          className="p-3 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors touch-manipulation"
                          title="Editar"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(paciente.idpaciente!);
                          }}
                          className="p-3 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors touch-manipulation"
                          title="Excluir"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop: Table Layout */}
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-600 text-white">
                  {/* Não deixe espaços entre as tags */}
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
                            {/* Mantém a ordenação apenas para a coluna Nome */}
                            {col.key === "nome" && (
                              <button
                                onClick={handleSortChange}
                                className="ml-1 focus:outline-none text-white"
                                aria-label={
                                  sortOrder === "asc"
                                    ? "Ordenar decrescente"
                                    : "Ordenar crescente"
                                }
                                title={
                                  sortOrder === "asc"
                                    ? "Ordenar decrescente"
                                    : "Ordenar crescente"
                                }
                              >
                                {sortOrder === "asc" ? (
                                  <span>▲</span>
                                ) : (
                                  <span>▼</span>
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
                    <tr>
                      <td
                        colSpan={selectedColumns.length + 1}
                        className="px-6 py-4 text-center"
                      >
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        </div>
                      </td>
                    </tr>
                  ) : pacientes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={selectedColumns.length + 1}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        {searchParams.term
                          ? `Nenhum paciente encontrado para "${searchParams.term}"`
                          : "Nenhum paciente cadastrado"}
                      </td>
                    </tr>
                  ) : (
                    pacientes.map((paciente) => (
                      <tr
                        key={paciente.idpaciente}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() =>
                          navigate(
                            `/private/pacientes/editar/${paciente.idpaciente}`
                          )
                        }
                      >
                        {allColumns
                          .filter((col) => selectedColumns.includes(col.key))
                          .map((col) => {
                            const key = col.key as keyof Paciente;

                            if (key === "nome") {
                              return (
                                <td
                                  key={key}
                                  className="px-6 py-4 whitespace-nowrap"
                                >
                                  <div className="font-medium text-gray-900">
                                    {paciente.nome}
                                  </div>
                                  {calculateAge(paciente.data_nascimento) && (
                                    <div className="text-xs text-gray-500">
                                      {calculateAge(paciente.data_nascimento)}{" "}
                                      anos
                                    </div>
                                  )}
                                </td>
                              );
                            }

                            if (key === "data_nascimento") {
                              return (
                                <td
                                  key={key}
                                  className="px-6 py-4 whitespace-nowrap"
                                >
                                  {formatDate(paciente.data_nascimento)}
                                </td>
                              );
                            }

                            if (key === "cpf") {
                              return (
                                <td
                                  key={key}
                                  className="px-6 py-4 whitespace-nowrap"
                                >
                                  {formatCPF(paciente.cpf)}
                                </td>
                              );
                            }

                            if (key === "tipo_genero") {
                              return (
                                <td
                                  key={key}
                                  className="px-6 py-4 whitespace-nowrap"
                                >
                                  {paciente.tipo_genero?.descricao || ""}
                                </td>
                              );
                            }

                            if (key === "tipo_raca") {
                              return (
                                <td
                                  key={key}
                                  className="px-6 py-4 whitespace-nowrap"
                                >
                                  {paciente.tipo_raca?.descricao || ""}
                                </td>
                              );
                            }

                            if (key === "tipo_escolaridade") {
                              return (
                                <td
                                  key={key}
                                  className="px-6 py-4 whitespace-nowrap"
                                >
                                  {paciente.tipo_escolaridade?.descricao || ""}
                                </td>
                              );
                            }

                            if (key === "contato") {
                              return (
                                <td
                                  key={key}
                                  className="px-6 py-4 whitespace-nowrap"
                                >
                                  {paciente.contato ? (
                                    <span className="font-medium">
                                      {formatPhoneNumber(paciente.contato)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">
                                      Sem contato
                                    </span>
                                  )}
                                </td>
                              );
                            }

                            return (
                              <td
                                key={key}
                                className="px-6 py-4 whitespace-nowrap"
                              >
                                {String(paciente[key] || "")}
                              </td>
                            );
                          })}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div
                            className="flex items-center justify-end space-x-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(
                                  `/private/pacientes/editar/${paciente.idpaciente}`
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
                                handleDelete(paciente.idpaciente!);
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
          </div>

          {/* Paginação */}
            <div className="px-6 py-4 border-t flex flex-wrap items-center justify-between">
              <div className="text-sm text-gray-500">
                Mostrando{" "}
                {pacientes.length > 0
                  ? (currentPage - 1) * itemsPerPage + 1
                  : 0}{" "}
                a {Math.min(currentPage * itemsPerPage, paginationMeta.total)}{" "}
                de {paginationMeta.total} pacientes
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
                  className="mr-4 border border-gray-300 rounded-md text-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800" // Texto escuro
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
                      className="w-12 text-center border border-gray-300 rounded-md text-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800" // Texto escuro
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
      </main>
    </div>
  );
};

export default ListaPacientes;