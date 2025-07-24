import axios, { AxiosError } from 'axios';

const server = import.meta.env.VITE_API_SERVER;
const port = import.meta.env.VITE_API_PORT;
const API_URL = `${server}:${port}/api/tipo-evento`;

interface TipoEvento {
  idtipo_evento: number;
  descricao: string;
  ativo: string;  // 🆕 CAMPO ADICIONADO
}

interface PaginatedResponse {
  data: TipoEvento[];
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

export const TiposEventoService = {
  getAll: async (): Promise<TipoEvento[]> => {
    try {
      const response = await axios.get<{ data: TipoEvento[] }>(API_URL);
      return response.data.data;
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  // 🆕 NOVO MÉTODO - Buscar apenas ativos
  getAllAtivos: async (): Promise<TipoEvento[]> => {
    try {
      const response = await axios.get<TipoEvento[]>(`${API_URL}/ativos`);
      return response.data;
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

      const response = await axios.get<{ data: TipoEvento[], pagination: any }>(url, { params });
      
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

  getById: async (id: number): Promise<TipoEvento> => {
    try {
      if (isNaN(id) || id <= 0) throw new Error('ID inválido');
      
      const response = await axios.get<TipoEvento>(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  // 🔄 MÉTODO ATUALIZADO - Incluir campo ativo
  create: async (descricao: string, ativo: string = 'S'): Promise<TipoEvento> => {
    try {
      const response = await axios.post<TipoEvento>(API_URL, { 
        descricao: descricao.trim(),
        ativo  // 🆕 CAMPO ADICIONADO
      });
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  // 🔄 MÉTODO ATUALIZADO - Incluir campo ativo
  update: async (id: number, descricao: string, ativo?: string): Promise<void> => {
    try {
      if (isNaN(id) || id <= 0) throw new Error('ID inválido');
      
      const data: any = { descricao: descricao.trim() };
      if (ativo !== undefined) {
        data.ativo = ativo;  // 🆕 CAMPO ADICIONADO
      }
      
      await axios.put(`${API_URL}/${id}`, data);
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  // 🆕 NOVO MÉTODO - Toggle ativo/inativo
  toggleAtivo: async (id: number): Promise<TipoEvento> => {
    try {
      if (isNaN(id) || id <= 0) throw new Error('ID inválido');
      
      const response = await axios.put<{ data: TipoEvento }>(`${API_URL}/${id}/toggle`);
      return response.data.data;
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
      const response = await axios.get<{ data: TipoEvento[] }>(`${API_URL}/search`, {
        params: {
          descricao: descricao.trim(),
          limit: 1
        }
      });

      if (response.data.data.length === 0) return false;
      if (!excludeId) return true;

      return response.data.data.some(tipo => 
        tipo.descricao.toLowerCase() === descricao.toLowerCase() && 
        tipo.idtipo_evento !== excludeId
      );
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },
  
  getAllForSelect: async (): Promise<TipoEvento[]> => {
    try {
      const response = await axios.get<TipoEvento[]>(`${API_URL}/select`);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  }
};