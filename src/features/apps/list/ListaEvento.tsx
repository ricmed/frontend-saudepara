import { useState } from "react";
import { Eye, EyeOff, Pencil, Trash, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEventos, useDeleteEvento, useToggleEventoAtivo } from "../hooks/useEvento";
import { TipoEvento } from "@/services/EventoService";
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

const ListaTiposEvento = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'S' | 'N'>('all');
  const [showAbrangencia, setShowAbrangencia] = useState<number | null>(null);
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

  const handleToggleAbrangencia = (eventoId: number) => {
    setShowAbrangencia(current => current === eventoId ? null : eventoId);
  };

  const tableColumns = [
    { header: "Descrição", accessor: "descricao" as keyof TipoEvento },
    { 
      header: "Status", 
      accessor: "ativo" as keyof TipoEvento,
      render: (value: string) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center ${
          value === 'S' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {value === 'S' ? 'Ativo' : 'Inativo'}
        </span>
      )
    },
    {
      header: "Abrangência",
      accessor: "abrangencia" as keyof TipoEvento,
      render: (value: TipoEvento['abrangencia'], evento: TipoEvento) => {
        const quantidade = value?.length || 0;
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {quantidade} município{quantidade !== 1 ? 's' : ''}
            </span>
            {quantidade > 0 && (
              <button
                onClick={() => handleToggleAbrangencia(evento.idtipo_evento)}
                className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                title="Ver municípios"
              >
                <MapPin size={14} />
              </button>
            )}
          </div>
        );
      }
    },
  ];

  const renderActionButtons = (evento: TipoEvento) => (
    <div className="flex items-center justify-end gap-2">
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
      
      <button
        onClick={() => navigate(`/private/evento/editar/${evento.idtipo_evento}`)}
        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
        disabled={processingId === evento.idtipo_evento}
        title="Editar evento"
      >
        <Pencil className="h-4 w-4" />
      </button>
      
      <button
        onClick={() => handleDelete(evento)}
        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
        disabled={processingId === evento.idtipo_evento}
        title="Excluir evento"
      >
        {processingId === evento.idtipo_evento ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
        ) : (
          <Trash className="h-4 w-4" />
        )}
      </button>
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
        {eventosData && eventosData.meta && (
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

        {/* Modal para mostrar municípios */}
        {showAbrangencia && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin size={20} />
                  Municípios da Abrangência
                </h3>
                <button
                  onClick={() => setShowAbrangencia(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-96">
                {(() => {
                  const evento = eventos.find(e => e.idtipo_evento === showAbrangencia);
                  if (!evento || !evento.abrangencia || evento.abrangencia.length === 0) {
                    return (
                      <p className="text-gray-500 text-center py-8">
                        Nenhum município configurado para este evento.
                      </p>
                    );
                  }
                  
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {evento.abrangencia.map((ab) => (
                        <div
                          key={ab.municipio.idtipo_municipio}
                          className="bg-gray-50 px-4 py-3 rounded-lg border text-sm"
                        >
                          <div className="font-medium text-gray-900">
                            {ab.municipio.descricao}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            ID: {ab.municipio.idtipo_municipio}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
              
              <div className="flex justify-end p-6 border-t bg-gray-50">
                <button
                  onClick={() => setShowAbrangencia(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ListaTiposEvento;
