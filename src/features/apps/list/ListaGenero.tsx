import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GeneroService } from "@/services/GeneroService";
import { useDebounce } from "@/hooks/useDebounce";
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface TipoGenero {
  idtipo_genero: number;
  descricao: string;
}

const ListaGenero = () => {
  const navigate = useNavigate();
  const [tiposGenero, setTiposGenero] = useState<TipoGenero[]>([]);
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
    const carregarTiposGenero = async () => {
      try {
        setLoading(true);
        const response = await GeneroService.getAllPaginated(
          currentPage, 
          itemsPerPage, 
          debouncedSearchTerm
        );
        
        if (isMounted.current) {
          setTiposGenero(response.data);
          setTotalItems(response.meta.total);
          setTotalPages(Math.min(Math.max(response.meta.totalPages, 1), 1000));
          setError(null);
        }
      } catch (err) {
        if (isMounted.current) {
          setError("Erro ao carregar tipos de gênero");
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    carregarTiposGenero();
  }, [currentPage, debouncedSearchTerm]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir este tipo de gênero?")) return;

    try {
      setProcessingId(id);
      await GeneroService.delete(id);

      setTiposGenero(prev => {
        const newData = prev.filter(item => item.idtipo_genero !== id);
        if (newData.length === 0 && currentPage > 1) {
          setCurrentPage(prevPage => prevPage - 1);
        }
        return newData;
      });
    } catch (err) {
      setError("Erro ao excluir o tipo de gênero");
    } finally {
      setProcessingId(null);
    }
  };

  const tableColumns = [
    { header: "Descrição", accessor: "descricao" as keyof TipoGenero }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ListHeader
        title="Lista de Tipos de Gênero"
        searchPlaceholder="Pesquisar tipos de gênero..."
        onSearch={(value) => {
          setInputValue(value);
          setSearchTerm(value);
        }}
        searchValue={inputValue}
        onNewClick={() => navigate("/private/genero/nova")}
        isProcessing={false}
        onMenuOpen={() => setIsMenuOpen(true)}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <DataTable
          data={tiposGenero}
          columns={tableColumns}
          loading={loading}
          error={error}
          onDismissError={() => setError(null)}
          emptyMessage="Nenhum tipo de gênero cadastrado"
          searchTerm={searchTerm}
          renderActions={(tipo) => (
            <ActionButtons
              onEdit={() => navigate(`/private/genero/editar/${tipo.idtipo_genero}`)}
              onDelete={() => handleDelete(tipo.idtipo_genero)}
              isProcessing={processingId === tipo.idtipo_genero}
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

export default ListaGenero;