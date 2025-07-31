import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEstabelecimentos, useDeleteEstabelecimento } from "../hooks/useEstabelecimento";
import SideBarMenuAppsAuxiliares from "../components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface Estabelecimento {
  idtipo_estabelecimento: number;
  descricao: string;
}

const ListaEstabelecimentos = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const itemsPerPage = 10;

  const { data: estabelecimentosData, isLoading, error } = useEstabelecimentos(currentPage, itemsPerPage, searchTerm);
  const deleteEstabelecimento = useDeleteEstabelecimento();

  const estabelecimentos = estabelecimentosData?.data || [];

  const handleDelete = async (estabelecimento: Estabelecimento) => {
    if (!confirm(`Tem certeza que deseja excluir o estabelecimento "${estabelecimento.descricao}"?`)) {
      return;
    }

    console.log('🗑️ Tentando deletar estabelecimento:', estabelecimento.idtipo_estabelecimento);
    setProcessingId(estabelecimento.idtipo_estabelecimento);

    try {
      await deleteEstabelecimento.mutateAsync(estabelecimento.idtipo_estabelecimento);
      console.log('✅ Estabelecimento deletado com sucesso:', estabelecimento.idtipo_estabelecimento);
    } catch (error: any) {
      console.error('❌ Erro ao deletar estabelecimento:', error);
      alert('Erro ao excluir estabelecimento: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setProcessingId(null);
    }
  };

  const tableColumns = [
    { header: "Descrição", accessor: "descricao" as keyof Estabelecimento },
  ];

  const renderActionButtons = (estabelecimento: Estabelecimento) => (
    <ActionButtons
      onEdit={() => navigate(`/private/tipo-estabelecimentos/editar/${estabelecimento.idtipo_estabelecimento}`)}
      onDelete={() => handleDelete(estabelecimento)}
      isProcessing={processingId === estabelecimento.idtipo_estabelecimento}
      itemName="estabelecimento"
    />
  );

  return (
    <>
      <ListHeader
        title="Lista de Estabelecimentos"
        onMenuOpen={() => setIsMenuOpen(true)}
        onNewClick={() => navigate('/private/tipo-estabelecimentos/nova')}
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por descrição..."
        isProcessing={deleteEstabelecimento.isPending}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <div className="container mx-auto p-4">
        <DataTable
          data={estabelecimentos}
          columns={tableColumns}
          renderActions={renderActionButtons}
          loading={isLoading}
          error={error?.message || null}
          onDismissError={() => {}}
          emptyMessage="Nenhum tipo de estabelecimento encontrado"
          searchTerm={searchTerm}
        />

        {/* Paginação */}
        {estabelecimentosData && estabelecimentosData.meta.totalPages > 1 && (
          <div className="mt-6">
            <Paginacao
              currentPage={currentPage}
              totalPages={estabelecimentosData.meta.totalPages}
              totalItems={estabelecimentosData.meta.total}
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

export default ListaEstabelecimentos;
