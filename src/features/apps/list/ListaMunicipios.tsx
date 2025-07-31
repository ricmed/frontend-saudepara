import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMunicipios, useDeleteMunicipio } from "../hooks/useMunicipio";
import { useEstados } from "../hooks/useEstado";
import { useDebounce } from "@/hooks/useDebounce";
import SideBarMenuAppsAuxiliares from "../../apps/components/SideBarMenuAppsAuxiliares";
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
  const [selectedEstado, setSelectedEstado] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const itemsPerPage = 20;
  const estadoNamesCache = useRef<Record<number, string>>({});

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // React Query hooks
  const { data: estadosData } = useEstados(1, 999, ''); // Buscar todos os estados
  const { 
    data: municipiosData, 
    isLoading, 
    error 
  } = useMunicipios(currentPage, itemsPerPage, debouncedSearchTerm, selectedEstado || undefined);
  const deleteMutation = useDeleteMunicipio();

  const estados = estadosData?.data || [];
  const municipios = municipiosData?.data || [];
  const totalItems = municipiosData?.pagination?.total || 0;
  const totalPages = Math.min(Math.max(municipiosData?.pagination?.pages || 1, 1), 1000);

  // Criar cache de estados
  useEffect(() => {
    if (estados.length > 0) {
      const cache: Record<number, string> = {};
      estados.forEach((estado: Estado) => {
        cache[estado.idtipo_estado] = estado.descricao;
      });
      estadoNamesCache.current = cache;
      console.log('Cache de estados:', cache);
    }
  }, [estados]);

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

  // Reset da página quando alterar filtros
  useEffect(() => {
    if (debouncedSearchTerm) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

  const handleDelete = async (municipio: Municipio) => {
    if (!window.confirm(`Deseja realmente excluir o município "${municipio.descricao}"?`)) return;

    try {
      await deleteMutation.mutateAsync(municipio.idtipo_municipio);
      
      // Se não há mais itens na página atual, volta uma página
      if (municipios.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } catch (err) {
      console.error('Erro ao excluir município:', err);
    }
  };

  const municipiosProcessados = processarMunicipios(municipios);

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
        onNewClick={() => navigate("/private/municipio/nova")}
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
          data={municipiosProcessados}
          columns={tableColumns}
          loading={isLoading}
          error={error ? "Erro ao carregar municípios" : null}
          onDismissError={() => {}}
          emptyMessage="Nenhum município cadastrado"
          searchTerm={searchTerm}
          renderActions={(municipio) => (
            <ActionButtons
              onEdit={() => navigate(`/private/municipio/editar/${municipio.idtipo_municipio}`)}
              onDelete={() => handleDelete(municipio)}
              isProcessing={deleteMutation.isPending}
              itemName={municipio.descricao}
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

export default ListaMunicipios;
