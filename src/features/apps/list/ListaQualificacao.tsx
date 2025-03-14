import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { TipoQualificacaoService } from "@/services/TipoQualificacaoService";
import { ComponentsService } from "@/services/ComponentsService";
import { useDebounce } from "@/hooks/useDebounce";
import SideBarMenuAppsAuxiliares from "../components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface TipoQualificacao {
  idtipo_qualificacao: number;
  descricao: string;
  idcomponente: number;
  componente_descricao?: string; // Adicionado para armazenar a descrição do componente
}

interface Componente {
  idcomponente: number;
  descricao: string;
}

const ListaQualificacao = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [qualificacoes, setQualificacoes] = useState<TipoQualificacao[]>([]);
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const isMounted = useRef(false);
  const isSearchFetch = useRef(false);
  const componentesMap = useRef<Map<number, string>>(new Map()); // Adicionado para lookup rápido

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Carregar componentes apenas uma vez no início
  useEffect(() => {
    isMounted.current = true;
    
    const carregarComponentes = async () => {
      try {
        const response = await ComponentsService.getAll();
        if (isMounted.current) {
          setComponentes(response);
          // Criar mapa de componentes para lookup rápido
          const map = new Map(response.map(componente => [componente.idcomponente, componente.descricao]));
          componentesMap.current = map;
        }
      } catch (err) {
        if (isMounted.current) {
          setError("Erro ao carregar componentes");
        }
      }
    };

    carregarComponentes();

    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.length < 3) return;
    
    if (debouncedSearchTerm) {
      isSearchFetch.current = true;
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const carregarQualificacoes = async () => {
      try {
        if (!isSearchFetch.current && isMounted.current) {
          setIsLoading(true);
        }

        const dataQual = await TipoQualificacaoService.getAllPaginated(
          currentPage, 
          itemsPerPage, 
          debouncedSearchTerm
        );
        
        if (isMounted.current) {
          // Usar o mapa de componentes para lookup rápido
          const qualificacoesComComponente = dataQual.data.map(qualificacao => ({
            ...qualificacao,
            componente_descricao: componentesMap.current.get(qualificacao.idcomponente) || ''
          }));

          setQualificacoes(qualificacoesComComponente);
          setTotalItems(dataQual.meta.total);
          setTotalPages(dataQual.meta.totalPages);
          setError(null);
        }
      } catch (err) {
        if (isMounted.current) {
          console.error("Erro ao carregar dados:", err);
          setError("Erro ao carregar qualificações");
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
          isSearchFetch.current = false;
        }
      }
    };

    if (debouncedSearchTerm && debouncedSearchTerm.length < 2) return;
    carregarQualificacoes();
  }, [currentPage, debouncedSearchTerm]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir esta qualificação?")) return;
    
    try {
      setProcessingId(id);
      await TipoQualificacaoService.delete(id);
      
      setQualificacoes((prev) => {
        const newData = prev.filter((item) => item.idtipo_qualificacao !== id);
        if (newData.length === 0 && currentPage > 1) {
          setCurrentPage((prevPage) => prevPage - 1);
        }
        return newData;
      });
    } catch (err) {
      console.error("Erro ao excluir:", err);
      setError("Não foi possível excluir. Verifique dependências ou tente novamente.");
    } finally {
      setProcessingId(null);
    }
  };

  const tableColumns = [
    { header: "Descrição", accessor: "descricao" as keyof TipoQualificacao },
    { 
      header: "Componente", 
      accessor: "componente_descricao" as keyof TipoQualificacao // Alterado para usar a descrição diretamente
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ListHeader
        title="Relatório de Qualificações"
        searchPlaceholder="Pesquisar qualificações..."
        onSearch={(value) => {
          setInputValue(value);
          setSearchTerm(value);
        }}
        searchValue={inputValue}
        onNewClick={() => navigate("/qualificacao/cadastro")}
        isProcessing={false}
        onMenuOpen={() => setIsMenuOpen(true)}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <DataTable
          data={qualificacoes}
          columns={tableColumns}
          loading={isLoading}
          error={error}
          onDismissError={() => setError(null)}
          emptyMessage="Nenhuma qualificação cadastrada"
          searchTerm={searchTerm}
          renderActions={(qualificacao) => (
            <ActionButtons
              onEdit={() => navigate(`/qualificacao/editar/${qualificacao.idtipo_qualificacao}`)}
              onDelete={() => handleDelete(qualificacao.idtipo_qualificacao)}
              isProcessing={processingId === qualificacao.idtipo_qualificacao}
              itemName={qualificacao.descricao}
            />
          )}
        />

        <Paginacao
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          isProcessing={isLoading}
          onPageChange={setCurrentPage}
        />
      </main>
    </div>
  );
};

export default ListaQualificacao;