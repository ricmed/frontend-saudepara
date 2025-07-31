import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePaises, useDeletePais } from "../hooks/usePais";
import SideBarMenuAppsAuxiliares from "../components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface Pais {
  idtipo_pais: number;
  descricao: string;
}

const ListaPaises = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const itemsPerPage = 10;

  const { data: paisesData, isLoading, error } = usePaises(currentPage, itemsPerPage, searchTerm);
  const deletePais = useDeletePais();

  const paises = paisesData?.data || [];

  const handleDelete = async (pais: Pais) => {
    if (!confirm(`Tem certeza que deseja excluir o país "${pais.descricao}"?`)) {
      return;
    }

    console.log('🗑️ Tentando deletar país:', pais.idtipo_pais);
    setProcessingId(pais.idtipo_pais);

    try {
      await deletePais.mutateAsync(pais.idtipo_pais);
      console.log('✅ País deletado com sucesso:', pais.idtipo_pais);
    } catch (error: any) {
      console.error('❌ Erro ao deletar país:', error);
      alert('Erro ao excluir país: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setProcessingId(null);
    }
  };

  const tableColumns = [
    { header: "Descrição", accessor: "descricao" as keyof Pais },
  ];

  const renderActionButtons = (pais: Pais) => (
    <ActionButtons
      onEdit={() => navigate(`/private/pais/editar/${pais.idtipo_pais}`)}
      onDelete={() => handleDelete(pais)}
      isProcessing={processingId === pais.idtipo_pais}
      itemName="país"
    />
  );

  return (
    <>
      <ListHeader
        title="Lista de Países"
        onMenuOpen={() => setIsMenuOpen(true)}
        onNewClick={() => navigate('/private/pais/nova')}
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por descrição..."
        isProcessing={deletePais.isPending}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <div className="container mx-auto p-4">
        <DataTable
          data={paises}
          columns={tableColumns}
          renderActions={renderActionButtons}
          loading={isLoading}
          error={error?.message || null}
          onDismissError={() => {}}
          emptyMessage="Nenhum país encontrado"
          searchTerm={searchTerm}
        />

        {/* Paginação */}
        {paisesData && paisesData.meta.totalPages > 1 && (
          <div className="mt-6">
            <Paginacao
              currentPage={currentPage}
              totalPages={paisesData.meta.totalPages}
              totalItems={paisesData.meta.total}
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

export default ListaPaises;