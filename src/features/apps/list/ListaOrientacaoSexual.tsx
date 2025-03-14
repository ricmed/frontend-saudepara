import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { OrientacaoSexualService } from "@/services/OrientacaoSexualService";
import { useDebounce } from "@/hooks/useDebounce";
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface TipoOrientacaoSexual {
  idtipo_orientacao_sexual: number;
  descricao: string;
}

const ListaOrientacaoSexual = () => {
  const navigate = useNavigate();
  const [tiposOrientacaoSexual, setTiposOrientacaoSexual] = useState<TipoOrientacaoSexual[]>([]);
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
    const carregarTiposOrientacaoSexual = async () => {
      try {
        setLoading(true);
        const response = await OrientacaoSexualService.getAllPaginated(
          currentPage, 
          itemsPerPage, 
          debouncedSearchTerm
        );
        
        if (isMounted.current) {
          setTiposOrientacaoSexual(response.data);
          setTotalItems(response.meta.total);
          setTotalPages(Math.min(Math.max(response.meta.totalPages, 1), 1000));
          setError(null);
        }
      } catch (err) {
        if (isMounted.current) {
          setError("Erro ao carregar tipos de orientação sexual");
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    carregarTiposOrientacaoSexual();
  }, [currentPage, debouncedSearchTerm]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir este tipo de orientação sexual?")) return;

    try {
      setProcessingId(id);
      await OrientacaoSexualService.delete(id);

      setTiposOrientacaoSexual(prev => {
        const newData = prev.filter(item => item.idtipo_orientacao_sexual !== id);
        if (newData.length === 0 && currentPage > 1) {
          setCurrentPage(prevPage => prevPage - 1);
        }
        return newData;
      });
    } catch (err) {
      setError("Erro ao excluir o tipo de orientação sexual");
    } finally {
      setProcessingId(null);
    }
  };

  const tableColumns = [
    { header: "Descrição", accessor: "descricao" as keyof TipoOrientacaoSexual }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ListHeader
        title="Lista de Tipos de Orientação Sexual"
        searchPlaceholder="Pesquisar tipos de orientação sexual..."
        onSearch={(value) => {
          setInputValue(value);
          setSearchTerm(value);
        }}
        searchValue={inputValue}
        onNewClick={() => navigate("/orientacao-sexual/cadastro")}
        isProcessing={false}
        onMenuOpen={() => setIsMenuOpen(true)}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <DataTable
          data={tiposOrientacaoSexual}
          columns={tableColumns}
          loading={loading}
          error={error}
          onDismissError={() => setError(null)}
          emptyMessage="Nenhum tipo de orientação sexual cadastrado"
          searchTerm={searchTerm}
          renderActions={(tipo) => (
            <ActionButtons
              onEdit={() => navigate(`/orientacao-sexual/editar/${tipo.idtipo_orientacao_sexual}`)}
              onDelete={() => handleDelete(tipo.idtipo_orientacao_sexual)}
              isProcessing={processingId === tipo.idtipo_orientacao_sexual}
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

export default ListaOrientacaoSexual;