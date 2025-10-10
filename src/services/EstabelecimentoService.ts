import axios, { AxiosError } from 'axios';

const server = import.meta.env.VITE_API_SERVER;
const port = import.meta.env.VITE_API_PORT;
const API_URL = `${server}:${port}/api/tipo-estabelecimento`;

interface TipoEstabelecimento {
  idtipo_estabelecimento: number;
  descricao: string;
}

interface PaginatedResponse {
  data: TipoEstabelecimento[];
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
  if (error.response?.data?.message === 'Já existe um estabelecimento com esta descrição') {
    throw new Error(error.response.data.message);
  }
  throw new Error(
    error.response?.data?.message || 
    'Ocorreu um erro inesperado. Tente novamente mais tarde.'
  );
};

// Função para mapear a resposta da API para o formato do frontend
const mapApiResponse = (data: any): TipoEstabelecimento => ({
  idtipo_estabelecimento: data.idtipo_estabelecimento || data.id,
  descricao: data.descricao || ''
});

export const EstabelecimentoService = {
  // Busca todos os tipos de estabelecimento para usar em select/dropdown
  getAllForSelect: async (): Promise<TipoEstabelecimento[]> => {
    try {
      console.log('🔍 Buscando tipos de estabelecimento para select...');
      const response = await axios.get<TipoEstabelecimento[]>(`${API_URL}/select`);
      console.log('✅ Tipos de estabelecimento recebidos:', response.data);
      return response.data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar tipos de estabelecimento:', error);
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  getAll: async (): Promise<TipoEstabelecimento[]> => {
    try {
      const response = await axios.get<PaginatedResponse>(API_URL);
      return (response.data.data || []).map(mapApiResponse);
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
      if (searchTerm && searchTerm.length >= 3) {
        response = await axios.get<{ data: any[], pagination: any }>(`${API_URL}/search`, {
          params: {
            descricao: searchTerm,
            page,
            limit: itemsPerPage
          }
        });
        
        return {
          data: response.data.data.map(mapApiResponse),
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
        
        return {
          data: response.data.data.map(mapApiResponse),
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

  getById: async (id: number): Promise<TipoEstabelecimento> => {
    try {
      if (isNaN(id) || id <= 0) throw new Error('ID inválido');
      
      console.log('Buscando estabelecimento por ID:', id);
      const response = await axios.get(`${API_URL}/${id}`);
      console.log('Resposta getById:', response.data);

      const data = response.data.data || response.data;
      return mapApiResponse(data);
    } catch (error) {
      console.error('Erro em getById:', error);
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  create: async (data: { descricao: string }): Promise<TipoEstabelecimento> => {
    try {
      console.log('Enviando dados para criação:', data);
      const response = await axios.post(API_URL, { 
        descricao: data.descricao.trim() 
      });
      console.log('Resposta da criação:', response.data);
      
      const responseData = response.data.data || response.data;
      return mapApiResponse(responseData);
    } catch (error) {
      console.error('Erro na criação:', error);
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  update: async (id: number, data: { descricao: string }): Promise<void> => {
    try {
      if (isNaN(id) || id <= 0) throw new Error('ID inválido');
      
      console.log('Enviando dados para atualização:', { id, data });
      const response = await axios.put(`${API_URL}/${id}`, { 
        descricao: data.descricao.trim() 
      });
      console.log('Resposta da atualização:', response.data);
    } catch (error) {
      console.error('Erro na atualização:', error);
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
      console.log('Verificando existência:', { descricao, excludeId });
      const response = await axios.get<{ data: any[] }>(`${API_URL}/search`, {
        params: {
          descricao,
          limit: 1
        }
      });

      console.log('Resposta da verificação:', response.data);

      const estabelecimentos = response.data.data || [];
      if (estabelecimentos.length === 0) return false;

      return estabelecimentos.some(estabelecimento => {
        const mappedEstabelecimento = mapApiResponse(estabelecimento);
        const sameName = mappedEstabelecimento.descricao.toLowerCase() === descricao.toLowerCase();
        const differentId = !excludeId || mappedEstabelecimento.idtipo_estabelecimento !== excludeId;
        
        return sameName && differentId;
      });
    } catch (error) {
      console.error('Erro na verificação:', error);
      return handleApiError(error as AxiosError<APIError>);
    }
  }
};