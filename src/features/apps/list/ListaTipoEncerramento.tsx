import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTiposEncerramento, useDeleteTipoEncerramento } from "../hooks/useTipoEncerramento";
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface TipoEncerramento {
  idtipo_encerramento: number;
  descricao: string;
}

const ListaTiposEncerramento = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const itemsPerPage = 10;

  const { data: tiposEncerramentoData, isLoading, error } = useTiposEncerramento(currentPage, itemsPerPage, searchTerm);
  const deleteTipoEncerramento = useDeleteTipoEncerramento();

  const tiposEncerramento = tiposEncerramentoData?.data || [];

  const handleDelete = async (tipoEncerramento: TipoEncerramento) => {
    if (!confirm(`Tem certeza que deseja excluir o tipo de encerramento "${tipoEncerramento.descricao}"?`)) {
      return;
    }

    console.log('🗑️ Tentando deletar tipo de encerramento:', tipoEncerramento.idtipo_encerramento);
    setProcessingId(tipoEncerramento.idtipo_encerramento);

    try {
      await deleteTipoEncerramento.mutateAsync(tipoEncerramento.idtipo_encerramento);
      console.log('✅ Tipo de encerramento deletado com sucesso:', tipoEncerramento.idtipo_encerramento);
    } catch (error: any) {
      console.error('❌ Erro ao deletar tipo de encerramento:', error);
      alert('Erro ao excluir tipo de encerramento: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setProcessingId(null);
    }
  };

  const tableColumns = [
    { header: "Descrição", accessor: "descricao" as keyof TipoEncerramento },
  ];

  const renderActionButtons = (tipoEncerramento: TipoEncerramento) => (
    <ActionButtons
      onEdit={() => navigate(`/private/encerramento/editar/${tipoEncerramento.idtipo_encerramento}`)}
      onDelete={() => handleDelete(tipoEncerramento)}
      isProcessing={processingId === tipoEncerramento.idtipo_encerramento}
      itemName="tipo de encerramento"
    />
  );

  return (
    <>
      <ListHeader
        title="Lista de Tipos de Encerramento"
        onMenuOpen={() => setIsMenuOpen(true)}
        onNewClick={() => navigate('/private/encerramento/nova')}
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por descrição..."
        isProcessing={deleteTipoEncerramento.isPending}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <div className="container mx-auto p-4">
        <DataTable
          data={tiposEncerramento}
          columns={tableColumns}
          renderActions={renderActionButtons}
          loading={isLoading}
          error={error?.message || null}
          onDismissError={() => {}}
          emptyMessage="Nenhum tipo de encerramento encontrado"
          searchTerm={searchTerm}
        />

        {/* Paginação */}
        {tiposEncerramentoData && tiposEncerramentoData.meta.totalPages > 1 && (
          <div className="mt-6">
            <Paginacao
              currentPage={currentPage}
              totalPages={tiposEncerramentoData.meta.totalPages}
              totalItems={tiposEncerramentoData.meta.total}
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

export default ListaTiposEncerramento;