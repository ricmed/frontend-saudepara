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
  PaginatedResponse,
} from "@/services/PacienteService";

// Interface para as props do componente
interface ModalBuscaPacienteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPaciente: (paciente: Paciente) => void;
  // Para quando o modal é usado em um formulário de notificação
  notificacaoContext?: boolean;
}

// Componente de modal para busca ou cadastro de pacientes
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

  // Estado para armazenar os dados do formulário do paciente selecionado
  const [formData, setFormData] = useState({
    paciente: "",
    nomeMae: "",
    dataNascimento: "",
    cpf: "",
    identidadeGenero: "",
    raca: "",
    escolaridade: "",
    profissao: "",
    contatoTelefonico: "",
    idade: "",
  });

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

    // Formatar a data de nascimento corretamente
    let formattedDate = "";
    if (paciente.data_nascimento) {
      // Converter para o formato YYYY-MM-DD esperado pelo <input type="date">
      formattedDate = new Date(paciente.data_nascimento)
        .toISOString()
        .split("T")[0];
    }

    // Atualizar o estado interno (opcional, você pode manter ou remover isto)
    setFormData((prev) => ({
      ...prev,
      paciente: paciente.nome,
      nomeMae: paciente.nome_mae || "",
      dataNascimento: formattedDate,
      cpf: paciente.cpf || "",
      identidadeGenero: paciente.tipo_genero_idtipo_genero.toString(),
      raca: paciente.tipo_raca_idtipo_raca.toString(),
      escolaridade: paciente.escolaridade_idescolaridade
        ? paciente.escolaridade_idescolaridade.toString()
        : "",
      profissao: paciente.cbo_idcbo ? paciente.cbo_idcbo.toString() : "",
      contatoTelefonico: paciente.contato || "",
    }));

    // ADICIONE ESTA LINHA: Chamar o callback com o paciente original
    onSelectPaciente(paciente);

    // ADICIONE ESTA LINHA: Fechar o modal após a seleção
    onClose();
  };

  // Criar um novo paciente
  const handleCreatePaciente = () => {
    setModalView("form");
    setError(null);
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
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal panel */}
        <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Modal view: Search */}
          {modalView === "search" && (
            <>
              {/* Modal header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 flex items-center justify-between rounded-t-lg">
                <div className="flex items-center text-white">
                  <UserCircle className="h-6 w-6 mr-2" />
                  <h3 className="text-lg font-medium">
                    {notificacaoContext
                      ? "Selecionar Paciente para Notificação"
                      : "Buscar Paciente"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-white hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded-full p-1"
                  aria-label="Fechar"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Search input */}
              <div className="px-6 py-4 border-b">
                <div className="flex items-center">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Digite o nome, CPF ou nome da mãe"
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() => setSearchTerm("")}
                        aria-label="Limpar busca"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleCreatePaciente}
                    className="ml-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    aria-label="Cadastrar novo paciente"
                  >
                    <Plus className="h-4 w-4" />
                    Novo Paciente
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Digite pelo menos 3 caracteres para buscar
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="px-6 py-3 bg-red-50 border-b border-red-100">
                  <div className="flex items-center text-red-600">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Search results */}
              <div className="px-6 py-4 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Nome
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            CPF
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Data Nasc.
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
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

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                          <button
                            onClick={() =>
                              setCurrentPage((p) => Math.max(p - 1, 1))
                            }
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                              currentPage === 1
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-white text-gray-700 hover:bg-gray-50"
                            } transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                          >
                            Anterior
                          </button>
                          <button
                            onClick={() =>
                              setCurrentPage((p) => Math.min(p + 1, totalPages))
                            }
                            disabled={currentPage === totalPages}
                            className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                              currentPage === totalPages
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-white text-gray-700 hover:bg-gray-50"
                            } transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                          >
                            Próximo
                          </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-gray-700">
                              Mostrando{" "}
                              <span className="font-medium">
                                {(currentPage - 1) * 10 + 1}
                              </span>{" "}
                              a{" "}
                              <span className="font-medium">
                                {Math.min(currentPage * 10, totalResults)}
                              </span>{" "}
                              de{" "}
                              <span className="font-medium">
                                {totalResults}
                              </span>{" "}
                              resultados
                            </p>
                          </div>
                          <div>
                            <nav
                              className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                              aria-label="Pagination"
                            >
                              <button
                                onClick={() =>
                                  setCurrentPage((p) => Math.max(p - 1, 1))
                                }
                                disabled={currentPage === 1}
                                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                                  currentPage === 1
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "text-gray-500 hover:bg-gray-50"
                                } transition-colors focus:outline-none focus:z-10 focus:ring-1 focus:ring-blue-500`}
                                aria-label="Página anterior"
                              >
                                <span className="sr-only">Anterior</span>
                                <ChevronLeft className="h-5 w-5" />
                              </button>

                              {/* Renderizar números das páginas */}
                              {Array.from(
                                { length: Math.min(totalPages, 5) },
                                (_, i) => {
                                  // Lógica para mostrar páginas corretas quando temos muitas páginas
                                  let pageNum = i + 1;
                                  if (totalPages > 5) {
                                    if (currentPage <= 3) {
                                      pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                      pageNum = totalPages - 4 + i;
                                    } else {
                                      pageNum = currentPage - 2 + i;
                                    }
                                  }

                                  return (
                                    <button
                                      key={pageNum}
                                      onClick={() => setCurrentPage(pageNum)}
                                      className={`relative inline-flex items-center px-4 py-2 border ${
                                        currentPage === pageNum
                                          ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                          : "border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
                                      } text-sm font-medium transition-colors focus:outline-none focus:z-10 focus:ring-1 focus:ring-blue-500`}
                                      aria-label={`Página ${pageNum}`}
                                      aria-current={
                                        currentPage === pageNum
                                          ? "page"
                                          : undefined
                                      }
                                    >
                                      {pageNum}
                                    </button>
                                  );
                                }
                              )}

                              <button
                                onClick={() =>
                                  setCurrentPage((p) =>
                                    Math.min(p + 1, totalPages)
                                  )
                                }
                                disabled={currentPage === totalPages}
                                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                                  currentPage === totalPages
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "text-gray-500 hover:bg-gray-50"
                                } transition-colors focus:outline-none focus:z-10 focus:ring-1 focus:ring-blue-500`}
                                aria-label="Próxima página"
                              >
                                <span className="sr-only">Próximo</span>
                                <ChevronRight className="h-5 w-5" />
                              </button>
                            </nav>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : searchTerm.length >= 3 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-2">
                      Nenhum paciente encontrado para "{searchTerm}"
                    </p>
                    <button
                      onClick={handleCreatePaciente}
                      className="inline-flex items-center gap-2 px-4 py-2 mt-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                      Cadastrar Novo Paciente
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>
                      Digite um nome, CPF ou nome da mãe para buscar pacientes
                    </p>
                    <p className="text-sm mt-2">ou</p>
                    <button
                      onClick={handleCreatePaciente}
                      className="inline-flex items-center gap-2 px-4 py-2 mt-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                      Cadastrar Novo Paciente
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Modal view: Form */}
          {modalView === "form" && (
            <div>
              <div className="p-1">
                <button
                  type="button"
                  onClick={handleBackToSearch}
                  className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors focus:outline-none focus:underline"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Voltar para a busca
                </button>
              </div>
              <FormularioPaciente
                isModal={true}
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
