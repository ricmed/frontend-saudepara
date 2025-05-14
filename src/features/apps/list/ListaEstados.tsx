import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { EstadoService } from "@/services/EstadoService";
import { useDebounce } from "@/hooks/useDebounce";
import SideBarMenuAppsAuxiliares from "../components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface Estado {
  idtipo_estado: number;
  codigo: string;
  descricao: string;
}

interface PaginatedResponse {
  data: Estado[];
  meta: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

const ListaEstados = () => {
  const navigate = useNavigate();
  const [estados, setEstados] = useState<Estado[]>([]);
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
    const carregarEstados = async () => {
      try {
        if (!isSearchFetch.current && isMounted.current) setLoading(true);

        const response = (await EstadoService.getAllPaginated(
          currentPage,
          itemsPerPage,
          debouncedSearchTerm
        )) as PaginatedResponse;

        if (isMounted.current) {
          setEstados(response.data);
          setTotalItems(response.meta.total || 0);
          setTotalPages(
            Math.min(Math.max(response.meta.totalPages || 1, 1), 1000)
          );
        }
      } catch (err) {
        if (isMounted.current) {
          setError("Erro ao carregar estados");
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
          isSearchFetch.current = false;
        }
      }
    };

    carregarEstados();
  }, [currentPage, debouncedSearchTerm]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir este estado?")) return;

    try {
      setProcessingId(id);
      await EstadoService.delete(id);

      setEstados((prev) => {
        const newData = prev.filter((item) => item.idtipo_estado !== id);
        if (newData.length === 0 && currentPage > 1) {
          setCurrentPage((prevPage) => prevPage - 1);
        }
        return newData;
      });
    } catch (err) {
      setError("Erro ao excluir o estado");
    } finally {
      setProcessingId(null);
    }
  };

  const tableColumns = [
    { header: "Código", accessor: "codigo" as keyof Estado },
    { header: "Descrição", accessor: "descricao" as keyof Estado }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ListHeader
        title="Lista de Estados"
        searchPlaceholder="Pesquisar estado..."
        onSearch={(value) => {
          setInputValue(value);
          setSearchTerm(value);
        }}
        searchValue={inputValue}
        onNewClick={() => navigate("/private/estado/nova")}
        isProcessing={false}
        onMenuOpen={() => setIsMenuOpen(true)}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <DataTable
          data={estados}
          columns={tableColumns}
          loading={loading}
          error={error}
          onDismissError={() => setError(null)}
          emptyMessage="Nenhum estado cadastrado"
          searchTerm={searchTerm}
          renderActions={(estado) => (
            <ActionButtons
              onEdit={() => navigate(`/private/estado/editar/${estado.idtipo_estado}`)}
              onDelete={() => handleDelete(estado.idtipo_estado)}
              isProcessing={processingId === estado.idtipo_estado}
              itemName={estado.descricao}
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

export default ListaEstados;