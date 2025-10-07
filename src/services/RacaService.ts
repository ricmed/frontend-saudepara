import axios, { AxiosError } from 'axios';

const API_URL = getApiUrl('/tipo-raca');

interface Raca {
  idtipo_raca: number;
  descricao: string;
}

interface PaginatedResponse {
  data: Raca[];
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
  if (error.response?.data?.message === 'Já existe uma raça com esta descrição') {
    throw new Error(error.response.data.message);
  }
  throw new Error(
    error.response?.data?.message || 
    'Ocorreu um erro inesperado. Tente novamente mais tarde.'
  );
};

export const RacaService = {
  getAll: async (): Promise<Raca[]> => {
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
      // Só realiza a busca se tiver 3 ou mais caracteres
      if (searchTerm && searchTerm.length >= 3) {
        response = await axios.get<{ data: Raca[], pagination: any }>(`${API_URL}/search`, {
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
        response = await axios.get<{ data: Raca[], pagination: any }>(API_URL, {
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

  getById: async (id: number): Promise<Raca> => {
    try {
      if (isNaN(id) || id <= 0) throw new Error('ID inválido');
      
      const response = await axios.get<Raca>(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  create: async (descricao: string): Promise<Raca> => {
    try {
      const response = await axios.post<Raca>(API_URL, { 
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
      const response = await axios.get<{ data: Raca[] }>(`${API_URL}/search`, {
        params: {
          descricao: descricao,
          limit: 1
        }
      });

      if (response.data.data.length === 0) return false;

      if (!excludeId) return true;

      return response.data.data.some(raca => 
        raca.descricao.toLowerCase() === descricao.toLowerCase() && 
        raca.idtipo_raca !== excludeId
      );
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  }
};