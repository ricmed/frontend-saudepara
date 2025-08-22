import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import FormularioPaciente from "./FormularioPaciente";
import {
  PacienteService,
  Paciente,
} from "@/services/PacienteService";

// Interface para as props do componente
interface ModalBuscaPacienteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPaciente: (paciente: Paciente) => void;
  // Para quando o modal é usado em um formulário de notificação
  notificacaoContext?: boolean;
}

// Componente de modal para busca de pacientes
const ModalBuscaPaciente = ({
  isOpen,
  onClose,
  onSelectPaciente,
  notificacaoContext = false,
}: ModalBuscaPacienteProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Paciente[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Estado para controlar o que é exibido no modal
  const [modalView, setModalView] = useState<"search" | "form">("search");
  
  // Estado para controlar se é um novo paciente
  const [isNewPatientMode, setIsNewPatientMode] = useState(false);

  // Resetar o estado quando o modal é fechado
  useEffect(() => {
    if (!isOpen) {
      // Pequeno delay para não afetar a animação de fechamento do modal
      const timer = setTimeout(() => {
        setSearchTerm("");
        setSearchResults([]);
        setError(null);
        setCurrentPage(1);
        setModalView("search");
        setIsNewPatientMode(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Função para buscar pacientes no backend
  const searchPacientes = async (query: string, page: number = 1) => {
    if (query.length < 3) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await PacienteService.search(query, page, 10);
      setSearchResults(response.data);
      setTotalPages(response.pagination.pages);
      setTotalResults(response.pagination.total);
      setCurrentPage(response.pagination.currentPage);
    } catch (error) {
      console.error("Erro na busca:", error);
      setError(
        error instanceof Error ? error.message : "Erro ao buscar pacientes"
      );
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar quando o termo de pesquisa mudar
  useEffect(() => {
    if (isOpen && searchTerm.length >= 3) {
      const delaySearch = setTimeout(() => {
        searchPacientes(searchTerm, currentPage);
      }, 500);

      return () => clearTimeout(delaySearch);
    } else if (isOpen && searchTerm.length === 0) {
      setSearchResults([]);
      setError(null);
    }
  }, [searchTerm, currentPage, isOpen]);

  // Formatar a data de nascimento
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  // Formatar CPF com máscara
  const formatCPF = (cpf: string | null | undefined) => {
    if (!cpf) return "";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  // Calcular a idade
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

  // Selecionar um paciente e fechar o modal
  const handleSelectPaciente = (paciente: Paciente) => {
    console.log("Paciente selecionado:", paciente); // Para debug
    setIsNewPatientMode(false); // Não é um novo paciente
    onSelectPaciente(paciente);
    onClose();
  };

  // Criar um novo paciente
  const handleCreatePaciente = () => {
    setModalView("form");
    setError(null);
    setIsNewPatientMode(true); // Marcar explicitamente como novo paciente
  };

  // Quando o paciente é salvo no formulário
  const handlePacienteSalvo = (pacienteData: Omit<Paciente, "idpaciente">) => {
    // Integrar com a API para salvar o paciente
    PacienteService.create(pacienteData)
      .then((savedPaciente) => {
        setError(null);
        onSelectPaciente(savedPaciente);
        onClose();
      })
      .catch((error) => {
        setError(
          error instanceof Error ? error.message : "Erro ao salvar paciente"
        );
      });
  };

  // Voltando para a busca
  const handleBackToSearch = () => {
    setModalView("search");
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-2 sm:p-4">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal panel - Responsive sizing */}
        <div className="relative w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-6xl bg-white rounded-lg shadow-xl overflow-hidden">
          
          {/* Modal view: Search */}
          {modalView === "search" && (
            <>
              {/* Modal header - Responsive */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-white min-w-0">
                <UserCircle className="h-5 w-5 sm:h-6 sm:w-6 mr-2 flex-shrink-0" />
                <h3 className="text-sm sm:text-lg font-medium truncate">
                  {notificacaoContext
                    ? "Selecionar Paciente"
                    : "Buscar Paciente"}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="ml-2 text-white hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded-full p-1 touch-manipulation"
                aria-label="Fechar"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>

          {/* Search input - Responsive */}
          <div className="p-4 md:p-6 border-b">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Nome, CPF ou nome da mãe"
                  className="pl-8 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base touch-manipulation"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
                    onClick={() => setSearchTerm("")}
                    aria-label="Limpar busca"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleCreatePaciente}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm sm:text-base touch-manipulation"
                aria-label="Cadastrar novo paciente"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Novo Paciente</span>
                <span className="sm:hidden">Novo</span>
              </button>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-gray-500">
              Digite pelo menos 3 caracteres para buscar
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="px-4 md:px-6 py-3 bg-red-50 border-b border-red-100">
              <div className="flex items-center text-red-600">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Search results - Responsive */}
          <div className="p-4 md:p-6 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                {/* Mobile: Card Layout */}
                <div className="block md:hidden space-y-3">
                  {searchResults.map((paciente) => (
                    <div
                      key={paciente.idpaciente}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all touch-manipulation"
                      onClick={() => handleSelectPaciente(paciente)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {paciente.nome}
                          </h4>
                          {paciente.nome_mae && (
                            <p className="text-sm text-gray-600 mt-1">
                              Mãe: {paciente.nome_mae}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                            {paciente.cpf && (
                              <span className="bg-white px-2 py-1 rounded">
                                CPF: {formatCPF(paciente.cpf)}
                              </span>
                            )}
                            {paciente.data_nascimento && (
                              <span className="bg-white px-2 py-1 rounded">
                                {formatDate(paciente.data_nascimento)} ({calculateAge(paciente.data_nascimento)} anos)
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPaciente(paciente);
                          }}
                          className="ml-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors touch-manipulation"
                          aria-label={`Selecionar paciente ${paciente.nome}`}
                        >
                          Selecionar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop: Table Layout */}
                <div className="hidden md:block">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nome
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          CPF
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data Nasc.
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Idade
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Selecionar</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {searchResults.map((paciente) => (
                        <tr
                          key={paciente.idpaciente}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleSelectPaciente(paciente)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {paciente.nome}
                            </div>
                            {paciente.nome_mae && (
                              <div className="text-xs text-gray-500">
                                Mãe: {paciente.nome_mae}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {formatCPF(paciente.cpf)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {formatDate(paciente.data_nascimento)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {calculateAge(paciente.data_nascimento)} anos
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectPaciente(paciente);
                              }}
                              className="text-blue-600 hover:text-blue-900 transition-colors focus:outline-none focus:underline"
                              aria-label={`Selecionar paciente ${paciente.nome}`}
                            >
                              Selecionar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination - Mobile and Desktop */}
                {totalPages > 1 && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center sm:hidden">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-2 text-sm rounded-md border transition-colors touch-manipulation ${
                          currentPage === 1
                            ? "border-gray-200 text-gray-400 cursor-not-allowed"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Anterior
                      </button>
                      <span className="text-sm text-gray-600">
                        {currentPage} de {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-2 text-sm rounded-md border transition-colors touch-manipulation ${
                          currentPage === totalPages
                            ? "border-gray-200 text-gray-400 cursor-not-allowed"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Próximo
                      </button>
                    </div>
                    <div className="hidden sm:flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Mostrando <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> a{" "}
                          <span className="font-medium">{Math.min(currentPage * 10, totalResults)}</span> de{" "}
                          <span className="font-medium">{totalResults}</span> resultados
                        </p>
                      </div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium transition-colors ${
                            currentPage === 1
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          Página {currentPage} de {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium transition-colors ${
                            currentPage === totalPages
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                )}
              </div>
            ) : searchTerm.length >= 3 ? (
              <div className="text-center py-8 text-gray-500">
                <p>
                  Nenhum paciente encontrado para "{searchTerm}"
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Digite um nome, CPF ou nome da mãe para buscar pacientes</p>
              </div>
            )}
          </div>

            </>
          )}

          {/* Modal view: Form */}
          {modalView === "form" && (
            <div>
              <div className="p-4">
                <button
                  type="button"
                  onClick={handleBackToSearch}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors focus:outline-none focus:underline touch-manipulation"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Voltar para a busca
                </button>
              </div>
              <FormularioPaciente
                key={isNewPatientMode ? "new-patient" : "edit-patient"}
                isModal={true}
                isNewPatient={isNewPatientMode}
                onPacienteSalvo={handlePacienteSalvo}
                onClose={onClose}
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ModalBuscaPaciente;
