import axios, { AxiosError } from 'axios';
import { getApiUrl } from '../config/api';

const API_URL = getApiUrl('/tipo-municipio');

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

interface PaginatedResponse {
  data: Municipio[];
  pagination: {
    total: number;
    pages: number;
    currentPage: number;
    perPage: number;
  };
}

interface APIError {
  message: string;
  code?: string;
}

const handleApiError = (error: AxiosError<APIError>) => {
  console.error('API Error:', error);
  throw new Error(
    error.response?.data?.message || 
    'Ocorreu um erro inesperado. Tente novamente mais tarde.'
  );
};

export const MunicipioService = {
  getAll: async (): Promise<Municipio[]> => {
    try {
      // 🔧 CORREÇÃO: Usar endpoint select para buscar TODOS os municípios sem paginação
      const response = await axios.get<Municipio[]>(`${API_URL}/select`);
      
      // Se o endpoint select retornar array direto
      if (Array.isArray(response.data)) {
        console.log(`✅ Carregados ${response.data.length} municípios (todos os estados)`);
        return response.data;
      }
      
      // Fallback: tentar com limite alto no endpoint principal
      const fallbackResponse = await axios.get<PaginatedResponse>(`${API_URL}?limit=10000`);
      if (fallbackResponse.data && fallbackResponse.data.data && Array.isArray(fallbackResponse.data.data)) {
        console.log(`✅ Carregados ${fallbackResponse.data.data.length} municípios (fallback com limite alto)`);
        return fallbackResponse.data.data;
      } else {
        console.error('Resposta inesperada do servidor:', fallbackResponse.data);
        return [];
      }
    } catch (error) {
      console.error('Erro em getAll:', error);
      // Último fallback: tentar endpoint principal com limite padrão
      try {
        const response = await axios.get<PaginatedResponse>(API_URL);
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          console.warn(`⚠️ Carregados apenas ${response.data.data.length} municípios (limitado)`);
          return response.data.data;
        }
      } catch (fallbackError) {
        console.error('Erro no fallback:', fallbackError);
      }
      return [];
    }
  },

  getAllPaginated: async (
    page: number,
    itemsPerPage: number,
    searchTerm: string = '',
    estadoId?: number
  ): Promise<PaginatedResponse> => {
    try {
      let endpoint = searchTerm ? '/search' : '';
      const params: any = {
        page,
        limit: itemsPerPage
      };

      if (searchTerm) {
        params.descricao = searchTerm;
      }

      if (estadoId && estadoId > 0) {
        console.log('Filtro por estado:', estadoId);
        params.tipo_estado_idtipo_estado = estadoId;
      }

      console.log(`Fazendo requisição para ${API_URL}${endpoint} com params:`, params);
      
      const response = await axios.get<PaginatedResponse>(`${API_URL}${endpoint}`, { params });
      
      console.log('Resposta do servidor:', response.status);
      console.log('Total de itens retornados:', response.data.data?.length || 0);
      
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar municípios:', error);
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  getById: async (id: number): Promise<Municipio | null> => {
    try {
      if (isNaN(id) || id <= 0) {
        throw new Error('ID inválido');
      }
      
      const response = await axios.get<Municipio>(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar município ${id}:`, error);
      return null;
    }
  },

  create: async (
    codigo: string, 
    descricao: string,
    estadoId: number
  ): Promise<Municipio | null> => {
    try {
      if (codigo.length > 10) {
        throw new Error('Código deve ter no máximo 10 caracteres');
      }
      if (descricao.length > 60) {
        throw new Error('Descrição deve ter no máximo 60 caracteres');
      }
      if (isNaN(estadoId) || estadoId <= 0) {
        throw new Error('ID do estado inválido');
      }

      const response = await axios.post<Municipio>(API_URL, {
        codigo: codigo.trim(),
        descricao: descricao.trim(),
        tipo_estado_idtipo_estado: estadoId
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao criar município:', error);
      return null;
    }
  },

  update: async (
    id: number,
    codigo: string,
    descricao: string,
    estadoId: number
  ): Promise<boolean> => {
    try {
      if (isNaN(id) || id <= 0) {
        throw new Error('ID inválido');
      }
      if (codigo.length > 10) {
        throw new Error('Código deve ter no máximo 10 caracteres');
      }
      if (descricao.length > 60) {
        throw new Error('Descrição deve ter no máximo 60 caracteres');
      }
      if (isNaN(estadoId) || estadoId <= 0) {
        throw new Error('ID do estado inválido');
      }

      await axios.put(`${API_URL}/${id}`, {
        codigo: codigo.trim(),
        descricao: descricao.trim(),
        tipo_estado_idtipo_estado: estadoId
      });
      
      return true;
    } catch (error) {
      console.error(`Erro ao atualizar município ${id}:`, error);
      return false;
    }
  },

  delete: async (id: number): Promise<boolean> => {
    try {
      if (isNaN(id) || id <= 0) {
        throw new Error('ID inválido');
      }
      
      await axios.delete(`${API_URL}/${id}`);
      return true;
    } catch (error) {
      console.error(`Erro ao excluir município ${id}:`, error);
      return false;
    }
  }
};