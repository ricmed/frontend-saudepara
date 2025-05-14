import { useState, useEffect, useRef } from "react";
import {  ArrowLeft,  Plus,  Pencil,  Trash,  Search,  Menu,} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ComponentsService } from "@/services/ComponentsService";
import { useDebounce } from "@/hooks/useDebounce";
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";
import Paginacao from "./paginacao";

interface Componente {
  idcomponente: number;
  descricao: string;
}

interface PaginatedResponse {
  data: Componente[];
  meta: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

const ListaComponentes = () => {
  const navigate = useNavigate();
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const itemsPerPage = 10;
  const isMounted = useRef(false);
  const isSearchFetch = useRef(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm) {
      isSearchFetch.current = true;
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const carregarComponentes = async () => {
      try {
        if (!isSearchFetch.current && isMounted.current) setLoading(true);

        const response = (await ComponentsService.getAllPaginated(
          currentPage,
          itemsPerPage,
          debouncedSearchTerm
        )) as PaginatedResponse;

        if (isMounted.current) {
          setComponentes(response.data);
          setTotalItems(response.meta.total || 0);
          setTotalPages(
            Math.min(Math.max(response.meta.totalPages || 1, 1), 1000)
          );
        }
      } catch (err) {
        if (isMounted.current) {
          setError("Erro ao carregar componentes");
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
          isSearchFetch.current = false;
        }
      }
    };

    carregarComponentes();
  }, [currentPage, debouncedSearchTerm]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir este componente?")) return;

    try {
      setProcessingId(id);
      await ComponentsService.delete(id);

      setComponentes((prev) => {
        const newData = prev.filter((item) => item.idcomponente !== id);
        if (newData.length === 0 && currentPage > 1) {
          setCurrentPage((prevPage) => prevPage - 1);
        }
        return newData;
      });
    } catch (err) {
      setError("Erro ao excluir o componente");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-1">
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
                aria-label="Voltar"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>

              <h1 className="text-2xl font-bold">Lista de Componentes</h1>
            </div>

            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Pesquisar componentes..."
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setSearchTerm(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                autoComplete="off"
                aria-label="Campo de pesquisa"
              />
            </div>

            <button
              onClick={() => navigate("/private/componente/nova")}
              className="flex items-center gap-2 px-6 py-2 bg-white text-blue-600 rounded-full hover:bg-gray-100 transition-colors shadow-md"
              aria-label="Novo componente"
            >
              <Plus className="h-5 w-5" />
              Novo
            </button>
          </div>
        </div>
      </header>

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 mb-4 flex justify-between items-center animate-fade-in">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-700 hover:text-red-800"
                aria-label="Fechar erro"
              >
                ×
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-8 py-4 text-left text-sm font-semibold text-blue-600 uppercase">
                        Descrição
                      </th>
                      <th className="px-8 py-4 text-right text-sm font-semibold text-blue-600 uppercase">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {componentes.length === 0 ? (
                      <tr>
                        <td
                          colSpan={2}
                          className="px-8 py-6 text-center text-gray-500"
                        >
                          {searchTerm
                            ? "Nenhum resultado encontrado"
                            : "Nenhum componente cadastrado"}
                        </td>
                      </tr>
                    ) : (
                      componentes.map((componente, index) => (
                        <tr
                          key={componente.idcomponente}
                          className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}
                        >
                          <td className="px-8 py-4 text-gray-600">
                            {componente.descricao}
                          </td>
                          <td className="px-8 py-4 text-right">
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() =>
                                  navigate(
                                    `/private/componente/editar/${componente.idcomponente}`
                                  )
                                }
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                disabled={processingId === componente.idcomponente}
                                aria-label={`Editar ${componente.descricao}`}
                              >
                                <Pencil className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDelete(componente.idcomponente)
                                }
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                disabled={processingId === componente.idcomponente}
                                aria-label={`Excluir ${componente.descricao}`}
                              >
                                {processingId === componente.idcomponente ? (
                                  <span className="animate-pulse">
                                    Excluindo...
                                  </span>
                                ) : (
                                  <Trash className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Paginacao
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                isProcessing={false}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ListaComponentes;