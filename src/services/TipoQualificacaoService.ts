import axios, { AxiosError } from 'axios';

const API_URL = getApiUrl('/tipo-qualificacao');

interface TipoQualificacao {
  idtipo_qualificacao: number;
  descricao: string;
  idcomponente: number;
}

interface PaginatedResponse {
  data: TipoQualificacao[];
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
  if (error.response?.data?.message === 'Já existe uma qualificação com esta descrição') {
    throw new Error(error.response.data.message);
  }
  throw new Error(
    error.response?.data?.message || 
    'Ocorreu um erro inesperado. Tente novamente mais tarde.'
  );
};

// Função para mapear a resposta da API para o formato do frontend
const mapApiResponse = (data: any): TipoQualificacao => ({
  idtipo_qualificacao: data.idtipo_qualificacao || data.id,
  descricao: data.descricao || '',
  idcomponente: data.componente_idcomponente || data.idcomponente || 0
});

export const TipoQualificacaoService = {
  getAll: async (): Promise<TipoQualificacao[]> => {
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

  getById: async (id: number): Promise<TipoQualificacao> => {
    try {
      if (isNaN(id) || id <= 0) throw new Error('ID inválido');
      
      console.log('Buscando qualificação por ID:', id);
      const response = await axios.get(`${API_URL}/${id}`);
      console.log('Resposta getById:', response.data);

      const data = response.data.data || response.data;
      return mapApiResponse(data);
    } catch (error) {
      console.error('Erro em getById:', error);
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  create: async (data: { descricao: string; idcomponente: number }): Promise<TipoQualificacao> => {
    try {
      const payload = {
        descricao: data.descricao,
        componente_idcomponente: data.idcomponente
      };
      
      console.log('Enviando dados para criação:', payload);
      const response = await axios.post(API_URL, payload);
      console.log('Resposta da criação:', response.data);
      
      const responseData = response.data.data || response.data;
      return mapApiResponse(responseData);
    } catch (error) {
      console.error('Erro na criação:', error);
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  update: async (id: number, data: { descricao: string; idcomponente: number }): Promise<void> => {
    try {
      if (isNaN(id) || id <= 0) throw new Error('ID inválido');
      
      const payload = {
        descricao: data.descricao,
        componente_idcomponente: data.idcomponente
      };

      console.log('Enviando dados para atualização:', { id, payload });
      const response = await axios.put(`${API_URL}/${id}`, payload);
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
    idcomponente: number,
    excludeId?: number
  ): Promise<boolean> => {
    try {
      console.log('Verificando existência:', { descricao, idcomponente, excludeId });
      const response = await axios.get<{ data: any[] }>(`${API_URL}/search`, {
        params: {
          descricao,
          componente_idcomponente: idcomponente,
          limit: 1
        }
      });

      console.log('Resposta da verificação:', response.data);

      const qualificacoes = response.data.data || [];
      if (qualificacoes.length === 0) return false;

      return qualificacoes.some(qualificacao => {
        const mappedQualificacao = mapApiResponse(qualificacao);
        const sameName = mappedQualificacao.descricao.toLowerCase() === descricao.toLowerCase();
        const sameComponent = mappedQualificacao.idcomponente === idcomponente;
        const differentId = !excludeId || mappedQualificacao.idtipo_qualificacao !== excludeId;
        
        return sameName && sameComponent && differentId;
      });
    } catch (error) {
      console.error('Erro na verificação:', error);
      return handleApiError(error as AxiosError<APIError>);
    }
  }
};