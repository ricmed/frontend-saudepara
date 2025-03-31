import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MunicipioService } from "@/services/MunicipioService";
import { EstadoService } from "@/services/EstadoService";
import { useDebounce } from "@/hooks/useDebounce";
import SideBarMenuAppsAuxiliares from "../components/SideBarMenuAppsAuxiliares";
import { ListHeader, DataTable, ActionButtons } from "@/features/apps/list/shared";
import Paginacao from "./paginacao";

interface Municipio {
  idtipo_municipio: number;
  codigo: string;
  descricao: string;
  tipo_estado_idtipo_estado: number;
  tipo_estado?: {
    idtipo_estado: number;
    descricao: string;
  };
  estado_nome?: string;
}

interface Estado {
  idtipo_estado: number;
  codigo: string;
  descricao: string;
}

const ListaMunicipios = () => {
  const navigate = useNavigate();
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [selectedEstado, setSelectedEstado] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const itemsPerPage = 20;
  const isMounted = useRef(false);
  const isSearchFetch = useRef(false);
  const estadoNamesCache = useRef<Record<number, string>>({});
  const todosMunicipios = useRef<Municipio[]>([]);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    isMounted.current = true;
    
    const carregarEstados = async () => {
      try {
        const response = await EstadoService.getAllForSelect();
        if (isMounted.current) {
          setEstados(response);
          
          // Criar um cache de IDs de estado para nomes
          const cache: Record<number, string> = {};
          response.forEach((estado: Estado) => {
            cache[estado.idtipo_estado] = estado.descricao;
          });
          estadoNamesCache.current = cache;
          console.log('Cache de estados:', cache);
        }
      } catch (err) {
        if (isMounted.current) {
          setError("Erro ao carregar estados");
          console.error("Erro ao carregar estados:", err);
        }
      }
    };

    carregarEstados();

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Função para processar municípios e adicionar estado_nome
  const processarMunicipios = (municipios: Municipio[]) => {
    if (!Array.isArray(municipios)) {
      console.error('Dados não são um array:', municipios);
      return [];
    }
    
    return municipios.map(municipio => {
      const estadoNome = estadoNamesCache.current[municipio.tipo_estado_idtipo_estado] || '';
      
      return {
        ...municipio,
        estado_nome: estadoNome,
        tipo_estado: municipio.tipo_estado || {
          idtipo_estado: municipio.tipo_estado_idtipo_estado,
          descricao: estadoNome
        }
      };
    });
  };

  useEffect(() => {
    if (debouncedSearchTerm) {
      isSearchFetch.current = true;
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

  // Este efeito lida com a paginação e a filtragem por termo de busca
  useEffect(() => {
    const carregarMunicipios = async () => {
      try {
        if (!isSearchFetch.current && isMounted.current) setLoading(true);
        
        console.log(`Buscando municípios - Página: ${currentPage}, Termo: ${debouncedSearchTerm}`);
        
        // Definir parâmetros para a busca
        const params = {
          page: currentPage,
          limit: itemsPerPage,
          ...(debouncedSearchTerm ? { descricao: debouncedSearchTerm } : {}),
          ...(selectedEstado > 0 ? { tipo_estado_idtipo_estado: selectedEstado } : {})
        };
        
        // Tentar obter municípios
        const response = await MunicipioService.getAllPaginated(
          params.page,
          params.limit,
          params.descricao,
          params.tipo_estado_idtipo_estado
        );
        
        if (isMounted.current) {
          // Processar os municípios recebidos
          const municipiosProcessados = processarMunicipios(response.data);
          
          // Atualizar o estado
          setMunicipios(municipiosProcessados);
          setTotalItems(response.pagination.total);
          setTotalPages(Math.min(Math.max(response.pagination.pages, 1), 1000));
          
          // Atualizar cache de municípios
          if (currentPage === 1) {
            // Se for a primeira página, substituir o cache
            todosMunicipios.current = municipiosProcessados;
          } else {
            // Senão, adicionar ao cache existente
            todosMunicipios.current = [...todosMunicipios.current, ...municipiosProcessados];
          }
        }
      } catch (err) {
        if (isMounted.current) {
          setError("Erro ao carregar municípios");
          console.error("Erro ao carregar municípios:", err);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
          isSearchFetch.current = false;
        }
      }
    };

    carregarMunicipios();
  }, [currentPage, debouncedSearchTerm, selectedEstado]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir este município?")) return;

    try {
      setProcessingId(id);
      await MunicipioService.delete(id);

      // Remover o município excluído de todas as listas
      todosMunicipios.current = todosMunicipios.current.filter(
        item => item.idtipo_municipio !== id
      );
      
      setMunicipios((prev) => {
        const newData = prev.filter((item) => item.idtipo_municipio !== id);
        if (newData.length === 0 && currentPage > 1) {
          setCurrentPage((prevPage) => prevPage - 1);
        }
        return newData;
      });
    } catch (err) {
      setError("Erro ao excluir o município");
    } finally {
      setProcessingId(null);
    }
  };

  const tableColumns = [
    { 
      header: "Código", 
      accessor: "codigo" as keyof Municipio
    },
    { 
      header: "Descrição", 
      accessor: "descricao" as keyof Municipio
    },
    { 
      header: "Estado", 
      accessor: "estado_nome" as keyof Municipio
    }
  ];

  const renderEstadoFilter = (
    <select
      value={selectedEstado}
      onChange={(e) => {
        const novoEstadoId = Number(e.target.value);
        console.log(`Filtro de estado alterado para: ${novoEstadoId}`);
        setSelectedEstado(novoEstadoId);
        // Resetar para a primeira página ao mudar o filtro
        setCurrentPage(1);
      }}
      className="w-64 pl-4 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
    >
      <option value={0}>Todos os Estados</option>
      {estados.map((estado) => (
        <option key={estado.idtipo_estado} value={estado.idtipo_estado}>
          {estado.descricao}
        </option>
      ))}
    </select>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <ListHeader
        title="Lista de Municípios"
        searchPlaceholder="Pesquisar município..."
        onSearch={(value) => {
          setInputValue(value);
          setSearchTerm(value);
        }}
        searchValue={inputValue}
        onNewClick={() => navigate("/municipio/cadastro")}
        isProcessing={false}
        onMenuOpen={() => setIsMenuOpen(true)}
        extraFilter={renderEstadoFilter}
      />

      <SideBarMenuAppsAuxiliares
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <DataTable
          data={municipios}
          columns={tableColumns}
          loading={loading}
          error={error}
          onDismissError={() => setError(null)}
          emptyMessage="Nenhum município cadastrado"
          searchTerm={searchTerm}
          renderActions={(municipio) => (
            <ActionButtons
              onEdit={() => navigate(`/municipio/editar/${municipio.idtipo_municipio}`)}
              onDelete={() => handleDelete(municipio.idtipo_municipio)}
              isProcessing={processingId === municipio.idtipo_municipio}
              itemName={municipio.descricao}
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

export default ListaMunicipios;