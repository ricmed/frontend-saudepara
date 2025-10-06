import axios, { AxiosError } from 'axios';

const API_URL = getApiUrl('/tipo-habilitacao');

interface TipoHabilitacao {
  idtipo_habilitacao: number;
  codigo: string;
  descricao: string;
}

interface PaginationData {
  data: TipoHabilitacao[];
  meta: {
    total: number;
    totalPages: number;
    page: number;
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
    'Erro na operação. Tente novamente mais tarde.'
  );
};

export const HabilitacaoService = {
  getAll: async (): Promise<TipoHabilitacao[]> => {
    try {
      const response = await axios.get<{ data: TipoHabilitacao[] }>(API_URL);
      return response.data.data;
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  getAllPaginated: async (
    page: number, 
    limit: number,
    searchTerm?: string
  ): Promise<PaginationData> => {
    try {
      let url = API_URL;
      const params: Record<string, any> = {
        page,
        limit
      };

      if (searchTerm) {
        url = `${API_URL}/search`;
        params.descricao = searchTerm.trim();
      }

      const response = await axios.get<{ data: TipoHabilitacao[], pagination: any }>(url, { params });

      return {
        data: response.data.data,
        meta: {
          total: response.data.pagination.total,
          totalPages: response.data.pagination.pages,
          page: response.data.pagination.currentPage
        }
      };
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  getById: async (id: number): Promise<TipoHabilitacao> => {
    try {
      const response = await axios.get<TipoHabilitacao>(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  create: async (data: Omit<TipoHabilitacao, 'idtipo_habilitacao'>): Promise<TipoHabilitacao> => {
    try {
      // Sanitização dos dados seguindo o schema
      const payload = {
        codigo: data.codigo.trim().toUpperCase(),
        descricao: data.descricao.trim()
      };
      
      const response = await axios.post<TipoHabilitacao>(API_URL, payload);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  update: async (id: number, data: Partial<Omit<TipoHabilitacao, 'idtipo_habilitacao'>>): Promise<void> => {
    try {
      // Sanitização dos dados seguindo o schema
      const payload = {
        codigo: data.codigo?.trim().toUpperCase(),
        descricao: data.descricao?.trim()
      };
      
      await axios.put(`${API_URL}/${id}`, payload);
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await axios.delete(`${API_URL}/${id}`);
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  checkExistingCodigo: async (codigo: string, excludeId?: number): Promise<boolean> => {
    try {
      // Para códigos curtos (menos de 3 caracteres), buscar todos e filtrar localmente
      // para evitar o problema de validação mínima do endpoint de busca
      
      if (codigo.length < 3) {
        // Buscar todos os registros e filtrar localmente
        const response = await axios.get<{ data: TipoHabilitacao[] }>(`${API_URL}`, {
          params: {
            limit: 1000 // Buscar todos para filtrar localmente
          }
        });

        // Filtrar localmente por código
        const existing = response.data.data.find(hab => 
          hab.codigo?.toUpperCase() === codigo.toUpperCase()
        );

        if (!existing) return false;
        if (!excludeId) return true;
        return existing.idtipo_habilitacao !== excludeId;
      } else {
        // Para códigos com 3+ caracteres, usar o endpoint de busca normal
        const response = await axios.get<{ data: TipoHabilitacao[] }>(`${API_URL}/search`, {
          params: {
            descricao: codigo.trim().toUpperCase(),
            limit: 1
          }
        });

        // Se não encontrou nenhum registro, retorna false
        if (response.data.data.length === 0) return false;

        // Se encontrou e não temos excludeId, então existe duplicata
        if (!excludeId) return true;

        // Se temos excludeId, verifica se o registro encontrado é diferente do atual
        return response.data.data.some(hab => 
          hab.codigo === codigo.trim().toUpperCase() && 
          hab.idtipo_habilitacao !== excludeId
        );
      }
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  checkExistingDescricao: async (descricao: string, excludeId?: number): Promise<boolean> => {
    try {
      // Usando o endpoint de busca para verificar duplicatas de descrição
      const response = await axios.get<{ data: TipoHabilitacao[] }>(`${API_URL}/search`, {
        params: {
          descricao: descricao.trim(),
          limit: 1
        }
      });

      // Se não encontrou nenhum registro, retorna false
      if (response.data.data.length === 0) return false;

      // Se encontrou e não temos excludeId, então existe duplicata
      if (!excludeId) return true;

      // Se temos excludeId, verifica se o registro encontrado é diferente do atual
      return response.data.data.some(hab => 
        hab.descricao.toLowerCase() === descricao.trim().toLowerCase() && 
        hab.idtipo_habilitacao !== excludeId
      );
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  }
};