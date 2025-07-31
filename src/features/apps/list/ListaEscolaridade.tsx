import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEscolaridades, useDeleteEscolaridade } from "../hooks/useEscolaridade";
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface Escolaridade {
  idtipo_escolaridade: number;
  descricao: string;
}

const ListaEscolaridade = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const itemsPerPage = 10;

  const { data: escolaridadesData, isLoading, error } = useEscolaridades(currentPage, itemsPerPage, searchTerm);
  const deleteEscolaridade = useDeleteEscolaridade();

  const escolaridades = escolaridadesData?.data || [];

  const handleDelete = async (escolaridade: Escolaridade) => {
    if (!confirm(`Tem certeza que deseja excluir a escolaridade "${escolaridade.descricao}"?`)) {
      return;
    }

    console.log('🗑️ Tentando deletar escolaridade:', escolaridade.idtipo_escolaridade);
    setProcessingId(escolaridade.idtipo_escolaridade);

    try {
      await deleteEscolaridade.mutateAsync(escolaridade.idtipo_escolaridade);
      console.log('✅ Escolaridade deletada com sucesso:', escolaridade.idtipo_escolaridade);
    } catch (error: any) {
      console.error('❌ Erro ao deletar escolaridade:', error);
      alert('Erro ao excluir escolaridade: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setProcessingId(null);
    }
  };

  const tableColumns = [
    { header: "Descrição", accessor: "descricao" as keyof Escolaridade },
  ];

  const renderActionButtons = (escolaridade: Escolaridade) => (
    <ActionButtons
      onEdit={() => navigate(`/private/escolaridade/editar/${escolaridade.idtipo_escolaridade}`)}
      onDelete={() => handleDelete(escolaridade)}
      isProcessing={processingId === escolaridade.idtipo_escolaridade}
      itemName="escolaridade"
    />
  );

  return (
    <>
      <ListHeader
        title="Lista de Escolaridades"
        onMenuOpen={() => setIsMenuOpen(true)}
        onNewClick={() => navigate('/private/escolaridade/nova')}
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por descrição..."
        isProcessing={deleteEscolaridade.isPending}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <div className="container mx-auto p-4">
        <DataTable
          data={escolaridades}
          columns={tableColumns}
          renderActions={renderActionButtons}
          loading={isLoading}
          error={error?.message || null}
          onDismissError={() => {}}
          emptyMessage="Nenhuma escolaridade encontrada"
          searchTerm={searchTerm}
        />

        {/* Paginação */}
        {escolaridadesData && escolaridadesData.meta && (
          <div className="mt-6">
            <Paginacao
              currentPage={currentPage}
              totalPages={escolaridadesData.meta.totalPages}
              totalItems={escolaridadesData.meta.total}
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

export default ListaEscolaridade;