import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEstados, useDeleteEstado } from "../hooks/useEstado";
import SideBarMenuAppsAuxiliares from "../components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface Estado {
  idtipo_estado: number;
  codigo: string;
  descricao: string;
}

const ListaEstados = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const itemsPerPage = 10;

  const { data: estadosData, isLoading, error } = useEstados(currentPage, itemsPerPage, searchTerm);
  const deleteEstado = useDeleteEstado();

  const estados = estadosData?.data || [];

  const handleDelete = async (estado: Estado) => {
    if (!confirm(`Tem certeza que deseja excluir o estado "${estado.descricao}" (${estado.codigo})?`)) {
      return;
    }

    console.log('🗑️ Tentando deletar estado:', estado.idtipo_estado);
    setProcessingId(estado.idtipo_estado);

    try {
      await deleteEstado.mutateAsync(estado.idtipo_estado);
      console.log('✅ Estado deletado com sucesso:', estado.idtipo_estado);
    } catch (error: any) {
      console.error('❌ Erro ao deletar estado:', error);
      alert('Erro ao excluir estado: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setProcessingId(null);
    }
  };

  const tableColumns = [
    { header: "Código", accessor: "codigo" as keyof Estado },
    { header: "Descrição", accessor: "descricao" as keyof Estado },
  ];

  const renderActionButtons = (estado: Estado) => (
    <ActionButtons
      onEdit={() => navigate(`/private/estado/editar/${estado.idtipo_estado}`)}
      onDelete={() => handleDelete(estado)}
      isProcessing={processingId === estado.idtipo_estado}
      itemName="estado"
    />
  );

  return (
    <>
      <ListHeader
        title="Lista de Estados"
        onMenuOpen={() => setIsMenuOpen(true)}
        onNewClick={() => navigate('/private/estado/nova')}
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por código ou descrição..."
        isProcessing={deleteEstado.isPending}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <div className="container mx-auto p-4">
        <DataTable
          data={estados}
          columns={tableColumns}
          renderActions={renderActionButtons}
          loading={isLoading}
          error={error?.message || null}
          onDismissError={() => {}}
          emptyMessage="Nenhum estado encontrado"
          searchTerm={searchTerm}
        />

        {/* Paginação */}
        {estadosData && estadosData.meta && (
          <div className="mt-6">
            <Paginacao
              currentPage={currentPage}
              totalPages={estadosData.meta.totalPages}
              totalItems={estadosData.meta.total}
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

export default ListaEstados;