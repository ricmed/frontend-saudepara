import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { EstabelecimentoService } from '@/services/EstabelecimentoService';
import { useDebounce } from "@/hooks/useDebounce";
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface TipoEstabelecimento {
  idtipo_estabelecimento: number;
  descricao: string;
}

interface PaginationData {
  data: TipoEstabelecimento[];
  meta: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

const ListaEstabelecimentos = () => {
  const navigate = useNavigate();
  const [estabelecimentos, setEstabelecimentos] = useState<TipoEstabelecimento[]>([]);
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
    const carregarEstabelecimentos = async () => {
      try {
        if (!isSearchFetch.current) {
          setLoading(true);
        }

        const response: PaginationData = await EstabelecimentoService.getAllPaginated(
          currentPage,
          itemsPerPage,
          debouncedSearchTerm
        );
        
        setEstabelecimentos(response.data);
        setTotalItems(response.meta.total);
        setTotalPages(response.meta.totalPages);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar os estabelecimentos");
      } finally {
        setLoading(false);
        isSearchFetch.current = false;
      }
    };

    carregarEstabelecimentos();
  }, [currentPage, debouncedSearchTerm]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir este estabelecimento?")) return;
    try {
      setProcessingId(id);
      await EstabelecimentoService.delete(id);
      setEstabelecimentos(prev => {
        const newData = prev.filter(item => item.idtipo_estabelecimento !== id);        
        if (newData.length === 0 && currentPage > 1) {
          setCurrentPage(prevPage => prevPage - 1);
        }        
        return newData;
      });

    } catch (err) {
      console.error('Erro ao excluir:', err);
      setError(err instanceof Error ? err.message : "Erro ao excluir o estabelecimento");
    } finally {
      setProcessingId(null);
    }
  };

  const tableColumns = [
    { header: "Descrição", accessor: "descricao" as keyof TipoEstabelecimento }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ListHeader
        title="Lista de Estabelecimentos"
        searchPlaceholder="Pesquisar estabelecimentos..."
        onSearch={(value) => {
          setInputValue(value);
          setSearchTerm(value);
        }}
        searchValue={inputValue}
        onNewClick={() => navigate("/cadastrar-estabelecimento")}
        isProcessing={false}
        onMenuOpen={() => setIsMenuOpen(true)}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <DataTable
          data={estabelecimentos}
          columns={tableColumns}
          loading={loading}
          error={error}
          onDismissError={() => setError(null)}
          emptyMessage="Nenhum estabelecimento cadastrado"
          searchTerm={searchTerm}
          renderActions={(est) => (
            <ActionButtons
              onEdit={() => navigate(`/editar-estabelecimento/${est.idtipo_estabelecimento}`)}
              onDelete={() => handleDelete(est.idtipo_estabelecimento)}
              isProcessing={processingId === est.idtipo_estabelecimento}
              itemName={est.descricao}
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

export default ListaEstabelecimentos;