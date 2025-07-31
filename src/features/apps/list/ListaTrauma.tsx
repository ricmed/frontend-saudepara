import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTraumas, useDeleteTrauma } from "../hooks/useTrauma";
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface Trauma {
  idtipo_trauma: number;
  descricao: string;
}

const ListaTrauma = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const itemsPerPage = 10;

  const { data: traumasData, isLoading, error } = useTraumas(currentPage, itemsPerPage, searchTerm);
  const deleteTrauma = useDeleteTrauma();

  const traumas = traumasData?.data || [];

  const handleDelete = async (trauma: Trauma) => {
    if (!confirm(`Tem certeza que deseja excluir o trauma "${trauma.descricao}"?`)) {
      return;
    }

    console.log('🗑️ Tentando deletar trauma:', trauma.idtipo_trauma);
    setProcessingId(trauma.idtipo_trauma);

    try {
      await deleteTrauma.mutateAsync(trauma.idtipo_trauma);
      console.log('✅ Trauma deletado com sucesso:', trauma.idtipo_trauma);
    } catch (error: any) {
      console.error('❌ Erro ao deletar trauma:', error);
      alert('Erro ao excluir trauma: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setProcessingId(null);
    }
  };

  const tableColumns = [
    { header: "Descrição", accessor: "descricao" as keyof Trauma },
  ];

  const renderActionButtons = (trauma: Trauma) => (
    <ActionButtons
      onEdit={() => navigate(`/private/trauma/editar/${trauma.idtipo_trauma}`)}
      onDelete={() => handleDelete(trauma)}
      isProcessing={processingId === trauma.idtipo_trauma}
      itemName="trauma"
    />
  );

  return (
    <>
      <ListHeader
        title="Lista de Traumas"
        onMenuOpen={() => setIsMenuOpen(true)}
        onNewClick={() => navigate('/private/trauma/nova')}
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por descrição..."
        isProcessing={deleteTrauma.isPending}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <div className="container mx-auto p-4">
        <DataTable
          data={traumas}
          columns={tableColumns}
          renderActions={renderActionButtons}
          loading={isLoading}
          error={error?.message || null}
          onDismissError={() => {}}
          emptyMessage="Nenhum trauma encontrado"
          searchTerm={searchTerm}
        />

        {/* Paginação */}
        {traumasData && traumasData.meta.totalPages > 1 && (
          <div className="mt-6">
            <Paginacao
              currentPage={currentPage}
              totalPages={traumasData.meta.totalPages}
              totalItems={traumasData.meta.total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              isProcessing={isLoading}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default ListaTrauma;
