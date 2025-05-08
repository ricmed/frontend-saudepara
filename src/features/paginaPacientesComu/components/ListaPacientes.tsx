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
import { CSVLink } from "react-csv";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
// Atualizando a importação do SideMenu
import SideMenu from "@/features/home/components/SideMenu";
import ModalBuscaPaciente from "@/features/paginaPacientesComu/components/ModalBuscaPaciente";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const cleaned = phone.replace(/\D/g, '');
  
  // DDIs mais comuns
  const ddiPatterns = [
    { ddi: '55', country: 'BR', lengths: [10, 11] }, // Brasil
    { ddi: '1', country: 'US', lengths: [10] },      // EUA/Canadá
    { ddi: '351', country: 'PT', lengths: [9] },     // Portugal
    { ddi: '34', country: 'ES', lengths: [9] },      // Espanha
    { ddi: '44', country: 'GB', lengths: [10] },     // Reino Unido
    { ddi: '49', country: 'DE', lengths: [10, 11] }, // Alemanha
    { ddi: '33', country: 'FR', lengths: [9] },      // França
    { ddi: '39', country: 'IT', lengths: [9, 10] },  // Itália
    { ddi: '81', country: 'JP', lengths: [10] },     // Japão
    { ddi: '86', country: 'CN', lengths: [11] },     // China
    { ddi: '91', country: 'IN', lengths: [10] }      // Índia
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
    if (foundPattern.country === 'BR') {
      if (nationalNumber.length === 11) { // Celular
        return `+${foundPattern.ddi} (${nationalNumber.slice(0, 2)}) ${nationalNumber.slice(2, 7)}-${nationalNumber.slice(7)}`;
      } else if (nationalNumber.length === 10) { // Fixo
        return `+${foundPattern.ddi} (${nationalNumber.slice(0, 2)}) ${nationalNumber.slice(2, 6)}-${nationalNumber.slice(6)}`;
      }
    }
    // EUA/Canadá
    else if (foundPattern.country === 'US') {
      return `+${foundPattern.ddi} (${nationalNumber.slice(0, 3)}) ${nationalNumber.slice(3, 6)}-${nationalNumber.slice(6)}`;
    }
    // Reino Unido
    else if (foundPattern.country === 'GB') {
      return `+${foundPattern.ddi} ${nationalNumber.slice(0, 4)} ${nationalNumber.slice(4)}`;
    }
    
    // Formato genérico para outros países
    return `+${foundPattern.ddi} ${nationalNumber}`;
  }
  
  // Se não tiver DDI, assume formato brasileiro
  if (cleaned.length === 11) { // Celular brasileiro com DDD
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) { // Fixo brasileiro com DDD
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 9 && cleaned.startsWith('9')) { // Celular sem DDD
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  } else if (cleaned.length === 8) { // Fixo sem DDD
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
  const [csvLinkRef, setCsvLinkRef] = useState<any>(null);
  const csvLinkAllRef = useRef<any>(null);
  // Adicionando contexto de idioma
  const { selectedLanguage, setSelectedLanguage } = useLanguage();

  // Estado para controlar o SideMenu
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Estado para controlar o Modal de busca avançada
  const [isBuscaModalOpen, setIsBuscaModalOpen] = useState(false);

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
  const [sortKey, setSortKey] = useState<keyof Paciente>("nome");
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
  
          if (page >= response.pagination.pages || response.data.length < LARGE_PAGE_SIZE) {
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
        if (debouncedSearchParams.term && debouncedSearchParams.term.length >= 3) {
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
          if (response.pagination.pages > 0 && currentPage > response.pagination.pages) {
            setCurrentPage(1);
            setTempPage("1");
            setIsLoading(false);
            return;
          }
  
          // Ordenar os dados da página atual
          const sortedData = [...response.data].sort((a, b) => {
            const valueA = (a.nome || '').toLowerCase();
            const valueB = (b.nome || '').toLowerCase();
            
            if (sortOrder === "asc") {
              return valueA.localeCompare(valueB, 'pt-BR');
            } else {
              return valueB.localeCompare(valueA, 'pt-BR');
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
            const valueA = (a.nome || '').toLowerCase();
            const valueB = (b.nome || '').toLowerCase();
            
            if (newSortOrder === "asc") {
              return valueA.localeCompare(valueB, 'pt-BR');
            } else {
              return valueB.localeCompare(valueA, 'pt-BR');
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
          const valueA = (a.nome || '').toLowerCase();
          const valueB = (b.nome || '').toLowerCase();
          
          if (newSortOrder === "asc") {
            return valueA.localeCompare(valueB, 'pt-BR');
          } else {
            return valueB.localeCompare(valueA, 'pt-BR');
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
          const valueA = (a.nome || '').toLowerCase();
          const valueB = (b.nome || '').toLowerCase();
          
          if (newSortOrder === "asc") {
            return valueA.localeCompare(valueB, 'pt-BR');
          } else {
            return valueB.localeCompare(valueA, 'pt-BR');
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
  };

  // Funções de exportação
  const handleExportCSV = (type: "page" | "all") => {
    try {
      const dataToExport = type === "page" ? pacientes : allPacientes;
      if (!dataToExport.length) return;

      // Formatar os dados para CSV usando todas as colunas selecionadas
      const formattedData = dataToExport.map((paciente) => {
        const data: any = {};
        
        allColumns.forEach(col => {
          if (selectedColumns.includes(col.key)) {
            if (col.key === "data_nascimento") {
              data[col.label] = formatDate(paciente.data_nascimento);
            } else if (col.key === "cpf") {
              data[col.label] = formatCPF(paciente.cpf);
            } else if (col.key === "tipo_genero") {
              data[col.label] = paciente.tipo_genero?.descricao || "";
            } else if (col.key === "tipo_raca") {
              data[col.label] = paciente.tipo_raca?.descricao || "";
            } else if (col.key === "tipo_escolaridade") {
              data[col.label] = paciente.tipo_escolaridade?.descricao || "";
            } else if (col.key === "contato") {
              data[col.label] = `${paciente.idpaciente} - ${formatPhoneNumber(paciente.contato)}`;
            } else {
              data[col.label] = paciente[col.key as keyof Paciente] || "";
            }
          }
        });
        
        return data;
      });

      if (type === "page" && csvLinkRef) {
        csvLinkRef.link.click();
      } else if (type === "all" && csvLinkAllRef.current) {
        csvLinkAllRef.current.data = formattedData;
        csvLinkAllRef.current.link.click();
      }
      setIsExportMenuOpen(false);
    } catch (error) {
      setError("Erro ao exportar CSV. Tente novamente.");
    }
  };

  // Função de exportação Excel
  const handleExportExcel = (type: "page" | "all") => {
    try {
      const dataToExport = type === "page" ? pacientes : allPacientes;
      if (!dataToExport.length) return;

      // Formatar os dados para Excel usando todas as colunas selecionadas
      const formattedData = dataToExport.map((paciente) => {
        const data: any = {};
        
        allColumns.forEach(col => {
          if (selectedColumns.includes(col.key)) {
            if (col.key === "data_nascimento") {
              data[col.label] = formatDate(paciente.data_nascimento);
            } else if (col.key === "cpf") {
              data[col.label] = formatCPF(paciente.cpf);
            } else if (col.key === "tipo_genero") {
              data[col.label] = paciente.tipo_genero?.descricao || "";
            } else if (col.key === "tipo_raca") {
              data[col.label] = paciente.tipo_raca?.descricao || "";
            } else if (col.key === "tipo_escolaridade") {
              data[col.label] = paciente.tipo_escolaridade?.descricao || "";
            } else if (col.key === "contato") {
              data[col.label] = `${paciente.idpaciente} - ${formatPhoneNumber(paciente.contato)}`;
            } else {
              data[col.label] = paciente[col.key as keyof Paciente] || "";
            }
          }
        });
        
        return data;
      });

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Pacientes");
      XLSX.writeFile(
        workbook,
        `pacientes_${type === "page" ? "pagina_atual" : "completo"}.xlsx`
      );
      setIsExportMenuOpen(false);
    } catch (error) {
      setError("Erro ao exportar Excel. Tente novamente.");
    }
  };

  // Função de exportação PDF
  const handleExportPDF = (type: "page" | "all") => {
    try {
      const dataToExport = type === "page" ? pacientes : allPacientes;
      if (!dataToExport.length) return;

      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Relatório de Pacientes", 14, 15);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 22);
      doc.text(
        `Tipo: ${type === "page" ? "Página Atual" : "Dados Completos"}`,
        14,
        29
      );

      // Usar todas as colunas disponíveis para PDF
      const tableColumn = allColumns
        .filter((col) => selectedColumns.includes(col.key))
        .map((col) => col.label);

      const tableRows = dataToExport.map((paciente) =>
        allColumns
          .filter((col) => selectedColumns.includes(col.key))
          .map((col) => {
            const key = col.key as keyof Paciente;

            if (key === "data_nascimento") {
              return formatDate(paciente[key] as string);
            }

            if (key === "cpf") {
              return formatCPF(paciente[key] as string | null);
            }

            if (key === "tipo_genero") {
              return paciente.tipo_genero?.descricao || "";
            }

            if (key === "tipo_raca") {
              return paciente.tipo_raca?.descricao || "";
            }

            if (key === "tipo_escolaridade") {
              return paciente.tipo_escolaridade?.descricao || "";
            }
            
            if (key === "contato") {
              return `${paciente.idpaciente} - ${formatPhoneNumber(paciente.contato)}`;
            }

            const value = paciente[key];
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
        `pacientes_${type === "page" ? "pagina_atual" : "completo"}.pdf`
      );
      setIsExportMenuOpen(false);
    } catch (error) {
      setError("Erro ao gerar PDF. Tente novamente.");
    }
  };

  // Formatar data para exibição
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  // Calcular idade a partir da data de nascimento
  const calculateAge = (birthdate: string | null | undefined) => {
    if (!birthdate) return "";

    const birthDate = new Date(birthdate);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  // Formatar CPF
  const formatCPF = (cpf: string | null | undefined) => {
    if (!cpf) return "";
    if (cpf.length !== 11) return cpf;
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  // Selecionar um paciente da busca avançada
  const handleSelectPaciente = (paciente: Paciente) => {
    navigate(`/pacientes/editar/${paciente.idpaciente}`);
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
                onClick={() => navigate("/modulo-pacientes-ficha")}
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

              {/* Removido o botão de Ordenação */}

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
              <div className="relative">
                <div className="flex items-center">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar por nome, CPF ou nome da mãe..."
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
                      className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 text-gray-800" // Garantir texto escuro
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    {searchParams.term && searchParams.term.length < 3 && (
                      <div className="absolute -bottom-6 left-0 text-xs text-yellow-600">
                        Digite pelo menos 3 caracteres para buscar
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setIsBuscaModalOpen(true)}
                    className="ml-2 p-2 bg-white text-blue-600 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                    title="Busca avançada"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Botão Novo */}
              <button
                onClick={() => navigate("/pacientes/cadastro")}
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
        selectedLanguage={selectedLanguage}
        onLanguageChange={(language) => setSelectedLanguage(language)}
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
                                aria-label={sortOrder === "asc" ? "Ordenar decrescente" : "Ordenar crescente"}
                                title={sortOrder === "asc" ? "Ordenar decrescente" : "Ordenar crescente"}
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
                          navigate(`/pacientes/editar/${paciente.idpaciente}`)
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
                                <td key={key} className="px-6 py-4 whitespace-nowrap">
                                  {paciente.contato ? (
                                    <span className="font-medium">{formatPhoneNumber(paciente.contato)}</span>
                                  ) : (
                                    <span className="text-gray-400">Sem contato</span>
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
                                  `/pacientes/editar/${paciente.idpaciente}`
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
        </div>
      </main>

      {/* Modal de busca avançada */}
      <ModalBuscaPaciente
        isOpen={isBuscaModalOpen}
        onClose={() => setIsBuscaModalOpen(false)}
        onSelectPaciente={handleSelectPaciente}
      />

      {/* Links invisíveis para exportação CSV */}
      <CSVLink
        data={pacientes.map((paciente) => {
          const data: any = {};
        
          allColumns.forEach(col => {
            if (selectedColumns.includes(col.key)) {
              if (col.key === "data_nascimento") {
                data[col.label] = formatDate(paciente.data_nascimento);
              } else if (col.key === "cpf") {
                data[col.label] = formatCPF(paciente.cpf);
              } else if (col.key === "tipo_genero") {
                data[col.label] = paciente.tipo_genero?.descricao || "";
              } else if (col.key === "tipo_raca") {
                data[col.label] = paciente.tipo_raca?.descricao || "";
              } else if (col.key === "tipo_escolaridade") {
                data[col.label] = paciente.tipo_escolaridade?.descricao || "";
              } else if (col.key === "contato") {
                data[col.label] = `${paciente.idpaciente} - ${formatPhoneNumber(paciente.contato)}`;
              } else {
                data[col.label] = paciente[col.key as keyof Paciente] || "";
              }
            }
          });
          
          return data;
        })}
        filename="pacientes_pagina_atual.csv"
        style={{ display: "none" }}
        ref={(ref: any) => setCsvLinkRef(ref)}
      />
      <CSVLink
        data={[]}
        filename="pacientes_completo.csv"
        style={{ display: "none" }}
        ref={csvLinkAllRef}
      />
    </div>
  );
};

export default ListaPacientes;