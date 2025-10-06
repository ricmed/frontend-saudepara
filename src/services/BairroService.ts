import axios, { AxiosError } from 'axios';
import { getApiUrl } from '../config/api';

const API_URL = getApiUrl('/tipo-bairro');

interface TipoBairro {
  idtipo_bairro: number;
  descricao: string;
}

interface PaginatedResponse {
  data: TipoBairro[];
  pagination: {
    total: number;
    pages: number;
    currentPage: number;
    perPage: number;
  };
}

interface APIError {
  status: string;
  message: string;
}

const handleApiError = (error: AxiosError<APIError>) => {
  console.error('API Error:', error);
  console.error('Detalhes do erro:', error.response?.data);
  
  // Tenta extrair a mensagem de erro da resposta
  const errorMessage = 
    error.response?.data?.message || 
    (typeof error.response?.data === 'string' ? error.response.data : null) ||
    'Ocorreu um erro inesperado. Tente novamente mais tarde.';
  
  throw new Error(errorMessage);
};

export const TipoBairroService = {
  getAll: async (): Promise<TipoBairro[]> => {
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
      let url = API_URL;
      const params: Record<string, any> = {
        page,
        limit: itemsPerPage
      };

      if (searchTerm && searchTerm.trim().length >= 3) {
        url = `${API_URL}/search`;
        params.descricao = searchTerm;
      }

      const response = await axios.get<PaginatedResponse>(url, { params });
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  getById: async (id: number): Promise<TipoBairro> => {
    try {
      if (isNaN(id) || id <= 0) throw new Error('ID inválido');
      
      const response = await axios.get<TipoBairro>(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  getAllForSelect: async (): Promise<TipoBairro[]> => {
    try {
      const response = await axios.get<TipoBairro[]>(`${API_URL}/select`);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  create: async (descricao: string): Promise<TipoBairro> => {
    try {
      const response = await axios.post<TipoBairro>(API_URL, { 
        descricao: descricao.trim() 
      });
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError<APIError>);
    }
  },

  update: async (id: number, descricao: string): Promise<TipoBairro> => {
    try {
      if (isNaN(id) || id <= 0) throw new Error('ID inválido');
      
      const response = await axios.put<TipoBairro>(`${API_URL}/${id}`, { 
        descricao: descricao.trim() 
      });
      return response.data;
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
      // Verificação mínima de 3 caracteres conforme regra do backend
      if (descricao.trim().length < 3) {
        return false;
      }
      
      // Usando o endpoint de busca para verificar duplicatas
      const response = await axios.get<PaginatedResponse>(`${API_URL}/search`, {
        params: {
          descricao: descricao.trim(),
          limit: 100 // Buscar vários para poder filtrar melhor
        }
      });

      // Se não encontrou nenhum tipo de bairro, retorna false
      if (response.data.data.length === 0) return false;

      // Se encontrou e não temos excludeId, então existe duplicata
      if (!excludeId) return true;

      // Se temos excludeId, verifica se o tipo de bairro encontrado é diferente do atual
      return response.data.data.some(tipo => 
        tipo.descricao.toLowerCase() === descricao.toLowerCase() && 
        tipo.idtipo_bairro !== excludeId
      );
    } catch (error) {
      console.error('Erro ao verificar duplicidade:', error);
      return false; // Em caso de erro, permitir continuar
    }
  }
};