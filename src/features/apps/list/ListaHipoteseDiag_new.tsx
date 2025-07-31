import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHipotesesDiag, useDeleteHipoteseDiag } from "../hooks/useHipoteseDiag";
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface TipoHipoteseDiag {
  idtipo_hipotese_diag: number;
  descricao: string;
}

const ListaTiposHipoteseDiag = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const itemsPerPage = 10;

  const { data: hipotesesData, isLoading, error } = useHipotesesDiag(currentPage, itemsPerPage, searchTerm);
  const deleteHipoteseDiag = useDeleteHipoteseDiag();

  const hipoteses = hipotesesData?.data || [];

  const handleDelete = async (hipotese: TipoHipoteseDiag) => {
    if (!confirm(`Tem certeza que deseja excluir a hipótese diagnóstica "${hipotese.descricao}"?`)) {
      return;
    }

    console.log('🗑️ Tentando deletar hipótese:', hipotese.idtipo_hipotese_diag);
    setProcessingId(hipotese.idtipo_hipotese_diag);

    try {
      await deleteHipoteseDiag.mutateAsync(hipotese.idtipo_hipotese_diag);
      console.log('✅ Hipótese deletada com sucesso:', hipotese.idtipo_hipotese_diag);
    } catch (error: any) {
      console.error('❌ Erro ao deletar hipótese:', error);
      alert('Erro ao excluir hipótese diagnóstica: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setProcessingId(null);
    }
  };

  const tableColumns = [
    { header: "Descrição", accessor: "descricao" as keyof TipoHipoteseDiag },
  ];

  const renderActionButtons = (hipotese: TipoHipoteseDiag) => (
    <ActionButtons
      onEdit={() => navigate(`/private/hipotese-diagnostica/editar/${hipotese.idtipo_hipotese_diag}`)}
      onDelete={() => handleDelete(hipotese)}
      isProcessing={processingId === hipotese.idtipo_hipotese_diag}
      itemName="hipótese diagnóstica"
    />
  );

  return (
    <>
      <ListHeader
        title="Lista de Hipóteses Diagnósticas"
        onMenuOpen={() => setIsMenuOpen(true)}
        onNewClick={() => navigate('/private/hipotese-diagnostica/nova')}
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por descrição..."
        isProcessing={deleteHipoteseDiag.isPending}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <div className="container mx-auto p-4">
        <DataTable
          data={hipoteses}
          columns={tableColumns}
          renderActions={renderActionButtons}
          loading={isLoading}
          error={error?.message || null}
          onDismissError={() => {}}
          emptyMessage="Nenhuma hipótese diagnóstica encontrada"
          searchTerm={searchTerm}
        />

        {/* Paginação */}
        {hipotesesData && hipotesesData.meta.totalPages > 1 && (
          <div className="mt-6">
            <Paginacao
              currentPage={currentPage}
              totalPages={hipotesesData.meta.totalPages}
              totalItems={hipotesesData.meta.total}
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

export default ListaTiposHipoteseDiag;
