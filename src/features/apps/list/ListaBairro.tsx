import { useState } from "react";
import { ArrowLeft, Plus, Pencil, Trash, Search, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { useTiposBairro, useDeleteTipoBairro } from "@/features/apps/hooks/useBairro";
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";
import Paginacao from "./paginacao";

const ListaTiposBairro = () => {
  const navigate = useNavigate();
  
  // Estados simples - só UI
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const itemsPerPage = 10;
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // React Query hooks - substituem TODO o useState + useEffect anterior!
  const { 
    data: response, 
    isLoading, 
    error 
  } = useTiposBairro(currentPage, itemsPerPage, debouncedSearchTerm);
  
  const deleteMutation = useDeleteTipoBairro();
  
  // Dados extraídos da resposta
  const tiposBairro = response?.data || [];
  const totalItems = response?.meta?.total || 0;
  const totalPages = Math.min(Math.max(response?.meta?.totalPages || 1, 1), 1000);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir este tipo de bairro?")) return;
    
    try {
      await deleteMutation.mutateAsync(id);
      
      // Se não há mais itens na página atual, volta uma página
      if (tiposBairro.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } catch (err) {
      console.error('Erro ao excluir:', err);
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
              >
                <Menu className="h-6 w-6" />
              </button>

              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-blue-700 rounded-full transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>

              <h1 className="text-2xl font-bold">Tipos de Bairro</h1>
            </div>

            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Pesquisar tipos de bairro..."
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset para primeira página ao pesquisar
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
              />
            </div>

            <button
              onClick={() => navigate("/private/bairro/nova")}
              className="flex items-center gap-2 px-6 py-2 bg-white text-blue-600 rounded-full hover:bg-gray-100 transition-colors shadow-md"
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
            <div className="bg-red-50 text-red-700 p-4 mb-4 flex justify-between items-center">
              <span>Erro ao carregar tipos de bairro</span>
            </div>
          )}

          {isLoading ? (
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
                    {tiposBairro.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-8 py-6 text-center text-gray-500">
                          {searchTerm ? "Nenhum resultado encontrado" : "Nenhum tipo de bairro cadastrado"}
                        </td>
                      </tr>
                    ) : (
                      tiposBairro.map((tipoBairro, index) => (
                        <tr
                          key={tipoBairro.idtipo_bairro}
                          className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}
                        >
                          <td className="px-8 py-4 text-gray-600">
                            {tipoBairro.descricao}
                          </td>
                          <td className="px-8 py-4 text-right">
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() => navigate(`/private/bairro/editar/${tipoBairro.idtipo_bairro}`)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              >
                                <Pencil className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(tipoBairro.idtipo_bairro)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                disabled={deleteMutation.isPending}
                              >
                                {deleteMutation.isPending ? (
                                  <span className="animate-pulse">Excluindo...</span>
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

export default ListaTiposBairro;