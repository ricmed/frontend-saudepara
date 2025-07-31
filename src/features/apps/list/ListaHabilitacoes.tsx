import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHabilitacoes, useDeleteHabilitacao } from "@/features/apps/hooks/useHabilitacao";
import { useDebounce } from "@/hooks/useDebounce";
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface TipoHabilitacao {
  idtipo_habilitacao: number;
  codigo: string;
  descricao: string;
}

const ListaHabilitacoes = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");
  const itemsPerPage = 10;

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // React Query hooks - substituem TODO o useState + useEffect anterior!
  const { 
    data: response, 
    isLoading, 
    error 
  } = useHabilitacoes(currentPage, itemsPerPage, debouncedSearchTerm);
  
  const deleteMutation = useDeleteHabilitacao();

  // Dados extraídos da resposta
  const habilitacoes = response?.data || [];
  const totalItems = response?.meta?.total || 0;
  const totalPages = Math.min(Math.max(response?.meta?.totalPages || 1, 1), 1000);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir esta habilitação?")) return;

    try {
      await deleteMutation.mutateAsync(id);
      
      // Se não há mais itens na página atual, volta uma página
      if (habilitacoes.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  const tableColumns = [
    { header: "Código", accessor: "codigo" as keyof TipoHabilitacao },
    { header: "Descrição", accessor: "descricao" as keyof TipoHabilitacao }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ListHeader
        title="Lista de Habilitações"
        searchPlaceholder="Pesquisar habilitações ou código..."
        onSearch={(value) => {
          setInputValue(value);
          setSearchTerm(value);
          setCurrentPage(1); // Reset para primeira página ao pesquisar
        }}
        searchValue={inputValue}
        onNewClick={() => navigate("/private/habilitacao/nova")}
        isProcessing={false}
        onMenuOpen={() => setIsMenuOpen(true)}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <DataTable
          data={habilitacoes}
          columns={tableColumns}
          loading={isLoading}
          error={error ? "Erro ao carregar as habilitações" : null}
          onDismissError={() => {}}
          emptyMessage="Nenhuma habilitação cadastrada"
          searchTerm={searchTerm}
          renderActions={(hab) => (
            <ActionButtons
              onEdit={() => navigate(`/private/habilitacao/editar/${hab.idtipo_habilitacao}`)}
              onDelete={() => handleDelete(hab.idtipo_habilitacao)}
              isProcessing={deleteMutation.isPending}
              itemName={hab.descricao}
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

export default ListaHabilitacoes;
