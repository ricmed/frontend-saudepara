import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { RacaService } from "@/services/RacaService";
import { useDebounce } from "@/hooks/useDebounce";
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface TipoRaca {
  idtipo_raca: number;
  descricao: string;
}

const ListaRaca = () => {
  const navigate = useNavigate();
  const [tiposRaca, setTiposRaca] = useState<TipoRaca[]>([]);
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
  const isMounted = useRef(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const carregarTiposRaca = async () => {
      try {
        setLoading(true);
        const response = await RacaService.getAllPaginated(
          currentPage, 
          itemsPerPage, 
          debouncedSearchTerm
        );
        
        if (isMounted.current) {
          setTiposRaca(response.data);
          setTotalItems(response.meta.total);
          setTotalPages(Math.min(Math.max(response.meta.totalPages, 1), 1000));
          setError(null);
        }
      } catch (err) {
        if (isMounted.current) {
          setError("Erro ao carregar tipos de raça");
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    carregarTiposRaca();
  }, [currentPage, debouncedSearchTerm]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir este tipo de raça?")) return;

    try {
      setProcessingId(id);
      await RacaService.delete(id);

      setTiposRaca(prev => {
        const newData = prev.filter(item => item.idtipo_raca !== id);
        if (newData.length === 0 && currentPage > 1) {
          setCurrentPage(prevPage => prevPage - 1);
        }
        return newData;
      });
    } catch (err) {
      setError("Erro ao excluir o tipo de raça");
    } finally {
      setProcessingId(null);
    }
  };

  const tableColumns = [
    { header: "Descrição", accessor: "descricao" as keyof TipoRaca }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ListHeader
        title="Lista de Tipos de Raça"
        searchPlaceholder="Pesquisar tipos de raça..."
        onSearch={(value) => {
          setInputValue(value);
          setSearchTerm(value);
        }}
        searchValue={inputValue}
        onNewClick={() => navigate("/private/raca/nova")}
        isProcessing={false}
        onMenuOpen={() => setIsMenuOpen(true)}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <DataTable
          data={tiposRaca}
          columns={tableColumns}
          loading={loading}
          error={error}
          onDismissError={() => setError(null)}
          emptyMessage="Nenhum tipo de raça cadastrado"
          searchTerm={searchTerm}
          renderActions={(tipo) => (
            <ActionButtons
              onEdit={() => navigate(`/private/raca/editar/${tipo.idtipo_raca}`)}
              onDelete={() => handleDelete(tipo.idtipo_raca)}
              isProcessing={processingId === tipo.idtipo_raca}
              itemName={tipo.descricao}
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

export default ListaRaca;