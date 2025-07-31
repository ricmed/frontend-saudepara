import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSintomas, useDeleteSintoma } from "../hooks/useSintoma";
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface TipoSintoma {
  idtipo_sintoma: number;
  descricao: string;
}

const ListaTiposSintoma = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const itemsPerPage = 10;

  const { data: sintomasData, isLoading, error } = useSintomas(currentPage, itemsPerPage, searchTerm);
  const deleteSintoma = useDeleteSintoma();

  const sintomas = sintomasData?.data || [];

  const handleDelete = async (sintoma: TipoSintoma) => {
    if (!confirm(`Tem certeza que deseja excluir o tipo de sintoma "${sintoma.descricao}"?`)) {
      return;
    }

    console.log('🗑️ Tentando deletar sintoma:', sintoma.idtipo_sintoma);
    setProcessingId(sintoma.idtipo_sintoma);

    try {
      await deleteSintoma.mutateAsync(sintoma.idtipo_sintoma);
      console.log('✅ Sintoma deletado com sucesso:', sintoma.idtipo_sintoma);
    } catch (error: any) {
      console.error('❌ Erro ao deletar sintoma:', error);
      alert('Erro ao excluir tipo de sintoma: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setProcessingId(null);
    }
  };

  const tableColumns = [
    { header: "Descrição", accessor: "descricao" as keyof TipoSintoma },
  ];

  const renderActionButtons = (sintoma: TipoSintoma) => (
    <ActionButtons
      onEdit={() => navigate(`/private/sintoma/editar/${sintoma.idtipo_sintoma}`)}
      onDelete={() => handleDelete(sintoma)}
      isProcessing={processingId === sintoma.idtipo_sintoma}
      itemName="sintoma"
    />
  );

  return (
    <>
      <ListHeader
        title="Lista de Tipos de Sintoma"
        onMenuOpen={() => setIsMenuOpen(true)}
        onNewClick={() => navigate('/private/sintoma/nova')}
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por descrição..."
        isProcessing={deleteSintoma.isPending}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <div className="container mx-auto p-4">
        <DataTable
          data={sintomas}
          columns={tableColumns}
          renderActions={renderActionButtons}
          loading={isLoading}
          error={error?.message || null}
          onDismissError={() => {}}
          emptyMessage="Nenhum tipo de sintoma encontrado"
          searchTerm={searchTerm}
        />

        {/* Paginação */}
        {sintomasData && sintomasData.meta.totalPages > 1 && (
          <div className="mt-6">
            <Paginacao
              currentPage={currentPage}
              totalPages={sintomasData.meta.totalPages}
              totalItems={sintomasData.meta.total}
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

export default ListaTiposSintoma;
