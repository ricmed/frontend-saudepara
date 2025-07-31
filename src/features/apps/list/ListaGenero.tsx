import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGeneros, useDeleteGenero } from "../hooks/useGenero";
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface Genero {
  idtipo_genero: number;
  descricao: string;
}

const ListaGenero = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const itemsPerPage = 10;

  const { data: generosData, isLoading, error } = useGeneros(currentPage, itemsPerPage, searchTerm);
  const deleteGenero = useDeleteGenero();

  const generos = generosData?.data || [];

  const handleDelete = async (genero: Genero) => {
    if (!confirm(`Tem certeza que deseja excluir o gênero "${genero.descricao}"?`)) {
      return;
    }

    console.log('🗑️ Tentando deletar gênero:', genero.idtipo_genero);
    setProcessingId(genero.idtipo_genero);

    try {
      await deleteGenero.mutateAsync(genero.idtipo_genero);
      console.log('✅ Gênero deletado com sucesso:', genero.idtipo_genero);
    } catch (error: any) {
      console.error('❌ Erro ao deletar gênero:', error);
      alert('Erro ao excluir gênero: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setProcessingId(null);
    }
  };

  const tableColumns = [
    { header: "Descrição", accessor: "descricao" as keyof Genero },
  ];

  const renderActionButtons = (genero: Genero) => (
    <ActionButtons
      onEdit={() => navigate(`/private/genero/editar/${genero.idtipo_genero}`)}
      onDelete={() => handleDelete(genero)}
      isProcessing={processingId === genero.idtipo_genero}
      itemName="gênero"
    />
  );

  return (
    <>
      <ListHeader
        title="Lista de Gêneros"
        onMenuOpen={() => setIsMenuOpen(true)}
        onNewClick={() => navigate('/private/genero/nova')}
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por descrição..."
        isProcessing={deleteGenero.isPending}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <div className="container mx-auto p-4">
        <DataTable
          data={generos}
          columns={tableColumns}
          renderActions={renderActionButtons}
          loading={isLoading}
          error={error?.message || null}
          onDismissError={() => {}}
          emptyMessage="Nenhum gênero encontrado"
          searchTerm={searchTerm}
        />

        {/* Paginação */}
        {generosData && generosData.meta.totalPages > 1 && (
          <div className="mt-6">
            <Paginacao
              currentPage={currentPage}
              totalPages={generosData.meta.totalPages}
              totalItems={generosData.meta.total}
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

export default ListaGenero;