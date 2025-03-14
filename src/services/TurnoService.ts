import axios, { AxiosError } from 'axios';

const server = import.meta.env.VITE_API_SERVER;
const port = import.meta.env.VITE_API_PORT;
const API_URL = `${server}:${port}/api/tipo-turno`;

interface Turno {
  id_turno: number;
  descricao: string;
}

interface PaginatedResponse {
  data: Turno[];
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
  if (error.response?.data?.message === 'Já existe um turno com esta descrição') {
    throw new Error(error.response.data.message);
  }
  throw new Error(
    error.response?.data?.message || 
    'Ocorreu um erro inesperado. Tente novamente mais tarde.'
  );
};

export const TurnoService = {
  getAll: async (): Promise<Turno[]> => {
    try {
      const response = await axios.get<PaginatedResponse>(API_URL);
      // Mapeia id_turno corretamente
      return response.data.data.map(item => ({
        id_turno: item.id_turno,
        descricao: item.descricao
      }));
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
        response = await axios.get<{ data: any[], pagination: any }>(`${API_URL}/search`, {
          params: {
            descricao: searchTerm,
            page,
            limit: itemsPerPage
          }
        });
        
        // Mapeia os dados para garantir a estrutura correta
        const mappedData = response.data.data.map(item => ({
          id_turno: item.id_turno,
          descricao: item.descricao
        }));

        return {
          data: mappedData,
          meta: {
            total: response.data.pagination.total,
            totalPages: response.data.pagination.pages,
            page: response.data.pagination.currentPage,
            limit: response.data.pagination.perPage
          }
        };
      } else {
        response = await axios.get<{ data: any[], pagination: any }>(API_URL, {
          params: {
            page,
            limit: itemsPerPage
          }
        });
        
        // Mapeia os dados para garantir a estrutura correta
        const mappedData = response.data.data.map(item => ({
          id_turno: item.id_turno || item['idtipo_turno'],
          descricao: item.descricao
        }));

        return {
          data: mappedData,
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

  getById: async (id: number): Promise<Turno> => {
    try {
      if (isNaN(id) || id <= 0) throw new Error('ID inválido');
      
      const response = await axios.get(`${API_URL}/${id}`);
      // Mapeia a resposta para garantir a estrutura correta
      return {
        id_turno: response.data.id_turno,
        descricao: response.data.descricao
      };
    } catch (error) {
      console.error('Erro em getById:', error);
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  create: async (descricao: string): Promise<Turno> => {
    try {
      const response = await axios.post<any>(API_URL, { 
        descricao: descricao.trim()
      });
      // Mapeia a resposta para garantir a estrutura correta
      return {
        id_turno: response.data.id_turno || response.data['idtipo_turno'],
        descricao: response.data.descricao
      };
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
      const response = await axios.get<{ data: any[] }>(`${API_URL}/search`, {
        params: {
          descricao: descricao,
          limit: 1
        }
      });

      if (response.data.data.length === 0) return false;

      if (!excludeId) return true;

      return response.data.data.some(turno => {
        const turnoId = turno.id_turno;
        return turno.descricao.toLowerCase() === descricao.toLowerCase() && 
          turnoId !== excludeId;
      });
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  }
};