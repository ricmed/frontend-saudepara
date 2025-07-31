import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePublicos, useDeletePublico } from "@/features/apps/hooks/usePublico";
import { useDebounce } from "@/hooks/useDebounce";
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface TipoPublico {
  idtipo_publico: number;
  descricao: string;
}

const ListaPublico = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");
  const itemsPerPage = 10;

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const { data, isLoading, error } = usePublicos(currentPage, itemsPerPage, debouncedSearchTerm);
  const deleteMutation = useDeletePublico();

  const publicos = data?.data || [];
  const totalItems = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir este público?")) return;

    deleteMutation.mutate(id, {
      onSuccess: () => {
        // Se ficou sem itens na página atual e não é a primeira página
        if (publicos.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        }
      },
      onError: (error) => {
        console.error("Erro ao excluir público:", error);
        alert("Erro ao excluir o público");
      }
    });
  };

  const tableColumns = [
    { header: "Descrição", accessor: "descricao" as keyof TipoPublico }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ListHeader
        title="Lista de Públicos"
        searchPlaceholder="Pesquisar públicos..."
        onSearch={(value) => {
          setInputValue(value);
          setSearchTerm(value);
          setCurrentPage(1); // Reset para primeira página ao pesquisar
        }}
        searchValue={inputValue}
        onNewClick={() => navigate("/private/publico/nova")}
        isProcessing={false}
        onMenuOpen={() => setIsMenuOpen(true)}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <DataTable
          data={publicos}
          columns={tableColumns}
          loading={isLoading}
          error={error ? "Erro ao carregar os públicos" : null}
          onDismissError={() => {}}
          emptyMessage="Nenhum público cadastrado"
          searchTerm={searchTerm}
          renderActions={(publico) => (
            <ActionButtons
              onEdit={() => navigate(`/private/publico/editar/${publico.idtipo_publico}`)}
              onDelete={() => handleDelete(publico.idtipo_publico)}
              isProcessing={deleteMutation.isPending}
              itemName={publico.descricao}
            />
          )}
        />

        <Paginacao
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          isProcessing={isLoading}
          onPageChange={setCurrentPage}
        />
      </main>
    </div>
  );
};

export default ListaPublico;
