import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCBOs, useDeleteCBO } from "@/features/apps/hooks/useCBO";
import { useDebounce } from "@/hooks/useDebounce";
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface TipoCBO {
  idtipo_cbo: number;
  codigo: string;
  descricao: string;
}

const ListaCBO = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const itemsPerPage = 10;

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // React Query hooks - substituem TODO o useState + useEffect anterior!
  const { 
    data: response, 
    isLoading, 
    error 
  } = useCBOs(currentPage, itemsPerPage, debouncedSearchTerm);
  
  const deleteMutation = useDeleteCBO();

  // Dados extraídos da resposta
  const cbos = response?.data || [];
  const totalItems = response?.meta?.total || 0;
  const totalPages = Math.min(Math.max(response?.meta?.totalPages || 1, 1), 1000);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir este CBO?")) return;

    console.log('Tentando excluir CBO com ID:', id);
    setProcessingId(id);

    try {
      await deleteMutation.mutateAsync(id);
      console.log('CBO excluído com sucesso!');
      
      // Se não há mais itens na página atual, volta uma página
      if (cbos.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } catch (err) {
      console.error('Erro ao excluir CBO:', err);
      alert('Erro ao excluir o CBO: ' + (err as Error).message);
    } finally {
      setProcessingId(null);
    }
  };

  const tableColumns = [
    { header: "Código", accessor: "codigo" as keyof TipoCBO },
    { header: "Descrição", accessor: "descricao" as keyof TipoCBO }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ListHeader
        title="Lista de CBOs"
        searchPlaceholder="Pesquisar CBOs ou código..."
        onSearch={(value) => {
          setInputValue(value);
          setSearchTerm(value);
          setCurrentPage(1); // Reset para primeira página ao pesquisar
        }}
        searchValue={inputValue}
        onNewClick={() => navigate("/private/cbo/nova")}
        isProcessing={false}
        onMenuOpen={() => setIsMenuOpen(true)}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <DataTable
          data={cbos}
          columns={tableColumns}
          loading={isLoading}
          error={error ? "Erro ao carregar os CBOs" : null}
          onDismissError={() => {}}
          emptyMessage="Nenhum CBO cadastrado"
          searchTerm={searchTerm}
          renderActions={(cbo) => (
            <ActionButtons
              onEdit={() => navigate(`/private/cbo/editar/${cbo.idtipo_cbo}`)}
              onDelete={() => handleDelete(cbo.idtipo_cbo)}
              isProcessing={processingId === cbo.idtipo_cbo}
              itemName={cbo.descricao}
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

export default ListaCBO;
