import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { HabilitacaoService } from "@/services/HabilitacaoService";
import { useDebounce } from "@/hooks/useDebounce";
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface TipoHabilitacao {
  idtipo_habilitacao: number;
  codigo: string;
  descricao: string;
}

interface PaginationData {
  data: TipoHabilitacao[];
  meta: {
    total: number;
    totalPages: number;
    page: number;
  };
}

const ListaHabilitacoes = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [habilitacoes, setHabilitacoes] = useState<TipoHabilitacao[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
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
    const carregarHabilitacoes = async () => {
      try {
        if (!isSearchFetch.current) {
          setLoading(true);
        }

        const response: PaginationData =
          await HabilitacaoService.getAllPaginated(
            currentPage,
            itemsPerPage,
            debouncedSearchTerm
          );

        setHabilitacoes(response.data);
        setTotalItems(response.meta.total);
        setTotalPages(response.meta.totalPages);
        setError(null);
      } catch (err) {
        setError("Erro ao carregar as habilitações");
      } finally {
        setLoading(false);
        isSearchFetch.current = false;
      }
    };

    carregarHabilitacoes();
  }, [currentPage, debouncedSearchTerm]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir esta habilitação?")) return;

    try {
      setProcessingId(id);
      await HabilitacaoService.delete(id);

      setHabilitacoes((prev) => {
        const newData = prev.filter((item) => item.idtipo_habilitacao !== id);

        if (newData.length === 0 && currentPage > 1) {
          setCurrentPage((prevPage) => prevPage - 1);
        }

        return newData;
      });
    } catch (err) {
      console.error("Erro ao excluir:", err);
      setError("Erro ao excluir a habilitação");
    } finally {
      setProcessingId(null);
    }
  };

  const tableColumns = [
    { header: "Código", accessor: "codigo" as keyof TipoHabilitacao },
    { header: "Descrição", accessor: "descricao" as keyof TipoHabilitacao }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ListHeader
        title="Lista de Habilitações"
        searchPlaceholder="Pesquisar habilitações ou código..."
        onSearch={(value) => {
          setInputValue(value);
          setSearchTerm(value);
        }}
        searchValue={inputValue}
        onNewClick={() => navigate("/private/habilitacao/nova")}
        isProcessing={false}
        onMenuOpen={() => setIsMenuOpen(true)}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <DataTable
          data={habilitacoes}
          columns={tableColumns}
          loading={loading}
          error={error}
          onDismissError={() => setError(null)}
          emptyMessage="Nenhuma habilitação cadastrada"
          searchTerm={searchTerm}
          renderActions={(hab) => (
            <ActionButtons
              onEdit={() => navigate(`/private/habilitacao/editar/${hab.idtipo_habilitacao}`)}
              onDelete={() => handleDelete(hab.idtipo_habilitacao)}
              isProcessing={processingId === hab.idtipo_habilitacao}
              itemName={hab.descricao}
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

export default ListaHabilitacoes;