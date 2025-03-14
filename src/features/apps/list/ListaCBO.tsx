import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { CBOService } from "@/services/CBOService";
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface CBO {
  idtipo_cbo: number;
  codigo: string;
  descricao: string;
}

export interface PaginatedResponse {
  data: CBO[];
  meta: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

const ListaCBOs = () => {
  const navigate = useNavigate();
  const [cbos, setCBOs] = useState<CBO[]>([]);
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
  const isSearchFetch = useRef(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm) {
      isSearchFetch.current = true;
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const carregarCBOs = async () => {
      try {
        if (!isSearchFetch.current && isMounted.current) setLoading(true);
        const response = await CBOService.getAllPaginated(
          currentPage,
          itemsPerPage,
          debouncedSearchTerm
        );
        if (isMounted.current) {
          setCBOs(response.data);
          setTotalItems(response.meta.total || 0);
          setTotalPages(Math.min(Math.max(response.meta.totalPages || 1, 1), 1000));
        }
      } catch (err) {
        if (isMounted.current) {
          setError("Erro ao carregar CBOs");
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
          isSearchFetch.current = false;
        }
      }
    };
    carregarCBOs();
  }, [currentPage, debouncedSearchTerm]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir este CBO?")) return;
    try {
      setProcessingId(id);
      await CBOService.delete(id);
      setCBOs((prev) => {
        const newData = prev.filter((item) => item.idtipo_cbo !== id);
        if (newData.length === 0 && currentPage > 1) {
          setCurrentPage((prevPage) => prevPage - 1);
        }
        return newData;
      });
    } catch (err) {
      setError("Erro ao excluir o CBO");
    } finally {
      setProcessingId(null);
    }
  };

  const tableColumns = [
    { header: "Código", accessor: "codigo" as keyof CBO },
    { header: "Descrição", accessor: "descricao" as keyof CBO }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ListHeader
        title="Lista de CBOs"
        searchPlaceholder="Pesquisar CBOs..."
        onSearch={(value) => {
          setInputValue(value);
          setSearchTerm(value);
        }}
        searchValue={inputValue}
        onNewClick={() => navigate("/cbo/cadastro")}
        isProcessing={false}
        onMenuOpen={() => setIsMenuOpen(true)}
      />
      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <DataTable
          data={cbos}
          columns={tableColumns}
          loading={loading}
          error={error}
          onDismissError={() => setError(null)}
          emptyMessage="Nenhum CBO cadastrado"
          searchTerm={searchTerm}
          renderActions={(cbo) => (
            <ActionButtons
              onEdit={() => navigate(`/cbo/editar/${cbo.idtipo_cbo}`)}
              onDelete={() => handleDelete(cbo.idtipo_cbo)}
              isProcessing={processingId === cbo.idtipo_cbo}
              itemName={cbo.descricao}
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

export default ListaCBOs;