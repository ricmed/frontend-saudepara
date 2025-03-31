import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Search, X, MapPin } from "lucide-react";
import EstabelecimentoDropdown from "./EstabelecimentoDropdown";

interface Estabelecimento {
  idestabelecimento: number;
  nome: string;
  cidade?: string;
  bairro?: string;
  cnes?: string;
}

interface UnidadeNotificadoraFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

const UnidadeNotificadoraField: React.FC<UnidadeNotificadoraFieldProps> = ({
  value,
  onChange,
  label = "Unidade Notificadora",
  placeholder = "Buscar unidade notificadora...",
  className = ""
}) => {
  const [unidadesNotificadoras, setUnidadesNotificadoras] = useState<Estabelecimento[]>([]);
  const [loadingUnidades, setLoadingUnidades] = useState(false);
  const [errorUnidades, setErrorUnidades] = useState<string | null>(null);
  const [searchEstabelecimento, setSearchEstabelecimento] = useState("");
  const [showEstabelecimentoSearch, setShowEstabelecimentoSearch] = useState(false);
  const [selectedEstabelecimento, setSelectedEstabelecimento] = useState<Estabelecimento | null>(null);
  
  const inputContainerRef = useRef<HTMLDivElement>(null);

  // Função para lidar com erros de CORS ou conectividade
  const handleApiError = (error: any) => {
    console.error("Erro na chamada da API:", error);
    let errorMessage = "Erro ao conectar com o servidor";
    
    if (error.message && error.message.includes("Network Error")) {
      errorMessage = "Erro de conexão com o servidor. Verifique se o backend está rodando.";
    } else if (error.message && error.message.includes("CORS")) {
      errorMessage = "Erro de CORS. Verifique a configuração de CORS no servidor.";
    } else if (error.response) {
      errorMessage = `Erro ${error.response.status}: ${error.response.statusText}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
    }
    
    setErrorUnidades(errorMessage);
    setUnidadesNotificadoras([]);
    setLoadingUnidades(false);
  };

  // Função para buscar as unidades notificadoras do backend
  const fetchUnidadesNotificadoras = async (searchTerm = "") => {
    try {
      setLoadingUnidades(true);
      setErrorUnidades(null);
      
      // Preparar parâmetros para a API
      const params: any = {
        limit: 100, // Buscar uma quantidade razoável de estabelecimentos
        orderBy: 'nome',
        orderDir: 'asc'
      };
      
      // Se houver um termo de busca, adicionar aos parâmetros
      if (searchTerm) {
        params.search = searchTerm;
        params.searchField = 'nome';
      }
      
      console.log('Buscando estabelecimentos com params:', params);
      
      // URL completa da API - AJUSTE PARA SEU AMBIENTE
      const apiUrl = 'http://localhost:3000/api/estabelecimentos';
      
      try {
        // Fazer a requisição à API com a URL completa
        const response = await axios.get(apiUrl, { 
          params,
          headers: {
            'Accept': 'application/json'
          }
        });
        
        console.log('Resposta da API de estabelecimentos:', response);
        
        // A resposta do backend tem formato { data: [...], pagination: {...} }
        if (response && response.data && response.data.data) {
          setUnidadesNotificadoras(response.data.data);
          console.log(`Encontrados ${response.data.data.length} estabelecimentos`);
        } else if (response && response.data && Array.isArray(response.data)) {
          // Caso a API retorne diretamente um array (sem o wrapper data)
          setUnidadesNotificadoras(response.data);
          console.log(`Encontrados ${response.data.length} estabelecimentos (formato array direto)`);
        } else {
          // Se a estrutura não for a esperada, inicializamos com array vazio
          console.warn('Formato de resposta inesperado:', response);
          setUnidadesNotificadoras([]);
        }
      } catch (apiError: any) {
        // Tratamento específico para erros de API
        handleApiError(apiError);
        return; // Sair da função para evitar dupla manipulação do estado
      }
      
      setLoadingUnidades(false);
    } catch (error: any) {
      console.error("Erro ao buscar unidades notificadoras:", error);
      if (error.response) {
        console.error("Detalhes da resposta de erro:", {
          status: error.response.status,
          data: error.response.data
        });
      }
      setErrorUnidades(error.message || "Erro ao carregar unidades");
      setLoadingUnidades(false);
      // Garantir que unidadesNotificadoras seja um array vazio em caso de erro
      setUnidadesNotificadoras([]);
    }
  };
  
  // Função para buscar estabelecimentos com base em um termo de busca
  const handleSearchEstabelecimento = async (term: string) => {
    setSearchEstabelecimento(term);
    
    // Buscar com pelo menos 2 caracteres
    if (term.length >= 2) {
      setLoadingUnidades(true);
      await fetchUnidadesNotificadoras(term);
    } else if (term.length === 0) {
      // Se o campo for limpo, recarregar sem filtro
      await fetchUnidadesNotificadoras("");
    }
  };

  // Carregar unidades iniciais ao montar o componente
  useEffect(() => {
    fetchUnidadesNotificadoras("");
  }, []);

  // Processar o valor inicial, se houver
  useEffect(() => {
    if (value && !selectedEstabelecimento) {
      // Se temos value mas não temos selectedEstabelecimento,
      // verificamos se já carregamos as unidades para encontrar a correspondente
      if (unidadesNotificadoras.length > 0) {
        const found = unidadesNotificadoras.find(
          u => u.idestabelecimento.toString() === value
        );
        
        if (found) {
          setSelectedEstabelecimento(found);
          setSearchEstabelecimento(found.nome);
        }
      }
    }
  }, [value, unidadesNotificadoras, selectedEstabelecimento]);

  // Função para selecionar um estabelecimento
  const handleSelectEstabelecimento = (estabelecimento: Estabelecimento) => {
    setSelectedEstabelecimento(estabelecimento);
    setSearchEstabelecimento(estabelecimento.nome);
    onChange(estabelecimento.idestabelecimento.toString());
    setShowEstabelecimentoSearch(false);
  };

  // Função para limpar a seleção
  const handleClearSelection = () => {
    setSelectedEstabelecimento(null);
    setSearchEstabelecimento("");
    onChange("");
  };

  return (
    <div className="w-full">
      {label && <label className="block mb-2 font-medium text-gray-700">{label}</label>}
      <div className="relative" ref={inputContainerRef}>
        {loadingUnidades && !showEstabelecimentoSearch ? (
          <div className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white flex items-center justify-center">
            <div className="animate-pulse flex gap-2 items-center">
              <div className="h-4 w-4 bg-blue-400 rounded-full"></div>
              <span>Carregando unidades...</span>
            </div>
          </div>
        ) : errorUnidades ? (
          <div className="w-full p-3 border border-red-200 rounded-lg text-sm bg-white">
            <div className="text-red-500 mb-2">{errorUnidades}</div>
            <button 
              onClick={() => fetchUnidadesNotificadoras("")} 
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              type="button"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2 unidade-search-container">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={placeholder}
                  value={searchEstabelecimento}
                  onChange={(e) => handleSearchEstabelecimento(e.target.value)}
                  onFocus={() => setShowEstabelecimentoSearch(true)}
                  className={`w-full p-3 pl-9 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none ${className}`}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                {searchEstabelecimento && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={handleClearSelection}
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEstabelecimentoSearch(true);
                  fetchUnidadesNotificadoras(searchEstabelecimento);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
            
            <EstabelecimentoDropdown
              isOpen={showEstabelecimentoSearch}
              searchTerm={searchEstabelecimento}
              onSearchChange={handleSearchEstabelecimento}
              loading={loadingUnidades}
              estabelecimentos={unidadesNotificadoras}
              onSelect={handleSelectEstabelecimento}
              onClose={() => setShowEstabelecimentoSearch(false)}
              buttonRef={inputContainerRef}
            />
            
            {/* Mostra a unidade selecionada */}
            {selectedEstabelecimento && !showEstabelecimentoSearch && (
              <div className="mt-2 p-2 bg-blue-50 text-blue-800 text-sm rounded flex justify-between items-center">
                <span>Unidade selecionada: {selectedEstabelecimento.nome}</span>
                <button 
                  type="button" 
                  className="text-blue-600 hover:text-blue-800"
                  onClick={handleClearSelection}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UnidadeNotificadoraField;