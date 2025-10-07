import axios, { AxiosError } from 'axios';
const server = import.meta.env.VITE_API_SERVER;
const port = import.meta.env.VITE_API_PORT;
const API_URL = `${server}:${port}/api/tipo-genero`;

interface Genero {
  idtipo_genero: number;
  descricao: string;
}

interface PaginatedResponse {
  data: Genero[];
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
  if (error.response?.data?.message === 'Já existe um gênero com esta descrição') {
    throw new Error(error.response.data.message);
  }
  throw new Error(
    error.response?.data?.message || 
    'Ocorreu um erro inesperado. Tente novamente mais tarde.'
  );
};

export const GeneroService = {
  getAll: async (): Promise<Genero[]> => {
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
        response = await axios.get<{ data: Genero[], pagination: any }>(`${API_URL}/search`, {
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
        response = await axios.get<{ data: Genero[], pagination: any }>(API_URL, {
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

  getById: async (id: number): Promise<Genero> => {
    try {
      if (isNaN(id) || id <= 0) throw new Error('ID inválido');
      
      const response = await axios.get<Genero>(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  create: async (descricao: string): Promise<Genero> => {
    try {
      const response = await axios.post<Genero>(API_URL, { 
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
      const response = await axios.get<{ data: Genero[] }>(`${API_URL}/search`, {
        params: {
          descricao: descricao,
          limit: 1
        }
      });

      if (response.data.data.length === 0) return false;

      if (!excludeId) return true;

      return response.data.data.some(genero => 
        genero.descricao.toLowerCase() === descricao.toLowerCase() && 
        genero.idtipo_genero !== excludeId
      );
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  }
};