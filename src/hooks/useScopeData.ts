import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../services/adminApi';

// Tipos para os dados
export interface Estado {
  id: number;
  codigo: string;
  nome: string;
  sigla: string;
}

export interface Municipio {
  id: number;
  codigo: string;
  nome: string;
  estado_id: number;
  estado: Estado;
}

export interface Unidade {
  id: number;
  nome: string;
  cnes: string | null;
  codigo_unidade: string | null;
  municipio_id: number | null;
  municipio: Municipio | null;
}

// Interfaces para os hooks
interface UseScopeDataResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook para buscar estados baseado no escopo do usuário
 */
export const useEstados = (): UseScopeDataResult<Estado> => {
  const [data, setData] = useState<Estado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEstados = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🏛️ Buscando estados baseado no escopo do usuário...');
      
      const response = await adminApi.get('/scopes/estados');
      
      if (response.data.success) {
        setData(response.data.data || []);
        console.log(`✅ ${response.data.data.length} estados carregados`);
      } else {
        throw new Error(response.data.error || 'Erro ao buscar estados');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Erro ao carregar estados';
      console.error('❌ Erro ao buscar estados:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEstados();
  }, [fetchEstados]);

  return {
    data,
    loading,
    error,
    refetch: fetchEstados
  };
};

/**
 * Hook para buscar municípios baseado no escopo do usuário e estado selecionado
 */
export const useMunicipios = (estadoId?: number): UseScopeDataResult<Municipio> => {
  const [data, setData] = useState<Municipio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMunicipios = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🏙️ Buscando municípios baseado no escopo - estado_id: ${estadoId}`);
      
      const params = estadoId ? { estado_id: estadoId } : {};
      const response = await adminApi.get('/scopes/municipios', { params });
      
      if (response.data.success) {
        setData(response.data.data || []);
        console.log(`✅ ${response.data.data.length} municípios carregados`);
      } else {
        throw new Error(response.data.error || 'Erro ao buscar municípios');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Erro ao carregar municípios';
      console.error('❌ Erro ao buscar municípios:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [estadoId]);

  useEffect(() => {
    fetchMunicipios();
  }, [fetchMunicipios]);

  return {
    data,
    loading,
    error,
    refetch: fetchMunicipios
  };
};

/**
 * Hook para buscar unidades baseado no escopo do usuário, estado e município selecionados
 */
export const useUnidades = (estadoId?: number, municipioId?: number): UseScopeDataResult<Unidade> => {
  const [data, setData] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnidades = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🏥 Buscando unidades - estado_id: ${estadoId}, municipio_id: ${municipioId}`);
      
      const params: any = {};
      if (municipioId) params.municipio_id = municipioId;
      else if (estadoId) params.estado_id = estadoId;
      
      const response = await adminApi.get('/scopes/unidades', { params });
      
      if (response.data.success) {
        setData(response.data.data || []);
        console.log(`✅ ${response.data.data.length} unidades carregadas`);
      } else {
        throw new Error(response.data.error || 'Erro ao buscar unidades');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Erro ao carregar unidades';
      console.error('❌ Erro ao buscar unidades:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [estadoId, municipioId]);

  useEffect(() => {
    fetchUnidades();
  }, [fetchUnidades]);

  return {
    data,
    loading,
    error,
    refetch: fetchUnidades
  };
};

/**
 * Hook combinado para gerenciar seleção hierárquica de Estado → Município → Unidade
 */
export const useHierarchicalSelection = () => {
  const [selectedEstado, setSelectedEstado] = useState<number | undefined>(undefined);
  const [selectedMunicipio, setSelectedMunicipio] = useState<number | undefined>(undefined);
  const [selectedUnidade, setSelectedUnidade] = useState<number | undefined>(undefined);

  // Buscar dados baseado nas seleções
  const estados = useEstados();
  const municipios = useMunicipios(selectedEstado);
  const unidades = useUnidades(selectedEstado, selectedMunicipio);

  // Limpar seleções dependentes quando seleção pai muda
  const handleEstadoChange = useCallback((estadoId: number | undefined) => {
    setSelectedEstado(estadoId);
    setSelectedMunicipio(undefined); // Limpar município
    setSelectedUnidade(undefined);  // Limpar unidade
  }, []);

  const handleMunicipioChange = useCallback((municipioId: number | undefined) => {
    setSelectedMunicipio(municipioId);
    setSelectedUnidade(undefined);  // Limpar unidade
  }, []);

  const handleUnidadeChange = useCallback((unidadeId: number | undefined) => {
    setSelectedUnidade(unidadeId);
  }, []);

  // Encontrar objetos selecionados completos
  const selectedEstadoData = estados.data.find(e => e.id === selectedEstado);
  const selectedMunicipioData = municipios.data.find(m => m.id === selectedMunicipio);
  const selectedUnidadeData = unidades.data.find(u => u.id === selectedUnidade);

  // Função para definir valores programaticamente (útil para edição)
  const setValues = useCallback((estadoId?: number, municipioId?: number, unidadeId?: number) => {
    setSelectedEstado(estadoId);
    setSelectedMunicipio(municipioId);
    setSelectedUnidade(unidadeId);
  }, []);

  // Função para limpar todas as seleções
  const clearAll = useCallback(() => {
    setSelectedEstado(undefined);
    setSelectedMunicipio(undefined);
    setSelectedUnidade(undefined);
  }, []);

  return {
    // Estados dos dados
    estados,
    municipios,
    unidades,
    
    // Seleções atuais (IDs)
    selectedEstado,
    selectedMunicipio,
    selectedUnidade,
    
    // Objetos completos selecionados
    selectedEstadoData,
    selectedMunicipioData,
    selectedUnidadeData,
    
    // Handlers para mudança de seleção
    handleEstadoChange,
    handleMunicipioChange,
    handleUnidadeChange,
    
    // Utilitários
    setValues,
    clearAll,
    
    // Estado de loading geral
    loading: estados.loading || municipios.loading || unidades.loading,
    
    // Erros
    errors: {
      estados: estados.error,
      municipios: municipios.error,
      unidades: unidades.error
    }
  };
};
