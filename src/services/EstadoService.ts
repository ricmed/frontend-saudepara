import axios, { AxiosError } from 'axios';

const server = import.meta.env.VITE_API_SERVER;
const port = import.meta.env.VITE_API_PORT;
const API_URL = `${server}:${port}/api/tipo-estado`;

interface Estado {
  idtipo_estado: number;
  codigo: string;
  descricao: string;
}

interface PaginatedResponse {
  data: Estado[];
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
  if (error.response?.data?.message?.includes('Já existe')) {
    throw new Error(error.response.data.message);
  }
  throw new Error(
    error.response?.data?.message || 
    'Ocorreu um erro inesperado. Tente novamente mais tarde.'
  );
};

export const EstadoService = {
  getAll: async (): Promise<Estado[]> => {
    try {
      const response = await axios.get<{ data: Estado[] }>(API_URL);
      return response.data.data;
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  getAllForSelect: async (): Promise<Estado[]> => {
    try {
      // Primeiro tenta o endpoint específico para select
      const response = await axios.get<{ data: Estado[] }>(`${API_URL}/select`);
      return response.data.data.sort((a, b) => a.descricao.localeCompare(b.descricao));
    } catch (error) {
      // Se falhar, tenta o endpoint normal com limit alto para pegar todos
      try {
        const response = await axios.get<{ data: Estado[] }>(API_URL, {
          params: {
            page: 1,
            limit: 999 // Número alto para pegar todos os estados
          }
        });
        return response.data.data.sort((a, b) => a.descricao.localeCompare(b.descricao));
      } catch (fallbackError) {
        return handleApiError(fallbackError as AxiosError<APIError>);
      }
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

      const response = await axios.get<{ data: Estado[], pagination: any }>(url, { params });
      
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

  getById: async (id: number): Promise<Estado> => {
    try {
      if (isNaN(id) || id <= 0) throw new Error('ID inválido');
      
      const response = await axios.get<Estado>(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  create: async (codigo: string, descricao: string): Promise<Estado> => {
    try {
      const response = await axios.post<Estado>(API_URL, { 
        codigo: codigo.trim(),
        descricao: descricao.trim() 
      });
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  update: async (id: number, codigo: string, descricao: string): Promise<void> => {
    try {
      if (isNaN(id) || id <= 0) throw new Error('ID inválido');
      
      await axios.put(`${API_URL}/${id}`, { 
        codigo: codigo.trim(),
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
    codigo: string, 
    excludeId?: number
  ): Promise<boolean> => {
    try {
      // Usando o endpoint de busca para verificar duplicatas de código
      const response = await axios.get<{ data: Estado[] }>(`${API_URL}/search`, {
        params: {
          descricao: codigo,
          limit: 1
        }
      });

      // Se não encontrou nenhum registro, retorna false
      if (response.data.data.length === 0) return false;

      // Se encontrou e não temos excludeId, então existe duplicata
      if (!excludeId) return true;

      // Se temos excludeId, verifica se o registro encontrado é diferente do atual
      return response.data.data.some(estado => 
        estado.codigo === codigo && 
        estado.idtipo_estado !== excludeId
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
      // Usando o endpoint de busca para verificar duplicatas de descrição
      const response = await axios.get<{ data: Estado[] }>(`${API_URL}/search`, {
        params: {
          descricao: descricao,
          limit: 1
        }
      });

      // Se não encontrou nenhum registro, retorna false
      if (response.data.data.length === 0) return false;

      // Se encontrou e não temos excludeId, então existe duplicata
      if (!excludeId) return true;

      // Se temos excludeId, verifica se o registro encontrado é diferente do atual
      return response.data.data.some(estado => 
        estado.descricao.toLowerCase() === descricao.toLowerCase() && 
        estado.idtipo_estado !== excludeId
      );
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  }
};