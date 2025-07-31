import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTurnos, useDeleteTurno } from "../hooks/useTurno";
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface Turno {
  id_turno: number;
  descricao: string;
}

const ListaTurnos = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const itemsPerPage = 10;

  const { data: turnosData, isLoading, error } = useTurnos(currentPage, itemsPerPage, searchTerm);
  const deleteTurno = useDeleteTurno();

  const turnos = turnosData?.data || [];

  const handleDelete = async (turno: Turno) => {
    if (!confirm(`Tem certeza que deseja excluir o turno "${turno.descricao}"?`)) {
      return;
    }

    console.log('🗑️ Tentando deletar turno:', turno.id_turno);
    setProcessingId(turno.id_turno);

    try {
      await deleteTurno.mutateAsync(turno.id_turno);
      console.log('✅ Turno deletado com sucesso:', turno.id_turno);
    } catch (error: any) {
      console.error('❌ Erro ao deletar turno:', error);
      alert('Erro ao excluir turno: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setProcessingId(null);
    }
  };

  const tableColumns = [
    { header: "Descrição", accessor: "descricao" as keyof Turno },
  ];

  const renderActionButtons = (turno: Turno) => (
    <ActionButtons
      onEdit={() => navigate(`/private/turnos/editar/${turno.id_turno}`)}
      onDelete={() => handleDelete(turno)}
      isProcessing={processingId === turno.id_turno}
      itemName="turno"
    />
  );

  return (
    <>
      <ListHeader
        title="Lista de Turnos"
        onMenuOpen={() => setIsMenuOpen(true)}
        onNewClick={() => navigate('/private/turnos/nova')}
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por descrição..."
        isProcessing={deleteTurno.isPending}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <div className="container mx-auto p-4">
        <DataTable
          data={turnos}
          columns={tableColumns}
          renderActions={renderActionButtons}
          loading={isLoading}
          error={error?.message || null}
          onDismissError={() => {}}
          emptyMessage="Nenhum turno encontrado"
          searchTerm={searchTerm}
        />

        {/* Paginação */}
        {turnosData && turnosData.meta.totalPages > 1 && (
          <div className="mt-6">
            <Paginacao
              currentPage={currentPage}
              totalPages={turnosData.meta.totalPages}
              totalItems={turnosData.meta.total}
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

export default ListaTurnos;