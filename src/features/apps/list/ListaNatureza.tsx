import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNaturezas, useDeleteNatureza } from "@/features/apps/hooks/useNatureza";
import { useDebounce } from "@/hooks/useDebounce";
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface TipoNatureza {
  idtipo_natureza: number;
  descricao: string;
}

const ListaNatureza = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");
  const itemsPerPage = 10;

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const { data, isLoading, error } = useNaturezas(currentPage, itemsPerPage, debouncedSearchTerm);
  const deleteMutation = useDeleteNatureza();

  const naturezas = data?.data || [];
  const totalItems = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir esta natureza?")) return;

    deleteMutation.mutate(id, {
      onSuccess: () => {
        // Se ficou sem itens na página atual e não é a primeira página
        if (naturezas.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        }
      },
      onError: (error) => {
        console.error("Erro ao excluir natureza:", error);
        alert("Erro ao excluir a natureza");
      }
    });
  };

  const tableColumns = [
    { header: "Descrição", accessor: "descricao" as keyof TipoNatureza }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ListHeader
        title="Lista de Naturezas"
        searchPlaceholder="Pesquisar naturezas..."
        onSearch={(value) => {
          setInputValue(value);
          setSearchTerm(value);
          setCurrentPage(1); // Reset para primeira página ao pesquisar
        }}
        searchValue={inputValue}
        onNewClick={() => navigate("/private/naturezas/nova")}
        isProcessing={false}
        onMenuOpen={() => setIsMenuOpen(true)}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <DataTable
          data={naturezas}
          columns={tableColumns}
          loading={isLoading}
          error={error ? "Erro ao carregar as naturezas" : null}
          onDismissError={() => {}}
          emptyMessage="Nenhuma natureza cadastrada"
          searchTerm={searchTerm}
          renderActions={(natureza) => (
            <ActionButtons
              onEdit={() => navigate(`/private/naturezas/editar/${natureza.idtipo_natureza}`)}
              onDelete={() => handleDelete(natureza.idtipo_natureza)}
              isProcessing={deleteMutation.isPending}
              itemName={natureza.descricao}
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

export default ListaNatureza;
