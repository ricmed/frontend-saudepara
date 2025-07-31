import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRacas, useDeleteRaca } from "../hooks/useRaca";
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface Raca {
  idtipo_raca: number;
  descricao: string;
}

const ListaRaca = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const itemsPerPage = 10;

  const { data: racasData, isLoading, error } = useRacas(currentPage, itemsPerPage, searchTerm);
  const deleteRaca = useDeleteRaca();

  const racas = racasData?.data || [];

  const handleDelete = async (raca: Raca) => {
    if (!confirm(`Tem certeza que deseja excluir a raça/cor "${raca.descricao}"?`)) {
      return;
    }

    console.log('🗑️ Tentando deletar raça:', raca.idtipo_raca);
    setProcessingId(raca.idtipo_raca);

    try {
      await deleteRaca.mutateAsync(raca.idtipo_raca);
      console.log('✅ Raça deletada com sucesso:', raca.idtipo_raca);
    } catch (error: any) {
      console.error('❌ Erro ao deletar raça:', error);
      alert('Erro ao excluir raça/cor: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setProcessingId(null);
    }
  };

  const tableColumns = [
    { header: "Descrição", accessor: "descricao" as keyof Raca },
  ];

  const renderActionButtons = (raca: Raca) => (
    <ActionButtons
      onEdit={() => navigate(`/private/raca/editar/${raca.idtipo_raca}`)}
      onDelete={() => handleDelete(raca)}
      isProcessing={processingId === raca.idtipo_raca}
      itemName="raça/cor"
    />
  );

  return (
    <>
      <ListHeader
        title="Lista de Raças/Cores"
        onMenuOpen={() => setIsMenuOpen(true)}
        onNewClick={() => navigate('/private/raca/nova')}
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por descrição..."
        isProcessing={deleteRaca.isPending}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <div className="container mx-auto p-4">
        <DataTable
          data={racas}
          columns={tableColumns}
          renderActions={renderActionButtons}
          loading={isLoading}
          error={error?.message || null}
          onDismissError={() => {}}
          emptyMessage="Nenhuma raça/cor encontrada"
          searchTerm={searchTerm}
        />

        {/* Paginação */}
        {racasData && racasData.meta.totalPages > 1 && (
          <div className="mt-6">
            <Paginacao
              currentPage={currentPage}
              totalPages={racasData.meta.totalPages}
              totalItems={racasData.meta.total}
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

export default ListaRaca;
