import axios, { AxiosError } from 'axios';
import { getApiUrl } from '../config/api';

const API_URL = getApiUrl('/tipo-hipotese-diag');

interface TipoHipoteseDiag {
  idtipo_hipotese_diag: number;
  descricao: string;
}

interface PaginatedResponse {
  data: TipoHipoteseDiag[];
  meta: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

interface APIError {
  status: string;
  message: string;
}

const handleApiError = (error: AxiosError<APIError>) => {
  console.error('API Error:', error);
  throw new Error(
    error.response?.data?.message || 
    'Ocorreu um erro inesperado. Tente novamente mais tarde.'
  );
};

export const TiposHipoteseDiagService = {
  getAll: async (): Promise<TipoHipoteseDiag[]> => {
    try {
      const response = await axios.get<{ data: TipoHipoteseDiag[] }>(API_URL);
      return response.data.data;
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  getAllPaginated: async (
    page: number,
    itemsPerPage: number,
    searchTerm: string = ''
  ): Promise<PaginatedResponse> => {
    try {
      let url = API_URL;
      const params: Record<string, any> = {
        page,
        limit: itemsPerPage
      };

      if (searchTerm) {
        url = `${API_URL}/search`;
        params.descricao = searchTerm;
      }

      const response = await axios.get<{ data: TipoHipoteseDiag[], pagination: any }>(url, { params });
      
      // Convertendo o formato da resposta para manter compatibilidade
      return {
        data: response.data.data,
        meta: {
          total: response.data.pagination.total,
          totalPages: response.data.pagination.pages,
          page: response.data.pagination.currentPage,
          limit: response.data.pagination.perPage
        }
      };
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  getById: async (id: number): Promise<TipoHipoteseDiag> => {
    try {
      if (isNaN(id) || id <= 0) throw new Error('ID inválido');
      
      const response = await axios.get<TipoHipoteseDiag>(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  create: async (descricao: string): Promise<TipoHipoteseDiag> => {
    try {
      const response = await axios.post<TipoHipoteseDiag>(API_URL, { 
        descricao: descricao.trim() 
      });
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  update: async (id: number, descricao: string): Promise<void> => {
    try {
      if (isNaN(id) || id <= 0) throw new Error('ID inválido');
      
      await axios.put(`${API_URL}/${id}`, { 
        descricao: descricao.trim() 
      });
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      if (isNaN(id) || id <= 0) throw new Error('ID inválido');
      
      await axios.delete(`${API_URL}/${id}`);
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  checkExisting: async (
    descricao: string, 
    excludeId?: number
  ): Promise<boolean> => {
    try {
      // Usando o endpoint de busca para verificar duplicatas
      const response = await axios.get<{ data: TipoHipoteseDiag[] }>(`${API_URL}/search`, {
        params: {
          descricao: descricao.trim(),
          limit: 1
        }
      });

      // Se não encontrou nenhum tipo de hipótese diagnóstica, retorna false
      if (response.data.data.length === 0) return false;

      // Se encontrou e não temos excludeId, então existe duplicata
      if (!excludeId) return true;

      // Se temos excludeId, verifica se o tipo encontrado é diferente do atual
      return response.data.data.some(tipo => 
        tipo.descricao.toLowerCase() === descricao.toLowerCase() && 
        tipo.idtipo_hipotese_diag !== excludeId
      );
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },
  
  getAllForSelect: async (): Promise<TipoHipoteseDiag[]> => {
    try {
      const response = await axios.get<TipoHipoteseDiag[]>(`${API_URL}/select`);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  }
};