import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQualificacoes, useDeleteQualificacao } from "../hooks/useQualificacao";
import { useComponentes } from "../hooks/useComponentes";
import SideBarMenuAppsAuxiliares from "../components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface TipoQualificacao {
  idtipo_qualificacao: number;
  descricao: string;
  idcomponente: number;
  componente_descricao?: string;
}

interface Componente {
  idcomponente: number;
  descricao: string;
}

const ListaQualificacao = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const itemsPerPage = 10;

  const { data: qualificacoesData, isLoading, error } = useQualificacoes(currentPage, itemsPerPage, searchTerm);
  const { data: componentesData } = useComponentes();
  const deleteQualificacao = useDeleteQualificacao();

  // Extrair array de componentes dos dados paginados
  const componentes: Componente[] = componentesData?.data || [];
  
  // Criar mapa de componentes para lookup rápido
  const componentesMap = new Map(componentes.map(c => [c.idcomponente, c.descricao]));

  // Adicionar descrição do componente aos dados
  const qualificacoes = qualificacoesData?.data.map(qual => ({
    ...qual,
    componente_descricao: componentesMap.get(qual.idcomponente) || 'N/A'
  })) || [];

  const handleDelete = async (qualificacao: TipoQualificacao) => {
    if (!confirm(`Tem certeza que deseja excluir a qualificação "${qualificacao.descricao}"?`)) {
      return;
    }

    console.log('🗑️ Tentando deletar qualificação:', qualificacao.idtipo_qualificacao);
    setProcessingId(qualificacao.idtipo_qualificacao);

    try {
      await deleteQualificacao.mutateAsync(qualificacao.idtipo_qualificacao);
      console.log('✅ Qualificação deletada com sucesso:', qualificacao.idtipo_qualificacao);
    } catch (error: any) {
      console.error('❌ Erro ao deletar qualificação:', error);
      alert('Erro ao excluir qualificação: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setProcessingId(null);
    }
  };

  const tableColumns = [
    { header: "Descrição", accessor: "descricao" as keyof TipoQualificacao },
    { header: "Componente", accessor: "componente_descricao" as keyof TipoQualificacao },
  ];

  const renderActionButtons = (qualificacao: TipoQualificacao) => (
    <ActionButtons
      onEdit={() => navigate(`/private/qualificacao/editar/${qualificacao.idtipo_qualificacao}`)}
      onDelete={() => handleDelete(qualificacao)}
      isProcessing={processingId === qualificacao.idtipo_qualificacao}
      itemName="qualificação"
    />
  );

  return (
    <>
      <ListHeader
        title="Lista de Qualificações"
        onMenuOpen={() => setIsMenuOpen(true)}
        onNewClick={() => navigate('/private/qualificacao/nova')}
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por descrição..."
        isProcessing={deleteQualificacao.isPending}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <div className="container mx-auto p-4">
        <DataTable
          data={qualificacoes}
          columns={tableColumns}
          renderActions={renderActionButtons}
          loading={isLoading}
          error={error?.message || null}
          onDismissError={() => {}}
          emptyMessage="Nenhuma qualificação encontrada"
          searchTerm={searchTerm}
        />

        {/* Paginação */}
        {qualificacoesData && qualificacoesData.meta.totalPages > 1 && (
          <div className="mt-6">
            <Paginacao
              currentPage={currentPage}
              totalPages={qualificacoesData.meta.totalPages}
              totalItems={qualificacoesData.meta.total}
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

export default ListaQualificacao;