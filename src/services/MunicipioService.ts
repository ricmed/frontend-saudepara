import axios, { AxiosError } from 'axios';

const server = import.meta.env.VITE_API_SERVER;
const port = import.meta.env.VITE_API_PORT;
const API_URL = `${server}:${port}/api/tipo-municipio`;

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
      const response = await axios.get<Municipio[]>(API_URL);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
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
        params.tipo_estado_idtipo_estado = estadoId;
      }

      const response = await axios.get<PaginatedResponse>(`${API_URL}${endpoint}`, { params });
      
      return {
        data: response.data.data.map(municipio => ({
          ...municipio,
          estado_descricao: municipio.tipo_estado?.descricao
        })),
        pagination: response.data.pagination
      };
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  getByEstado: async (estadoId: number): Promise<Municipio[]> => {
    try {
      if (isNaN(estadoId) || estadoId <= 0) {
        throw new Error('ID do estado inválido');
      }
      
      const response = await axios.get<PaginatedResponse>(`${API_URL}`, {
        params: {
          tipo_estado_idtipo_estado: estadoId
        }
      });
      return response.data.data;
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  getById: async (id: number): Promise<Municipio> => {
    try {
      if (isNaN(id) || id <= 0) {
        throw new Error('ID inválido');
      }
      
      const response = await axios.get<Municipio>(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  create: async (
    codigo: string, 
    descricao: string,
    estadoId: number
  ): Promise<Municipio> => {
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
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  update: async (
    id: number,
    codigo: string,
    descricao: string,
    estadoId: number
  ): Promise<void> => {
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
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      if (isNaN(id) || id <= 0) {
        throw new Error('ID inválido');
      }
      
      await axios.delete(`${API_URL}/${id}`);
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  checkExisting: async (
    codigo: string,
    estadoId: number,
    excludeId?: number
  ): Promise<boolean> => {
    try {
      const params = {
        codigo: codigo.trim(),
        tipo_estado_idtipo_estado: estadoId,
        excludeId
      };
      
      const response = await axios.get<{ exists: boolean }>(
        `${API_URL}/check-existing`,
        { params }
      );
      return response.data.exists;
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  checkExistingDescricao: async (
    descricao: string,
    estadoId: number,
    excludeId?: number
  ): Promise<boolean> => {
    try {
      const params = {
        descricao: descricao.trim(),
        tipo_estado_idtipo_estado: estadoId,
        excludeId
      };
      
      const response = await axios.get<{ exists: boolean }>(
        `${API_URL}/check-existing`,
        { params }
      );
      return response.data.exists;
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  }
};