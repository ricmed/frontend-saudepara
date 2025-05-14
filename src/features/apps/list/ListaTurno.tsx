import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { TurnoService } from '@/services/TurnoService';
import { useDebounce } from "@/hooks/useDebounce";
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface Turno {
  id_turno: number;
  descricao: string;
}

const ListaTurnos = () => {
  const navigate = useNavigate();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const itemsPerPage = 10;
  const isSearchFetch = useRef(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm) {
      isSearchFetch.current = true;
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const carregarTurnos = async () => {
      try {
        if (!isSearchFetch.current) {
          setLoading(true);
        }

        const response = await TurnoService.getAllPaginated(
          currentPage,
          itemsPerPage,
          debouncedSearchTerm
        );
        
        setTurnos(response.data);
        setTotalItems(response.meta.total);
        setTotalPages(response.meta.totalPages);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar os turnos");
      } finally {
        setLoading(false);
        isSearchFetch.current = false;
      }
    };

    carregarTurnos();
  }, [currentPage, debouncedSearchTerm]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir este turno?")) return;

    try {
      setProcessingId(id);
      await TurnoService.delete(id);

      setTurnos(prev => {
        const newData = prev.filter(item => item.id_turno !== id);
        
        if (newData.length === 0 && currentPage > 1) {
          setCurrentPage(prevPage => prevPage - 1);
        }
        
        return newData;
      });

    } catch (err) {
      console.error('Erro ao excluir:', err);
      setError(err instanceof Error ? err.message : "Erro ao excluir o turno");
    } finally {
      setProcessingId(null);
    }
  };

  const tableColumns = [
    { header: "Descrição", accessor: "descricao" as keyof Turno }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ListHeader
        title="Lista de Turnos"
        searchPlaceholder="Pesquisar turnos..."
        onSearch={(value) => {
          setInputValue(value);
          setSearchTerm(value);
        }}
        searchValue={inputValue}
        onNewClick={() => navigate("/private/turnos/nova")}
        isProcessing={false}
        onMenuOpen={() => setIsMenuOpen(true)}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <DataTable
          data={turnos}
          columns={tableColumns}
          loading={loading}
          error={error}
          onDismissError={() => setError(null)}
          emptyMessage="Nenhum turno cadastrado"
          searchTerm={searchTerm}
          renderActions={(turno) => (
            <ActionButtons
              onEdit={() => navigate(`/private/turnos/editar/${turno.id_turno}`)}
              onDelete={() => handleDelete(turno.id_turno)}
              isProcessing={processingId === turno.id_turno}
              itemName={turno.descricao}
            />
          )}
        />
        <Paginacao
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          isProcessing={false}
          onPageChange={setCurrentPage}
        />
      </main>
    </div>
  );
};

export default ListaTurnos;