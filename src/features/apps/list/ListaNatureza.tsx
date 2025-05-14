import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { NaturezaService } from '@/services/NaturezaService';
import { useDebounce } from "@/hooks/useDebounce";
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface Natureza {
  idtipo_natureza: number;
  descricao: string;
}

interface PaginationData {
  data: Natureza[];
  meta: {
    total: number;
    totalPages: number;
    page: number;
  };
}

const ListaNatureza = () => {
  const navigate = useNavigate();
  const [naturezas, setNaturezas] = useState<Natureza[]>([]);
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
    const carregarNaturezas = async () => {
      try {
        if (!isSearchFetch.current) {
          setLoading(true);
        }

        const response: PaginationData = await NaturezaService.getAllPaginated(
          currentPage,
          itemsPerPage,
          debouncedSearchTerm
        );
        
        setNaturezas(response.data);
        setTotalItems(response.meta.total);
        setTotalPages(response.meta.totalPages);
        setError(null);
      } catch (err) {
        setError("Erro ao carregar as naturezas");
      } finally {
        setLoading(false);
        isSearchFetch.current = false;
      }
    };

    carregarNaturezas();
  }, [currentPage, debouncedSearchTerm]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir esta natureza?")) return;

    try {
      setProcessingId(id);
      await NaturezaService.delete(id);

      setNaturezas(prev => {
        const newData = prev.filter(item => item.idtipo_natureza !== id);
        
        if (newData.length === 0 && currentPage > 1) {
          setCurrentPage(prevPage => prevPage - 1);
        }
        
        return newData;
      });

    } catch (err) {
      console.error('Erro ao excluir:', err);
      setError("Erro ao excluir a natureza");
    } finally {
      setProcessingId(null);
    }
  };

  const tableColumns = [
    { header: "Descrição", accessor: "descricao" as keyof Natureza }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ListHeader
        title="Lista de Naturezas"
        searchPlaceholder="Pesquisar naturezas..."
        onSearch={(value) => {
          setInputValue(value);
          setSearchTerm(value.trim());
        }}
        searchValue={inputValue}
        onNewClick={() => navigate("/private/naturezas/nova")}
        isProcessing={false}
        onMenuOpen={() => setIsMenuOpen(true)}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <DataTable
          data={naturezas}
          columns={tableColumns}
          loading={loading}
          error={error}
          onDismissError={() => setError(null)}
          emptyMessage="Nenhuma natureza cadastrada"
          searchTerm={searchTerm}
          renderActions={(natureza) => (
            <ActionButtons
              onEdit={() => navigate(`/private/naturezas/editar/${natureza.idtipo_natureza}`)}
              onDelete={() => handleDelete(natureza.idtipo_natureza)}
              isProcessing={processingId === natureza.idtipo_natureza}
              itemName={natureza.descricao}
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

export default ListaNatureza;