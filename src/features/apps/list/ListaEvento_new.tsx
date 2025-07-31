import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEventos, useDeleteEvento, useToggleEventoAtivo } from "../hooks/useEvento";
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface TipoEvento {
  idtipo_evento: number;
  descricao: string;
  ativo: string;
}

const ListaTiposEvento = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'S' | 'N'>('all');
  const itemsPerPage = 10;

  const { data: eventosData, isLoading, error } = useEventos(currentPage, itemsPerPage, searchTerm);
  const deleteEvento = useDeleteEvento();
  const toggleAtivo = useToggleEventoAtivo();

  const eventos = eventosData?.data || [];

  // Filtrar eventos por status se necessário
  const eventosFiltrados = statusFilter === 'all' 
    ? eventos 
    : eventos.filter(evento => evento.ativo === statusFilter);

  const handleDelete = async (evento: TipoEvento) => {
    if (!confirm(`Tem certeza que deseja excluir o tipo de evento "${evento.descricao}"?`)) {
      return;
    }

    console.log('🗑️ Tentando deletar evento:', evento.idtipo_evento);
    setProcessingId(evento.idtipo_evento);

    try {
      await deleteEvento.mutateAsync(evento.idtipo_evento);
      console.log('✅ Evento deletado com sucesso:', evento.idtipo_evento);
    } catch (error: any) {
      console.error('❌ Erro ao deletar evento:', error);
      alert('Erro ao excluir evento: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleAtivo = async (evento: TipoEvento) => {
    console.log('🔄 Tentando alterar status do evento:', evento.idtipo_evento);
    setProcessingId(evento.idtipo_evento);

    try {
      await toggleAtivo.mutateAsync(evento.idtipo_evento);
      console.log('✅ Status do evento alterado com sucesso:', evento.idtipo_evento);
    } catch (error: any) {
      console.error('❌ Erro ao alterar status do evento:', error);
      alert('Erro ao alterar status: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setProcessingId(null);
    }
  };

  const tableColumns = [
    { header: "Descrição", accessor: "descricao" as keyof TipoEvento },
    { 
      header: "Status", 
      accessor: "ativo" as keyof TipoEvento,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'S' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {value === 'S' ? 'Ativo' : 'Inativo'}
        </span>
      )
    },
  ];

  const renderActionButtons = (evento: TipoEvento) => (
    <div className="flex gap-2">
      <button
        onClick={() => handleToggleAtivo(evento)}
        disabled={processingId === evento.idtipo_evento}
        className={`p-2 rounded-lg transition-colors ${
          evento.ativo === 'S'
            ? 'bg-orange-600 hover:bg-orange-700 text-white'
            : 'bg-green-600 hover:bg-green-700 text-white'
        } disabled:opacity-50`}
        title={evento.ativo === 'S' ? 'Desativar' : 'Ativar'}
      >
        {processingId === evento.idtipo_evento ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          evento.ativo === 'S' ? <EyeOff size={16} /> : <Eye size={16} />
        )}
      </button>
      
      <ActionButtons
        onEdit={() => navigate(`/private/evento/editar/${evento.idtipo_evento}`)}
        onDelete={() => handleDelete(evento)}
        isProcessing={processingId === evento.idtipo_evento}
        itemName="evento"
      />
    </div>
  );

  return (
    <>
      <ListHeader
        title="Lista de Tipos de Evento"
        onMenuOpen={() => setIsMenuOpen(true)}
        onNewClick={() => navigate('/private/evento/nova')}
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por descrição..."
        isProcessing={deleteEvento.isPending || toggleAtivo.isPending}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <div className="container mx-auto p-4">
        {/* Filtro de Status */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setStatusFilter('S')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'S'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Ativos
          </button>
          <button
            onClick={() => setStatusFilter('N')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'N'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Inativos
          </button>
        </div>

        <DataTable
          data={eventosFiltrados}
          columns={tableColumns}
          renderActions={renderActionButtons}
          loading={isLoading}
          error={error?.message || null}
          onDismissError={() => {}}
          emptyMessage="Nenhum tipo de evento encontrado"
          searchTerm={searchTerm}
        />

        {/* Paginação */}
        {eventosData && eventosData.meta.totalPages > 1 && (
          <div className="mt-6">
            <Paginacao
              currentPage={currentPage}
              totalPages={eventosData.meta.totalPages}
              totalItems={eventosData.meta.total}
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

export default ListaTiposEvento;
