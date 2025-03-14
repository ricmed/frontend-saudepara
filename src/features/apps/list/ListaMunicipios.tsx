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

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    isMounted.current = true;
    
    const carregarEstados = async () => {
      try {
        const response = await EstadoService.getAllForSelect();
        if (isMounted.current) {
          setEstados(response);
        }
      } catch (err) {
        if (isMounted.current) {
          setError("Erro ao carregar estados");
        }
      }
    };

    carregarEstados();

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
    const carregarMunicipios = async () => {
      try {
        if (!isSearchFetch.current && isMounted.current) setLoading(true);

        const response = await MunicipioService.getAllPaginated(
          currentPage,
          itemsPerPage,
          debouncedSearchTerm,
          selectedEstado || undefined
        );
        
        console.log('Dados recebidos:', response.data);

        if (isMounted.current) {
          setMunicipios(response.data);
          setTotalItems(response.pagination.total);
          setTotalPages(Math.min(Math.max(response.pagination.pages, 1), 1000));
        }
      } catch (err) {
        if (isMounted.current) {
          setError("Erro ao carregar municípios");
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

  // Add debug log
  useEffect(() => {
    console.log('Municipios atualizados:', municipios);
  }, [municipios]);

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
      accessor: (row: Municipio) => {
        console.log('Row data:', row);
        return row.tipo_estado?.descricao || '';
      }
    }
  ];

  const renderEstadoFilter = (
    <select
      value={selectedEstado}
      onChange={(e) => {
        setSelectedEstado(Number(e.target.value));
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