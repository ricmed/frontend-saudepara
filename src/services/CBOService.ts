import axios, { AxiosError } from 'axios';
import { getApiUrl } from '../config/api';

const API_URL = getApiUrl('/tipo-cbo');

interface CBO {
  idtipo_cbo: number;
  codigo: string;
  descricao: string;
}

interface PaginatedResponse {
  data: CBO[];
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
  console.error('🔥 Erro na API do CBO:', {
    message: error.message,
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    config: {
      url: error.config?.url,
      method: error.config?.method,
    }
  });
  
  if (error.response?.data?.message === 'Já existe um CBO com este código ou descrição') {
    throw new Error(error.response.data.message);
  }
  throw new Error(
    error.response?.data?.message || 
    'Ocorreu um erro inesperado. Tente novamente mais tarde.'
  );
};

export const CBOService = {
  getAll: async (): Promise<CBO[]> => {
    try {
      const response = await axios.get<PaginatedResponse>(API_URL);
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
      let response;
      if (searchTerm) {
        response = await axios.get<{ data: CBO[], pagination: any }>(`${API_URL}/search`, {
          params: {
            descricao: searchTerm,
            page,
            limit: itemsPerPage
          }
        });
        
        return {
          data: response.data.data,
          meta: {
            total: response.data.pagination.total,
            totalPages: response.data.pagination.pages,
            page: response.data.pagination.currentPage,
            limit: response.data.pagination.perPage
          }
        };
      } else {
        response = await axios.get<{ data: CBO[], pagination: any }>(API_URL, {
          params: {
            page,
            limit: itemsPerPage
          }
        });
        
        return {
          data: response.data.data,
          meta: {
            total: response.data.pagination.total,
            totalPages: response.data.pagination.pages,
            page: response.data.pagination.currentPage,
            limit: response.data.pagination.perPage
          }
        };
      }
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  getById: async (id: number): Promise<CBO> => {
    try {
      if (isNaN(id) || id <= 0) throw new Error('ID inválido');
      
      const response = await axios.get<CBO>(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  create: async (data: { codigo: string, descricao: string }): Promise<CBO> => {
    try {
      const response = await axios.post<CBO>(API_URL, { 
        codigo: data.codigo.trim(),
        descricao: data.descricao.trim() 
      });
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  update: async (id: number, data: { codigo: string, descricao: string }): Promise<void> => {
    try {
      if (isNaN(id) || id <= 0) throw new Error('ID inválido');
      
      await axios.put(`${API_URL}/${id}`, { 
        codigo: data.codigo.trim(),
        descricao: data.descricao.trim() 
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
      handleApiError(error as AxiosError<APIError>);
    }
  },

  checkExisting: async (
    codigo: string, 
    excludeId?: number
  ): Promise<boolean> => {
    try {
      // Buscamos por CBOs com o mesmo código
      const response = await axios.get<{ data: CBO[] }>(`${API_URL}/search`, {
        params: {
          descricao: codigo,
          limit: 1
        }
      });

      // Se não encontrou nenhum CBO, retorna false
      if (response.data.data.length === 0) return false;

      // Se encontrou e não temos excludeId, então existe duplicata
      if (!excludeId) return true;

      // Se temos excludeId, verifica se o CBO encontrado é diferente do atual
      return response.data.data.some(cbo => 
        cbo.codigo === codigo && cbo.idtipo_cbo !== excludeId
      );
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  checkExistingDescricao: async (
    descricao: string, 
    excludeId?: number
  ): Promise<boolean> => {
    try {
      // Buscamos por CBOs com a mesma descrição
      const response = await axios.get<{ data: CBO[] }>(`${API_URL}/search`, {
        params: {
          descricao: descricao,
          limit: 1
        }
      });

      // Se não encontrou nenhum CBO, retorna false
      if (response.data.data.length === 0) return false;

      // Se encontrou e não temos excludeId, então existe duplicata
      if (!excludeId) return true;

      // Se temos excludeId, verifica se o CBO encontrado é diferente do atual
      return response.data.data.some(cbo => 
        cbo.descricao.toLowerCase() === descricao.toLowerCase() && 
        cbo.idtipo_cbo !== excludeId
      );
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  }
};